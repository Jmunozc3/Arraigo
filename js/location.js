// ══════════════════════════════════
// location.js — Seguimiento estructurado de ubicación
// ══════════════════════════════════

import { DB } from './db.js?v=20260417204131';
import { emitAppEvent, toast } from './utils.js?v=20260417204131';
import { t } from './i18n.js?v=20260417204131';

let watchId = null;
let nightlyTimer = null;
let lastTrackedSample = null;
let permissionToastShown = false;

function getDateKey(dateValue = Date.now()) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTrackedSession() {
  const session = DB.getSession();
  if (!session || session.role === 'admin') return null;
  if (session.trackingEnabled === false) return null;
  return session;
}

function getDistanceKm(first, second) {
  if (!first || !second) return Number.POSITIVE_INFINITY;

  const toRadians = value => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRadians(second.lat - first.lat);
  const dLon = toRadians(second.lon - first.lon);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function emitUserPosition(position, source, capturedAt = Date.now()) {
  const lat = position.coords?.latitude ?? position.lat;
  const lon = position.coords?.longitude ?? position.lon;
  const accuracy = position.coords?.accuracy ?? position.accuracy ?? null;

  emitAppEvent('arraigo:user-position-changed', {
    position: { lat, lon, accuracy },
    source,
    capturedAt
  });
}

async function recordPosition(position, source) {
  const session = getTrackedSession();
  if (!session) return null;

  const lat = position.coords?.latitude ?? position.lat;
  const lon = position.coords?.longitude ?? position.lon;
  const accuracy = position.coords?.accuracy ?? position.accuracy ?? null;
  const capturedAt = Date.now();

  emitUserPosition(position, source, capturedAt);

  const nextSample = { lat, lon, capturedAt };
  const isNightly = String(source).startsWith('nightly');
  const movedEnough = getDistanceKm(lastTrackedSample, nextSample) >= 0.25;
  const waitedEnough = !lastTrackedSample || (capturedAt - lastTrackedSample.capturedAt) >= (15 * 60 * 1000);

  if (!isNightly && !movedEnough && !waitedEnough) return null;

  const record = await DB.recordUserLocation({
    email: session.email,
    lat,
    lon,
    accuracy,
    source,
    capturedAt,
    nightlyDateKey: isNightly ? getDateKey(capturedAt) : undefined
  });

  if (record) {
    lastTrackedSample = nextSample;
    emitAppEvent('arraigo:location-captured', { record });
  }

  return record;
}

function handleLocationError(error, fallbackMessage = 'tracking.allow') {
  console.warn('No se pudo capturar la ubicación:', error);
  if (permissionToastShown) return;
  permissionToastShown = true;
  toast(t(fallbackMessage));
}

async function getPermissionState() {
  if (!navigator.permissions?.query) return 'unknown';

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch (error) {
    return 'unknown';
  }
}

export function captureLocationSample(source = 'manual') {
  const session = getTrackedSession();
  if (!session || !navigator.geolocation) return Promise.resolve(null);

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(async position => {
      permissionToastShown = false;
      resolve(await recordPosition(position, source));
    }, error => {
      handleLocationError(error, 'tracking.allow');
      resolve(null);
    }, {
      enableHighAccuracy: true,
      maximumAge: 120000,
      timeout: 12000
    });
  });
}

async function requestLocationAccess(source = 'app-open') {
  const session = getTrackedSession();
  if (!session || !navigator.geolocation) return null;

  const permissionState = await getPermissionState();
  if (permissionState === 'prompt' && !permissionToastShown) {
    permissionToastShown = true;
    toast(t('tracking.allow'));
  }

  if (permissionState === 'denied') {
    handleLocationError({ code: 'denied' }, 'tracking.allow');
    return null;
  }

  return captureLocationSample(source);
}

function maybeCaptureNightly(source = 'timer') {
  const session = getTrackedSession();
  if (!session) return Promise.resolve(null);

  const now = new Date();
  const dateKey = getDateKey(now.getTime());
  if (DB.hasNightlyLocation(session.email, dateKey)) return Promise.resolve(null);

  const isMidnightHour = now.getHours() === 0;
  const canCatchUp = source !== 'timer' && now.getHours() > 0;
  if (!isMidnightHour && !canCatchUp) return Promise.resolve(null);

  const suffix = !isMidnightHour && canCatchUp ? '-catchup' : '';
  return captureLocationSample(`nightly-${source}${suffix}`);
}

async function syncLocationOnWake(source = 'app-open') {
  const nightlyRecord = await maybeCaptureNightly(source);
  if (nightlyRecord) return nightlyRecord;
  return requestLocationAccess(source);
}

function startWatchIfNeeded() {
  const session = getTrackedSession();
  if (!session || !navigator.geolocation) {
    stopLocationTracking();
    return;
  }

  if (watchId == null) {
    watchId = navigator.geolocation.watchPosition(position => {
      permissionToastShown = false;
      void recordPosition(position, 'foreground-watch');
    }, error => {
      handleLocationError(error, 'tracking.failed');
    }, {
      enableHighAccuracy: true,
      maximumAge: 120000,
      timeout: 12000
    });
  }

  if (nightlyTimer == null) {
    nightlyTimer = window.setInterval(() => {
      void maybeCaptureNightly('timer');
    }, 60 * 1000);
  }
}

export function stopLocationTracking() {
  if (watchId != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (nightlyTimer != null) {
    clearInterval(nightlyTimer);
    nightlyTimer = null;
  }
}

export function initLocationTracking() {
  startWatchIfNeeded();
  void syncLocationOnWake('app-open');

  window.addEventListener('focus', () => {
    startWatchIfNeeded();
    void syncLocationOnWake('app-focus');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    startWatchIfNeeded();
    void syncLocationOnWake('app-visible');
  });

  window.addEventListener('arraigo:session-changed', () => {
    permissionToastShown = false;
    startWatchIfNeeded();
    void syncLocationOnWake('session-start');
  });
}

window.captureLocationSample = captureLocationSample;
