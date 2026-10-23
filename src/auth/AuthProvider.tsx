import type { Session } from '@supabase/supabase-js'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; session: Session }

const AuthContext = createContext<AuthState | null>(null)

/** Tracks the Supabase session. The session persists across reloads in localStorage. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION with the stored session first.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'signedIn', session } : { status: 'signedOut' })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext value={state}>{children}</AuthContext>
}

export function useAuth(): AuthState {
  const state = use(AuthContext)
  if (!state) throw new Error('useAuth must be used inside <AuthProvider>')
  return state
}
