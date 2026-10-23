import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('contributors directory', () => {
  it('adds a contributor and finds them by searching in Sinhala or English', async () => {
    const { organizer } = await seedHousehold()
    const { user } = await renderApp('/contributors', { signedInAs: organizer })

    await user.click(await screen.findByRole('link', { name: 'නව දායකයා' }))
    expect(currentPath()).toBe('/contributors/new')
    await user.type(await screen.findByLabelText('නම'), 'සුනිල් ජයසිංහ')
    await user.type(screen.getByLabelText('දුරකථන අංකය'), '0771234567')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))

    expect(await screen.findByText('සුනිල් ජයසිංහ')).toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')

    await user.click(screen.getByRole('link', { name: 'නව දායකයා' }))
    await user.type(await screen.findByLabelText('නම'), 'Anula Wijesekara')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))
    expect(await screen.findByText('Anula Wijesekara')).toBeInTheDocument()

    const search = screen.getByRole('searchbox', { name: 'දායකයන් සොයන්න' })
    await user.type(search, 'anula')
    expect(await screen.findByText('Anula Wijesekara')).toBeInTheDocument()
    await expectGone('සුනිල් ජයසිංහ')
    expect(currentPath()).toBe('/contributors?q=anula')

    await user.clear(search)
    await user.type(search, 'සුනිල්')
    expect(await screen.findByText('සුනිල් ජයසිංහ')).toBeInTheDocument()
    await expectGone('Anula Wijesekara')
  })
})

async function expectGone(text: string) {
  await waitFor(() => expect(screen.queryByText(text)).not.toBeInTheDocument())
}
