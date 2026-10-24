import { useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import type { Contributor, ContributorInput } from '../../data/contributors'
import styles from './ContributorForm.module.css'

type Props = {
  initial?: Contributor
  saving: boolean
  error: string | null
  onSave: (input: ContributorInput) => void
  /** Set once the screen saved, archived or deleted, so leaving doesn't ask about unsaved changes. */
  done: RefObject<boolean>
  children?: ReactNode
}

/** Name, phone, WhatsApp and notes. Shared by the add and edit screens. */
export function ContributorForm({ initial, saving, error, onSave, done, children }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const formRef = useRef<HTMLFormElement>(null)

  function read(form: HTMLFormElement): ContributorInput {
    const data = new FormData(form)
    return {
      name: name.trim(),
      phone: optional(data.get('phone')),
      whatsapp: optional(data.get('whatsapp')),
      notes: optional(data.get('notes')),
    }
  }

  function isDirty(): boolean {
    if (done.current || !formRef.current) return false
    const now = read(formRef.current)
    return (
      now.name !== (initial?.name ?? '') ||
      now.phone !== (initial?.phone ?? null) ||
      now.whatsapp !== (initial?.whatsapp ?? null) ||
      now.notes !== (initial?.notes ?? null)
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(read(event.currentTarget))
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
      <UnsavedChangesGuard isDirty={isDirty} />
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
        <input id="contributor-phone" name="phone" type="tel" inputMode="tel" defaultValue={initial?.phone ?? ''} className={styles.input} />
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
      <button type="submit" className={styles.submit} disabled={saving || !name.trim()}>Save</button>
      {children}
    </form>
  )
}

function optional(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim()
  return text || null
}
