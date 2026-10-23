import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './components/Toast'
import { routes } from './routes'

/** The whole app. Each mount gets its own router and query cache. */
export default function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [router] = useState(() =>
    createBrowserRouter(routes, { basename: import.meta.env.BASE_URL }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
