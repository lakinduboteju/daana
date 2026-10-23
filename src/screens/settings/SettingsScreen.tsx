import { useAuth, useSignOut } from '../../auth/AuthProvider'
import { BackHeader } from '../../components/BackHeader'
import styles from './SettingsScreen.module.css'

export function SettingsScreen() {
  const auth = useAuth()
  const signOut = useSignOut()
  const username = auth.status === 'signedIn' ? auth.session.user.email?.split('@')[0] : undefined

  return (
    <main className={styles.screen}>
      <BackHeader title="සැකසුම්" backTo="/events" />
      <section className={styles.section} aria-labelledby="account">
        <h2 id="account" className={styles.sectionTitle}>ගිණුම</h2>
        {username && <p className={styles.username}>{username}</p>}
        <button type="button" className={styles.signOut} onClick={signOut}>ඉවත් වන්න</button>
      </section>
    </main>
  )
}
