// Organizers sign in with a username; Supabase Auth stores them as a
// synthetic email (ADR 0002).
export const USERNAME_EMAIL_DOMAIN = 'daana.local'

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`
}
