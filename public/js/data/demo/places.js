// Demo implementation of the places API (search / detail / geocode / route),
// answering from local fixtures instead of the Google-backed proxy.

import { haversineMeters } from "../../lib/optimizer.js";
import { DEMO_CITIES, DEMO_DEFAULT_CITY } from "./fixtures.js";

/** @typedef {import("../../types.js").Place} Place */
/** @typedef {import("../../types.js").PlaceDetail} PlaceDetail */
/** @typedef {import("../../types.js").GeocodeResult} GeocodeResult */
/** @typedef {import("../../types.js").LatLng} LatLng */
/** @typedef {import("./fixtures.js").DemoPlace} DemoPlace */
/** @typedef {import("./fixtures.js").DemoCity} DemoCity */

/** Wide enough to cover a whole demo city (and the drive out to Tegallalang). */
const DEMO_RADIUS_M = 20000;

const placeId = (/** @type {DemoCity} */ city, /** @type {DemoPlace} */ p) => `demo:${city.id}:${p.id}`;

/**
 * @param {DemoCity} city
 * @param {DemoPlace} p
 * @returns {Place}
 */
function toPlace(city, p) {
  return {
    place_id: placeId(city, p),
    display_name: p.name,
    rating: null,
    user_rating_count: null,
    primary_type: p.type,
    photo_ref: null,
    lat: p.lat,
    lng: p.lng,
    area: p.area,
  };
}

const allPlaces = () => DEMO_CITIES.flatMap((city) => city.places.map((p) => ({ city, p })));

/** @param {string} id */
function findById(id) {
  return allPlaces().find(({ city, p }) => placeId(city, p) === id);
}

/** @param {LatLng} point */
export function nearestCity(point) {
  return DEMO_CITIES.reduce((best, city) => (haversineMeters(point, city) < haversineMeters(point, best) ? city : best));
}

export const demoCityNames = () => DEMO_CITIES.map((c) => c.name);

/**
 * @param {{ q?: string, type?: string, lat: number, lng: number }} params
 * @returns {Place[]}
 */
export function searchDemoPlaces({ q = "", type = "", lat, lng }) {
  const needle = q.trim().toLowerCase();
  const center = { lat, lng };
  return allPlaces()
    .filter(({ p }) => !type || p.type === type)
    .filter(({ p }) => !needle || `${p.name} ${p.area} ${p.summary}`.toLowerCase().includes(needle))
    .map(({ city, p }) => ({ place: toPlace(city, p), meters: haversineMeters(center, p) }))
    .filter(({ meters }) => meters <= DEMO_RADIUS_M)
    .sort((a, b) => a.meters - b.meters)
    .map(({ place }) => place);
}

/**
 * @param {string} id
 * @returns {PlaceDetail}
 */
export function demoPlaceDetail(id) {
  const hit = findById(id);
  if (!hit) return { rich_metadata: null };
  return {
    rich_metadata: {
      formatted_address: `${hit.p.area}, ${hit.city.name}, ${hit.city.country}`,
      editorial_summary: hit.p.summary,
    },
  };
}

/**
 * Matches a typed city name against the demo cities.
 * @param {string} query
 * @returns {GeocodeResult | null}
 */
export function geocodeDemo(query) {
  const q = query.trim().toLowerCase();
  const city = DEMO_CITIES.find((c) => c.aliases.some((a) => q === a || q.startsWith(`${a},`) || q.includes(a)));
  if (!city) return null;
  return { name: city.name, lat: city.lat, lng: city.lng, formatted_address: `${city.name}, ${city.country}` };
}

export const defaultDemoCity = () => DEMO_CITIES.find((c) => c.id === DEMO_DEFAULT_CITY) ?? DEMO_CITIES[0];
