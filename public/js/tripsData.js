// Trip/Day/Stop CRUD, talking to Supabase directly from the browser via
// supabase-js. This is safe (and deliberately doesn't go through the
// Cloudflare Pages Function proxy) because these tables are protected by the
// RLS policies in supabase/schema.sql — the anon key can only ever touch
// rows owned by the current guest/auth session (see supabaseClient.js).
// Only the Google-key-holding endpoints (places search/detail, geocode) go
// through the proxy.
import { supabase } from "./supabaseClient.js";

async function currentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user.id;
}

export async function listTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("id, title, mode, lat, lng, location_name, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTrip({ title, lat, lng, locationName }) {
  const owner_id = await currentUserId();
  const { data, error } = await supabase
    .from("trips")
    .insert({ owner_id, title, lat, lng, location_name: locationName })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTrip(tripId) {
  const { data, error } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (error) throw error;
  return data;
}

export async function setTripMode(tripId, mode) {
  const { error } = await supabase.from("trips").update({ mode }).eq("id", tripId);
  if (error) throw error;
}

export async function renameTrip(tripId, title) {
  const { error } = await supabase.from("trips").update({ title }).eq("id", tripId);
  if (error) throw error;
}

// Cascades to that trip's days and stops via the FK "on delete cascade"
// in schema.sql — no separate cleanup needed here.
export async function deleteTrip(tripId) {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}

export async function listDays(tripId) {
  const { data, error } = await supabase
    .from("days")
    .select("id, order_index, trip_date")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createDay(tripId, orderIndex) {
  const owner_id = await currentUserId();
  const { data, error } = await supabase
    .from("days")
    .insert({ trip_id: tripId, owner_id, order_index: orderIndex })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Every trip needs at least one Day to hold stops, but Days are invisible
// until there are 2+ of them (USER_FLOW.md Step 4) — this lazily creates
// the first one rather than doing it eagerly at trip-creation time.
export async function ensureFirstDay(tripId) {
  const days = await listDays(tripId);
  if (days.length) return days[0];
  return createDay(tripId, 0);
}

// Cascades to that day's stops via the FK "on delete cascade" in schema.sql.
export async function deleteDay(dayId) {
  const { error } = await supabase.from("days").delete().eq("id", dayId);
  if (error) throw error;
}

export async function setDayDate(dayId, date) {
  const { error } = await supabase.from("days").update({ trip_date: date }).eq("id", dayId);
  if (error) throw error;
}

export async function listStops(dayId) {
  const { data, error } = await supabase
    .from("stops")
    .select(
      "id, order_index, time_lock, place_id, places_cache(display_name, rating, user_rating_count, primary_type, photo_ref, lat, lng)"
    )
    .eq("day_id", dayId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    order_index: row.order_index,
    time_lock: row.time_lock,
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

export async function addStop(dayId, placeId) {
  const owner_id = await currentUserId();
  const existing = await listStops(dayId);
  if (existing.some((s) => s.place_id === placeId)) return null; // already saved to this day
  const { data, error } = await supabase
    .from("stops")
    .insert({ day_id: dayId, owner_id, place_id: placeId, order_index: existing.length })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeStop(stopId) {
  const { error } = await supabase.from("stops").delete().eq("id", stopId);
  if (error) throw error;
}

export async function reorderStops(orderedStopIds) {
  await Promise.all(
    orderedStopIds.map((id, idx) => supabase.from("stops").update({ order_index: idx }).eq("id", id))
  );
}
