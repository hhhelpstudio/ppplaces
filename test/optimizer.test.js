import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateWalkMinutes, formatDistance, haversineMeters, optimizeOrder, tourDistance } from "../public/js/lib/optimizer.js";

const anchor = { lat: 0, lng: 0 };
// Points along the equator, ~111 m apart per 0.001°.
const p = (/** @type {number} */ x, id = String(x)) => ({ id, lat: 0, lng: x / 1000 });

describe("haversineMeters", () => {
  it("is zero for the same point and symmetric", () => {
    assert.equal(haversineMeters(anchor, anchor), 0);
    const a = { lat: 35.0116, lng: 135.7681 }; // Kyoto
    const b = { lat: 38.7223, lng: -9.1393 }; // Lisbon
    assert.equal(Math.round(haversineMeters(a, b)), Math.round(haversineMeters(b, a)));
  });

  it("matches a known distance within 1%", () => {
    const meters = haversineMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 });
    assert.ok(Math.abs(meters - 111_195) / 111_195 < 0.01, `${meters}`);
  });
});

describe("optimizeOrder", () => {
  it("reorders a zig-zag into a straight walk and reports the saving", () => {
    const stops = [p(3), p(1), p(4), p(2)];
    const { stops: ordered, savedMeters } = optimizeOrder(stops, anchor);
    assert.deepEqual(ordered.map((s) => s.id), ["1", "2", "3", "4"]);
    assert.ok(savedMeters > 0);
    assert.equal(Math.round(tourDistance([anchor, ...stops]) - tourDistance([anchor, ...ordered])), Math.round(savedMeters));
  });

  it("returns the original order untouched when it is already best", () => {
    const stops = [p(1), p(2), p(3)];
    const result = optimizeOrder(stops, anchor);
    assert.equal(result.stops, stops);
    assert.equal(result.savedMeters, 0);
  });

  it("handles fewer than two stops", () => {
    assert.deepEqual(optimizeOrder([], anchor), { stops: [], savedMeters: 0 });
    assert.equal(optimizeOrder([p(1)], anchor).savedMeters, 0);
  });
});

describe("formatting", () => {
  it("formats metres and kilometres", () => {
    assert.equal(formatDistance(420.4), "420 m");
    assert.equal(formatDistance(1850), "1.9 km");
  });

  it("never estimates less than a minute", () => {
    assert.equal(estimateWalkMinutes(10), 1);
    assert.equal(estimateWalkMinutes(800), 10);
  });
});
