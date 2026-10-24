import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedEvent, seedOrganizer } from '../test/seed'

function goTo(path: string) {
  window.history.pushState(null, '', `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** The ⋮ button on the card whose link names this event. Two events can share a monastery. */
async function moreMenu(event: RegExp) {
  const card = (await screen.findByRole('link', { name: event })).parentElement
  if (!card) throw new Error('event card')
  return within(card).getByRole('button', { name: /තවත් විකල්ප/ })
}

describe('editing an event', () => {
  it('opens the form prefilled and keeps the saved changes', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, {
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
    expect(await screen.findByLabelText(/^අසපුව/)).toHaveValue('මාලබේ අසපුව')
    await user.click(screen.getByText('අමතර විස්තර (optional)'))
    expect(screen.getByLabelText('ස්වාමීන් වහන්සේලා')).toHaveValue('12')
    expect(screen.getByLabelText('ගිහි පිරිස')).toHaveValue('20')

    await user.clear(screen.getByLabelText(/දානය භාරගත් අය/))
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), 'සිල්වා පවුල')
    await user.clear(screen.getByLabelText(/දිනය/))
    await user.type(screen.getByLabelText(/දිනය/), '2099-11-07')
    await user.click(screen.getByRole('radio', { name: 'හීල් දානය' }))
    await user.click(screen.getByRole('button', { name: 'ස්වාමීන් වහන්සේලා වැඩි කරන්න' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

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
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දානය භාරගත් අය/), ' සහ දරුවන්')
    await user.click(screen.getByRole('link', { name: 'මෙනුව' }))
    const prompt = await screen.findByRole('dialog', { name: 'වෙනස්කම් ඉවත දමන්නද?' })
    expect(currentPath()).toBe(`/events/${eventId}/edit`)

    await user.click(within(prompt).getByRole('button', { name: 'එපා' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/දානය භාරගත් අය/)).toHaveValue('බොතේජු පවුල සහ දරුවන්')

    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    await user.click(await screen.findByRole('button', { name: 'ඉවත දමන්න' }))
    expect(currentPath()).toBe(`/events/${eventId}`)

    goTo(`/events/${eventId}/edit`)
    expect(await screen.findByLabelText(/දානය භාරගත් අය/)).toHaveValue('බොතේජු පවුල')
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), ' සහ දරුවන්')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('status')
    await user.click(screen.getByRole('link', { name: 'මෙනුව' }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancels an event, marks it cancelled on its card and screen, and undoes the cancellation', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: colomboDate(4), host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'දානය Cancel කරන්න' }))
    expect(await screen.findByRole('status')).toHaveTextContent('දානය Cancel කළා')
    expect(await screen.findByRole('button', { name: 'දානය නැවත සක්‍රීය කරන්න' })).toBeInTheDocument()
    expect(screen.getByText('මෙම දානය Cancel කර ඇත. එහි විස්තර සියල්ල තවමත් සුරැකී ඇත.')).toBeInTheDocument()

    goTo(`/events/${eventId}`)
    expect(await screen.findByText('Cancelled')).toBeInTheDocument()

    goTo('/events')
    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    expect(within(upcoming).getByRole('link', { name: /බොතේජු පවුල/ })).toHaveTextContent('Cancelled')

    goTo(`/events/${eventId}/edit`)
    await user.click(await screen.findByRole('button', { name: 'දානය නැවත සක්‍රීය කරන්න' }))
    expect(await screen.findByRole('button', { name: 'දානය Cancel කරන්න' })).toBeInTheDocument()

    goTo('/events')
    const card = within(await screen.findByRole('region', { name: 'ඉදිරි දාන' })).getByRole('link', { name: /බොතේජු පවුල/ })
    await waitFor(() => expect(card).not.toHaveTextContent('Cancelled'))
  })

  it('marks a cancelled past event in the past list', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: colomboDate(-4), host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })
    await user.click(await screen.findByRole('button', { name: 'දානය Cancel කරන්න' }))
    await screen.findByRole('button', { name: 'දානය නැවත සක්‍රීය කරන්න' })

    goTo('/events')
    const past = await screen.findByRole('region', { name: 'පසුගිය දාන' })
    expect(within(past).getByRole('link', { name: /බොතේජු පවුල/ })).toHaveTextContent('Cancelled')
  })

  it('asks before leaving a half-filled new event', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('button', { name: 'ඉවත දමන්න' }))
    expect(currentPath()).toBe('/events')
  })
})

describe('event card more-menu', () => {
  it('names the monastery on the more-menu', async () => {
    const organizer = await seedOrganizer()
    await seedEvent(organizer, { date: colomboDate(3), host: 'බොතේජු පවුල', monastery: 'මාලබේ අසපුව' })
    await renderApp('/events', { signedInAs: organizer })

    expect(await screen.findByRole('button', { name: 'මාලබේ අසපුව: තවත් විකල්ප' })).toBeInTheDocument()
  })

  it('opens the edit form from a card', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: colomboDate(3), host: 'බොතේජු පවුල' })
    const { user } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'මාලබේ අසපුව: තවත් විකල්ප' }))
    await user.click(screen.getByRole('link', { name: 'Edit' }))
    expect(currentPath()).toBe(`/events/${eventId}/edit`)
    expect(await screen.findByDisplayValue('බොතේජු පවුල')).toBeInTheDocument()
  })

  it('deletes an event after a confirmation that says what will be lost', async () => {
    const organizer = await seedOrganizer()
    await seedEvent(organizer, { date: colomboDate(3), host: 'බොතේජු පවුල' })
    await seedEvent(organizer, { date: colomboDate(3), host: 'සිල්වා පවුල' })
    const { user } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await moreMenu(/බොතේජු පවුල/))
    await user.click(screen.getByRole('button', { name: 'මකන්න' }))
    const confirm = screen.getByRole('dialog', { name: /^මාලබේ අසපුව · බොතේජු පවුල · .+ දහවල් දානය මකන්නද\?$/ })
    expect(confirm).toHaveTextContent('මෙනුව')
    expect(confirm).toHaveTextContent('පැවරීම්')
    expect(confirm).toHaveTextContent('ගෙවීම්')
    expect(confirm).toHaveTextContent('ලේඛන')
    expect(confirm).not.toHaveTextContent('කාණ්ඩ සහ අයිතම')
    expect(confirm).toHaveTextContent('දානය Cancel කරන්න')

    await user.click(within(confirm).getByRole('button', { name: 'එපා' }))
    expect(screen.getByRole('link', { name: /බොතේජු පවුල/ })).toBeInTheDocument()

    await user.click(await moreMenu(/බොතේජු පවුල/))
    await user.click(screen.getByRole('button', { name: 'මකන්න' }))
    await user.click(screen.getByRole('button', { name: 'ඔව්, මකන්න' }))

    expect(await screen.findByRole('status')).toHaveTextContent('දානය මකා දැමුවා')
    await waitFor(() => expect(screen.queryByRole('link', { name: /බොතේජු පවුල/ })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: /සිල්වා පවුල/ })).toBeInTheDocument()
  })

  it('past events have the same more-menu: edit, copy and delete', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: colomboDate(-30), host: 'බොතේජු පවුල' })
    await seedEvent(organizer, { date: colomboDate(-60), host: 'සිල්වා පවුල' })
    const { user } = await renderApp('/events', { signedInAs: organizer })

    const past = await screen.findByRole('region', { name: 'පසුගිය දාන' })
    await user.click(await moreMenu(/බොතේජු පවුල/))
    expect(within(past).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', expect.stringMatching(new RegExp(`/events/${eventId}/edit$`)))
    expect(within(past).getByRole('link', { name: 'පිටපත් කරන්න' })).toHaveAttribute('href', expect.stringMatching(new RegExp(`/events/new\\?from=${eventId}$`)))

    await user.click(within(past).getByRole('button', { name: 'මකන්න' }))
    await user.click(within(screen.getByRole('dialog', { name: /^මාලබේ අසපුව · බොතේජු පවුල · .+ දහවල් දානය මකන්නද\?$/ })).getByRole('button', { name: 'ඔව්, මකන්න' }))
    expect(await screen.findByRole('status')).toHaveTextContent('දානය මකා දැමුවා')
    await waitFor(() => expect(within(past).queryByRole('link', { name: /බොතේජු පවුල/ })).not.toBeInTheDocument())
    expect(within(past).getByRole('link', { name: /සිල්වා පවුල/ })).toBeInTheDocument()
  })

  it('deletes an event from its details screen and returns to the events home', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: colomboDate(3), host: 'බොතේජු පවුල' })
    const { user } = await renderApp(`/events/${eventId}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'දානය මකන්න' }))
    await user.click(await screen.findByRole('button', { name: 'ඔව්, මකන්න' }))

    expect(await screen.findByText('තවම දාන කිසිවක් නැත')).toBeInTheDocument()
    expect(currentPath()).toBe('/events')

    goTo(`/events/${eventId}`)
    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
  })
})
