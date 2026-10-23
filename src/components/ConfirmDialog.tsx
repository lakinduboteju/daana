import { useId, type ReactNode } from 'react'
import styles from './ConfirmDialog.module.css'

type Props = {
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Red confirm button, for deleting. */
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** A question over the current screen with a confirm and a cancel button. */
export function ConfirmDialog({ title, children, confirmLabel, cancelLabel = 'එපා', destructive, busy, onConfirm, onCancel }: Props) {
  const titleId = useId()
  return (
    <div className={styles.backdrop}>
      <dialog open aria-labelledby={titleId} className={styles.dialog} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        {children && <div className={styles.body}>{children}</div>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? styles.destructive : styles.confirm}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </div>
  )
}
