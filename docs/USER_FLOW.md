# ppplaces — User Flow & Behavior Specification
**The foundation: what the user sees, what they do, and what the app does back — at every step.**

This document is the source of truth for how the app behaves, written before any screen is built. Every screen in Figma or code should trace back to a step here. If a screen wants to do something this document doesn't describe, this document is wrong and needs updating first — not the other way around.

---

## Quick-reference map

| # | Step | Who sees it | Primary user action |
|---|---|---|---|
| 0 | Landing | Everyone, every visit | Nothing required — the app decides what to show next |
| 1 | Start a trip | First-time on a new trip | Choose "dreaming about somewhere" or "right around me" |
| 2 | Pick a mood | Right after step 1 | Tap 1+ mood chips, or skip |
| 3 | Choose places | Right after step 2 | Browse the map/list, save places |
| 4 | Your itinerary plan | Once ≥1 place is saved | Reorder, add more places, optionally add a day |
| 5 | Optimize the plan | From step 4, on demand | Tap "Optimize," accept or keep manual order |
| 6 | Add a date (ambient) | From step 4, anytime | Attach a real date — never required |
| 7 | Navigation handoff | Dated trips only | Tap "Let's go," opens Google/Apple Maps |
| 8 | Arrival check-in | Dated trips only, near a saved stop | Tap to confirm and collect a badge |
| 9 | Return visit | Anyone with ≥1 existing trip | Pick a trip back up, or start a new one |

---

## 0. Landing

**Purpose:** Get out of the way. No signup wall, no splash screen, no "welcome tour" — the first thing on screen is the first real thing to do.

**What happens (invisible to the user):** A guest session is created silently in the background (anonymous auth). Nothing on screen indicates this happened. There is no "create an account" prompt anywhere in this flow — an account only gets created later, and only if the user explicitly chooses to save/sync (see Step 9).

**What the user sees — branches on whether they have any existing trips:**
- **No existing trips (true first-time use):** Landing *is* Step 1 (Start a trip). No separate splash screen — the destination choice is the first screen.
- **≥1 existing trip:** Landing is the trip list (Step 9, Return Visit), with a clearly visible "+ Start a new trip" action to re-enter Step 1 at any time.

**Notes:** This is the most important sentence in this whole document: **nothing before Step 4 (having ≥1 saved place) requires an account, a date, or a decision that can't be changed later.** Every step up to that point should feel like zero-commitment play.

---

## 1. Start a trip

**Purpose:** The single decision that determines where place results come from. This is a fork, not a form — two big, obvious choices, nothing to type unless they pick the option that needs it.

**What the user sees:** A short, warm prompt ("Where's this trip taking you?") above two large tappable option cards, stacked (not a dropdown, not radio buttons):
- **"Dreaming about somewhere"** — subtext: "Type any city, no dates needed"
- **"Right around me"** — subtext: "We'll use your location"

**What the user does:**
- Taps **"Dreaming about somewhere"** → a single text field appears inline (city/place autocomplete) → they type and select a place.
- Taps **"Right around me"** → the browser's location-permission prompt fires *right here*, with context already established (they just tapped a button that says what it's for, so the OS permission dialog isn't a surprise). If granted, their current coordinates become the search center. If denied, fall back gracefully to the "Dreaming about somewhere" text field instead of dead-ending.

**What happens next:** A new Trip record is created immediately, in **Dream mode by default** — no toggle, no screen asking "is this a real trip or just for fun?" The chosen location (typed city, geocoded to coordinates, or device GPS) becomes the trip's working location for the next two steps.

**Notes:** This screen should take under 5 seconds for the "right around me" path (one tap, one permission grant) and under 15 seconds for the "dreaming about somewhere" path (one tap, type, select).

---

## 2. Pick a mood

**Purpose:** A lightweight vibe-setting step, not a hard filter. This narrows what Step 3 shows first, but never blocks — you can always change or ignore it.

**What the user sees:** A grid of rounded mood/category chips (exact taxonomy still open — coffee, food, culture, nature, nightlife, hidden gems are the working set) and a de-emphasized **"Skip for now"** text link below the grid.

**What the user does:** Taps one or more chips (multi-select), or taps "Skip for now."

**What happens next:** Whatever was selected (or nothing, if skipped) becomes the initial filter state for Step 3's place list — but the filters remain fully editable there, so this step is never a one-way door.

**Notes:** No "Continue" button gating this — tapping a chip and then the map/places surface directly should feel like one continuous motion, not a form with a submit step.

---

## 3. Choose places

**Purpose:** The core discovery loop. This is where the trip stops being an abstract idea and starts filling up with real places.

**What the user sees:** The in-app map (custom-styled to match the app's palette — never looks like a raw embedded Google Maps widget) with pins for nearby/matching places, and a scrollable list of place cards below or beside it (mobile: map on top as a shorter strip, list below; desktop: side-by-side). Each card shows only lightweight info — photo, name, rating, category — tapping a card opens a detail view with more (hours, address, photos) fetched only at that moment.

**What the user does:**
- Pans/zooms the map, or scrolls the list.
- Taps a category chip to refine (same chips as Step 2, now live filters, not a one-time choice).
- Taps "+" on a card (or the detail view) to save a place into this trip.
- Can do this for as few as one place or as many as they want — there's no minimum before moving on, and no explicit "done" button. The itinerary plan (Step 4) builds up in the background the moment the first place is saved.

**What happens next:** Each saved place is added to the trip's plan. The user can keep browsing indefinitely, or navigate to Step 4 to see what they've built so far (a small, persistent "View plan (3)" affordance — showing the count — should be visible from this screen at all times once ≥1 place is saved).

**Notes:** This is the step most likely to repeat many times across a session and across return visits — it is not a one-time onboarding screen, it's the app's main working surface.

---

## 4. Your itinerary plan

**Purpose:** The plan is the umbrella object — not "Day 1." A single saved place and a five-day trip both live in the same kind of screen; days are an optional way to subdivide, never the default frame.

**What the user sees:** A flat, ordered list of saved stops (no "Day 1 / Day 2" tabs shown by default), each shown with the same quest-trail style as before — a numbered badge, the place name, and a short travel-time note to the next stop. Below the list: a de-emphasized **"+ Add a day"** text action (not a prominent tab bar) for trips that actually need multi-day structure, and a prominent **"Optimize my day"** button.

**What the user does:**
- Drags to reorder (or taps arrows / a "move" mode on mobile, per the accessibility requirement).
- Taps "+ Add a day" only if/when they want to split the plan into multiple days — this creates a second flat list, now with lightweight day tabs that only appear once there are 2+ days.
- Taps "Optimize my day" (Step 5).
- Can leave and come back anytime — every change autosaves.

**What happens next:** The plan persists exactly as left. Nothing here nudges toward adding a date — that's a fully separate, ambient action (Step 6), always available but never suggested as "the next step."

**Notes:** This is the screen that most needs to *not* feel like a spreadsheet. It should read as a trail you're building, not a task list.

---

## 5. Optimize the plan

**Purpose:** Remove the mental math of what order to visit things in, without taking control away.

**What the user sees:** After tapping "Optimize my day," a brief friendly loading state, then a preview of the reordered plan overlaid on the current one (ghosted path), with a plain-language reason ("saves ~34 minutes") and two buttons: **"Apply"** and **"Keep my order."**

**What the user does:** Reviews the suggested order, taps one of the two buttons.

**What happens next:** If applied, the plan's stop order updates and the map path redraws. If kept, nothing changes — the suggestion is discarded, not remembered as a "rejected" state that nags again.

**Notes:** This step works identically regardless of Dream or Planning mode — a Dream Chaser gets just as much value from a well-sequenced plan as someone leaving tomorrow.

---

## 6. Add a date (ambient — not a numbered step in the main flow)

**Purpose:** The only thing that turns a Dream trip into a Planning trip. Deliberately not presented as progress or a milestone — it's a utility action, available the instant it's useful and invisible otherwise.

**What the user sees:** A small, low-key "Add dates" affordance living quietly on the itinerary plan screen (Step 4) — not a banner, not a nag, not a required field anywhere else.

**What the user does:** Taps it, picks a date (or date range for multi-day plans).

**What happens next:** The trip silently becomes a Planning-mode trip. This unlocks two things that were previously unavailable, both covered next: Navigation Handoff (Step 7) and Arrival Check-in (Step 8). No confirmation dialog, no "congratulations, your trip is now official" moment — it just quietly works from here on.

**Notes:** This can happen at any point in the trip's life — immediately, or six months after the plan was first built. Nothing in Steps 1–5 should imply it's expected soon.

---

## 7. Navigation handoff (Planning-mode trips only)

**Purpose:** ppplaces plans the trip; it doesn't reinvent turn-by-turn walking navigation. This is the deliberate exit point to Google/Apple Maps.

**What the user sees:** On a dated trip, the plan screen's primary action changes from a soft "keep dreaming" framing to a clear **"Let's go"** button, per-stop and for the whole day.

**What the user does:** Taps "Let's go" on a stop or the whole day.

**What happens next:** A deep link opens the user's native maps app (Google or Apple, OS-appropriate default, both always offered) with turn-by-turn directions already loaded. ppplaces does not track their walk from here.

**Notes:** On an un-dated (Dream) trip, this same action exists but is deliberately softer — "Save for when you're ready" — and never disappears, it's just not the thing being pushed.

---

## 8. Arrival check-in & badge (Planning-mode trips only)

**Purpose:** Reward actually going, not just planning. Explicitly does not apply to Dream trips — a badge for a place you haven't committed to visiting wouldn't mean anything.

**What the user sees:** While the app is open and the device's location comes within range (~120m) of a saved stop on a **dated** trip, a small prompt appears: "You're near Wickerman Coffee Roasters — tap to collect your stamp." Once collected, that stop's card shows a small badge/checkmark from then on.

**What the user does:** Taps to confirm. (No confirmation needed to *see* the prompt — only the actual collection requires a tap, which is the deliberate anti-false-positive design: GPS proximity alone doesn't award anything, a human confirms it.)

**What happens next:** The stop's `visited_at` is recorded. The badge shows on that stop going forward. (The fuller "passport" visual — collecting badges into an illustrated book — is a later addition on top of this same data, not part of this first version.)

**Notes:** Because this is a web app, this check can only happen while the app is actually open in the foreground — there's no silent background detection. The prompt is the honest expression of that constraint, not a workaround to hide it.

---

## 9. Return visit

**Purpose:** Coming back should cost nothing — no re-onboarding, no "welcome back" ceremony, just the same trip, exactly as left.

**What the user sees:** A list of their trips (Dream and Planning mixed together, not separated into different tabs — a Dream trip and a dated trip are the same kind of object, just at different points), each showing its name, a thumbnail-ish hint of its plan, and its mode (visually light-touch — a small dot or label, not a badge that implies one is "better" than the other). A clear "+ Start a new trip" action re-enters Step 1.

**What the user does:** Taps a trip to resume exactly where they left it (Step 4), or starts a new one.

**What happens next:** Nothing forces a decision here — a Dream trip that's been sitting untouched for months is shown exactly the same as one edited yesterday. No streaks, no "come back and finish this" pressure messaging, consistent with the "quiet luxury, no pressure" principle from the PRD.

---

## Cross-cutting rules (apply to every step above)

1. **No step above Step 4 requires an account.** Account creation (if it ever happens) is a "save this so I don't lose it" action initiated by the user, never a gate.
2. **Dream vs. Planning is never a screen the user visits on purpose** — it's a read of whether a date exists, full stop.
3. **Every screen autosaves.** There is no explicit "Save" action anywhere in this flow.
4. **Every permission request (location) is asked for at the moment it's used**, with the button the user just tapped as the context — never on app load, never speculatively.
5. **Mobile is the primary target for every step above** — each one needs to work one-handed before it's considered done.
