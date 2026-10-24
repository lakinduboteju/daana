import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedAssignment, seedContributor, seedDocument, seedEvent, seedOrganizer, seedItem, seedTransaction } from '../test/seed'

/** A previous event with a menu: two categories, three items, two contributors (one confirmed, one received). */
async function seedPreviousEvent() {
  const organizer = await seedOrganizer()
  const eventId = await seedEvent(organizer, {
    date: colomboDate(2),
    meal: 'lunch',
    host: 'බොතේජු පවුල',
    monastery: 'මාලබේ අසපුව',
    monkCount: 12,
    laypersonCount: 20,
    categories: ['බත්', 'පලතුරු'],
  })
  const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
  const bananas = await seedItem(eventId, 'පලතුරු', { name: 'කෙසෙල්', requiredQuantity: 40 })
  await seedItem(eventId, 'පලතුරු', { name: 'අන්නාසි' })
  const sunil = await seedContributor(organizer, 'සුනිල් ජයසිංහ')
  const anula = await seedContributor(organizer, 'අනුලා විජේසේකර')
  await seedAssignment(rice, sunil, { quantity: 3, status: 'confirmed' })
  await seedAssignment(bananas, anula, { status: 'received' })
  return { organizer, eventId }
}

function itemRow(container: HTMLElement, name: string): HTMLElement {
  const row = within(container).getByText(name, { selector: 'li a span' }).closest('li')
  if (!row) throw new Error(`no row for ${name}`)
  return row
}

describe('copying a previous event', () => {
  it("copies the menu and contributors from a card's Copy action, all pending, on a date the organizer picks", async () => {
    const { organizer, eventId } = await seedPreviousEvent()
    const { user } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'බොතේජු පවුල: තවත් විකල්ප' }))
    await user.click(screen.getByRole('link', { name: 'පිටපත් කරන්න' }))
    expect(currentPath()).toBe(`/events/new?from=${eventId}`)

    expect(await screen.findByDisplayValue('බොතේජු පවුල')).toBeInTheDocument()
    expect(screen.getByLabelText(/දිනය/)).toHaveValue('')
    expect(await screen.findByLabelText(/^අසපුව/)).toHaveValue('මාලබේ අසපුව')
    await user.click(screen.getByText('අමතර විස්තර (optional)'))
    expect(screen.getByLabelText('ස්වාමීන් වහන්සේලා')).toHaveValue('12')
    expect(screen.getByLabelText('ගිහි පිරිස')).toHaveValue('20')

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('දිනය ඇතුළත් කරන්න.')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: 'නොවැම්බර් 08 · දහවල් දානය' })).toBeInTheDocument()
    expect(currentPath()).not.toBe(`/events/${eventId}`)
    const rice = await screen.findByRole('region', { name: 'බත්' })
    expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('සුනිල් ජයසිංහ')
    expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('කි.ග්‍රෑ. 3')
    expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('තහවුරු කර නැත')
    const fruit = screen.getByRole('region', { name: 'පලතුරු' })
    expect(itemRow(fruit, 'කෙසෙල්')).toHaveTextContent('අනුලා විජේසේකර')
    expect(itemRow(fruit, 'කෙසෙල්')).toHaveTextContent('තහවුරු කර නැත')
    expect(itemRow(fruit, 'අන්නාසි')).toHaveTextContent('දායකයෙකු තවම නැත')
  })

  it("starts a new event from a previous one picked on the form's copy link", async () => {
    const { organizer, eventId } = await seedPreviousEvent()
    await seedEvent(organizer, { date: colomboDate(-30), host: 'සිල්වා පවුල', monastery: 'පොල්ගහවෙල අසපුව' })
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: /පෙර දානයකින් පිටපත් කරන්න/ }))
    const picker = screen.getByRole('dialog', { name: 'පෙර දානයකින් පිටපත් කරන්න' })
    const choices = await within(picker).findAllByRole('link')
    expect(choices.map((c) => c.textContent)).toEqual([
      expect.stringContaining('බොතේජු පවුල'),
      expect.stringContaining('සිල්වා පවුල'),
    ])
    await user.click(choices[0])

    expect(currentPath()).toBe(`/events/new?from=${eventId}`)
    expect(await screen.findByDisplayValue('බොතේජු පවුල')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/දිනය/)).toHaveValue('')
  })

  it('leaves the source event as it was', async () => {
    const { organizer, eventId } = await seedPreviousEvent()
    const { user, unmount } = await renderApp(`/events/new?from=${eventId}`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'නොවැම්බර් 08 · දහවල් දානය' })).toBeInTheDocument()
    unmount()

    await renderApp(`/events/${eventId}`, { signedInAs: organizer })
    const rice = await screen.findByRole('region', { name: 'බත්' })
    expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('සුනිල් ජයසිංහ')
    expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('තහවුරුයි')
    const fruit = screen.getByRole('region', { name: 'පලතුරු' })
    expect(itemRow(fruit, 'කෙසෙල්')).toHaveTextContent('ලැබී ඇත')
    expect(within(fruit).getAllByRole('listitem')).toHaveLength(2)
  })

  it('leaves out contributors who have since been archived', async () => {
    const { organizer, eventId } = await seedPreviousEvent()
    const rice = await seedItem(eventId, 'බත්', { name: 'කහ බත්' })
    await seedAssignment(rice, await seedContributor(organizer, 'කමලා රත්නායක', { archived: true }))
    const { user } = await renderApp(`/events/new?from=${eventId}`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const copied = await screen.findByRole('region', { name: 'බත්' })
    expect(itemRow(copied, 'කහ බත්')).toHaveTextContent('දායකයෙකු තවම නැත')
  })

  it('leaves out money and documents: the copy has no givens, expenses or files', async () => {
    const { organizer, eventId } = await seedPreviousEvent()
    const nimal = await seedContributor(organizer, 'නිමල් සිල්වා')
    await seedTransaction(eventId, { kind: 'given', amount: 2500, contributorId: nimal })
    await seedTransaction(eventId, { kind: 'expense', amount: 3150 })
    await seedDocument(eventId, { name: 'සහල් බිල්පත' })
    const { user } = await renderApp(`/events/new?from=${eventId}`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'නොවැම්බර් 08 · දහවල් දානය' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'මුදල් හා ලේඛන' }))
    expect(await screen.findByText('තවම මුදල් වාර්තා නැත.')).toBeInTheDocument()
    const totals = screen.getByRole('region', { name: 'එකතුව' })
    expect(totals).toHaveTextContent('දායකයන්ට ලබා දුන් මුදල්Rs 0')
    expect(totals).toHaveTextContent('සත්‍ය වියදම්Rs 0')
    expect(await screen.findByText('තවම ලේඛන නැත.')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'ලේඛන (0)' })).toBeInTheDocument()
  })

  it("can't copy another organizer's event", async () => {
    const { eventId } = await seedPreviousEvent()
    const other = await seedOrganizer()
    await renderApp(`/events/new?from=${eventId}`, { signedInAs: other })

    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByDisplayValue('බොතේජු පවුල')).not.toBeInTheDocument()
  })
})
