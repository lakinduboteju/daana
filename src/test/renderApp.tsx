import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { usernameToEmail } from '../auth/username'
import { supabase } from '../lib/supabase'
import type { Organizer } from './seed'

type Options = {
  /** Sign in as this organizer before the app loads, as if they had signed in earlier. */
  signedInAs?: Organizer
}

/**
 * The one test seam (ADR 0003): the whole app rendered at a route, talking to
 * the local Supabase stack. `path` is relative to the app base, e.g. '/events'.
 */
export async function renderApp(path: string, { signedInAs }: Options = {}) {
  if (signedInAs) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(signedInAs.username),
      password: signedInAs.password,
    })
    if (error) throw error
  }

  window.history.replaceState(null, '', appUrl(path))
  const user = userEvent.setup()
  return { user, ...render(<App />) }
}

/** The current route, relative to the app base, e.g. '/login?next=%2Fevents'. */
export function currentPath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const { pathname, search } = window.location
  return (pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname) + search
}

function appUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path
}
