import { useId, type ReactNode } from 'react'
import styles from './Sheet.module.css'

/**
 * A bottom sheet over its parent screen, rendered by a child route. The parent
 * stays mounted underneath, so it keeps its scroll position.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId()
  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <dialog open aria-labelledby={titleId} className={styles.sheet}>
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" aria-label="වසන්න" className={styles.close} onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        {children}
      </dialog>
    </div>
  )
}
