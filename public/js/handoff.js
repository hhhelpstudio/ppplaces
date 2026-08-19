// Navigation Handoff (PRD Section 3.4 / USER_FLOW.md Step 7) — deep links
// only, no in-app turn-by-turn.
//
// Two distinct kinds of link, not one:
// - placeViewUrl: opens the place itself (name, photos, reviews, menu) —
//   no route starts. This is what the detail modal's Google/Apple Maps
//   buttons use. If the user wants to navigate from there, Google/Apple's
//   own place page has its own "Directions" button — we don't need to
//   duplicate that ourselves.
// - dayHandoffUrl: the whole-day multi-stop *route*, used only by the
//   explicit "Let's go" action, which is the one place a route on open is
//   actually what the user asked for.
// Both use place_id where possible instead of bare lat/lng — a bare
// coordinate resolves to a generic "Dropped pin," not the named business.

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function preferredMapsApp() {
  return isIOS() ? "apple" : "google";
}

export function googleMapsUrl({ destinationLat, destinationLng, destinationPlaceId, waypoints = [], originLat, originLng, originPlaceId, mode = "walking" }) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destinationLat},${destinationLng}`,
    travelmode: mode,
  });
  // origin_place_id / destination_place_id are documented params of this
  // consumer URL scheme. A per-waypoint place_id is not — that syntax
  // (`place_id:...`) belongs to the separate server-side Directions REST
  // API and isn't parsed by this one; passing it here produced wrong/
  // broken pins for the middle stops. Waypoints stay plain lat,lng.
  if (destinationPlaceId) params.set("destination_place_id", destinationPlaceId);
  if (originLat != null && originLng != null) {
    params.set("origin", `${originLat},${originLng}`);
    if (originPlaceId) params.set("origin_place_id", originPlaceId);
  }
  if (waypoints.length) {
    params.set("waypoints", waypoints.map((w) => `${w.lat},${w.lng}`).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Place-info view (no route): Google's Search URL API resolves query_place_id
// to the canonical listing instead of a dropped pin at raw coordinates.
export function placeViewUrl(place) {
  const name = encodeURIComponent(place.display_name || "");
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${name}&query_place_id=${encodeURIComponent(place.place_id)}`,
    // Apple has no place_id equivalent reachable via URL scheme, but a
    // named search query anchored to the coordinate resolves far more
    // reliably than a bare coordinate would on its own.
    apple: `https://maps.apple.com/?q=${name}&ll=${place.lat},${place.lng}`,
  };
}

// Whole-day handoff: one multi-stop Google Maps *route* URL, in the
// current order. Apple Maps has no equivalent multi-waypoint deep-link
// format, so this action is Google-only. Requires at least 2 stops.
//
// No origin is set here — that used to be the first stop, which meant
// the route silently skipped navigating TO that stop at all (it became
// the starting point instead of a destination). Omitting origin entirely
// makes Google Maps use the user's actual current location, which is
// what "start my journey" / "Let's go" means.
export function dayHandoffUrl(stops) {
  if (stops.length < 2) return null;
  const rest = stops.slice(0, -1);
  const last = stops[stops.length - 1];
  return googleMapsUrl({
    destinationLat: last.lat,
    destinationLng: last.lng,
    destinationPlaceId: last.place_id,
    waypoints: rest.map((s) => ({ lat: s.lat, lng: s.lng })),
  });
}
