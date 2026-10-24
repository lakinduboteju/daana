import { useState } from 'react'
import { Link } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { useEventSummaries } from '../../data/events'
import { MEAL_LABEL } from '../../data/meal'
import { formatDayMonth } from '../../lib/dates'
import styles from './CopyFromPicker.module.css'

const TITLE = 'පෙර දානයකින් පිටපත් කරන්න'

/** The new-event form's "copy a previous event" link: pick an event, and the form starts from it. */
export function CopyFromPicker() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{TITLE}</span>
        </span>
      </button>
      {open && <Picker onClose={() => setOpen(false)} />}
    </>
  )
}

function Picker({ onClose }: { onClose: () => void }) {
  const events = useEventSummaries()
  // Latest first: the event most like the next one is usually the last one.
  const choices = [...(events.data ?? [])].reverse()

  return (
    <Sheet title={TITLE} onClose={onClose}>
      {events.isPending && <p className={styles.status}>…</p>}
      {events.isError && <p role="alert" className={styles.status}>පූරණය කිරීමට නොහැකි විය</p>}
      {events.isSuccess && choices.length === 0 && <p className={styles.status}>තවම දාන කිසිවක් නැත</p>}
      {choices.length > 0 && (
        <ul className={styles.list}>
          {choices.map((event) => (
            <li key={event.id}>
              <Link to={`/events/new?from=${event.id}`} replace className={styles.choice}>
                <span className={styles.choiceTitle}>{event.host ?? event.monastery_name}</span>
                <span className={styles.choiceMeta}>
                  {formatDayMonth(event.date)} · {MEAL_LABEL[event.meal]} · {event.monastery_name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}
