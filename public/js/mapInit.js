let resolveMapReady;
export const mapReady = new Promise((resolve) => { resolveMapReady = resolve; });

window.__ppInitMap = function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 35.0116, lng: 135.7681 }, // Kyoto — a friendly default center
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true,
  });
  resolveMapReady(map);
};

export function loadGoogleMaps() {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${window.CONFIG.MAPS_BROWSER_KEY}&callback=__ppInitMap`;
  script.async = true;
  document.head.appendChild(script);
}
