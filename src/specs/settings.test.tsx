import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('changing the password', () => {
  it('lets the organizer sign in with the new password, and not the old one', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/settings', { signedInAs: organizer })

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('නම')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ආහාර කාණ්ඩ (Categories)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Password' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', expect.stringContaining('/settings/categories'))
    expect(screen.queryByText('පවුල')).not.toBeInTheDocument()
    expect(screen.queryByText(/අළුත් දානයක් සාදන විට/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('New Password'), 'new-password-456')
    await user.type(screen.getByLabelText('New Password Again'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'වෙනස් කරන්න' }))
    expect(await screen.findByRole('status')).toHaveTextContent('මුරපදය වෙනස් කළා')

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    await user.type(await screen.findByLabelText('නම'), organizer.username)
    await user.type(screen.getByLabelText('Password'), organizer.password)
    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('නම හෝ Password වැරදියි.')

    await user.clear(screen.getByLabelText('Password'))
    await user.type(screen.getByLabelText('Password'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'Login' }))
    expect(await screen.findByRole('heading', { name: 'දාන' })).toBeInTheDocument()
    expect(currentPath()).toBe('/events')
  })

  it('refuses a password shorter than 8 characters or one that does not match', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/settings', { signedInAs: organizer })

    await user.type(await screen.findByLabelText('New Password'), 'short')
    await user.type(screen.getByLabelText('New Password Again'), 'short')
    await user.click(screen.getByRole('button', { name: 'වෙනස් කරන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('මුරපදයට අවම වශයෙන් අකුරු 8ක් තිබිය යුතුයි')

    await user.clear(screen.getByLabelText('New Password'))
    await user.clear(screen.getByLabelText('New Password Again'))
    await user.type(screen.getByLabelText('New Password'), 'new-password-456')
    await user.type(screen.getByLabelText('New Password Again'), 'new-password-789')
    await user.click(screen.getByRole('button', { name: 'වෙනස් කරන්න' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('මුරපද දෙක එක සමාන නොවේ')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('category templates', () => {
  it('a renamed template appears in events created afterwards, but not in existing ones', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.type(await screen.findByLabelText(/^අසපුව/), 'මාලබේ අසපුව')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('බත්')).toBeInTheDocument()
    const existingEventPath = currentPath()

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('link', { name: 'Settings' }))
    await user.click(await screen.findByRole('link', { name: 'Edit' }))
    expect(currentPath()).toBe('/settings/categories')
    expect(await screen.findByRole('heading', { name: 'Edit Categories' })).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'බත් නම වෙනස් කරන්න' }))
    const name = screen.getByLabelText('කාණ්ඩයේ නම')
    await user.clear(name)
    await user.type(name, 'බත් වර්ග')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('බත් වර්ග')).toBeInTheDocument()

    goTo('/events/new')
    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-15')
    await user.type(await screen.findByLabelText(/^අසපුව/), 'මාලබේ අසපුව')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('බත් වර්ග')).toBeInTheDocument()
    expect(screen.queryByText('බත්')).not.toBeInTheDocument()

    goTo(existingEventPath)
    expect(await screen.findByText('බත්')).toBeInTheDocument()
    expect(screen.queryByText('බත් වර්ග')).not.toBeInTheDocument()
  })
})

describe('managing category templates', () => {
  const DEFAULTS = ['බත්', 'හොදි', 'ව්‍යංජන', 'පලතුරු', 'කැවිලි හා අතුරුපස', 'පාන', 'වෙනත් ආහාර', 'පිරිකර', 'ඖෂධ']

  it('starts with the nine default categories, and an added one goes last and stays', async () => {
    const { organizer } = await seedHousehold()
    const { user, unmount } = await renderApp('/settings/categories', { signedInAs: organizer })
    expect(await templateNames()).toEqual(DEFAULTS)

    await user.type(screen.getByLabelText('අළුත් ආහාර කාණ්ඩයක් (Category)'), 'දන්සල් බීම')
    await user.click(screen.getByRole('button', { name: 'එක් කරන්න' }))
    await screen.findByText('දන්සල් බීම')
    expect(screen.getByLabelText('අළුත් ආහාර කාණ්ඩයක් (Category)')).toHaveValue('')

    unmount()
    await renderApp('/settings/categories', { signedInAs: organizer })
    expect(await templateNames()).toEqual([...DEFAULTS, 'දන්සල් බීම'])
  })

  it('moves templates up and down, and the order stays', async () => {
    const { organizer } = await seedHousehold()
    const { user, unmount } = await renderApp('/settings/categories', { signedInAs: organizer })

    expect(await screen.findByRole('button', { name: 'බත් ඉහළට' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ඖෂධ පහළට' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'පලතුරු ඉහළට' }))
    await waitFor(async () => expect((await templateNames()).slice(0, 4)).toEqual(['බත්', 'හොදි', 'පලතුරු', 'ව්‍යංජන']))
    await waitFor(() => expect(screen.getByRole('button', { name: 'බත් පහළට' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'බත් පහළට' }))
    await waitFor(async () => expect((await templateNames()).slice(0, 4)).toEqual(['හොදි', 'බත්', 'පලතුරු', 'ව්‍යංජන']))

    unmount()
    await renderApp('/settings/categories', { signedInAs: organizer })
    expect(await templateNames()).toEqual(['හොදි', 'බත්', 'පලතුරු', 'ව්‍යංජන', ...DEFAULTS.slice(4)])
  })

  it('removes a template after confirming, and keeps it when the organizer changes their mind', async () => {
    const { organizer } = await seedHousehold()
    const { user, unmount } = await renderApp('/settings/categories', { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'පාන ඉවත් කරන්න' }))
    const dialog = screen.getByRole('dialog', { name: 'පාන ඉවත් කරන්නද?' })
    expect(dialog).not.toHaveTextContent('දැනට ඇති දානවල')
    expect(screen.queryByText('අළුත් දානවලට මෙම කාණ්ඩ එකතු වේ. දැනට ඇති දානවල කාණ්ඩ වෙනස් නොවේ.')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'එපා' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await templateNames()).toEqual(DEFAULTS)

    await user.click(screen.getByRole('button', { name: 'පාන ඉවත් කරන්න' }))
    await user.click(screen.getByRole('button', { name: 'ඔව්, ඉවත් කරන්න' }))
    await waitFor(() => expect(screen.queryByText('පාන')).not.toBeInTheDocument())

    unmount()
    await renderApp('/settings/categories', { signedInAs: organizer })
    expect(await templateNames()).toEqual(DEFAULTS.filter((name) => name !== 'පාන'))
  })
})

async function templateNames() {
  const list = await screen.findByRole('list', { name: 'කාණ්ඩ' })
  return within(list).getAllByRole('listitem').map((item) => item.textContent)
}

function goTo(path: string) {
  window.history.pushState(null, '', import.meta.env.BASE_URL.replace(/\/$/, '') + path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
