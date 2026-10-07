// Google Maps implementation of the map adapter (real mode).
// The Maps JS SDK is loaded once (billed per load, not per data op, PRD
// Section 4.4) and hands out independent map instances: Discovery's browse
// map and the Plan screen's route map are two separate `Map` objects, not one
// map moved around.

import { config } from "../core/env.js";
import { PIN_COLOR, PIN_TEXT, ROUTE_COLOR } from "./adapter.js";

/** @typedef {import("./adapter.js").MapAdapter} MapAdapter */
/** @typedef {import("../types.js").LatLng} LatLng */

/** @type {Promise<void> | null} */
let scriptPromise = null;

function ensureScriptLoaded() {
  scriptPromise ??= new Promise((resolve) => {
    /** @type {any} */ (window).__ppMapsReady = resolve;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config().MAPS_BROWSER_KEY}&loading=async&callback=__ppMapsReady`;
    script.async = true;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// A full circle with a centred label. Google's default teardrop only gives
// the label a small round cap to sit in, which was clipping the digit.
// Without an explicit anchor, Marker anchors an icon at its bottom-centre
// (right for a teardrop, wrong for a circle), shifting it up-left of its
// real coordinate.
function numberedIcon(/** @type {boolean} */ visited) {
  const fill = visited ? "#F4C95D" : PIN_COLOR;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="${fill}" stroke="#FFFFFF" stroke-width="2.5"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(34, 34),
    anchor: new google.maps.Point(17, 17),
    labelOrigin: new google.maps.Point(17, 17),
  };
}

/**
 * @param {HTMLElement} element
 * @param {LatLng} center
 * @returns {Promise<MapAdapter>}
 */
export async function createMap(element, center) {
  await ensureScriptLoaded();
  const map = new google.maps.Map(element, {
    center,
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true,
    // "cooperative" requires two fingers to pan so a swipe can scroll past
    // the map, but these maps are a fixed part of the layout, not something
    // you scroll "through", so trade that for one-finger panning.
    gestureHandling: "greedy",
  });

  /** @type {google.maps.Marker[]} */
  let placeMarkers = [];
  /** @type {google.maps.Marker[]} */
  let routeMarkers = [];
  /** @type {google.maps.Polyline | null} */
  let polyline = null;
  /** @type {google.maps.Marker | null} */
  let userMarker = null;
  let fitting = false;

  return {
    getCenter() {
      const c = map.getCenter();
      return c ? { lat: c.lat(), lng: c.lng() } : center;
    },
    setCenter(next, zoom) {
      map.setCenter(next);
      if (zoom) map.setZoom(zoom);
    },
    onIdle(cb) {
      map.addListener("idle", () => fitting || cb());
    },
    fitTo(points) {
      if (points.length < 2) return Promise.resolve();
      fitting = true;
      const bounds = new google.maps.LatLngBounds();
      for (const p of points) bounds.extend(p);
      // Registered after onIdle's listener, so that one still sees fitting=true.
      return new Promise((resolve) => {
        google.maps.event.addListenerOnce(map, "idle", () => {
          fitting = false;
          resolve();
        });
        map.fitBounds(bounds, 40);
      });
    },
    setPlaceMarkers(markers, onClick) {
      placeMarkers.forEach((m) => m.setMap(null));
      placeMarkers = markers.map((m) => {
        const marker = new google.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map, title: m.title });
        if (onClick) marker.addListener("click", () => onClick(m.id));
        return marker;
      });
    },
    setRoute(stops, path) {
      routeMarkers.forEach((m) => m.setMap(null));
      polyline?.setMap(null);
      routeMarkers = stops.map(
        (s) =>
          new google.maps.Marker({
            position: { lat: s.lat, lng: s.lng },
            map,
            icon: numberedIcon(Boolean(s.visited)),
            label: { text: s.label, color: PIN_TEXT, fontWeight: "700", fontSize: "13px" },
            title: s.title,
          }),
      );
      polyline = new google.maps.Polyline({
        path: path ?? stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        geodesic: true,
        strokeColor: ROUTE_COLOR,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
      if (stops.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        stops.forEach((s) => bounds.extend(s));
        map.fitBounds(bounds, 48);
      } else if (stops.length === 1) {
        map.setCenter(stops[0]);
        map.setZoom(15);
      }
    },
    setUserPosition(position) {
      userMarker?.setMap(null);
      userMarker = position
        ? new google.maps.Marker({
            position,
            map,
            title: "You are here",
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#3E6FA0", fillOpacity: 1, strokeColor: "#FFFFFF", strokeWeight: 3 },
          })
        : null;
    },
    resize() {
      /* Google Maps tracks its container size on its own. */
    },
  };
}
