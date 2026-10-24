import type { EventDetails } from '../../data/events'
import type { Meal } from '../../data/meal'
import { toDisplayDate } from '../../lib/dates'

/** The event form's own state: what the organizer has typed, as typed. */
export type EventFormValues = {
  date: string
  meal: Meal
  monasteryName: string
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
  monasteryName: '',
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
    date: toDisplayDate(event.date),
    meal: event.meal,
    monasteryName: event.monastery_name,
    host: event.host ?? '',
    monkCount: String(event.monk_count),
    laypersonCount: String(event.layperson_count),
    organizerName: event.organizer_name ?? '',
    organizerPhone: event.organizer_phone ?? '',
    notes: event.notes ?? '',
    instructions: event.instructions ?? '',
  }
}
