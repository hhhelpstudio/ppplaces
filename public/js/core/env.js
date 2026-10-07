/**
 * @typedef {object} AppConfig
 * @property {string} [SUPABASE_URL]
 * @property {string} [SUPABASE_ANON_KEY]
 * @property {string} [MAPS_BROWSER_KEY]
 * @property {boolean} [DEMO]
 */

/** @returns {AppConfig} */
export function config() {
  return window.CONFIG ?? {};
}

/**
 * Demo mode runs entirely in the browser: sample places, trips saved to
 * localStorage, and a keyless map. It switches on automatically when no API
 * keys are configured (e.g. the public demo deploy, where config.js doesn't
 * exist), or explicitly with `?demo` in the URL.
 */
export function isDemo() {
  if (new URLSearchParams(location.search).has("demo")) return true;
  const c = config();
  return Boolean(c.DEMO) || !c.SUPABASE_URL || !c.SUPABASE_ANON_KEY || !c.MAPS_BROWSER_KEY;
}
