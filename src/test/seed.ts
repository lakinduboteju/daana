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
