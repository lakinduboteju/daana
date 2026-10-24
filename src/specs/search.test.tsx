import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedAssignment, seedContributor, seedEvent, seedOrganizer, seedItem } from '../test/seed'

describe('global search', () => {
  it('finds a Sinhala item across events, grouped by event, each result linking to its item', async () => {
    const organizer = await seedOrganizer()
    const first = await seedEvent(organizer, { date: '2099-11-08', host: 'බොතේජු පවුල', monastery: 'මාලබේ අසපුව', categories: ['බත්'] })
    const second = await seedEvent(organizer, { date: '2099-11-21', meal: 'breakfast', monastery: 'පොල්ගහවෙල අසපුව', categories: ['බත්'] })
    const kiribath = await seedItem(first, 'බත්', { name: 'කිරිබත්', requiredQuantity: 4, unit: 'kg' })
    await seedItem(first, 'බත්', { name: 'සුදු බත්' })
    await seedItem(second, 'බත්', { name: 'කිරිබත් සහ ලුණුමිරිස්' })
    const sunil = await seedContributor(organizer, 'සුනිල් ජයසිංහ')
    await seedAssignment(kiribath, sunil, { quantity: 4, status: 'confirmed' })
    const { user } = await renderApp('/search', { signedInAs: organizer })

    await user.type(await screen.findByRole('searchbox', { name: 'සියලු දාන තුළ සොයන්න' }), 'කිරිබත්')
    expect(currentPath()).toBe(`/search?q=${encodeURIComponent('කිරිබත්')}`)

    const malabe = await screen.findByRole('region', { name: /නොවැම්බර් 08 · දහවල් දානය.*බොතේජු පවුල · මාලබේ අසපුව/ })
    const polgahawela = screen.getByRole('region', { name: /නොවැම්බර් 21 · හීල් දානය.*පොල්ගහවෙල අසපුව/ })
    expect(screen.getByText('ප්‍රතිඵල 2')).toBeInTheDocument()
    expect(screen.queryByText('සුදු බත්')).not.toBeInTheDocument()

    const result = within(malabe).getByRole('link', { name: /කිරිබත්/ })
    expect(result).toHaveTextContent('සුනිල් ජයසිංහ · කි.ග්‍රෑ. 4')
    expect(result).toHaveTextContent('✓තහවුරුයි')
    expect(within(polgahawela).getByRole('link', { name: /කිරිබත් සහ ලුණුමිරිස්/ })).toHaveTextContent('○පවරා නැත')

    await user.click(result)
    expect(currentPath()).toBe(`/events/${first}/items/${kiribath}`)
    expect(await screen.findByRole('heading', { level: 1, name: 'කිරිබත්' })).toBeInTheDocument()
  })

  it.each([
    ['item', 'FRIED', ['Fried rice']],
    ['contributor', 'nimal', ['Curd']],
    ['monastery', 'malabe ARAMAYA', ['Fried rice']],
    ['host', 'PERERA FAMILY', ['Curd', 'Juice']],
  ])('matches a %s ignoring case', async (_, q, expected) => {
    const organizer = await seedOrganizer()
    const temple = await seedEvent(organizer, { date: '2099-11-08', monastery: 'Malabe Aramaya', categories: ['බත්'] })
    const family = await seedEvent(organizer, { date: '2099-11-09', host: 'Perera family', categories: ['බත්'] })
    await seedItem(temple, 'බත්', { name: 'Fried rice' })
    const curd = await seedItem(family, 'බත්', { name: 'Curd' })
    await seedItem(family, 'බත්', { name: 'Juice' })
    await seedAssignment(curd, await seedContributor(organizer, 'Nimal Silva'))

    await renderApp(`/search?q=${encodeURIComponent(q)}`, { signedInAs: organizer })
    expect(await screen.findByText(`ප්‍රතිඵල ${expected.length}`)).toBeInTheDocument()
    for (const name of expected) expect(screen.getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument()
  })

  it("never shows another organizer's events, items or contributors", async () => {
    const mine = await seedOrganizer()
    const theirs = await seedOrganizer()
    const myEvent = await seedEvent(mine, { date: '2099-11-08', categories: ['බත්'] })
    await seedItem(myEvent, 'බත්', { name: 'කිරිබත්' })
    const theirEvent = await seedEvent(theirs, { date: '2099-11-08', host: 'කිරිබත් පවුල', categories: ['බත්'] })
    const theirItem = await seedItem(theirEvent, 'බත්', { name: 'කිරිබත් කෑලි' })
    await seedAssignment(theirItem, await seedContributor(theirs, 'කිරිබත් අම්මා'))

    await renderApp(`/search?q=${encodeURIComponent('කිරිබත්')}`, { signedInAs: mine })
    expect(await screen.findByText('ප්‍රතිඵල 1')).toBeInTheDocument()
    expect(screen.queryByText(/කිරිබත් කෑලි|කිරිබත් පවුල|කිරිබත් අම්මා/)).not.toBeInTheDocument()
  })

  it('"පවරා නැති" with upcoming dates lists every unassigned item in upcoming events', async () => {
    const organizer = await seedOrganizer()
    const past = await seedEvent(organizer, { date: colomboDate(-3), categories: ['බත්'] })
    const today = await seedEvent(organizer, { date: colomboDate(0), monastery: 'මාලබේ අසපුව', categories: ['බත්'] })
    const later = await seedEvent(organizer, { date: colomboDate(12), monastery: 'පොල්ගහවෙල අසපුව', categories: ['බත්'] })
    await seedItem(past, 'බත්', { name: 'පරණ බත්' })
    await seedItem(today, 'බත්', { name: 'බෝංචි' })
    const pending = await seedItem(today, 'බත්', { name: 'අල තෙම්පරාදුව' })
    await seedItem(later, 'බත්', { name: 'අන්නාසි' })
    const confirmed = await seedItem(later, 'බත්', { name: 'වතුර බෝතල්' })
    const sunil = await seedContributor(organizer, 'සුනිල් ජයසිංහ')
    await seedAssignment(pending, sunil)
    await seedAssignment(confirmed, sunil, { status: 'confirmed' })
    const { user } = await renderApp('/search', { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'පවරා නැති' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'දින පරාසය' }), 'ඉදිරි දාන')
    expect(currentPath()).toBe(`/search?status=unassigned&from=${colomboDate(0)}`)
    expect(screen.getByRole('button', { name: 'පවරා නැති' })).toHaveAttribute('aria-pressed', 'true')

    await waitFor(() => expect(screen.getByText('ප්‍රතිඵල 2')).toBeInTheDocument())
    expect(screen.getByRole('region', { name: /මාලබේ අසපුව/ })).toHaveTextContent('බෝංචිදායකයෙකු තවම නැත○පවරා නැත')
    expect(screen.getByRole('region', { name: /පොල්ගහවෙල අසපුව/ })).toHaveTextContent('අන්නාසිදායකයෙකු තවම නැත○පවරා නැත')
    expect(screen.queryByText(/පරණ බත්|අල තෙම්පරාදුව|වතුර බෝතල්/)).not.toBeInTheDocument()
  })

  it('filters by contributor and monastery, offers a preset for the latest contributor, and Clear removes everything', async () => {
    const organizer = await seedOrganizer()
    const malabe = await seedEvent(organizer, { date: '2099-11-08', monastery: 'මාලබේ අසපුව', categories: ['බත්'] })
    const polgahawela = await seedEvent(organizer, { date: '2099-11-21', monastery: 'පොල්ගහවෙල අසපුව', categories: ['බත්'] })
    const rice = await seedItem(malabe, 'බත්', { name: 'සුදු බත්' })
    const curry = await seedItem(malabe, 'බත්', { name: 'පරිප්පු' })
    const kiribath = await seedItem(polgahawela, 'බත්', { name: 'කිරිබත්' })
    const sunil = await seedContributor(organizer, 'සුනිල් ජයසිංහ')
    const anula = await seedContributor(organizer, 'අනුලා විජේසේකර')
    await seedAssignment(curry, anula, { status: 'confirmed' })
    await seedAssignment(rice, sunil)
    await seedAssignment(kiribath, sunil, { status: 'confirmed' })
    const { user } = await renderApp('/search', { signedInAs: organizer })

    // Sunil was assigned most recently.
    await user.click(await screen.findByRole('button', { name: 'සුනිල්ගේ දේවල්' }))
    expect(currentPath()).toBe(`/search?contributor=${sunil}`)
    expect(await screen.findByText('ප්‍රතිඵල 2')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'දායකයා' })).toHaveDisplayValue('සුනිල් ජයසිංහ')

    await user.selectOptions(screen.getByRole('combobox', { name: 'අසපුව' }), 'පොල්ගහවෙල අසපුව')
    await waitFor(() => expect(screen.getByText('ප්‍රතිඵල 1')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /^කිරිබත්/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'තහවුරු නොවූ' }))
    await waitFor(() => expect(screen.getByText('ප්‍රතිඵල 0')).toBeInTheDocument())
    expect(screen.getByText('Not Found')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(currentPath()).toBe('/search')
    expect(screen.queryByText(/ප්‍රතිඵල/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'සුනිල්ගේ දේවල්' })).toHaveAttribute('aria-pressed', 'false')
  })
})
