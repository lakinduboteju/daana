import { useSearchParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader'
import { useToast } from '../../components/useToast'
import { useCopyEvent, useCreateEvent, useEventDetails, type EventDetails } from '../../data/events'
import { NotFoundScreen } from '../not-found/NotFoundScreen'
import { CopyFromPicker } from './CopyFromPicker'
import { EventForm } from './EventForm'
import { EMPTY_EVENT_FORM, eventFormValues } from './eventFormValues'
import styles from './EventFormScreen.module.css'

/**
 * /events/new: create an event, then go to its menu. With `?from=<eventId>`
 * the form starts from that event (all but the date) and saving copies its menu.
 */
export function EventFormScreen() {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  return from ? <CopyEvent key={from} sourceEventId={from} /> : <NewEvent />
}

function NewEvent() {
  const createEvent = useCreateEvent()
  const toast = useToast()

  return (
    <main className={styles.screen}>
      <BackHeader title="අළුත් දානයක්" backTo="/events" />
      <CopyFromPicker />
      <EventForm
        initial={EMPTY_EVENT_FORM}
        submitLabel="Save"
        cancelTo="/events"
        onSave={async (fields) => {
          const eventId = await createEvent.mutateAsync(fields)
          toast('දානය සුරැකිණි')
          return `/events/${eventId}`
        }}
      />
    </main>
  )
}

function CopyEvent({ sourceEventId }: { sourceEventId: string }) {
  const source = useEventDetails(sourceEventId)

  if (source.isSuccess && !source.data) return <NotFoundScreen />
  return (
    <main className={styles.screen}>
      <BackHeader title="අළුත් දානයක්" backTo="/events" />
      {source.isPending && <p className={styles.status}>…</p>}
      {source.isError && <p role="alert" className={styles.status}>පූරණය කිරීමට නොහැකි විය</p>}
      {source.data && <CopyEventForm source={source.data} />}
    </main>
  )
}

function CopyEventForm({ source }: { source: EventDetails }) {
  const copyEvent = useCopyEvent()
  const toast = useToast()

  return (
    <EventForm
      // Everything but the date: a copy is for another day.
      initial={{ ...eventFormValues(source), date: '' }}
      submitLabel="Save"
      cancelTo="/events"
      onSave={async (fields) => {
        const eventId = await copyEvent.mutateAsync({
          ...fields,
          sourceEventId: source.id,
        })
        toast('දානය සුරැකිණි')
        return `/events/${eventId}`
      }}
    />
  )
}
