// Steps 1-2: start a trip (somewhere you're dreaming of, or right where you
// are) and pick a mood.

import { escapeHtml, qs } from "../core/dom.js";
import { isDemo } from "../core/env.js";
import { nav, showView } from "../core/nav.js";
import { MOODS, state } from "../core/state.js";
import { DEMO_CITIES } from "../data/demo/fixtures.js";
import { demoCityNames, nearestCity } from "../data/demo/places.js";
import { geocode } from "../data/places.js";
import { trips } from "../data/trips.js";
import { icon } from "../ui/icons.js";
import { walkie, walkieSays } from "../ui/walkie.js";

/** @typedef {import("../ui/walkie.js").WalkiePose} WalkiePose */

/** @param {WalkiePose} pose @param {string} message */
function setStatus(pose, message) {
  qs("start-status").innerHTML = message ? walkieSays(pose, message, { size: 52, live: true }) : "";
}

function goToStart() {
  qs("dream-input-wrap").hidden = true;
  /** @type {HTMLInputElement} */ (qs("dream-input")).value = "";
  setStatus("idle", "");
  showView("start");
}

/** @param {string} placeName */
async function startDreamTrip(placeName) {
  setStatus("thinking", "Walkie is looking that up…");
  const place = await geocode(placeName);
  if (!place) {
    setStatus(
      "confused",
      isDemo()
        ? `In the demo, Walkie only knows ${listCities()}. Try one of those?`
        : "Walkie couldn't find that place. Try a different spelling?",
    );
    return;
  }
  const trip = await trips.createTrip({
    title: place.name || placeName,
    lat: place.lat,
    lng: place.lng,
    locationName: place.formatted_address || place.name,
  });
  setStatus("idle", "");
  state.trip = trip;
  goToMood();
}

function startNearbyTrip() {
  if (isDemo()) {
    // Nobody visiting the demo is standing in one of its three cities, so
    // "around me" snaps to the closest one instead of an empty map.
    setStatus("thinking", "Finding you…");
    const fallback = () => startCity(DEMO_CITIES.find((c) => c.id === "ubud") ?? DEMO_CITIES[0], true);
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => startCity(nearestCity({ lat: pos.coords.latitude, lng: pos.coords.longitude }), true),
      fallback,
      { timeout: 8000 },
    );
    return;
  }

  setStatus("thinking", "Finding you…");
  if (!navigator.geolocation) {
    setStatus("confused", "Location isn't available here. Search for a city instead?");
    qs("dream-input-wrap").hidden = false;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      state.trip = await trips.createTrip({
        title: "Right around me",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        locationName: "Current location",
      });
      setStatus("idle", "");
      goToMood();
    },
    () => {
      setStatus("confused", "Walkie couldn't get your location. Search for a city instead?");
      qs("dream-input-wrap").hidden = false;
    },
  );
}

/**
 * @param {import("../data/demo/fixtures.js").DemoCity} city
 * @param {boolean} [snapped] Came from "around me" in demo mode.
 */
async function startCity(city, snapped = false) {
  state.trip = await trips.createTrip({
    title: city.name,
    lat: city.lat,
    lng: city.lng,
    locationName: `${city.name}, ${city.country}`,
  });
  setStatus("idle", "");
  goToMood(snapped ? `Demo mode: Walkie took you to ${city.name}, the closest demo city.` : "");
}

const listCities = () => {
  const names = demoCityNames();
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

/** @param {string} [note] */
function goToMood(note = "") {
  qs("mood-note").innerHTML = note ? `<p class="pp-demo-note">${escapeHtml(note)}</p>` : "";
  showView("mood");
}

function renderMoodChips() {
  const container = qs("mood-chips");
  container.replaceChildren();
  for (const mood of MOODS) {
    const chip = document.createElement("button");
    chip.className = `pp-chip pp-chip--${mood.type}`;
    chip.type = "button";
    chip.innerHTML = `${icon(mood.icon)}<span>${mood.label}</span>`;
    chip.addEventListener("click", () => nav.goToDiscover(mood.type));
    container.appendChild(chip);
  }
}

function renderDemoCities() {
  const wrap = qs("demo-cities");
  if (!isDemo()) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  const list = qs("demo-city-list");
  list.replaceChildren();
  for (const city of DEMO_CITIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pp-chip";
    btn.innerHTML = `${icon("map-pin", { size: 16 })}<span>${escapeHtml(city.name)}</span>`;
    btn.addEventListener("click", () => startCity(city));
    list.appendChild(btn);
  }
}

export function initStartView() {
  nav.goToStart = goToStart;
  nav.goToMood = () => goToMood();
  qs("start-walkie").innerHTML = walkie("happy", { size: 96 });
  renderMoodChips();
  renderDemoCities();

  document.querySelectorAll(".pp-option-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (/** @type {HTMLElement} */ (card).dataset.choice === "dream") {
        qs("dream-input-wrap").hidden = false;
        qs("dream-input").focus();
      } else {
        startNearbyTrip();
      }
    });
  });

  const go = () => {
    const value = /** @type {HTMLInputElement} */ (qs("dream-input")).value.trim();
    if (value) startDreamTrip(value);
  };
  qs("btn-dream-go").addEventListener("click", go);
  qs("dream-input").addEventListener("keydown", (e) => e.key === "Enter" && go());
  qs("mood-skip").addEventListener("click", () => nav.goToDiscover(""));
}
