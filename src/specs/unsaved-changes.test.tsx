import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedAssignment, seedContributor, seedEvent, seedHousehold, seedItem } from '../test/seed'

const PROMPT = 'වෙනස්කම් ඉවත දමන්නද?'

/** Answers the unsaved-changes prompt. */
async function answer(user: Awaited<ReturnType<typeof renderApp>>['user'], button: 'එපා' | 'ඉවත දමන්න') {
  const prompt = await screen.findByRole('dialog', { name: PROMPT })
  await user.click(within(prompt).getByRole('button', { name: button }))
}

describe('unsaved changes', () => {
  it('closing an item sheet with changes asks first; staying keeps what was typed', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'Item' }))
    const sheet = await screen.findByRole('dialog', { name: 'අළුත් Item' })
    await user.type(within(sheet).getByLabelText(/^නම/), 'කිරිබත්')
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))

    await answer(user, 'එපා')
    expect(within(sheet).getByLabelText(/^නම/)).toHaveValue('කිරිබත්')
    expect(currentPath()).toBe(`/events/${eventId}/items/new`)

    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))
    await answer(user, 'ඉවත දමන්න')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'අළුත් Item' })).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}`)
  })

  it('closing an untouched item sheet, or deleting an edited item, does not ask', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}/edit`, { signedInAs: organizer })

    let sheet = await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })
    await within(sheet).findByLabelText(/^නම/)
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))
    await waitFor(() => expect(currentPath()).toBe(`/events/${eventId}/items/${itemId}`))

    await user.click(await screen.findByRole('link', { name: 'Item එක සංස්කරණය කරන්න' }))
    sheet = await screen.findByRole('dialog', { name: 'Item සංස්කරණය' })
    await user.type(await within(sheet).findByLabelText(/^නම/), ' 2')
    await user.click(within(sheet).getByRole('button', { name: 'Item එක මකන්න' }))
    await user.click(within(screen.getByRole('dialog', { name: 'කිරිබත් මකන්නද?' })).getByRole('button', { name: 'ඔව්, මකන්න' }))

    await waitFor(() => expect(currentPath()).toBe(`/events/${eventId}`))
    expect(screen.queryByRole('dialog', { name: PROMPT })).not.toBeInTheDocument()
  })

  it('leaving the contributor form with changes asks first', async () => {
    const { householdId, organizer } = await seedHousehold()
    const contributorId = await seedContributor(householdId, 'නිමල් සිල්වා')
    const { user } = await renderApp(`/contributors/${contributorId}/edit`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText('සටහන්'), 'උදේට කතා කරන්න')
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await answer(user, 'එපා')
    expect(currentPath()).toBe(`/contributors/${contributorId}/edit`)
    expect(screen.getByLabelText('සටහන්')).toHaveValue('උදේට කතා කරන්න')

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await answer(user, 'ඉවත දමන්න')
    await waitFor(() => expect(currentPath()).toBe('/contributors'))
  })

  it('archiving an edited contributor does not ask', async () => {
    const { householdId, organizer } = await seedHousehold()
    const contributorId = await seedContributor(householdId, 'නිමල් සිල්වා')
    const { user } = await renderApp(`/contributors/${contributorId}/edit`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText('සටහන්'), 'උදේට කතා කරන්න')
    await user.click(screen.getByRole('button', { name: 'Archive කරන්න' }))
    await waitFor(() => expect(currentPath()).toBe('/contributors'))
    expect(screen.queryByRole('dialog', { name: PROMPT })).not.toBeInTheDocument()
  })

  it('closing the assign sheet after picking someone asks first', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    await seedContributor(householdId, 'අනුලා විජේසේකර')
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}/assign`, { signedInAs: organizer })

    const sheet = await screen.findByRole('dialog', { name: 'කිරිබත් — දායකයා' })
    await user.click(await within(sheet).findByRole('radio', { name: /අනුලා විජේසේකර/ }))
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))
    await answer(user, 'එපා')
    expect(within(sheet).getByRole('radio', { name: /අනුලා විජේසේකර/ })).toBeChecked()

    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))
    await answer(user, 'ඉවත දමන්න')
    await waitFor(() => expect(currentPath()).toBe(`/events/${eventId}/items/${itemId}`))
  })

  it('closing the edit-assignment sheet with a changed quantity asks first', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const itemId = await seedItem(eventId, 'බත්', { name: 'සුදු බත්', requiredQuantity: 3, unit: 'kg' })
    const nimal = await seedContributor(householdId, 'නිමල් සිල්වා')
    await seedAssignment(itemId, nimal, { quantity: 1 })
    const { user } = await renderApp(`/events/${eventId}/items/${itemId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'නිමල් සිල්වා — පැවරුම සංස්කරණය' }))
    const sheet = await screen.findByRole('dialog', { name: 'පැවරුම සංස්කරණය' })
    await user.type(within(sheet).getByLabelText(/ප්‍රමාණය/), '5')
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))
    await answer(user, 'ඉවත දමන්න')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'පැවරුම සංස්කරණය' })).not.toBeInTheDocument())
    expect(currentPath()).toBe(`/events/${eventId}/items/${itemId}`)
  })

  it('leaving settings with a half-typed new password asks first', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/settings', { signedInAs: organizer })

    await user.type(await screen.findByLabelText('අළුත් මුරපදය'), 'new-pass')
    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await answer(user, 'එපා')
    expect(currentPath()).toBe('/settings')
    expect(screen.getByLabelText('අළුත් මුරපදය')).toHaveValue('new-pass')
  })
})
