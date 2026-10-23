import { Navigate, type RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { ContributorsScreen } from './screens/contributors/ContributorsScreen'
import { EventsHome } from './screens/events/EventsHome'
import { LoginScreen } from './screens/login/LoginScreen'
import { NotFoundScreen } from './screens/not-found/NotFoundScreen'
import { SearchScreen } from './screens/search/SearchScreen'
import { SettingsScreen } from './screens/settings/SettingsScreen'
import { AppShell } from './screens/shell/AppShell'

// The route contract is docs/routes.md.
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginScreen /> },
  {
    element: <RequireAuth />,
    children: [
      { index: true, element: <Navigate to="/events" replace /> },
      {
        element: <AppShell />,
        children: [
          { path: '/events', element: <EventsHome /> },
          { path: '/search', element: <SearchScreen /> },
          { path: '/contributors', element: <ContributorsScreen /> },
        ],
      },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]
