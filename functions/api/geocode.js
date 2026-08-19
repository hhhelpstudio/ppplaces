// GET /api/geocode?q=Kyoto
//
// Resolves a free-typed place name (city, region, landmark) to a center
// point, for the "Dreaming about somewhere" trip-start path (USER_FLOW.md
// Step 1). Uses Places API (New) Text Search, Basic-tier field mask only —
// this is a one-shot lookup at trip creation, not a high-volume surface, so
// it doesn't get a cache table of its own.
import { json } from "../_lib/http.js";

const FIELD_MASK = "places.id,places.displayName,places.location,places.formattedAddress";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (!q) return json({ error: "q is required" }, 400);

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_MAPS_SERVER_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: q }),
  });
  const data = await res.json();
  const place = (data.places || [])[0];

  if (!place) return json({ error: "No place found" }, 404);

  return json({
    place_id: place.id,
    name: place.displayName?.text || q,
    formatted_address: place.formattedAddress || "",
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  });
}
