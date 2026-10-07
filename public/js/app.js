// Boot. Each view wires its own DOM and registers its entry points in
// core/nav.js; this file only decides the order and the first screen.

import { qs } from "./core/dom.js";
import { isDemo } from "./core/env.js";
import { nav } from "./core/nav.js";
import { initTrips } from "./data/trips.js";
import { initTheme } from "./ui/theme.js";
import { walkieSays } from "./ui/walkie.js";
import { initDetailView } from "./views/detail.js";
import { initDiscoverView } from "./views/discover.js";
import { initPlanView } from "./views/plan.js";
import { initSheets } from "./views/sheets.js";
import { initStartView } from "./views/start.js";
import { initTripsView } from "./views/trips.js";

// config.js is gitignored and absent on the public demo deploy. Loading it
// here (not via a <script> tag) means a missing file is a caught error
// rather than a 404 or an HTML fallback page parsed as JavaScript.
async function loadConfig() {
  try {
    const path = "./config.js"; // a variable, so tooling doesn't require the file to exist
    await import(path);
  } catch {
    /* no config: demo mode */
  }
}

async function boot() {
  await loadConfig();
  initTheme();
  qs("demo-banner").hidden = !isDemo();

  initSheets();
  initDetailView();
  initTripsView();
  initStartView();
  initDiscoverView();
  initPlanView();

  try {
    await initTrips();
    await nav.goToTrips(); // falls through to the start screen when there are none
  } catch (err) {
    console.error(err);
    const main = qs("boot-error");
    main.hidden = false;
    main.innerHTML = walkieSays("confused", "Walkie couldn't load your trips. Check your connection and refresh to try again.", { size: 72 });
  } finally {
    document.body.removeAttribute("aria-busy");
  }
}

boot();
