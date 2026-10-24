import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { seedHousehold } from '../test/seed'

describe('household', () => {
  it("shows the organizer's username on settings, and not the household name", async () => {
    const mine = await seedHousehold('බොතේජු පවුල')
    await seedHousehold('සිල්වා පවුල')
    await renderApp('/settings', { signedInAs: mine.organizer })

    expect(await screen.findByText(mine.organizer.username)).toBeInTheDocument()
    expect(screen.queryByText('පවුල')).not.toBeInTheDocument()
    expect(screen.queryByText('බොතේජු පවුල')).not.toBeInTheDocument()
    expect(screen.queryByText('සිල්වා පවුල')).not.toBeInTheDocument()
  })
})
