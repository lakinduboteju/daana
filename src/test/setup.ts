import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { supabase } from '../lib/supabase'

// Each test starts signed out, on a blank page, with empty browser storage.
afterEach(async () => {
  cleanup()
  await supabase.auth.signOut({ scope: 'local' })
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})
