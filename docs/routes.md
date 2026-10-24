# Routes

All paths are relative to the app base, `https://lakinduboteju.github.io/daana`.
Path segments are English (ASCII). The UI text is mixed Sinhala and English.

## Route map

| Path | Screen | Design artboard | Notes |
| --- | --- | --- | --- |
| `/login` | Login | `Login` | Public. Supports `?next=<path>` to return after sign-in. |
| `/` | — | — | Redirects to `/events`. |
| `/events` | Events home (දාන) | `Main` | Upcoming and past sections. Optional `?q=`, `?monastery=`. |
| `/events/new` | Create event (අළුත් දානයක්) | `EventForm` | `?from=<eventId>` duplicates the menu and categories, and resets confirmations. |
| `/events/:eventId` | Event overview + menu | `EventDetail` | Default tab "මෙනුව". Filters are kept in the query string: `?status=unassigned\|pending\|confirmed\|received&category=<id>&contributor=<id>&q=`. |
| `/events/:eventId/money` | Money & documents tab | `Money` | `?type=given\|expense`. |
| `/events/:eventId/money/new` | Add payment or expense (sheet) | — | `?type=given\|expense&item=<itemId>`. |
| `/events/:eventId/money/:transactionId` | View or edit a transaction (sheet) | — | |
| `/events/:eventId/edit` | Event details / settings tab (විස්තර) | `EventForm` | Same form as create. Also has cancel and delete actions. |
| `/events/:eventId/categories` | Edit Categories | — | Add, rename, reorder and remove categories. |
| `/events/:eventId/items/new` | Add item (sheet) | — | `?category=<id>` preselects the category. |
| `/events/:eventId/items/:itemId` | Food item details | `ItemDetail` | |
| `/events/:eventId/items/:itemId/edit` | Edit item (sheet) | — | Name, category, quantity and unit, notes. |
| `/events/:eventId/items/:itemId/assign` | Assign contributor (sheet) | `AssignSheet` | Creates a new assignment. The default status is *pending*. |
| `/events/:eventId/items/:itemId/assignments/:assignmentId` | Edit one assignment (sheet) | — | Quantity, status, remove. |
| `/search` | Global search | `Search` | `?q=&status=&from=&to=&monastery=&contributor=`. |
| `/contributors` | Contributors directory | `Contributors` | `?q=`. |
| `/contributors/new` | Add contributor | — | |
| `/contributors/:contributorId` | Contributor details | `ContributorDetail` | Assignments across all events. |
| `/contributors/:contributorId/edit` | Edit contributor | — | |
| `/settings` | App settings | — | Account, password, and default categories. Opened from the gear icon on `/events`. |
| `/settings/categories` | Global category templates | — | The default categories used for new events. |
| `*` | Not found | — | Links back to `/events`. |

The bottom tab bar shows on `/events`, `/search` and `/contributors`. Deeper screens use a back button instead.

## Conventions

- **Sheets and dialogs are nested routes.** They render over their parent through an `<Outlet>`, so the parent stays mounted and keeps its scroll position. This meets the requirement to allow quick editing without losing the user's place in the menu. The Android back button and browser back both close the sheet, and a sheet can be linked to directly.
- **Filters live in the URL query string, not in component state.** Back, refresh and sharing a link all keep the filtered view. Clearing filters means removing the query params.
- **IDs are UUIDs** (Supabase `gen_random_uuid()`), not sequential numbers like `/events/1`. UUIDs can't be guessed or enumerated. They can also be generated on the client, which helps with optimistic and offline saves. If shorter links are needed later, a short slug can be added without changing routes.
- **Event tabs are routes:** `/events/:id` (menu), `/events/:id/money` and `/events/:id/edit`. Each tab can be linked to directly.
- **Every route except `/login` requires auth.** An unauthenticated visit redirects to `/login?next=<original path>`.
- **Destructive actions** (delete event, item, category or document) use a confirmation dialog, not a route.

## Hosting on GitHub Pages

- Vite builds with `base: '/daana/'`. The router uses `basename={import.meta.env.BASE_URL}`.
- The app uses clean paths through `BrowserRouter`, not hash URLs. GitHub Pages has no server-side rewrites, so the deploy workflow copies `index.html` to `404.html`. Deep links such as `/daana/events/<id>` then load the SPA, and the router handles the path. The side effect is an HTTP 404 status on the first load of a deep link. That is harmless for a private, logged-in app that doesn't need SEO.

## Later (V2)

- `/share/:token` — a public, read-only page where a contributor can see and confirm their items.
- `/events/:eventId/checklist` — a day-of checklist for marking items received.
