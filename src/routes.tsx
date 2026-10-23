import { Navigate, type RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { ContributorEditScreen } from './screens/contributors/ContributorEditScreen'
import { ContributorNewScreen } from './screens/contributors/ContributorNewScreen'
import { ContributorsScreen } from './screens/contributors/ContributorsScreen'
import { EventCategoriesScreen } from './screens/event-categories/EventCategoriesScreen'
import { EventScreen } from './screens/event/EventScreen'
import { AddItemSheet, EditItemSheet } from './screens/event/ItemSheets'
import { MenuTab } from './screens/event/MenuTab'
import { MoneyTab } from './screens/money/MoneyTab'
import { AddTransactionSheet, EditTransactionSheet } from './screens/money/TransactionSheets'
import { EventDetailsTab } from './screens/event-details/EventDetailsTab'
import { EventFormScreen } from './screens/event-form/EventFormScreen'
import { EventsHome } from './screens/events/EventsHome'
import { AssignSheet } from './screens/item/AssignSheet'
import { EditAssignmentSheet } from './screens/item/EditAssignmentSheet'
import { ItemDetailScreen } from './screens/item/ItemDetailScreen'
import { LoginScreen } from './screens/login/LoginScreen'
import { NotFoundScreen } from './screens/not-found/NotFoundScreen'
import { SearchScreen } from './screens/search/SearchScreen'
import { CategoryTemplatesScreen } from './screens/settings/CategoryTemplatesScreen'
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
      {
        path: '/events/:eventId',
        element: <EventScreen />,
        children: [
          {
            path: '',
            element: <MenuTab />,
            children: [
              { path: 'items/new', element: <AddItemSheet /> },
              {
                // Item details cover the menu, which stays mounted; its sheets open over it.
                path: 'items/:itemId',
                element: <ItemDetailScreen />,
                children: [
                  { path: 'edit', element: <EditItemSheet /> },
                  { path: 'assign', element: <AssignSheet /> },
                  { path: 'assignments/:assignmentId', element: <EditAssignmentSheet /> },
                ],
              },
            ],
          },
          {
            path: 'money',
            element: <MoneyTab />,
            children: [
              { path: 'new', element: <AddTransactionSheet /> },
              { path: ':transactionId', element: <EditTransactionSheet /> },
            ],
          },
          { path: 'edit', element: <EventDetailsTab /> },
        ],
      },
      { path: '/events/:eventId/categories', element: <EventCategoriesScreen /> },
      { path: '/contributors/new', element: <ContributorNewScreen /> },
      { path: '/contributors/:contributorId/edit', element: <ContributorEditScreen /> },
      { path: '/settings', element: <SettingsScreen /> },
      { path: '/settings/categories', element: <CategoryTemplatesScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
]
