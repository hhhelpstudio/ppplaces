// Leaflet implementation of the map adapter (demo mode). Keyless: standard
// OpenStreetMap tiles, tinted to the theme in CSS (.pp-tiles). Leaflet itself is vendored in
// /vendor and loaded only when a demo map is first needed.

import { ROUTE_COLOR } from "./adapter.js";

/** @typedef {import("./adapter.js").MapAdapter} MapAdapter */
/** @typedef {import("../types.js").LatLng} LatLng */

/** @type {Promise<void> | null} */
let loadPromise = null;

function ensureLeaflet() {
  loadPromise ??= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/leaflet/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "/vendor/leaflet/leaflet.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });
  return loadPromise;
}

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// CARTO's basemaps now require an API key, so this uses OSM's own tiles
// (fine for demo-level traffic under the OSM tile usage policy). Dark mode is
// a CSS filter on the tile pane rather than a second tile set, so switching
// themes costs no extra requests.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** @param {string} label @param {boolean} visited */
const numberedIcon = (label, visited) =>
  L.divIcon({
    className: "",
    html: `<span class="pp-pin${visited ? " is-visited" : ""}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const dotIcon = () => L.divIcon({ className: "", html: '<span class="pp-pin-dot"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });

const userIcon = () => L.divIcon({ className: "", html: '<span class="pp-pin-user"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });

/**
 * @param {HTMLElement} element
 * @param {LatLng} center
 * @returns {Promise<MapAdapter>}
 */
export async function createMap(element, center) {
  await ensureLeaflet();
  const map = L.map(element, { zoomControl: true, attributionControl: true }).setView([center.lat, center.lng], 14);
  L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19, className: "pp-tiles" }).addTo(map);

  // Leaflet measures its container once; keep it right when layout changes
  // (sheet open, desktop two-pane resize, view switch).
  // A route fitted while the container was hidden or zero-sized lands at max
  // zoom on an empty patch of map, so re-fit it once the size is real.
  /** @type {L.LatLngBounds | null} */
  let routeBounds = null;
  const fitRoute = () => {
    if (routeBounds && element.clientHeight > 0) map.fitBounds(routeBounds, { padding: [48, 48], maxZoom: 16 });
  };
  new ResizeObserver(() => {
    map.invalidateSize();
    fitRoute();
  }).observe(element);

  const placeLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);
  /** @type {L.Marker | null} */
  let userMarker = null;
  let fitting = false;

  return {
    getCenter() {
      const c = map.getCenter();
      return { lat: c.lat, lng: c.lng };
    },
    setCenter(next, zoom) {
      map.setView([next.lat, next.lng], zoom ?? map.getZoom());
    },
    onIdle(cb) {
      map.on("moveend", () => fitting || cb());
    },
    async fitTo(points) {
      if (points.length < 2 || element.clientHeight === 0) return;
      fitting = true; // without animation, moveend fires synchronously inside fitBounds
      map.fitBounds(L.latLngBounds(points.map((p) => /** @type {[number, number]} */ ([p.lat, p.lng]))), { padding: [40, 40], maxZoom: 16, animate: false });
      fitting = false;
    },
    setPlaceMarkers(markers, onClick) {
      placeLayer.clearLayers();
      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng], { icon: dotIcon(), title: m.title, keyboard: false });
        if (onClick) marker.on("click", () => onClick(m.id));
        marker.addTo(placeLayer);
      }
    },
    setRoute(stops, path) {
      routeLayer.clearLayers();
      routeBounds = null;
      if (!stops.length) return;
      const line = (path ?? stops).map((p) => /** @type {[number, number]} */ ([p.lat, p.lng]));
      L.polyline(line, { color: ROUTE_COLOR, weight: 4, opacity: 0.9, dashArray: path ? undefined : "1 9", lineCap: "round" }).addTo(routeLayer);
      for (const s of stops) {
        L.marker([s.lat, s.lng], { icon: numberedIcon(s.label, Boolean(s.visited)), title: s.title, keyboard: false }).addTo(routeLayer);
      }
      if (stops.length > 1) {
        routeBounds = L.latLngBounds(stops.map((s) => /** @type {[number, number]} */ ([s.lat, s.lng])));
        map.invalidateSize();
        fitRoute();
      } else {
        map.setView([stops[0].lat, stops[0].lng], 15);
      }
    },
    setUserPosition(position) {
      userMarker?.remove();
      userMarker = position ? L.marker([position.lat, position.lng], { icon: userIcon(), title: "You are here", keyboard: false }).addTo(map) : null;
    },
    resize() {
      map.invalidateSize();
    },
  };
}

