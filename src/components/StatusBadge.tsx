import { STATUS_LABEL, STATUS_SYMBOL, type ItemStatus } from '../data/status'
import styles from './StatusBadge.module.css'

/**
 * An item or assignment status: always text, colour and symbol together, so
 * it reads without relying on colour. Its text is "<symbol><label>".
 */
export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${className ?? ''}`}>
      <span aria-hidden="true" className={styles.symbol}>{STATUS_SYMBOL[status]}</span>
      {STATUS_LABEL[status]}
    </span>
  )
}
