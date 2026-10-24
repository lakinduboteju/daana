// Dates are shown in Sinhala, in Sri Lanka time (spec #1, display formats).
// An event's date is a plain 'YYYY-MM-DD' with no time, so it is read at noon
// UTC (evening in Colombo) and can never shift by a day.

const TIME_ZONE = 'Asia/Colombo'

const dayMonth = new Intl.DateTimeFormat('si-LK', { month: 'long', day: '2-digit', timeZone: TIME_ZONE })
const weekday = new Intl.DateTimeFormat('si-LK', { weekday: 'long', timeZone: TIME_ZONE })

function atNoonUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12))
}

/** 'නොවැම්බර් 08' */
export function formatDayMonth(date: string): string {
  return dayMonth.format(atNoonUtc(date))
}

/** 'ඉරිදා' */
export function formatWeekday(date: string): string {
  return weekday.format(atNoonUtc(date))
}

/** The Sri Lanka date of a timestamp, as 'YYYY-MM-DD'. */
export function colomboDateOf(timestamp: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(timestamp))
}

/** 'අද', 'හෙට' or 'තව දින 15', for an upcoming date `daysAway` days from today. */
export function formatDaysAway(daysAway: number): string {
  if (daysAway === 0) return 'අද'
  if (daysAway === 1) return 'හෙට'
  return `තව දින ${daysAway}`
}

/** '2099-11-08' as the organizer types it: '08/11/2099'. */
export function toDisplayDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** A typed dd/mm/yyyy date as 'YYYY-MM-DD', or null when it is not a real calendar date. */
export function toIsoDate(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim())
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}

/** Today in Sri Lanka plus `offsetDays`, as 'YYYY-MM-DD'. */
export function colomboToday(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date())
  const [year, month, day] = today.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10)
}
