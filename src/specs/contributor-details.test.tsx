import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { admin, colomboDate, seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

describe('contributor details', () => {
  it("lists a contributor's assignments across events, grouped by event, past events included", async () => {
    const { householdId, organizer } = await seedHousehold()
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ', { phone: '077 123 4567' })
    await admin.from('contributor').update({ notes: 'සෙනසුරාදා උදේට කතා කරන්න.' }).eq('id', sunil)
    const upcoming = await seedEvent(householdId, {
      date: '2099-11-08',
      host: 'බොතේජු පවුල',
      monastery: 'මාලබේ අසපුව',
      categories: ['බත්', 'පාන'],
    })
    const rice = await seedItem(upcoming, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
    const water = await seedItem(upcoming, 'පාන', { name: 'වතුර බෝතල්', requiredQuantity: 40 })
    await seedAssignment(rice, sunil, { quantity: 1 })
    await seedAssignment(water, sunil, { quantity: 40, status: 'confirmed' })
    const past = await seedEvent(householdId, {
      date: colomboDate(-30),
      host: 'ජයසිංහ පවුල',
      monastery: 'පොල්ගහවෙල අසපුව',
      categories: ['බත්'],
    })
    const kiribath = await seedItem(past, 'බත්', { name: 'කිරිබත්', requiredQuantity: 3, unit: 'kg' })
    await seedAssignment(kiribath, sunil, { quantity: 3, status: 'received' })
    // Someone else's assignment on the same event doesn't show.
    const kamala = await seedContributor(householdId, 'කමලා රත්නායක')
    const curd = await seedItem(upcoming, 'බත්', { name: 'කිරි' })
    await seedAssignment(curd, kamala)

    await renderApp(`/contributors/${sunil}`, { signedInAs: organizer })

    expect(await screen.findByRole('heading', { level: 1, name: 'සුනිල් ජයසිංහ' })).toBeInTheDocument()
    expect(screen.getByText('සෙනසුරාදා උදේට කතා කරන්න.', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'සුනිල් ජයසිංහ අමතන්න' })).toHaveAttribute('href', 'tel:0771234567')
    expect(screen.getByRole('link', { name: 'සුනිල් ජයසිංහට WhatsApp පණිවිඩයක්' })).toHaveAttribute(
      'href',
      'https://wa.me/94771234567',
    )

    const upcomingGroup = await screen.findByRole('region', { name: /නොවැම්බර් 08 · දහවල් දානය/ })
    expect(upcomingGroup).toHaveTextContent('බොතේජු පවුල · මාලබේ අසපුව')
    expect(assignmentRow(upcomingGroup, 'සුදු බත්')).toHaveTextContent('කි.ග්‍රෑ. 1')
    expect(assignmentRow(upcomingGroup, 'සුදු බත්')).toHaveTextContent('◔තහවුරු කර නැත')
    expect(assignmentRow(upcomingGroup, 'වතුර බෝතල්')).toHaveTextContent('40')
    expect(assignmentRow(upcomingGroup, 'වතුර බෝතල්')).toHaveTextContent('✓තහවුරුයි')
    expect(within(upcomingGroup).queryByText('කිරි')).not.toBeInTheDocument()

    const pastGroup = screen.getByRole('region', { name: /පසුගිය/ })
    expect(pastGroup).toHaveTextContent('ජයසිංහ පවුල · පොල්ගහවෙල අසපුව')
    expect(assignmentRow(pastGroup, 'කිරිබත්')).toHaveTextContent('කි.ග්‍රෑ. 3')
    expect(assignmentRow(pastGroup, 'කිරිබත්')).toHaveTextContent('✓✓ලැබී ඇත')

    // Upcoming events come before past ones.
    const groups = screen.getAllByRole('region').filter((r) => r === upcomingGroup || r === pastGroup)
    expect(groups).toEqual([upcomingGroup, pastGroup])
    expect(currentPath()).toBe(`/contributors/${sunil}`)
  })

  it('one tap on "✓ එකඟ වුණා" confirms a pending assignment, and the item status follows in the menu', async () => {
    const { householdId, organizer } = await seedHousehold()
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 1, unit: 'kg' })
    const kiribath = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    await seedAssignment(rice, sunil, { quantity: 1 })
    await seedAssignment(kiribath, sunil, { status: 'confirmed' })
    const { user } = await renderApp(`/contributors/${sunil}`, { signedInAs: organizer })

    const group = await screen.findByRole('region', { name: /නොවැම්බර් 08/ })
    // Only pending assignments offer the one-tap confirm.
    expect(within(assignmentRow(group, 'කිරිබත්')).queryByRole('button', { name: /එකඟ වුණා/ })).not.toBeInTheDocument()
    await user.click(within(assignmentRow(group, 'සුදු බත්')).getByRole('button', { name: 'සුදු බත් — ✓ එකඟ වුණා' }))

    expect(assignmentRow(group, 'සුදු බත්')).toHaveTextContent('✓තහවුරුයි')
    expect(await screen.findByRole('status')).toHaveTextContent('සුදු බත් — තහවුරුයි ලෙස සුරැකිණි')
    expect(within(assignmentRow(group, 'සුදු බත්')).queryByRole('button', { name: /එකඟ වුණා/ })).not.toBeInTheDocument()

    await user.click(within(group).getByRole('link', { name: /නොවැම්බර් 08/ }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    const riceCategory = await screen.findByRole('region', { name: 'බත්' })
    await waitFor(() => expect(menuRow(riceCategory, 'සුදු බත්')).toHaveTextContent('✓තහවුරුයි'))
  })

  it('shows how many events a contributor helped with and how many items they brought', async () => {
    const { householdId, organizer } = await seedHousehold()
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    const lastMonth = await seedEvent(householdId, { date: colomboDate(-30), categories: ['බත්'] })
    await seedAssignment(await seedItem(lastMonth, 'බත්', { name: 'කිරිබත්' }), sunil, { status: 'received' })
    await seedAssignment(await seedItem(lastMonth, 'බත්', { name: 'කැවුම්' }), sunil, { status: 'received' })
    const nextWeek = await seedEvent(householdId, { date: colomboDate(7), categories: ['බත්'] })
    await seedAssignment(await seedItem(nextWeek, 'බත්', { name: 'සුදු බත්' }), sunil, { status: 'confirmed' })
    // Only asked so far, and a cancelled event, don't count as helping.
    const later = await seedEvent(householdId, { date: colomboDate(14), categories: ['බත්'] })
    await seedAssignment(await seedItem(later, 'බත්', { name: 'පරිප්පු' }), sunil)
    const cancelled = await seedEvent(householdId, { date: colomboDate(-10), categories: ['බත්'] })
    await admin.from('event').update({ cancelled_at: new Date().toISOString() }).eq('id', cancelled)
    await seedAssignment(await seedItem(cancelled, 'බත්', { name: 'අල' }), sunil, { status: 'received' })

    await renderApp(`/contributors/${sunil}`, { signedInAs: organizer })

    const stats = await screen.findByRole('list', { name: 'සංඛ්‍යා' })
    await waitFor(() => expect(stats).toHaveTextContent('සහාය වූ දාන 2'))
    expect(stats).toHaveTextContent('ගෙනා දේවල් 2')
  })

  it('the directory shows how many pending assignments each contributor has in upcoming events, and opens their page', async () => {
    const { householdId, organizer } = await seedHousehold()
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedContributor(householdId, 'අනුලා විජේසේකර')
    const upcoming = await seedEvent(householdId, { date: colomboDate(3), categories: ['බත්'] })
    await seedAssignment(await seedItem(upcoming, 'බත්', { name: 'සුදු බත්' }), sunil)
    await seedAssignment(await seedItem(upcoming, 'බත්', { name: 'කිරිබත්' }), sunil)
    await seedAssignment(await seedItem(upcoming, 'බත්', { name: 'පරිප්පු' }), sunil, { status: 'confirmed' })
    // A pending assignment on a past event is history, not a follow-up.
    const past = await seedEvent(householdId, { date: colomboDate(-3), categories: ['බත්'] })
    await seedAssignment(await seedItem(past, 'බත්', { name: 'අල' }), sunil)

    const { user } = await renderApp('/contributors', { signedInAs: organizer })

    const sunilRow = (await screen.findByText('සුනිල් ජයසිංහ')).closest('li')!
    await waitFor(() => expect(sunilRow).toHaveTextContent('◔තහවුරු නොවූ 2'))
    const anulaRow = screen.getByText('අනුලා විජේසේකර').closest('li')!
    expect(anulaRow).not.toHaveTextContent('තහවුරු නොවූ')

    await user.click(within(sunilRow).getByText('සුනිල් ජයසිංහ'))
    expect(currentPath()).toBe(`/contributors/${sunil}`)
    expect(await screen.findByRole('heading', { level: 1, name: 'සුනිල් ජයසිංහ' })).toBeInTheDocument()
  })

  it('"WhatsApp" opens WhatsApp with a Sinhala message listing that event\'s items and quantities', async () => {
    const { householdId, organizer } = await seedHousehold()
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ', { phone: '0711111111', whatsapp: '077 123 4567' })
    const eventId = await seedEvent(householdId, { date: '2099-11-08', monastery: 'මාලබේ අසපුව', categories: ['බත්'] })
    await seedAssignment(await seedItem(eventId, 'බත්', { name: 'සුදු බත්', unit: 'kg' }), sunil, { quantity: 1 })
    await seedAssignment(await seedItem(eventId, 'බත්', { name: 'කිරිබත්' }), sunil, { status: 'confirmed' })
    const other = await seedEvent(householdId, { date: '2099-11-21', categories: ['බත්'] })
    await seedAssignment(await seedItem(other, 'බත්', { name: 'වතුර බෝතල්' }), sunil, { quantity: 40 })
    const past = await seedEvent(householdId, { date: colomboDate(-5), categories: ['බත්'] })
    await seedAssignment(await seedItem(past, 'බත්', { name: 'කැවුම්' }), sunil)

    await renderApp(`/contributors/${sunil}`, { signedInAs: organizer })

    const group = await screen.findByRole('region', { name: /නොවැම්බර් 08/ })
    const share = within(group).getByRole('link', { name: 'WhatsApp' })
    const url = new URL(share.getAttribute('href')!)
    expect(url.origin + url.pathname).toBe('https://wa.me/94771234567')
    const message = url.searchParams.get('text')!
    expect(message).toContain('ඔබ ගෙන එන දේවල්')
    expect(message).toContain('සුනිල් ජයසිංහ')
    expect(message).toContain('නොවැම්බර් 08')
    expect(message).toContain('දහවල් දානය')
    expect(message).toContain('මාලබේ අසපුව')
    expect(message).toContain('• සුදු බත් — කි.ග්‍රෑ. 1')
    expect(message).toContain('• කිරිබත්')
    expect(message).not.toContain('වතුර බෝතල්')
    // Past events have nothing left to send.
    expect(within(screen.getByRole('region', { name: /පසුගිය/ })).queryByRole('link', { name: 'WhatsApp' })).not.toBeInTheDocument()
  })

  it("another household's contributor is not found", async () => {
    const other = await seedHousehold('සිල්වා පවුල')
    const stranger = await seedContributor(other.householdId, 'ගුණපාල')
    const { organizer } = await seedHousehold()
    await renderApp(`/contributors/${stranger}`, { signedInAs: organizer })
    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByText('ගුණපාල')).not.toBeInTheDocument()
  })
})

/** An item's row in a menu category. */
function menuRow(category: HTMLElement, name: string): HTMLElement {
  const row = within(category).getByText(name, { selector: 'li a span' }).closest('li')
  if (!row) throw new Error(`no menu row for ${name}`)
  return row
}

/** The row for one of the contributor's assignments in an event group. */
function assignmentRow(group: HTMLElement, itemName: string): HTMLElement {
  const row = within(group).getByText(itemName).closest('li')
  if (!row) throw new Error(`no row for ${itemName}`)
  return row
}
