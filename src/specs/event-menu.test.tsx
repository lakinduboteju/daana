import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedEvent, seedHousehold, seedItem } from '../test/seed'

describe('event menu', () => {
  it('shows the event header, counts, tabs and categories in order', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, {
      date: '2099-11-08',
      meal: 'lunch',
      monastery: 'මාලබේ අසපුව',
      host: 'බොතේජු පවුල',
      monkCount: 12,
      laypersonCount: 20,
      categories: ['බත්', 'හොදි', 'පිරිකර'],
    })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    expect(await screen.findByRole('heading', { level: 1, name: 'නොවැම්බර් 08 · දහවල් දානය' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'මාලබේ අසපුව · ඉරිදා' })).toBeInTheDocument()
    expect(screen.getByText('බොතේජු පවුල')).toBeInTheDocument()
    expect(screen.getByText('ස්වාමීන් වහන්සේලා').parentElement).toHaveTextContent('ස්වාමීන් වහන්සේලා 12')
    expect(screen.getByText('ගිහි').parentElement).toHaveTextContent('ගිහි 20')
    expect(screen.getByText('මුළු').parentElement).toHaveTextContent('මුළු 32')

    const tabs = screen.getByRole('navigation', { name: 'දාන කොටස්' })
    expect(within(tabs).getByRole('link', { name: 'මෙනුව' })).toHaveAttribute('aria-current', 'page')

    const categories = await screen.findAllByRole('button', { expanded: true })
    expect(categories.map((c) => c.textContent)).toEqual([
      expect.stringContaining('බත්'),
      expect.stringContaining('හොදි'),
      expect.stringContaining('පිරිකර'),
    ])

    await user.click(within(tabs).getByRole('link', { name: 'මුදල් හා ලේඛන' }))
    expect(currentPath()).toBe(`/events/${eventId}/money`)
    expect(within(tabs).getByRole('link', { name: 'මුදල් හා ලේඛන' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(tabs).getByRole('link', { name: 'විස්තර' }))
    expect(currentPath()).toBe(`/events/${eventId}/edit`)
  })

  it('adds an item under a category from its row, with a quantity, unit and notes', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්', 'පිරිකර'] })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const rice = await screen.findByRole('region', { name: 'බත්' })
    await user.click(within(rice).getByRole('link', { name: 'Item එකක් එක් කරන්න' }))
    expect(currentPath()).toMatch(new RegExp(`^/events/${eventId}/items/new\\?category=[0-9a-f-]{36}$`))

    const sheet = await screen.findByRole('dialog', { name: 'අළුත් Item' })
    expect(within(sheet).getByLabelText(/කාණ්ඩය/)).toHaveDisplayValue('බත්')
    await user.type(within(sheet).getByLabelText(/^නම/), 'කිරිබත්')
    await user.type(within(sheet).getByLabelText(/අවශ්‍ය ප්‍රමාණය/), '3')
    await user.selectOptions(within(sheet).getByLabelText('ඒකකය'), 'kg')
    await user.type(within(sheet).getByLabelText(/සටහන්/), 'කිරි වැඩිපුර')
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}`)
    const item = await within(rice).findByRole('link', { name: /කිරිබත්/ })
    expect(item).toHaveTextContent('කි.ග්‍රෑ. 3')
  })

  it('adds a requisite with a typed unit from the floating Item button', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්', 'පිරිකර'] })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'Item' }))
    const sheet = await screen.findByRole('dialog', { name: 'අළුත් Item' })
    await user.selectOptions(within(sheet).getByLabelText(/කාණ්ඩය/), 'පිරිකර')
    await user.type(within(sheet).getByLabelText(/^නම/), 'සිවුරු')
    await user.type(within(sheet).getByLabelText(/අවශ්‍ය ප්‍රමාණය/), '12')
    await user.selectOptions(within(sheet).getByLabelText('ඒකකය'), 'other')
    await user.type(within(sheet).getByLabelText('ඒකකයේ නම'), 'කට්ටල')
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    const requisites = screen.getByRole('region', { name: 'පිරිකර' })
    expect(await within(requisites).findByRole('link', { name: /සිවුරු/ })).toHaveTextContent('කට්ටල 12')
    expect(within(screen.getByRole('region', { name: 'බත්' })).queryByRole('link', { name: /සිවුරු/ })).not.toBeInTheDocument()
  })

  it('edits an item and moves it to another category', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්', 'හොදි'] })
    await seedItem(eventId, 'බත්', { name: 'පරිප්පු', requiredQuantity: 2, unit: 'kg', notes: 'සීනි නැතිව' })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    const rice = await screen.findByRole('region', { name: 'බත්' })
    await user.click(await within(rice).findByRole('link', { name: /පරිප්පු/ }))
    expect(currentPath()).toMatch(new RegExp(`^/events/${eventId}/items/[0-9a-f-]{36}/edit$`))

    const sheet = await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })
    expect(await within(sheet).findByLabelText(/^නම/)).toHaveValue('පරිප්පු')
    expect(within(sheet).getByLabelText(/අවශ්‍ය ප්‍රමාණය/)).toHaveValue(2)
    expect(within(sheet).getByLabelText('ඒකකය')).toHaveValue('kg')
    expect(within(sheet).getByLabelText(/සටහන්/)).toHaveValue('සීනි නැතිව')

    await user.clear(within(sheet).getByLabelText(/^නම/))
    await user.type(within(sheet).getByLabelText(/^නම/), 'පරිප්පු හොදි')
    await user.clear(within(sheet).getByLabelText(/අවශ්‍ය ප්‍රමාණය/))
    await user.type(within(sheet).getByLabelText(/අවශ්‍ය ප්‍රමාණය/), '1.5')
    await user.selectOptions(within(sheet).getByLabelText('ඒකකය'), 'l')
    await user.selectOptions(within(sheet).getByLabelText(/කාණ්ඩය/), 'හොදි')
    await user.click(within(sheet).getByRole('button', { name: 'සුරකින්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}`)
    const curries = screen.getByRole('region', { name: 'හොදි' })
    expect(await within(curries).findByRole('link', { name: /පරිප්පු හොදි/ })).toHaveTextContent('ලීටර් 1.5')
    expect(within(rice).queryByRole('link', { name: /පරිප්පු/ })).not.toBeInTheDocument()
  })

  it('closes a sheet on back and keeps the menu as it was underneath', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්', 'හොදි'] })
    await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    // Collapse හොදි, so we can tell the menu stayed put under the sheet.
    const curries = await screen.findByRole('region', { name: 'හොදි' })
    await user.click(within(curries).getByRole('button', { expanded: true }))
    expect(within(curries).getByRole('button', { expanded: false })).toBeInTheDocument()

    await user.click(await screen.findByRole('link', { name: /කිරිබත්/ }))
    expect(await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })).toBeInTheDocument()

    window.history.back()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(within(curries).getByRole('button', { expanded: false })).toBeInTheDocument()
    expect(within(curries).queryByRole('link', { name: 'Item එකක් එක් කරන්න' })).not.toBeInTheDocument()
  })

  it('opens a sheet from a direct link and closes it to the menu', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}/edit`, { signedInAs: organizer })

    const sheet = await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })
    expect(await within(sheet).findByLabelText(/^නම/)).toHaveValue('කිරිබත්')
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(screen.getByRole('link', { name: /කිරිබත්/ })).toBeInTheDocument()
  })

  it('deletes an item only after confirmation', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['පලතුරු'] })
    await seedItem(eventId, 'පලතුරු', { name: 'අන්නාසි' })
    await seedItem(eventId, 'පලතුරු', { name: 'කෙසෙල්' })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: /අන්නාසි/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })
    await user.click(await within(sheet).findByRole('button', { name: 'Item එක මකන්න' }))
    await user.click(screen.getByRole('button', { name: 'එපා' }))
    expect(screen.queryByRole('dialog', { name: 'අන්නාසි මකන්නද?' })).not.toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'Item එක මකන්න' }))
    const confirm = screen.getByRole('dialog', { name: 'අන්නාසි මකන්නද?' })
    await user.click(within(confirm).getByRole('button', { name: 'ඔව්, මකන්න' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(screen.queryByRole('link', { name: /අන්නාසි/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /කෙසෙල්/ })).toBeInTheDocument()
  })
})
