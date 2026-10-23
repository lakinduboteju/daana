import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

/** A menu with one item of each status, across three categories. */
async function seedMenu() {
  const { householdId, organizer } = await seedHousehold()
  const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්', 'ව්‍යංජන', 'පලතුරු'] })
  const kiribath = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
  const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
  const dhal = await seedItem(eventId, 'ව්‍යංජන', { name: 'පරිප්පු' })
  await seedItem(eventId, 'ව්‍යංජන', { name: 'බෝංචි' })
  const potato = await seedItem(eventId, 'ව්‍යංජන', { name: 'අල තෙම්පරාදුව' })
  const banana = await seedItem(eventId, 'පලතුරු', { name: 'කෙසෙල්' })
  await seedItem(eventId, 'පලතුරු', { name: 'අන්නාසි' })
  const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
  const kamala = await seedContributor(householdId, 'කමලා රත්නායක')
  const sunil = await seedContributor(householdId, 'Sunil Jayasinghe')
  await seedAssignment(kiribath, nimal, { status: 'confirmed' })
  await seedAssignment(rice, kamala, { quantity: 2, status: 'confirmed' })
  await seedAssignment(rice, sunil, { quantity: 1 })
  await seedAssignment(dhal, kamala, { status: 'confirmed' })
  await seedAssignment(potato, sunil)
  await seedAssignment(banana, nimal, { status: 'received' })
  return { organizer, eventId, ids: { nimal, kamala, sunil } }
}

function chips() {
  return screen.getByRole('group', { name: 'තත්ත්වය අනුව' })
}

function shownItems(): string[] {
  return screen
    .getAllByRole('region')
    .flatMap((region) => within(region).queryAllByRole('listitem'))
    .map((row) => within(row).getAllByRole('link')[0].querySelector('span')?.textContent ?? '')
}

describe('menu filters', () => {
  it('status chips show counts and narrow the menu, hiding categories with nothing left; Clear brings it all back', async () => {
    const { organizer, eventId } = await seedMenu()
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await screen.findByRole('region', { name: 'බත්' })
    await waitFor(() => expect(within(chips()).getByRole('button', { name: 'සියල්ල · 7' })).toHaveAttribute('aria-pressed', 'true'))
    expect(within(chips()).getByRole('button', { name: 'පවරා නැත · 2' })).toBeInTheDocument()
    // Pending includes partial items: සුදු බත් and අල තෙම්පරාදුව.
    expect(within(chips()).getByRole('button', { name: 'තහවුරු කර නැත · 2' })).toBeInTheDocument()
    expect(within(chips()).getByRole('button', { name: 'තහවුරුයි · 2' })).toBeInTheDocument()
    expect(within(chips()).getByRole('button', { name: 'ලැබී ඇත · 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()

    await user.click(within(chips()).getByRole('button', { name: 'පවරා නැත · 2' }))
    expect(currentPath()).toBe(`/events/${eventId}?status=unassigned`)
    expect(within(chips()).getByRole('button', { name: 'පවරා නැත · 2' })).toHaveAttribute('aria-pressed', 'true')
    expect(shownItems()).toEqual(['බෝංචි', 'අන්නාසි'])
    expect(screen.queryByRole('region', { name: 'බත්' })).not.toBeInTheDocument()
    expect(screen.getByText('අයිතම 2ක් පෙන්වයි')).toBeInTheDocument()

    await user.click(within(chips()).getByRole('button', { name: 'තහවුරු කර නැත · 2' }))
    expect(currentPath()).toBe(`/events/${eventId}?status=pending`)
    expect(shownItems()).toEqual(['සුදු බත්', 'අල තෙම්පරාදුව'])
    expect(screen.queryByRole('region', { name: 'පලතුරු' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(shownItems()).toHaveLength(7)
    expect(within(chips()).getByRole('button', { name: 'සියල්ල · 7' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('category, contributor, status and search combine; counts follow the other filters; Clear removes them all', async () => {
    const { organizer, eventId, ids } = await seedMenu()
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })
    await screen.findByRole('region', { name: 'බත්' })

    await user.selectOptions(await screen.findByRole('combobox', { name: 'කාණ්ඩය' }), 'ව්‍යංජන')
    expect(currentPath()).toMatch(new RegExp(`^/events/${eventId}\\?category=[0-9a-f-]{36}$`))
    expect(shownItems()).toEqual(['පරිප්පු', 'බෝංචි', 'අල තෙම්පරාදුව'])

    await user.selectOptions(screen.getByRole('combobox', { name: 'දායකයා' }), 'Sunil Jayasinghe')
    expect(currentPath()).toContain(`contributor=${ids.sunil}`)
    expect(shownItems()).toEqual(['අල තෙම්පරාදුව'])
    expect(within(chips()).getByRole('button', { name: 'සියල්ල · 1' })).toBeInTheDocument()
    expect(within(chips()).getByRole('button', { name: 'තහවුරු කර නැත · 1' })).toBeInTheDocument()
    expect(within(chips()).getByRole('button', { name: 'පවරා නැත · 0' })).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'කාණ්ඩය' }), 'සියලු කාණ්ඩ')
    expect(shownItems()).toEqual(['සුදු බත්', 'අල තෙම්පරාදුව'])
    await user.click(within(chips()).getByRole('button', { name: 'තහවුරු කර නැත · 2' }))
    await user.click(screen.getByRole('button', { name: 'මෙනුව තුළ සොයන්න' }))
    await user.type(screen.getByRole('searchbox', { name: 'මෙනුව තුළ සොයන්න' }), 'බත්')
    expect(currentPath()).toContain('q=')
    expect(shownItems()).toEqual(['සුදු බත්'])
    expect(screen.getByText('අයිතම 1ක් පෙන්වයි')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(shownItems()).toHaveLength(7)
    expect(screen.queryByRole('searchbox', { name: 'මෙනුව තුළ සොයන්න' })).not.toBeInTheDocument()
  })

  it('search matches item and contributor names, ignoring English capitals', async () => {
    const { organizer, eventId } = await seedMenu()
    await renderApp(`/events/${eventId}?q=sunil`, { signedInAs: organizer })

    await screen.findByRole('region', { name: 'බත්' })
    expect(screen.getByRole('searchbox', { name: 'මෙනුව තුළ සොයන්න' })).toHaveValue('sunil')
    expect(shownItems()).toEqual(['සුදු බත්', 'අල තෙම්පරාදුව'])
  })

  it('filters survive a reload, and coming back from an item by its back button or the browser', async () => {
    const { organizer, eventId, ids } = await seedMenu()
    const first = await renderApp(`/events/${eventId}`, { signedInAs: organizer })
    await screen.findByRole('region', { name: 'බත්' })
    await first.user.click(within(chips()).getByRole('button', { name: 'තහවුරුයි · 2' }))
    await first.user.selectOptions(screen.getByRole('combobox', { name: 'දායකයා' }), 'කමලා රත්නායක')
    expect(shownItems()).toEqual(['පරිප්පු'])
    const filteredPath = currentPath()
    expect(filteredPath).toBe(`/events/${eventId}?status=confirmed&contributor=${ids.kamala}`)

    first.unmount()
    const { user } = await renderApp(filteredPath)
    await screen.findByRole('region', { name: 'ව්‍යංජන' })
    expect(shownItems()).toEqual(['පරිප්පු'])
    expect(within(chips()).getByRole('button', { name: 'තහවුරුයි · 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('combobox', { name: 'දායකයා' })).toHaveDisplayValue('කමලා රත්නායක')

    await user.click(screen.getByRole('link', { name: /පරිප්පු/ }))
    await screen.findByRole('heading', { level: 1, name: 'පරිප්පු' })
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await waitFor(() => expect(currentPath()).toBe(filteredPath))
    expect(shownItems()).toEqual(['පරිප්පු'])

    await user.click(screen.getByRole('link', { name: /පරිප්පු/ }))
    await screen.findByRole('heading', { level: 1, name: 'පරිප්පු' })
    window.history.back()
    await waitFor(() => expect(currentPath()).toBe(filteredPath))
    expect(shownItems()).toEqual(['පරිප්පු'])
  })

  it('shows a message when nothing matches', async () => {
    const { organizer, eventId } = await seedMenu()
    await renderApp(`/events/${eventId}?q=කිරි%20හොදි`, { signedInAs: organizer })

    expect(await screen.findByText('ගැළපෙන Item නැත')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'බත්' })).not.toBeInTheDocument()
  })
})
