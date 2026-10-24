import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { usernameToEmail } from '../auth/username'
import { supabase } from '../lib/supabase'
import { currentPath, renderApp } from '../test/renderApp'
import { seedDocument, seedEvent, seedHousehold, seedItem, seedTransaction, type Organizer } from '../test/seed'

function pdf(name: string, text = '%PDF-1.4 සහල් බිල්පත') {
  return new File([text], name, { type: 'application/pdf' })
}

describe('documents', () => {
  it('organizer uploads a PDF on the money tab and can download it', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    const section = await screen.findByRole('region', { name: /^ලේඛන/ })
    expect(await within(section).findByText('තවම ලේඛන නැත.')).toBeInTheDocument()
    await user.upload(within(section).getByLabelText('Photo එකක් හෝ PDF එකක් Upload කරන්න'), pdf('සහල් බිල්පත.pdf'))
    expect(await screen.findByRole('status')).toHaveTextContent('Upload කළා')

    const list = await within(section).findByRole('list', { name: 'ලේඛන' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(list).toHaveTextContent('PDF')
    expect(list).toHaveTextContent('සහල් බිල්පත')
    expect(section).toHaveAccessibleName('ලේඛන (1)')

    await user.click(within(list).getByRole('button', { name: 'සහල් බිල්පත — විකල්ප' }))
    const sheet = await screen.findByRole('dialog', { name: 'සහල් බිල්පත' })
    expect(within(sheet).getByRole('link', { name: 'Open' })).toBeInTheDocument()
    const download = within(sheet).getByRole('link', { name: 'Download' })
    const response = await fetch(download.getAttribute('href')!)
    expect(response.ok).toBe(true)
    expect(await response.text()).toBe('%PDF-1.4 සහල් බිල්පත')
  })

  it('organizer adds a receipt photo on item details; it stays on the event when the item is deleted', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්' })
    const { user } = await renderApp(`/events/${eventId}/items/${rice}`, { signedInAs: organizer })

    const section = await screen.findByRole('region', { name: 'ලේඛන (0)' })
    expect(section).toHaveTextContent('Upload කරන්න')
    await user.upload(
      within(section).getByLabelText('Photo එකක් හෝ PDF එකක් Upload කරන්න'),
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'සහල් රිසිට්පත.jpg', { type: 'image/jpeg' }),
    )
    const grid = await within(section).findByRole('list', { name: 'ලේඛන' })
    expect(section).toHaveAccessibleName('ලේඛන (1)')
    await user.click(within(grid).getByRole('button', { name: 'සහල් රිසිට්පත — විකල්ප' }))
    const sheet = await screen.findByRole('dialog', { name: 'සහල් රිසිට්පත' })
    expect(within(sheet).getByRole('img', { name: 'සහල් රිසිට්පත' })).toHaveAttribute('src', expect.stringContaining('token='))
    expect(sheet).toHaveTextContent('JPG')
    expect(sheet).toHaveTextContent('සුදු බත්')
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))

    await user.click(screen.getByRole('link', { name: 'Edit' }))
    await user.click(await screen.findByRole('button', { name: 'Item එක මකන්න' }))
    await user.click(within(await screen.findByRole('dialog', { name: 'සුදු බත් මකන්නද?' })).getByRole('button', { name: 'ඔව්, මකන්න' }))
    await waitFor(() => expect(currentPath()).toBe(`/events/${eventId}`))

    await user.click(await screen.findByRole('link', { name: 'මුදල් හා ලේඛන' }))
    const list = await screen.findByRole('list', { name: 'ලේඛන' })
    expect(list).toHaveTextContent('සහල් රිසිට්පත')
    expect(list).toHaveTextContent('සාමාන්‍ය')
  })

  it('organizer attaches a bill to an expense from the transaction sheet', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', categories: ['බත්'] })
    const rice = await seedItem(eventId, 'බත්', { name: 'සුදු බත්' })
    const expense = await seedTransaction(eventId, { kind: 'expense', amount: 1850, itemId: rice })
    await seedDocument(eventId, { name: 'අසපුවේ උපදෙස්' })
    const { user } = await renderApp(`/events/${eventId}/money/${expense}`, { signedInAs: organizer })

    const section = await screen.findByRole('region', { name: 'ලේඛන (0)' })
    const sheet = screen.getByRole('dialog', { name: 'Edit' })
    expect(sheet).toContainElement(section)
    await user.upload(within(section).getByLabelText('Photo එකක් හෝ PDF එකක් Upload කරන්න'), pdf('සහල් බිල්පත.pdf'))
    expect(await within(section).findByRole('list', { name: 'ලේඛන' })).toHaveTextContent('සහල් බිල්පත')
    expect(within(section).queryByText('අසපුවේ උපදෙස්')).not.toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const list = await screen.findByRole('list', { name: 'ලේඛන' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByRole('button', { name: 'සහල් බිල්පත — විකල්ප' })).toHaveTextContent('සුදු බත් · වියදම Rs 1,850')
    expect(within(list).getByRole('button', { name: 'අසපුවේ උපදෙස් — විකල්ප' })).toHaveTextContent('සාමාන්‍ය')
  })

  it("deleting an event deletes its documents' files", async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08', host: 'බොතේජු පවුල' })
    await seedDocument(eventId, { name: 'සහල් බිල්පත' })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    await user.click(await screen.findByRole('button', { name: 'සහල් බිල්පත — විකල්ප' }))
    const sheet = await screen.findByRole('dialog', { name: 'සහල් බිල්පත' })
    const download = within(sheet).getByRole('link', { name: 'Download' }).getAttribute('href')!
    expect((await fetch(download)).ok).toBe(true)
    await user.click(within(sheet).getByRole('button', { name: 'වසන්න' }))

    await user.click(screen.getByRole('link', { name: 'Edit' }))
    await user.click(await screen.findByRole('button', { name: 'දානය මකන්න' }))
    await user.click(await screen.findByRole('button', { name: 'ඔව්, මකන්න' }))
    expect(await screen.findByText('තවම දාන කිසිවක් නැත')).toBeInTheDocument()

    expect((await fetch(download)).ok).toBe(false)
  })

  it('files that are not images or PDFs, or are over 10 MB, are refused with a message', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })
    // A file picker can be switched to "all files", so the accept filter is no guarantee.
    const user = userEvent.setup({ applyAccept: false })

    const section = await screen.findByRole('region', { name: /^ලේඛන/ })
    await within(section).findByText('තවම ලේඛන නැත.')
    const input = within(section).getByLabelText('Photo එකක් හෝ PDF එකක් Upload කරන්න')

    await user.upload(input, new File(['hello'], 'සටහන්.txt', { type: 'text/plain' }))
    expect(within(section).getByRole('alert')).toHaveTextContent('සටහන්.txt — ඡායාරූප සහ PDF පමණක් උඩුගත කළ හැක.')

    const big = pdf('ලොකු බිල්පත.pdf')
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 })
    await user.upload(input, big)
    expect(within(section).getByRole('alert')).toHaveTextContent('ලොකු බිල්පත.pdf — ගොනුව 10 MB ට වඩා විශාලයි.')

    expect(within(section).getByText('තවම ලේඛන නැත.')).toBeInTheDocument()
    expect(within(section).queryByRole('list', { name: 'ලේඛන' })).not.toBeInTheDocument()
  })

  it('the documents bucket itself refuses other file types', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    await signIn(organizer)

    const { error } = await supabase.storage
      .from('documents')
      .upload(`${householdId}/${eventId}/notes.txt`, new TextEncoder().encode('hello'), { contentType: 'text/plain' })
    expect(error).not.toBeNull()
  })

  it("household B can't read or add to household A's files", async () => {
    const a = await seedHousehold()
    const b = await seedHousehold('සිල්වා පවුල')
    const eventId = await seedEvent(a.householdId, { date: '2099-11-08' })
    const { storagePath } = await seedDocument(eventId, { name: 'බැංකු රිසිට්පත', content: '%PDF-1.4 secret' })

    await renderApp(`/events/${eventId}/money`, { signedInAs: b.organizer })
    expect(await screen.findByRole('heading', { name: 'පිටුව හමු නොවීය' })).toBeInTheDocument()
    expect(screen.queryByText('බැංකු රිසිට්පත')).not.toBeInTheDocument()

    // Even knowing the path, B's session gets nothing from Storage.
    const files = supabase.storage.from('documents')
    expect((await files.download(storagePath)).data).toBeNull()
    expect((await files.createSignedUrl(storagePath, 60)).data).toBeNull()
    expect((await files.list(`${a.householdId}/${eventId}`)).data ?? []).toHaveLength(0)
    const upload = await files.upload(`${a.householdId}/${eventId}/planted.pdf`, new TextEncoder().encode('%PDF'), {
      contentType: 'application/pdf',
    })
    expect(upload.error).not.toBeNull()
    await files.remove([storagePath])

    // A still has the file.
    await supabase.auth.signOut({ scope: 'local' })
    await signIn(a.organizer)
    const own = await files.download(storagePath)
    expect(await own.data?.text()).toBe('%PDF-1.4 secret')
  })

  it('a failed upload shows an alert with retry', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })
    const section = await screen.findByRole('region', { name: /^ලේඛන/ })
    await within(section).findByText('තවම ලේඛන නැත.')

    const realFetch = globalThis.fetch
    const offline = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
      String(input instanceof Request ? input.url : input).includes('/storage/v1/object/documents/')
        ? Promise.reject(new TypeError('Failed to fetch'))
        : realFetch(input, init),
    )
    await user.upload(within(section).getByLabelText('Photo එකක් හෝ PDF එකක් Upload කරන්න'), pdf('පොල් බිල්පත.pdf'))

    const alert = await within(section).findByRole('alert')
    expect(alert).toHaveTextContent('පොල් බිල්පත.pdf උඩුගත කිරීම අසාර්ථකයි. අන්තර්ජාලය පරීක්ෂා කරන්න.')

    offline.mockRestore()
    await user.click(within(alert).getByRole('button', { name: 'නැවත උත්සාහ කරන්න' }))
    const list = await within(section).findByRole('list', { name: 'ලේඛන' })
    expect(list).toHaveTextContent('පොල් බිල්පත')
    expect(within(section).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('organizer renames a document and deletes it after confirming', async () => {
    const { householdId, organizer } = await seedHousehold()
    const eventId = await seedEvent(householdId, { date: '2099-11-08' })
    await seedDocument(eventId, { name: 'scan_0012' })
    const { user } = await renderApp(`/events/${eventId}/money`, { signedInAs: organizer })

    const list = await screen.findByRole('list', { name: 'ලේඛන' })
    await user.click(within(list).getByRole('button', { name: 'scan_0012 — විකල්ප' }))
    let sheet = await screen.findByRole('dialog', { name: 'scan_0012' })
    await user.click(within(sheet).getByRole('button', { name: 'නම වෙනස් කරන්න' }))
    const name = within(sheet).getByLabelText('ලේඛනයේ නම')
    await user.clear(name)
    await user.type(name, 'අසපුවේ උපදෙස්')
    await user.click(within(sheet).getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('status')).toHaveTextContent('සුරැකිණි')
    sheet = await screen.findByRole('dialog', { name: 'අසපුවේ උපදෙස්' })
    await waitFor(() => expect(list).toHaveTextContent('අසපුවේ උපදෙස්'))
    expect(list).not.toHaveTextContent('scan_0012')

    const download = within(sheet).getByRole('link', { name: 'Download' }).getAttribute('href')!
    await user.click(within(sheet).getByRole('button', { name: 'මකන්න' }))
    const confirm = await screen.findByRole('dialog', { name: 'අසපුවේ උපදෙස් මකන්නද?' })
    await user.click(within(confirm).getByRole('button', { name: 'එපා' }))
    expect(screen.queryByRole('dialog', { name: 'අසපුවේ උපදෙස් මකන්නද?' })).not.toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'මකන්න' }))
    await user.click(
      within(await screen.findByRole('dialog', { name: 'අසපුවේ උපදෙස් මකන්නද?' })).getByRole('button', { name: 'ඔව්, මකන්න' }),
    )
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('ලේඛනය මකා දැමුවා'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('තවම ලේඛන නැත.')).toBeInTheDocument()
    // The file itself is gone too.
    expect((await fetch(download)).ok).toBe(false)
  })
})

async function signIn(organizer: Organizer) {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(organizer.username),
    password: organizer.password,
  })
  if (error) throw error
}
