import { execSync } from 'node:child_process'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Tests run against the local Supabase stack (`supabase start`). See README.
function localSupabaseEnv(): Record<string, string> {
  let status: Record<string, string>
  try {
    status = JSON.parse(
      execSync('supabase status -o json', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    )
  } catch {
    throw new Error('Local Supabase is not running. Start it with `supabase start`.')
  }
  return {
    VITE_SUPABASE_URL: status.API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  }
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      env: localSupabaseEnv(),
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['**/node_modules/**', '.claude/**'],
      testTimeout: 15000,
    },
  }),
)
