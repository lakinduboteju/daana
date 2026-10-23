import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { admin, seedHousehold } from '../test/seed'

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

  it('edits a contributor, keeping a long name whole', async () => {
    const { householdId, organizer } = await seedHousehold()
    const longName = 'සුනිල් ජයසිංහ ගමගේ (ගාල්ල පාර)'
    await seedContributor(householdId, { name: longName, phone: '0771234567' })
    const { user } = await renderApp('/contributors', { signedInAs: organizer })

    await user.click(await screen.findByText(longName))
    expect(currentPath()).toMatch(/^\/contributors\/[0-9a-f-]+\/edit$/)
    const name = await screen.findByLabelText('නම')
    expect(name).toHaveValue(longName)
    expect(screen.getByLabelText('දුරකථන අංකය')).toHaveValue('0771234567')

    await user.clear(name)
    await user.type(name, 'සුනිල් ජයසිංහ')
    await user.type(screen.getByLabelText('සටහන්'), 'සෙනසුරාදා උදේට කතා කරන්න.')
    await user.click(screen.getByRole('button', { name: 'සුරකින්න' }))

    expect(await screen.findByText('සුනිල් ජයසිංහ')).toBeInTheDocument()
    expect(screen.queryByText(longName)).not.toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')
  })

  it("shows not found for another household's contributor", async () => {
    const theirs = await seedHousehold('සිල්වා පවුල')
    const contributorId = await seedContributor(theirs.householdId, { name: 'නිමල් සිල්වා' })
    const mine = await seedHousehold()
    await renderApp(`/contributors/${contributorId}/edit`, { signedInAs: mine.organizer })

    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByDisplayValue('නිමල් සිල්වා')).not.toBeInTheDocument()
  })
})

async function seedContributor(
  householdId: string,
  fields: { name: string; phone?: string; whatsapp?: string },
): Promise<string> {
  const { data, error } = await admin
    .from('contributor')
    .insert({ household_id: householdId, ...fields })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function expectGone(text: string) {
  await waitFor(() => expect(screen.queryByText(text)).not.toBeInTheDocument())
}
