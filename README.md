# ppplaces (working name)

Friendly, gamified web app for smart travel itinerary planning and discovery.

- Product doc: [docs/PRD.md](docs/PRD.md) (also available as [docs/PRD.docx](docs/PRD.docx))
- This repo is intentionally separate from other repos on this machine.

## Stack

- **Cloudflare Pages** — static hosting for `public/`
- **Cloudflare Pages Functions** — `functions/api/*`, the server-side proxy that holds
  the secret Google Maps key and talks to Supabase (never exposed to the browser)
- **Supabase** — Postgres database + Auth (see `supabase/schema.sql`)
- **Google Maps Platform** — Places API (New) + Maps JavaScript API

No build step, no framework — plain HTML/CSS/JS on the frontend, plain `fetch`-based
functions on the backend.

## One-time setup

1. **Google Cloud** — new project, enable *Places API (New)* and *Maps JavaScript API*.
   Create two keys: one HTTP-referrer-restricted (for the browser) and one
   unrestricted/secret (for the server). Set a budget alert immediately.
2. **Supabase** — new project. In the SQL editor, run `supabase/schema.sql`. Grab the
   Project URL, `anon` public key, and `service_role` key from Settings -> API.
3. **Cloudflare** — create a Pages project, connect it to this repo (or use the
   `wrangler` CLI to deploy directly). In the Pages project's Settings ->
   Environment variables, add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `GOOGLE_MAPS_SERVER_KEY`. Buy/point the domain in the same Cloudflare account.
4. Locally:
   ```bash
   cp public/js/config.example.js public/js/config.js
   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, MAPS_BROWSER_KEY
   cp .dev.vars.example .dev.vars
   # fill in the same three server secrets as step 3, for local dev
   npm install
   npm run dev
   ```

`config.js` and `.dev.vars` are gitignored — never commit real keys.

## Status

Week 1 + Week 2/3 core loop scaffolded, following `docs/USER_FLOW.md` end to end:

- Supabase schema + RLS, guest (anonymous auth) session.
- Discovery search (`/api/places/search`, `/api/places/:id`) proxy with field masking
  and caching per the PRD's Section 4, plus `/api/geocode` for the "Dreaming about
  somewhere" trip-start path.
- Full mobile-first flow: Start a trip (Steps 0-1) → Pick a mood (Step 2) → Choose
  places (Step 3, save-to-trip) → Itinerary plan with drag/arrow reorder and
  quest-trail travel badges (Step 4) → Optimize my day (Step 5, nearest-neighbor
  heuristic) → Add a date (Step 6, flips Dream → Planning) → Navigation handoff to
  Google/Apple Maps, per-stop and whole-day (Step 7) → trip list / return visit
  (Step 9).
- Accessible reorder fallback (tap ▲▼ buttons, not drag-only), an explicit
  "Search this area" map control instead of auto-search-on-pan, and an on-demand
  rich detail modal (hours/address/reviews/photos-pending, via `/api/places/:id`)
  when a discovery card is tapped.
- Real typography (Fredoka display / Inter body per Section 2.3), squishy
  interaction details (card lift, chip bounce, button press depth), and a WCAG AA
  contrast pass — the PRD's own `--text-secondary`, `--brand-primary`,
  `--brand-secondary`, and `--accent-sky` values undershot the 4.5:1 floor the PRD
  itself requires; darkened in place, same hue family, values documented inline in
  `public/css/styles.css`.
- Not yet built: Arrival check-in/badges (Step 8), Walkie illustration (currently
  plain copy/emoji placeholders), desktop two-pane layout, and a real deploy
  (currently local dev only).

Needs your own Google Maps Platform keys (`MAPS_BROWSER_KEY` in `public/js/config.js`,
`GOOGLE_MAPS_SERVER_KEY` in `.dev.vars`) before it runs — see One-time setup above.
