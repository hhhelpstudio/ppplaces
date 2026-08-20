// GET /api/places/photo?ref=places/{id}/photos/{photo}&maxWidth=400
//
// Proxies Google's Places Photo media endpoint so the secret server key
// never has to be exposed client-side just to load an <img src>. Google's
// endpoint 302-redirects to the actual CDN image by default — fetch()
// follows that automatically, so this just re-streams the bytes through
// with a long Cache-Control (photo references are effectively immutable,
// per PRD Section 4.3's "cache the reference, avoid repeated photo-media
// billing" guidance).
import { checkRateLimit, rateLimitedResponse } from "../../_lib/rateLimit.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  // Higher limit than the other endpoints — a single search-results page
  // naturally fires one photo request per card as thumbnails load, all at
  // once, so this isn't really a "user action rate" the way search/detail
  // calls are.
  const { limited } = await checkRateLimit(env, request, "photo", 180);
  if (limited) return rateLimitedResponse();

  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  const maxWidth = url.searchParams.get("maxWidth") || "400";

  if (!ref) return new Response("ref is required", { status: 400 });

  const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${encodeURIComponent(maxWidth)}&key=${env.GOOGLE_MAPS_SERVER_KEY}`;
  const res = await fetch(googleUrl);

  if (!res.ok) return new Response("photo not found", { status: 404 });

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=2592000",
    },
  });
}
