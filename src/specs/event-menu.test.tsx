import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedEvent, seedHousehold } from '../test/seed'

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
})
