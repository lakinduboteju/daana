import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { EventSummary } from '../../data/events'
import { DeleteEventDialog } from '../event-details/DeleteEventDialog'
import styles from './EventCardMenu.module.css'

/** The ⋮ button on an event card: Edit, Copy and Delete. */
export function EventCardMenu({ event }: { event: EventSummary }) {
  const [open, setOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={root} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={`${event.monastery_name}: තවත් විකල්ප`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
      </button>
      {open && (
        <ul className={styles.menu}>
          <li>
            <Link to={`/events/${event.id}/edit`} className={styles.item}>Edit</Link>
          </li>
          <li>
            <Link to={`/events/new?from=${event.id}`} className={styles.item}>පිටපත් කරන්න</Link>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.item} ${styles.danger}`}
              onClick={() => {
                setOpen(false)
                setConfirmingDelete(true)
              }}
            >
              මකන්න
            </button>
          </li>
        </ul>
      )}
      {confirmingDelete && (
        <DeleteEventDialog
          event={event}
          onDeleted={() => setConfirmingDelete(false)}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
