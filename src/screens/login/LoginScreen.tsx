import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { usernameToEmail } from '../../auth/username'
import { supabase } from '../../lib/supabase'
import styles from './LoginScreen.module.css'

export function LoginScreen() {
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (auth.status === 'loading') return null
  // Signed in (just now, or already): go where the organizer was heading.
  if (auth.status === 'signedIn') return <Navigate to={safeNext(searchParams.get('next'))} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(String(form.get('username'))),
      password: String(form.get('password')),
    })
    setSubmitting(false)
    if (error) {
      setError(
        error.code === 'invalid_credentials'
          ? 'නම හෝ මුරපදය වැරදියි. නැවත උත්සාහ කරන්න.'
          : 'ඇතුළු වීමට නොහැකි විය. සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න.',
      )
    }
  }

  return (
    <main className={styles.screen}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h16a8 8 0 0 1-16 0z" />
            <path d="M9 8c0-2 1.5-3 3-4 1.5 1 3 2 3 4" />
            <path d="M8 21h8" />
          </svg>
        </div>
        <h1 className={styles.title}>දාන සංවිධායක</h1>
        <p className={styles.tagline}>දානයේ මෙනුව, දායකයන් සහ වියදම් එකම තැනක</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="username" className={styles.label}>නම</label>
          <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Username" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={styles.input} />
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={submitting}>ඇතුළු වන්න</button>
      </form>

      <p className={styles.note}>දායකයන්ට ගිණුමක් අවශ්‍ය නැත. සංවිධායක පමණක් ඇතුළු වේ.</p>
    </main>
  )
}

/** Only same-app paths, so a crafted link can't send the organizer elsewhere. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/events'
}
