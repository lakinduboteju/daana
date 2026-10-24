import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedOrganizer } from '../test/seed'

describe('signing in', () => {
  it('sends a signed-out organizer to the login screen, remembering where they were going', async () => {
    await renderApp('/events')

    expect(await screen.findByLabelText('නම')).toHaveAttribute('placeholder', 'Username')
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByText('දායකයන්ට ගිණුමක් අවශ්‍ය නැත. සංවිධායක පමණක් ඇතුළු වේ.')).not.toBeInTheDocument()
    expect(currentPath()).toBe('/login?next=%2Fevents')
  })

  it('signs in with a username and returns to where the organizer was going', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/contributors')

    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('Password'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByRole('heading', { name: 'දායකයන්' })).toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')
  })

  it('lands on the events home after signing in from the login screen', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/login')

    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('Password'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(screen.getByText('නමෝ බුද්ධාය!')).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })

  it('shows the password when the organizer presses Show password, without signing in', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/login')

    const password = await screen.findByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(password, organizer.password)

    const show = screen.getByRole('button', { name: 'Show password' })
    await user.click(show)

    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue(organizer.password)
    expect(currentPath()).toBe('/login')
    expect(screen.queryByRole('heading', { name: 'දාන' })).not.toBeInTheDocument()
  })

  it('hides the password again when the organizer presses Hide password', async () => {
    const { user } = await renderApp('/login')

    const password = await screen.findByLabelText('Password')
    await user.type(password, 'secret-pass')
    await user.click(screen.getByRole('button', { name: 'Show password' }))

    const hide = screen.getByRole('button', { name: 'Hide password' })
    await user.click(hide)

    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveValue('secret-pass')
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
    expect(currentPath()).toBe('/login')
  })

  it('shows a Sinhala error when the password is wrong', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/login')

    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('නම හෝ Password වැරදියි.')
    expect(currentPath()).toBe('/login')
  })

  it('keeps the organizer signed in when the app is reloaded', async () => {
    const organizer = await seedOrganizer()
    const { user, unmount } = await renderApp('/login')
    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('Password'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'Login' }))
    await screen.findByRole('heading', { name: 'දාන' })

    unmount()
    await renderApp('/search')

    expect(await screen.findByRole('heading', { name: 'Search' })).toBeInTheDocument()
    expect(currentPath()).toBe('/search')
  })
})

describe('signing out', () => {
  it('returns the organizer to the login screen, and pages need signing in again', async () => {
    const organizer = await seedOrganizer()
    const { user, unmount } = await renderApp('/events', { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'Settings' }))
    await user.click(await screen.findByRole('button', { name: 'Logout' }))

    expect(await screen.findByLabelText('නම')).toBeInTheDocument()
    expect(currentPath()).toBe('/login')

    unmount()
    await renderApp('/events')
    expect(await screen.findByLabelText('නම')).toBeInTheDocument()
    expect(currentPath()).toBe('/login?next=%2Fevents')
  })
})
