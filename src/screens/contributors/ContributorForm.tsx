import { useState, type FormEvent, type ReactNode } from 'react'
import type { Contributor, ContributorInput } from '../../data/contributors'
import styles from './ContributorForm.module.css'

type Props = {
  initial?: Contributor
  saving: boolean
  error: string | null
  onSave: (input: ContributorInput) => void
  children?: ReactNode
}

/** Name, phone, WhatsApp and notes. Shared by the add and edit screens. */
export function ContributorForm({ initial, saving, error, onSave, children }: Props) {
  const [name, setName] = useState(initial?.name ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      name: name.trim(),
      phone: optional(form.get('phone')),
      whatsapp: optional(form.get('whatsapp')),
      notes: optional(form.get('notes')),
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="contributor-name" className={styles.label}>නම</label>
        <input
          id="contributor-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="contributor-phone" className={styles.label}>දුරකථන අංකය</label>
        <input id="contributor-phone" name="phone" type="tel" inputMode="tel" placeholder="077 123 4567" defaultValue={initial?.phone ?? ''} className={styles.input} />
      </div>
      <div className={styles.field}>
        <label htmlFor="contributor-whatsapp" className={styles.label}>WhatsApp අංකය</label>
        <input id="contributor-whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={initial?.whatsapp ?? ''} aria-describedby="contributor-whatsapp-hint" className={styles.input} />
        <span id="contributor-whatsapp-hint" className={styles.hint}>හිස් නම් දුරකථන අංකය භාවිතා වේ.</span>
      </div>
      <div className={styles.field}>
        <label htmlFor="contributor-notes" className={styles.label}>සටහන්</label>
        <textarea id="contributor-notes" name="notes" rows={3} defaultValue={initial?.notes ?? ''} className={styles.textarea} />
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit" className={styles.submit} disabled={saving || !name.trim()}>සුරකින්න</button>
      {children}
    </form>
  )
}

function optional(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim()
  return text || null
}
