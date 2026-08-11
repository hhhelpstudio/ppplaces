// GET /api/places/:id -> basic + rich metadata. Rich fields (Enterprise tier)
// are only ever fetched here, on an explicit open of one place's detail view
// (Section 4.2) — never speculatively for a list of cards.
import { json } from "../../_lib/http.js";
import { supabaseFetch } from "../../_lib/supabase.js";

const RICH_FIELD_MASK =
  "id,displayName,formattedAddress,regularOpeningHours,editorialSummary,photos,reviews,websiteUri,nationalPhoneNumber,priceLevel";
const RICH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function onRequestGet(context) {
  const { env, params } = context;
  const placeId = params.id;

  const cached = await getCachedPlace(env, placeId);
  if (cached?.rich_metadata && isFresh(cached.last_rich_fetch_at)) {
    return json({ ...cached, source: "cache" });
  }

  const rich = await fetchGoogleDetails(env, placeId);
  await upsertRich(env, placeId, rich);
  return json({ ...cached, ...rich, source: "google" });
}

function isFresh(timestamp) {
  return Boolean(timestamp) && Date.now() - new Date(timestamp).getTime() < RICH_TTL_MS;
}

async function getCachedPlace(env, placeId) {
  const res = await supabaseFetch(env, `places_cache?place_id=eq.${encodeURIComponent(placeId)}`);
  const rows = await res.json();
  return rows[0] || null;
}

async function fetchGoogleDetails(env, placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": env.GOOGLE_MAPS_SERVER_KEY,
      "X-Goog-FieldMask": RICH_FIELD_MASK,
    },
  });
  const data = await res.json();
  return {
    rich_metadata: {
      formatted_address: data.formattedAddress ?? null,
      opening_hours: data.regularOpeningHours ?? null,
      editorial_summary: data.editorialSummary?.text ?? null,
      photos: (data.photos || []).slice(0, 8).map((p) => p.name),
      reviews: (data.reviews || []).slice(0, 5).map((r) => ({ text: r.text?.text, rating: r.rating })),
      website: data.websiteUri ?? null,
      phone: data.nationalPhoneNumber ?? null,
      price_level: data.priceLevel ?? null,
    },
    last_rich_fetch_at: new Date().toISOString(),
  };
}

async function upsertRich(env, placeId, rich) {
  await supabaseFetch(env, "places_cache", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ place_id: placeId, ...rich }]),
  });
}
