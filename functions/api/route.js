// GET /api/route?points=lat1,lng1|lat2,lng2|...&mode=walking
//
// Road-aligned route geometry for the Plan screen's map (PRD Section 4.5,
// Step 2: Directions is called "only at low-frequency, high-value
// moments... rendering the actual polyline shape... for the final 'here's
// your day' view" — this is exactly that, called once per plan render,
// never per-drag). Stop order is taken as given (no waypoint
// optimization) since the user's chosen order is the point.
//
// Cached the same way search results are (Section 4.3): the signature is
// the exact ordered points + mode, so reopening a trip's plan — or two
// different users planning near-identical routes — reuses the same
// result instead of re-billing Google. Road geometry between two fixed
// points essentially never changes, so this gets a long TTL.
import { json } from "../_lib/http.js";
import { supabaseFetch } from "../_lib/supabase.js";
import { checkRateLimit, rateLimitedResponse } from "../_lib/rateLimit.js";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function onRequestGet(context) {
  const { request, env } = context;

  const { limited } = await checkRateLimit(env, request, "route", 30);
  if (limited) return rateLimitedResponse();

  const url = new URL(request.url);
  const pointsParam = url.searchParams.get("points") || "";
  const mode = url.searchParams.get("mode") || "walking";

  const points = pointsParam
    .split("|")
    .filter(Boolean)
    .map((p) => {
      const [lat, lng] = p.split(",").map(Number);
      return { lat, lng };
    });

  if (points.length < 2) return json({ error: "at least 2 points required" }, 400);

  const signature = `${pointsParam}|${mode}`;

  const cachedPath = await getCachedRoute(env, signature);
  if (cachedPath) return json({ path: cachedPath, source: "cache" });

  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1);

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key: env.GOOGLE_MAPS_SERVER_KEY,
  });
  if (waypoints.length) {
    params.set("waypoints", waypoints.map((w) => `${w.lat},${w.lng}`).join("|"));
  }

  const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
  const data = await res.json();

  if (data.status !== "OK" || !data.routes?.[0]) {
    return json({ path: null, status: data.status || "UNKNOWN" });
  }

  const path = decodePolyline(data.routes[0].overview_polyline.points);
  await upsertRouteCache(env, signature, path);
  return json({ path, source: "google" });
}

async function getCachedRoute(env, signature) {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const res = await supabaseFetch(
    env,
    `route_cache?signature=eq.${encodeURIComponent(signature)}&created_at=gte.${cutoff}&select=path`
  );
  const rows = await res.json();
  return rows[0]?.path ?? null;
}

async function upsertRouteCache(env, signature, path) {
  await supabaseFetch(env, "route_cache", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ signature, path, created_at: new Date().toISOString() }]),
  });
}

// Google's standard polyline encoding algorithm — see
// developers.google.com/maps/documentation/utilities/polylinealgorithm.
// Decoded server-side so the client never needs the extra Maps JS
// `geometry` library just to unpack one field.
function decodePolyline(encoded) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const points = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}
