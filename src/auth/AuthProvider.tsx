import type { Session } from '@supabase/supabase-js'
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type AuthState =
  | { status: 'loading' }
  /** `byOrganizer`: they tapped sign out, so the login screen doesn't return them anywhere. */
  | { status: 'signedOut'; byOrganizer: boolean }
  | { status: 'signedIn'; session: Session }

type AuthContextValue = { state: AuthState; signOut: () => Promise<void> }

const AuthContext = createContext<AuthContextValue | null>(null)

/** Tracks the Supabase session. The session persists across reloads in localStorage. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const signingOut = useRef(false)

  useEffect(() => {
    // Fires INITIAL_SESSION with the stored session first, then every change.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: 'signedIn', session }
          : { status: 'signedOut', byOrganizer: signingOut.current },
      )
      signingOut.current = false
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function signOut() {
    signingOut.current = true
    await supabase.auth.signOut()
  }

  return <AuthContext value={{ state, signOut }}>{children}</AuthContext>
}

function useAuthContext(): AuthContextValue {
  const value = use(AuthContext)
  if (!value) throw new Error('Auth hooks must be used inside <AuthProvider>')
  return value
}

export function useAuth(): AuthState {
  return useAuthContext().state
}

/** Signs the organizer out; the auth guard then shows the login screen. */
export function useSignOut(): () => Promise<void> {
  return useAuthContext().signOut
}
