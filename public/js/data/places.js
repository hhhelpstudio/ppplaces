// Places API facade. Real mode calls the Cloudflare Pages Functions proxy
// (which holds the secret Google key, PRD Section 4); demo mode answers from
// local fixtures. Views only ever import from here, never from either side.

import { isDemo } from "../core/env.js";
import { demoPlaceDetail, geocodeDemo, searchDemoPlaces } from "./demo/places.js";

/** @typedef {import("../types.js").Place} Place */
/** @typedef {import("../types.js").PlaceDetail} PlaceDetail */
/** @typedef {import("../types.js").GeocodeResult} GeocodeResult */
/** @typedef {import("../types.js").LatLng} LatLng */

/** Thrown for recoverable API failures so views can show Walkie's message. */
export class PlacesError extends Error {}

/**
 * @template T
 * @param {string} url
 * @returns {Promise<T>}
 */
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new PlacesError(`${res.status} for ${url}`);
  return /** @type {Promise<T>} */ (res.json());
}

/**
 * @param {{ q?: string, type?: string, lat: number, lng: number, radius?: number }} params
 * @returns {Promise<Place[]>}
 */
export async function searchPlaces({ q = "", type = "", lat, lng, radius = 1500 }) {
  if (isDemo()) return searchDemoPlaces({ q, type, lat, lng });
  const query = new URLSearchParams({ q, type, lat: String(lat), lng: String(lng), radius: String(radius) });
  const data = /** @type {{ places?: Place[] }} */ (await getJson(`/api/places/search?${query}`));
  return data.places ?? [];
}

/**
 * @param {string} placeId
 * @returns {Promise<PlaceDetail>}
 */
export async function getPlaceDetail(placeId) {
  if (isDemo()) return demoPlaceDetail(placeId);
  return getJson(`/api/places/${encodeURIComponent(placeId)}`);
}

/**
 * @param {string} query
 * @returns {Promise<GeocodeResult | null>}
 */
export async function geocode(query) {
  if (isDemo()) return geocodeDemo(query);
  try {
    return await getJson(`/api/geocode?q=${encodeURIComponent(query)}`);
  } catch {
    return null;
  }
}

/**
 * Road-aligned walking geometry (PRD Section 4.5: fetched once per plan
 * render, not per drag frame). Null means "draw straight lines", which is
 * also the demo behaviour, so a Directions hiccup never breaks the map.
 * @param {LatLng[]} points
 * @returns {Promise<LatLng[] | null>}
 */
export async function routePath(points) {
  if (isDemo() || points.length < 2) return null;
  const encoded = points.map((p) => `${p.lat},${p.lng}`).join("|");
  try {
    const data = /** @type {{ path?: LatLng[] | null }} */ (await getJson(`/api/route?points=${encodeURIComponent(encoded)}&mode=walking`));
    return data.path ?? null;
  } catch {
    return null;
  }
}

/**
 * Proxied photo URL, or null when there's no photo (always, in demo mode).
 * @param {string | null | undefined} ref
 * @param {number} maxWidth
 */
export function photoUrl(ref, maxWidth) {
  if (!ref || isDemo()) return null;
  return `/api/places/photo?ref=${encodeURIComponent(ref)}&maxWidth=${maxWidth}`;
}
