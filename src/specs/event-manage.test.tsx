import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedEvent, seedHousehold } from '../test/seed'

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

  it('asks before leaving with unsaved changes, and not once they are saved', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දානය භාරගත් අය/), ' සහ දරුවන්')
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    const prompt = await screen.findByRole('dialog', { name: 'වෙනස්කම් ඉවත දමන්නද?' })
    expect(currentPath()).toBe(`/events/${eventId}/edit`)

    await user.click(within(prompt).getByRole('button', { name: 'එපා' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/දානය භාරගත් අය/)).toHaveValue('බොතේජු පවුල සහ දරුවන්')

    await user.click(screen.getByRole('link', { name: 'අවලංගු' }))
    await user.click(await screen.findByRole('button', { name: 'ඉවත දමන්න' }))
    expect(currentPath()).toBe(`/events/${eventId}`)

    goTo(`/events/${eventId}/edit`)
    expect(await screen.findByLabelText(/දානය භාරගත් අය/)).toHaveValue('බොතේජු පවුල')
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), ' සහ දරුවන්')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))
    await screen.findByRole('status')
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancels an event, marks it cancelled on its card and screen, and undoes the cancellation', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: colomboDate(4), host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'දානය අවලංගු කරන්න' }))
    expect(await screen.findByRole('status')).toHaveTextContent('දානය අවලංගු කළා')
    expect(await screen.findByRole('button', { name: 'අවලංගු කිරීම ඉවත් කරන්න' })).toBeInTheDocument()

    goTo(`/events/${eventId}`)
    expect(await screen.findByText('අවලංගුයි')).toBeInTheDocument()

    goTo('/events')
    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    expect(within(upcoming).getByRole('link', { name: /බොතේජු පවුල/ })).toHaveTextContent('අවලංගුයි')

    goTo(`/events/${eventId}/edit`)
    await user.click(await screen.findByRole('button', { name: 'අවලංගු කිරීම ඉවත් කරන්න' }))
    expect(await screen.findByRole('button', { name: 'දානය අවලංගු කරන්න' })).toBeInTheDocument()

    goTo('/events')
    const card = within(await screen.findByRole('region', { name: 'ඉදිරි දාන' })).getByRole('link', { name: /බොතේජු පවුල/ })
    await waitFor(() => expect(card).not.toHaveTextContent('අවලංගුයි'))
  })

  it('marks a cancelled past event in the past list', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: colomboDate(-4), host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })
    await user.click(await screen.findByRole('button', { name: 'දානය අවලංගු කරන්න' }))
    await screen.findByRole('button', { name: 'අවලංගු කිරීම ඉවත් කරන්න' })

    goTo('/events')
    const past = await screen.findByRole('region', { name: 'පසුගිය දාන' })
    expect(within(past).getByRole('link', { name: /බොතේජු පවුල/ })).toHaveTextContent('අවලංගුයි')
  })

  it('asks before leaving a half-filled new event', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('button', { name: 'ඉවත දමන්න' }))
    expect(currentPath()).toBe('/events')
  })
})
