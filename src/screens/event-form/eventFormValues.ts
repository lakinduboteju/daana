import type { EventDetails } from '../../data/events'
import type { Meal } from '../../data/meal'

export const NEW_MONASTERY = 'new'

/** The event form's own state: what the organizer has typed, as typed. */
export type EventFormValues = {
  date: string
  meal: Meal
  /** A monastery id, NEW_MONASTERY, or null before one is picked. */
  monastery: string | null
  monasteryName: string
  monasteryLocation: string
  host: string
  monkCount: string
  laypersonCount: string
  organizerName: string
  organizerPhone: string
  notes: string
  instructions: string
}

export const EMPTY_EVENT_FORM: EventFormValues = {
  date: '',
  meal: 'lunch',
  monastery: null,
  monasteryName: '',
  monasteryLocation: '',
  host: '',
  monkCount: '0',
  laypersonCount: '0',
  organizerName: '',
  organizerPhone: '',
  notes: '',
  instructions: '',
}

export function eventFormValues(event: EventDetails): EventFormValues {
  return {
    ...EMPTY_EVENT_FORM,
    date: event.date,
    meal: event.meal,
    monastery: event.monastery_id,
    host: event.host ?? '',
    monkCount: String(event.monk_count),
    laypersonCount: String(event.layperson_count),
    organizerName: event.organizer_name ?? '',
    organizerPhone: event.organizer_phone ?? '',
    notes: event.notes ?? '',
    instructions: event.instructions ?? '',
  }
}
