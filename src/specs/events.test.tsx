import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedEvent, seedOrganizer } from '../test/seed'

describe('events', () => {
  it('saves the calendar date the organizer picked and shows that date when they edit', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })
    const date = await screen.findByLabelText(/දිනය/)

    await user.type(date, '2099-11-08')
    expect(date).toHaveValue('2099-11-08')
    await user.type(screen.getByLabelText(/^අසපුව/), 'මාලබේ අසපුව')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: 'නොවැම්බර් 08 · දහවල් දානය' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Edit' }))
    expect(await screen.findByLabelText(/දිනය/)).toHaveValue('2099-11-08')
  })

  it('creates the event and opens its menu once the date, meal and monastery are filled', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('radio', { name: 'දහවල් දානය' }))
    await user.type(screen.getByLabelText(/^අසපුව/), 'මාලබේ අසපුව')

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeEnabled()
    await user.click(save)

    expect(await screen.findByRole('heading', { name: /මාලබේ අසපුව/ })).toBeInTheDocument()
    expect(currentPath()).toMatch(/^\/events\/[0-9a-f-]{36}$/)
  })

  it('creates an event with a new monastery and shows it as a card on the events home', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'අළුත් දානයක්' }))
    expect(currentPath()).toBe('/events/new')

    const date = await screen.findByLabelText(/දිනය/)
    await user.type(date, '2099-11-08')
    expect(date).toHaveValue('2099-11-08')
    expect(screen.getByLabelText('දානය භාරගත් අය (optional)')).not.toHaveAttribute('placeholder')
    expect(screen.getByText('අමතර විස්තර (optional)')).toBeInTheDocument()
    expect(screen.queryByText(/අවශ්‍ය නම් පමණක්/)).not.toBeInTheDocument()
    expect(screen.queryByText('මෙනුව සහ කාණ්ඩ පමණක් · තහවුරු කිරීම් නැවත ආරම්භ වේ')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'දහවල් දානය' }))
    const monastery = screen.getByLabelText(/^අසපුව/)
    expect(monastery).not.toHaveAttribute('placeholder')
    expect(screen.queryByLabelText(/ස්ථානය/)).not.toBeInTheDocument()
    expect(screen.queryByText(/උදා:/)).not.toBeInTheDocument()
    await user.type(monastery, 'මාලබේ අසපුව')
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), 'බොතේජු පවුල')
    await user.click(screen.getByText('අමතර විස්තර (optional)'))
    const more = screen.getByText('අමතර විස්තර (optional)').closest('details')
    if (!more) throw new Error('optional disclosure')
    await user.clear(within(more).getByLabelText('ස්වාමීන් වහන්සේලා'))
    await user.type(within(more).getByLabelText('ස්වාමීන් වහන්සේලා'), '12')
    await user.click(within(more).getByRole('button', { name: 'ගිහි පිරිස වැඩි කරන්න' }))
    await user.click(within(more).getByRole('button', { name: 'ගිහි පිරිස වැඩි කරන්න' }))
    expect(within(more).getByText('මුළු පිරිස').parentElement).toHaveTextContent('14')
    expect(screen.queryByText(/ස්වයංක්‍රීයව/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: /මාලබේ අසපුව/ })).toBeInTheDocument()
    expect(currentPath()).toMatch(/^\/events\/[0-9a-f-]{36}$/)

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    const day = within(upcoming).getByRole('region', { name: 'නොවැම්බර් 08 ඉරිදා' })
    const card = within(day).getByRole('link', { name: /බොතේජු පවුල/ })
    expect(card).toHaveTextContent('දහවල් දානය')
    expect(card).toHaveTextContent('මාලබේ අසපුව')
    expect(card).toHaveTextContent('ස්වාමීන් වහන්සේලා 12')
    expect(card).toHaveTextContent('ගිහි පිරිස 2')
    expect(card).toHaveTextContent('මෙනුවක් නැත')
  })

  it("lists today's events (in Sri Lanka) as upcoming and yesterday's as past", async () => {
    const organizer = await seedOrganizer()
    await seedEvent(organizer, { date: colomboDate(-1), host: 'ඊයේ පවුල' })
    await seedEvent(organizer, { date: colomboDate(0), host: 'අද පවුල' })
    await seedEvent(organizer, { date: colomboDate(5), host: 'ඉදිරි පවුල' })
    await renderApp('/events', { signedInAs: organizer })

    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    const past = screen.getByRole('region', { name: 'පසුගිය දාන' })
    expect(within(upcoming).getByRole('link', { name: /අද පවුල/ })).toBeInTheDocument()
    expect(within(upcoming).getByText('අද')).toBeInTheDocument()
    expect(within(upcoming).getByRole('link', { name: /ඉදිරි පවුල/ })).toBeInTheDocument()
    expect(within(upcoming).queryByRole('link', { name: /ඊයේ පවුල/ })).not.toBeInTheDocument()
    expect(within(past).getByRole('link', { name: /ඊයේ පවුල/ })).toBeInTheDocument()
    expect(within(past).queryByRole('link', { name: /අද පවුල/ })).not.toBeInTheDocument()

    // Upcoming events come soonest first.
    const hosts = within(upcoming).getAllByRole('link').map((link) => link.textContent)
    expect(hosts[0]).toContain('අද පවුල')
    expect(hosts[1]).toContain('ඉදිරි පවුල')
  })

  it("never shows organizer A's events or monasteries to organizer B", async () => {
    const a = await seedOrganizer()
    const b = await seedOrganizer()
    const aEventId = await seedEvent(a, { date: colomboDate(2), host: 'A පවුල', monastery: 'A අසපුව' })

    const { user } = await renderApp('/events', { signedInAs: b })
    expect(await screen.findByText('තවම දාන කිසිවක් නැත')).toBeInTheDocument()
    expect(screen.queryByText(/A පවුල/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'අළුත් දානයක්' }))
    expect(await screen.findByLabelText(/^අසපුව/)).toHaveValue('')
    expect(screen.queryByText('A අසපුව')).not.toBeInTheDocument()

    window.history.pushState(null, '', `${import.meta.env.BASE_URL}events/${aEventId}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByText(/A අසපුව/)).not.toBeInTheDocument()
  })

  it('reuses a monastery with the same trimmed name', async () => {
    const organizer = await seedOrganizer()
    await seedEvent(organizer, { date: colomboDate(-30), monastery: 'පොල්ගහවෙල අසපුව' })
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    const monastery = await screen.findByLabelText(/^අසපුව/)
    expect(screen.queryByRole('radio', { name: 'පොල්ගහවෙල අසපුව' })).not.toBeInTheDocument()
    await user.type(monastery, '   ')
    await user.type(screen.getByLabelText(/දිනය/), '2099-11-07')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('අසපුව ඇතුළත් කරන්න.')
    expect(currentPath()).toBe('/events/new')

    await user.clear(monastery)
    await user.type(monastery, '  පොල්ගහවෙල අසපුව  ')
    await user.click(screen.getByRole('radio', { name: 'හීල් දානය' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: /පොල්ගහවෙල අසපුව/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('link', { name: 'Search' }))
    const filter = await screen.findByRole('combobox', { name: 'අසපුව' })
    await waitFor(() => {
      expect(within(filter).getAllByRole('option').map((option) => option.textContent)).toEqual([
        'සියලු අසපු',
        'පොල්ගහවෙල අසපුව',
      ])
    })
  })

  it('names the monastery, then the host, on an upcoming card', async () => {
    const organizer = await seedOrganizer()
    await seedEvent(organizer, { date: colomboDate(3), meal: 'lunch', host: 'බොතේජු පවුල', monastery: 'මාලබේ අසපුව' })
    await renderApp('/events', { signedInAs: organizer })

    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    const card = within(upcoming).getByRole('link', { name: /මාලබේ අසපුව/ })
    expect(card).toHaveTextContent(/දහවල් දානය.*මාලබේ අසපුව.*බොතේජු පවුල/)
  })

  it('shows two events on the same date as separate cards under that date', async () => {
    const organizer = await seedOrganizer()
    const date = colomboDate(3)
    await seedEvent(organizer, { date, meal: 'lunch', host: 'බොතේජු පවුල', monastery: 'මාලබේ අසපුව' })
    await seedEvent(organizer, { date, meal: 'breakfast', host: 'සිල්වා පවුල', monastery: 'පොල්ගහවෙල අසපුව' })
    await renderApp('/events', { signedInAs: organizer })

    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    const days = within(upcoming).getAllByRole('region')
    expect(days).toHaveLength(1)
    const cards = within(days[0]).getAllByRole('link')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('හීල් දානය')
    expect(cards[0]).toHaveTextContent('සිල්වා පවුල')
    expect(cards[0]).toHaveTextContent('පොල්ගහවෙල අසපුව')
    expect(cards[1]).toHaveTextContent('දහවල් දානය')
    expect(cards[1]).toHaveTextContent('බොතේජු පවුල')
    expect(cards[1]).toHaveTextContent('මාලබේ අසපුව')
  })

  it('hides a zero count, and hides the total only when both counts are zero', async () => {
    const organizer = await seedOrganizer()
    const date = colomboDate(3)
    await seedEvent(organizer, { date, host: 'හිස්', monkCount: 0, laypersonCount: 0 })
    await seedEvent(organizer, { date, meal: 'breakfast', host: 'ස්වාමීන් පමණයි', monkCount: 4, laypersonCount: 0 })
    await seedEvent(organizer, { date: colomboDate(4), host: 'ගිහියන් පමණයි', monkCount: 0, laypersonCount: 6 })
    await seedEvent(organizer, { date: colomboDate(5), host: 'දෙපිරිසම', monkCount: 3, laypersonCount: 5 })
    const { user } = await renderApp('/events', { signedInAs: organizer })

    const upcoming = await screen.findByRole('region', { name: 'ඉදිරි දාන' })
    const none = within(upcoming).getByRole('link', { name: /හිස්/ })
    expect(none).not.toHaveTextContent('ස්වාමීන් වහන්සේලා')
    expect(none).not.toHaveTextContent('ගිහි පිරිස')
    expect(none).not.toHaveTextContent('මුළු')

    const monks = within(upcoming).getByRole('link', { name: /ස්වාමීන් පමණයි/ })
    expect(monks).toHaveTextContent('ස්වාමීන් වහන්සේලා 4')
    expect(monks).not.toHaveTextContent('ගිහි පිරිස')
    expect(monks).toHaveTextContent('මුළු 4')

    const lay = within(upcoming).getByRole('link', { name: /ගිහියන් පමණයි/ })
    expect(lay).toHaveTextContent('ගිහි පිරිස 6')
    expect(lay).not.toHaveTextContent('ස්වාමීන් වහන්සේලා')
    expect(lay).toHaveTextContent('මුළු 6')

    const both = within(upcoming).getByRole('link', { name: /දෙපිරිසම/ })
    expect(both).toHaveTextContent('ස්වාමීන් වහන්සේලා 3')
    expect(both).toHaveTextContent('ගිහි පිරිස 5')
    expect(both).toHaveTextContent('මුළු 8')

    await user.click(none)
    expect(await screen.findByRole('heading', { name: /හිස්|මාලබේ/ })).toBeInTheDocument()
    expect(screen.queryByText('ස්වාමීන් වහන්සේලා')).not.toBeInTheDocument()
    expect(screen.queryByText('ගිහි පිරිස')).not.toBeInTheDocument()
    expect(screen.queryByText('මුළු')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('link', { name: /ස්වාමීන් පමණයි/ }))
    expect((await screen.findByText('ස්වාමීන් වහන්සේලා')).parentElement).toHaveTextContent('ස්වාමීන් වහන්සේලා 4')
    expect(screen.getByText('මුළු').parentElement).toHaveTextContent('මුළු 4')
    expect(screen.queryByText('ගිහි පිරිස')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('link', { name: /ගිහියන් පමණයි/ }))
    expect((await screen.findByText('ගිහි පිරිස')).parentElement).toHaveTextContent('ගිහි පිරිස 6')
    expect(screen.getByText('මුළු').parentElement).toHaveTextContent('මුළු 6')
    expect(screen.queryByText('ස්වාමීන් වහන්සේලා')).not.toBeInTheDocument()
  })

  it('saves zero counts when the steppers are left untouched', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.type(screen.getByLabelText(/^අසපුව/), 'මාලබේ අසපුව')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: /මාලබේ අසපුව/ })).toBeInTheDocument()
    expect(screen.queryByText('ස්වාමීන් වහන්සේලා')).not.toBeInTheDocument()
    expect(screen.queryByText('ගිහි පිරිස')).not.toBeInTheDocument()
    expect(screen.queryByText('මුළු')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Edit' }))
    await user.click(await screen.findByText('අමතර විස්තර (optional)'))
    expect(screen.getByLabelText('ස්වාමීන් වහන්සේලා')).toHaveValue('0')
    expect(screen.getByLabelText('ගිහි පිරිස')).toHaveValue('0')
  })
})
