// Small pieces of place UI shared across Discovery, the plan list, the
// detail sheet and Walkie's suggestions.

import { escapeHtml } from "../core/dom.js";
import { moodFor } from "../core/state.js";
import { photoUrl } from "../data/places.js";
import { icon } from "./icons.js";

/** @typedef {import("../types.js").Place} Place */

/**
 * One line of metadata: the rating when there is one, otherwise the
 * neighbourhood and category (demo places have no ratings by design).
 * @param {Place} place
 * @param {number} [iconSize]
 */
export function placeMeta(place, iconSize = 14) {
  if (place.rating) {
    return `${icon("star", { size: iconSize })} ${place.rating} (${place.user_rating_count || 0})`;
  }
  const mood = moodFor(place.primary_type);
  return [place.area, mood?.label].filter(Boolean).map(escapeHtml).join(" · ") || "No rating yet";
}

/**
 * The place's photo, or a soft illustrated tile in its mood's colour when
 * there's no photo, so a photo-less card still looks intentional.
 * @param {Place} place
 * @param {number} width
 * @param {string} className
 */
export function placeVisual(place, width, className) {
  const src = photoUrl(place.photo_ref, width);
  if (src) return `<img class="${className}" src="${src}" alt="" loading="lazy" />`;
  const mood = moodFor(place.primary_type);
  return `<span class="${className} pp-art pp-art--${mood?.type ?? "default"}">${icon(mood?.icon ?? "map-pin", { size: Math.max(18, Math.round(width / 6)) })}</span>`;
}

/** @param {boolean} isSaved */
export function saveButtonHtml(isSaved) {
  return isSaved ? `${icon("check", { size: 15 })}<span>Saved</span>` : `${icon("bookmark", { size: 15 })}<span>Save</span>`;
}
