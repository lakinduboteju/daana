import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('changing the password', () => {
  it('lets the organizer sign in with the new password, and not the old one', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/settings', { signedInAs: organizer })

    await user.type(await screen.findByLabelText('අළුත් මුරපදය'), 'new-password-456')
    await user.type(screen.getByLabelText('අළුත් මුරපදය නැවත'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'මුරපදය වෙනස් කරන්න' }))
    expect(await screen.findByRole('status')).toHaveTextContent('මුරපදය වෙනස් කළා')

    await user.click(screen.getByRole('button', { name: 'ඉවත් වන්න' }))
    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('මුරපදය'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'ඇතුළු වන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('නම හෝ මුරපදය වැරදියි')

    await user.clear(screen.getByLabelText('මුරපදය'))
    await user.type(screen.getByLabelText('මුරපදය'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'ඇතුළු වන්න' }))
    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })

  it('refuses a password shorter than 8 characters or one that does not match', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/settings', { signedInAs: organizer })

    await user.type(await screen.findByLabelText('අළුත් මුරපදය'), 'short')
    await user.type(screen.getByLabelText('අළුත් මුරපදය නැවත'), 'short')
    await user.click(screen.getByRole('button', { name: 'මුරපදය වෙනස් කරන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('මුරපදයට අවම වශයෙන් අකුරු 8ක් තිබිය යුතුයි')

    await user.clear(screen.getByLabelText('අළුත් මුරපදය'))
    await user.clear(screen.getByLabelText('අළුත් මුරපදය නැවත'))
    await user.type(screen.getByLabelText('අළුත් මුරපදය'), 'new-password-456')
    await user.type(screen.getByLabelText('අළුත් මුරපදය නැවත'), 'new-password-789')
    await user.click(screen.getByRole('button', { name: 'මුරපදය වෙනස් කරන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('මුරපද දෙක එක සමාන නොවේ')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
