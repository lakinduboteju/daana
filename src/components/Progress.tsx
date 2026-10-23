import type { EventProgress } from '../data/events'
import { STATUS_LABEL, type ItemStatus } from '../data/status'
import styles from './Progress.module.css'

/** Bar segments, left to right: what's furthest along first. Unassigned is the empty track. */
const SEGMENTS: { status: ItemStatus; count: keyof EventProgress }[] = [
  { status: 'received', count: 'received_count' },
  { status: 'confirmed', count: 'confirmed_count' },
  { status: 'partial', count: 'partial_count' },
  { status: 'pending', count: 'pending_count' },
  { status: 'unassigned', count: 'unassigned_count' },
]

/** One bar for the whole event, split by item status. Named "සූදානම: <status> <n>, …". */
export function StackedProgress({ progress }: { progress: EventProgress }) {
  const total = progress.item_count
  const parts = SEGMENTS.filter((s) => progress[s.count] > 0)
  const label = `සූදානම: ${parts.map((s) => `${STATUS_LABEL[s.status]} ${progress[s.count]}`).join(', ')}`
  return (
    <div role="img" aria-label={label} className={styles.stacked}>
      {parts
        .filter((s) => s.status !== 'unassigned')
        .map((s) => (
          <div
            key={s.status}
            className={`${styles.segment} ${styles[s.status]}`}
            style={{ width: `${(progress[s.count] / total) * 100}%` }}
          />
        ))}
    </div>
  )
}

/** A small ready-out-of-total bar; green when everything is ready. */
export function ProgressBar({ value, max, label, small }: { value: number; max: number; label: string; small?: boolean }) {
  const done = max > 0 && value === max
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={small ? `${styles.track} ${styles.small}` : styles.track}
    >
      <span
        className={done ? `${styles.fill} ${styles.done}` : styles.fill}
        style={{ width: max > 0 ? `${(value / max) * 100}%` : 0 }}
      />
    </span>
  )
}
