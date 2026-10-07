// Step 3: choose places. Search + mood chips, a browse map, and result cards.

import { escapeHtml, qs } from "../core/dom.js";
import { nav, showView } from "../core/nav.js";
import { MOODS, current, state } from "../core/state.js";
import { searchPlaces } from "../data/places.js";
import { trips } from "../data/trips.js";
import { haversineMeters } from "../lib/optimizer.js";
import { createMap } from "../map/adapter.js";
import { icon } from "../ui/icons.js";
import { placeMeta, placeVisual, saveButtonHtml } from "../ui/place-ui.js";
import { walkieSays } from "../ui/walkie.js";
import { openPlaceDetail } from "./detail.js";
import { renderDayTabs } from "./plan.js";
import { toggleSavePlace, updatePlanPill } from "./saves.js";

/** @typedef {import("../types.js").Place} Place */

/** Last results, so a map pin tap can open the matching card's detail. */
/** @type {Place[]} */
let lastResults = [];
let searchSeq = 0;

function renderCategoryChips() {
  const container = qs("category-chips");
  container.replaceChildren();
  for (const mood of MOODS) {
    const chip = document.createElement("button");
    chip.className = `pp-chip pp-chip--${mood.type}`;
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(mood.type === state.activeType));
    chip.innerHTML = `${icon(mood.icon)}<span>${mood.label}</span>`;
    if (mood.type === state.activeType) chip.classList.add("is-active");
    chip.addEventListener("click", () => {
      state.activeType = state.activeType === mood.type ? "" : mood.type;
      renderCategoryChips();
      runSearch({ frame: true });
    });
    container.appendChild(chip);
  }
}

/** @param {string} [initialType] */
async function goToDiscover(initialType) {
  const trip = state.trip;
  if (!trip) throw new Error("No trip open");
  state.activeType = initialType || "";
  state.day = await trips.ensureFirstDay(trip.id);
  state.days = await trips.listDays(trip.id);
  state.stops = await trips.listStops(state.day.id);
  renderDayTabs();
  await openDiscoverView();
}

// Shared by the first mood -> discover transition and the "+ Add more
// places" jump back from the plan (state.day/state.stops already loaded).
async function openDiscoverView() {
  const { trip } = current();
  renderCategoryChips();
  showView("discover");
  updatePlanPill();

  const center = { lat: trip.lat, lng: trip.lng };
  if (!state.discoverMap) {
    state.discoverMap = await createMap(qs("map"), center);
    // Panning/zooming never auto-searches (PRD Section 4.3: bound API call
    // volume with an explicit action). It just offers "Search this area"
    // once the map has settled meaningfully away from the last search.
    state.discoverMap.onIdle(() => {
      if (!state.lastSearchCenter || !state.discoverMap) return;
      const moved = haversineMeters(state.lastSearchCenter, state.discoverMap.getCenter());
      if (moved > 150) qs("btn-search-area").hidden = false;
    });
  } else {
    state.discoverMap.setCenter(center, 14);
  }
  await runSearch({ frame: true });
}

/** @param {{ frame?: boolean }} [opts] frame: zoom to fit the results (first search on a trip only). */
async function runSearch({ frame = false } = {}) {
  if (!state.discoverMap) return;
  qs("btn-search-area").hidden = true;
  const seq = ++searchSeq;
  const q = /** @type {HTMLInputElement} */ (qs("search-input")).value.trim();
  const center = state.discoverMap.getCenter();
  state.lastSearchCenter = center;
  qs("results").setAttribute("aria-busy", "true");
  try {
    const places = await searchPlaces({ q, type: state.activeType, lat: center.lat, lng: center.lng, radius: 1500 });
    if (seq !== searchSeq) return; // a newer search finished first
    renderResults(places);
    if (frame && state.discoverMap) {
      await state.discoverMap.fitTo(places.filter((p) => p.lat != null && p.lng != null).map((p) => ({ lat: /** @type {number} */ (p.lat), lng: /** @type {number} */ (p.lng) })));
      state.lastSearchCenter = state.discoverMap.getCenter();
    }
  } catch {
    if (seq !== searchSeq) return;
    qs("results").innerHTML = walkieSays("confused", "Walkie couldn't reach the map service. Give it another try in a moment?");
  } finally {
    qs("results").removeAttribute("aria-busy");
  }
}

/** @param {Place[]} places */
function renderResults(places) {
  lastResults = places;
  const container = qs("results");
  container.replaceChildren();

  const located = places.filter((p) => p.lat != null && p.lng != null);
  state.discoverMap?.setPlaceMarkers(
    located.map((p) => ({ id: p.place_id, lat: /** @type {number} */ (p.lat), lng: /** @type {number} */ (p.lng), title: p.display_name })),
    (id) => {
      const place = lastResults.find((p) => p.place_id === id);
      if (place) openPlaceDetail(place);
    },
  );

  if (!places.length) {
    container.innerHTML = walkieSays("thinking", "Walkie hasn't found any spots here yet. Try another mood, or move the map and search this area.");
    return;
  }

  const savedIds = new Set(state.stops.map((s) => s.place_id));
  places.forEach((place, i) => {
    const card = document.createElement("article");
    card.className = "pp-card";
    card.style.setProperty("--i", String(Math.min(i, 8)));

    const isSaved = savedIds.has(place.place_id);
    card.innerHTML = `
      <button class="pp-card-open" type="button" aria-label="More about ${escapeHtml(place.display_name)}">
        <span class="pp-card-photo-wrap">${placeVisual(place, 320, "pp-card-photo")}</span>
        <span class="pp-card-text">
          <span class="pp-card-title">${escapeHtml(place.display_name)}</span>
          <span class="pp-card-meta">${placeMeta(place)}</span>
        </span>
      </button>
      <button class="pp-card-save${isSaved ? " is-saved" : ""}" type="button" data-place-id="${escapeHtml(place.place_id)}" aria-pressed="${isSaved}">${saveButtonHtml(isSaved)}</button>`;
    /** @type {HTMLElement} */ (card.querySelector(".pp-card-open")).addEventListener("click", () => openPlaceDetail(place));
    /** @type {HTMLElement} */ (card.querySelector(".pp-card-save")).addEventListener("click", () => toggleSavePlace(place));
    container.appendChild(card);
  });
}

export function initDiscoverView() {
  nav.goToDiscover = goToDiscover;
  nav.openDiscoverView = openDiscoverView;
  qs("btn-search-area").addEventListener("click", () => runSearch());
  const search = /** @type {HTMLInputElement} */ (qs("search-input"));
  search.addEventListener("change", () => runSearch());
  search.addEventListener("keydown", (e) => e.key === "Enter" && runSearch());
  qs("view-plan-pill").addEventListener("click", () => nav.goToPlan());
}
