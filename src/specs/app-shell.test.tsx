import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedOrganizer } from '../test/seed'

describe('app shell', () => {
  it('opens the events home from the app root', async () => {
    const organizer = await seedOrganizer()
    await renderApp('/', { signedInAs: organizer })

    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })

  it('shows an empty state on the events home when the organizer has no events', async () => {
    const organizer = await seedOrganizer()
    await renderApp('/events', { signedInAs: organizer })

    expect(await screen.findByText('නමෝ බුද්ධාය!')).toBeInTheDocument()
    expect(await screen.findByText('තවම දාන කිසිවක් නැත')).toBeInTheDocument()
    expect(screen.queryByText(/පළමු දානය/)).not.toBeInTheDocument()
  })

  it('opens settings from the events home', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events', { signedInAs: organizer })

    const settings = await screen.findByRole('link', { name: 'Settings' })
    await user.click(settings)
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(currentPath()).toBe('/settings')
  })

  it('moves between events, search and contributors with the bottom tab bar', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events', { signedInAs: organizer })
    const tabs = within(await screen.findByRole('navigation', { name: 'ප්‍රධාන' }))

    expect(tabs.getByRole('link', { name: 'දාන' })).toHaveAttribute('aria-current', 'page')

    await user.click(tabs.getByRole('link', { name: 'Search' }))
    expect(await screen.findByRole('heading', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByText('සොයන්න හෝ filter කරන්න')).toBeInTheDocument()
    expect(screen.queryByText(/අයිතමයක්, දායකයෙක්/)).not.toBeInTheDocument()
    expect(currentPath()).toBe('/search')
    expect(tabs.getByRole('link', { name: 'Search' })).toHaveAttribute('aria-current', 'page')

    await user.click(tabs.getByRole('link', { name: 'දායකයන්' }))
    expect(await screen.findByRole('heading', { name: 'දායකයන්' })).toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')

    await user.click(tabs.getByRole('link', { name: 'දාන' }))
    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })

  it('shows a not-found page for unknown paths that leads back to events', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/no-such-page', { signedInAs: organizer })

    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByText('මෙම සබැඳිය වැරදියි, නැතහොත් එය ඉවත් කර ඇත.')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'ප්‍රධාන' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'දාන වෙත යන්න' }))
    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })

  it('sends a signed-out visit to an unknown path to the login screen first', async () => {
    await renderApp('/no-such-page')

    expect(await screen.findByLabelText('නම')).toBeInTheDocument()
    expect(currentPath()).toBe('/login?next=%2Fno-such-page')
  })
})
