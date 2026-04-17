// ══════════════════════════════════
// saved.js — Pantalla de Guardados
// ══════════════════════════════════

import { DB } from './db.js?v=20260417204131';
import { escapeHtml } from './utils.js?v=20260417204131';
import { getIntlLocale, t, translateLocationLabel, translateRegionValue } from './i18n.js?v=20260417204131';

let activePanelId = 'sp-jobs';

function formatPopulation(value) {
  return new Intl.NumberFormat(getIntlLocale()).format(value || 0);
}

function getTownProfileLabel(town) {
  if (!town?.population) return '';
  if (town.population < 1000) return t('towns.profiles.micro');
  if (town.population < 5000) return t('towns.profiles.small');
  return t('towns.profiles.medium');
}

function renderEmptyState(title, copy, actionLabel, action) {
  return `
    <div class="empty-state">
      <div class="empty-title">${escapeHtml(title)}</div>
      <div class="empty-copy">${escapeHtml(copy)}</div>
      <button class="btn btn-filled btn-h44" style="margin:16px auto 0;padding:0 18px;" onclick="${escapeHtml(action)}">${escapeHtml(actionLabel)}</button>
    </div>`;
}

function renderSavedJobs() {
  const container = document.getElementById('saved-jobs-list');
  if (!container) return;

  const jobs = DB.getSavedJobs();
  if (!jobs.length) {
    container.innerHTML = renderEmptyState(
      t('saved.emptyJobsTitle'),
      t('saved.emptyJobsCopy'),
      t('saved.exploreJobs'),
      "switchTo('s-jobs')"
    );
    return;
  }

  container.innerHTML = jobs.map(job => `
    <div class="saved-card">
      <img src="${escapeHtml(job.image)}" alt="${escapeHtml(job.title)}"/>
      <div class="saved-card-body">
        <div>
          <div style="font-size:15px;font-weight:600;letter-spacing:-0.3px;">${escapeHtml(job.title)}</div>
          <div style="font-size:13px;color:var(--ios-blue);margin-top:2px;font-weight:500;">${escapeHtml(translateLocationLabel(job.location))}</div>
          <div style="font-size:13px;color:var(--label2);margin-top:4px;line-height:1.45;">${escapeHtml(job.summary)}</div>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--ios-green);margin-bottom:10px;">${escapeHtml(job.salary)}</div>
          <div class="saved-actions">
            <button class="btn btn-tinted btn-h36" style="flex:1;font-size:13px;" onclick="openJobDetails('${job.id}')">${escapeHtml(t('jobs.details'))}</button>
            <button class="btn btn-gray btn-h36" style="flex:1;font-size:13px;" onclick="toggleSavedJob('${job.id}', event)">${escapeHtml(t('saved.remove'))}</button>
          </div>
        </div>
      </div>
    </div>`).join('');
}

function renderSavedTowns() {
  const container = document.getElementById('saved-towns-list');
  if (!container) return;

  const towns = DB.getSavedTowns();
  if (!towns.length) {
    container.innerHTML = renderEmptyState(
      t('saved.emptyTownsTitle'),
      t('saved.emptyTownsCopy'),
      t('saved.exploreTowns'),
      "switchTo('s-towns')"
    );
    return;
  }

  container.innerHTML = towns.map(town => {
    const hasPopulation = Boolean(town.population);
    const metaCopy = hasPopulation
      ? `${formatPopulation(town.population)} ${t('towns.inhabitants')} · ${getTownProfileLabel(town)} · INE ${town.populationYear || 2025}`
      : t('towns.previewNote', { year: town.populationYear || 2025 });

    return `
      <div class="saved-card">
        <img src="${escapeHtml(town.image)}" alt="${escapeHtml(town.name)}"/>
        <div class="saved-card-body">
          <div>
            <div style="font-size:15px;font-weight:600;letter-spacing:-0.3px;">${escapeHtml(town.name)}</div>
            <div style="font-size:13px;color:var(--ios-blue);margin-top:2px;font-weight:500;">${escapeHtml(town.province)}, ${escapeHtml(translateRegionValue(town.region))}</div>
            <div style="font-size:13px;color:var(--label2);margin-top:4px;">${escapeHtml(metaCopy)}</div>
          </div>
          <div class="saved-actions">
            <button class="btn btn-tinted btn-h36" style="flex:1;font-size:13px;" onclick="openTownDetails('${town.id}')">${escapeHtml(t('towns.moreDetails'))}</button>
            <button class="btn btn-gray btn-h36" style="flex:1;font-size:13px;" onclick="focusTown('${town.id}')">${escapeHtml(t('towns.showMap'))}</button>
            <button class="btn btn-gray btn-h36" style="font-size:13px;" onclick="toggleSavedTown('${town.id}', event)">${escapeHtml(t('saved.remove'))}</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderSavedLists() {
  renderSavedJobs();
  renderSavedTowns();
}

function showSavedPanel(panelId) {
  activePanelId = panelId;

  document.querySelectorAll('#s-saved .seg-item').forEach(button => {
    const isActive = button.dataset.panel === panelId;
    button.classList.toggle('active', isActive);
  });

  document.querySelectorAll('#s-saved .saved-panel').forEach(panel => {
    panel.style.display = panel.id === panelId ? 'block' : 'none';
  });
}

export function savedTab(btn, panel) {
  if (btn?.dataset?.panel) {
    showSavedPanel(btn.dataset.panel);
    return;
  }

  showSavedPanel(panel);
}

export function openSavedScreen(panel = 'sp-jobs') {
  if (typeof window.switchTo === 'function') window.switchTo('s-saved');
  showSavedPanel(panel);
}

export function initSaved() {
  renderSavedLists();
  showSavedPanel(activePanelId);
  window.addEventListener('arraigo:saved-changed', renderSavedLists);
  window.addEventListener('arraigo:language-changed', renderSavedLists);
}

window.savedTab = savedTab;
window.openSavedScreen = openSavedScreen;
