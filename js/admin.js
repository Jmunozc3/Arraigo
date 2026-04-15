// ══════════════════════════════════
// admin.js — Visualización de ubicaciones para testing
// ══════════════════════════════════

import { DB } from './db.js';
import { resolveMunicipalityFromCoordinates } from './geo.js';
import { escapeHtml, toast } from './utils.js';
import { getIntlLocale, t, translateRegionValue } from './i18n.js';

let adminMap = null;
let adminLayer = null;
let adminRouteLayer = null;
let selectedEmail = null;
let forceAllView = false;

const markerByEmail = new Map();

function formatRelative(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return t('admin.noDate');

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat(getIntlLocale(), { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');

  return formatter.format(Math.round(diffHours / 24), 'day');
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return t('admin.noDate');

  return date.toLocaleString(getIntlLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function getTrackingSourceLabel(source) {
  const value = String(source || '');
  if (value.startsWith('nightly')) return t('admin.sources.nightly');

  if (value === 'session-start') return t('admin.sources.sessionStart');
  if (value === 'app-open') return t('admin.sources.appOpen');
  if (value === 'app-focus') return t('admin.sources.appFocus');
  if (value === 'app-visible') return t('admin.sources.appVisible');
  if (value === 'foreground-watch') return t('admin.sources.foregroundWatch');
  if (value === 'manual') return t('admin.sources.manual');

  return t('admin.sources.unknown');
}

function getAdminScreen() {
  return document.getElementById('s-admin');
}

function isAdminScreenVisible() {
  return getAdminScreen()?.classList.contains('active') ?? false;
}

function resetAdminMapState() {
  if (adminMap) adminMap.remove();

  adminMap = null;
  adminLayer = null;
  adminRouteLayer = null;
  markerByEmail.clear();

  const container = document.getElementById('admin-map');
  if (container?._leaflet_id) delete container._leaflet_id;
  if (container) container.innerHTML = '';
}

function ensureAdminMap() {
  const container = document.getElementById('admin-map');
  if (!container || typeof L === 'undefined') return null;

  if (adminMap && adminMap.getContainer?.() !== container) {
    resetAdminMapState();
  }

  if (adminMap) return adminMap;

  if (container._leaflet_id) {
    delete container._leaflet_id;
    container.innerHTML = '';
  }

  adminMap = L.map(container, {
    zoomControl: false,
    preferCanvas: true
  }).setView([40.35, -3.75], 5.5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(adminMap);

  return adminMap;
}

function getRows() {
  return DB.getLocationSummaryRows().filter(row => row.role !== 'admin');
}

function getUserHistory(email) {
  return DB.getUserLocations(email).slice().sort((a, b) => a.capturedAt - b.capturedAt);
}

function getPreferredRow(rows) {
  return rows.slice().sort((first, second) => {
    const bySamples = (second.recordsCount || 0) - (first.recordsCount || 0);
    if (bySamples !== 0) return bySamples;
    return (second.capturedAt || 0) - (first.capturedAt || 0);
  })[0] || null;
}

function setHomeAdminVisibility() {
  const button = document.getElementById('home-admin-btn');
  if (!button) return;
  button.style.display = DB.isAdminSession() ? 'flex' : 'none';
}

function resolveSelection(rows) {
  if (!rows.length) {
    selectedEmail = null;
    return null;
  }

  const rowExists = selectedEmail && rows.some(row => row.email === selectedEmail);
  if (rowExists) return rows.find(row => row.email === selectedEmail) || null;

  if (forceAllView) {
    selectedEmail = null;
    return null;
  }

  const preferredRow = getPreferredRow(rows);
  selectedEmail = preferredRow?.email || rows[0].email;
  return preferredRow || rows[0];
}

function renderSelectedUserCard(selectedRow) {
  const card = document.getElementById('admin-selected-user-card');
  const title = document.getElementById('admin-selected-user-title');
  const copy = document.getElementById('admin-selected-user-copy');
  const badge = document.getElementById('admin-selected-user-badge');
  if (!card || !title || !copy || !badge) return;

  if (!selectedRow) {
    card.style.display = 'block';
    title.textContent = t('admin.selectedRouteTitle');
    copy.textContent = t('admin.allUsersView');
    badge.textContent = t('admin.points', { count: getRows().length });
    return;
  }

  const history = getUserHistory(selectedRow.email);
  const latest = history[history.length - 1] || selectedRow;

  card.style.display = 'block';
  title.textContent = t('admin.selectedRouteTitle');
  copy.textContent = t('admin.routeForUser', {
    name: selectedRow.name,
    count: history.length,
    date: formatDate(latest.capturedAt)
  });
  badge.textContent = t('admin.points', { count: history.length });
}

function renderAdminList(selectedRow) {
  const list = document.getElementById('admin-user-locations');
  const usersCount = document.getElementById('admin-users-count');
  const recordsCount = document.getElementById('admin-records-count');
  const summary = document.getElementById('admin-summary');
  if (!list || !usersCount || !recordsCount || !summary) return;

  const rows = getRows();
  const dataset = DB.getLocationDataset();

  usersCount.textContent = String(rows.length);
  recordsCount.textContent = String(dataset.records.filter(record => record.role !== 'admin').length);

  if (!rows.length) {
    renderSelectedUserCard(null);
    summary.textContent = t('admin.emptySummary');
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">${escapeHtml(t('admin.emptyTitle'))}</div>
        <div class="empty-copy">${escapeHtml(t('admin.emptyCopy'))}</div>
      </div>`;
    return;
  }

  renderSelectedUserCard(selectedRow);
  summary.textContent = selectedRow
    ? t('admin.routeForUser', {
      name: selectedRow.name,
      count: getUserHistory(selectedRow.email).length,
      date: formatDate(selectedRow.capturedAt)
    })
    : t('admin.lastUpdate', { relative: formatRelative(rows[0].capturedAt) });

  list.innerHTML = rows.map(row => {
    const history = DB.getUserLocations(row.email);
    const firstRecord = history[history.length - 1] || row;
    const latestRecord = history[0] || row;
    const isSelected = row.email === selectedRow?.email;
    const encodedEmail = encodeURIComponent(row.email);

    const historyMarkup = history.length
      ? history.map(record => `
        <div class="admin-history-item">
          <div class="admin-history-title">${escapeHtml(formatDate(record.capturedAt))}</div>
          <div class="admin-history-copy">
            ${escapeHtml(getTrackingSourceLabel(record.source))} ·
            ${escapeHtml(record.lat.toFixed(5))}, ${escapeHtml(record.lon.toFixed(5))}
            ${record.accuracy ? ` · ±${escapeHtml(String(Math.round(record.accuracy)))} m` : ''}
          </div>
        </div>`).join('')
      : `
        <div class="admin-history-item">
          <div class="admin-history-copy">${escapeHtml(t('admin.historyEmpty'))}</div>
        </div>`;

    return `
      <article class="admin-user-card" style="${isSelected ? 'box-shadow:0 0 0 2px rgba(0,122,255,0.18),0 1px 8px rgba(0,0,0,0.06);' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div>
            <div style="font-size:16px;font-weight:700;letter-spacing:-0.3px;color:var(--label);">${escapeHtml(row.name)}</div>
            <div style="font-size:13px;color:var(--ios-blue);margin-top:3px;">${escapeHtml(row.email)}</div>
            <div style="font-size:13px;color:var(--label2);margin-top:6px;line-height:1.5;">${escapeHtml(row.town || t('admin.townMissing'))} · ${escapeHtml(row.region ? translateRegionValue(row.region) : t('admin.regionMissing'))}</div>
          </div>
          <span class="badge ${isSelected ? 'badge-blue-fill' : 'badge-green-fill'}">${escapeHtml(getTrackingSourceLabel(row.source))}</span>
        </div>
        <div class="detail-facts" style="margin-top:14px;">
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('admin.latlon'))}</div>
            <div class="detail-fact-value">${escapeHtml(row.lat.toFixed(5))}, ${escapeHtml(row.lon.toFixed(5))}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('admin.accuracy'))}</div>
            <div class="detail-fact-value">${escapeHtml(row.accuracy ? `${Math.round(row.accuracy)} m` : t('tracking.none'))}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('admin.firstRecord'))}</div>
            <div class="detail-fact-value">${escapeHtml(formatDate(firstRecord.capturedAt))}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('admin.lastRecord'))}</div>
            <div class="detail-fact-value">${escapeHtml(formatDate(latestRecord.capturedAt))}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('admin.samples'))}</div>
            <div class="detail-fact-value">${escapeHtml(String(row.recordsCount))}</div>
          </div>
          <div class="detail-fact">
            <div class="detail-fact-label">${escapeHtml(t('admin.source'))}</div>
            <div class="detail-fact-value">${escapeHtml(getTrackingSourceLabel(row.source))}</div>
          </div>
        </div>
        <div class="saved-actions" style="margin-top:14px;">
          <button class="btn ${isSelected ? 'btn-filled' : 'btn-tinted'} btn-h36" style="flex:1;font-size:13px;" onclick="focusAdminUser('${encodedEmail}')">${escapeHtml(t('admin.viewOnMap'))}</button>
        </div>
        <div style="margin-top:16px;font-size:13px;font-weight:700;color:var(--label);letter-spacing:-0.15px;">${escapeHtml(t('admin.history'))}</div>
        <div class="admin-history-list">${historyMarkup}</div>
      </article>`;
  }).join('');
}

function renderAdminMarkers(selectedRow) {
  if (!adminMap) return;

  const rows = getRows();
  markerByEmail.clear();

  if (adminLayer) {
    adminLayer.clearLayers();
  } else {
    adminLayer = L.layerGroup().addTo(adminMap);
  }

  if (adminRouteLayer) {
    adminRouteLayer.clearLayers();
  } else {
    adminRouteLayer = L.layerGroup().addTo(adminMap);
  }

  if (!rows.length) {
    adminMap.setView([40.35, -3.75], 5.5);
    return;
  }

  const latestBounds = [];
  rows.forEach(row => {
    const marker = L.circleMarker([row.lat, row.lon], {
      radius: 6,
      color: '#FFFFFF',
      weight: 2,
      fillColor: row.email === selectedRow?.email ? '#0A84FF' : '#FF3B30',
      fillOpacity: 0.92
    }).addTo(adminLayer);

    marker.bindPopup(`
      <div style="min-width:180px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${escapeHtml(row.name)}</div>
        <div style="font-size:12px;color:#666;line-height:1.45;">${escapeHtml(row.email)}</div>
        <div style="font-size:12px;color:#666;line-height:1.45;margin-top:6px;">${escapeHtml(formatDate(row.capturedAt))}</div>
      </div>
    `);

    markerByEmail.set(row.email, marker);
    latestBounds.push([row.lat, row.lon]);
  });

  if (!selectedRow) {
    if (latestBounds.length === 1) {
      adminMap.setView(latestBounds[0], 10);
      return;
    }

    adminMap.fitBounds(latestBounds, { padding: [24, 24] });
    return;
  }

  const history = getUserHistory(selectedRow.email);
  const path = history.map(record => [record.lat, record.lon]);
  if (!path.length) return;

  const polyline = L.polyline(path, {
    color: '#0A84FF',
    weight: 4,
    opacity: 0.82
  }).addTo(adminRouteLayer);

  history.forEach((record, index) => {
    const isFirst = index === 0;
    const isLast = index === history.length - 1;

    const marker = L.circleMarker([record.lat, record.lon], {
      radius: isLast ? 7 : 5,
      color: '#FFFFFF',
      weight: 2,
      fillColor: isFirst ? '#34C759' : (isLast ? '#FF3B30' : '#0A84FF'),
      fillOpacity: 0.95
    }).addTo(adminRouteLayer);

    marker.bindPopup(`
      <div style="min-width:180px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${escapeHtml(selectedRow.name)}</div>
        <div style="font-size:12px;color:#666;line-height:1.45;">${escapeHtml(formatDate(record.capturedAt))}</div>
        <div style="font-size:12px;color:#666;line-height:1.45;margin-top:6px;">${escapeHtml(getTrackingSourceLabel(record.source))}</div>
      </div>
    `);
  });

  if (path.length === 1) {
    adminMap.setView(path[0], 11);
    return;
  }

  adminMap.fitBounds(polyline.getBounds(), { padding: [24, 24] });
}

async function buildExcelRows() {
  const userRows = getRows();

  const groups = await Promise.all(userRows.map(async row => {
    const history = getUserHistory(row.email);
    const firstRecord = history[0] || row;
    const lastRecord = history[history.length - 1] || row;
    const declaredRegion = row.region ? translateRegionValue(row.region) : t('admin.regionMissing');
    const resolvedHistory = await Promise.all(history.map(async record => ({
      record,
      location: await resolveMunicipalityFromCoordinates(record.lat, record.lon)
    })));
    const firstLocation = resolvedHistory[0]?.location || {};

    return resolvedHistory.map(({ record, location }, index) => ({
      Usuario: row.name,
      Email: row.email,
      'Municipio registro': firstLocation.municipality || row.town || t('admin.townMissing'),
      'CCAA registro': firstLocation.region || declaredRegion,
      'Municipio punto': location.municipality || t('admin.townMissing'),
      'CCAA punto': location.region || t('admin.regionMissing'),
      'Primer registro': formatDate(firstRecord.capturedAt),
      'Ultimo tracking': formatDate(lastRecord.capturedAt),
      'Total registros': row.recordsCount,
      'Fecha del punto': formatDate(record.capturedAt),
      Latitud: record.lat.toFixed(6),
      Longitud: record.lon.toFixed(6),
      'Precision (m)': record.accuracy ? String(Math.round(record.accuracy)) : '',
      Origen: getTrackingSourceLabel(record.source),
      'Es ultimo tracking': index === (resolvedHistory.length - 1) ? 'Si' : 'No'
    }));
  }));

  return groups.flat();
}

function downloadHtmlTableAsExcel(rows) {
  const headers = Object.keys(rows[0] || {});
  const tableHtml = `
    <html>
      <head>
        <meta charset="utf-8"/>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>${headers.map(header => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([`\ufeff${tableHtml}`], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `arraigo-tracking-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAdminTrackingExcel() {
  try {
    const rows = await buildExcelRows();
    if (!rows.length) {
      toast(t('admin.excelEmpty'));
      return;
    }

    downloadHtmlTableAsExcel(rows);
    toast(t('admin.excelReady'));
  } catch (error) {
    console.error('No se pudo preparar el Excel del panel admin:', error);
    toast(t('admin.excelError'));
  }
}

export function initAdminMap() {
  if (!DB.isAdminSession() || !isAdminScreenVisible()) return;

  const map = ensureAdminMap();
  if (!map) return;

  const repaint = () => {
    map.invalidateSize({ pan: false });
    renderAdminMarkers(resolveSelection(getRows()));
  };

  repaint();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!adminMap || !isAdminScreenVisible()) return;
      repaint();
    });
  });
}

export function focusAdminUser(email) {
  selectedEmail = decodeURIComponent(email);
  forceAllView = false;
  renderAdminScreen();

  const marker = markerByEmail.get(selectedEmail);
  if (!marker || !adminMap) return;

  marker.openPopup();
}

export function resetAdminSelection() {
  selectedEmail = null;
  forceAllView = true;
  renderAdminScreen();
}

export function renderAdminScreen() {
  if (!DB.isAdminSession()) {
    toast(t('admin.adminOnly'));
    return;
  }

  const selectedRow = resolveSelection(getRows());
  renderAdminList(selectedRow);
  if (isAdminScreenVisible()) initAdminMap();
}

export function openAdminScreen() {
  if (!DB.isAdminSession()) {
    toast(t('admin.adminOnly'));
    return;
  }

  if (typeof window.switchTo === 'function') window.switchTo('s-admin');
  setTimeout(renderAdminScreen, 120);
}

export function initAdmin() {
  setHomeAdminVisibility();

  window.addEventListener('arraigo:session-changed', () => {
    setHomeAdminVisibility();
    if (DB.isAdminSession() && isAdminScreenVisible()) {
      renderAdminScreen();
      return;
    }

    if (!DB.isAdminSession()) resetAdminMapState();

    const adminScreen = document.getElementById('s-admin');
    if (adminScreen?.classList.contains('active') && typeof window.switchTo === 'function') {
      window.switchTo('s-home');
    }
  });

  window.addEventListener('arraigo:location-captured', () => {
    if (DB.isAdminSession() && isAdminScreenVisible()) renderAdminScreen();
  });

  window.addEventListener('arraigo:language-changed', () => {
    if (DB.isAdminSession() && isAdminScreenVisible()) renderAdminScreen();
    setHomeAdminVisibility();
  });
}

window.openAdminScreen = openAdminScreen;
window.renderAdminScreen = renderAdminScreen;
window.initAdminMap = initAdminMap;
window.focusAdminUser = focusAdminUser;
window.resetAdminSelection = resetAdminSelection;
window.downloadAdminTrackingExcel = downloadAdminTrackingExcel;
