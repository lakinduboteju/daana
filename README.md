# දාන — Almsgiving Organizer

A mobile-first web app for planning Buddhist almsgiving events (දාන): the menu, contributors (දායකයන්), confirmations, money and documents.

- **Live:** https://lakinduboteju.github.io/daana/
- **Product requirements:** [docs/product-requirements.md](docs/product-requirements.md)
- **Design:** [docs/design.md](docs/design.md)
- **Routes:** [docs/routes.md](docs/routes.md)

## Stack

- React + TypeScript + Vite
- Supabase (auth, Postgres, storage). Not wired up yet.
- GitHub Pages, deployed by GitHub Actions on every push to `main`

## Development

Requires Node 24 (see `.nvmrc`) and Docker (for local Supabase).

```bash
npm install
supabase start   # local Postgres, Auth and Storage in Docker
npm run dev      # http://localhost:5173/daana/
npm run lint
npm run build
```

Lint and tests run locally only. Pushing to `main` deploys to production: the workflow applies `supabase/migrations/` to the hosted project (`daana`, ref `zrwkacxrfxsgsimhyttz`, Mumbai), then publishes the app to GitHub Pages. See [ADR 0003](docs/adr/0003-ci-deploys-only-tests-run-locally.md).

## Layout

```
.github/workflows/   GitHub Pages deploy
design/screens/      V1 design artboards (.dc.html reference)
docs/                Requirements, design notes, route map
public/              Static assets
src/                 App source
```
