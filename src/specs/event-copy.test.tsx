import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

/** A previous event with a menu: two categories, three items, two contributors (one confirmed, one received). */
async function seedPreviousEvent() {
  const seeded = await seedHousehold()
  const { householdId } = seeded
  const eventId = await seedEvent(householdId, {
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
  const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
  const anula = await seedContributor(householdId, 'අනුලා විජේසේකර')
  await seedAssignment(rice, sunil, { quantity: 3, status: 'confirmed' })
  await seedAssignment(bananas, anula, { status: 'received' })
  return { ...seeded, eventId }
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
    expect(await screen.findByRole('radio', { name: 'මාලබේ අසපුව' })).toBeChecked()
    expect(screen.getByLabelText('ස්වාමීන් වහන්සේලා')).toHaveValue('12')
    expect(screen.getByLabelText('ගිහි පිරිස')).toHaveValue('20')

    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
    expect(await screen.findByText('දිනය ඇතුළත් කරන්න.')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))

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

  it('leaves the source event as it was', async () => {
    const { organizer, eventId } = await seedPreviousEvent()
    const { user, unmount } = await renderApp(`/events/new?from=${eventId}`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
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
    const { householdId, organizer, eventId } = await seedPreviousEvent()
    const rice = await seedItem(eventId, 'බත්', { name: 'කහ බත්' })
    await seedAssignment(rice, await seedContributor(householdId, 'කමලා රත්නායක', { archived: true }))
    const { user } = await renderApp(`/events/new?from=${eventId}`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))

    const copied = await screen.findByRole('region', { name: 'බත්' })
    expect(itemRow(copied, 'කහ බත්')).toHaveTextContent('දායකයෙකු තවම නැත')
  })

  it("can't copy another household's event", async () => {
    const { eventId } = await seedPreviousEvent()
    const other = await seedHousehold('සිල්වා පවුල')
    await renderApp(`/events/new?from=${eventId}`, { signedInAs: other.organizer })

    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByDisplayValue('බොතේජු පවුල')).not.toBeInTheDocument()
  })
})
