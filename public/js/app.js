import { ensureSession } from "./supabaseClient.js";
import { createMap } from "./mapInit.js";
import {
  listTrips,
  createTrip,
  renameTrip,
  deleteTrip,
  ensureFirstDay,
  listDays,
  createDay,
  deleteDay,
  setDayDate,
  setTripMode,
  listStops,
  addStop,
  removeStop,
  reorderStops,
} from "./tripsData.js";
import { haversineMeters, optimizeOrder, formatDistance, estimateWalkMinutes } from "./optimizer.js";
import { placeViewUrl, dayHandoffUrl, preferredMapsApp } from "./handoff.js";
import { icon } from "./icons.js";

const MOODS = [
  { type: "cafe", icon: "coffee", label: "Coffee & Cafés" },
  { type: "restaurant", icon: "bowl", label: "Food" },
  { type: "tourist_attraction", icon: "palette", label: "Art & Culture" },
  { type: "park", icon: "tree", label: "Parks & Nature" },
  { type: "night_club", icon: "moon", label: "Nightlife" },
  { type: "shopping_mall", icon: "bag", label: "Shopping" },
];

const qs = (id) => document.getElementById(id);

// Locks page scroll behind any open bottom sheet — without this, a tall
// sheet (e.g. the detail modal's own scrolling body) let a two-finger or
// trackpad scroll bleed through and move the page underneath it too. A
// counter (not a boolean) so it can't prematurely unlock if a second
// sheet were ever opened before the first closes. Both functions are
// idempotent (checked against the element's current hidden state) since
// the trip-options sheet gets re-opened on itself when swapping between
// its menu/rename/confirm views without an intervening close.
let openSheetCount = 0;
function openSheet(id) {
  const el = qs(id);
  if (el.hidden) {
    openSheetCount++;
    document.body.style.overflow = "hidden";
  }
  el.hidden = false;
}
function closeSheet(id) {
  const el = qs(id);
  if (!el.hidden) {
    openSheetCount = Math.max(0, openSheetCount - 1);
    if (openSheetCount === 0) document.body.style.overflow = "";
  }
  el.hidden = true;
}

const state = {
  trips: [],
  trip: null,
  days: [],
  day: null,
  stops: [],
  map: null,
  markers: [],
  activeType: "",
  sortable: null,
  lastSearchCenter: null,
  mapListenerAttached: false,
  planMap: null,
  planMarkers: [],
  planPolyline: null,
};

// ---------------------------------------------------------------------
// View switching
// ---------------------------------------------------------------------
function showView(name) {
  document.querySelectorAll(".pp-view").forEach((el) => { el.hidden = el.id !== `view-${name}`; });
  qs("btn-my-trips").hidden = !state.trip || name === "trips";
  qs("view-plan-pill").hidden = name !== "discover" || state.stops.length === 0;
}

// ---------------------------------------------------------------------
// Step 9: trip list / return visit
// ---------------------------------------------------------------------
async function goToTrips() {
  state.trip = null;
  state.trips = await listTrips();
  renderTripList();
  showView("trips");
}

function renderTripList() {
  const container = qs("trips-list");
  container.replaceChildren();
  for (const trip of state.trips) {
    const row = document.createElement("div");
    row.className = "pp-trip-card";

    const btn = document.createElement("button");
    btn.className = "pp-trip-card-main";
    btn.type = "button";
    btn.innerHTML = `
      <span class="pp-trip-card-title">${escapeHtml(trip.title)}</span>
      <span class="pp-trip-card-meta">
        <span class="pp-mode-dot ${trip.mode}"></span>
        ${trip.mode === "planning" ? "Planning" : "Dream"}
      </span>
    `;
    btn.addEventListener("click", () => openTrip(trip));
    row.appendChild(btn);

    const menuBtn = document.createElement("button");
    menuBtn.className = "pp-icon-btn";
    menuBtn.type = "button";
    menuBtn.setAttribute("aria-label", "Trip options");
    menuBtn.innerHTML = icon("more-horizontal", { size: 18 });
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTripOptions(trip);
    });
    row.appendChild(menuBtn);

    container.appendChild(row);
  }
}

// ---------------------------------------------------------------------
// Trip options: rename / delete — one sheet, three views swapped in place
// (menu -> rename form / delete confirm), reachable from a trip-list card
// or from inside the trip itself (Plan screen header).
// ---------------------------------------------------------------------
let tripOptionsTarget = null;

function openTripOptions(trip) {
  tripOptionsTarget = trip;
  showTripOptionsMenu();
  openSheet("trip-options-sheet");
}

function closeTripOptions() {
  closeSheet("trip-options-sheet");
  tripOptionsTarget = null;
}

function showTripOptionsMenu() {
  qs("trip-options-title").textContent = tripOptionsTarget.title;
  qs("trip-options-body").innerHTML = `
    <button id="trip-opt-rename" class="pp-btn pp-btn-outline" type="button">${icon("pencil", { size: 16 })}<span>Rename trip</span></button>
    <button id="trip-opt-delete" class="pp-btn pp-btn-outline pp-btn-danger" type="button">${icon("trash", { size: 16 })}<span>Delete trip</span></button>
    <button id="trip-opt-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>
  `;
  qs("trip-opt-rename").addEventListener("click", showTripRenameForm);
  qs("trip-opt-delete").addEventListener("click", showTripDeleteConfirm);
  qs("trip-opt-cancel").addEventListener("click", closeTripOptions);
}

function showTripRenameForm() {
  qs("trip-options-title").textContent = "Rename trip";
  qs("trip-options-body").innerHTML = `
    <input id="trip-rename-input" class="pp-input" type="text" value="${escapeHtml(tripOptionsTarget.title)}" />
    <button id="trip-rename-save" class="pp-btn pp-btn-primary" type="button">Save</button>
    <button id="trip-rename-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>
  `;
  const input = qs("trip-rename-input");
  input.focus();
  input.select();
  qs("trip-rename-save").addEventListener("click", async () => {
    const newTitle = input.value.trim();
    if (!newTitle) return;
    await renameTrip(tripOptionsTarget.id, newTitle);
    tripOptionsTarget.title = newTitle;
    if (state.trip?.id === tripOptionsTarget.id) {
      state.trip.title = newTitle;
      qs("plan-trip-title").textContent = newTitle;
    }
    const listed = state.trips.find((t) => t.id === tripOptionsTarget.id);
    if (listed) listed.title = newTitle;
    renderTripList();
    closeTripOptions();
  });
  qs("trip-rename-cancel").addEventListener("click", showTripOptionsMenu);
}

function showTripDeleteConfirm() {
  qs("trip-options-title").textContent = "Delete this trip?";
  qs("trip-options-body").innerHTML = `
    <p class="pp-status">"${escapeHtml(tripOptionsTarget.title)}" and everything in it will be gone for good — this can't be undone.</p>
    <button id="trip-delete-confirm" class="pp-btn pp-btn-outline pp-btn-danger" type="button">Delete trip</button>
    <button id="trip-delete-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>
  `;
  qs("trip-delete-confirm").addEventListener("click", async () => {
    await deleteTrip(tripOptionsTarget.id);
    const wasCurrent = state.trip?.id === tripOptionsTarget.id;
    closeTripOptions();
    if (wasCurrent) {
      goToTrips();
    } else {
      state.trips = state.trips.filter((t) => t.id !== tripOptionsTarget.id);
      renderTripList();
    }
  });
  qs("trip-delete-cancel").addEventListener("click", showTripOptionsMenu);
}

qs("trip-options-sheet").addEventListener("click", (e) => {
  if (e.target.id === "trip-options-sheet") closeTripOptions();
});

// Generic confirm dialog, reusing the same sheet DOM as trip options
// (title + body are already generic containers) rather than building a
// separate sheet element per destructive action.
function showConfirmSheet({ title, message, confirmLabel, onConfirm }) {
  qs("trip-options-title").textContent = title;
  qs("trip-options-body").innerHTML = `
    <p class="pp-status">${message}</p>
    <button id="confirm-sheet-confirm" class="pp-btn pp-btn-outline pp-btn-danger" type="button">${escapeHtml(confirmLabel)}</button>
    <button id="confirm-sheet-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>
  `;
  qs("confirm-sheet-confirm").addEventListener("click", async () => {
    closeTripOptions();
    await onConfirm();
  });
  qs("confirm-sheet-cancel").addEventListener("click", closeTripOptions);
  openSheet("trip-options-sheet");
}

async function openTrip(trip) {
  state.trip = trip;
  state.day = await ensureFirstDay(trip.id);
  state.days = await listDays(trip.id);
  state.stops = await listStops(state.day.id);
  renderDayTabs();
  goToPlan();
}

// ---------------------------------------------------------------------
// Step 1: start a trip
// ---------------------------------------------------------------------
function goToStart() {
  qs("dream-input-wrap").hidden = true;
  qs("dream-input").value = "";
  qs("start-status").textContent = "";
  showView("start");
}

function setStartStatus(msg) {
  qs("start-status").textContent = msg;
}

async function startDreamTrip(placeName) {
  setStartStatus("Walkie is looking that up...");
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(placeName)}`);
    if (!res.ok) throw new Error("not found");
    const place = await res.json();
    const trip = await createTrip({
      title: place.name || placeName,
      lat: place.lat,
      lng: place.lng,
      locationName: place.formatted_address || place.name,
    });
    setStartStatus("");
    await goToMood(trip);
  } catch (err) {
    setStartStatus("Walkie couldn't find that place — try a different spelling?");
  }
}

function startNearbyTrip() {
  setStartStatus("Finding you...");
  if (!navigator.geolocation) {
    setStartStatus("Location isn't available here — search a city instead.");
    qs("dream-input-wrap").hidden = false;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const trip = await createTrip({
        title: "Right around me",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        locationName: "Current location",
      });
      setStartStatus("");
      await goToMood(trip);
    },
    () => {
      setStartStatus("Couldn't get your location — search a city instead.");
      qs("dream-input-wrap").hidden = false;
    }
  );
}

// ---------------------------------------------------------------------
// Step 2: pick a mood
// ---------------------------------------------------------------------
function renderMoodChips() {
  const container = qs("mood-chips");
  container.replaceChildren();
  for (const mood of MOODS) {
    const chip = document.createElement("button");
    chip.className = "pp-chip";
    chip.type = "button";
    chip.innerHTML = `${icon(mood.icon)}<span>${mood.label}</span>`;
    chip.addEventListener("click", () => goToDiscover(mood.type));
    container.appendChild(chip);
  }
}

async function goToMood(trip) {
  state.trip = trip;
  showView("mood");
}

// ---------------------------------------------------------------------
// Step 3: choose places
// ---------------------------------------------------------------------
function renderCategoryChips() {
  const container = qs("category-chips");
  container.replaceChildren();
  for (const mood of MOODS) {
    const chip = document.createElement("button");
    chip.className = "pp-chip";
    chip.type = "button";
    chip.innerHTML = `${icon(mood.icon)}<span>${mood.label}</span>`;
    if (mood.type === state.activeType) chip.classList.add("is-active");
    chip.addEventListener("click", () => {
      const wasActive = chip.classList.contains("is-active");
      container.querySelectorAll(".pp-chip").forEach((c) => c.classList.remove("is-active"));
      state.activeType = wasActive ? "" : mood.type;
      if (!wasActive) chip.classList.add("is-active");
      runSearch();
    });
    container.appendChild(chip);
  }
}

async function goToDiscover(initialType) {
  state.activeType = initialType || "";
  state.day = await ensureFirstDay(state.trip.id);
  state.days = await listDays(state.trip.id);
  state.stops = await listStops(state.day.id);
  renderDayTabs();
  await openDiscoverView();
}

// Shared by the first-time mood->discover transition and the "+ Add more
// places" jump back from the plan screen (state.day/state.stops are
// already loaded in both cases).
async function openDiscoverView() {
  renderCategoryChips();
  updatePlanPill();
  showView("discover");

  const center = { lat: state.trip.lat, lng: state.trip.lng };
  if (!state.map) {
    state.map = await createMap("map", center);
    attachMapIdleListener();
  } else {
    state.map.setCenter(center);
  }
  runSearch();
}

// Panning/zooming never auto-searches (PRD Section 4.3: bound API call
// volume with an explicit action) — it just surfaces "Search this area"
// once the map has settled meaningfully away from where the last search
// was centered.
function attachMapIdleListener() {
  if (state.mapListenerAttached) return;
  state.mapListenerAttached = true;
  state.map.addListener("idle", () => {
    if (!state.lastSearchCenter) return;
    const center = state.map.getCenter();
    const moved = haversineMeters(state.lastSearchCenter, { lat: center.lat(), lng: center.lng() });
    if (moved > 150) qs("btn-search-area").hidden = false;
  });
}

qs("btn-search-area").addEventListener("click", runSearch);

async function runSearch() {
  qs("btn-search-area").hidden = true;
  const q = qs("search-input").value.trim();
  const center = state.map.getCenter();
  state.lastSearchCenter = { lat: center.lat(), lng: center.lng() };
  const params = new URLSearchParams({
    q,
    type: state.activeType,
    lat: center.lat(),
    lng: center.lng(),
    radius: "1500",
  });
  const res = await fetch(`/api/places/search?${params}`);
  const { places } = await res.json();
  renderResults(places || []);
}

function renderResults(places) {
  state.markers.forEach((m) => m.setMap(null));
  state.markers = [];

  const container = qs("results");
  container.replaceChildren();

  const savedIds = new Set(state.stops.map((s) => s.place_id));

  for (const place of places) {
    const card = document.createElement("article");
    card.className = "pp-card";
    card.addEventListener("click", () => openPlaceDetail(place));

    if (place.photo_ref) {
      const photoWrap = document.createElement("div");
      photoWrap.className = "pp-card-photo-wrap";
      const img = document.createElement("img");
      img.className = "pp-card-photo";
      img.loading = "lazy";
      img.alt = "";
      img.src = `/api/places/photo?ref=${encodeURIComponent(place.photo_ref)}&maxWidth=320`;
      photoWrap.appendChild(img);
      card.appendChild(photoWrap);
    }

    const name = document.createElement("h3");
    name.textContent = place.display_name;
    card.appendChild(name);

    if (place.rating) {
      const rating = document.createElement("p");
      rating.className = "pp-card-meta";
      rating.innerHTML = `${icon("star", { size: 14 })} ${place.rating} (${place.user_rating_count || 0})`;
      card.appendChild(rating);
    }

    const saveBtn = document.createElement("button");
    saveBtn.className = "pp-card-save";
    saveBtn.type = "button";
    saveBtn.dataset.placeId = place.place_id;
    const isSaved = savedIds.has(place.place_id);
    saveBtn.innerHTML = saveButtonHtml(isSaved);
    if (isSaved) saveBtn.classList.add("is-saved");
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSavePlace(place);
    });
    card.appendChild(saveBtn);

    container.appendChild(card);

    if (place.lat && place.lng) {
      state.markers.push(new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: state.map,
        title: place.display_name,
      }));
    }
  }
}

// Toggles rather than one-way saves — the button stays clickable in both
// states so a place can be un-saved from Discovery, not just removed from
// the Plan screen's stop list.
async function toggleSavePlace(place) {
  const existing = state.stops.find((s) => s.place_id === place.place_id);
  if (existing) {
    await removeStop(existing.id);
    state.stops = state.stops.filter((s) => s.id !== existing.id);
  } else {
    const stop = await addStop(state.day.id, place.place_id);
    if (!stop) return;
    state.stops.push({ ...place, id: stop.id, order_index: stop.order_index, place_id: place.place_id });
  }
  updatePlanPill();
  // Keeps the Plan screen's list/map correct even though it's rendered
  // into DOM that just sits hidden while Discovery or the detail modal is
  // showing — cheap to re-render regardless of which screen is visible.
  if (state.day) renderPlanList();
  syncSaveButtons(place.place_id);
}

function saveButtonHtml(isSaved) {
  return isSaved
    ? `${icon("check", { size: 15 })}<span>Saved</span>`
    : `${icon("bookmark", { size: 15 })}<span>Save</span>`;
}

// Save can happen from the card grid or the detail modal — this keeps
// whichever save button(s) are currently in the DOM for a place in sync,
// regardless of which surface triggered it.
function syncSaveButtons(placeId) {
  const isSaved = state.stops.some((s) => s.place_id === placeId);
  document.querySelectorAll(`[data-place-id="${CSS.escape(placeId)}"]`).forEach((btn) => {
    btn.innerHTML = saveButtonHtml(isSaved);
    btn.classList.toggle("is-saved", isSaved);
  });
}

function updatePlanPill() {
  qs("plan-count").textContent = state.stops.length;
  qs("view-plan-pill").hidden = state.stops.length === 0 || qs("view-discover").hidden;
}

// ---------------------------------------------------------------------
// Rich detail modal — fetched on-demand only for the one place the user
// taps into (PRD Section 4.2: Enterprise-tier fields never prefetched for
// off-screen cards).
// ---------------------------------------------------------------------
const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

async function openPlaceDetail(place) {
  qs("detail-photo-wrap").hidden = true;
  qs("detail-body").innerHTML = `<p class="pp-status">Walkie is looking this up...</p>`;
  qs("detail-footer").innerHTML = "";
  openSheet("detail-sheet");
  try {
    const res = await fetch(`/api/places/${encodeURIComponent(place.place_id)}`);
    const data = await res.json();
    renderPlaceDetail(place, data);
  } catch (err) {
    qs("detail-body").innerHTML = `<p class="pp-status">Walkie couldn't load more about this place right now.</p>`;
  }
}

function accordionHtml(label, bodyHtml) {
  return `
    <details class="pp-detail-accordion">
      <summary>
        <span>${label}</span>
        ${icon("chevron-down", { size: 16, className: "pp-accordion-chevron" })}
      </summary>
      <div class="pp-detail-accordion-body">${bodyHtml}</div>
    </details>
  `;
}

// Google and Apple Maps are two equally-valid personal choices — one
// filled + one outlined read as "we recommend this one," which isn't true
// and isn't ours to decide. Same visual weight for both (a clearly bordered
// "outline" style, not the barely-there ghost style used for dismissive
// actions elsewhere) — the OS-preferred one is just listed first, a hint
// conveyed by position, not color.
function navButtonsHtml(links) {
  const preferred = preferredMapsApp();
  const buttons = [
    { key: "google", href: links.google, label: "Google Maps" },
    { key: "apple", href: links.apple, label: "Apple Maps" },
  ].sort((a) => (a.key === preferred ? -1 : 1));
  return buttons
    .map((b) => `<a href="${b.href}" target="_blank" rel="noopener" class="pp-btn pp-btn-outline">${b.label}</a>`)
    .join("");
}

function renderPlaceDetail(place, data) {
  const rich = data.rich_metadata || {};
  const isSaved = state.stops.some((s) => s.place_id === place.place_id);
  const priceTag = rich.price_level ? PRICE_LEVEL_MAP[rich.price_level] : "";
  const hours = rich.opening_hours?.weekdayDescriptions || [];
  const reviews = rich.reviews || [];

  const photoRef = rich.photos?.[0] || data.photo_ref || place.photo_ref;
  const photoWrap = qs("detail-photo-wrap");
  if (photoRef) {
    qs("detail-photo").src = `/api/places/photo?ref=${encodeURIComponent(photoRef)}&maxWidth=480`;
    photoWrap.hidden = false;
  } else {
    photoWrap.hidden = true;
  }

  const facts = [
    rich.formatted_address ? `<p class="pp-detail-row">${icon("map-pin", { size: 15 })} ${escapeHtml(rich.formatted_address)}</p>` : "",
    rich.phone ? `<p class="pp-detail-row">${icon("phone", { size: 15 })} ${escapeHtml(rich.phone)}</p>` : "",
    rich.website ? `<p class="pp-detail-row">${icon("link", { size: 15 })} <a href="${escapeHtml(rich.website)}" target="_blank" rel="noopener">Website</a></p>` : "",
  ].filter(Boolean).join("");

  qs("detail-body").innerHTML = `
    <h3>${escapeHtml(place.display_name)}</h3>
    <p class="pp-card-meta">${place.rating ? `${icon("star", { size: 14 })} ${place.rating} (${place.user_rating_count || 0})` : "No rating yet"}${priceTag ? ` · ${priceTag}` : ""}</p>
    ${rich.editorial_summary ? `<p class="pp-detail-summary">${escapeHtml(rich.editorial_summary)}</p>` : ""}
    ${facts ? `<div class="pp-detail-facts">${facts}</div>` : ""}
    ${hours.length ? accordionHtml("Hours", hours.map((h) => `<p>${escapeHtml(h)}</p>`).join("")) : ""}
    ${reviews.length ? accordionHtml(`Reviews (${reviews.length})`, reviews.map((r) => `<p class="pp-detail-review">${icon("star", { size: 13 })} ${r.rating} — "${escapeHtml(r.text || "")}"</p>`).join("")) : ""}
  `;

  const links = place.lat != null && place.lng != null ? placeViewUrl(place) : null;
  qs("detail-footer").innerHTML = `
    <button id="detail-save" class="pp-btn pp-btn-primary" type="button" data-place-id="${escapeHtml(place.place_id)}">${saveButtonHtml(isSaved)}</button>
    ${links ? `<div class="pp-detail-nav-row">${navButtonsHtml(links)}</div>` : ""}
  `;
  qs("detail-save").addEventListener("click", () => toggleSavePlace(place));
}

qs("detail-close").innerHTML = icon("x", { size: 18 });
qs("detail-close").addEventListener("click", () => closeSheet("detail-sheet"));
qs("detail-sheet").addEventListener("click", (e) => {
  if (e.target.id === "detail-sheet") closeSheet("detail-sheet");
});

// ---------------------------------------------------------------------
// Steps 4-7: itinerary plan / optimize / add date / handoff
// ---------------------------------------------------------------------
function renderDayTabs() {
  const container = qs("day-tabs");
  container.replaceChildren();
  if (state.days.length < 2) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  state.days.forEach((day, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "pp-day-tab-wrap";

    const tab = document.createElement("button");
    tab.className = "pp-day-tab";
    tab.type = "button";
    tab.textContent = day.trip_date ? day.trip_date : `Day ${idx + 1}`;
    if (day.id === state.day?.id) tab.classList.add("is-active");
    tab.addEventListener("click", () => switchDay(day));
    wrap.appendChild(tab);

    // Tabs only render at all once there are 2+ days (see the guard
    // above), so there's always at least one day left after this —
    // never lets the trip end up with zero.
    const delBtn = document.createElement("button");
    delBtn.className = "pp-day-tab-delete";
    delBtn.type = "button";
    delBtn.setAttribute("aria-label", `Delete ${tab.textContent}`);
    delBtn.innerHTML = icon("x", { size: 10 });
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDeleteDay(day, idx);
    });
    wrap.appendChild(delBtn);

    container.appendChild(wrap);
  });
}

function confirmDeleteDay(day, idx) {
  showConfirmSheet({
    title: "Delete this day?",
    message: `Day ${idx + 1}${day.trip_date ? ` (${day.trip_date})` : ""} and its stops will be removed — this can't be undone.`,
    confirmLabel: "Delete day",
    onConfirm: async () => {
      await deleteDay(day.id);
      state.days = await listDays(state.trip.id);
      if (state.day.id === day.id) {
        state.day = state.days[0];
        state.stops = await listStops(state.day.id);
      }
      renderDayTabs();
      renderPlanList();
      renderDateWrap();
      updateHandoffFooter();
    },
  });
}

async function switchDay(day) {
  state.day = day;
  state.stops = await listStops(day.id);
  renderDayTabs();
  renderPlanList();
  renderDateWrap();
  updateHandoffFooter();
}

async function goToPlan() {
  qs("plan-trip-title").textContent = state.trip.title;
  state.stops = await listStops(state.day.id);
  renderDayTabs();
  renderPlanList();
  renderDateWrap();
  updateHandoffFooter();
  qs("optimize-preview").hidden = true;
  showView("plan");
}

function renderPlanList() {
  const list = qs("plan-list");
  list.replaceChildren();
  qs("plan-empty").hidden = state.stops.length > 0;
  qs("btn-optimize").disabled = state.stops.length < 2;

  state.stops.forEach((stop, idx) => {
    const li = document.createElement("li");
    li.className = "pp-stop";
    li.dataset.id = stop.id;

    // The whole card opens the place's detail modal (description +
    // navigate) now — was previously a separate always-visible icon
    // button, folded into the card tap to cut down the row of icons per
    // user feedback after phone testing.
    const card = document.createElement("div");
    card.className = "pp-stop-card";
    card.addEventListener("click", () => openPlaceDetail(stop));
    card.innerHTML = `
      ${stop.photo_ref
        ? `<span class="pp-stop-thumb-wrap"><span class="pp-stop-thumb"><img src="/api/places/photo?ref=${encodeURIComponent(stop.photo_ref)}&maxWidth=120" alt="" /></span><span class="pp-stop-thumb-badge">${idx + 1}</span></span>`
        : `<span class="pp-stop-num">${idx + 1}</span>`}
      <span class="pp-stop-info">
        <h4>${escapeHtml(stop.display_name)}</h4>
        <p class="pp-stop-meta">${stop.rating ? `${icon("star", { size: 13 })} ${stop.rating}` : "No rating yet"}</p>
      </span>
    `;

    // Tap-based reorder — the required non-drag fallback (PRD Section 2.6:
    // "do not ship drag-only interactions on mobile"). Buttons disable at
    // the ends instead of wrapping, so their state alone communicates
    // position without relying on the drag list for feedback.
    const moveGroup = document.createElement("div");
    moveGroup.className = "pp-stop-move-group";

    const moveUpBtn = document.createElement("button");
    moveUpBtn.className = "pp-stop-move-btn";
    moveUpBtn.type = "button";
    moveUpBtn.title = `Move ${stop.display_name} earlier`;
    moveUpBtn.innerHTML = icon("chevron-up", { size: 14 });
    moveUpBtn.disabled = idx === 0;
    moveUpBtn.addEventListener("click", (e) => { e.stopPropagation(); moveStop(idx, -1); });
    moveGroup.appendChild(moveUpBtn);

    const moveDownBtn = document.createElement("button");
    moveDownBtn.className = "pp-stop-move-btn";
    moveDownBtn.type = "button";
    moveDownBtn.title = `Move ${stop.display_name} later`;
    moveDownBtn.innerHTML = icon("chevron-down", { size: 14 });
    moveDownBtn.disabled = idx === state.stops.length - 1;
    moveDownBtn.addEventListener("click", (e) => { e.stopPropagation(); moveStop(idx, 1); });
    moveGroup.appendChild(moveDownBtn);

    card.appendChild(moveGroup);

    const removeBtn = document.createElement("button");
    removeBtn.className = "pp-stop-remove";
    removeBtn.type = "button";
    removeBtn.title = "Remove";
    removeBtn.innerHTML = icon("x", { size: 16 });
    removeBtn.addEventListener("click", (e) => { e.stopPropagation(); deleteStop(stop.id); });
    card.appendChild(removeBtn);

    li.appendChild(card);
    list.appendChild(li);
  });

  initSortable();
  renderPlanMap();
}

// Same coral fill as --brand-primary, hand-kept in sync (Marker icons are
// canvas-rendered by the Maps SDK, not our stylesheet, so this can't read
// the CSS variable directly).
function numberedMarkerIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="#FF8A5B" stroke="#FFFFFF" stroke-width="2.5"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(34, 34),
    // Without an explicit anchor, Marker defaults to anchoring an icon at
    // its bottom-center (correct for a teardrop pin, wrong for a circle)
    // — the circle was rendering shifted up-left of its real coordinate.
    anchor: new google.maps.Point(17, 17),
    labelOrigin: new google.maps.Point(17, 17),
  };
}

// The route map (PRD Section 3.1's "live map with numbered pins and a
// drawn polyline connecting them in order") — kept in sync with the list
// by living inside renderPlanList rather than being called separately at
// each of its call sites, so a reorder/add/remove/optimize can never
// update the list without also updating the map.
async function renderPlanMap() {
  const wrap = qs("plan-map-wrap");
  const located = state.stops.filter((s) => s.lat != null && s.lng != null);

  if (located.length === 0) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;

  if (!state.planMap) {
    state.planMap = await createMap("plan-map", located[0]);
  }

  state.planMarkers.forEach((m) => m.setMap(null));
  state.planMarkers = located.map((stop) => new google.maps.Marker({
    position: { lat: stop.lat, lng: stop.lng },
    map: state.planMap,
    icon: numberedMarkerIcon(),
    // Google's default teardrop marker only gives the label a small round
    // cap to sit in, which was clipping the digit — a full circle icon
    // with a centered labelOrigin fixes that, and doubles as a "cropped
    // number" fix + visual match for the coral badges used everywhere
    // else in the app.
    label: { text: String(state.stops.indexOf(stop) + 1), color: "#2B211B", fontWeight: "700", fontSize: "13px" },
    title: stop.display_name,
  }));

  if (state.planPolyline) state.planPolyline.setMap(null);
  const roadPath = await fetchRoutePath(located);
  state.planPolyline = new google.maps.Polyline({
    path: roadPath || located.map((s) => ({ lat: s.lat, lng: s.lng })),
    geodesic: true,
    strokeColor: "#7FB6A2",
    strokeOpacity: 0.9,
    strokeWeight: 4,
    map: state.planMap,
  });

  const bounds = new google.maps.LatLngBounds();
  located.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
  if (located.length > 1) {
    state.planMap.fitBounds(bounds, 48);
  } else {
    state.planMap.setCenter(bounds.getCenter());
    state.planMap.setZoom(14);
  }
}

// Road-aligned route geometry (PRD Section 4.5, Step 2: Directions called
// only for the "confirmed plan" view, not per-drag-frame — this fires once
// per plan render, not on every intermediate reorder gesture). Falls back
// to null (straight line) on any failure so a Directions hiccup never
// breaks the map.
async function fetchRoutePath(located) {
  if (located.length < 2) return null;
  const points = located.map((s) => `${s.lat},${s.lng}`).join("|");
  try {
    const res = await fetch(`/api/route?points=${encodeURIComponent(points)}&mode=walking`);
    const data = await res.json();
    return data.path || null;
  } catch (err) {
    return null;
  }
}

function initSortable() {
  const list = qs("plan-list");
  if (state.sortable) state.sortable.destroy();
  if (typeof Sortable === "undefined") return;
  state.sortable = Sortable.create(list, {
    animation: 150,
    onEnd: async () => {
      const orderedIds = Array.from(list.children).map((li) => li.dataset.id);
      state.stops.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
      await reorderStops(orderedIds);
      renderPlanList();
    },
  });
}

async function deleteStop(stopId) {
  await removeStop(stopId);
  state.stops = state.stops.filter((s) => s.id !== stopId);
  renderPlanList();
  updateHandoffFooter();
}

async function moveStop(idx, delta) {
  const target = idx + delta;
  if (target < 0 || target >= state.stops.length) return;
  const [stop] = state.stops.splice(idx, 1);
  state.stops.splice(target, 0, stop);
  renderPlanList();
  await reorderStops(state.stops.map((s) => s.id));
}

qs("btn-add-day").addEventListener("click", async (e) => {
  e.preventDefault();
  const day = await createDay(state.trip.id, state.days.length);
  state.days = await listDays(state.trip.id);
  state.day = day;
  state.stops = [];
  renderDayTabs();
  renderPlanList();
  updateHandoffFooter();
});

qs("btn-optimize").addEventListener("click", () => {
  if (state.stops.length < 2) return;
  const anchor = state.trip.lat != null
    ? { lat: state.trip.lat, lng: state.trip.lng }
    : state.stops[0];
  const result = optimizeOrder(state.stops, anchor);

  if (result.savedMeters < 30) {
    qs("optimize-summary").textContent = "Your order's already about as efficient as it gets!";
    qs("btn-optimize-apply").hidden = true;
  } else {
    const minutes = estimateWalkMinutes(result.savedMeters);
    qs("optimize-summary").textContent = `New order saves ~${minutes} min (${formatDistance(result.savedMeters)}) of walking.`;
    qs("btn-optimize-apply").hidden = false;
  }
  qs("optimize-preview").hidden = false;
  qs("btn-optimize-apply").onclick = async () => {
    state.stops = result.stops;
    await reorderStops(state.stops.map((s) => s.id));
    qs("optimize-preview").hidden = true;
    renderPlanList();
  };

  qs("optimize-suggestions").hidden = true;
  fetchSuggestions().then(renderSuggestions);
});

// Walkie's lightweight "fill the gap" heuristic: which of our own mood
// categories aren't represented yet among the saved stops. Matches
// loosely against Google's primary_type (e.g. "market" won't match
// "shopping_mall") — an acceptable trade-off for staying a light nudge
// rather than a real taxonomy.
function missingMoodTypes() {
  const present = new Set(state.stops.map((s) => s.primary_type));
  return MOODS.filter((m) => !present.has(m.type));
}

function stopsCentroid() {
  const located = state.stops.filter((s) => s.lat != null && s.lng != null);
  if (!located.length) return { lat: state.trip.lat, lng: state.trip.lng };
  return {
    lat: located.reduce((sum, s) => sum + s.lat, 0) / located.length,
    lng: located.reduce((sum, s) => sum + s.lng, 0) / located.length,
  };
}

// One search per missing category, capped at 2 so this stays a light
// nudge rather than a wall of suggestions — reuses the existing search
// proxy, no new API surface or cost model.
async function fetchSuggestions() {
  const missing = missingMoodTypes().slice(0, 2);
  if (!missing.length) return [];
  const center = stopsCentroid();
  const savedIds = new Set(state.stops.map((s) => s.place_id));
  const suggestions = [];
  for (const mood of missing) {
    const params = new URLSearchParams({ q: "", type: mood.type, lat: center.lat, lng: center.lng, radius: "1500" });
    try {
      const res = await fetch(`/api/places/search?${params}`);
      const { places } = await res.json();
      const pick = (places || []).find((p) => !savedIds.has(p.place_id));
      if (pick) suggestions.push({ ...pick, moodLabel: mood.label, moodIcon: mood.icon });
    } catch (err) {
      // one category's search failing shouldn't block the others
    }
  }
  return suggestions;
}

function renderSuggestions(suggestions) {
  const wrap = qs("optimize-suggestions");
  if (!suggestions.length) {
    wrap.hidden = true;
    wrap.replaceChildren();
    return;
  }
  wrap.replaceChildren();
  const title = document.createElement("p");
  title.className = "pp-suggestions-title";
  title.textContent = "Walkie noticed a gap — maybe one of these?";
  wrap.appendChild(title);

  for (const place of suggestions) {
    const card = document.createElement("div");
    card.className = "pp-suggestion-card";
    card.innerHTML = `
      ${place.photo_ref
        ? `<img class="pp-suggestion-photo" src="/api/places/photo?ref=${encodeURIComponent(place.photo_ref)}&maxWidth=100" alt="" />`
        : `<span class="pp-suggestion-photo pp-suggestion-photo-empty">${icon(place.moodIcon, { size: 20 })}</span>`}
      <span class="pp-suggestion-info">
        <span class="pp-suggestion-mood">${icon(place.moodIcon, { size: 12 })}${escapeHtml(place.moodLabel)}</span>
        <h5>${escapeHtml(place.display_name)}</h5>
        <p class="pp-card-meta">${place.rating ? `${icon("star", { size: 12 })} ${place.rating}` : ""}</p>
      </span>
    `;
    const saveBtn = document.createElement("button");
    saveBtn.className = "pp-card-save";
    saveBtn.type = "button";
    saveBtn.dataset.placeId = place.place_id;
    saveBtn.innerHTML = saveButtonHtml(false);
    saveBtn.addEventListener("click", () => toggleSavePlace(place));
    card.appendChild(saveBtn);
    wrap.appendChild(card);
  }
  wrap.hidden = false;
}

qs("btn-optimize-keep").addEventListener("click", () => {
  qs("optimize-preview").hidden = true;
});

// Rebuilt on every plan render (not wired once at boot) because the
// affordance's content depends on state.day.trip_date, which changes
// whenever the user switches day tabs or sets a date — a static listener
// bound once at boot can't reflect that.
//
// One trigger handles both "add" and "change": once a date is set it
// used to render as a plain, non-interactive span with no way back to the
// picker — this rebuilds the <input> pre-filled with the current value
// every time, so re-opening it starts from what's already set instead of
// defaulting to today with no way to move off that default.
function renderDateWrap() {
  const wrap = qs("add-date-wrap");
  const value = state.day?.trip_date || "";
  wrap.innerHTML = `
    <button type="button" id="date-trigger" class="pp-skip-link">
      ${value ? `${icon("calendar", { size: 15 })} ${value}` : "+ Add dates"}
    </button>
    <input id="date-input" type="date" class="pp-date-input" hidden value="${value}" />
  `;
  qs("date-trigger").addEventListener("click", () => {
    const input = qs("date-input");
    input.hidden = false;
    input.focus();
    if (input.showPicker) input.showPicker();
  });
  qs("date-input").addEventListener("change", async (e) => {
    const newValue = e.target.value;
    if (!newValue) return;
    await setDayDate(state.day.id, newValue);
    await setTripMode(state.trip.id, "planning");
    state.trip.mode = "planning";
    state.day.trip_date = newValue;
    renderDateWrap();
    renderDayTabs();
    updateHandoffFooter();
  });
}

function updateHandoffFooter() {
  const btn = qs("btn-handoff-day");
  const isPlanning = state.trip?.mode === "planning";
  btn.textContent = isPlanning ? "Let's go" : "Save for when you're ready";
  btn.disabled = state.stops.length < 2;
}

qs("btn-handoff-day").addEventListener("click", () => {
  const url = dayHandoffUrl(state.stops);
  if (!url) return;
  openHandoffSheet("Send your whole day to Google Maps", { google: url, apple: null });
});

function openHandoffSheet(title, links) {
  qs("handoff-sheet-title").textContent = title;
  const googleBtn = qs("handoff-google");
  const appleBtn = qs("handoff-apple");
  googleBtn.href = links.google;
  if (links.apple) {
    // Both are equally-valid choices when both are offered — same weight,
    // not one filled/one outlined implying a recommendation.
    appleBtn.href = links.apple;
    appleBtn.hidden = false;
    googleBtn.className = "pp-btn pp-btn-ghost";
    appleBtn.className = "pp-btn pp-btn-ghost";
  } else {
    // Only one option shown — it's the sole action here, so it earns the
    // primary treatment same as any single-CTA button.
    appleBtn.hidden = true;
    googleBtn.className = "pp-btn pp-btn-primary";
  }
  openSheet("handoff-sheet");
}

qs("handoff-close").addEventListener("click", () => closeSheet("handoff-sheet"));
qs("handoff-sheet").addEventListener("click", (e) => {
  if (e.target.id === "handoff-sheet") closeSheet("handoff-sheet");
});

// ---------------------------------------------------------------------
// Cross-view wiring
// ---------------------------------------------------------------------
qs("btn-new-trip").addEventListener("click", goToStart);
qs("btn-my-trips").innerHTML = icon("arrow-left", { size: 20 });
qs("btn-my-trips").addEventListener("click", goToTrips);
qs("btn-back-discover").addEventListener("click", openDiscoverView);
qs("view-plan-pill").addEventListener("click", goToPlan);
qs("btn-trip-menu").innerHTML = icon("more-horizontal", { size: 20 });
qs("btn-trip-menu").addEventListener("click", () => openTripOptions(state.trip));

qs("mood-skip").addEventListener("click", (e) => { e.preventDefault(); goToDiscover(""); });

document.querySelectorAll(".pp-option-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (card.dataset.choice === "dream") {
      qs("dream-input-wrap").hidden = false;
      qs("dream-input").focus();
    } else {
      startNearbyTrip();
    }
  });
});

qs("btn-dream-go").addEventListener("click", () => {
  const value = qs("dream-input").value.trim();
  if (value) startDreamTrip(value);
});
qs("dream-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") qs("btn-dream-go").click();
});

qs("search-input").addEventListener("change", runSearch);

// ---------------------------------------------------------------------
// Theme toggle — inline script in index.html <head> already applied any
// stored choice before first paint (avoids a flash of the wrong theme);
// this just keeps the button's icon in sync and handles clicks.
// ---------------------------------------------------------------------
const THEME_KEY = "pp-theme";

function effectiveTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function renderThemeToggle() {
  const isDark = effectiveTheme() === "dark";
  const btn = qs("theme-toggle");
  btn.innerHTML = icon(isDark ? "sun" : "moon", { size: 18 });
  btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
}

qs("theme-toggle").addEventListener("click", () => {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  document.documentElement.setAttribute("data-theme", next);
  renderThemeToggle();
});

renderThemeToggle();

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
async function init() {
  await ensureSession();
  renderMoodChips();
  const trips = await listTrips();
  if (trips.length === 0) {
    goToStart();
  } else {
    state.trips = trips;
    renderTripList();
    showView("trips");
  }
}

init();
