// ══════════════════════════════════
// geo.js — Resolución aproximada de municipio por coordenadas
// ══════════════════════════════════

let municipalities = [];
let municipalitiesPromise = null;

const resolutionCache = new Map();

function normalizeCoordinate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCacheKey(lat, lon) {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

function getDistanceScore(latA, lonA, latB, lonB) {
  const averageLatitudeRadians = ((latA + latB) / 2) * (Math.PI / 180);
  const deltaLat = latA - latB;
  const deltaLon = (lonA - lonB) * Math.cos(averageLatitudeRadians);
  return (deltaLat * deltaLat) + (deltaLon * deltaLon);
}

async function ensureMunicipalitiesLoaded() {
  if (municipalities.length) return municipalities;
  if (municipalitiesPromise) return municipalitiesPromise;

  municipalitiesPromise = import('../data/municipios-spain-slim.js?v=202604221247')
    .then(module => {
      municipalities = (module.MUNICIPALITIES || []).filter(item => (
        Number.isFinite(item?.lat) && Number.isFinite(item?.lon)
      ));
      return municipalities;
    });

  return municipalitiesPromise;
}

export async function resolveMunicipalityFromCoordinates(latValue, lonValue) {
  const lat = normalizeCoordinate(latValue);
  const lon = normalizeCoordinate(lonValue);

  if (lat == null || lon == null) {
    return {
      municipality: '',
      province: '',
      region: ''
    };
  }

  const cacheKey = getCacheKey(lat, lon);
  if (resolutionCache.has(cacheKey)) return resolutionCache.get(cacheKey);

  const items = await ensureMunicipalitiesLoaded();
  let closest = null;
  let closestScore = Number.POSITIVE_INFINITY;

  items.forEach(item => {
    const score = getDistanceScore(lat, lon, item.lat, item.lon);
    if (score < closestScore) {
      closest = item;
      closestScore = score;
    }
  });

  const resolved = {
    municipality: closest?.name || '',
    province: closest?.province || '',
    region: closest?.region || ''
  };

  resolutionCache.set(cacheKey, resolved);
  return resolved;
}
