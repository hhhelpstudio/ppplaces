# PRD: ppplaces *(working name)*
**Smart, playful travel itinerary planning and discovery**

| | |
|---|---|
| **Doc owner** | Principal PM / UX Architect (draft) |
| **Status** | Draft v2.0 — for review |
| **Platform** | Responsive Web App — mobile-first, desktop-enhanced |
| **Last updated** | 2026-08-11 |
| **MVP deadline** | 30 days from kickoff — see [Section 7](#7-development-plan--technical-environment) |

> **Naming note:** "ppplaces" is a working title used for internal planning only. Nothing in this PRD — data model, domain choices, illustration style, or codebase — should be hard-coupled to the name; treat renaming as a low-cost, anytime event (a find-and-replace + new logo asset, not a re-architecture).

---

## 1. Executive Summary & Product Vision

### 1.1 The problem
Planning a trip today means juggling six browser tabs: Google Maps for the "where," a spreadsheet or Notes app for the "what," a blog post for the "why," and a group chat for the "who's in." None of these tools talk to each other. The result is itineraries that are either over-engineered (a rigid, joyless minute-by-minute spreadsheet) or under-planned (a list of pins with no route logic, leading to backtracking, wasted time, and decision fatigue on the ground).

Existing tools split into two unsatisfying camps:
- **Utility-only tools** (Google Maps "Saved Lists," Wanderlog, TripIt): powerful data, but cold, spreadsheet-like UX that feels like admin work.
- **Inspiration-only tools** (Pinterest boards, TikTok "save for later"): delightful and social, but disconnected from real-world logistics — you still have to manually build the actual route.

**ppplaces** closes that gap: it is a trip planner that is *exact* where it needs to be (real map data, real travel times, real route optimization) and *delightful* everywhere else (the act of building, arranging, and completing your itinerary should feel like play, not project management).

Critically, it also closes a second, quieter gap: **every existing tool assumes you're planning a trip you're about to take.** If you don't have the dates, the budget, or even a travel companion yet, there's nowhere pleasant to put your daydreaming — so it dies in a Notes app or a Pinterest board that doesn't understand geography. ppplaces treats planning *itself* as worth doing well, independent of whether a plane ticket exists yet.

### 1.2 Product vision
> "Turn trip planning from a chore into a little adventure you take before the adventure."

ppplaces is a **friendly co-pilot for building your day**, not a booking engine and not a passive inspiration feed. The product's north star is: **one person alone, with zero planning experience and no confirmed travel date, should be able to turn a pile of "places I want to see" into a walkable, realistic itinerary in under 10 minutes — and feel genuinely good doing it.**

We achieve this by treating itinerary-building as a **quest**: you collect places (like collecting quest items), drop them onto a day, and watch the app draw your path and hand you a smart, optimized order — with a friendly guide, **Walkie**, narrating and nudging along the way.

**"Quiet luxury, anyone can do."** The product's emotional core is this: crafting a beautifully-sequenced day in Kyoto or Lisbon should feel like a small indulgence available to *anyone* right now, on their phone, for free, regardless of whether they can afford to fly there this year. ppplaces doesn't gate the pleasure of planning behind the ability to pay for the trip. The app should send one clear emotional signal, every session: *this plan is real, it's yours, and it's one step closer to happening* — whether "happening" is next month or someday. That's the difference between a wishlist app and ppplaces: **we make the dreaming feel productive**, which is itself the boost that turns "someday" into an actual trip. This applies equally to solo use as to groups — collaboration is a feature ppplaces supports, not a requirement to get value from it.

### 1.3 Meet Walkie
Walkie is ppplaces' mascot and functional guide — think Duolingo's owl crossed with a well-worn pair of walking shoes with a friendly face. Walkie is **not** a chatbot/AI-agent persona; Walkie is a **lightweight illustrated presence** used for:
- Empty states ("Walkie hasn't found any spots yet — let's go exploring!")
- Micro-encouragement at itinerary milestones ("Nice! That's a full day, and only 2.1 km of walking. Walkie's impressed.")
- Error/edge-case moments delivered with warmth instead of a bare error string ("Hmm, Walkie can't find a route there on foot — want to try driving?")
- The stamp/passport gamification layer (Phase 2)

Walkie should appear in **under 10 discrete illustrated poses/states** for v1 to keep production scope sane (idle, happy, thinking, confused, celebrating).

### 1.4 Positioning statement
For travelers and weekend-trip planners who are overwhelmed by disconnected maps, lists, and blog posts, **ppplaces** is a web-based itinerary planner that turns saved places into an optimized, walkable route in minutes. Unlike Google Maps lists or spreadsheet itineraries, ppplaces combines real routing intelligence with a warm, game-like planning experience — so the *planning* feels as good as the *trip*.

### 1.5 Utility-first principle (guardrail for every phase)
This is the single most important product constraint, restated so it survives contact with roadmap pressure:

> **If a gamified feature and a core-utility feature compete for the same engineering sprint, utility wins — every time, through Phase 1.** Badges, streaks, and leaderboards are seasoning. Correct travel times, correct routes, and correct place data are the meal. A beautiful itinerary that gets someone lost or wastes their afternoon is a failed product, no matter how cute the confetti animation is.

Gamification (Section 6) exists to increase *engagement with a tool that already works*, not to paper over a tool that doesn't.

### 1.6 Target users (Phase 1)
Solo use is a first-class scenario, not a fallback — the product must be fully valuable to a single person with an empty account and no confirmed plans. Nothing in Phase 1 should require inviting another person, entering a date, or having a booking in hand before the core loop (search → collect → sequence → admire) becomes fun.

1. **The Weekend Planner** — plans 1–3 day city trips or day-trips, solo or with a partner/friend group. Wants speed and confidence, not spreadsheets. (Primary persona — trip is imminent and dated.)
2. **The Dream Chaser** — has a bucket-list trip in mind (a city, a region, a "someday") but no confirmed dates or budget yet. Wants to build the itinerary *now*, in full detail, so that when the money and time do line up, the plan is already sitting there ready to go. For this persona, the planning session itself is the emotional payoff — it should feel like progress toward the goal, not premature busywork. (Primary persona — trip is real intent, undated.)
3. **The Map Wanderer** — plans itineraries purely as a creative, relaxing hobby: "window shopping" a city they may never actually visit, purely for the pleasure of discovering places and laying out a beautiful, plausible day. Never expects to fire a Navigation Handoff, and that's a legitimate, fully-supported way to use the product, not a failure to convert. (Primary persona — no travel intent at all; the itinerary *is* the deliverable.)
4. **The Group Trip Organizer** — the "designated planner" in a friend group of 4–8 for a longer trip. Needs to collect everyone's wish-list spots and turn chaos into a plan without 40 WhatsApp messages.
5. **The Local Explorer** — plans "staycation" days or weekend outings in their own city, discovering new spots via mood/category browsing rather than starting from a fixed list.

Personas 1–3 together justify a product-level distinction, introduced in Section 3.1: every Trip carries a **Trip Mode** — *Dream* (no dates required, low-pressure, aspirational framing) or *Planning* (dates set, anchors matter, headed toward an actual departure). A Dream trip can be promoted to Planning at any time with zero rework; nothing is lost by starting in Dream mode, which keeps the barrier to opening the app for the first time as low as possible.

### 1.7 Non-goals for Phase 1 (explicitly out of scope)
- Flight/hotel booking or price comparison
- Full social network / public profile feed
- Native iOS/Android apps (responsive web only)
- Real-time multi-user collaborative editing (Phase 2 candidate)
- AI-generated full itineraries from a single prompt ("plan me 3 days in Rome") — Phase 1 is *builder-assisted*, not *generator-first*, to keep trust high and Google API cost predictable. May be explored post-Phase-2.

### 1.8 Platform strategy: mobile-first, desktop-enhanced
Both surfaces matter, but they are not equally weighted, and neither is a stripped-down version of the other:

- **Mobile web is the primary surface.** Most sessions — especially Dream Chaser and Map Wanderer "a few spare minutes on the couch" sessions, and Weekend Planner on-the-ground adjustments — happen on a phone browser. Every core flow (search, collect, sequence, optimize, handoff) must be fully usable one-handed on mobile with no feature locked behind "open this on desktop." Mobile gets built and tested **first**, not adapted last.
- **Desktop adds hierarchy and breathing room, not new capability.** With more screen real estate, desktop earns a richer layout: persistent side-by-side map + timeline (Section 2.6), multi-day overview at a glance, and easier drag-and-drop across a wider canvas. This makes desktop the better tool for a longer, more deliberate planning session (e.g., building out a full week), while mobile remains the better tool for quick capture and on-the-go tweaks.
- **Neither is obsolete relative to the other.** A user should be able to start a trip on their phone at a coffee shop and pick it up on a laptop that evening with zero friction (same account, same autosaved state) — and vice versa. The product goal is "the right tool for the moment," not "mobile is the demo and desktop is the real app," or the reverse.

---

## 2. Design System & UI/UX Guidelines

### 2.1 Design principles
1. **Squishy, not sharp.** Every tappable surface reads as soft and tactile — generous corner radii, subtle drop shadows, gentle press-states. Nothing in the interface should look like a spreadsheet or an admin console.
2. **Motion is feedback, not decoration.** Micro-animations confirm actions (a card "lands" with a little bounce when dropped into the itinerary) — they are never purely ornamental delays.
3. **Copy talks like a helpful friend, not a system.** No "Error 404," no "Submission failed." Always plain language, always Walkie's voice: warm, brief, a little playful, never sarcastic at the user's expense.
4. **Data density is earned, not defaulted.** Lists start light (image, name, rating, category chip) — detail is one tap away in a modal, never crammed into the card.
5. **Accessibility is not optional seasoning.** Pastel ≠ low-contrast. All text/background pairs must meet WCAG AA (4.5:1 for body text). Motion must respect `prefers-reduced-motion`.

### 2.2 Color palette
Warm, cozy pastels as backgrounds; saturated "candy" accents reserved for interactive/gamified moments only, so they keep their signal value.

| Token | Hex | Usage |
|---|---|---|
| `bg-canvas` | `#FBF3E9` (warm cream) | App background |
| `bg-surface` | `#FFFFFF` | Cards, sheets, modals |
| `bg-muted` | `#F3E8DA` | Secondary panels, disabled states |
| `brand-primary` | `#FF8A5B` (terracotta coral) | Primary CTA, active states |
| `brand-primary-dark` | `#E4653A` | Primary hover/press |
| `brand-secondary` | `#7FB6A2` (sage green) | Secondary actions, route lines |
| `brand-tertiary` | `#F4C95D` (honey yellow) | Gamification accents, stamps, streaks |
| `accent-berry` | `#C9629B` | Highlights, "mood" tags |
| `accent-sky` | `#8FB8DE` | Map/route UI, links |
| `text-primary` | `#3A2E27` (warm charcoal, not pure black) | Body text |
| `text-secondary` | `#8A7A6D` | Captions, metadata |
| `success` | `#5FA777` | Confirmations |
| `warning` | `#E4A94A` | Soft warnings (e.g., "this day is packed") |
| `danger` | `#D9694F` | Destructive actions only |

Dark mode: shift `bg-canvas` → `#221C18`, `bg-surface` → `#2E2620`, invert text tokens, desaturate accents ~10% to prevent neon glare. Pastel warmth is preserved via hue, not lightness.

### 2.3 Typography
- **Display / headings:** A rounded, friendly geometric sans with real personality (e.g., Fredoka, Baloo 2, or a licensed equivalent) — used sparingly for headlines, day titles, and Walkie speech bubbles.
- **Body / UI text:** A highly legible humanist sans (e.g., Inter, General Sans) for everything functional — place names, addresses, buttons — so density never sacrifices clarity.
- Minimum body size 15px web / 16px mobile web to avoid pinch-zoom.

### 2.4 Component styling guidelines
- **Cards:** 20–24px corner radius, soft dual-layer shadow (`0 1px 2px` crisp + `0 8px 24px` diffuse warm-toned shadow, never pure black). Cards have a subtle "lift" on hover/focus (2–4px translate + shadow bloom).
- **Buttons:** Pill-shaped (full radius). Primary buttons have a tactile press animation (scale to 0.97, shadow compresses) — mimics a physical button being pushed, reinforcing the "squishy" language.
- **Chips/Tags (category, mood filters):** Rounded-full, outlined by default, filled with `brand-secondary` or `accent-berry` tint when active, with a small bounce-in on selection.
- **Inputs:** Rounded rectangles (12–16px radius), soft inset shadow, no harsh borders — border appears in `brand-primary` only on focus.
- **Modals/Sheets:** Bottom sheet on mobile (slides up with spring easing), centered modal with soft scale-in on desktop. Always dismissible by swipe-down/tap-outside.
- **Iconography:** Rounded-stroke icon set (no sharp/thin line icons) at consistent 2px stroke weight, matching the squishy language.

### 2.5 Gamified interaction patterns (v1-safe subset)
These patterns must work *in service of* the utility flows below, not alongside them:
- **Drag-and-drop with physicality:** cards have weight — slight rotation on pickup, spring-settle on drop, a soft "thunk" sound (optional, mutable) and haptic (mobile) on successful placement.
- **Progress-as-path:** the itinerary is visually presented as a trail/path with numbered waypoint markers (like a quest map), not a plain numbered list — reinforcing the "journey" metaphor at zero extra utility cost.
- **Milestone celebrations:** small, tasteful confetti/sparkle burst + Walkie cameo when a day's itinerary is "complete" (e.g., first time all stops are sequenced) or when route optimization saves the user a meaningful amount of time ("Walkie shaved 22 minutes off your day!"). Capped at most 1 celebratory moment per user action to avoid fatigue.
- **Collectible framing for saves:** saving a place to a mood board is framed as "collecting" it (subtle sparkle + icon fly-to-board animation), foreshadowing the Phase 2 Passport system without building it yet.

### 2.6 Responsive behavior
Per the platform strategy in Section 1.8, mobile is designed and built first; desktop is a layout upgrade on the same underlying flows, not a separate feature set.

- **Mobile web (<768px) — design baseline:** single-pane, map-as-sheet pattern (map is the base layer; itinerary/discovery surfaces as a draggable bottom sheet, similar to Google Maps / Airbnb map view). Drag-and-drop on mobile uses long-press-to-lift + auto-scroll, with an explicit "Add to Day" button as a non-drag fallback (critical accessibility/usability requirement — do not ship drag-only interactions on mobile). Every acceptance criterion in Section 3 must pass on mobile before it is considered done; desktop is verified second.
- **Tablet (768–1023px):** collapsible map — toggle between list and map view, or a resizable split.
- **Desktop (≥1024px) — hierarchy upgrade:** persistent two-pane layout — map/canvas on one side, itinerary builder / discovery list on the other, both visible at once with no sheet-toggling. Adds the multi-day overview strip (see all days at a glance, not just tabbed) and wider drag-and-drop targets. Pointer-based drag-and-drop between panes is additive here, not a replacement for the tap-based flow.

---

## 3. Core Feature Specifications (Phase 1)

### 3.1 Quest-Style Interactive Itinerary Builder

**Purpose:** Let users assemble a day (or multi-day trip) by dragging saved/discovered places onto a visual timeline, with the map redrawing the path live.

**Key elements:**
- **Trip Mode: Dream vs. Planning.** Every Trip is created in one of two modes, chosen with a single friendly toggle (default: Dream, to keep first-use friction at zero):
  - **Dream mode** — no dates, no anchors required. Copy leans aspirational ("Someday in Kyoto"), the day-bar and optimizer still work (they're part of what makes the plan feel *real*, per Section 1.2), but nothing nags the user to "confirm" or "book." This is the default home for the Dream Chaser and Map Wanderer personas.
  - **Planning mode** — dates and a start anchor are expected, and the UI nudges toward completion and handoff (Section 3.4). This is the Weekend Planner / Group Organizer default.
  - A Dream trip can be flipped to Planning at any time (e.g., the user finally books flights) with **zero data loss or rework** — same Trip → Day → Stop structure underneath; the mode only changes copy, nudges, and which optional fields are surfaced. This "someday → planned" transition is itself a tracked moment of delight (small celebratory beat, Section 2.5) and a KPI (Section 6).
- **Trip → Day → Stop hierarchy.** A Trip contains 1..N Days; each Day contains an ordered list of Stops (places) plus optional time anchors (e.g., "Lunch ~1pm").
- **Dual-pane canvas:** left/top = day timeline (vertical list of stop cards, quest-trail styled with connecting dotted path + walk/drive-time badges between consecutive stops); right/bottom = live map with numbered pins (1, 2, 3…) and a drawn polyline connecting them in order.
- **Drag-and-drop reordering:** dragging a stop card up/down the timeline instantly re-renders the map path and recalculates all inter-stop travel-time badges (via cached Distance Matrix data where possible — see Section 4).
- **Drag-in from Discovery:** users can drag a place card directly from the Mood Board Discovery Hub (3.3) onto a specific day/position in the timeline, or drop it on the map itself (auto-inserts at nearest logical position along the current path).
- **Path visualization details:**
  - Solid line segments = walking or driving directions already resolved.
  - Dashed/pulsing line = "unresolved" segment (mode not yet chosen, or distance not yet fetched) — resolves within ~1s via async Directions lookup, never blocks the drag interaction.
  - Segment badges show mode icon + duration (e.g., 🚶 12 min), color-coded by `brand-secondary` (walk) vs `accent-sky` (drive/transit).
- **Time budget indicator:** a soft horizontal "day bar" shows cumulative time-in-transit vs. time-at-venues vs. free/buffer time for the day, with a friendly warning state (not blocking) if the day looks overpacked ("This day's looking full — Walkie counted 6 stops and only 45 min of breathing room").
- **Multi-day support:** day tabs across the top (Day 1 / Day 2 / …), each day independently orderable; a stop can be moved between days via drag or a "Move to…" menu (mobile-friendly non-drag path).
- **Undo/redo:** every reorder, add, and remove is undoable (toast with "Undo" affordance, 5s window) — critical trust feature for a drag-heavy interface where mis-drops will happen.
- **Autosave:** every change persists immediately (debounced ~800ms) to the backend; no explicit "Save" button — reinforces the low-friction, game-like feel.

**Empty state:** Walkie illustration + "Your day's a blank map — drag in a few spots to get started" with a shortcut CTA into the Discovery Hub.

**Acceptance criteria (representative):**
- Reordering a stop updates the map polyline and all adjacent travel-time badges in <300ms perceived latency (optimistic UI; true recalculation may complete async).
- Removing a stop from the middle of a day re-links the path between its former neighbors automatically.
- Works via keyboard (arrow-key reorder + "move" mode) for accessibility parity with drag-and-drop.

### 3.2 Smart Start-Point & Route Optimizer

**Purpose:** Remove the single biggest planning tax — figuring out *what order* to visit places in — while keeping the algorithm's reasoning legible and the user in control.

**Anchor selection:**
- User sets one or more **anchors** per day: a mandatory Start Point (e.g., hotel, Airbnb, "current location") and optionally an End Point (e.g., "back to hotel" vs. "ending near dinner, no return needed").
- Anchors are set via a friendly prompt at day-creation ("Where are you starting from?") with quick options: current location, saved home base, or search-a-place (Places Autocomplete, field-masked to basic fields).
- Time-locked stops: users can optionally pin a stop to a rough time window (e.g., "Museum — must arrive by 2pm for reservation"); the optimizer treats these as **hard constraints** and only reorders the flexible stops around them.

**"Optimize My Day" action:**
- A single prominent button (with a friendly loading state — Walkie "scouting the best path") triggers route optimization across all *unlocked* stops for that day, respecting:
  1. Fixed start anchor (required)
  2. Fixed end anchor (if set) or "open-ended" (optimizer picks the natural terminal stop)
  3. Any time-locked stops as waypoint constraints
  4. Selected travel mode (walk / drive / transit — user-toggleable per day)
- Under the hood this solves a constrained variant of the **Traveling Salesman Problem (TSP)** — for typical day-trip sizes (≤12–15 stops) this is small enough for an exact or near-exact solve (e.g., held-karp for small N, or a 2-opt/Or-opt heuristic seeded by nearest-neighbor for larger N) using a **precomputed distance/duration matrix** for that stop set (see Section 4 for how that matrix is sourced cheaply).
- **Algorithm transparency ("explain this order"):** after optimizing, a small expandable "Why this order?" affordance shows a plain-language rationale, e.g.: *"Walkie grouped these because the museum and café are 4 min apart, and looping back would've cost you an extra 18 minutes of walking."* This is a lightweight templated explanation (built from the before/after total-distance delta and any obvious clustering), **not** a free-text LLM narrative in Phase 1 — keeps behavior predictable and avoids added API/inference cost.
- Optimization is **suggestive, not destructive**: it proposes a new order as a preview (ghosted path overlay) with "Apply" / "Keep my order" — never silently reorders a user's manually-arranged day.
- Shows the delta clearly: "New order saves ~34 minutes of travel time" as the primary decision-driving number.

**Edge cases the spec must handle:**
- Optimizer with 0–1 flexible stops: button is disabled with a tooltip ("Add a couple more stops to optimize").
- Conflicting time-locks (e.g., two locked stops whose walk-time makes both windows infeasible): surfaced as a soft warning, not a silent failure — "These two might be tight on time — double-check the gap."
- Mode mismatches (e.g., a stop only reachable by car dropped into a walking-mode day): flagged inline on that stop's card.

### 3.3 Mood Board Discovery Hub

**Purpose:** The "inspiration" surface — where users find new places by vibe/category rather than already knowing what they want, and save them into a trip.

**Structure:**
- **Category & mood filters** presented as friendly rounded chips, not a dropdown: e.g., ☕ Coffee & Cafés, 🍜 Food, 🎨 Art & Culture, 🌳 Parks & Nature, 🛍️ Shopping, 🌙 Nightlife, 📸 Photo Spots, 💎 Hidden Gems. Filters map to Google Places `type`/`primaryType` plus a curated internal "mood" taxonomy layered on top (e.g., "Hidden Gems" = lower `userRatingCount` + high `rating`, a derived heuristic, not a native Google field).
- Multi-select filters combine as AND within category groups, OR across (standard faceted search pattern), with a live result count.
- **List view:** a masonry/grid of place cards showing only field-masked **Basic Tier data** — photo, `displayName`, `rating`, price level indicator, primary category chip, distance from current map center/anchor. This is the cost-critical view (see Section 4).
- **Map-synced browsing:** discovery list and map are linked — panning/zooming the map re-queries the visible viewport (debounced, with an explicit "Search this area" button rather than auto-search-on-every-pixel-of-pan, to bound API call volume); tapping a pin highlights its card and vice versa.
- **Rich detail modal:** tapping a card opens a bottom-sheet/modal that upgrades the single selected place to richer Google metadata **on-demand only** (photos gallery, full address, opening hours, editorial summary, review snippets, website/phone) — this is the only point where higher-cost Google fields are fetched, and only for the one place the user actively opened.
- **Save/collect action:** a prominent "+" or heart-style button on both the card and modal saves the place to the current trip's mood board (unsorted pool) or directly to a specific day. Saving triggers the "collectible" micro-animation (Section 2.5).
- **Mood Board as staging area:** saved-but-unscheduled places live in a dedicated "Collected" tray, distinct from the day-by-day itinerary — this is deliberately the *inspiration pool*, decoupled from the *committed plan*, so browsing never feels like it forces a decision.

**Acceptance criteria (representative):**
- List view never issues a Place Details (Enterprise/Atmosphere-tier) call for more than one place at a time.
- Reopening a previously-viewed place's modal within a session serves from cache (no duplicate Details call) — see Section 4.
- Filter changes re-run search against cached results first; only calls Places API (Nearby/Text Search) when the query signature (location + radius + type) hasn't been served recently.

### 3.4 Navigation Handoff

**Purpose:** ppplaces plans the trip; it explicitly does **not** try to replace turn-by-turn navigation. The handoff moment must be fast, obvious, and correct.

**Flow:**
- The primary action's label and urgency follow **Trip Mode** (Section 3.1): a **Planning-mode** trip shows a prominent **"Let's Go"** navigate action, since a real departure is expected. A **Dream-mode** trip shows a softer **"Save for when you're ready"**/"Keep dreaming" affordance instead — the full handoff option is still available underneath (a Map Wanderer or Dream Chaser is never blocked from navigating if they change their mind), it's just not presented as the thing they're "supposed" to do next. This keeps the product honest about the difference between "I'm planning this for Tuesday" and "I'm planning this for fun."
- Each Day view and each individual Stop has a navigate action per the above.
- **Per-stop handoff:** one tap opens a native choice sheet — "Open in Google Maps" / "Open in Apple Maps" (auto-detected default based on OS: Apple Maps pre-selected on iOS Safari, Google Maps pre-selected elsewhere, always both options visible) — deep-linking directly to turn-by-turn directions from the user's current location (or previous stop, if navigating stop-to-stop) to that place's coordinates/`place_id`.
- **Full-day handoff:** "Send this whole day to Google Maps" constructs a **multi-stop Google Maps URL** (origin + up to Google Maps' supported waypoint count + destination, in the optimized order) so the user can start turn-by-turn for the entire sequence in one action, rather than stop-by-stop.
- Handoff uses **universal/deep links** (`https://maps.google.com/...` / `maps://` / `comgooglemaps://` where installed) so it opens the native app when available, falling back gracefully to web.
- This is the point where ppplaces intentionally lets go — no in-app map-matching, no re-implementing turn-by-turn, no GPS road-snapping. Reinforces the cost strategy (Directions API is used for *planning-time* route shape and duration estimates, never for live turn-by-turn re-routing).

**Acceptance criteria:**
- Handoff link opens with the correct stop order preserved even if the user reordered stops after the last optimization run.
- If offline or the deep link fails, a plain address + "Copy address" fallback is always available.

---

## 4. Data Flow & API Cost-Optimization Technical Strategy

This section is the technical backbone that makes the product viable at scale — Google Maps Platform billing is usage-metered per field/call type, and an itinerary app that naïvely calls full Place Details on every list render will not survive its own growth.

### 4.1 Guiding principle
> **Fetch the cheapest field set that satisfies the current UI surface. Cache everything that is allowed to be cached. Never re-fetch what you already have.**

### 4.2 Field masking — tiered data strategy

| Surface | Fields requested | Google SKU tier | Notes |
|---|---|---|---|
| Discovery list / grid cards | `id` (place_id), `displayName`, `rating`, `userRatingCount`, `primaryType`, one `photo` reference, `location` | **Basic** (Places API New: Text Search / Nearby Search with Field Mask header restricted to Basic fields) | This is the highest-volume surface — must stay Basic-only, no exceptions. |
| Map pins (list view) | `id`, `location`, `displayName` | **Basic (ID Only / Location)** | Even cheaper sub-tier — pins don't need rating/photo until tapped. |
| Rich detail modal (on open) | `+ formattedAddress`, `regularOpeningHours`, `editorialSummary`, `photos` (gallery), `reviews` (snippet), `websiteUri`, `nationalPhoneNumber`, `priceLevel` | **Enterprise / Enterprise + Atmosphere** | Fetched **once per place per cache-TTL window**, only on explicit user tap — never prefetched speculatively for off-screen cards. |
| Itinerary stop cards (already-saved places) | Served from **our DB cache** (see 4.3), not re-queried against Google at all unless data is stale past TTL | N/A (cache hit) | Once a place is saved to a trip, we own a durable copy of its basic metadata. |

Implementation detail: every Places API (New) request sets an explicit `X-Goog-FieldMask` header — there is no "default" call in this codebase; a request without an explicit mask should fail CI review.

### 4.3 Backend caching layer

**`places` table (canonical cache):**
- Primary key: Google `place_id`.
- Stores: basic-tier fields (name, category, rating, rating count, lat/lng, one photo reference) fetched at first sight, plus a `last_basic_fetch_at` timestamp.
- A second optional payload (`rich_metadata` JSON blob: hours, editorial summary, review snippets, photo gallery refs) populated only once a user opens the detail modal for that place, with `last_rich_fetch_at`.
- **TTL policy:** basic metadata refreshed if `last_basic_fetch_at` > 30 days old *and* the place is actively being viewed (lazy refresh, not a batch job — we don't pay to keep data fresh for places nobody's looking at). Rich metadata (hours especially) refreshed if >7 days old and reopened.
- This cache serves **every subsequent user** who discovers or saves the same place — the marginal Google API cost of a popular landmark trends toward zero after the first few thousand users.
- Photos: we cache the Google **photo reference/name**, not the binary — actual image bytes are fetched via the Places Photo endpoint (or proxied/cached in our own CDN/object storage after first fetch, with attribution preserved per Google's ToS) to avoid repeated photo-media billing for the same photo reference.

**Search-query cache (short-TTL, separate from place cache):**
- Caches Text Search / Nearby Search **result sets** keyed by a normalized signature (rounded geohash of viewport center + radius bucket + type/mood filter set), TTL ~15–30 min.
- A "Search this area" click that matches a recent signature serves cached place_id list instantly (then joins against the `places` table for display) — zero new Google Search-tier calls.

### 4.4 Client-side map rendering
- The **Maps JavaScript SDK** (loaded client-side, API-key restricted by HTTP referrer) handles all map rendering, pin placement, polyline drawing, and viewport/pan events. This is billed per map load, not per data operation, and keeps rendering logic off our backend entirely.
- Client requests our backend for place/search data (never calls Google Places REST directly from the browser) — this lets us enforce field masking, caching, and rate-limiting server-side, and keeps the Places/Distance Matrix/Directions API key server-only (not exposed client-side).
- Polylines for the itinerary path are drawn client-side from coordinates/geometry returned by our backend (which itself sources them from Directions or OSRM/GraphHopper, per 4.5).

### 4.5 Hybrid routing strategy (the core cost lever)

Routing is the single most expensive category to naively over-call (Distance Matrix scales O(n²) with stop count, and Directions calls carry their own per-request cost). The hybrid approach:

**Step 1 — Backend distance/duration matrix (cheap, self-hosted):**
- For the N×N matrix needed by the route optimizer (Section 3.2) and for showing "walk time" badges between arbitrary stop pairs, use a **self-hosted OSRM or GraphHopper instance** seeded with OpenStreetMap data. This gives near-instant, free (post-infra-cost), good-enough walking/driving duration estimates for *comparative optimization* — the optimizer doesn't need Google-precision numbers, it needs *consistent, correct-enough-to-rank* numbers.
- This is what powers: live path-redraw during drag-and-drop, the TSP-style optimizer's cost matrix, and the "time budget" bar — all high-frequency, recompute-on-every-drag operations that would be financially unworkable against a metered Google API.

**Step 2 — Google Directions API (accurate, used sparingly):**
- Google Directions is called only at **low-frequency, high-value moments**:
  - Rendering the *actual* polyline shape for a confirmed (not-being-dragged) day plan, so the visual path matches real streets/sidewalks rather than an OSRM approximation, for the final "here's your day" view.
  - The one-time "Optimize My Day" confirmation step, to validate/display accurate final ETAs before the user commits.
  - Never called per-drag-frame or per-hover — only on explicit user actions (drop finalized, optimize confirmed, day published/shared).
- Google Distance Matrix API is avoided as the default source for the N×N optimizer matrix specifically *because* of its per-element billing at scale — it's reserved as a fallback only where OSRM data is unavailable/low-confidence (e.g., transit mode, which OSRM doesn't model well) or for a final accuracy pass on a small, already-optimized route (≤10 elements) rather than the full pre-optimization matrix.

**Step 3 — Navigation handoff (Section 3.4):** no API cost at all — it's a deep link, Google's own Maps app does the turn-by-turn compute.

### 4.6 Rate limiting & abuse prevention
- Per-session and per-IP rate limits on search/discovery endpoints server-side, independent of Google's own quota, to prevent a single runaway client (bug or scraper) from generating unbounded billed calls.
- Autocomplete (Places Autocomplete, used in anchor/start-point search) uses **session tokens** correctly (one token per autocomplete "session" ending in a Place Details or selection call) to get Google's bundled session pricing rather than per-keystroke billing.

### 4.7 Data flow diagram (textual)

```
User action (search / drag / optimize)
        |
        v
   ppplaces Backend API
        |
        +--> [places cache DB] --hit--> return cached basic/rich fields
        |         |
        |        miss
        |         v
        |   Google Places API (New) -- field-masked request --> store in cache --> return
        |
        +--> [search-query cache] --hit--> return cached place_id list
        |         |
        |        miss
        |         v
        |   Google Places Text/Nearby Search --> cache result signature --> return
        |
        +--> Route/optimize request
                  |
                  +--> Self-hosted OSRM/GraphHopper (N×N matrix, live drag recompute)
                  |
                  +--> Google Directions API (final polyline + confirmed ETAs only)
        |
        v
Client (Maps JS SDK renders pins/polylines; UI renders cards from returned JSON)
        |
        v
"Let's Go" handoff --> deep link to native Google Maps / Apple Maps (no API cost)
```

---

## 5. Secondary Feature Roadmap (Phase 2)

Explicitly sequenced *after* Phase 1 utility is validated (see KPIs, Section 6) — these deepen engagement and open monetization but must not distract engineering from the core loop until it's proven.

### 5.1 GPS Passport & "Monet" style stamp collection
- A **visual passport book**, illustrated in a soft, painterly "Monet-inspired" style (impressionistic watercolor stamps rather than literal badge icons), that fills in as users **actually visit** places they planned (verified via one-time GPS check-in when physically near a saved stop, not just "marked as done" from the couch).
- Each visited city/region unlocks a themed spread (e.g., a soft watercolor skyline) with individual place-stamps collected inside it.
- Designed to reward *follow-through* on planned itineraries specifically — reinforcing the core loop (plan → go → complete) rather than being a generic check-in game disconnected from the planning tool.
- Requires: geofencing/proximity check logic, a "trip completed" state machine, and new illustration production (out of scope for Phase 1 design budget).
- Privacy note: location capture for check-ins must be explicit opt-in, foreground-only, and never used for anything beyond stamp unlocking without separate consent.

### 5.2 Venue Leaderboards & B2B Merchant Promos
- **Leaderboards:** lightweight, opt-in local leaderboards (e.g., "Most collected cafés in Lisbon this month") sourced from aggregated, anonymized save/visit data — a discovery mechanism as much as a game mechanic, surfacing genuinely popular spots to new users.
- **B2B merchant promos:** a self-serve or sales-assisted portal for venues (initially claimable via a Google Business Profile-style verification flow) to offer ppplaces users a small perk (e.g., "10% off if you've got us on your itinerary today") surfaced contextually in the Stop card/detail modal when a user has that venue actively planned or checked in.
- Monetization path: promoted placement in Discovery Hub mood categories (clearly labeled "Sponsored," never displacing organic relevance ranking below the fold) + a modest transaction/booking referral fee where applicable — evaluated only after Phase 1 retention data justifies building a sales/ops function.
- Both features are **data-and-trust-dependent** on Phase 1: leaderboards need real usage volume to be meaningful and not gameable; merchant promos need a critical mass of engaged local users to be sellable. Sequencing them after Phase 1 is a hard dependency, not just a priority call.

---

## 6. Key Performance Indicators (KPIs) & Launch Success Metrics

KPIs are organized by what they validate, since "engagement" and "utility" can trend in opposite directions if not tracked separately (e.g., a confusing flow can inflate time-on-task metrics while actually indicating friction).

### 6.1 North Star Metric
**Weekly Crafted Itineraries** — a Trip with ≥1 Day containing ≥3 sequenced Stops, regardless of Trip Mode. Deliberately does **not** require a Navigation Handoff: per Section 1.6, the Map Wanderer and Dream Chaser personas are core users who may never fire a handoff, and a North Star that only counts "trips actually taken" would misclassify a fully successful Map Wanderer session as a failure. Navigation Handoff is tracked separately (6.2) as a *travel-intent* signal, not folded into the top-line success metric.

A secondary, explicitly-labeled metric — **Weekly Realized Itineraries** (a Crafted Itinerary that also fired ≥1 Navigation Handoff) — is watched alongside the North Star to make sure the Planning-mode/Weekend-Planner segment specifically is being served well, but it is not the number the whole team optimizes against.

### 6.2 Core utility / activation metrics
| Metric | Definition | Target (90 days post-launch) |
|---|---|---|
| Time-to-first-itinerary | Signup → first Day with ≥3 stops sequenced | Median < 10 minutes |
| Optimizer adoption rate | % of Trips with ≥4 stops that use "Optimize My Day" at least once | > 50% |
| Optimizer acceptance rate | % of optimization suggestions "Applied" vs. "Kept my order" | > 60% (validates optimizer quality/trust) |
| Handoff conversion (Planning-mode trips only) | % of published Days in Planning mode that trigger ≥1 Navigation Handoff | > 40% |
| Discovery-to-save rate | % of viewed Discovery cards that get saved to a trip | Baseline in first 30 days, then improve QoQ |
| Dream → Planning conversion | % of Dream-mode trips that are later flipped to Planning mode within 6 months | Directional metric, no hard target pre-launch — this is the quantified version of "the boost to someday fulfill it" from Section 1.2; track it even though it moves slowly |
| Solo trip share | % of Trips with exactly one collaborator (the creator) | Expected to be the majority in early months — a *low* share would suggest the product is accidentally gatekeeping value behind group formation, contradicting Section 1.6 |

### 6.3 Cost-efficiency metrics (guardrails, not growth goals — but must be on the same dashboard as growth)
| Metric | Definition | Target |
|---|---|---|
| Google API cost per Weekly Active Trip Planner | Total Places+Directions+Distance Matrix spend / WAU planners | Defined ceiling set with Finance pre-launch; alert at 80% of ceiling |
| Cache hit rate (place basic data) | % of place-detail requests served from `places` cache vs. live Google call | > 85% by month 3 |
| Rich-detail fetch ratio | Rich (Enterprise-tier) calls per session | < 1.5 per active planning session (proves "on-demand only" discipline is holding) |
| OSRM vs. Google Directions call ratio | Route-matrix calls served by self-hosted routing vs. Google Directions | > 90% OSRM/self-hosted |

### 6.4 Engagement / gamification health metrics (secondary — must not be optimized at utility's expense)
| Metric | Definition | Notes |
|---|---|---|
| D7 / D30 retention | Returning planners | Track alongside optimizer-adoption to check gamification is retaining *planners*, not just browsers |
| Collectible-save engagement | Saves-per-session via Mood Board | Should correlate positively with eventual itinerary completion — if it doesn't, the Discovery Hub is becoming a Pinterest clone, which is a mis-fire against Section 1.5's guardrail |
| Celebratory-moment fatigue | % of milestone animations dismissed instantly / skipped | If rising over time, indicates animation frequency needs tuning down |

### 6.5 Launch success gate (go/no-go for Phase 2 investment)
Phase 2 (Passport, Leaderboards, B2B) investment is greenlit only when, sustained over a rolling 4-week window:
- Optimizer adoption ≥ 50% **and** acceptance ≥ 60% (core algorithm is trusted),
- Cache hit rate ≥ 85% (cost model is holding at scale),
- North Star (Weekly Crafted Itineraries) shows positive week-over-week growth for 4+ consecutive weeks.

This ordering is deliberate: it forces the org to prove the *utility* engine before spending design/eng budget on the *delight* layer that Section 1.5 subordinates to it.

---

## 7. Development Plan & Technical Environment

This section exists because the constraint that matters most right now isn't the full Phase 1 spec in Sections 2–4 — it's **shipping something real in 30 days**, on a stack the builder already knows. Everything below is written against that constraint first, with the full spec as the direction to grow into afterward, not the bar for day 30.

### 7.1 Is "vanilla JS/HTML/CSS + Hostinger" enough?

**Short answer: enough for the front end, not enough on its own for the whole product — and that's fine, the gap is small.**

What Hostinger + vanilla JS/HTML/CSS covers well:
- Serving the actual app the user interacts with — pages, styling, animations, the Maps JavaScript SDK (which is just a `<script>` tag and plain JS calls, no framework required), drag-and-drop via a small vanilla-JS-friendly library. This is 100% consistent with the stack already known and does not need to change.

What it doesn't cover, and why that gap can't be skipped:
1. **A secret API key.** Google Places/Directions calls need an API key that must **never** ship to the browser (Section 4.4) — anyone can read your page source and steal a client-exposed key, then run up your Google bill. Something has to hold that key server-side and proxy the calls. Static file hosting (what most Hostinger shared plans give you) can't do this — there's no server-side code execution.
2. **A shared database.** Trips, days, stops, and the place-metadata cache (Section 4.3) need to persist somewhere queryable and shared across a user's devices (and across users, for the cache to pay off). Plain HTML/CSS/JS has no database.
3. **User accounts.** Even a lightweight "save my trip and find it again later" flow needs auth of some kind.

None of this requires abandoning vanilla JS as a *skill* — it requires exactly **one small server-side proxy function** and **one hosted database with a JS client library**, both of which are written in the same plain JavaScript already known, just running in a different place (a serverless function instead of only in the browser).

**Recommendation for the 30-day build:**

| Layer | Tool | Why this, not something heavier |
|---|---|---|
| Frontend (pages, styling, map rendering, drag-and-drop) | **Vanilla HTML/CSS/JS**, hosted on **Hostinger** (existing plan, no change) | Already known, already paid for, zero migration cost. Google Maps JS SDK and a small drag-and-drop library ([SortableJS](https://sortablejs.github.io/Sortable/), ~40KB, plain JS, MIT-licensed, no build step) drop straight into this setup with `<script>` tags. |
| Database + Auth | **Supabase** (hosted Postgres + built-in email/magic-link auth + file storage) | Free tier is generous (500MB DB, 50K monthly active users, 1GB storage) and easily covers a 30-day MVP. Talked to directly from the browser via the `supabase-js` client library — a handful of plain JS function calls, no ORM or backend framework to learn. This is the "database" Hostinger shared hosting doesn't provide. |
| Secret API proxy (the one piece of real "backend code") | **A single serverless function** on **Cloudflare Workers** or **Vercel Functions** (free tier) | Written in plain JavaScript — closer to what's already known than a full Node/Express server would be, and there's no server to maintain, patch, or pay for when idle. This function's only jobs: hold the Google Maps secret key, apply field masking (Section 4.2), read/write the Supabase cache tables, and return JSON. It is the smallest possible unit of "real backend" that makes the key-security and caching requirements in Section 4 true. |
| Maps & Routing | **Google Maps Platform** (Maps JS SDK client-side + Places/Directions/Distance Matrix via the proxy function) | As specified in Section 4. |

**What this means in practice:** the existing Hostinger site keeps doing exactly what it does today — serving the app. Two new (free-tier) accounts are added — Supabase and Cloudflare/Vercel — each requiring only a JS snippet to talk to, not a new language or framework. This is the smallest possible step up from "pure static site" that still satisfies the non-negotiables in Section 4 (key security, caching, shared data).

**Alternative considered and set aside for now:** Hostinger's Business/Cloud plans do support running Node.js apps and MySQL databases directly, which would keep everything under one vendor. It was set aside for the 30-day MVP specifically because Supabase + a serverless function ships faster (managed auth, managed DB backups, zero server config) — but it's a reasonable Phase 2 consolidation if there's ever a reason to reduce the number of vendors.

**What explicitly does *not* get built for the MVP, and is deferred to post-launch scaling (Section 4.5):** a self-hosted OSRM/GraphHopper routing server. That requires standing up and maintaining a small VPS with a multi-GB map dataset — real infrastructure work that isn't justified until real usage volume makes Google's per-call routing costs worth optimizing against (per the Section 1.5 utility-first guardrail: get the loop *working* before optimizing its cost). The MVP calls Google Directions/Distance Matrix directly through the proxy function, with the stop-count and caching guardrails in 7.4 keeping that affordable at MVP scale.

### 7.2 One-time setup checklist
1. Google Cloud project → enable Places API (New), Directions API, Maps JavaScript API → generate **two** API keys: one HTTP-referrer-restricted key for the client-side Maps JS SDK (safe to expose), one unrestricted-but-secret key used only inside the proxy function (never sent to the browser). Set a **budget alert** (Section 7.5) immediately, before writing a line of app code.
2. Supabase project → define tables: `users` (handled by Supabase Auth), `trips` (id, owner_id, title, mode [`dream`/`planning`], created_at), `days` (id, trip_id, order_index, date nullable), `stops` (id, day_id, place_id, order_index, time_lock nullable), `places_cache` (place_id PK, basic fields, rich fields JSON, fetch timestamps per Section 4.3).
3. Cloudflare Workers (or Vercel) project → one function: `POST /places/search`, `GET /places/:id`, `POST /route/optimize` — each reads/writes Supabase via its REST API and calls Google via the secret key.
4. Hostinger → confirm the plan supports HTTPS (required for the Maps SDK and for geolocation permission prompts) and point the domain/subdomain at the static site as usual.
5. Guest mode: MVP should let a first-time visitor start building a trip **before** creating an account (stored in `localStorage`, offered a one-tap "save this trip" account creation once they've invested a few minutes) — this matters specifically for the Map Wanderer/Dream Chaser personas in Section 1.6, where forcing signup before any payoff is the single biggest drop-off risk.

### 7.3 30-day build sequence

The sequence below is ordered so that **something demoable exists at the end of every week**, and so that if a week runs long, the *next* week's scope is what shrinks — never the current week's foundation.

**Week 1 — Foundation & Discovery skeleton**
- Supabase schema + auth (incl. guest/localStorage mode) live.
- Proxy function live: search + place-detail endpoints, field-masked, writing through to `places_cache`.
- Mobile-first page shell: map (Maps JS SDK) + a basic Discovery list rendering real, cached, Basic-tier place cards for a hardcoded city/area.
- *Demo at end of week:* type a place category, see real nearby pins and cards on a phone-sized screen.

**Week 2 — Collecting & the itinerary core**
- Discovery Hub: 5–6 category chips (trimmed from Section 3.3's full list), "Search this area," save/collect action into a Trip.
- Trip → Day → Stop data model wired end-to-end, including the Dream/Planning mode toggle (Section 3.1).
- Add-to-day via tap (primary interaction for MVP); SortableJS-based drag reorder added if time allows, tap-based up/down reorder as the guaranteed fallback.
- Sequential map polyline rendering of a day's stops (no optimization yet — just "in the order I put them").
- *Demo at end of week:* build a real multi-stop day for a real place, see it plotted and orderable on the map.

**Week 3 — Optimization, handoff, and making mobile actually good**
- "Optimize My Day": a **simplified nearest-neighbor-from-anchor heuristic** (not the full 2-opt/TSP solver in Section 3.2 — that's a post-MVP upgrade once the simpler version proves the feature is wanted) using Google Distance Matrix directly through the proxy, capped at a sane max stop count (e.g., 8 stops/day) to keep the call cheap and the math simple.
- Navigation Handoff deep links (Google Maps / Apple Maps), with Trip-Mode-aware copy (Section 3.4).
- Full mobile responsive pass — bottom-sheet map pattern, one-handed usability check on a real phone, not just a resized browser window.
- *Demo at end of week:* tap "Optimize," see a visibly better order, then hand off to real turn-by-turn directions.

**Week 4 — Polish, minimal delight, and launch**
- Walkie: **3–4 illustrated states only** for MVP (empty/idle, loading, one celebration moment, one friendly error) — trimmed from the ~10-pose full spec in Section 1.3; simple flat-vector or even a well-chosen icon set is an acceptable placeholder if illustration time runs short (upgrade later, it's a swap-in asset, not a re-architecture).
- One collectible-save micro-animation, one milestone celebration (Section 2.5) — cut every other gamification pattern for now.
- Cross-device QA pass: mobile Safari + mobile Chrome + desktop Chrome/Safari/Firefox.
- Wire up the Google Cloud budget alert and glance at the Supabase usage dashboard so cost visibility exists from day one of real traffic.
- Soft launch to a small real group (friends/family/early testers) — this is the first data toward the Section 6 KPIs and the actual "first success" this deadline is measuring.

**If time runs short, cut in this order (last cut first):** (1) multi-day trips — ship single-day itineraries first, add day-tabs after; (2) the nearest-neighbor optimizer's polish/edge-case handling — a slightly rough optimizer beats no optimizer; (3) Walkie illustration richness — text + emoji-level placeholders are fine short-term. **Do not cut:** mobile responsiveness, the API-key-security proxy, or basic caching — those aren't finishing touches, they're the difference between a working product and a costly security/billing incident.

### 7.4 Cost breakdown

Costs assume MVP-scale traffic (tens to low hundreds of users during the first month) — all figures are monthly unless noted.

| Item | Tool | Cost during MVP (month 1) | Notes |
|---|---|---|---|
| Frontend hosting | Hostinger (existing plan) | **$0 incremental** | Reusing the plan already in place; no change needed for a static/vanilla-JS site. |
| Domain | Existing, or new registration | **$0** (existing) or **~$10–15/yr** (new) | Only relevant if the eventual rename (per the working-name note) also means a new domain. |
| Database + Auth | Supabase Free tier | **$0** | 500MB DB / 50K MAU / 1GB storage — well above MVP-scale needs. Upgrade to Pro (**$25/mo**) only once real growth requires it (a Phase 2-timeframe decision, not a launch-day one). |
| API proxy hosting | Cloudflare Workers or Vercel Functions, free tier | **$0** | Free tiers (100K requests/day on Workers; generous serverless invocation limits on Vercel) comfortably cover MVP call volume. |
| Google Maps Platform | Places API (New), Directions API, Maps JS SDK | **$0–~30**, expected near $0 | Google's per-SKU free monthly call allowances (Section 4's caching strategy keeps actual call volume low regardless) should absorb MVP-scale usage; set a **hard budget cap/alert around $25–50** on day one as a safety net, not because it's expected to be hit. |
| SSL | Let's Encrypt (via Hostinger) or Cloudflare | **$0** | Standard, no reason to pay for a cert. |
| Illustration (Walkie, minimal MVP set) | DIY (Figma/Canva free tier, or a simple icon set) **or** a freelance illustrator for 3–4 poses | **$0 (DIY)** or **~$150–450 one-time** (freelance, e.g. Fiverr/Upwork range) | DIY is the recommended MVP path given the 30-day clock (Section 7.3); commissioning real illustration is a fine Phase 2 upgrade once the product's proven. |
| **Total, month 1** | | **≈ $0–50** (DIY illustration) or **≈ $150–500** (commissioned mascot) | Excludes whatever the user already pays Hostinger for hosting/domain, since that's a pre-existing, non-incremental cost. |

**Post-MVP scaling costs to plan for (not needed on day one):** Supabase Pro (~$25/mo) once past free-tier limits; Google Maps costs that scale with real, validated usage (revisit the budget cap once there's real traffic to model against); a small VPS (~$6–12/mo) if/when the self-hosted OSRM routing layer in Section 4.5 gets built out. None of these are MVP blockers — they're the resourcing conversation to have once Section 6.5's launch-gate metrics say the product is working.

### 7.5 Summary recommendation
Keep Hostinger and vanilla HTML/CSS/JS exactly as-is for everything the user already sees and touches — that skill set is sufficient and shouldn't be second-guessed. Add exactly two new, free-tier, JS-native pieces (Supabase for data/auth, a single Cloudflare/Vercel function for the secret-key proxy) to satisfy the three things static hosting structurally can't do: hide a secret key, persist shared data, and manage accounts. That's the minimum viable architecture that is still honest about Section 4's security and cost requirements, and it's buildable by one person in 30 days.

---

## 8. Open Questions for Stakeholder Review
1. Confirm the Google Maps Platform budget ceiling for the cost-guardrail targets in 6.3 and the safety-net alert in 7.4.
2. Confirm whether the "current location" anchor (Section 3.2) requires a location-permission legal/privacy review before MVP ships, given Section 7's 30-day timeline.
3. Confirm the illustration approach for MVP (DIY vs. the ~$150–450 commissioned option in 7.4) so Week 4 (Section 7.3) can be scheduled accurately.
4. Confirm appetite for the "cut in this order" list in 7.3 ahead of time, so a Week 3 slip has a pre-agreed answer instead of a mid-sprint debate.
5. Decide on a real product name (or timeline for deciding one) — doesn't block building, since the working-name note keeps the codebase name-agnostic, but it does block final domain/App-Store-style copy decisions whenever those come up.
