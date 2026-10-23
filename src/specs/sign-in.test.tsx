import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('signing in', () => {
  it('sends a signed-out organizer to the login screen, remembering where they were going', async () => {
    await renderApp('/events')

    expect(await screen.findByLabelText('නම')).toBeInTheDocument()
    expect(screen.getByLabelText('මුරපදය')).toBeInTheDocument()
    expect(currentPath()).toBe('/login?next=%2Fevents')
  })

  it('signs in with a username and returns to where the organizer was going', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/contributors')

    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('මුරපදය'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'ඇතුළු වන්න' }))

    expect(await screen.findByRole('heading', { name: 'දායකයන්' })).toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')
  })

  it('lands on the events home after signing in from the login screen', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/login')

    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('මුරපදය'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'ඇතුළු වන්න' }))

    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(screen.getByText('නමෝ බුද්ධාය!')).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })
})
