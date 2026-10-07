// The generic bottom sheets: trip options (rename / delete), a reusable
// confirm dialog, and the navigation handoff sheet.

import { bindSheetDismiss, closeSheet, escapeHtml, openSheet, qs } from "../core/dom.js";
import { nav } from "../core/nav.js";
import { state } from "../core/state.js";
import { trips } from "../data/trips.js";
import { icon } from "../ui/icons.js";

/** @typedef {import("../types.js").Trip} Trip */

const SHEET = "trip-options-sheet";

/** @type {Trip | null} */
let target = null;

/** @param {Trip} trip */
export function openTripOptions(trip) {
  target = trip;
  showMenu();
  openSheet(SHEET);
}

function closeTripOptions() {
  closeSheet(SHEET);
  target = null;
}

/** @param {string} title @param {string} bodyHtml */
function render(title, bodyHtml) {
  qs("trip-options-title").textContent = title;
  qs("trip-options-body").innerHTML = bodyHtml;
}

function showMenu() {
  if (!target) return;
  render(
    target.title,
    `<button id="trip-opt-rename" class="pp-btn pp-btn-outline" type="button">${icon("pencil", { size: 16 })}<span>Rename trip</span></button>
     <button id="trip-opt-delete" class="pp-btn pp-btn-outline pp-btn-danger" type="button">${icon("trash", { size: 16 })}<span>Delete trip</span></button>
     <button id="trip-opt-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>`,
  );
  qs("trip-opt-rename").addEventListener("click", showRename);
  qs("trip-opt-delete").addEventListener("click", showDelete);
  qs("trip-opt-cancel").addEventListener("click", closeTripOptions);
}

function showRename() {
  if (!target) return;
  const trip = target;
  render(
    "Rename trip",
    `<label class="pp-sr-only" for="trip-rename-input">Trip name</label>
     <input id="trip-rename-input" class="pp-input" type="text" value="${escapeHtml(trip.title)}" />
     <button id="trip-rename-save" class="pp-btn pp-btn-primary" type="button">Save</button>
     <button id="trip-rename-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>`,
  );
  const field = /** @type {HTMLInputElement} */ (qs("trip-rename-input"));
  field.focus();
  field.select();
  const save = async () => {
    const title = field.value.trim();
    if (!title) return;
    await trips.renameTrip(trip.id, title);
    trip.title = title;
    if (state.trip?.id === trip.id) {
      state.trip.title = title;
      qs("plan-trip-title").textContent = title;
    }
    const listed = state.trips.find((t) => t.id === trip.id);
    if (listed) listed.title = title;
    window.dispatchEvent(new CustomEvent("pp-trips-changed"));
    closeTripOptions();
  };
  qs("trip-rename-save").addEventListener("click", save);
  field.addEventListener("keydown", (e) => e.key === "Enter" && save());
  qs("trip-rename-cancel").addEventListener("click", showMenu);
}

function showDelete() {
  if (!target) return;
  const trip = target;
  render(
    "Delete this trip?",
    `<p class="pp-status">"${escapeHtml(trip.title)}" and everything in it will be gone for good. This can't be undone.</p>
     <button id="trip-delete-confirm" class="pp-btn pp-btn-outline pp-btn-danger" type="button">Delete trip</button>
     <button id="trip-delete-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>`,
  );
  qs("trip-delete-confirm").addEventListener("click", async () => {
    await trips.deleteTrip(trip.id);
    const wasCurrent = state.trip?.id === trip.id;
    closeTripOptions();
    state.trips = state.trips.filter((t) => t.id !== trip.id);
    if (wasCurrent || !state.trip) await nav.goToTrips();
  });
  qs("trip-delete-cancel").addEventListener("click", showMenu);
}

/**
 * Generic confirm dialog, reusing the trip-options sheet's generic
 * title/body containers rather than one sheet element per destructive action.
 * @param {{ title: string, message: string, confirmLabel: string, onConfirm: () => Promise<void> }} o
 */
export function showConfirmSheet({ title, message, confirmLabel, onConfirm }) {
  render(
    title,
    `<p class="pp-status">${escapeHtml(message)}</p>
     <button id="confirm-sheet-confirm" class="pp-btn pp-btn-outline pp-btn-danger" type="button">${escapeHtml(confirmLabel)}</button>
     <button id="confirm-sheet-cancel" class="pp-btn pp-btn-ghost" type="button">Cancel</button>`,
  );
  qs("confirm-sheet-confirm").addEventListener("click", async () => {
    closeTripOptions();
    await onConfirm();
  });
  qs("confirm-sheet-cancel").addEventListener("click", closeTripOptions);
  openSheet(SHEET);
}

/**
 * @param {string} title
 * @param {{ google: string, apple: string | null }} links
 */
export function openHandoffSheet(title, links) {
  qs("handoff-sheet-title").textContent = title;
  const googleBtn = /** @type {HTMLAnchorElement} */ (qs("handoff-google"));
  const appleBtn = /** @type {HTMLAnchorElement} */ (qs("handoff-apple"));
  googleBtn.href = links.google;
  if (links.apple) {
    // Two equally valid choices: same weight, not one filled and one
    // outlined implying a recommendation.
    appleBtn.href = links.apple;
    appleBtn.hidden = false;
    googleBtn.className = appleBtn.className = "pp-btn pp-btn-outline";
  } else {
    // The sole action here, so it earns the primary treatment.
    appleBtn.hidden = true;
    googleBtn.className = "pp-btn pp-btn-primary";
  }
  openSheet("handoff-sheet");
}

export function initSheets() {
  bindSheetDismiss(SHEET, closeTripOptions);
  bindSheetDismiss("handoff-sheet", () => closeSheet("handoff-sheet"));
  qs("handoff-close").addEventListener("click", () => closeSheet("handoff-sheet"));
}
