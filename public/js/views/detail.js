// Rich detail sheet: fetched on demand only for the one place the user taps
// into (PRD Section 4.2: Enterprise-tier fields are never prefetched for
// off-screen cards).

import { bindSheetDismiss, closeSheet, escapeHtml, openSheet, qs } from "../core/dom.js";
import { state } from "../core/state.js";
import { getPlaceDetail, photoUrl } from "../data/places.js";
import { placeViewUrl, preferredMapsApp } from "../lib/handoff.js";
import { icon } from "../ui/icons.js";
import { placeMeta, saveButtonHtml } from "../ui/place-ui.js";
import { walkieSays } from "../ui/walkie.js";
import { toggleSavePlace } from "./saves.js";

/** @typedef {import("../types.js").Place} Place */
/** @typedef {import("../types.js").PlaceDetail} PlaceDetail */

const PRICE_LEVEL = /** @type {Record<string, string>} */ ({
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
});

/** @param {Place} place */
export async function openPlaceDetail(place) {
  qs("detail-photo-wrap").hidden = true;
  qs("detail-body").innerHTML = walkieSays("thinking", "Walkie is looking this up…", { size: 52, live: true });
  qs("detail-footer").innerHTML = "";
  openSheet("detail-sheet");
  try {
    renderDetail(place, await getPlaceDetail(place.place_id));
  } catch {
    qs("detail-body").innerHTML = walkieSays("confused", "Walkie couldn't load more about this place right now.", { size: 52 });
  }
}

/** @param {string} label @param {string} bodyHtml */
function accordion(label, bodyHtml) {
  return `
    <details class="pp-detail-accordion">
      <summary><span>${label}</span>${icon("chevron-down", { size: 16, className: "pp-accordion-chevron" })}</summary>
      <div class="pp-detail-accordion-body">${bodyHtml}</div>
    </details>`;
}

// Google and Apple Maps are two equally valid personal choices. One filled
// and one outlined would read as "we recommend this one", which isn't ours
// to decide. Same weight for both; the OS-preferred one is just listed first.
/** @param {{ google: string, apple: string }} links */
function navButtons(links) {
  const preferred = preferredMapsApp();
  return [
    { key: "google", href: links.google, label: "Google Maps" },
    { key: "apple", href: links.apple, label: "Apple Maps" },
  ]
    .sort((a) => (a.key === preferred ? -1 : 1))
    .map((b) => `<a href="${escapeHtml(b.href)}" target="_blank" rel="noopener" class="pp-btn pp-btn-outline">${b.label}</a>`)
    .join("");
}

/** @param {Place} place @param {PlaceDetail} data */
function renderDetail(place, data) {
  const rich = data.rich_metadata ?? {};
  const isSaved = state.stops.some((s) => s.place_id === place.place_id);
  const price = rich.price_level ? PRICE_LEVEL[rich.price_level] : "";
  const hours = rich.opening_hours?.weekdayDescriptions ?? [];
  const reviews = rich.reviews ?? [];

  const src = photoUrl(rich.photos?.[0] ?? data.photo_ref ?? place.photo_ref, 480);
  const photoWrap = qs("detail-photo-wrap");
  if (src) {
    /** @type {HTMLImageElement} */ (qs("detail-photo")).src = src;
    photoWrap.hidden = false;
  } else {
    photoWrap.hidden = true;
  }

  const facts = [
    rich.formatted_address ? `<p class="pp-detail-row">${icon("map-pin", { size: 15 })} ${escapeHtml(rich.formatted_address)}</p>` : "",
    rich.phone ? `<p class="pp-detail-row">${icon("phone", { size: 15 })} ${escapeHtml(rich.phone)}</p>` : "",
    rich.website ? `<p class="pp-detail-row">${icon("link", { size: 15 })} <a href="${escapeHtml(rich.website)}" target="_blank" rel="noopener">Website</a></p>` : "",
  ].join("");

  qs("detail-body").innerHTML = `
    <h3 id="detail-title">${escapeHtml(place.display_name)}</h3>
    <p class="pp-card-meta">${placeMeta(place)}${price ? ` · ${price}` : ""}</p>
    ${rich.editorial_summary ? `<p class="pp-detail-summary">${escapeHtml(rich.editorial_summary)}</p>` : ""}
    ${facts ? `<div class="pp-detail-facts">${facts}</div>` : ""}
    ${hours.length ? accordion("Hours", hours.map((h) => `<p>${escapeHtml(h)}</p>`).join("")) : ""}
    ${reviews.length ? accordion(`Reviews (${reviews.length})`, reviews.map((r) => `<p class="pp-detail-review">${icon("star", { size: 13 })} ${r.rating}: "${escapeHtml(r.text ?? "")}"</p>`).join("")) : ""}`;

  const links = place.lat != null && place.lng != null ? placeViewUrl(place) : null;
  qs("detail-footer").innerHTML = `
    <button id="detail-save" class="pp-btn pp-btn-primary${isSaved ? " is-saved" : ""}" type="button" data-place-id="${escapeHtml(place.place_id)}" aria-pressed="${isSaved}">${saveButtonHtml(isSaved)}</button>
    ${links ? `<div class="pp-detail-nav-row">${navButtons(links)}</div>` : ""}`;
  qs("detail-save").addEventListener("click", () => toggleSavePlace(place));
}

export function initDetailView() {
  qs("detail-close").innerHTML = icon("x", { size: 18 });
  qs("detail-close").addEventListener("click", () => closeSheet("detail-sheet"));
  bindSheetDismiss("detail-sheet", () => closeSheet("detail-sheet"));
}
