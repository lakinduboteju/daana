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
    const status = screen.getByRole('region', { name: 'අයිතමයේ තත්ත්වය' })
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

    const status = await screen.findByRole('region', { name: 'අයිතමයේ තත්ත්වය' })
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
    await waitFor(() => expect(screen.getByRole('region', { name: 'අයිතමයේ තත්ත්වය' })).toHaveTextContent('✓තහවුරුයි'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

/** The menu row for the item with this name: a link to its details, and a පවරන්න link when unassigned. */
function itemRow(container: HTMLElement, name: string): HTMLElement {
  const row = within(container).getByText(name, { selector: 'li a span' }).closest('li')
  if (!row) throw new Error(`no row for ${name}`)
  return row
}
