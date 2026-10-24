import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { seedEvent, seedHousehold } from '../test/seed'

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
    await user.upload(within(section).getByLabelText('ඡායාරූපයක් හෝ PDF එකක් උඩුගත කරන්න'), pdf('සහල් බිල්පත.pdf'))

    const list = await within(section).findByRole('list', { name: 'ලේඛන' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(list).toHaveTextContent('PDF')
    expect(list).toHaveTextContent('සහල් බිල්පත')
    expect(section).toHaveAccessibleName('ලේඛන (1)')

    await user.click(within(list).getByRole('button', { name: 'සහල් බිල්පත — විකල්ප' }))
    const sheet = await screen.findByRole('dialog', { name: 'සහල් බිල්පත' })
    const download = within(sheet).getByRole('link', { name: 'බාගන්න' })
    const response = await fetch(download.getAttribute('href')!)
    expect(response.ok).toBe(true)
    expect(await response.text()).toBe('%PDF-1.4 සහල් බිල්පත')
  })
})
