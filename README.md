# දාන — Almsgiving Organizer

A mobile-first web app for planning Buddhist almsgiving events (දාන): the menu, contributors (දායකයන්), confirmations, money and documents.

- **Live:** https://lakinduboteju.github.io/daana/
- **Product requirements:** [docs/product-requirements.md](docs/product-requirements.md)
- **Design:** [docs/design.md](docs/design.md)
- **Routes:** [docs/routes.md](docs/routes.md)

## Stack

- React + TypeScript + Vite, React Router (clean URLs under the `/daana/` basename), TanStack Query
- CSS Modules on the design tokens in `src/index.css` (no component library)
- Supabase (auth, Postgres, storage) through `supabase-js` and the publishable key; row-level security is the only access control
- GitHub Pages, deployed by GitHub Actions on every push to `main`

## Development

Requires Node 24 (see `.nvmrc`) and Docker (for local Supabase).

```bash
npm install
cp .env.example .env.local   # points the app at local Supabase
supabase start               # local Postgres, Auth and Storage in Docker (API on :57321, Studio on :57323)
supabase db reset            # apply supabase/migrations/ and supabase/seed.sql
npm run dev                  # http://localhost:5173/daana/
npm test
npm run lint
npm run build
```

The local stack uses the 573xx ports (`supabase/config.toml`) so it can run next to other Supabase projects. The seed creates two organizers for local development, both with password `password123`: `organizer` (household බොතේජු පවුල) and `other` (household සිල්වා පවුල, for checking household isolation).

The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time. The deploy workflow sets them from repository variables.

## Tests

`npm test` runs Vitest with React Testing Library and user-event against the local Supabase stack, so run `supabase start` first. `vitest.config.ts` reads the URL and keys from `supabase status`.

There is one test seam ([ADR 0003](docs/adr/0003-ci-deploys-only-tests-run-locally.md)): the whole app rendered at a route, signed in as an organizer, talking to the real local database. Tests act as the organizer would and check only what the organizer sees. Specs live in `src/specs/`; the harness lives in `src/test/`:

- `seedHousehold(name?)` creates a fresh organizer and household through the same `setup_household` function production uses. Every test seeds its own, so tests don't depend on each other or on `seed.sql`. `admin` (service role) is exported for seeding further data; never use it to check results.
- `renderApp(path, { signedInAs })` renders `<App />` at `path` (relative to the base, e.g. `/events`), optionally signed in. It returns a `user` from user-event plus the render result.
- `currentPath()` returns the current route relative to the base, e.g. `/login?next=%2Fevents`.
- `seedEvent(householdId, { date, meal?, host?, monastery?, ... })` adds an event (with a new monastery) and returns its id. `colomboDate(offsetDays)` gives a date relative to today in Sri Lanka, for upcoming and past events.

```tsx
const { organizer } = await seedHousehold()
const { user } = await renderApp('/events', { signedInAs: organizer })
await user.click(await screen.findByRole('link', { name: 'සොයන්න' }))
expect(currentPath()).toBe('/search')
```

After each test the harness signs out and clears browser storage.

## Setting up a household

There is no public sign-up ([ADR 0002](docs/adr/0002-username-login-via-synthetic-email.md)). To give someone access to the hosted app:

1. In the Supabase dashboard, open **Authentication → Users → Add user → Create new user**. Use the email `<username>@daana.local` (lowercase), a password of at least 8 characters, and tick **Auto Confirm User**.
2. In the **SQL editor**, create their household and link them to it:

   ```sql
   select public.setup_household('බොතේජු පවුල', '<username>');
   ```

They then sign in with just `<username>` and the password. Passwords are reset in the dashboard too.

Lint and tests run locally only. Pushing to `main` deploys to production: the workflow applies `supabase/migrations/` to the hosted project (`daana`, ref `zrwkacxrfxsgsimhyttz`, Mumbai), then publishes the app to GitHub Pages. See [ADR 0003](docs/adr/0003-ci-deploys-only-tests-run-locally.md).

## Layout

```
.github/workflows/   GitHub Pages deploy
design/screens/      V1 design artboards (.dc.html reference)
docs/                Requirements, design notes, route map
public/              Static assets
src/                 App source
  auth/              Session, auth guard, username → email
  components/        Shared UI pieces
  data/              TanStack Query hooks over Supabase
  lib/               The Supabase client
  screens/           One folder per screen, each with its CSS Module
  specs/             Tests at the app-at-route seam
  test/              Test harness: renderApp, seedHousehold
  routes.tsx         Route table (docs/routes.md)
supabase/            config.toml, migrations/, seed.sql
```
