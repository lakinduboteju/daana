import { useId } from 'react'
import { ASSIGNMENT_STATUSES, STATUS_LABEL, STATUS_SYMBOL, type AssignmentStatus } from '../data/status'
import styles from './StatusChoice.module.css'

/** "ඔවුන් එකඟ වුණාද?" for a new assignment: pending (the default) or already agreed. */
export function AgreedChoice({ value, onChange }: { value: AssignmentStatus; onChange: (status: AssignmentStatus) => void }) {
  return (
    <StatusChoice
      label="ඔවුන් එකඟ වුණාද?"
      statuses={['pending', 'confirmed']}
      hints={{ pending: 'කතා කළා / යෝජිතයි', confirmed: 'ඔවුන් එකඟ වුණා' }}
      value={value}
      onChange={onChange}
    />
  )
}

type StatusChoiceProps = {
  /** The radio group's accessible name. Shown as a heading unless `hideLabel`. */
  label: string
  hideLabel?: boolean
  statuses?: AssignmentStatus[]
  hints?: Partial<Record<AssignmentStatus, string>>
  value: AssignmentStatus
  onChange: (status: AssignmentStatus) => void
}

/**
 * One assignment's status as a row of radio buttons (pending, confirmed,
 * received by default). Each choice shows its label, symbol and colour.
 */
export function StatusChoice({ label, hideLabel, statuses = ASSIGNMENT_STATUSES, hints, value, onChange }: StatusChoiceProps) {
  const name = useId()
  const labelId = useId()
  return (
    <div role="radiogroup" aria-labelledby={labelId} className={styles.field}>
      <span id={labelId} className={hideLabel ? styles.visuallyHidden : styles.label}>{label}</span>
      <div className={styles.statusOptions}>
        {statuses.map((status) => (
          <label key={status} className={`${styles.statusOption} ${value === status ? styles[status] : ''}`}>
            <input
              type="radio"
              name={name}
              className={styles.visuallyHidden}
              checked={value === status}
              onChange={() => onChange(status)}
            />
            <span className={styles.statusLabel}>
              <span aria-hidden="true">{STATUS_SYMBOL[status]} </span>
              {STATUS_LABEL[status]}
            </span>
            {hints?.[status] && <span className={styles.statusHint}>{hints[status]}</span>}
          </label>
        ))}
      </div>
    </div>
  )
}
