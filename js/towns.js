// ══════════════════════════════════
// towns.js — Pantalla de Pueblos (mapa Leaflet)
// ══════════════════════════════════

import { DB } from './db.js';
import { escapeHtml, emitAppEvent, openExternalUrl, toast } from './utils.js';
import { getIntlLocale, getLanguage, t, translateRegionValue } from './i18n.js';

const POPULATION_LIMIT = 10000;
const MAP_PICK_RADIUS_PX = 18;

let mapInstance = null;
let markerLayer = null;
let markerRenderer = null;
let townsData = [];
let townsPromise = null;
let markersReady = false;
let currentTownId = null;
let townQuery = '';
let activeTownFilter = 'Todos';
let populationYear = 2025;
let userPosition = null;
let userMarker = null;
let userAccuracyCircle = null;
let geolocationStarted = false;
let geolocationNoticeShown = false;
let municipalityEnrichment = {};

const markerById = new Map();
const townById = new Map();

const TOWN_STATUS_COPY = {
  es: {
    loadFailed: 'No se han podido cargar los municipios',
    drawing: 'Pintando municipios {current}/{total}...'
  },
  en: {
    loadFailed: 'Municipalities could not be loaded',
    drawing: 'Drawing municipalities {current}/{total}...'
  },
  fr: {
    loadFailed: 'Impossible de charger les communes',
    drawing: 'Affichage des communes {current}/{total}...'
  },
  de: {
    loadFailed: 'Gemeinden konnten nicht geladen werden',
    drawing: 'Gemeinden werden gezeichnet {current}/{total}...'
  },
  it: {
    loadFailed: 'Impossibile caricare i comuni',
    drawing: 'Disegno dei comuni {current}/{total}...'
  }
};

const TOWN_COPY = {
  es: {
    popupFile: 'Ver ficha',
    badge: 'Municipio rural',
    previewGeolocated: 'Población oficial INE {year}. Está aproximadamente a {distance} de tu ubicación.',
    previewDefault: 'Población oficial INE {year}. Coordenadas listas para ver el municipio en el mapa.',
    introGeolocated: '{name} es un {profile} de {province} con {population} habitantes según INE {year}.',
    introDefault: '{name} es un {profile} de {province} con {population} habitantes según INE {year}.',
    hintGeolocated: 'La distancia aproximada desde tu ubicación actual es de {distance}.',
    hintDefault: 'Si activas la geolocalización del navegador, también verás la distancia aproximada desde tu posición.'
  },
  en: {
    popupFile: 'Open file',
    badge: 'Rural municipality',
    previewGeolocated: 'Official INE population {year}. It is roughly {distance} from your location.',
    previewDefault: 'Official INE population {year}. Coordinates are ready to review the municipality on the map.',
    introGeolocated: '{name} is a {profile} in {province} with {population} inhabitants according to INE {year}.',
    introDefault: '{name} is a {profile} in {province} with {population} inhabitants according to INE {year}.',
    hintGeolocated: 'Approximate distance from your current location: {distance}.',
    hintDefault: 'If you enable browser geolocation, you will also see the approximate distance from your position.'
  },
  fr: {
    popupFile: 'Voir la fiche',
    badge: 'Commune rurale',
    previewGeolocated: 'Population officielle INE {year}. Elle se trouve à environ {distance} de votre position.',
    previewDefault: 'Population officielle INE {year}. Les coordonnées sont prêtes pour visualiser la commune sur la carte.',
    introGeolocated: '{name} est un {profile} de {province} avec {population} habitants selon l’INE {year}.',
    introDefault: '{name} est un {profile} de {province} avec {population} habitants selon l’INE {year}.',
    hintGeolocated: 'La distance approximative depuis votre position actuelle est de {distance}.',
    hintDefault: 'Si vous activez la géolocalisation du navigateur, vous verrez aussi la distance approximative depuis votre position.'
  },
  de: {
    popupFile: 'Datei öffnen',
    badge: 'Ländliche Gemeinde',
    previewGeolocated: 'Offizielle INE-Bevölkerung {year}. Sie liegt ungefähr {distance} von deinem Standort entfernt.',
    previewDefault: 'Offizielle INE-Bevölkerung {year}. Die Koordinaten sind bereit, um die Gemeinde auf der Karte zu sehen.',
    introGeolocated: '{name} ist ein {profile} in {province} mit {population} Einwohnern laut INE {year}.',
    introDefault: '{name} ist ein {profile} in {province} mit {population} Einwohnern laut INE {year}.',
    hintGeolocated: 'Die ungefähre Entfernung von deinem aktuellen Standort beträgt {distance}.',
    hintDefault: 'Wenn du die Browser-Geolokalisierung aktivierst, siehst du auch die ungefähre Entfernung von deinem Standort.'
  },
  it: {
    popupFile: 'Apri scheda',
    badge: 'Comune rurale',
    previewGeolocated: 'Popolazione ufficiale INE {year}. Si trova a circa {distance} dalla tua posizione.',
    previewDefault: 'Popolazione ufficiale INE {year}. Le coordinate sono pronte per vedere il comune sulla mappa.',
    introGeolocated: '{name} è un {profile} di {province} con {population} abitanti secondo l’INE {year}.',
    introDefault: '{name} è un {profile} di {province} con {population} abitanti secondo l’INE {year}.',
    hintGeolocated: 'La distanza approssimativa dalla tua posizione attuale è di {distance}.',
    hintDefault: 'Se attivi la geolocalizzazione del browser, vedrai anche la distanza approssimativa dalla tua posizione.'
  }
};

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
}

function getTownCopy(key, params = {}) {
  const language = getLanguage();
  const template = TOWN_COPY[language]?.[key] || TOWN_COPY.es[key] || '';
  return interpolate(template, params);
}

function getTownStatusCopy(key, params = {}) {
  const language = getLanguage();
  const template = TOWN_STATUS_COPY[language]?.[key] || TOWN_STATUS_COPY.es[key] || '';
  return interpolate(template, params);
}

function formatNumber(value) {
  return new Intl.NumberFormat(getIntlLocale()).format(value || 0);
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return '—';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  if (distanceKm < 10) {
    return `${distanceKm.toLocaleString(getIntlLocale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} km`;
  }
  return `${Math.round(distanceKm).toLocaleString(getIntlLocale())} km`;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = value => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getTownDistanceKm(town) {
  if (!userPosition) return null;
  return haversineDistanceKm(userPosition.lat, userPosition.lon, town.lat, town.lon);
}

function getTownProfileKey(population) {
  if (population < 1000) return 'micro';
  if (population < 5000) return 'small';
  return 'medium';
}

function getTownProfileLabel(population) {
  return t(`towns.profiles.${getTownProfileKey(population)}`);
}

function getTownFilterGroup(population) {
  if (population < 1000) return 'Menos de 1.000';
  if (population < 5000) return '1.000-5.000';
  return '5.000-10.000';
}

function getTownFilterLabel(filter) {
  if (filter === 'Menos de 1.000') return t('towns.filters.under1k');
  if (filter === '1.000-5.000') return t('towns.filters.between1k5k');
  if (filter === '5.000-10.000') return t('towns.filters.between5k10k');
  return t('towns.visibleFilterAll');
}

function getTownById(id) {
  return townById.get(id) || null;
}

function buildTownPlaceholder(name = 'Municipio') {
  const safeName = String(name || 'Municipio').slice(0, 36);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0A84FF"/>
          <stop offset="100%" stop-color="#34C759"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" rx="72" fill="url(#bg)"/>
      <circle cx="965" cy="152" r="146" fill="rgba(255,255,255,0.12)"/>
      <circle cx="208" cy="602" r="126" fill="rgba(255,255,255,0.10)"/>
      <path d="M130 514l145-128 112 82 150-170 188 216H130z" fill="rgba(255,255,255,0.92)"/>
      <rect x="760" y="300" width="160" height="214" rx="18" fill="rgba(255,255,255,0.88)"/>
      <rect x="800" y="354" width="52" height="160" fill="#34C759"/>
      <rect x="836" y="354" width="52" height="160" fill="#0A84FF"/>
      <rect x="158" y="578" width="534" height="34" rx="17" fill="rgba(255,255,255,0.88)"/>
      <text x="158" y="656" font-size="52" font-family="Arial, sans-serif" font-weight="700" fill="rgba(255,255,255,0.96)">${escapeHtml(safeName)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getTownEnrichment(rawTown) {
  const code = String(rawTown?.id || '').padStart(5, '0');
  return municipalityEnrichment[code] || {};
}

function getTownWebsiteHost(value) {
  if (!value) return '';

  try {
    return new URL(value).hostname.replace(/^www\./i, '');
  } catch (error) {
    return value;
  }
}

function hydrateUserPositionFromDataset() {
  const session = DB.getSession();
  if (!session?.email) return;

  const latest = DB.getUserLocations(session.email)[0];
  if (!latest) return;

  userPosition = {
    lat: latest.lat,
    lon: latest.lon,
    accuracy: latest.accuracy || 0
  };
}

function normalizeTown(rawTown, population) {
  const enrichment = getTownEnrichment(rawTown);

  return {
    ...rawTown,
    population,
    populationYear,
    populationGroup: getTownFilterGroup(population),
    populationProfileKey: getTownProfileKey(population),
    image: enrichment.image || buildTownPlaceholder(rawTown.name),
    officialWebsite: enrichment.officialWebsite || '',
    websiteHost: getTownWebsiteHost(enrichment.officialWebsite || ''),
    coordinates: `${rawTown.lat.toFixed(4)}, ${rawTown.lon.toFixed(4)}`,
    searchText: [rawTown.name, rawTown.province, rawTown.region, rawTown.id].join(' ').toLowerCase()
  };
}

async function ensureTownsLoaded() {
  if (townsData.length) return townsData;
  if (townsPromise) return townsPromise;

  setTownStatus(t('towns.loading'));

  townsPromise = Promise.all([
    import('../data/municipios-spain-slim.js'),
    import('../data/municipios-population-2025.js'),
    import('../data/municipios-enrichment.js')
  ])
    .then(([municipalitiesModule, populationModule, enrichmentModule]) => {
      const populationMap = populationModule.MUNICIPAL_POPULATION_2025 || {};
      populationYear = populationModule.MUNICIPAL_POPULATION_YEAR || 2025;
      municipalityEnrichment = enrichmentModule.MUNICIPALITY_ENRICHMENT || {};

      townById.clear();

      townsData = municipalitiesModule.MUNICIPALITIES
        .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lon))
        .map(item => normalizeTown(item, populationMap[item.id]))
        .filter(item => Number.isFinite(item.population) && item.population > 0 && item.population < POPULATION_LIMIT)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

      townsData.forEach(town => townById.set(town.id, town));
      updateTownsSummary(townsData.length);
      return townsData;
    })
    .catch(error => {
      console.error('No se pudieron cargar los municipios:', error);
      setTownStatus(getTownStatusCopy('loadFailed'));
      throw error;
    });

  return townsPromise;
}

function setTownStatus(message, visible = true) {
  const status = document.getElementById('towns-loading');
  if (!status) return;

  status.textContent = message;
  status.style.display = visible ? 'block' : 'none';
}

function updateTownsSummary(count) {
  const summary = document.getElementById('towns-summary');
  if (!summary) return;

  const countCopy = count === 1
    ? t('towns.visibleOne')
    : t('towns.visibleOther', { count: formatNumber(count) });
  const filterCopy = getTownFilterLabel(activeTownFilter);
  const locationCopy = userPosition ? ` · ${t('towns.locationActive')}` : '';

  summary.textContent = `${countCopy} · ${filterCopy}${locationCopy}`;
}

function getTownMarkerStyle(town) {
  const saved = DB.isTownSaved(town.id);
  const fillColor = saved
    ? '#5856D6'
    : town.population < 1000
      ? '#34C759'
      : town.population < 5000
        ? '#007AFF'
        : '#FF9500';

  return {
    renderer: markerRenderer,
    radius: saved ? 7 : 5.8,
    color: '#FFFFFF',
    weight: saved ? 1.8 : 1.3,
    fillColor,
    fillOpacity: saved ? 0.96 : 0.84,
    bubblingMouseEvents: false
  };
}

function matchesTownFilters(town) {
  const matchesSearch = !townQuery || town.searchText.includes(townQuery);
  if (!matchesSearch) return false;

  if (activeTownFilter === 'Menos de 1.000') return town.population < 1000;
  if (activeTownFilter === '1.000-5.000') return town.population >= 1000 && town.population < 5000;
  if (activeTownFilter === '5.000-10.000') return town.population >= 5000 && town.population < 10000;
  return true;
}

function getVisibleTowns() {
  return townsData.filter(matchesTownFilters);
}

function syncTownFilterChips() {
  document.querySelectorAll('#towns-filters .chip').forEach(chip => {
    const isActive = chip.dataset.filter === activeTownFilter;
    chip.classList.toggle('chip-active', isActive);
    chip.classList.toggle('chip-inactive', !isActive);
  });
}

function findNearestTownFromMapEvent(event) {
  if (!mapInstance) return null;

  const sourcePoint = event?.containerPoint
    || (event?.originalEvent ? mapInstance.mouseEventToContainerPoint(event.originalEvent) : null);
  if (!sourcePoint) return null;

  let nearestTown = null;
  let nearestDistance = MAP_PICK_RADIUS_PX;

  getVisibleTowns().forEach(town => {
    const projectedPoint = mapInstance.latLngToContainerPoint([town.lat, town.lon]);
    const distance = sourcePoint.distanceTo
      ? sourcePoint.distanceTo(projectedPoint)
      : Math.hypot(sourcePoint.x - projectedPoint.x, sourcePoint.y - projectedPoint.y);

    if (distance > nearestDistance) return;
    nearestTown = town;
    nearestDistance = distance;
  });

  return nearestTown;
}

function renderTownPreview(town) {
  currentTownId = town.id;

  const card = document.getElementById('town-card');
  const thumb = document.getElementById('town-thumb');
  const name = document.getElementById('town-name');
  const province = document.getElementById('town-prov');
  const population = document.getElementById('town-population');
  const profile = document.getElementById('town-profile');
  const distance = document.getElementById('town-distance');
  const distanceLabel = document.getElementById('town-distance-label');
  const note = document.getElementById('town-preview-note');
  const saveBtn = document.getElementById('town-save-btn');

  if (!card || !thumb || !name || !province || !population || !profile || !distance || !distanceLabel || !note || !saveBtn) {
    return;
  }

  const distanceKm = getTownDistanceKm(town);
  const fallbackImage = buildTownPlaceholder(town.name);

  thumb.onerror = () => {
    thumb.onerror = null;
    thumb.src = fallbackImage;
  };
  thumb.src = town.image;
  name.textContent = town.name;
  province.textContent = `${town.province}, ${translateRegionValue(town.region)}`;
  population.textContent = formatNumber(town.population);
  profile.textContent = getTownProfileLabel(town.population);
  distance.textContent = distanceKm == null ? town.id : formatDistance(distanceKm);
  distanceLabel.textContent = distanceKm == null ? t('towns.ineCode') : t('towns.distance');
  note.textContent = distanceKm == null
    ? getTownCopy('previewDefault', { year: town.populationYear })
    : getTownCopy('previewGeolocated', {
      year: town.populationYear,
      distance: formatDistance(distanceKm)
    });
  saveBtn.textContent = DB.isTownSaved(town.id) ? t('saved.remove') : `+ ${t('common.save')}`;

  card.style.display = 'flex';
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'slideUp .35s cubic-bezier(0.34,1.56,0.64,1) both';
}

export function hideTownCard() {
  closeTownMapPopup();
  const card = document.getElementById('town-card');
  if (card) card.style.display = 'none';
}

function closeTownMapPopup() {
  if (mapInstance) mapInstance.closePopup();
}

function renderTownDetail(town) {
  const content = document.getElementById('town-detail-content');
  if (!content) return;

  const saved = DB.isTownSaved(town.id);
  const distanceKm = getTownDistanceKm(town);
  const distanceValue = distanceKm == null ? town.id : formatDistance(distanceKm);
  const distanceLabel = distanceKm == null ? t('towns.code') : t('towns.distance');
  const intro = getTownCopy(distanceKm == null ? 'introDefault' : 'introGeolocated', {
    name: town.name,
    profile: getTownProfileLabel(town.population).toLowerCase(),
    province: town.province,
    population: formatNumber(town.population),
    year: town.populationYear
  });
  const locationCopy = getTownCopy(distanceKm == null ? 'hintDefault' : 'hintGeolocated', {
    distance: formatDistance(distanceKm)
  });
  const fallbackImage = buildTownPlaceholder(town.name);
  const officialWebsiteValue = town.websiteHost || t('towns.websiteMissing');

  content.innerHTML = `
    <div class="detail-hero">
      <img src="${escapeHtml(town.image)}" alt="${escapeHtml(town.name)}" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}'"/>
      <div class="detail-hero-copy">
        <div class="badge badge-blue-fill" style="margin-bottom:10px;">${escapeHtml(getTownCopy('badge'))}</div>
        <div class="detail-title">${escapeHtml(town.name)}</div>
        <div class="detail-subtitle">${escapeHtml(town.province)}, ${escapeHtml(translateRegionValue(town.region))}</div>
      </div>
    </div>
    <div class="detail-scroll-body">
      <div class="detail-metrics">
        <div class="detail-metric">
          <div class="detail-metric-value">${escapeHtml(formatNumber(town.population))}</div>
          <div class="detail-metric-label">${escapeHtml(t('towns.inhabitants'))}</div>
        </div>
        <div class="detail-metric">
          <div class="detail-metric-value">${escapeHtml(getTownProfileLabel(town.population))}</div>
          <div class="detail-metric-label">${escapeHtml(t('towns.profile'))}</div>
        </div>
        <div class="detail-metric">
          <div class="detail-metric-value">${escapeHtml(distanceValue)}</div>
          <div class="detail-metric-label">${escapeHtml(distanceLabel)}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">${escapeHtml(t('towns.quickSummary'))}</div>
        <div class="detail-paragraph">${escapeHtml(intro)} ${escapeHtml(locationCopy)}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">${escapeHtml(t('towns.municipalFile'))}</div>
        <div class="detail-facts">
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('towns.province'))}</div>
            <div class="detail-fact-value">${escapeHtml(town.province)}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('towns.region'))}</div>
            <div class="detail-fact-value">${escapeHtml(translateRegionValue(town.region))}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('towns.code'))}</div>
            <div class="detail-fact-value">${escapeHtml(town.id)}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('towns.coords'))}</div>
            <div class="detail-fact-value">${escapeHtml(town.coordinates)}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('towns.officialWebsite'))}</div>
            <div class="detail-fact-value">${escapeHtml(officialWebsiteValue)}</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">${escapeHtml(t('towns.dataUsed'))}</div>
        <div class="detail-paragraph">${escapeHtml(t('towns.dataCopy', { year: town.populationYear }))}</div>
      </div>

      <div class="detail-actions">
        <button class="btn ${saved ? 'btn-gray' : 'btn-filled'} btn-h44" style="flex:1;" onclick="toggleSavedTown('${town.id}', event)">
          ${escapeHtml(saved ? t('towns.unsave') : t('towns.save'))}
        </button>
        <button class="btn btn-tinted btn-h44" style="flex:1;" onclick="focusTown('${town.id}')">${escapeHtml(t('towns.showMap'))}</button>
        <button class="btn ${town.officialWebsite ? 'btn-tinted' : 'btn-gray'} btn-h44" style="flex:1;" onclick="openTownOfficialWebsite('${town.id}')">${escapeHtml(t('towns.openOfficialWebsite'))}</button>
      </div>
    </div>`;
}

export async function openTownDetails(id = currentTownId) {
  const modal = document.getElementById('town-detail-modal');
  if (!modal || !id) return;

  await ensureTownsLoaded();
  const town = getTownById(id) || DB.getSavedTowns().find(item => item.id === id);
  if (!town) return;

  currentTownId = id;
  renderTownDetail(town);
  modal.style.display = 'flex';
}

export function closeTownDetails() {
  const modal = document.getElementById('town-detail-modal');
  if (modal) modal.style.display = 'none';
}

export async function openTownOfficialWebsite(id = currentTownId) {
  await ensureTownsLoaded();

  const town = getTownById(id) || DB.getSavedTowns().find(item => item.id === id);
  if (!town?.officialWebsite) {
    toast(t('towns.websiteMissing'));
    return;
  }

  openExternalUrl(town.officialWebsite);
}

export async function toggleSavedTown(id = currentTownId, event) {
  if (event) event.stopPropagation();

  const town = getTownById(id) || DB.getSavedTowns().find(item => item.id === id) || null;
  if (!town) return;

  try {
    const saved = await DB.toggleSavedTown(town);
    if (saved == null) {
      toast('Inicia sesión para guardar municipios.');
      if (typeof window.go === 'function') window.go('s-login');
      return;
    }

    toast(saved ? t('towns.save') : t('towns.unsave'));

    const marker = markerById.get(town.id);
    if (marker) marker.setStyle(getTownMarkerStyle(town));

    if (currentTownId === town.id) {
      renderTownPreview(town);
      renderTownDetail(town);
    }

    emitAppEvent('arraigo:saved-changed', { type: 'town', id: town.id, saved });
  } catch (error) {
    console.error('No se pudo actualizar el municipio guardado:', error);
    toast('No se pudo guardar el municipio.');
  }
}

function ensureUserMarker() {
  if (!mapInstance || !userPosition) return;

  const latLng = [userPosition.lat, userPosition.lon];

  if (!userAccuracyCircle) {
    userAccuracyCircle = L.circle(latLng, {
      radius: userPosition.accuracy || 0,
      color: '#FF3B30',
      weight: 1,
      fillColor: '#FF3B30',
      fillOpacity: 0.08
    }).addTo(mapInstance);
  } else {
    userAccuracyCircle.setLatLng(latLng);
    userAccuracyCircle.setRadius(userPosition.accuracy || 0);
  }

  if (!userMarker) {
    userMarker = L.circleMarker(latLng, {
      radius: 7,
      color: '#FFFFFF',
      weight: 2,
      fillColor: '#FF3B30',
      fillOpacity: 1
    }).addTo(mapInstance);
  } else {
    userMarker.setLatLng(latLng);
  }

  userMarker.bringToFront();
}

function applyUserPosition(nextPosition) {
  if (!nextPosition?.lat || !nextPosition?.lon) return;

  userPosition = {
    lat: nextPosition.lat,
    lon: nextPosition.lon,
    accuracy: nextPosition.accuracy || 0
  };

  ensureUserMarker();
  updateTownsSummary(getVisibleTowns().length);

  if (!currentTownId) return;

  const town = getTownById(currentTownId) || DB.getSavedTowns().find(item => item.id === currentTownId);
  if (!town) return;

  renderTownPreview(town);

  const modal = document.getElementById('town-detail-modal');
  if (modal?.style.display === 'flex') renderTownDetail(town);
}

function initGeolocation() {
  if (geolocationStarted || !navigator.geolocation) return;
  geolocationStarted = true;

  navigator.geolocation.getCurrentPosition(position => {
    applyUserPosition({
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy || 0
    });
  }, error => {
    console.warn('Geolocalización no disponible:', error);

    if (geolocationNoticeShown) return;
    geolocationNoticeShown = true;
    toast(t('tracking.allow'));
  }, {
    enableHighAccuracy: true,
    maximumAge: 120000,
    timeout: 12000
  });

  navigator.geolocation.watchPosition(position => {
    applyUserPosition({
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy || 0
    });
  }, error => {
    console.warn('Geolocalización no disponible:', error);

    if (geolocationNoticeShown) return;
    geolocationNoticeShown = true;
    toast(t('tracking.allow'));
  }, {
    enableHighAccuracy: true,
    maximumAge: 120000,
    timeout: 12000
  });
}

function openTownMarker(marker, town, fly = true) {
  if (!marker || !town) return;

  closeTownMapPopup();
  renderTownPreview(town);

  if (fly && mapInstance) {
    mapInstance.flyTo([town.lat, town.lon], Math.max(mapInstance.getZoom(), 10), { duration: 0.6 });
  }
}

function handleMapSelection(event) {
  const town = findNearestTownFromMapEvent(event);
  if (!town) {
    closeTownMapPopup();
    hideTownCard();
    return;
  }

  const marker = markerById.get(town.id);
  if (marker) {
    openTownMarker(marker, town, true);
    return;
  }

  renderTownPreview(town);
}

async function buildTownMarkers() {
  if (!mapInstance || markersReady) return;

  setTownStatus(getTownStatusCopy('drawing', {
    current: 0,
    total: formatNumber(townsData.length)
  }));
  markerRenderer = L.canvas({ padding: 0.5, tolerance: 12 });
  markerLayer = L.layerGroup().addTo(mapInstance);
  markerById.clear();

  const batchSize = 350;

  for (let index = 0; index < townsData.length; index += batchSize) {
    const batch = townsData.slice(index, index + batchSize);

    batch.forEach(town => {
      const marker = L.circleMarker([town.lat, town.lon], getTownMarkerStyle(town));
      marker.on('click', event => {
        if (event?.originalEvent) L.DomEvent.stop(event.originalEvent);
        openTownMarker(marker, town, true);
      });

      marker.addTo(markerLayer);
      markerById.set(town.id, marker);
    });

    setTownStatus(getTownStatusCopy('drawing', {
      current: formatNumber(Math.min(index + batchSize, townsData.length)),
      total: formatNumber(townsData.length)
    }));
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  markersReady = true;
  setTownStatus('', false);
  mapInstance.on('click', handleMapSelection);
  ensureUserMarker();
  applyTownFilters();
}

function applyTownFilters() {
  const visibleTowns = getVisibleTowns();
  if (!markerLayer) {
    updateTownsSummary(visibleTowns.length);
    return;
  }

  const visibleIds = new Set(visibleTowns.map(town => town.id));

  townsData.forEach(town => {
    const marker = markerById.get(town.id);
    if (!marker) return;

    const shouldShow = visibleIds.has(town.id);
    const isVisible = markerLayer.hasLayer(marker);

    if (shouldShow && !isVisible) markerLayer.addLayer(marker);
    if (!shouldShow && isVisible) markerLayer.removeLayer(marker);
    if (shouldShow) marker.setStyle(getTownMarkerStyle(town));
  });

  if (currentTownId && !visibleIds.has(currentTownId)) hideTownCard();
  updateTownsSummary(visibleTowns.length);
}

export async function focusTown(id) {
  closeTownDetails();

  if (typeof window.switchTo === 'function') window.switchTo('s-towns');

  await initMap();

  const town = getTownById(id) || DB.getSavedTowns().find(item => item.id === id);
  if (!town || !mapInstance) return;

  activeTownFilter = 'Todos';
  townQuery = '';

  const search = document.getElementById('towns-search');
  if (search) search.value = '';

  syncTownFilterChips();
  applyTownFilters();

  const marker = markerById.get(town.id);
  if (marker) {
    openTownMarker(marker, town, false);
  } else {
    renderTownPreview(town);
  }

  mapInstance.flyTo([town.lat, town.lon], 11, { duration: 0.8 });
}

export function setTownFilter(filterName, event) {
  if (event) event.preventDefault();
  activeTownFilter = filterName || 'Todos';
  syncTownFilterChips();
  applyTownFilters();
}

export function initTowns() {
  const search = document.getElementById('towns-search');
  if (search) {
    search.addEventListener('input', event => {
      townQuery = event.target.value.trim().toLowerCase();
      applyTownFilters();
    });
  }

  window.addEventListener('arraigo:saved-changed', event => {
    if (event.detail?.type !== 'town') return;

    const town = getTownById(event.detail.id) || DB.getSavedTowns().find(item => item.id === event.detail.id);
    const marker = markerById.get(event.detail.id);
    if (town && marker) marker.setStyle(getTownMarkerStyle(town));
    if (currentTownId === event.detail.id && town) {
      renderTownPreview(town);
      renderTownDetail(town);
    }
  });

  window.addEventListener('arraigo:user-position-changed', event => {
    applyUserPosition(event.detail?.position);
  });

  window.addEventListener('arraigo:language-changed', () => {
    syncTownFilterChips();
    updateTownsSummary(getVisibleTowns().length);

    const town = currentTownId
      ? (getTownById(currentTownId) || DB.getSavedTowns().find(item => item.id === currentTownId))
      : null;
    if (town) {
      renderTownPreview(town);
      const modal = document.getElementById('town-detail-modal');
      if (modal?.style.display === 'flex') renderTownDetail(town);
    }
  });

  syncTownFilterChips();
  updateTownsSummary(0);
}

// ── INICIALIZAR MAPA LEAFLET ──────────────────────
export async function initMap() {
  hydrateUserPositionFromDataset();
  await ensureTownsLoaded();

  if (mapInstance) {
    initGeolocation();
    ensureUserMarker();
    await buildTownMarkers();
    setTimeout(() => mapInstance.invalidateSize(), 100);
    return;
  }

  mapInstance = L.map('map', {
    zoomControl: false,
    preferCanvas: true
  }).setView([40.35, -3.75], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(mapInstance);

  initGeolocation();
  await buildTownMarkers();
  ensureUserMarker();
  setTimeout(() => mapInstance.invalidateSize(), 100);
}

window.initMap = initMap;
window.openTownDetails = openTownDetails;
window.closeTownDetails = closeTownDetails;
window.toggleSavedTown = toggleSavedTown;
window.setTownFilter = setTownFilter;
window.hideTownCard = hideTownCard;
window.focusTown = focusTown;
window.openTownOfficialWebsite = openTownOfficialWebsite;
