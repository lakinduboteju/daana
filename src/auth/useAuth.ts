import type { Session } from '@supabase/supabase-js'
import { createContext, use } from 'react'

export type AuthState =
  | { status: 'loading' }
  /** `byOrganizer`: they tapped sign out, so the login screen doesn't return them anywhere. */
  | { status: 'signedOut'; byOrganizer: boolean }
  | { status: 'signedIn'; session: Session }

type AuthContextValue = { state: AuthState; signOut: () => Promise<void> }

export const AuthContext = createContext<AuthContextValue | null>(null)

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
