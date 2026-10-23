# CI only deploys; tests run locally against Supabase in Docker

The GitHub workflow runs on every push to `main` and only deploys to production: it applies database migrations with `supabase db push`, then builds the app and publishes it to GitHub Pages. Lint, unit tests and database tests (pgTAP, row-level security) run locally against the Supabase stack in Docker (`supabase start`) before pushing.

There's one developer and no pull-request flow. Running the full Supabase stack in CI would make every deploy slower without catching anything that a local run doesn't. The cost: a push that skips local checks goes straight to production. If more contributors join, add a test job in front of `migrate`.
