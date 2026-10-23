import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

describe('global search', () => {
  it('finds a Sinhala item across events, grouped by event, each result linking to its item', async () => {
    const { householdId, organizer } = await seedHousehold()
    const first = await seedEvent(householdId, { date: '2099-11-08', host: 'බොතේජු පවුල', monastery: 'මාලබේ අසපුව', categories: ['බත්'] })
    const second = await seedEvent(householdId, { date: '2099-11-21', meal: 'breakfast', monastery: 'පොල්ගහවෙල අසපුව', categories: ['බත්'] })
    const kiribath = await seedItem(first, 'බත්', { name: 'කිරිබත්', requiredQuantity: 4, unit: 'kg' })
    await seedItem(first, 'බත්', { name: 'සුදු බත්' })
    await seedItem(second, 'බත්', { name: 'කිරිබත් සහ ලුණුමිරිස්' })
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
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
    const { householdId, organizer } = await seedHousehold()
    const temple = await seedEvent(householdId, { date: '2099-11-08', monastery: 'Malabe Aramaya', categories: ['බත්'] })
    const family = await seedEvent(householdId, { date: '2099-11-09', host: 'Perera family', categories: ['බත්'] })
    await seedItem(temple, 'බත්', { name: 'Fried rice' })
    const curd = await seedItem(family, 'බත්', { name: 'Curd' })
    await seedItem(family, 'බත්', { name: 'Juice' })
    await seedAssignment(curd, await seedContributor(householdId, 'Nimal Silva'))

    await renderApp(`/search?q=${encodeURIComponent(q)}`, { signedInAs: organizer })
    expect(await screen.findByText(`ප්‍රතිඵල ${expected.length}`)).toBeInTheDocument()
    for (const name of expected) expect(screen.getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument()
  })

  it("never shows another household's events, items or contributors", async () => {
    const mine = await seedHousehold()
    const theirs = await seedHousehold('සිල්වා පවුල')
    const myEvent = await seedEvent(mine.householdId, { date: '2099-11-08', categories: ['බත්'] })
    await seedItem(myEvent, 'බත්', { name: 'කිරිබත්' })
    const theirEvent = await seedEvent(theirs.householdId, { date: '2099-11-08', host: 'කිරිබත් පවුල', categories: ['බත්'] })
    const theirItem = await seedItem(theirEvent, 'බත්', { name: 'කිරිබත් කෑලි' })
    await seedAssignment(theirItem, await seedContributor(theirs.householdId, 'කිරිබත් අම්මා'))

    await renderApp(`/search?q=${encodeURIComponent('කිරිබත්')}`, { signedInAs: mine.organizer })
    expect(await screen.findByText('ප්‍රතිඵල 1')).toBeInTheDocument()
    expect(screen.queryByText(/කිරිබත් කෑලි|කිරිබත් පවුල|කිරිබත් අම්මා/)).not.toBeInTheDocument()
  })
})
