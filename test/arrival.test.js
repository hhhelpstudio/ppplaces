import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ARRIVAL_RADIUS_M, arrivalEnabled, nearbyUnvisitedStop } from "../public/js/lib/arrival.js";

// ~0.0009° latitude ≈ 100 m.
const here = { lat: 0, lng: 0 };
const at = (/** @type {string} */ id, /** @type {number} */ metersNorth, visited_at = /** @type {string | null} */ (null)) => ({
  id,
  lat: metersNorth / 111_195,
  lng: 0,
  visited_at,
});

describe("nearbyUnvisitedStop", () => {
  it("offers the closest stop inside the radius", () => {
    const hit = nearbyUnvisitedStop(here, [at("far", 100), at("near", 40)]);
    assert.equal(hit?.stop.id, "near");
    assert.ok(Math.abs((hit?.meters ?? 0) - 40) < 1);
  });

  it("ignores visited and out-of-range stops", () => {
    assert.equal(nearbyUnvisitedStop(here, [at("done", 10, "2026-10-07T10:00:00Z"), at("out", ARRIVAL_RADIUS_M + 30)]), null);
  });

  it("ignores stops without coordinates", () => {
    assert.equal(nearbyUnvisitedStop(here, [{ id: "x", lat: null, lng: null }]), null);
  });
});

describe("arrivalEnabled", () => {
  it("only applies to planning trips", () => {
    assert.equal(arrivalEnabled({ mode: "planning" }), true);
    assert.equal(arrivalEnabled({ mode: "dream" }), false);
    assert.equal(arrivalEnabled(null), false);
  });
});
