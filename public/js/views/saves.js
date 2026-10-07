// Saving a place to the current day. Shared by the Discovery cards, the
// detail sheet and Walkie's suggestions, so it lives in one place.

import { qs } from "../core/dom.js";
import { current, state } from "../core/state.js";
import { trips } from "../data/trips.js";
import { saveButtonHtml } from "../ui/place-ui.js";

/** @typedef {import("../types.js").Place} Place */

/** Fired whenever the current day's stops change, so the plan can re-render. */
export const STOPS_CHANGED = "pp-stops-changed";

export function notifyStopsChanged() {
  window.dispatchEvent(new CustomEvent(STOPS_CHANGED));
}

/**
 * Toggles rather than one-way saves: the button stays clickable in both
 * states, so a place can be un-saved from Discovery, not just removed from
 * the plan's stop list.
 * @param {Place} place
 */
export async function toggleSavePlace(place) {
  const { day } = current();
  const existing = state.stops.find((s) => s.place_id === place.place_id);
  if (existing) {
    await trips.removeStop(existing.id);
    state.stops = state.stops.filter((s) => s.id !== existing.id);
  } else {
    const stop = await trips.addStop(day.id, place);
    if (!stop) return;
    state.stops.push({ ...place, ...stop });
  }
  updatePlanPill();
  syncSaveButtons(place.place_id);
  notifyStopsChanged();
}

/**
 * Save can happen from the card grid, the detail sheet or a suggestion. This
 * keeps every save button for a place in sync, whichever one was tapped.
 * @param {string} placeId
 */
export function syncSaveButtons(placeId) {
  const isSaved = state.stops.some((s) => s.place_id === placeId);
  document.querySelectorAll(`[data-place-id="${CSS.escape(placeId)}"]`).forEach((btn) => {
    btn.innerHTML = saveButtonHtml(isSaved);
    btn.classList.toggle("is-saved", isSaved);
    btn.setAttribute("aria-pressed", String(isSaved));
    if (isSaved) {
      // Brief "collected" pop (PRD 2.5: saving is framed as collecting).
      btn.classList.remove("is-collected");
      void (/** @type {HTMLElement} */ (btn).offsetWidth);
      btn.classList.add("is-collected");
    }
  });
}

export function updatePlanPill() {
  qs("plan-count").textContent = String(state.stops.length);
  qs("view-plan-pill").hidden = state.stops.length === 0 || qs("view-discover").hidden;
}
