// Steps 4-7: the itinerary plan. Ordered stops on a route map, days,
// "Optimize my day", Walkie's gap suggestions, dates, and the navigation handoff.

import { escapeHtml, qs } from "../core/dom.js";
import { nav, showView } from "../core/nav.js";
import { MOODS, current, moodFor, state } from "../core/state.js";
import { routePath, searchPlaces } from "../data/places.js";
import { trips } from "../data/trips.js";
import { arrivalEnabled } from "../lib/arrival.js";
import { dayHandoffUrl } from "../lib/handoff.js";
import { estimateWalkMinutes, formatDistance, haversineMeters, optimizeOrder } from "../lib/optimizer.js";
import { createMap } from "../map/adapter.js";
import { icon } from "../ui/icons.js";
import { placeMeta, placeVisual, saveButtonHtml } from "../ui/place-ui.js";
import { walkie, walkieSays } from "../ui/walkie.js";
import { refreshArrival } from "./arrival.js";
import { openPlaceDetail } from "./detail.js";
import { STOPS_CHANGED, toggleSavePlace } from "./saves.js";
import { openHandoffSheet, openTripOptions, showConfirmSheet } from "./sheets.js";

/** @typedef {import("../types.js").Trip} Trip */
/** @typedef {import("../types.js").Day} Day */
/** @typedef {import("../types.js").Stop} Stop */
/** @typedef {import("../types.js").Place} Place */
/** @typedef {import("sortablejs")} SortableInstance */

/** @type {SortableInstance | null} */
let sortable = null;
let mapRenderSeq = 0;

/** @param {Trip} trip */
export async function openTrip(trip) {
  state.trip = trip;
  state.day = await trips.ensureFirstDay(trip.id);
  state.days = await trips.listDays(trip.id);
  await goToPlan();
}

async function goToPlan() {
  const { trip, day } = current();
  qs("plan-trip-title").textContent = trip.title;
  state.stops = await trips.listStops(day.id);
  qs("optimize-preview").hidden = true;
  showView("plan");
  renderAll();
}

function renderAll() {
  renderDayTabs();
  renderPlanList();
  renderDateWrap();
  renderStampProgress();
  updateHandoffFooter();
  refreshArrival();
}

// ---------------------------------------------------------------------
// Days. Invisible until there are 2+ (USER_FLOW.md Step 4).
// ---------------------------------------------------------------------
export function renderDayTabs() {
  const container = qs("day-tabs");
  container.replaceChildren();
  if (state.days.length < 2) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  state.days.forEach((day, idx) => {
    const label = day.trip_date ? formatDate(day.trip_date) : `Day ${idx + 1}`;
    const wrap = document.createElement("div");
    wrap.className = "pp-day-tab-wrap";
    wrap.setAttribute("role", "presentation");

    const tab = document.createElement("button");
    tab.className = "pp-day-tab";
    tab.type = "button";
    tab.textContent = label;
    tab.setAttribute("aria-pressed", String(day.id === state.day?.id));
    if (day.id === state.day?.id) tab.classList.add("is-active");
    tab.addEventListener("click", () => switchDay(day));
    wrap.appendChild(tab);

    // Tabs only render with 2+ days (guard above), so deleting one can
    // never leave the trip with zero.
    const del = document.createElement("button");
    del.className = "pp-day-tab-delete";
    del.type = "button";
    del.setAttribute("aria-label", `Delete ${label}`);
    del.innerHTML = icon("x", { size: 10 });
    del.addEventListener("click", () => confirmDeleteDay(day, idx));
    wrap.appendChild(del);

    container.appendChild(wrap);
  });
}

/** @param {Day} day @param {number} idx */
function confirmDeleteDay(day, idx) {
  showConfirmSheet({
    title: "Delete this day?",
    message: `Day ${idx + 1}${day.trip_date ? ` (${formatDate(day.trip_date)})` : ""} and its stops will be removed. This can't be undone.`,
    confirmLabel: "Delete day",
    onConfirm: async () => {
      const { trip } = current();
      await trips.deleteDay(day.id);
      state.days = await trips.listDays(trip.id);
      if (state.day?.id === day.id) state.day = state.days[0];
      state.stops = await trips.listStops(current().day.id);
      renderAll();
    },
  });
}

/** @param {Day} day */
async function switchDay(day) {
  state.day = day;
  state.stops = await trips.listStops(day.id);
  qs("optimize-preview").hidden = true;
  renderAll();
}

/** @param {string} iso yyyy-mm-dd */
function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------
// The stop list, drawn as a trail (PRD 2.5 "progress-as-path"), with the
// walk between each pair of stops.
// ---------------------------------------------------------------------
function renderPlanList() {
  const list = qs("plan-list");
  list.replaceChildren();
  const empty = state.stops.length === 0;
  qs("plan-empty").hidden = !empty;
  if (empty) {
    qs("plan-empty").innerHTML = walkieSays("idle", "Walkie hasn't found any spots for this day yet. Let's go exploring!", { size: 76 });
  }
  /** @type {HTMLButtonElement} */ (qs("btn-optimize")).disabled = state.stops.length < 2;
  const showVisited = arrivalEnabled(state.trip);

  state.stops.forEach((stop, idx) => {
    const li = document.createElement("li");
    li.className = "pp-stop";
    li.dataset.id = stop.id;
    const visited = showVisited && Boolean(stop.visited_at);
    if (visited) li.classList.add("is-visited");

    const prev = state.stops[idx - 1];
    if (prev && prev.lat != null && prev.lng != null && stop.lat != null && stop.lng != null) {
      const meters = haversineMeters({ lat: prev.lat, lng: prev.lng }, { lat: stop.lat, lng: stop.lng });
      const leg = document.createElement("p");
      leg.className = "pp-leg";
      leg.innerHTML = `${icon("route", { size: 13 })} ${estimateWalkMinutes(meters)} min walk · ${formatDistance(meters)}`;
      li.appendChild(leg);
    }

    const card = document.createElement("div");
    card.className = "pp-stop-card";
    card.innerHTML = `
      <button class="pp-stop-open" type="button" aria-label="More about ${escapeHtml(stop.display_name)}">
        <span class="pp-stop-thumb-wrap">
          <span class="pp-stop-thumb">${placeVisual(stop, 120, "pp-stop-img")}</span>
          <span class="pp-stop-thumb-badge" aria-hidden="true">${visited ? icon("check", { size: 12 }) : idx + 1}</span>
        </span>
        <span class="pp-stop-info">
          <span class="pp-stop-name">${escapeHtml(stop.display_name)}</span>
          <span class="pp-stop-meta">${visited ? `${icon("stamp", { size: 13 })} Stamp collected` : placeMeta(stop, 13)}</span>
        </span>
      </button>`;
    /** @type {HTMLElement} */ (card.querySelector(".pp-stop-open")).addEventListener("click", () => openPlaceDetail(stop));

    // Tap-based reorder: the required non-drag fallback (PRD 2.6: "do not
    // ship drag-only interactions on mobile"). Buttons disable at the ends
    // instead of wrapping, so their state alone communicates position.
    const moves = document.createElement("div");
    moves.className = "pp-stop-move-group";
    moves.append(moveButton(stop, idx, -1), moveButton(stop, idx, 1));
    card.appendChild(moves);

    const remove = document.createElement("button");
    remove.className = "pp-stop-remove";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${stop.display_name}`);
    remove.innerHTML = icon("x", { size: 16 });
    remove.addEventListener("click", () => deleteStop(stop.id));
    card.appendChild(remove);

    li.appendChild(card);
    list.appendChild(li);
  });

  initSortable();
  renderPlanMap();
}

/** @param {Stop} stop @param {number} idx @param {-1 | 1} delta */
function moveButton(stop, idx, delta) {
  const btn = document.createElement("button");
  btn.className = "pp-stop-move-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", `Move ${stop.display_name} ${delta < 0 ? "earlier" : "later"}`);
  btn.innerHTML = icon(delta < 0 ? "chevron-up" : "chevron-down", { size: 14 });
  btn.disabled = delta < 0 ? idx === 0 : idx === state.stops.length - 1;
  btn.addEventListener("click", () => moveStop(idx, delta));
  return btn;
}

// The route map lives inside renderPlanList rather than being called at
// each call site, so a reorder/add/remove/optimize can never update the
// list without also updating the map.
async function renderPlanMap() {
  const seq = ++mapRenderSeq;
  const wrap = qs("plan-map-wrap");
  const located = /** @type {(Stop & { lat: number, lng: number })[]} */ (state.stops.filter((s) => s.lat != null && s.lng != null));
  if (!located.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  state.planMap ??= await createMap(qs("plan-map"), located[0]);
  const path = await routePath(located);
  if (seq !== mapRenderSeq) return; // superseded by a newer render
  const showVisited = arrivalEnabled(state.trip);
  state.planMap.setRoute(
    located.map((s) => ({ lat: s.lat, lng: s.lng, title: s.display_name, label: String(state.stops.indexOf(s) + 1), visited: showVisited && Boolean(s.visited_at) })),
    path,
  );
}

function initSortable() {
  const list = qs("plan-list");
  sortable?.destroy();
  sortable = null;
  const Sortable = /** @type {any} */ (window).Sortable;
  if (!Sortable) return;
  sortable = Sortable.create(list, {
    animation: 180,
    delay: 160,
    delayOnTouchOnly: true,
    handle: ".pp-stop-card",
    filter: "button.pp-stop-move-btn, button.pp-stop-remove",
    preventOnFilter: false,
    onEnd: async () => {
      const ordered = Array.from(list.children).map((li) => /** @type {HTMLElement} */ (li).dataset.id ?? "");
      state.stops.sort((a, b) => ordered.indexOf(a.id) - ordered.indexOf(b.id));
      await trips.reorderStops(ordered);
      renderPlanList();
    },
  });
}

/** @param {string} stopId */
async function deleteStop(stopId) {
  await trips.removeStop(stopId);
  state.stops = state.stops.filter((s) => s.id !== stopId);
  renderAll();
}

/** @param {number} idx @param {number} delta */
async function moveStop(idx, delta) {
  const target = idx + delta;
  if (target < 0 || target >= state.stops.length) return;
  const [stop] = state.stops.splice(idx, 1);
  state.stops.splice(target, 0, stop);
  renderPlanList();
  // Keep keyboard focus on the moved stop's button after the re-render.
  const btn = qs("plan-list").querySelector(`[data-id="${CSS.escape(stop.id)}"] .pp-stop-move-btn:${delta < 0 ? "first-child" : "last-child"}`);
  if (btn instanceof HTMLButtonElement && !btn.disabled) btn.focus();
  await trips.reorderStops(state.stops.map((s) => s.id));
}

// ---------------------------------------------------------------------
// Step 5: optimize, plus Walkie's gap suggestions.
// ---------------------------------------------------------------------
function optimize() {
  if (state.stops.length < 2) return;
  const { trip } = current();
  const anchor = trip.lat != null ? { lat: trip.lat, lng: trip.lng } : state.stops[0];
  const located = /** @type {(Stop & { lat: number, lng: number })[]} */ (state.stops.filter((s) => s.lat != null && s.lng != null));
  const result = optimizeOrder(located, /** @type {{ lat: number, lng: number }} */ (anchor));
  const summary = qs("optimize-summary");
  const apply = qs("btn-optimize-apply");

  if (result.savedMeters < 30) {
    summary.innerHTML = walkieSays("happy", "Your order's already about as efficient as it gets!", { size: 56 });
    apply.hidden = true;
  } else {
    const minutes = estimateWalkMinutes(result.savedMeters);
    summary.innerHTML = walkieSays("celebrating", `Walkie can shave ~${minutes} min (${formatDistance(result.savedMeters)}) off your walk.`, { size: 56 });
    apply.hidden = false;
  }
  qs("optimize-preview").hidden = false;
  apply.onclick = async () => {
    const unlocated = state.stops.filter((s) => s.lat == null || s.lng == null);
    state.stops = [...result.stops, ...unlocated];
    await trips.reorderStops(state.stops.map((s) => s.id));
    qs("optimize-preview").hidden = true;
    renderPlanList();
  };

  qs("optimize-suggestions").hidden = true;
  fetchSuggestions().then(renderSuggestions);
}

// Which of our mood categories aren't represented yet among the saved
// stops. Matches loosely on primary_type: an acceptable trade-off for
// staying a light nudge rather than a real taxonomy.
const missingMoods = () => {
  const present = new Set(state.stops.map((s) => s.primary_type));
  return MOODS.filter((m) => !present.has(m.type));
};

function stopsCentroid() {
  const located = state.stops.filter((s) => s.lat != null && s.lng != null);
  const { trip } = current();
  if (!located.length) return { lat: trip.lat, lng: trip.lng };
  return {
    lat: located.reduce((sum, s) => sum + /** @type {number} */ (s.lat), 0) / located.length,
    lng: located.reduce((sum, s) => sum + /** @type {number} */ (s.lng), 0) / located.length,
  };
}

// One search per missing category, capped at 2 so it stays a light nudge
// rather than a wall of suggestions. Reuses the existing search proxy.
async function fetchSuggestions() {
  const center = stopsCentroid();
  const savedIds = new Set(state.stops.map((s) => s.place_id));
  /** @type {(Place & { moodLabel: string })[]} */
  const suggestions = [];
  for (const mood of missingMoods().slice(0, 2)) {
    try {
      const places = await searchPlaces({ type: mood.type, lat: center.lat, lng: center.lng, radius: 1500 });
      const pick = places.find((p) => !savedIds.has(p.place_id));
      if (pick) suggestions.push({ ...pick, moodLabel: mood.label });
    } catch {
      // one category failing shouldn't block the others
    }
  }
  return suggestions;
}

/** @param {(Place & { moodLabel: string })[]} suggestions */
function renderSuggestions(suggestions) {
  const wrap = qs("optimize-suggestions");
  wrap.replaceChildren();
  if (!suggestions.length) {
    wrap.hidden = true;
    return;
  }
  const title = document.createElement("p");
  title.className = "pp-suggestions-title";
  title.textContent = "Walkie noticed a gap. Maybe one of these?";
  wrap.appendChild(title);

  for (const place of suggestions) {
    const mood = moodFor(place.primary_type);
    const card = document.createElement("div");
    card.className = "pp-suggestion-card";
    card.innerHTML = `
      ${placeVisual(place, 100, "pp-suggestion-photo")}
      <span class="pp-suggestion-info">
        <span class="pp-suggestion-mood">${mood ? icon(mood.icon, { size: 12 }) : ""}${escapeHtml(place.moodLabel)}</span>
        <span class="pp-suggestion-name">${escapeHtml(place.display_name)}</span>
        <span class="pp-card-meta">${placeMeta(place, 12)}</span>
      </span>
      <button class="pp-card-save" type="button" data-place-id="${escapeHtml(place.place_id)}" aria-pressed="false">${saveButtonHtml(false)}</button>`;
    /** @type {HTMLElement} */ (card.querySelector(".pp-card-save")).addEventListener("click", () => toggleSavePlace(place));
    wrap.appendChild(card);
  }
  wrap.hidden = false;
}

// ---------------------------------------------------------------------
// Step 6: dates (Dream -> Planning) and Step 7: handoff.
// ---------------------------------------------------------------------

// Rebuilt on every render because its content depends on the current day's
// date. One trigger handles both "add" and "change": the input is re-created
// pre-filled with the current value, so re-opening starts from what's set.
function renderDateWrap() {
  const wrap = qs("add-date-wrap");
  const value = state.day?.trip_date ?? "";
  wrap.innerHTML = `
    <button type="button" id="date-trigger" class="pp-link-btn">
      ${value ? `${icon("calendar", { size: 15 })} ${escapeHtml(formatDate(value))}` : `${icon("calendar", { size: 15 })} Add a date`}
    </button>
    <label class="pp-sr-only" for="date-input">Trip date</label>
    <input id="date-input" type="date" class="pp-date-input" hidden value="${escapeHtml(value)}" />`;
  qs("date-trigger").addEventListener("click", () => {
    const input = /** @type {HTMLInputElement} */ (qs("date-input"));
    input.hidden = false;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      /* showPicker throws outside a user gesture in some browsers */
    }
  });
  qs("date-input").addEventListener("change", async (e) => {
    const { trip, day } = current();
    const next = /** @type {HTMLInputElement} */ (e.target).value;
    if (!next) return;
    await trips.setDayDate(day.id, next);
    await trips.setTripMode(trip.id, "planning");
    trip.mode = "planning";
    day.trip_date = next;
    renderAll();
  });
}

function renderStampProgress() {
  const el = qs("stamp-progress");
  if (!arrivalEnabled(state.trip) || state.stops.length === 0) {
    el.hidden = true;
    return;
  }
  const collected = state.stops.filter((s) => s.visited_at).length;
  el.hidden = false;
  el.innerHTML = `${icon("stamp", { size: 15 })} ${collected} of ${state.stops.length} stamps`;
  el.classList.toggle("is-complete", collected === state.stops.length);
}

function updateHandoffFooter() {
  const btn = /** @type {HTMLButtonElement} */ (qs("btn-handoff-day"));
  const planning = state.trip?.mode === "planning";
  btn.innerHTML = planning ? `${icon("route", { size: 16 })} Let's go` : "Save for when you're ready";
  btn.classList.toggle("pp-btn-primary", planning);
  btn.classList.toggle("pp-btn-secondary", !planning);
  btn.disabled = state.stops.length < 2;
}

function handoff() {
  const url = dayHandoffUrl(state.stops);
  if (!url) return;
  openHandoffSheet("Send your whole day to Google Maps", { google: url, apple: null });
}

export function initPlanView() {
  nav.goToPlan = goToPlan;
  qs("btn-back-discover").addEventListener("click", () => nav.openDiscoverView());
  qs("btn-trip-menu").innerHTML = icon("more-horizontal", { size: 20 });
  qs("btn-trip-menu").addEventListener("click", () => state.trip && openTripOptions(state.trip));
  qs("btn-optimize").addEventListener("click", optimize);
  qs("btn-optimize-keep").addEventListener("click", () => {
    qs("optimize-preview").hidden = true;
  });
  qs("btn-handoff-day").addEventListener("click", handoff);
  qs("btn-add-day").addEventListener("click", async () => {
    const { trip } = current();
    const day = await trips.createDay(trip.id, state.days.length);
    state.days = await trips.listDays(trip.id);
    state.day = day;
    state.stops = [];
    renderAll();
  });
  qs("plan-walkie").innerHTML = walkie("idle", { size: 44 });

  // Saves from the detail sheet or a suggestion land here even while the
  // plan is hidden, so the plan is always right when the user comes back.
  window.addEventListener(STOPS_CHANGED, () => {
    if (state.day) renderAll();
  });
}
