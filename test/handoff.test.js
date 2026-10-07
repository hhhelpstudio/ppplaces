import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayHandoffUrl, googleMapsUrl, isIOS, isRealPlaceId, placeViewUrl } from "../public/js/lib/handoff.js";

const stop = (/** @type {string} */ id, /** @type {number} */ lat, /** @type {number} */ lng) => ({ place_id: id, display_name: `Stop ${id}`, lat, lng });

describe("isRealPlaceId", () => {
  it("rejects demo and empty ids", () => {
    assert.equal(isRealPlaceId("ChIJabc"), true);
    assert.equal(isRealPlaceId("demo:kyoto-1"), false);
    assert.equal(isRealPlaceId(""), false);
    assert.equal(isRealPlaceId(null), false);
  });
});

describe("isIOS", () => {
  it("detects iPhone and iPad user agents", () => {
    assert.equal(isIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), true);
    assert.equal(isIOS("Mozilla/5.0 (Linux; Android 15)"), false);
  });
});

describe("googleMapsUrl", () => {
  it("never sends a demo place id to Google", () => {
    const url = new URL(googleMapsUrl({ destinationLat: 1, destinationLng: 2, destinationPlaceId: "demo:x" }));
    assert.equal(url.searchParams.get("destination"), "1,2");
    assert.equal(url.searchParams.has("destination_place_id"), false);
    assert.equal(url.searchParams.get("travelmode"), "walking");
  });
});

describe("dayHandoffUrl", () => {
  it("routes through every stop and ends at the last one, with no origin", () => {
    const url = new URL(/** @type {string} */ (dayHandoffUrl([stop("ChIJa", 1, 1), stop("ChIJb", 2, 2), stop("ChIJc", 3, 3)])));
    assert.equal(url.searchParams.get("destination"), "3,3");
    assert.equal(url.searchParams.get("destination_place_id"), "ChIJc");
    assert.equal(url.searchParams.get("waypoints"), "1,1|2,2");
    assert.equal(url.searchParams.has("origin"), false);
  });

  it("skips unlocated stops and needs two located ones", () => {
    assert.equal(dayHandoffUrl([stop("a", 1, 1), { ...stop("b", 0, 0), lat: null, lng: null }]), null);
  });
});

describe("placeViewUrl", () => {
  it("falls back to name + coordinates for demo places", () => {
    const { google, apple } = placeViewUrl(stop("demo:k1", 35, 135));
    assert.match(google, /query=Stop%20demo%3Ak1%2035,135|query=Stop%20demo:k1%2035,135/);
    assert.doesNotMatch(google, /query_place_id/);
    assert.match(apple, /ll=35,135/);
  });
});
