import { qs } from "./dom.js";
import { state } from "./state.js";

/** @typedef {"trips" | "start" | "mood" | "discover" | "plan"} ViewName */

/**
 * Screens navigate to each other in both directions (discover <-> plan,
 * trips -> plan, ...). Rather than having every view module import every
 * other one, each view registers its entry points here and calls through
 * `nav`, which keeps the import graph a simple star around this file.
 */
export const nav = {
  /** @type {() => Promise<void>} */ goToTrips: unregistered,
  /** @type {() => void} */ goToStart: unregistered,
  /** @type {() => void} */ goToMood: unregistered,
  /** @type {(initialType?: string) => Promise<void>} */ goToDiscover: unregistered,
  /** @type {() => Promise<void>} */ openDiscoverView: unregistered,
  /** @type {() => Promise<void>} */ goToPlan: unregistered,
};

/** @returns {never} */
function unregistered() {
  throw new Error("Navigation target used before its view registered it");
}

/** @param {ViewName} name */
export function showView(name) {
  document.querySelectorAll(".pp-view").forEach((el) => {
    /** @type {HTMLElement} */ (el).hidden = el.id !== `view-${name}`;
  });
  document.body.dataset.view = name;
  qs("btn-my-trips").hidden = !state.trip || name === "trips";
  qs("view-plan-pill").hidden = name !== "discover" || state.stops.length === 0;
  window.scrollTo({ top: 0 });
}
