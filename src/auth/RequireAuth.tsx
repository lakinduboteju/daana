import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/** Every route except /login: signed-out visits go to /login?next=<path>. */
export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return null
  if (auth.status === 'signedOut') {
    if (auth.byOrganizer) return <Navigate to="/login" replace />
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <Outlet />
}
