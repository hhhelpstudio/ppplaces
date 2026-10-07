// One small map interface, two implementations: Google Maps (real mode,
// needs a key) and Leaflet + OpenStreetMap tiles (demo mode, keyless).
// Views only ever talk to this interface.

import { isDemo } from "../core/env.js";

/** @typedef {import("../types.js").LatLng} LatLng */

/**
 * @typedef {object} PlaceMarker
 * @property {string} id
 * @property {number} lat
 * @property {number} lng
 * @property {string} title
 */

/**
 * @typedef {object} RouteStop
 * @property {number} lat
 * @property {number} lng
 * @property {string} title
 * @property {string} label     Shown inside the numbered pin.
 * @property {boolean} [visited]
 */

/**
 * @typedef {object} MapAdapter
 * @property {() => LatLng} getCenter
 * @property {(center: LatLng, zoom?: number) => void} setCenter
 * @property {(cb: () => void) => void} onIdle             Fires after the user pans or zooms.
 * @property {(markers: PlaceMarker[], onClick?: (id: string) => void) => void} setPlaceMarkers
 * @property {(points: LatLng[]) => Promise<void>} fitTo   Frames the points without firing onIdle.
 * @property {(stops: RouteStop[], path: LatLng[] | null) => void} setRoute   Numbered pins + line, fitted to view.
 * @property {(position: LatLng | null) => void} setUserPosition
 * @property {() => void} resize
 */

/** Same coral as --brand-primary. Map libraries can't read CSS variables. */
export const PIN_COLOR = "#FF8A5B";
export const ROUTE_COLOR = "#5E9C86";
export const PIN_TEXT = "#2B211B";

/**
 * @param {HTMLElement} element
 * @param {LatLng} center
 * @returns {Promise<MapAdapter>}
 */
export async function createMap(element, center) {
  const impl = isDemo() ? await import("./leaflet.js") : await import("./google.js");
  return impl.createMap(element, center);
}
