import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('household', () => {
  it("shows the organizer's own household in settings, never another household", async () => {
    const mine = await seedHousehold('බොතේජු පවුල')
    await seedHousehold('සිල්වා පවුල')
    await renderApp('/settings', { signedInAs: mine.organizer })

    expect(await screen.findByText('බොතේජු පවුල')).toBeInTheDocument()
    expect(screen.getByText(mine.organizer.username)).toBeInTheDocument()
    expect(screen.queryByText('සිල්වා පවුල')).not.toBeInTheDocument()
  })
})
