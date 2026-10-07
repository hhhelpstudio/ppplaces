// Trip storage facade: picks Supabase (real mode) or localStorage (demo
// mode) once at boot. Views call `trips.listTrips()` etc. without knowing which.

import { isDemo } from "../core/env.js";
import { createDemoBackend } from "./demo/trips.js";

/** @typedef {import("../types.js").TripsBackend} TripsBackend */

/** @type {TripsBackend | null} */
let backend = null;

export async function initTrips() {
  if (isDemo()) {
    backend = createDemoBackend();
  } else {
    const { createSupabaseBackend } = await import("./supabase-trips.js");
    backend = await createSupabaseBackend();
  }
  await backend.ensureSession();
}

/** @type {TripsBackend} */
export const trips = new Proxy(/** @type {TripsBackend} */ ({}), {
  get(_target, prop) {
    if (!backend) throw new Error("trips used before initTrips()");
    return backend[/** @type {keyof TripsBackend} */ (prop)];
  },
});
