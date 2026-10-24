// Organizers sign in with a username; Supabase Auth stores them as a
// synthetic email (ADR 0002).
export const USERNAME_EMAIL_DOMAIN = 'daana.local'

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`
}

/** The username an organizer signs in with, from their synthetic email. */
export function emailToUsername(email: string): string {
  const suffix = `@${USERNAME_EMAIL_DOMAIN}`
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email
}
