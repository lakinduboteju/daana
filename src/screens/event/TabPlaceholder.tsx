import styles from './MenuTab.module.css'

/** A tab whose screen hasn't been built yet (money). */
export function TabPlaceholder({ title }: { title: string }) {
  return (
    <>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <p className={styles.status}>ළඟදීම.</p>
    </>
  )
}
