import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { admin, seedEvent, seedOrganizer, seedItem } from '../test/seed'

describe('editing an event’s categories', () => {
  it('opens from the menu, lists the categories in order, and a rename shows on the menu', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', categories: ['බත්', 'හොදි', 'පිරිකර'] })
    const { user } = await renderApp(`/events/${eventId}`, { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'Edit Categories' }))
    expect(currentPath()).toBe(`/events/${eventId}/categories`)
    expect(await categoryNames()).toEqual(['බත්', 'හොදි', 'පිරිකර'])
    expect(screen.getByText('වෙනස්කම් මෙම දානයට පමණක් අදාළයි.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'හොදි නම වෙනස් කරන්න' }))
    const name = screen.getByLabelText('කාණ්ඩයේ නම')
    await user.clear(name)
    await user.type(name, 'හොදි වර්ග')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත්', 'හොදි වර්ග', 'පිරිකර']))

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    expect(currentPath()).toBe(`/events/${eventId}`)
    await expectMenu(['බත්', 'හොදි වර්ග', 'පිරිකර'])
  })

  it('moves categories up and down, saving straight away, and the menu follows', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', categories: ['බත්', 'හොදි', 'පිරිකර'] })
    const { user, unmount } = await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })

    expect(await screen.findByRole('button', { name: 'බත් ඉහළට' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'පිරිකර පහළට' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'පිරිකර ඉහළට' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත්', 'පිරිකර', 'හොදි']))
    await waitFor(() => expect(screen.getByRole('button', { name: 'බත් පහළට' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'බත් පහළට' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['පිරිකර', 'බත්', 'හොදි']))
    await waitFor(() => expect(screen.getByRole('button', { name: 'බත් පහළට' })).toBeEnabled())

    unmount()
    await renderApp(`/events/${eventId}`, { signedInAs: organizer })
    await expectMenu(['පිරිකර', 'බත්', 'හොදි'])
  })

  it('moves a category even when categories share a position', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', categories: ['බත්', 'හොදි'] })
    await admin.from('category').update({ position: 1 }).eq('event_id', eventId)
    const { user, unmount } = await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })

    const [first, second] = await categoryNames()
    await user.click(screen.getByRole('button', { name: `${second} ඉහළට` }))
    await waitFor(async () => expect(await categoryNames()).toEqual([second, first]))
    await waitFor(() => expect(screen.getByRole('button', { name: `${second} පහළට` })).toBeEnabled())

    unmount()
    await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })
    expect(await categoryNames()).toEqual([second, first])
  })

  it('adds a category last, and it shows on the menu', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', categories: ['බත්', 'හොදි'] })
    const { user } = await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })

    await user.type(await screen.findByLabelText('අළුත් ආහාර කාණ්ඩයක් (Category)'), 'දන්සල් බීම')
    await user.click(screen.getByRole('button', { name: 'එක් කරන්න' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත්', 'හොදි', 'දන්සල් බීම']))
    expect(screen.getByLabelText('අළුත් ආහාර කාණ්ඩයක් (Category)')).toHaveValue('')

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await expectMenu(['බත්', 'හොදි', 'දන්සල් බීම'])
  })

  it('warns how many items will be deleted before removing a category, and removes its items', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', categories: ['බත්', 'හොදි', 'පිරිකර'] })
    await seedItem(eventId, 'හොදි', { name: 'පරිප්පු' })
    await seedItem(eventId, 'හොදි', { name: 'අල හොදි' })
    await seedItem(eventId, 'බත්', { name: 'කිරිබත්' })
    const { user } = await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'පිරිකර ඉවත් කරන්න' }))
    expect(screen.getByRole('dialog', { name: 'පිරිකර ඉවත් කරන්නද?' })).not.toHaveTextContent('මෙම කාණ්ඩයේ Item නැත')
    await user.click(screen.getByRole('button', { name: 'එපා' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'හොදි ඉවත් කරන්න' }))
    const dialog = screen.getByRole('dialog', { name: 'හොදි ඉවත් කරන්නද?' })
    expect(dialog).toHaveTextContent('Item 2ක් ද මැකී යයි')
    await user.click(within(dialog).getByRole('button', { name: 'ඔව්, ඉවත් කරන්න' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත්', 'පිරිකර']))

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await expectMenu(['බත්', 'පිරිකර'])
    expect(screen.getByRole('link', { name: /කිරිබත්/ })).toBeInTheDocument()
    expect(screen.queryByText('පරිප්පු')).not.toBeInTheDocument()
    expect(screen.queryByText('අල හොදි')).not.toBeInTheDocument()
  })

  it('changes only this event: the templates and other events keep their categories', async () => {
    const organizer = await seedOrganizer()
    const eventId = await seedEvent(organizer, { date: '2099-11-08', categories: ['බත්', 'හොදි', 'පිරිකර'] })
    const otherEventId = await seedEvent(organizer, { date: '2099-11-15', categories: ['බත්', 'හොදි', 'පිරිකර'] })
    const { user, unmount } = await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'බත් නම වෙනස් කරන්න' }))
    await user.clear(screen.getByLabelText('කාණ්ඩයේ නම'))
    await user.type(screen.getByLabelText('කාණ්ඩයේ නම'), 'බත් වර්ග')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත් වර්ග', 'හොදි', 'පිරිකර']))
    await user.click(screen.getByRole('button', { name: 'පිරිකර ඉහළට' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත් වර්ග', 'පිරිකර', 'හොදි']))
    await waitFor(() => expect(screen.getByRole('button', { name: 'හොදි ඉවත් කරන්න' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'හොදි ඉවත් කරන්න' }))
    await user.click(screen.getByRole('button', { name: 'ඔව්, ඉවත් කරන්න' }))
    await user.type(screen.getByLabelText('අළුත් ආහාර කාණ්ඩයක් (Category)'), 'දන්සල් බීම')
    await user.click(screen.getByRole('button', { name: 'එක් කරන්න' }))
    await waitFor(async () => expect(await categoryNames()).toEqual(['බත් වර්ග', 'පිරිකර', 'දන්සල් බීම']))
    unmount()

    const otherEvent = await renderApp(`/events/${otherEventId}/categories`, { signedInAs: organizer })
    expect(await categoryNames()).toEqual(['බත්', 'හොදි', 'පිරිකර'])
    otherEvent.unmount()

    await renderApp('/settings/categories', { signedInAs: organizer })
    expect(await categoryNames()).toEqual(['බත්', 'හොදි', 'ව්‍යංජන', 'පලතුරු', 'කැවිලි හා අතුරුපස', 'පාන', 'වෙනත් ආහාර', 'පිරිකර', 'ඖෂධ'])
  })

  it('shows not found for another organizer’s event', async () => {
    const other = await seedOrganizer()
    const eventId = await seedEvent(other, { date: '2099-11-08', categories: ['බත්'] })
    const organizer = await seedOrganizer()
    await renderApp(`/events/${eventId}/categories`, { signedInAs: organizer })

    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByText('බත්')).not.toBeInTheDocument()
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
