import styles from './CancelledBadge.module.css'

/** "අවලංගුයි": shown wherever a cancelled event appears (cards, past rows, event header). */
export function CancelledBadge() {
  return <span className={styles.badge}>අවලංගුයි</span>
}
