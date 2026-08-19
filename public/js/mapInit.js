// Loads the Maps JS SDK once (billed per load, not per data op — Section
// 4.4) and hands out independent map instances from it — Discovery's
// browse map and the Plan screen's route map are two separate `Map`
// objects bound to two different DOM elements, not one map moved around.
let scriptPromise = null;

function ensureScriptLoaded() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      window.__ppMapsReady = resolve;
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${window.CONFIG.MAPS_BROWSER_KEY}&callback=__ppMapsReady`;
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function createMap(elementId, center) {
  await ensureScriptLoaded();
  return new google.maps.Map(document.getElementById(elementId), {
    center,
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true,
    // Google's default ("cooperative") requires two fingers to pan so a
    // one-finger swipe can still scroll the page past the map — but our
    // maps are a fixed part of the layout, not something you'd want to
    // scroll "through," so trade that for one-finger panning instead.
    gestureHandling: "greedy",
  });
}
