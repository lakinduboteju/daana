import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthState } from './useAuth'

/**
 * Tracks the Supabase session. Must sit inside QueryClientProvider.
 * The session persists across reloads in localStorage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const signingOut = useRef(false)
  const queryClient = useQueryClient()

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
    // Nothing cached for this organizer may show to whoever signs in next.
    queryClient.clear()
  }

  return <AuthContext value={{ state, signOut }}>{children}</AuthContext>
}
