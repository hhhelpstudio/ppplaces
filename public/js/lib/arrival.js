// Arrival check-in (USER_FLOW.md Step 8): pure logic, no DOM, so it's unit
// testable. GPS proximity alone never awards anything: this only decides
// whether to *offer* the stamp; a human tap collects it.

import { haversineMeters } from "./optimizer.js";

/** @typedef {import("../types.js").LatLng} LatLng */

/** "You're near X" fires within this distance of a stop. */
export const ARRIVAL_RADIUS_M = 120;

/**
 * The closest not-yet-visited stop within range, or null.
 * @template {{ lat: number | null, lng: number | null, visited_at?: string | null }} T
 * @param {LatLng} position
 * @param {T[]} stops
 * @param {number} [radius]
 * @returns {{ stop: T, meters: number } | null}
 */
export function nearbyUnvisitedStop(position, stops, radius = ARRIVAL_RADIUS_M) {
  /** @type {{ stop: T, meters: number } | null} */
  let best = null;
  for (const stop of stops) {
    if (stop.visited_at || stop.lat == null || stop.lng == null) continue;
    const meters = haversineMeters(position, { lat: stop.lat, lng: stop.lng });
    if (meters <= radius && (!best || meters < best.meters)) best = { stop, meters };
  }
  return best;
}

/**
 * Arrival only applies to dated (Planning) trips: a stamp for a place you
 * haven't committed to visiting wouldn't mean anything.
 * @param {{ mode: string } | null} trip
 */
export const arrivalEnabled = (trip) => trip?.mode === "planning";
