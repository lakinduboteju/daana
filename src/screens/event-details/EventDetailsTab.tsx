import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useToast } from '../../components/useToast'
import {
  useEventDetails,
  useEventSummary,
  useSetEventCancelled,
  useUpdateEvent,
  type EventDetails,
} from '../../data/events'
import { EventForm } from '../event-form/EventForm'
import { eventFormValues } from '../event-form/eventFormValues'
import { DeleteEventDialog } from './DeleteEventDialog'
import styles from './EventDetailsTab.module.css'

/**
 * /events/:eventId/edit, the "Edit" tab: the event form prefilled with this
 * event's details, plus cancel and delete. The event screen shows not found.
 */
export function EventDetailsTab() {
  const { eventId = '' } = useParams()
  const event = useEventDetails(eventId)

  if (event.isPending) return <p className={styles.status}>…</p>
  if (event.isError) return <p role="alert" className={styles.status}>පූරණය කිරීමට නොහැකි විය</p>
  if (!event.data) return null
  // Keyed by id so another event's details never start from this one's.
  return <EditEvent key={event.data.id} event={event.data} />
}

function EditEvent({ event }: { event: EventDetails }) {
  const updateEvent = useUpdateEvent()
  const setCancelled = useSetEventCancelled()
  const toast = useToast()
  const navigate = useNavigate()
  const summary = useEventSummary(event.id)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const cancelled = event.cancelled_at !== null

  async function toggleCancelled() {
    try {
      await setCancelled.mutateAsync({ eventId: event.id, cancelled: !cancelled })
      toast(cancelled ? 'දානය නැවත සක්‍රීය කළා' : 'දානය Cancel කළා')
    } catch {
      toast('සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.')
    }
  }

  return (
    <EventForm
      initial={eventFormValues(event)}
      submitLabel="Save"
      cancelTo={`/events/${event.id}`}
      onSave={async (fields) => {
        await updateEvent.mutateAsync({ eventId: event.id, fields })
        toast('සුරැකිණි')
      }}
    >
      <section className={styles.manage} aria-label="දානය කළමනාකරණය">
        {cancelled && <p className={styles.note}>මෙම දානය Cancel කර ඇත. එහි විස්තර සියල්ල තවමත් සුරැකී ඇත.</p>}
        <button type="button" className={styles.action} onClick={toggleCancelled} disabled={setCancelled.isPending}>
          {cancelled ? 'දානය නැවත සක්‍රීය කරන්න' : 'දානය Cancel කරන්න'}
        </button>
        <button type="button" className={styles.delete} onClick={() => setConfirmingDelete(true)}>
          දානය මකන්න
        </button>
      </section>
      {confirmingDelete && summary.data && (
        <DeleteEventDialog
          event={summary.data}
          onDeleted={() => navigate('/events')}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </EventForm>
  )
}
