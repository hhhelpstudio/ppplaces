// Step 8: arrival check-in. Location is only asked for when the guest taps
// "Check in at your stops" (never on page load), and being near a stop only
// *offers* the stamp: a human tap collects it, so GPS drift can't award one.

import { qs } from "../core/dom.js";
import { isDemo } from "../core/env.js";
import { state } from "../core/state.js";
import { trips } from "../data/trips.js";
import { arrivalEnabled, nearbyUnvisitedStop } from "../lib/arrival.js";
import { icon } from "../ui/icons.js";
import { walkieSays } from "../ui/walkie.js";
import { notifyStopsChanged } from "./saves.js";

/** @typedef {import("../types.js").LatLng} LatLng */
/** @typedef {import("../types.js").Stop} Stop */

/** @type {number | null} */
let watchId = null;
/** @type {LatLng | null} */
let position = null;
/** Set right after a stamp so the celebration survives the re-render it triggers. */
let justCollected = "";
let locationError = false;

const panel = () => qs("arrival-panel");
const planVisible = () => !qs("view-plan").hidden;

function stopWatching() {
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  position = null;
  state.planMap?.setUserPosition(null);
}

function startWatching() {
  if (!navigator.geolocation) {
    locationError = true;
    render();
    return;
  }
  locationError = false;
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!planVisible()) return stopWatching();
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    },
    () => {
      stopWatching();
      locationError = true;
      render();
    },
    { enableHighAccuracy: true, maximumAge: 15_000 },
  );
  render();
}

/** @param {LatLng} next */
function setPosition(next) {
  position = next;
  state.planMap?.setUserPosition(next);
  render();
}

// Demo visitors aren't standing in Kyoto, so they can jump to the next
// unvisited stop to see the check-in moment. Lands ~25 m off, like real GPS.
function pretendAtNextStop() {
  const next = state.stops.find((s) => !s.visited_at && s.lat != null && s.lng != null);
  if (!next || next.lat == null || next.lng == null) return;
  setPosition({ lat: next.lat + 0.0002, lng: next.lng + 0.0001 });
}

/** @param {Stop} stop */
async function collect(stop) {
  const at = new Date().toISOString();
  await trips.setStopVisited(stop.id, at);
  stop.visited_at = at;
  justCollected = stop.display_name;
  notifyStopsChanged(); // re-renders the plan, which calls refreshArrival()
}

/** @param {string} id @param {string} label @param {string} [cls] */
const button = (id, label, cls = "pp-btn pp-btn-outline") => `<button id="${id}" class="${cls}" type="button">${label}</button>`;

function render() {
  const el = panel();
  const remaining = state.stops.filter((s) => !s.visited_at && s.lat != null);
  const demo = isDemo();
  /** @type {string[]} */
  const actions = [];
  let body;

  if (justCollected) {
    const done = remaining.length === 0;
    body = walkieSays(
      "celebrating",
      done ? `Stamp collected at ${justCollected}. That's every stop. What a day!` : `Stamp collected at ${justCollected}!`,
      { size: 60, live: true },
    );
    justCollected = "";
  } else if (remaining.length === 0) {
    body = walkieSays("happy", "Every stamp on this day is collected.", { size: 52 });
  } else if (watchId == null && !position) {
    body = locationError
      ? walkieSays("confused", "Walkie couldn't get your location. You can try again, or check your browser's location setting.", { size: 52 })
      : `<p class="pp-arrival-lead">${icon("stamp", { size: 16 })} Out exploring? Collect a stamp at each stop.</p>`;
    actions.push(button("arrival-start", `${icon("locate", { size: 16 })} Check in at your stops`));
  } else {
    const near = position ? nearbyUnvisitedStop(position, state.stops) : null;
    if (near) {
      body = walkieSays("happy", `You're near ${near.stop.display_name}. Tap to collect your stamp!`, { size: 60, live: true });
      actions.push(button("arrival-collect", `${icon("stamp", { size: 16 })} Collect stamp`, "pp-btn pp-btn-primary"));
    } else {
      body = walkieSays("thinking", "Walkie's watching for your next stop…", { size: 52, live: true });
    }
    if (watchId != null) actions.push(button("arrival-stop", "Stop checking in", "pp-btn pp-btn-ghost"));
  }

  if (demo && remaining.length > 0) {
    actions.push(button("arrival-demo", `${icon("sparkle", { size: 16 })} Demo: pretend I'm at the next stop`, "pp-btn pp-btn-ghost"));
  }

  el.innerHTML = `${body}${actions.length ? `<div class="pp-arrival-actions">${actions.join("")}</div>` : ""}`;

  el.querySelector("#arrival-start")?.addEventListener("click", startWatching);
  el.querySelector("#arrival-stop")?.addEventListener("click", () => {
    stopWatching();
    render();
  });
  el.querySelector("#arrival-demo")?.addEventListener("click", pretendAtNextStop);
  el.querySelector("#arrival-collect")?.addEventListener("click", () => {
    const near = position && nearbyUnvisitedStop(position, state.stops);
    if (near) collect(near.stop);
  });
}

/** Called on every plan render; shows the panel only for dated (Planning) trips with stops. */
export function refreshArrival() {
  const el = panel();
  if (!arrivalEnabled(state.trip) || state.stops.length === 0) {
    el.hidden = true;
    el.replaceChildren();
    stopWatching();
    return;
  }
  el.hidden = false;
  render();
}
