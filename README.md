# ppplaces

**A playful, mobile-first trip planner that turns a pile of "places I want to see" into a walkable, optimized day.**

Designed, specced and built solo by [Iman Rafief](https://hhhelpstudio.com), from PRD to working app.

<!-- Add a screenshot or short GIF of the core flow here: docs/screenshot.png -->
<!-- Live demo: add the Cloudflare Pages URL once deployed -->

---

## The problem

Planning a trip means juggling Google Maps, a notes app, blog posts and a group chat. Utility tools feel like admin work. Inspiration tools (Pinterest, TikTok saves) don't understand geography. And nothing is built for people who are still dreaming, with no dates booked yet.

ppplaces treats itinerary building as a quest: collect places, drop them onto a day, and get back a realistic, optimized route.

## What it does

- **Mood-based discovery.** Pick a vibe, search real places, save them to a trip.
- **Itinerary builder.** Drag to reorder stops, with an accessible tap-button fallback (not drag-only).
- **Optimize my day.** Reorders stops into an efficient walking route from your starting point (nearest-neighbor heuristic on haversine distance).
- **Dream mode to planning mode.** Plan without dates. Adding a date flips the trip to "planning."
- **Navigation handoff.** Opens the day, or a single stop, in Google Maps or Apple Maps.
- **Guest sessions.** Start planning instantly with anonymous auth, no sign-up wall.

## Engineering highlights

- **API cost control.** Every Google Places call goes through a server-side proxy with field masking and caching, so the browser never sees the secret key and repeat searches don't re-bill.
- **Per-IP rate limiting.** Cloudflare KV counters on the metered endpoints stop a runaway client or scraper from running up the bill. Fails open if the binding is missing, so a config mistake can't take the API down.
- **Row Level Security.** Supabase Postgres schema where users can only read and write their own trips, days and stops.
- **Split key strategy.** A referrer-restricted browser key for map rendering, and an unrestricted key that only ever lives in server environment variables.
- **Accessibility.** A WCAG AA contrast pass caught that the original palette in my own spec fell short of 4.5:1. I darkened the values in the same hue family and documented them inline.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (ES modules, no framework, no build step) |
| Backend | Cloudflare Pages Functions |
| Database and auth | Supabase (Postgres, RLS, anonymous auth) |
| Maps | Google Places API (New), Maps JavaScript API |
| Infra | Cloudflare Pages, Cloudflare KV |

## Process

I wrote the product spec before any code: problem, positioning, design system, feature specs, API cost strategy, KPIs and a 30-day MVP plan.

- [Product requirements (PRD)](docs/PRD.md)
- [User flow and behavior spec](docs/USER_FLOW.md)

## Status

Core loop works end to end in local dev: start a trip, pick a mood, choose places, build and optimize the itinerary, add a date, hand off to navigation.

Next up: arrival check-ins and badges, the Walkie mascot illustrations, a desktop two-pane layout, and a public deploy.

---

## Running it locally

You'll need your own Google Maps Platform, Supabase and Cloudflare accounts.

1. **Google Cloud:** enable *Places API (New)* and *Maps JavaScript API*. Create two keys: one HTTP-referrer-restricted (browser) and one secret (server). Set a budget alert.
2. **Supabase:** create a project and run `supabase/schema.sql` in the SQL editor.
3. **Cloudflare:** create a Pages project and add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_MAPS_SERVER_KEY` as environment variables. Bind the `RATE_LIMIT` KV namespace under Settings > Functions.
4. Then:

```bash
cp public/js/config.example.js public/js/config.js   # SUPABASE_URL, SUPABASE_ANON_KEY, MAPS_BROWSER_KEY
cp .dev.vars.example .dev.vars                       # the three server secrets from step 3
npm install
npm run dev
```

`config.js` and `.dev.vars` are gitignored. Never commit real keys.
