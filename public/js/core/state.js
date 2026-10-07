/** @typedef {import("../types.js").Trip} Trip */
/** @typedef {import("../types.js").Day} Day */
/** @typedef {import("../types.js").Stop} Stop */
/** @typedef {import("../types.js").LatLng} LatLng */
/** @typedef {import("../map/adapter.js").MapAdapter} MapAdapter */

/** The six moods double as search categories (Google `includedType`s). */
export const MOODS = /** @type {const} */ ([
  { type: "cafe", icon: "coffee", label: "Coffee & Cafés" },
  { type: "restaurant", icon: "bowl", label: "Food" },
  { type: "tourist_attraction", icon: "palette", label: "Art & Culture" },
  { type: "park", icon: "tree", label: "Parks & Nature" },
  { type: "night_club", icon: "moon", label: "Nightlife" },
  { type: "shopping_mall", icon: "bag", label: "Shopping" },
]);

/** @typedef {(typeof MOODS)[number]} Mood */

/** @param {string | null | undefined} type */
export const moodFor = (type) => MOODS.find((m) => m.type === type);

/**
 * Single source of truth for what's on screen. Views read and write it
 * directly; there's no framework, so keeping it in one plain object keeps
 * data flow easy to follow.
 */
export const state = {
  /** @type {Trip[]} */ trips: [],
  /** @type {Trip | null} */ trip: null,
  /** @type {Day[]} */ days: [],
  /** @type {Day | null} */ day: null,
  /** @type {Stop[]} */ stops: [],
  activeType: "",
  /** @type {LatLng | null} */ lastSearchCenter: null,
  /** @type {MapAdapter | null} */ discoverMap: null,
  /** @type {MapAdapter | null} */ planMap: null,
};

/**
 * The current trip and day. Every caller of this is on a screen that only
 * exists once a trip is open, so a missing one is a bug, not a state to handle.
 * @returns {{ trip: Trip, day: Day }}
 */
export function current() {
  if (!state.trip || !state.day) throw new Error("No trip/day open");
  return { trip: state.trip, day: state.day };
}
