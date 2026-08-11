// GET /api/places/search?q=coffee&type=cafe&lat=35.0116&lng=135.7681&radius=1500
//
// Field-masked, cached proxy to Google Places API (New) Text/Nearby Search —
// implements the Basic-tier-only rule and the search-query cache from
// Section 4 of the PRD. Verify field/endpoint names against Google's current
// Places API (New) docs when wiring up real keys — this was written without
// live access to the docs this session.
import { json } from "../../_lib/http.js";
import { supabaseFetch } from "../../_lib/supabase.js";

const BASIC_FIELD_MASK =
  "places.id,places.displayName,places.rating,places.userRatingCount,places.primaryType,places.photos,places.location";
const CACHE_TTL_MS = 20 * 60 * 1000;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = url.searchParams.get("type") || "";
  const lat = parseFloat(url.searchParams.get("lat"));
  const lng = parseFloat(url.searchParams.get("lng"));
  const radius = parseFloat(url.searchParams.get("radius")) || 1500;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return json({ error: "lat and lng are required" }, 400);
  }

  const signature = buildSignature(q, type, lat, lng, radius);

  const cachedIds = await getCachedSearch(env, signature);
  if (cachedIds) {
    return json({ places: await getCachedPlaces(env, cachedIds), source: "cache" });
  }

  const places = await searchGoogle(env, q, type, lat, lng, radius);
  await upsertPlacesCache(env, places);
  await upsertSearchCache(env, signature, places.map((p) => p.place_id));

  return json({ places, source: "google" });
}

function buildSignature(q, type, lat, lng, radius) {
  const roundedLat = Math.round(lat * 200) / 200; // ~500m grid
  const roundedLng = Math.round(lng * 200) / 200;
  const radiusBucket = Math.round(radius / 250) * 250;
  return `${q.toLowerCase()}|${type}|${roundedLat}|${roundedLng}|${radiusBucket}`;
}

async function getCachedSearch(env, signature) {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const res = await supabaseFetch(
    env,
    `search_cache?signature=eq.${encodeURIComponent(signature)}&created_at=gte.${cutoff}&select=place_ids`
  );
  const rows = await res.json();
  return rows[0]?.place_ids ?? null;
}

async function getCachedPlaces(env, placeIds) {
  if (!placeIds.length) return [];
  const idList = placeIds.map((id) => `"${id}"`).join(",");
  const res = await supabaseFetch(env, `places_cache?place_id=in.(${idList})`);
  return res.json();
}

async function searchGoogle(env, q, type, lat, lng, radius) {
  const useText = Boolean(q);
  const endpoint = useText
    ? "https://places.googleapis.com/v1/places:searchText"
    : "https://places.googleapis.com/v1/places:searchNearby";

  const body = useText
    ? {
        textQuery: q,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
        ...(type ? { includedType: type } : {}),
      }
    : {
        includedTypes: [type || "tourist_attraction"],
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
      };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_MAPS_SERVER_KEY,
      "X-Goog-FieldMask": BASIC_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return (data.places || []).map(mapGooglePlace);
}

function mapGooglePlace(p) {
  return {
    place_id: p.id,
    display_name: p.displayName?.text || "",
    rating: p.rating ?? null,
    user_rating_count: p.userRatingCount ?? null,
    primary_type: p.primaryType ?? null,
    photo_ref: p.photos?.[0]?.name ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    last_basic_fetch_at: new Date().toISOString(),
  };
}

async function upsertPlacesCache(env, places) {
  if (!places.length) return;
  await supabaseFetch(env, "places_cache", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(places),
  });
}

async function upsertSearchCache(env, signature, placeIds) {
  await supabaseFetch(env, "search_cache", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ signature, place_ids: placeIds, created_at: new Date().toISOString() }]),
  });
}
