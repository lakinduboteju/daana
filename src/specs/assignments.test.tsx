import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

describe('assignments', () => {
  it('assigning a contributor from an unassigned row makes a pending assignment', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['ව්‍යංජන'] })
    await seedItem(eventId, 'ව්‍යංජන', { name: 'බෝංචි', requiredQuantity: 2, unit: 'kg' })
    await seedContributor(householdId, 'අනුලා විජේසේකර')
    await seedContributor(householdId, 'රුවන් කුමාර')
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const curries = await screen.findByRole('region', { name: 'ව්‍යංජන' })
    expect(itemRow(curries, 'බෝංචි')).toHaveTextContent('○පවරා නැත')
    await user.click(within(itemRow(curries, 'බෝංචි')).getByRole('link', { name: 'පවරන්න' }))
    expect(currentPath()).toMatch(new RegExp(`^/events/${eventId}/items/[0-9a-f-]{36}/assign$`))

    const sheet = await screen.findByRole('dialog', { name: 'බෝංචි — දායකයා' })
    await user.type(within(sheet).getByRole('searchbox', { name: 'දායකයා සොයන්න' }), 'අනුලා')
    await user.click(await within(sheet).findByRole('radio', { name: /අනුලා විජේසේකර/ }))
    expect(within(sheet).queryByRole('radio', { name: /රුවන් කුමාර/ })).not.toBeInTheDocument()
    await user.type(within(sheet).getByLabelText(/ප්‍රමාණය/), '2')
    const agreed = within(sheet).getByRole('radiogroup', { name: 'ඔවුන් එකඟ වුණාද?' })
    expect(within(agreed).getByRole('radio', { name: /තහවුරු කර නැත/ })).toBeChecked()
    await user.click(within(sheet).getByRole('button', { name: 'අනුලා ට පවරන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('status')).toHaveTextContent('බෝංචි අනුලා විජේසේකරට පැවරුණා')
    await waitFor(() => expect(itemRow(curries, 'බෝංචි')).toHaveTextContent('◔තහවුරු කර නැත'))
    expect(itemRow(curries, 'බෝංචි')).toHaveTextContent('අනුලා විජේසේකර · කි.ග්‍රෑ. 2')
    expect(within(itemRow(curries, 'බෝංචි')).queryByRole('link', { name: 'පවරන්න' })).not.toBeInTheDocument()
  })

  it('an item with one confirmed and one pending assignment shows partial, on the menu and its details', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg', notes: 'ලුණු අඩුවෙන්' })
    const kamala = await seedContributor(householdId, 'කමලා රත්නායක', { phone: '077 123 4567' })
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedAssignment(itemId, kamala, { quantity: 2, status: 'confirmed' })
    await seedAssignment(itemId, sunil, { quantity: 1 })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const rice = await screen.findByRole('region', { name: 'බත්' })
    await waitFor(() => expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('◑අර්ධ වශයෙන් තහවුරුයි'))
    expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('කමලා, සුනිල් · කි.ග්‍රෑ. 3')

    await user.click(within(itemRow(rice, 'සුදු බත්')).getByRole('link', { name: /සුදු බත්/ }))
    expect(currentPath()).toBe(`/events/${eventId}/items/${itemId}`)
    expect(await screen.findByRole('heading', { level: 1, name: 'සුදු බත්' })).toBeInTheDocument()
    const status = screen.getByRole('region', { name: 'තත්ත්වය' })
    expect(status).toHaveTextContent('◑අර්ධ වශයෙන් තහවුරුයි')
    expect(status).toHaveTextContent('අවශ්‍ය ප්‍රමාණය කි.ග්‍රෑ. 3')
    expect(within(status).getByRole('progressbar', { name: 'තහවුරු ප්‍රමාණය' })).toHaveAttribute('aria-valuenow', '2')
    expect(status).toHaveTextContent('තවම කි.ග්‍රෑ. 1ක් තහවුරු වී නැත')

    const contributors = screen.getByRole('list', { name: 'දායකයන්' })
    const [first, second] = within(contributors).getAllByRole('listitem')
    expect(first).toHaveTextContent('කමලා රත්නායක')
    expect(first).toHaveTextContent('කි.ග්‍රෑ. 2')
    expect(within(first).getByRole('radio', { name: /තහවුරුයි/ })).toBeChecked()
    expect(within(first).getByRole('link', { name: 'කමලා රත්නායක අමතන්න' })).toHaveAttribute('href', 'tel:0771234567')
    expect(within(first).getByRole('link', { name: 'කමලා රත්නායකට WhatsApp පණිවිඩයක්' })).toHaveAttribute('href', 'https://wa.me/94771234567')
    expect(within(second).getByRole('radio', { name: /තහවුරු කර නැත/ })).toBeChecked()
    expect(screen.getByText('ලුණු අඩුවෙන්')).toBeInTheDocument()
  })

  it('one tap confirms an assignment, saves it with a toast, and the item status follows', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    await seedAssignment(itemId, nimal)
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}`, { signedInAs: organizer })

    const status = await screen.findByRole('region', { name: 'තත්ත්වය' })
    await waitFor(() => expect(status).toHaveTextContent('◔තහවුරු කර නැත'))
    const choice = screen.getByRole('radiogroup', { name: 'නිමල් සිල්වා — තත්ත්වය' })
    await user.click(within(choice).getByRole('radio', { name: /තහවුරුයි/ }))

    expect(within(choice).getByRole('radio', { name: /තහවුරුයි/ })).toBeChecked()
    expect(await screen.findByRole('status')).toHaveTextContent('නිමල් සිල්වා — තහවුරුයි ලෙස සුරැකිණි')
    await waitFor(() => expect(status).toHaveTextContent('✓තහවුරුයි'))

    await user.click(within(choice).getByRole('radio', { name: /ලැබී ඇත/ }))
    await waitFor(() => expect(status).toHaveTextContent('✓✓ලැබී ඇත'))
  })

  it('a failed one-tap save shows a retry banner, and retrying saves it', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    await seedAssignment(itemId, nimal)
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}`, { signedInAs: organizer })
    const choice = await screen.findByRole('radiogroup', { name: 'නිමල් සිල්වා — තත්ත්වය' })

    const realFetch = globalThis.fetch
    const offline = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
      init?.method === 'PATCH' ? Promise.reject(new TypeError('Failed to fetch')) : realFetch(input, init),
    )
    await user.click(within(choice).getByRole('radio', { name: /තහවුරුයි/ }))

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent('නිමල් සිල්වා — තහවුරුයි සුරැකීමට නොහැකි විය')
    await waitFor(() => expect(within(choice).getByRole('radio', { name: /තහවුරු කර නැත/ })).toBeChecked())

    offline.mockRestore()
    await user.click(within(banner).getByRole('button', { name: 'නැවත උත්සාහ කරන්න' }))
    expect(await screen.findByRole('status')).toHaveTextContent('නිමල් සිල්වා — තහවුරුයි ලෙස සුරැකිණි')
    await waitFor(() => expect(screen.getByRole('region', { name: 'තත්ත්වය' })).toHaveTextContent('✓තහවුරුයි'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('assigning several contributors and changing plans', () => {
  it('adds a second contributor from the item details, picking a recent one', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const earlier = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const itemId = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
    const kamala = await seedContributor(householdId, 'කමලා රත්නායක')
    const sunil = await seedContributor(householdId, 'සුනිල් ජයසිංහ')
    await seedContributor(householdId, 'රුවන් කුමාර')
    await seedAssignment(earlier, sunil)
    await seedAssignment(itemId, kamala, { quantity: 2, status: 'confirmed' })
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'තවත් දායකයෙක් එක් කරන්න' }))
    const sheet = await screen.findByRole('dialog', { name: 'සුදු බත් — දායකයා' })
    const recent = within(sheet).getByRole('group', { name: 'මෑතදී පැවරූ අය' })
    expect(await within(recent).findByRole('radio', { name: /සුනිල් ජයසිංහ/ })).toBeInTheDocument()
    expect(within(recent).queryByRole('radio', { name: /රුවන් කුමාර/ })).not.toBeInTheDocument()
    await user.click(within(recent).getByRole('radio', { name: /සුනිල් ජයසිංහ/ }))
    await user.type(within(sheet).getByLabelText(/ප්‍රමාණය/), '1')
    await user.click(within(sheet).getByRole('radio', { name: /තහවුරුයි/ }))
    await user.click(within(sheet).getByRole('button', { name: 'සුනිල් ට පවරන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}/items/${itemId}`)
    const contributors = screen.getByRole('list', { name: 'දායකයන්' })
    await waitFor(() => expect(within(contributors).getAllByRole('listitem')).toHaveLength(2))
    await waitFor(() => expect(screen.getByRole('region', { name: 'තත්ත්වය' })).toHaveTextContent('✓තහවුරුයි'))
    expect(screen.getByRole('region', { name: 'තත්ත්වය' })).toHaveTextContent('තහවුරු 3 / 3')
  })

  it('adds a new contributor from inside the assign sheet', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['පාන'] })
    const itemId = await seedItem(eventId, 'පාන', { name: 'ඉඟුරු තේ' })
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}/assign`, { signedInAs: organizer })

    const sheet = await screen.findByRole('dialog', { name: 'ඉඟුරු තේ — දායකයා' })
    await user.type(within(sheet).getByRole('searchbox', { name: 'දායකයා සොයන්න' }), 'දිල්රුක්ෂි')
    await user.click(within(sheet).getByRole('radio', { name: 'අළුත් දායකයෙක්' }))
    expect(within(sheet).getByLabelText('නම')).toHaveValue('දිල්රුක්ෂි')
    await user.type(within(sheet).getByLabelText('දුරකථන අංකය (optional)'), '0711234567')
    await user.click(within(sheet).getByRole('button', { name: 'දිල්රුක්ෂි ට පවරන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const contributors = await screen.findByRole('list', { name: 'දායකයන්' })
    expect(within(contributors).getByRole('radio', { name: /තහවුරු කර නැත/ })).toBeChecked()
    expect(within(contributors).getByRole('link', { name: 'දිල්රුක්ෂි අමතන්න' })).toHaveAttribute('href', 'tel:0711234567')

    // The new contributor is in the household's list too.
    goTo('/contributors')
    expect(await screen.findByText('දිල්රුක්ෂි')).toBeInTheDocument()
  })

  it("edits an assignment's quantity and status, then removes it", async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    await seedAssignment(itemId, nimal, { quantity: 1 })
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'නිමල් සිල්වා — Edit' }))
    expect(currentPath()).toMatch(new RegExp(`^/events/${eventId}/items/${itemId}/assignments/[0-9a-f-]{36}$`))
    const sheet = await screen.findByRole('dialog', { name: 'Edit' })
    const quantity = within(sheet).getByLabelText(/ප්‍රමාණය/)
    expect(quantity).toHaveValue(1)
    await user.clear(quantity)
    await user.type(quantity, '3')
    await user.click(within(sheet).getByRole('radio', { name: /තහවුරුයි/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('status')).toHaveTextContent('නිමල් සිල්වාගේ පැවරුම සුරැකිණි')
    const status = screen.getByRole('region', { name: 'තත්ත්වය' })
    await waitFor(() => expect(status).toHaveTextContent('✓තහවුරුයි'))
    expect(status).toHaveTextContent('තහවුරු 3 / 3')

    await user.click(screen.getByRole('link', { name: 'නිමල් සිල්වා — Edit' }))
    await user.click(await screen.findByRole('button', { name: 'පැවරුම ඉවත් කරන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}/items/${itemId}`)
    await waitFor(() => expect(status).toHaveTextContent('○පවරා නැත'))
    expect(screen.queryByRole('list', { name: 'දායකයන්' })).not.toBeInTheDocument()
  })

  it('deleting an assigned contributor archives them: their assignment stays, and pickers no longer offer them', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    await seedItem(eventId, 'බත්', { name: 'කහ බත්' })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    await seedContributor(householdId, 'නිමාලි පෙරේරා')
    await seedAssignment(itemId, nimal, { status: 'confirmed' })
    const { user } = await renderApp(`/contributors/${nimal}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'මකන්න' }))
    await user.click(within(screen.getByRole('dialog', { name: 'නිමල් සිල්වා මකන්නද?' })).getByRole('button', { name: 'ඔව්, මකන්න' }))
    await waitFor(() => expect(currentPath()).toBe('/contributors'))
    expect(await screen.findByText('නිමාලි පෙරේරා')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('නිමල් සිල්වා Archive කළා')
    expect(screen.queryByText('නිමල් සිල්වා')).not.toBeInTheDocument()

    // Still reachable, and still on the item they were assigned.
    goTo(`/contributors/${nimal}/edit`)
    expect(await screen.findByDisplayValue('නිමල් සිල්වා')).toBeInTheDocument()

    goTo(`/events/${eventId}`)
    const rice = await screen.findByRole('region', { name: 'බත්' })
    await waitFor(() => expect(itemRow(rice, 'කිරිබත්')).toHaveTextContent('නිමල් සිල්වා'))
    expect(itemRow(rice, 'කිරිබත්')).toHaveTextContent('✓තහවුරුයි')

    // Not offered when assigning, by search or as a recent contributor.
    await user.click(within(itemRow(rice, 'කහ බත්')).getByRole('link', { name: 'පවරන්න' }))
    const sheet = await screen.findByRole('dialog', { name: 'කහ බත් — දායකයා' })
    expect(within(sheet).queryByRole('radio', { name: /නිමල් සිල්වා/ })).not.toBeInTheDocument()
    await user.type(within(sheet).getByRole('searchbox', { name: 'දායකයා සොයන්න' }), 'නිම')
    expect(await within(sheet).findByRole('radio', { name: /නිමාලි පෙරේරා/ })).toBeInTheDocument()
    expect(within(sheet).queryByRole('radio', { name: /නිමල් සිල්වා/ })).not.toBeInTheDocument()
  })
})

describe('item status', () => {
  it('counts a shortfall only when the required quantity and every confirmed quantity are known', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    const kamala = await seedContributor(householdId, 'කමලා රත්නායක')

    // Required 3 kg, 2 kg confirmed: short.
    const short = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
    await seedAssignment(short, nimal, { quantity: 2, status: 'confirmed' })
    // Required 3 kg, 2 kg plus an unknown amount confirmed: can't tell, so confirmed.
    const unknownConfirmed = await seedItem(eventId, 'බත්', { name: 'කහ බත්', requiredQuantity: 3, unit: 'kg' })
    await seedAssignment(unknownConfirmed, nimal, { quantity: 2, status: 'confirmed' })
    await seedAssignment(unknownConfirmed, kamala, { status: 'confirmed' })
    // No required quantity: confirmed whatever the amounts.
    const unknownRequired = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    await seedAssignment(unknownRequired, nimal, { quantity: 1, status: 'confirmed' })
    // Required 3 kg, 2 kg confirmed and 1 kg received: covered.
    const covered = await seedItem(eventId, 'බත්', { name: 'දන්කුඩ', requiredQuantity: 3, unit: 'kg' })
    await seedAssignment(covered, nimal, { quantity: 2, status: 'confirmed' })
    await seedAssignment(covered, kamala, { quantity: 1, status: 'received' })

    await renderApp(`/events/${eventId}`, { signedInAs: organizer })
    const rice = await screen.findByRole('region', { name: 'බත්' })
    await waitFor(() => expect(itemRow(rice, 'සුදු බත්')).toHaveTextContent('◑අර්ධ වශයෙන් තහවුරුයි'))
    expect(itemRow(rice, 'කහ බත්')).toHaveTextContent('✓තහවුරුයි')
    expect(itemRow(rice, 'කිරිබත්')).toHaveTextContent('✓තහවුරුයි')
    expect(itemRow(rice, 'දන්කුඩ')).toHaveTextContent('✓තහවුරුයි')
  })

  it('is received only when every assignment is received, and pending when none is confirmed', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['පලතුරු'] })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    const kamala = await seedContributor(householdId, 'කමලා රත්නායක')

    const allReceived = await seedItem(eventId, 'පලතුරු', { name: 'කෙසෙල්' })
    await seedAssignment(allReceived, nimal, { status: 'received' })
    await seedAssignment(allReceived, kamala, { status: 'received' })
    const someReceived = await seedItem(eventId, 'පලතුරු', { name: 'අඹ' })
    await seedAssignment(someReceived, nimal, { status: 'received' })
    await seedAssignment(someReceived, kamala, { status: 'confirmed' })
    const halfReceived = await seedItem(eventId, 'පලතුරු', { name: 'පැපොල්' })
    await seedAssignment(halfReceived, nimal, { status: 'received' })
    await seedAssignment(halfReceived, kamala)
    const nonePending = await seedItem(eventId, 'පලතුරු', { name: 'අන්නාසි' })
    await seedAssignment(nonePending, nimal)
    await seedAssignment(nonePending, kamala)

    await renderApp(`/events/${eventId}`, { signedInAs: organizer })
    const fruit = await screen.findByRole('region', { name: 'පලතුරු' })
    await waitFor(() => expect(itemRow(fruit, 'කෙසෙල්')).toHaveTextContent('✓✓ලැබී ඇත'))
    expect(itemRow(fruit, 'අඹ')).toHaveTextContent('✓තහවුරුයි')
    expect(itemRow(fruit, 'පැපොල්')).toHaveTextContent('◑අර්ධ වශයෙන් තහවුරුයි')
    expect(itemRow(fruit, 'අන්නාසි')).toHaveTextContent('◔තහවුරු කර නැත')
  })
})

/** Navigates within the rendered app, like following a link from elsewhere. `path` is relative to the base. */
function goTo(path: string) {
  window.history.pushState(null, '', import.meta.env.BASE_URL.replace(/\/$/, '') + path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** The menu row for the item with this name: a link to its details, and a පවරන්න link when unassigned. */
function itemRow(container: HTMLElement, name: string): HTMLElement {
  const row = within(container).getByText(name, { selector: 'li a span' }).closest('li')
  if (!row) throw new Error(`no row for ${name}`)
  return row
}
