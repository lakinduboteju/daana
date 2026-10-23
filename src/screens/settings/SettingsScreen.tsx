import { Link } from 'react-router'
import { useAuth, useSignOut } from '../../auth/useAuth'
import { BackHeader } from '../../components/BackHeader'
import { useHouseholds } from '../../data/household'
import { PasswordForm } from './PasswordForm'
import styles from './SettingsScreen.module.css'

export function SettingsScreen() {
  const auth = useAuth()
  const signOut = useSignOut()
  const households = useHouseholds()
  const username = auth.status === 'signedIn' ? auth.session.user.email?.split('@')[0] : undefined

  return (
    <main className={styles.screen}>
      <BackHeader title="සැකසුම්" backTo="/events" />
      <section className={styles.section} aria-labelledby="account">
        <h2 id="account" className={styles.sectionTitle}>ගිණුම</h2>
        <dl className={styles.details}>
          <dt>නම</dt>
          <dd>{username}</dd>
          <dt>පවුල</dt>
          <dd>
            {households.isPending && '…'}
            {households.isError && 'පූරණය කිරීමට නොහැකි විය'}
            {households.data?.map((household) => <div key={household.id}>{household.name}</div>)}
          </dd>
        </dl>
        <button type="button" className={styles.signOut} onClick={signOut}>ඉවත් වන්න</button>
      </section>
      <section className={styles.section} aria-labelledby="defaults">
        <h2 id="defaults" className={styles.sectionTitle}>අළුත් දාන සඳහා කාණ්ඩ</h2>
        <p className={styles.hint}>අළුත් දානයක් සාදන විට මෙම කාණ්ඩ එයට එකතු වේ.</p>
        <Link to="/settings/categories" className={styles.linkButton}>Edit Categories</Link>
      </section>
      <section className={styles.section} aria-labelledby="password">
        <h2 id="password" className={styles.sectionTitle}>මුරපදය වෙනස් කිරීම</h2>
        <PasswordForm />
      </section>
    </main>
  )
}
