import { screen, within } from '@testing-library/react'
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

describe('category templates', () => {
  it('a renamed template appears in events created afterwards, but not in existing ones', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/events/new', { signedInAs: organizer })

    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-08')
    await user.type(await screen.findByLabelText('අසපුවේ නම'), 'මාලබේ අසපුව')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
    expect(await screen.findByText('බත්')).toBeInTheDocument()
    const existingEventPath = currentPath()

    await user.click(screen.getByRole('link', { name: 'ආපසු' }))
    await user.click(await screen.findByRole('link', { name: 'සැකසුම්' }))
    await user.click(await screen.findByRole('link', { name: 'Edit Categories' }))
    expect(currentPath()).toBe('/settings/categories')
    await user.click(await screen.findByRole('button', { name: 'බත් නම වෙනස් කරන්න' }))
    const name = screen.getByLabelText('කාණ්ඩයේ නම')
    await user.clear(name)
    await user.type(name, 'බත් වර්ග')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))
    expect(await screen.findByText('බත් වර්ග')).toBeInTheDocument()

    goTo('/events/new')
    await user.type(await screen.findByLabelText(/දිනය/), '2099-11-15')
    await user.click(await screen.findByRole('radio', { name: /මාලබේ අසපුව/ }))
    await user.click(screen.getByRole('button', { name: 'සුරකින්න, මෙනුවට යන්න' }))
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

    await user.type(screen.getByLabelText('අළුත් කාණ්ඩයක්'), 'දන්සල් බීම')
    await user.click(screen.getByRole('button', { name: 'එක් කරන්න' }))
    await screen.findByText('දන්සල් බීම')
    expect(screen.getByLabelText('අළුත් කාණ්ඩයක්')).toHaveValue('')

    unmount()
    await renderApp('/settings/categories', { signedInAs: organizer })
    expect(await templateNames()).toEqual([...DEFAULTS, 'දන්සල් බීම'])
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
