// Demo implementation of trip storage: same interface as the Supabase
// backend, persisted to localStorage so a visitor's trips survive a reload.

/** @typedef {import("../../types.js").TripsBackend} TripsBackend */
/** @typedef {import("../../types.js").Trip} Trip */
/** @typedef {import("../../types.js").Day} Day */
/** @typedef {import("../../types.js").Stop} Stop */

/**
 * @typedef {object} DemoDb
 * @property {Trip[]} trips
 * @property {(Day & { trip_id: string })[]} days
 * @property {(Stop & { day_id: string })[]} stops
 */

export const DEMO_STORAGE_KEY = "pp-demo-db-v1";

/** @returns {DemoDb} */
const emptyDb = () => ({ trips: [], days: [], stops: [] });

/**
 * @param {Pick<Storage, "getItem" | "setItem">} [storage] Injectable for tests.
 * @returns {TripsBackend}
 */
export function createDemoBackend(storage = globalThis.localStorage) {
  /** @type {DemoDb} In-memory fallback when storage is blocked (private mode, sandboxed frames). */
  let memory = emptyDb();

  /** @returns {DemoDb} */
  function load() {
    try {
      const raw = storage.getItem(DEMO_STORAGE_KEY);
      return raw ? { ...emptyDb(), ...JSON.parse(raw) } : memory;
    } catch {
      return memory;
    }
  }

  /** @param {DemoDb} db */
  function save(db) {
    memory = db;
    try {
      storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* storage blocked: keep working in memory for this session */
    }
  }

  /**
   * Read-modify-write in one step, so every mutation persists.
   * @template R
   * @param {(db: DemoDb) => R} fn
   * @returns {R}
   */
  function mutate(fn) {
    const db = load();
    const result = fn(db);
    save(db);
    return result;
  }

  const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const clone = (/** @type {any} */ v) => structuredClone(v);

  /** @param {string} tripId */
  const daysOf = (tripId) => load().days.filter((d) => d.trip_id === tripId).sort((a, b) => a.order_index - b.order_index);

  /** @param {string} dayId */
  const stopsOf = (dayId) => load().stops.filter((s) => s.day_id === dayId).sort((a, b) => a.order_index - b.order_index);

  /** @param {string} tripId @param {number} orderIndex */
  const createDay = async (tripId, orderIndex) =>
    mutate((db) => {
      const day = { id: uid(), trip_id: tripId, order_index: orderIndex, trip_date: null };
      db.days.push(day);
      return clone(day);
    });

  /** @param {(Stop & { day_id: string })} s @returns {Stop} */
  const publicStop = ({ day_id: _dayId, ...stop }) => clone(stop);

  return {
    async ensureSession() {},

    async listTrips() {
      return clone(load().trips).sort((/** @type {Trip} */ a, /** @type {Trip} */ b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    },

    async createTrip({ title, lat, lng, locationName }) {
      return mutate((db) => {
        /** @type {Trip} */
        const trip = { id: uid(), title, lat, lng, location_name: locationName ?? null, mode: "dream", created_at: new Date().toISOString() };
        db.trips.push(trip);
        return clone(trip);
      });
    },

    async renameTrip(tripId, title) {
      mutate((db) => {
        const trip = db.trips.find((t) => t.id === tripId);
        if (trip) trip.title = title;
      });
    },

    async deleteTrip(tripId) {
      mutate((db) => {
        const dayIds = new Set(db.days.filter((d) => d.trip_id === tripId).map((d) => d.id));
        db.trips = db.trips.filter((t) => t.id !== tripId);
        db.days = db.days.filter((d) => !dayIds.has(d.id));
        db.stops = db.stops.filter((s) => !dayIds.has(s.day_id));
      });
    },

    async setTripMode(tripId, mode) {
      mutate((db) => {
        const trip = db.trips.find((t) => t.id === tripId);
        if (trip) trip.mode = mode;
      });
    },

    async listDays(tripId) {
      return daysOf(tripId).map(({ trip_id: _tripId, ...day }) => clone(day));
    },

    createDay,

    async ensureFirstDay(tripId) {
      const [first] = daysOf(tripId);
      if (first) {
        const { trip_id: _tripId, ...day } = first;
        return clone(day);
      }
      return createDay(tripId, 0);
    },

    async deleteDay(dayId) {
      mutate((db) => {
        db.days = db.days.filter((d) => d.id !== dayId);
        db.stops = db.stops.filter((s) => s.day_id !== dayId);
      });
    },

    async setDayDate(dayId, date) {
      mutate((db) => {
        const day = db.days.find((d) => d.id === dayId);
        if (day) day.trip_date = date;
      });
    },

    async listStops(dayId) {
      return stopsOf(dayId).map(publicStop);
    },

    async addStop(dayId, place) {
      return mutate((db) => {
        const existing = db.stops.filter((s) => s.day_id === dayId);
        if (existing.some((s) => s.place_id === place.place_id)) return null;
        const stop = { ...place, id: uid(), day_id: dayId, order_index: existing.length, visited_at: null };
        db.stops.push(stop);
        return publicStop(stop);
      });
    },

    async removeStop(stopId) {
      mutate((db) => {
        db.stops = db.stops.filter((s) => s.id !== stopId);
      });
    },

    async reorderStops(orderedStopIds) {
      mutate((db) => {
        orderedStopIds.forEach((id, idx) => {
          const stop = db.stops.find((s) => s.id === id);
          if (stop) stop.order_index = idx;
        });
      });
    },

    async setStopVisited(stopId, visitedAt) {
      mutate((db) => {
        const stop = db.stops.find((s) => s.id === stopId);
        if (stop) stop.visited_at = visitedAt;
      });
    },
  };
}
