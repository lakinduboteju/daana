import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'

describe('signing in', () => {
  it('sends a signed-out organizer to the login screen, remembering where they were going', async () => {
    await renderApp('/events')

    expect(await screen.findByLabelText('නම')).toBeInTheDocument()
    expect(screen.getByLabelText('මුරපදය')).toBeInTheDocument()
    expect(currentPath()).toBe('/login?next=%2Fevents')
  })
})
