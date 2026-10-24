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

/** 'අද', 'හෙට' or 'තව දින 15', for an upcoming date `daysAway` days from today. */
export function formatDaysAway(daysAway: number): string {
  if (daysAway === 0) return 'අද'
  if (daysAway === 1) return 'හෙට'
  return `තව දින ${daysAway}`
}

/** Today in Sri Lanka plus `offsetDays`, as 'YYYY-MM-DD'. */
export function colomboToday(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date())
  const [year, month, day] = today.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10)
}
