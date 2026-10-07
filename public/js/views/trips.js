// Step 9: trip list / return visit. Also the landing screen once the guest
// has at least one trip. Dream and Planning trips are mixed in one list:
// they're the same kind of object at different points (USER_FLOW.md Step 9).

import { escapeHtml, qs } from "../core/dom.js";
import { nav, showView } from "../core/nav.js";
import { state } from "../core/state.js";
import { trips } from "../data/trips.js";
import { icon } from "../ui/icons.js";
import { openTripOptions } from "./sheets.js";
import { openTrip } from "./plan.js";

export async function goToTrips() {
  state.trip = null;
  state.trips = await trips.listTrips();
  if (state.trips.length === 0) {
    nav.goToStart();
    return;
  }
  renderTripList();
  showView("trips");
}

export function renderTripList() {
  const container = qs("trips-list");
  container.replaceChildren();
  state.trips.forEach((trip, i) => {
    const row = document.createElement("li");
    row.className = "pp-trip-card";
    row.style.setProperty("--i", String(i));

    const btn = document.createElement("button");
    btn.className = "pp-trip-card-main";
    btn.type = "button";
    const where = trip.location_name && trip.location_name !== trip.title ? trip.location_name : "";
    btn.innerHTML = `
      <span class="pp-trip-card-title">${escapeHtml(trip.title)}</span>
      <span class="pp-trip-card-meta">
        <span class="pp-mode-dot ${trip.mode}" aria-hidden="true"></span>
        ${trip.mode === "planning" ? "Planning" : "Dreaming"}${where ? ` · ${escapeHtml(where)}` : ""}
      </span>`;
    btn.addEventListener("click", () => openTrip(trip));
    row.appendChild(btn);

    const menuBtn = document.createElement("button");
    menuBtn.className = "pp-icon-btn";
    menuBtn.type = "button";
    menuBtn.setAttribute("aria-label", `Options for ${trip.title}`);
    menuBtn.innerHTML = icon("more-horizontal", { size: 18 });
    menuBtn.addEventListener("click", () => openTripOptions(trip));
    row.appendChild(menuBtn);

    container.appendChild(row);
  });
}

export function initTripsView() {
  nav.goToTrips = goToTrips;
  qs("btn-new-trip").addEventListener("click", () => nav.goToStart());
  qs("btn-my-trips").innerHTML = icon("arrow-left", { size: 20 });
  qs("btn-my-trips").addEventListener("click", goToTrips);
  window.addEventListener("pp-trips-changed", () => {
    if (!qs("view-trips").hidden) renderTripList();
  });
}
