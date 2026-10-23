import { createClient } from '@supabase/supabase-js'
import { usernameToEmail } from '../auth/username'

// Service-role client for seeding test data. Bypasses row-level security,
// so it is only ever used to set up data, never to check what the app shows.
export const admin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export type Organizer = {
  username: string
  password: string
  userId: string
}

export type SeededHousehold = {
  householdId: string
  organizer: Organizer
}

/**
 * Creates a fresh organizer and their household, the same way the household
 * setup script does in production. Every test seeds its own household, so
 * tests never see each other's data.
 */
export async function seedHousehold(name = 'බොතේජු පවුල'): Promise<SeededHousehold> {
  const username = `organizer-${crypto.randomUUID().slice(0, 8)}`
  const password = 'password123'

  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
  })
  if (error) throw error

  const { data: householdId, error: setupError } = await admin.rpc('setup_household', {
    p_name: name,
    p_username: username,
  })
  if (setupError) throw setupError

  return {
    householdId: householdId as string,
    organizer: { username, password, userId: data.user.id },
  }
}

type SeedEventOptions = {
  /** 'YYYY-MM-DD'. Use `colomboDate(offset)` for dates relative to today in Sri Lanka. */
  date: string
  meal?: 'breakfast' | 'lunch'
  host?: string | null
  monastery?: string
  monkCount?: number
  laypersonCount?: number
}

/** Adds an event (and a new monastery for it) to a household. Returns the event's id. */
export async function seedEvent(householdId: string, options: SeedEventOptions): Promise<string> {
  const { data: monastery, error: monasteryError } = await admin
    .from('monastery')
    .insert({ household_id: householdId, name: options.monastery ?? 'මාලබේ අසපුව' })
    .select('id')
    .single()
  if (monasteryError) throw monasteryError

  const { data: event, error } = await admin
    .from('event')
    .insert({
      household_id: householdId,
      monastery_id: monastery.id,
      date: options.date,
      meal: options.meal ?? 'lunch',
      host: options.host ?? null,
      monk_count: options.monkCount ?? 10,
      layperson_count: options.laypersonCount ?? 5,
    })
    .select('id')
    .single()
  if (error) throw error
  return event.id
}

/** Today's date in Sri Lanka plus `offsetDays`, as 'YYYY-MM-DD'. */
export function colomboDate(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date())
  const [year, month, day] = today.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10)
}
