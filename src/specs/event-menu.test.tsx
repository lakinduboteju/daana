import { screen, within } from '@testing-library/react'
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
})
