import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedOrganizer } from '../test/seed'

// An organizer is ready as soon as their user exists: no other setup step.
describe('a new organizer', () => {
  it('saves an event without a host, and it starts with the default categories', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-09')
    await user.type(screen.getByLabelText(/^අසපුව/), 'මාලබේ අසපුව')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: /මාලබේ අසපුව/ })).toBeInTheDocument()
    expect(currentPath()).toMatch(/^\/events\/[0-9a-f-]{36}$/)
    expect(await screen.findByText('බත්')).toBeInTheDocument()
    expect(screen.getByText('ඖෂධ')).toBeInTheDocument()
  })

  it('saves an event with a host', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-09')
    await user.type(screen.getByLabelText(/^අසපුව/), 'මාලබේ අසපුව')
    await user.type(screen.getByLabelText(/දානය භාරගත් අය/), 'බොතේජු පවුල')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('heading', { name: /මාලබේ අසපුව/ })).toBeInTheDocument()
    expect(currentPath()).toMatch(/^\/events\/[0-9a-f-]{36}$/)
  })

  it('adds a contributor', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/contributors/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText('නම'), 'QA TEST Contributor')
    await user.type(screen.getByLabelText('දුරකථන අංකය'), '0771234567')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('QA TEST Contributor')).toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')
  })

  it('adds a category template after the nine defaults', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/settings/categories', { signedInAs: organizer })

    const list = await screen.findByRole('list', { name: 'කාණ්ඩ' })
    expect(await within(list).findByText('ඖෂධ')).toBeInTheDocument()
    await user.type(screen.getByLabelText('අළුත් ආහාර කාණ්ඩයක් (Category)'), 'දන්සල් බීම')
    await user.click(screen.getByRole('button', { name: 'එක් කරන්න' }))

    expect(await screen.findByText('දන්සල් බීම')).toBeInTheDocument()
  })
})
