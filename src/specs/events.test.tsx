import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('events', () => {
  it('creates an event with a new monastery and shows it as a card on the events home', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'අළුත් දානයක්' }))
    expect(currentPath()).toBe('/events/new')

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.click(screen.getByRole('radio', { name: 'දහවල් දානය' }))
    await user.type(await screen.findByLabelText('අසපුවේ නම'), 'මාලබේ අසපුව')
    await user.type(screen.getByLabelText(/ස්ථානය/), 'මාලබේ')
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), 'බොතේජු පවුල')
    await user.clear(screen.getByLabelText('ස්වාමීන් වහන්සේලා'))
    await user.type(screen.getByLabelText('ස්වාමීන් වහන්සේලා'), '12')
    await user.click(screen.getByRole('button', { name: 'ගිහි පිරිස වැඩි කරන්න' }))
    await user.click(screen.getByRole('button', { name: 'ගිහි පිරිස වැඩි කරන්න' }))
    expect(screen.getByText('මුළු පිරිස (ස්වයංක්‍රීයව)').parentElement).toHaveTextContent('14')

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
})
