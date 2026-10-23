import { BackHeader } from '../../components/BackHeader'
import { useToast } from '../../components/useToast'
import { useCreateEvent } from '../../data/events'
import { useHouseholds } from '../../data/household'
import { EventForm } from './EventForm'
import { EMPTY_EVENT_FORM } from './eventFormValues'
import styles from './EventFormScreen.module.css'

/** /events/new: create an event, then go to its menu. */
export function EventFormScreen() {
  const households = useHouseholds()
  const createEvent = useCreateEvent()
  const toast = useToast()
  const householdId = households.data?.[0]?.id

  return (
    <main className={styles.screen}>
      <BackHeader title="අළුත් දානයක්" backTo="/events" />
      <EventForm
        initial={EMPTY_EVENT_FORM}
        submitLabel="සුරකින්න, මෙනුවට යන්න"
        cancelTo="/events"
        disabled={!householdId}
        onSave={async (fields) => {
          if (!householdId) return
          const eventId = await createEvent.mutateAsync({ ...fields, householdId })
          toast('දානය සුරැකිණි')
          return `/events/${eventId}`
        }}
      />
    </main>
  )
}
