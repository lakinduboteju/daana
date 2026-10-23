import { Link } from 'react-router'
import styles from './BackHeader.module.css'

/** Title bar of a deeper screen: a back link instead of the tab bar. */
export function BackHeader({ title, backTo }: { title: string; backTo: string }) {
  return (
    <header className={styles.header}>
      <Link to={backTo} aria-label="ආපසු" className={styles.back}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      </Link>
      <h1 className={styles.title}>{title}</h1>
    </header>
  )
}
