import { Link } from 'react-router'
import styles from './EventsHome.module.css'

export function EventsHome() {
  return (
    <>
      <header className={styles.header}>
        <div>
          <div className={styles.greeting}>නමෝ බුද්ධාය!</div>
          <h1 className={styles.title}>දාන</h1>
        </div>
        <Link to="/settings" aria-label="සැකසුම්" className={styles.settings}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
        </Link>
      </header>

      <section className={styles.empty}>
        <h2 className={styles.emptyTitle}>තවම දාන කිසිවක් නැත</h2>
        <p className={styles.emptyText}>ඔබේ පළමු දානය සැලසුම් කිරීමට අළුත් දානයක් එක් කරන්න.</p>
      </section>
    </>
  )
}
