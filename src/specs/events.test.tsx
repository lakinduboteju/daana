import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { colomboDate, seedEvent, seedHousehold } from '../test/seed'

describe('events', () => {
  it('keeps the organizer on the form when the date is not a real dd/mm/yyyy date', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })
    const date = await screen.findByLabelText(/දිනය/)

    await user.type(date, '2099-11-08')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('වලංගු දිනයක් ඇතුළත් කරන්න.')
    expect(currentPath()).toBe('/events/new')

    await user.clear(date)
    await user.type(date, '31/02/2099')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
    expect(screen.getByRole('alert')).toHaveTextContent('වලංගු දිනයක් ඇතුළත් කරන්න.')
    expect(currentPath()).toBe('/events/new')
  })

  it('creates an event with a new monastery and shows it as a card on the events home', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'අළුත් දානයක්' }))
    expect(currentPath()).toBe('/events/new')

    const date = await screen.findByLabelText(/දිනය/)
    expect(date).toHaveAttribute('placeholder', 'dd/mm/yyyy')
    await user.type(date, '08/11/2099')
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

    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
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
    const { householdId, organizer } = await seedHousehold()
    await seedEvent(householdId, { date: colomboDate(-1), host: 'ඊයේ පවුල' })
    await seedEvent(householdId, { date: colomboDate(0), host: 'අද පවුල' })
    await seedEvent(householdId, { date: colomboDate(5), host: 'ඉදිරි පවුල' })
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

  it("never shows household A's events or monasteries to household B", async () => {
    const a = await seedHousehold('බොතේජු පවුල')
    const b = await seedHousehold('සිල්වා පවුල')
    const aEventId = await seedEvent(a.householdId, { date: colomboDate(2), host: 'A පවුල', monastery: 'A අසපුව' })

    const { user } = await renderApp('/events', { signedInAs: b.organizer })
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
    const { householdId, organizer } = await seedHousehold()
    await seedEvent(householdId, { date: colomboDate(-30), monastery: 'පොල්ගහවෙල අසපුව' })
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    const monastery = await screen.findByLabelText(/^අසපුව/)
    expect(screen.queryByRole('radio', { name: 'පොල්ගහවෙල අසපුව' })).not.toBeInTheDocument()
    await user.type(monastery, '   ')
    await user.type(screen.getByLabelText(/දිනය/), '07/11/2099')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('අසපුව ඇතුළත් කරන්න.')
    expect(currentPath()).toBe('/events/new')

    await user.clear(monastery)
    await user.type(monastery, '  පොල්ගහවෙල අසපුව  ')
    await user.click(screen.getByRole('radio', { name: 'හීල් දානය' }))
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
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

  it('shows two events on the same date as separate cards under that date', async () => {
    const { householdId, organizer } = await seedHousehold()
    const date = colomboDate(3)
    await seedEvent(householdId, { date, meal: 'lunch', host: 'බොතේජු පවුල', monastery: 'මාලබේ අසපුව' })
    await seedEvent(householdId, { date, meal: 'breakfast', host: 'සිල්වා පවුල', monastery: 'පොල්ගහවෙල අසපුව' })
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
})
