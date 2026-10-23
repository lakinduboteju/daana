import { useParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useToast } from '../../components/useToast'
import { useEventDetails, useUpdateEvent, type EventDetails } from '../../data/events'
import { EventForm } from '../event-form/EventForm'
import { eventFormValues } from '../event-form/eventFormValues'
import formStyles from '../event-form/EventFormScreen.module.css'
import { NotFoundScreen } from '../not-found/NotFoundScreen'

/**
 * /events/:eventId/edit on its own, with a back header. When the event screen
 * gets its tabs, `EventDetailsTab` is the "විස්තර" tab's content.
 */
export function EventDetailsScreen() {
  const { eventId = '' } = useParams()
  return (
    <main className={formStyles.screen}>
      <BackHeader title="දානයේ විස්තර" backTo={`/events/${eventId}`} />
      <EventDetailsTab eventId={eventId} />
    </main>
  )
}

/** The event form prefilled with this event's details. */
export function EventDetailsTab({ eventId }: { eventId: string }) {
  const event = useEventDetails(eventId)

  if (event.isPending) return <p className={formStyles.hint}>…</p>
  if (event.isError) return <p role="alert" className={formStyles.error}>පූරණය කිරීමට නොහැකි විය</p>
  if (!event.data) return <NotFoundScreen />
  // Keyed by id so another event's details never start from this one's.
  return <EditEvent key={event.data.id} event={event.data} />
}

function EditEvent({ event }: { event: EventDetails }) {
  const updateEvent = useUpdateEvent()
  const toast = useToast()

  return (
    <EventForm
      initial={eventFormValues(event)}
      submitLabel="සුරකින්න"
      cancelTo={`/events/${event.id}`}
      onSave={async (fields) => {
        await updateEvent.mutateAsync({ eventId: event.id, householdId: event.household_id, fields })
        toast('සුරැකිණි')
      }}
    />
  )
}
