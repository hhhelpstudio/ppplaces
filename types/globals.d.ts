// Ambient types for things the browser provides at runtime but tsc can't see.

interface Window {
  /** Set by the gitignored public/js/config.js; absent in demo mode. */
  CONFIG?: import("../public/js/core/env.js").AppConfig;
}

// supabase-js is imported from esm.sh at runtime (no build step). Only the
// handful of calls the app makes are typed, loosely.
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: unknown): any;
}
