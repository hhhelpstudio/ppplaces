// Route optimizer — simplified nearest-neighbor-from-anchor heuristic
// (PRD Section 7.3 Week 3 scope: the full 2-opt/TSP solver is a post-MVP
// upgrade). Uses straight-line (haversine) distance rather than real
// walking distance/time — good enough for *comparative* ranking of a small
// day-trip stop set, not for precise ETAs. Swap in Google Distance
// Matrix/Directions or self-hosted OSRM (Section 4.5) later without
// changing this function's shape: it just needs {lat, lng} points in.

const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function tourDistance(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineMeters(points[i], points[i + 1]);
  }
  return total;
}

// Returns the stops in nearest-neighbor order from `anchor`, plus how much
// walking distance that saves vs. the current order (never negative — a
// worse "optimized" order is just not offered).
export function optimizeOrder(stops, anchor) {
  if (stops.length < 2) return { stops, savedMeters: 0 };

  const originalDistance = tourDistance([anchor, ...stops]);

  const remaining = [...stops];
  const optimized = [];
  let current = anchor;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, idx) => {
      const d = haversineMeters(current, s);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    const [next] = remaining.splice(bestIdx, 1);
    optimized.push(next);
    current = next;
  }

  const optimizedDistance = tourDistance([anchor, ...optimized]);

  return {
    stops: optimized,
    savedMeters: Math.max(0, originalDistance - optimizedDistance),
  };
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Rough walking-time estimate (~80 m/min) for badges and the "saves ~N
// minutes" framing (USER_FLOW.md Step 5) — a placeholder for real
// Directions/OSRM durations.
export function estimateWalkMinutes(meters) {
  return Math.max(1, Math.round(meters / 80));
}
