// Trip/Day/Stop CRUD against Supabase, straight from the browser via
// supabase-js. This is safe (and deliberately doesn't go through the
// Cloudflare Pages Function proxy) because these tables are protected by the
// RLS policies in supabase/schema.sql: the anon key can only ever touch rows
// owned by the current guest session. Only the Google-key-holding endpoints
// (places search/detail, geocode) go through the proxy.

import { config } from "../core/env.js";

/** @typedef {import("../types.js").TripsBackend} TripsBackend */
/** @typedef {import("../types.js").Stop} Stop */
/** @typedef {import("../types.js").Trip} Trip */
/** @typedef {import("../types.js").Day} Day */

/**
 * Minimal structural type for the bits of supabase-js used here. It's loaded
 * from esm.sh at runtime (no bundler), so there are no installed types.
 * @typedef {{ data: any, error: any }} SbResult
 * @typedef {any} SupabaseClient
 */

/** @returns {Promise<TripsBackend>} */
export async function createSupabaseBackend() {
  // Loaded only in real mode, so the demo never downloads supabase-js.
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const { SUPABASE_URL = "", SUPABASE_ANON_KEY = "" } = config();
  /** @type {SupabaseClient} */
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /** @param {SbResult} result */
  const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
  };

  async function currentUserId() {
    const { user } = unwrap(await supabase.auth.getUser());
    return /** @type {string} */ (user.id);
  }

  /** @param {string} tripId @returns {Promise<Day[]>} */
  async function listDays(tripId) {
    return unwrap(await supabase.from("days").select("id, order_index, trip_date").eq("trip_id", tripId).order("order_index", { ascending: true }));
  }

  /** @param {string} tripId @param {number} orderIndex @returns {Promise<Day>} */
  async function createDay(tripId, orderIndex) {
    const owner_id = await currentUserId();
    return unwrap(await supabase.from("days").insert({ trip_id: tripId, owner_id, order_index: orderIndex }).select().single());
  }

  /** @param {string} dayId @returns {Promise<Stop[]>} */
  async function listStops(dayId) {
    const rows = unwrap(
      await supabase
        .from("stops")
        .select("id, order_index, time_lock, visited_at, place_id, places_cache(display_name, rating, user_rating_count, primary_type, photo_ref, lat, lng)")
        .eq("day_id", dayId)
        .order("order_index", { ascending: true }),
    );
    return rows.map((/** @type {any} */ row) => ({
      id: row.id,
      order_index: row.order_index,
      time_lock: row.time_lock,
      visited_at: row.visited_at ?? null,
      place_id: row.place_id,
      display_name: row.places_cache?.display_name ?? "",
      rating: row.places_cache?.rating ?? null,
      user_rating_count: row.places_cache?.user_rating_count ?? null,
      primary_type: row.places_cache?.primary_type ?? null,
      photo_ref: row.places_cache?.photo_ref ?? null,
      lat: row.places_cache?.lat ?? null,
      lng: row.places_cache?.lng ?? null,
    }));
  }

  return {
    // Guest mode (PRD Section 7.2): every visitor gets a real Supabase
    // session via anonymous auth, so RLS-protected writes work from the very
    // first visit with no signup screen. It can be upgraded to a real account
    // later via linkIdentity/updateUser without losing data (same auth.uid()).
    async ensureSession() {
      const { session } = unwrap(await supabase.auth.getSession());
      if (session) return;
      unwrap(await supabase.auth.signInAnonymously());
    },

    async listTrips() {
      return unwrap(await supabase.from("trips").select("id, title, mode, lat, lng, location_name, created_at").order("created_at", { ascending: false }));
    },

    async createTrip({ title, lat, lng, locationName }) {
      const owner_id = await currentUserId();
      return unwrap(await supabase.from("trips").insert({ owner_id, title, lat, lng, location_name: locationName }).select().single());
    },

    async renameTrip(tripId, title) {
      unwrap(await supabase.from("trips").update({ title }).eq("id", tripId));
    },

    // Cascades to the trip's days and stops via "on delete cascade" in schema.sql.
    async deleteTrip(tripId) {
      unwrap(await supabase.from("trips").delete().eq("id", tripId));
    },

    async setTripMode(tripId, mode) {
      unwrap(await supabase.from("trips").update({ mode }).eq("id", tripId));
    },

    listDays,
    createDay,

    // Every trip needs at least one Day to hold stops, but Days stay
    // invisible until there are 2+ (USER_FLOW.md Step 4), so the first one
    // is created lazily rather than at trip-creation time.
    async ensureFirstDay(tripId) {
      const days = await listDays(tripId);
      return days.length ? days[0] : createDay(tripId, 0);
    },

    async deleteDay(dayId) {
      unwrap(await supabase.from("days").delete().eq("id", dayId));
    },

    async setDayDate(dayId, date) {
      unwrap(await supabase.from("days").update({ trip_date: date }).eq("id", dayId));
    },

    listStops,

    async addStop(dayId, place) {
      const owner_id = await currentUserId();
      const existing = await listStops(dayId);
      if (existing.some((s) => s.place_id === place.place_id)) return null; // already saved to this day
      const row = unwrap(
        await supabase.from("stops").insert({ day_id: dayId, owner_id, place_id: place.place_id, order_index: existing.length }).select().single(),
      );
      return { ...place, id: row.id, order_index: row.order_index, visited_at: null };
    },

    async removeStop(stopId) {
      unwrap(await supabase.from("stops").delete().eq("id", stopId));
    },

    async reorderStops(orderedStopIds) {
      const results = await Promise.all(orderedStopIds.map((id, idx) => supabase.from("stops").update({ order_index: idx }).eq("id", id)));
      results.forEach(unwrap);
    },

    async setStopVisited(stopId, visitedAt) {
      unwrap(await supabase.from("stops").update({ visited_at: visitedAt }).eq("id", stopId));
    },
  };
}
