import { useState, type FormEvent } from 'react'
import { UnsavedChangesGuard } from '../../components/UnsavedChangesGuard'
import { useToast } from '../../components/useToast'
import { supabase } from '../../lib/supabase'
import styles from './SettingsScreen.module.css'

const MIN_LENGTH = 8

/** Changes the signed-in organizer's password. They stay signed in. */
export function PasswordForm() {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < MIN_LENGTH) return setError(`මුරපදයට අවම වශයෙන් අකුරු ${MIN_LENGTH}ක් තිබිය යුතුයි`)
    if (password !== repeat) return setError('මුරපද දෙක එක සමාන නොවේ')

    setError(null)
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(
        updateError.code === 'same_password'
          ? 'අළුත් මුරපදය පරණ මුරපදයට වඩා වෙනස් විය යුතුයි'
          : 'මුරපදය වෙනස් කිරීමට නොහැකි විය',
      )
      return
    }
    setPassword('')
    setRepeat('')
    toast('මුරපදය වෙනස් කළා')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <UnsavedChangesGuard isDirty={() => password !== '' || repeat !== ''} />
      <div className={styles.field}>
        <label htmlFor="new-password" className={styles.label}>අළුත් මුරපදය</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="new-password-hint"
          className={styles.input}
        />
        <span id="new-password-hint" className={styles.hint}>අවම වශයෙන් අකුරු {MIN_LENGTH}ක්.</span>
      </div>
      <div className={styles.field}>
        <label htmlFor="repeat-password" className={styles.label}>අළුත් මුරපදය නැවත</label>
        <input
          id="repeat-password"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(event) => setRepeat(event.target.value)}
          className={styles.input}
        />
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit" className={styles.primary} disabled={saving || !password}>
        මුරපදය වෙනස් කරන්න
      </button>
    </form>
  )
}
