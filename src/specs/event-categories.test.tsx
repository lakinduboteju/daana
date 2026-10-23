import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedEvent, seedHousehold } from '../test/seed'

describe('editing an event’s categories', () => {
  it('opens from the menu, lists the categories in order, and a rename shows on the menu', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්', 'හොදි', 'පිරිකර'] })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'Edit Categories' }))
    expect(currentPath()).toBe(`/events/${eventId}/categories`)
    expect(await categoryNames()).toEqual(['බත්', 'හොදි', 'පිරිකර'])

    await user.click(screen.getByRole('button', { name: 'හොදි නම වෙනස් කරන්න' }))
    const name = screen.getByLabelText('කාණ්ඩයේ නම')
    await user.clear(name)
    await user.type(name, 'හොදි වර්ග')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත්', 'හොදි වර්ග', 'පිරිකර']))

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    await expectMenu(['බත්', 'හොදි වර්ග', 'පිරිකර'])
  })
})

async function categoryNames() {
  const list = await screen.findByRole('list', { name: 'කාණ්ඩ' })
  return within(list).getAllByRole('listitem').map((item) => item.textContent)
}

/** The menu shows exactly these categories, top to bottom. */
async function expectMenu(names: string[]) {
  const sections = await Promise.all(names.map((name) => screen.findByRole('region', { name })))
  const allSections = screen.getAllByRole('button', { expanded: true }).map((toggle) => toggle.closest('section'))
  expect(allSections).toEqual(sections)
}
