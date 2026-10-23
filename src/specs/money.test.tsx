import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedContributor, seedEvent, seedHousehold, seedItem, seedTransaction } from '../test/seed'

describe('money', () => {
  it('total given and total expenses are kept separate, and the list filters by kind', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්' })
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedTransaction(eventId, { kind: 'given', amount: 2500, contributorId: sunil, itemId: rice, method: 'bank_transfer' })
    await seedTransaction(eventId, { kind: 'expense', amount: 1850, contributorId: sunil, itemId: rice })
    await seedTransaction(eventId, { kind: 'expense', amount: 3150, notes: 'මල් හා පහන් තෙල්' })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'මුදල් හා ලේඛන' }))
    expect(currentPath()).toBe(`/events/${eventId}/money`)

    const totals = await screen.findByRole('region', { name: 'එකතුව' })
    await waitFor(() => expect(totals).toHaveTextContent('දායකයන්ට ලබා දුන් මුදල්Rs 2,500'))
    expect(totals).toHaveTextContent('සත්‍ය වියදම්Rs 5,000')

    const list = screen.getByRole('list', { name: 'ගනුදෙනු' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(row(list, 'Rs 2,500')).toHaveTextContent('ලබා දුන්')
    expect(row(list, 'Rs 2,500')).toHaveTextContent('සුනිල් ජයසිංහ')
    expect(row(list, 'Rs 2,500')).toHaveTextContent('සුදු බත් · බැංකු මාරුව')
    expect(row(list, 'Rs 3,150')).toHaveTextContent('වියදම')
    expect(row(list, 'Rs 3,150')).toHaveTextContent('මල් හා පහන් තෙල්')

    await user.click(screen.getByRole('link', { name: 'ලබා දුන්' }))
    expect(currentPath()).toBe(`/events/${eventId}/money?type=given`)
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(1))
    expect(list).toHaveTextContent('Rs 2,500')

    await user.click(screen.getByRole('link', { name: 'වියදම්' }))
    expect(currentPath()).toBe(`/events/${eventId}/money?type=expense`)
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(2))
    expect(list).not.toHaveTextContent('Rs 2,500')
    // Totals always cover the whole event, whatever the filter.
    expect(totals).toHaveTextContent('දායකයන්ට ලබා දුන් මුදල්Rs 2,500')

    await user.click(screen.getByRole('link', { name: 'සියල්ල' }))
    expect(currentPath()).toBe(`/events/${eventId}/money`)
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(3))
  })
})

/** The transaction row in `list` showing this amount. */
function row(list: HTMLElement, amount: string): HTMLElement {
  const rows = within(list).getAllByRole('listitem').filter((li) => li.textContent?.includes(amount))
  if (rows.length !== 1) throw new Error(`expected one row with ${amount}, found ${rows.length}`)
  return rows[0]
}
