import type { RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { LoginScreen } from './screens/login/LoginScreen'

// The route contract is docs/routes.md.
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginScreen /> },
  {
    element: <RequireAuth />,
    children: [{ path: '*', element: null }],
  },
]
