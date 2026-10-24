import { Link } from 'react-router'
import { useAuth, useSignOut } from '../../auth/useAuth'
import { emailToUsername } from '../../auth/username'
import { BackHeader } from '../../components/BackHeader'
import { PasswordForm } from './PasswordForm'
import styles from './SettingsScreen.module.css'

export function SettingsScreen() {
  const auth = useAuth()
  const signOut = useSignOut()
  const email = auth.status === 'signedIn' ? auth.session.user.email : undefined
  const username = email ? emailToUsername(email) : undefined

  return (
    <main className={styles.screen}>
      <BackHeader title="Settings" backTo="/events" />
      <section className={styles.section} aria-labelledby="account">
        <h2 id="account" className={styles.sectionTitle}>ගිණුම</h2>
        <dl className={styles.details}>
          <dt>නම</dt>
          <dd>{username}</dd>
        </dl>
        <button type="button" className={styles.signOut} onClick={signOut}>Logout</button>
      </section>
      <section className={styles.section} aria-labelledby="defaults">
        <h2 id="defaults" className={styles.sectionTitle}>ආහාර කාණ්ඩ (Categories)</h2>
        <Link to="/settings/categories" className={styles.linkButton}>Edit</Link>
      </section>
      <section className={styles.section} aria-labelledby="password">
        <h2 id="password" className={styles.sectionTitle}>Password</h2>
        <PasswordForm />
      </section>
    </main>
  )
}
