import { ensureSession } from "./supabaseClient.js";
import { loadGoogleMaps, mapReady } from "./mapInit.js";

let map;
let markers = [];
let activeType = "";

async function init() {
  await ensureSession();
  loadGoogleMaps();
  map = await mapReady;

  document.getElementById("search-input").addEventListener("change", runSearch);
  document.querySelectorAll(".pp-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const wasActive = chip.classList.contains("is-active");
      document.querySelectorAll(".pp-chip").forEach((c) => c.classList.remove("is-active"));
      activeType = wasActive ? "" : chip.dataset.type;
      if (!wasActive) chip.classList.add("is-active");
      runSearch();
    });
  });

  runSearch();
}

async function runSearch() {
  const q = document.getElementById("search-input").value.trim();
  const center = map.getCenter();
  const params = new URLSearchParams({
    q,
    type: activeType,
    lat: center.lat(),
    lng: center.lng(),
    radius: "1500",
  });
  const res = await fetch(`/api/places/search?${params}`);
  const { places } = await res.json();
  renderResults(places || []);
}

function renderResults(places) {
  markers.forEach((m) => m.setMap(null));
  markers = [];

  const container = document.getElementById("results");
  container.replaceChildren();

  for (const place of places) {
    const card = document.createElement("article");
    card.className = "pp-card";

    const name = document.createElement("h3");
    name.textContent = place.display_name;
    card.appendChild(name);

    if (place.rating) {
      const rating = document.createElement("p");
      rating.className = "pp-card-meta";
      rating.textContent = `⭐ ${place.rating} (${place.user_rating_count || 0})`;
      card.appendChild(rating);
    }

    container.appendChild(card);

    if (place.lat && place.lng) {
      markers.push(new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.display_name,
      }));
    }
  }
}

init();
