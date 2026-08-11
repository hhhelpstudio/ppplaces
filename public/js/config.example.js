// Copy this file to config.js (gitignored) and fill in your real values.
// Both keys here are safe to ship to the browser BY DESIGN:
// - SUPABASE_ANON_KEY only works within whatever Row Level Security policies
//   you defined in supabase/schema.sql — it can't read/write other users' data.
// - MAPS_BROWSER_KEY should be restricted to your domain via HTTP referrer
//   restrictions in the Google Cloud console, so it's useless if copied.
// The secret, unrestricted Google Maps key never goes here — it lives only
// in the Cloudflare Pages Function environment variables (see .dev.vars.example).
window.CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",
  MAPS_BROWSER_KEY: "YOUR-HTTP-REFERRER-RESTRICTED-MAPS-KEY",
};
