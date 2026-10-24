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
  const [passwordVisible, setPasswordVisible] = useState(false)

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
          ? 'නම හෝ Password වැරදියි.'
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
          <div className={styles.password}>
            <input id="password" name="password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" required className={styles.input} />
            <button type="button" className={styles.reveal} aria-label={passwordVisible ? 'Hide password' : 'Show password'} onClick={() => setPasswordVisible((visible) => !visible)}>
              {passwordVisible ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M10.7 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.1" />
                  <path d="M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  <path d="M3 3l18 18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={submitting}>Login</button>
      </form>
    </main>
  )
}

/** Only same-app paths, so a crafted link can't send the organizer elsewhere. */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/events'
}
