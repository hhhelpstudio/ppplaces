import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { DEMO_CITIES } from "../public/js/data/demo/fixtures.js";
import { demoPlaceDetail, geocodeDemo, nearestCity, searchDemoPlaces } from "../public/js/data/demo/places.js";
import { DEMO_STORAGE_KEY, createDemoBackend } from "../public/js/data/demo/trips.js";

const kyoto = /** @type {(typeof DEMO_CITIES)[number]} */ (DEMO_CITIES.find((c) => c.id === "kyoto"));

describe("demo fixtures", () => {
  it("have unique ids and coordinates near their city", () => {
    const ids = new Set();
    for (const city of DEMO_CITIES) {
      for (const place of city.places) {
        assert.ok(!ids.has(place.id), `duplicate ${place.id}`);
        ids.add(place.id);
        assert.ok(Math.abs(place.lat - city.lat) < 0.2 && Math.abs(place.lng - city.lng) < 0.2, place.name);
      }
    }
  });
});

describe("demo places", () => {
  it("searches by mood around a point, nearest first, with demo ids", () => {
    const cafes = searchDemoPlaces({ type: "cafe", lat: kyoto.lat, lng: kyoto.lng });
    assert.ok(cafes.length > 0);
    assert.ok(cafes.every((p) => p.primary_type === "cafe" && p.place_id.startsWith("demo:")));
  });

  it("returns nothing far from every demo city", () => {
    assert.deepEqual(searchDemoPlaces({ lat: 51.5, lng: -0.12 }), []);
  });

  it("geocodes city names loosely and rejects others", () => {
    assert.equal(geocodeDemo("kyoto, japan")?.name, "Kyoto");
    assert.equal(geocodeDemo("Atlantis"), null);
  });

  it("picks the nearest city", () => {
    assert.equal(nearestCity({ lat: -8.4, lng: 115.2 }).id, "ubud");
  });

  it("describes a place by id", () => {
    const first = searchDemoPlaces({ lat: kyoto.lat, lng: kyoto.lng })[0];
    assert.ok(demoPlaceDetail(first.place_id).rich_metadata?.editorial_summary);
  });
});

describe("demo trips backend", () => {
  /** @type {Map<string, string>} */
  let store;
  const storage = {
    getItem: (/** @type {string} */ k) => store.get(k) ?? null,
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => void store.set(k, v),
  };
  beforeEach(() => {
    store = new Map();
  });

  it("round-trips a trip, its day and stops through storage", async () => {
    const db = createDemoBackend(storage);
    await db.ensureSession();
    const trip = await db.createTrip({ title: "Kyoto", lat: kyoto.lat, lng: kyoto.lng, locationName: "Kyoto, Japan" });
    const day = await db.ensureFirstDay(trip.id);
    const [a, b] = searchDemoPlaces({ lat: kyoto.lat, lng: kyoto.lng });
    const sa = await db.addStop(day.id, a);
    const sb = await db.addStop(day.id, b);
    if (!sa || !sb) throw new Error("addStop returned null");

    await db.reorderStops([sb.id, sa.id]);
    await db.setStopVisited(sa.id, "2026-10-07T09:00:00Z");

    // A fresh backend over the same storage sees the same data.
    const again = createDemoBackend(storage);
    const stops = await again.listStops(day.id);
    assert.deepEqual(stops.map((s) => s.place_id), [b.place_id, a.place_id]);
    assert.equal(stops[1].visited_at, "2026-10-07T09:00:00Z");
    assert.ok(store.has(DEMO_STORAGE_KEY));
  });

  it("cascades deletes from trip to days and stops", async () => {
    const db = createDemoBackend(storage);
    const trip = await db.createTrip({ title: "Ubud", lat: -8.5, lng: 115.26 });
    const day = await db.ensureFirstDay(trip.id);
    await db.addStop(day.id, searchDemoPlaces({ lat: -8.5, lng: 115.26 })[0]);
    await db.deleteTrip(trip.id);
    assert.deepEqual(await db.listTrips(), []);
    assert.deepEqual(await db.listStops(day.id), []);
  });

  it("keeps working in memory when storage throws", async () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const db = createDemoBackend(broken);
    await db.createTrip({ title: "Lisbon", lat: 38.7, lng: -9.1 });
    assert.equal((await db.listTrips()).length, 1);
  });
});
