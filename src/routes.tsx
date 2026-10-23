import { Navigate, type RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { ContributorsScreen } from './screens/contributors/ContributorsScreen'
import { EventScreen } from './screens/event/EventScreen'
import { EventDetailsScreen } from './screens/event-details/EventDetailsScreen'
import { EventFormScreen } from './screens/event-form/EventFormScreen'
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
      { path: '/events/new', element: <EventFormScreen /> },
      { path: '/events/:eventId', element: <EventScreen /> },
      { path: '/events/:eventId/edit', element: <EventDetailsScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]
