import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { admin, colomboDate, seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

/**
 * Seeds a menu with one of each kind of item:
 * බත් — received, confirmed, partial; ව්‍යංජන — pending, unassigned ×2, confirmed.
 * 7 items: 3 ready, 3 need attention (2 unassigned, 1 pending), 1 short (partial).
 */
async function seedMixedMenu(householdId: string, eventId: string) {
  const kamala = await seedContributor(householdId, 'කමලා රත්නායක')
  const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')

  const kesel = await seedItem(eventId, 'බත්', { name: 'කෙසෙල්' })
  await seedAssignment(kesel, kamala, { status: 'received' })
  const kiribath = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
  await seedAssignment(kiribath, kamala, { status: 'confirmed' })
  const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්' })
  await seedAssignment(rice, kamala, { status: 'confirmed' })
  await seedAssignment(rice, sunil)

  const beans = await seedItem(eventId, 'ව්‍යංජන', { name: 'බෝංචි' })
  await seedAssignment(beans, sunil)
  await seedItem(eventId, 'ව්‍යංජන', { name: 'වම්බටු' })
  await seedItem(eventId, 'ව්‍යංජන', { name: 'පරිප්පු' })
  const potato = await seedItem(eventId, 'ව්‍යංජන', { name: 'අල' })
  await seedAssignment(potato, sunil, { status: 'confirmed' })
}

describe('event progress', () => {
  it('the event screen shows how many items are ready and a bar split by item status', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: colomboDate(10), categories: ['බත්', 'ව්‍යංජන'] })
    await seedMixedMenu(householdId, eventId)
    await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const summary = await screen.findByRole('region', { name: /මාලබේ අසපුව/ })
    await waitFor(() => expect(summary).toHaveTextContent('3 / 7 අයිතම තහවුරුයි'))
    expect(within(summary).getByRole('img', { name: /^සූදානම:/ })).toHaveAccessibleName(
      'සූදානම: ලැබී ඇත 1, තහවුරුයි 2, අර්ධ වශයෙන් තහවුරුයි 1, තහවුරු කර නැත 1, පවරා නැත 2',
    )
  })

  it('an upcoming event lists what needs attention, with short items on a softer line', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: colomboDate(0), categories: ['බත්', 'ව්‍යංජන'] })
    await seedMixedMenu(householdId, eventId)
    await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const attention = await screen.findByRole('region', { name: 'අවධානය අවශ්‍යයි' })
    expect(attention).toHaveTextContent('අයිතම 2කට දායකයන් නැත')
    expect(attention).toHaveTextContent('1ක් තවම තහවුරු කර නැත')
    expect(within(attention).getByText('අයිතම 1ක් අර්ධ වශයෙන් පමණක් තහවුරුයි')).toBeInTheDocument()
  })

  it('cancelled and past events show their progress but nothing needing attention', async () => {
    const { householdId, organizer } = await seedHousehold()
    const cancelled = await seedEvent(householdId, { date: colomboDate(3), categories: ['බත්', 'ව්‍යංජන'] })
    await seedMixedMenu(householdId, cancelled)
    await admin.from('event').update({ cancelled_at: new Date().toISOString() }).eq('id', cancelled).throwOnError()
    const past = await seedEvent(householdId, { date: colomboDate(-1), categories: ['බත්', 'ව්‍යංජන'] })
    await seedMixedMenu(householdId, past)

    const { unmount } = await renderApp(`/events/${cancelled}`, { signedInAs: organizer })
    const cancelledSummary = await screen.findByRole('region', { name: /මාලබේ අසපුව/ })
    await waitFor(() => expect(cancelledSummary).toHaveTextContent('3 / 7 අයිතම තහවුරුයි'))
    expect(cancelledSummary).toHaveTextContent('අවලංගුයි')
    expect(screen.queryByRole('region', { name: 'අවධානය අවශ්‍යයි' })).not.toBeInTheDocument()
    unmount()

    await renderApp(`/events/${past}`)
    const pastSummary = await screen.findByRole('region', { name: /මාලබේ අසපුව/ })
    await waitFor(() => expect(pastSummary).toHaveTextContent('3 / 7 අයිතම තහවුරුයි'))
    expect(screen.queryByRole('region', { name: 'අවධානය අවශ්‍යයි' })).not.toBeInTheDocument()
  })

  it('each category header shows how many of its items are ready', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: colomboDate(10), categories: ['බත්', 'ව්‍යංජන', 'පලතුරු'] })
    await seedMixedMenu(householdId, eventId)
    await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const rice = await screen.findByRole('region', { name: 'බත්' })
    await waitFor(() => expect(within(rice).getByRole('button', { expanded: true })).toHaveTextContent('2/3'))
    expect(within(rice).getByRole('progressbar', { name: 'බත් සූදානම' })).toHaveAttribute('aria-valuenow', '2')
    expect(within(rice).getByRole('progressbar', { name: 'බත් සූදානම' })).toHaveAttribute('aria-valuemax', '3')

    const curries = screen.getByRole('region', { name: 'ව්‍යංජන' })
    expect(within(curries).getByRole('button', { expanded: true })).toHaveTextContent('1/4')
    expect(within(curries).getByRole('progressbar', { name: 'ව්‍යංජන සූදානම' })).toHaveAttribute('aria-valuenow', '1')

    const fruit = screen.getByRole('region', { name: 'පලතුරු' })
    expect(within(fruit).queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
