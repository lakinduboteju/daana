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

  it('organizer records a given to a contributor in a sheet over the money tab', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    await seedContributor(householdId, 'නිමල් සිල්වා')
    await seedContributor(householdId, 'පැරණි දායකයා', { archived: true })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    expect(await screen.findByText('තවම මුදල් වාර්තා නැත.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: '+ ලබා දුන් මුදලක්' }))
    expect(currentPath()).toBe(`/events/${eventId}/money/new?type=given`)

    const sheet = await screen.findByRole('dialog', { name: 'ලබා දුන් මුදලක්' })
    await user.type(within(sheet).getByLabelText(/^මුදල \(Rs\)/), '3000')
    const contributor = within(sheet).getByLabelText('දායකයා')
    await waitFor(() => expect(within(contributor).getByRole('option', { name: 'නිමල් සිල්වා' })).toBeInTheDocument())
    expect(within(contributor).queryByRole('option', { name: 'පැරණි දායකයා' })).not.toBeInTheDocument()
    await user.selectOptions(contributor, 'නිමල් සිල්වා')
    await user.selectOptions(within(sheet).getByLabelText('Item'), 'කිරිබත්')
    await user.click(within(sheet).getByRole('radio', { name: 'මුදල්' }))
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('status')).toHaveTextContent('සුරැකිණි')
    expect(currentPath()).toBe(`/events/${eventId}/money`)
    const list = await screen.findByRole('list', { name: 'ගනුදෙනු' })
    expect(row(list, 'Rs 3,000')).toHaveTextContent('ලබා දුන්')
    expect(row(list, 'Rs 3,000')).toHaveTextContent('නිමල් සිල්වා')
    expect(row(list, 'Rs 3,000')).toHaveTextContent('කිරිබත් · මුදල්')
    expect(screen.getByRole('region', { name: 'එකතුව' })).toHaveTextContent('දායකයන්ට ලබා දුන් මුදල්Rs 3,000')
  })

  it('organizer edits a transaction into an expense, then deletes it', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    const transactionId = await seedTransaction(eventId, { kind: 'given', amount: 2000, method: 'cash' })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    const list = await screen.findByRole('list', { name: 'ගනුදෙනු' })
    await user.click(within(row(list, 'Rs 2,000')).getByRole('link'))
    expect(currentPath()).toBe(`/events/${eventId}/money/${transactionId}`)
    const sheet = await screen.findByRole('dialog', { name: 'ගනුදෙනුව සංස්කරණය' })
    await user.click(within(sheet).getByRole('radio', { name: 'වියදම' }))
    const amount = within(sheet).getByLabelText(/^මුදල \(Rs\)/)
    await user.clear(amount)
    await user.type(amount, '2200')
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const totals = screen.getByRole('region', { name: 'එකතුව' })
    await waitFor(() => expect(totals).toHaveTextContent('සත්‍ය වියදම්Rs 2,200'))
    expect(totals).toHaveTextContent('දායකයන්ට ලබා දුන් මුදල්Rs 0')

    await user.click(within(row(list, 'Rs 2,200')).getByRole('link'))
    const again = await screen.findByRole('dialog', { name: 'ගනුදෙනුව සංස්කරණය' })
    await user.click(within(again).getByRole('button', { name: 'මකන්න' }))
    const confirm = await screen.findByRole('dialog', { name: 'මෙම ගනුදෙනුව මකන්නද?' })
    await user.click(within(confirm).getByRole('button', { name: 'ඔව්, මකන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('තවම මුදල් වාර්තා නැත.')).toBeInTheDocument()
    expect(totals).toHaveTextContent('සත්‍ය වියදම්Rs 0')
  })

  it('a contributor who spent more than they were given is owed a reimbursement, settled by another given', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    const shriya = await seedContributor(householdId, 'ශ්‍රියා පෙරේරා')
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedTransaction(eventId, { kind: 'given', amount: 1000, contributorId: shriya })
    await seedTransaction(eventId, { kind: 'expense', amount: 2200, contributorId: shriya })
    // Given more than spent: nothing owed (never a negative reimbursement).
    await seedTransaction(eventId, { kind: 'given', amount: 2500, contributorId: sunil })
    await seedTransaction(eventId, { kind: 'expense', amount: 1850, contributorId: sunil })
    // The organizer's own expense owes no one.
    await seedTransaction(eventId, { kind: 'expense', amount: 3150 })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    const owed = await screen.findByRole('list', { name: 'ආපසු ගෙවිය යුතුයි' })
    const rows = within(owed).getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('ශ්‍රියා පෙරේරාට Rs 1,200 ආපසු ගෙවිය යුතුයි')

    await user.click(within(rows[0]).getByRole('link', { name: 'ශ්‍රියා පෙරේරාට ගෙවන්න' }))
    const sheet = await screen.findByRole('dialog', { name: 'ලබා දුන් මුදලක්' })
    expect(within(sheet).getByLabelText(/^මුදල \(Rs\)/)).toHaveValue(1200)
    await waitFor(() => expect(within(sheet).getByLabelText('දායකයා')).toHaveDisplayValue('ශ්‍රියා පෙරේරා'))
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('list', { name: 'ආපසු ගෙවිය යුතුයි' })).not.toBeInTheDocument())
    expect(screen.getByRole('region', { name: 'එකතුව' })).toHaveTextContent('දායකයන්ට ලබා දුන් මුදල්Rs 4,700')
  })

  it("item details show that item's transactions, and money recorded from there is linked to it", async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්' })
    const kiribath = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedTransaction(eventId, { kind: 'expense', amount: 1850, contributorId: sunil, itemId: rice })
    await seedTransaction(eventId, { kind: 'given', amount: 3000, itemId: kiribath })
    const { user } = await renderApp(`/events/${eventId}/items/${rice}`, { signedInAs: organizer })

    const money = await screen.findByRole('region', { name: 'මුදල්' })
    const list = await within(money).findByRole('list', { name: 'ගනුදෙනු' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(list).toHaveTextContent('සුනිල් ජයසිංහ')
    expect(list).toHaveTextContent('Rs 1,850')

    await user.click(within(money).getByRole('link', { name: '+ වියදමක්' }))
    expect(currentPath()).toBe(`/events/${eventId}/money/new?type=expense&item=${rice}`)
    const sheet = await screen.findByRole('dialog', { name: 'වියදමක්' })
    await waitFor(() => expect(within(sheet).getByLabelText('Item')).toHaveDisplayValue('සුදු බත්'))
    await user.type(within(sheet).getByLabelText(/^මුදල \(Rs\)/), '400')
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    // Back on the item's details, with the new expense listed.
    await waitFor(() => expect(currentPath()).toBe(`/events/${eventId}/items/${rice}`))
    const after = await screen.findByRole('region', { name: 'මුදල්' })
    await waitFor(() => expect(within(after).getAllByRole('listitem')).toHaveLength(2))
    expect(after).toHaveTextContent('Rs 400')
  })

  it('deleting an item keeps its transactions on the event', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්' })
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedTransaction(eventId, { kind: 'expense', amount: 1850, contributorId: sunil, itemId: rice })
    const { user } = await renderApp(`/events/${eventId}/items/${rice}/edit`, { signedInAs: organizer })

    const sheet = await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })
    await user.click(await within(sheet).findByRole('button', { name: 'Item එක මකන්න' }))
    await user.click(within(sheet).getByRole('button', { name: 'ඔව්, මකන්න' }))
    await waitFor(() => expect(currentPath()).toBe(`/events/${eventId}`))

    await user.click(await screen.findByRole('link', { name: 'මුදල් හා ලේඛන' }))
    const list = await screen.findByRole('list', { name: 'ගනුදෙනු' })
    expect(row(list, 'Rs 1,850')).toHaveTextContent('සුනිල් ජයසිංහ')
    expect(row(list, 'Rs 1,850')).not.toHaveTextContent('සුදු බත්')
    expect(screen.getByRole('region', { name: 'එකතුව' })).toHaveTextContent('සත්‍ය වියදම්Rs 1,850')
  })

  it('deleting a contributor with transactions archives them, and their transactions stay', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    const shriya = await seedContributor(householdId, 'ශ්‍රියා පෙරේරා')
    await seedTransaction(eventId, { kind: 'expense', amount: 1200, contributorId: shriya })
    const { user } = await renderApp(`/contributors/${shriya}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'මකන්න' }))
    await user.click(within(screen.getByRole('dialog', { name: 'ශ්‍රියා පෙරේරා මකන්නද?' })).getByRole('button', { name: 'ඔව්, මකන්න' }))
    await waitFor(() => expect(currentPath()).toBe('/contributors'))

    window.history.pushState(null, '', `${import.meta.env.BASE_URL}events/${eventId}/money`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    const list = await screen.findByRole('list', { name: 'ගනුදෙනු' })
    expect(row(list, 'Rs 1,200')).toHaveTextContent('ශ්‍රියා පෙරේරා')
    expect(screen.getByRole('list', { name: 'ආපසු ගෙවිය යුතුයි' })).toHaveTextContent('ශ්‍රියා පෙරේරාට Rs 1,200')
  })

  it("another household's transaction is not found", async () => {
    const a = await seedHousehold('බොතේජු පවුල')
    const b = await seedHousehold('සිල්වා පවුල')
    const aEvent = await seedEvent(a.householdId, { date: '2099-11-08' })
    const bEvent = await seedEvent(b.householdId, { date: '2099-11-08' })
    const aTransaction = await seedTransaction(aEvent, { kind: 'given', amount: 9999 })
    await renderApp(`/events/${bEvent}/money/${aTransaction}`, { signedInAs: b.organizer })

    const sheet = await screen.findByRole('dialog', { name: 'ගනුදෙනුව සංස්කරණය' })
    expect(await within(sheet).findByText('මෙම ගනුදෙනුව හමු නොවීය.')).toBeInTheDocument()
    expect(screen.queryByText('Rs 9,999')).not.toBeInTheDocument()
  })

  it('leaving a transaction sheet with unsaved changes asks first', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: '+ වියදමක්' }))
    const sheet = await screen.findByRole('dialog', { name: 'වියදමක්' })
    await user.type(within(sheet).getByLabelText(/^මුදල \(Rs\)/), '500')
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))

    const prompt = await screen.findByRole('dialog', { name: 'වෙනස්කම් ඉවත දමන්නද?' })
    await user.click(within(prompt).getByRole('button', { name: 'ඉවත දමන්න' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}/money`)
  })
})

/** The transaction row in `list` showing this amount. */
function row(list: HTMLElement, amount: string): HTMLElement {
  const rows = within(list).getAllByRole('listitem').filter((li) => li.textContent?.includes(amount))
  if (rows.length !== 1) throw new Error(`expected one row with ${amount}, found ${rows.length}`)
  return rows[0]
}
