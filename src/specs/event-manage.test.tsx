import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedEvent, seedHousehold } from '../test/seed'

function goTo(path: string) {
  window.history.pushState(null, '', `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

describe('editing an event', () => {
  it('opens the form prefilled and keeps the saved changes', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, {
      date: '2099-11-08',
      meal: 'lunch',
      host: 'බොතේජු පවුල',
      monastery: 'මාලබේ අසපුව',
      monkCount: 12,
      laypersonCount: 20,
    })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })

    expect(await screen.findByDisplayValue('බොතේජු පවුල')).toBeInTheDocument()
    expect(screen.getByLabelText(/දිනය/)).toHaveValue('2099-11-08')
    expect(screen.getByRole('radio', { name: 'දහවල් දානය' })).toBeChecked()
    expect(await screen.findByRole('radio', { name: 'මාලබේ අසපුව' })).toBeChecked()
    expect(screen.getByLabelText('ස්වාමීන් වහන්සේලා')).toHaveValue('12')
    expect(screen.getByLabelText('ගිහි පිරිස')).toHaveValue('20')

    await user.clear(screen.getByLabelText(/දානය භාරගත් අය/))
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), 'සිල්වා පවුල')
    await user.clear(screen.getByLabelText(/දිනය/))
    await user.type(screen.getByLabelText(/දිනය/), '2099-11-07')
    await user.click(screen.getByRole('radio', { name: 'හීල් දානය' }))
    await user.click(screen.getByRole('button', { name: 'ස්වාමීන් වහන්සේලා වැඩි කරන්න' }))
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))

    expect(await screen.findByRole('status')).toHaveTextContent('සුරැකිණි')

    goTo('/events')
    const day = await screen.findByRole('region', { name: 'නොවැම්බර් 07 සෙනසුරාදා' })
    const card = within(day).getByRole('link', { name: /සිල්වා පවුල/ })
    expect(card).toHaveTextContent('හීල් දානය')
    expect(card).toHaveTextContent('ස්වාමීන් වහන්සේලා 13')
    expect(screen.queryByText('බොතේජු පවුල')).not.toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })
})
