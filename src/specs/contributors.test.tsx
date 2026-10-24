import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentPath, renderApp } from '../test/renderApp'
import { admin, seedOrganizer, type Organizer } from '../test/seed'

describe('contributors directory', () => {
  it('adds a contributor and finds them by searching in Sinhala or English', async () => {
    const organizer = await seedOrganizer()
    const { user } = await renderApp('/contributors', { signedInAs: organizer })

    expect(await screen.findByText('තවම දායකයන් නැත.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'අළුත් දායකයෙක්' }))
    expect(currentPath()).toBe('/contributors/new')
    expect(await screen.findByRole('heading', { name: 'අළුත් දායකයෙක්' })).toBeInTheDocument()
    await user.type(await screen.findByLabelText('නම'), 'සුනිල් ජයසිංහ')
    await user.type(screen.getByLabelText('දුරකථන අංකය'), '0771234567')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('සුනිල් ජයසිංහ')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('සුරැකිණි')
    expect(currentPath()).toBe('/contributors')

    await user.click(screen.getByRole('link', { name: 'අළුත් දායකයෙක්' }))
    await user.type(await screen.findByLabelText('නම'), 'Anula Wijesekara')
    await user.click(screen.getByRole('button', { name: 'Save' }))
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
    const organizer = await seedOrganizer()
    const longName = 'සුනිල් ජයසිංහ ගමගේ (ගාල්ල පාර)'
    await seedContributor(organizer, { name: longName, phone: '0771234567' })
    const { user } = await renderApp('/contributors', { signedInAs: organizer })

    await user.click(await screen.findByText(longName))
    expect(currentPath()).toMatch(/^\/contributors\/[0-9a-f-]+$/)
    await user.click(await screen.findByRole('link', { name: 'Edit' }))
    expect(currentPath()).toMatch(/^\/contributors\/[0-9a-f-]+\/edit$/)
    expect(await screen.findByRole('heading', { name: 'Edit' })).toBeInTheDocument()
    const name = await screen.findByLabelText('නම')
    expect(name).toHaveValue(longName)
    expect(screen.getByLabelText('දුරකථන අංකය')).toHaveValue('0771234567')

    await user.clear(name)
    await user.type(name, 'සුනිල් ජයසිංහ')
    await user.type(screen.getByLabelText('සටහන්'), 'සෙනසුරාදා උදේට කතා කරන්න.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('සුනිල් ජයසිංහ')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('සුරැකිණි')
    expect(screen.queryByText(longName)).not.toBeInTheDocument()
    expect(currentPath()).toBe('/contributors')
  })

  it('calls and WhatsApps a contributor, using the phone number when there is no WhatsApp number', async () => {
    const organizer = await seedOrganizer()
    await seedContributor(organizer, { name: 'කමලා රත්නායක', phone: '077 123 4567' })
    await seedContributor(organizer, { name: 'ගුණපාල', phone: '0711111111', whatsapp: '+94 77 999 9999' })
    await seedContributor(organizer, { name: 'දිල්රුක්ෂි' })
    await renderApp('/contributors', { signedInAs: organizer })

    expect(await screen.findByRole('link', { name: 'කමලා රත්නායක අමතන්න' })).toHaveAttribute('href', 'tel:0771234567')
    expect(screen.getByRole('link', { name: 'කමලා රත්නායකට WhatsApp පණිවිඩයක්' })).toHaveAttribute('href', 'https://wa.me/94771234567')

    expect(screen.getByRole('link', { name: 'ගුණපාල අමතන්න' })).toHaveAttribute('href', 'tel:0711111111')
    expect(screen.getByRole('link', { name: 'ගුණපාලට WhatsApp පණිවිඩයක්' })).toHaveAttribute('href', 'https://wa.me/94779999999')

    expect(screen.getByText('දිල්රුක්ෂි')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'දිල්රුක්ෂි අමතන්න' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'දිල්රුක්ෂිට WhatsApp පණිවිඩයක්' })).not.toBeInTheDocument()
  })

  it('archiving a contributor hides them from the list and from search', async () => {
    const organizer = await seedOrganizer()
    const contributorId = await seedContributor(organizer, { name: 'රුවන් කුමාර' })
    await seedContributor(organizer, { name: 'නිමල් සිල්වා' })
    const { user } = await renderApp(`/contributors/${contributorId}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'Archive කරන්න' }))

    expect(await screen.findByText('නිමල් සිල්වා')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('රුවන් කුමාර Archive කළා')
    expect(currentPath()).toBe('/contributors')
    expect(screen.queryByText('රුවන් කුමාර')).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'දායකයන් සොයන්න' }), 'රුවන්')
    expect(await screen.findByText(/ගැළපෙන දායකයන් නැත/)).toBeInTheDocument()
    expect(screen.queryByText('රුවන් කුමාර')).not.toBeInTheDocument()
  })

  it('deletes a contributor who has never been assigned, after confirming', async () => {
    const organizer = await seedOrganizer()
    const contributorId = await seedContributor(organizer, { name: 'ගුණපාල' })
    await seedContributor(organizer, { name: 'නිමල් සිල්වා' })
    const { user, unmount } = await renderApp(`/contributors/${contributorId}/edit`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'මකන්න' }))
    const confirm = await screen.findByRole('dialog', { name: 'ගුණපාල මකන්නද?' })
    await user.click(within(confirm).getByRole('button', { name: 'ඔව්, මකන්න' }))

    expect(await screen.findByText('නිමල් සිල්වා')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('ගුණපාල මකා දැමුවා')
    expect(screen.queryByText('ගුණපාල')).not.toBeInTheDocument()

    unmount()
    await renderApp(`/contributors/${contributorId}/edit`)
    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
  })

  it("shows not found for another organizer's contributor", async () => {
    const theirs = await seedOrganizer()
    const contributorId = await seedContributor(theirs, { name: 'නිමල් සිල්වා' })
    const mine = await seedOrganizer()
    await renderApp(`/contributors/${contributorId}/edit`, { signedInAs: mine })

    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByDisplayValue('නිමල් සිල්වා')).not.toBeInTheDocument()
  })
})

async function seedContributor(
  organizer: Organizer,
  fields: { name: string; phone?: string; whatsapp?: string },
): Promise<string> {
  const { data, error } = await admin
    .from('contributor')
    .insert({ organizer_id: organizer.userId, ...fields })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function expectGone(text: string) {
  await waitFor(() => expect(screen.queryByText(text)).not.toBeInTheDocument())
}
