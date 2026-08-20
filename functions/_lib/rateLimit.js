// Per-IP, per-endpoint rate limiting (PRD Section 4.6: "server-side,
// independent of Google's own quota, to prevent a single runaway client
// or scraper from generating unbounded billed calls"). Backed by
// Cloudflare KV — a fixed 60-second window is "good enough to stop
// abuse," not a precise counter (KV writes aren't strongly consistent).
//
// Fails OPEN if the KV binding isn't configured, rather than taking the
// whole API down over a missing binding. Pages needs that binding wired
// up from the dashboard as well as wrangler.toml — see the note there.
import { json } from "./http.js";

const WINDOW_SECONDS = 60;

export async function checkRateLimit(env, request, endpoint, limit) {
  if (!env.RATE_LIMIT) return { limited: false };

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const key = `rl:${endpoint}:${ip}:${bucket}`;

  const current = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
  if (current >= limit) return { limited: true };

  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: WINDOW_SECONDS * 2 });
  return { limited: false };
}

export function rateLimitedResponse() {
  return json(
    { error: "Too many requests — slow down a little and try again in a moment." },
    429
  );
}
