// ══════════════════════════════════
// jobs.js — Pantalla de Empleo
// ══════════════════════════════════

import { DB } from './db.js';
import { escapeHtml, emitAppEvent, openExternalUrl, toast } from './utils.js';
import { JOBS_DATA } from './jobs-data.js';
import { getIntlLocale, t, translateLocationLabel } from './i18n.js';

let activeCategory = 'Todos';
let searchTerm = '';
let currentJobId = null;
let adminJobImageDraft = '';

function buildJobPlaceholder(title = 'Oferta') {
  const safeTitle = String(title || 'Oferta').slice(0, 36);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0A84FF"/>
          <stop offset="100%" stop-color="#34C759"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" rx="72" fill="url(#bg)"/>
      <circle cx="1010" cy="140" r="150" fill="rgba(255,255,255,0.12)"/>
      <circle cx="180" cy="610" r="130" fill="rgba(255,255,255,0.10)"/>
      <rect x="150" y="140" width="900" height="440" rx="40" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.22)" stroke-width="10"/>
      <rect x="215" y="225" width="150" height="150" rx="30" fill="rgba(255,255,255,0.92)"/>
      <path d="M273 258v84M231 300h84" stroke="#0A84FF" stroke-width="22" stroke-linecap="round"/>
      <rect x="420" y="235" width="430" height="40" rx="20" fill="rgba(255,255,255,0.92)"/>
      <rect x="420" y="302" width="300" height="28" rx="14" fill="rgba(255,255,255,0.68)"/>
      <rect x="215" y="425" width="625" height="26" rx="13" fill="rgba(255,255,255,0.92)"/>
      <rect x="215" y="470" width="505" height="26" rx="13" fill="rgba(255,255,255,0.62)"/>
      <text x="215" y="640" font-size="54" font-family="Arial, sans-serif" font-weight="700" fill="rgba(255,255,255,0.96)">${escapeHtml(safeTitle)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getAllJobsData() {
  return [...DB.getCustomJobs(), ...JOBS_DATA];
}

function getVisibleJobsData() {
  return getAllJobsData().filter(job => !DB.isJobHidden(job.id));
}

function formatCount(value) {
  return new Intl.NumberFormat(getIntlLocale()).format(value || 0);
}

function getJobById(id) {
  return getVisibleJobsData().find(job => job.id === id) || null;
}

function getBadgeClass(tone) {
  if (tone === 'red') return 'badge badge-red-fill';
  if (tone === 'green') return 'badge badge-green-fill';
  return 'badge badge-blue-fill';
}

function translateJobCategory(value) {
  return t(`jobs.categoryMap.${value}`) || value;
}

function translateJobContract(value) {
  return t(`jobs.contractMap.${value}`) || value;
}

function translateJobMode(value) {
  return t(`jobs.modeMap.${value}`) || value;
}

function translateJobSchedule(value) {
  return t(`jobs.scheduleMap.${value}`) || value;
}

function translateJobBadge(value) {
  return t(`jobs.badgeMap.${value}`) || value;
}

function getBookmarkIcon(saved) {
  if (saved) {
    return `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#007AFF" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path>
      </svg>`;
  }

  return `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="#8E8E93" stroke-width="2"></path>
      </svg>`;
}

function readJobFormValue(id) {
  const element = document.getElementById(id);
  return typeof element?.value === 'string' ? element.value.trim() : '';
}

function readJobFormLines(id) {
  return readJobFormValue(id)
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function syncAdminJobComposer() {
  const isAdmin = DB.isAdminSession();
  const adminLabel = document.getElementById('jobs-admin-label');
  const adminCard = document.getElementById('jobs-admin-card');

  if (adminLabel) adminLabel.style.display = isAdmin ? 'block' : 'none';
  if (adminCard) adminCard.style.display = isAdmin ? 'block' : 'none';

  syncAdminJobImagePreview(adminJobImageDraft, readJobFormValue('job-title'));
}

function syncAdminJobImagePreview(image = '', title = '') {
  const preview = document.getElementById('job-image-preview');
  if (!preview) return;

  const fallbackImage = buildJobPlaceholder(title || t('jobs.title'));
  preview.onerror = () => {
    preview.onerror = null;
    preview.src = fallbackImage;
  };
  preview.src = image || fallbackImage;
}

function clearAdminJobForm() {
  [
    'job-company',
    'job-title',
    'job-salary',
    'job-location',
    'job-summary',
    'job-description',
    'job-requirements',
    'job-benefits',
    'job-contact'
  ].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });

  ['job-category', 'job-badge-label', 'job-badge-tone', 'job-type', 'job-schedule', 'job-mode'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.selectedIndex = 0;
  });

  const imageInput = document.getElementById('job-image-input');
  if (imageInput) imageInput.value = '';

  adminJobImageDraft = '';
  syncAdminJobImagePreview('', '');
}

export function handleJobImageChange(event) {
  const file = event?.target?.files?.[0];
  if (!file) {
    adminJobImageDraft = '';
    syncAdminJobImagePreview('', readJobFormValue('job-title'));
    return;
  }

  const reader = new FileReader();
  reader.onload = loadEvent => {
    adminJobImageDraft = String(loadEvent.target?.result || '');
    syncAdminJobImagePreview(adminJobImageDraft, readJobFormValue('job-title'));
  };
  reader.readAsDataURL(file);
}

export function syncJobTitlePreview() {
  if (adminJobImageDraft) return;
  syncAdminJobImagePreview('', readJobFormValue('job-title'));
}

function matchesJobFilters(job) {
  const matchesCategory = activeCategory === 'Todos' || job.category === activeCategory;
  if (!matchesCategory) return false;

  if (!searchTerm) return true;

  const haystack = [
    job.title,
    job.company,
    job.location,
    translateLocationLabel(job.location),
    job.category,
    translateJobCategory(job.category),
    job.summary
  ].join(' ').toLowerCase();

  return haystack.includes(searchTerm);
}

function getFilteredJobs() {
  return getVisibleJobsData().filter(matchesJobFilters);
}

function syncJobFilterChips() {
  document.querySelectorAll('#jobs-filters .chip').forEach(chip => {
    const isActive = chip.dataset.category === activeCategory;
    chip.classList.toggle('chip-active', isActive);
    chip.classList.toggle('chip-inactive', !isActive);
  });
}

function renderJobCard(job) {
  const saved = DB.isJobSaved(job.id);
  const canModerate = DB.isAdminSession();

  return `
    <article class="job-card">
      <div class="job-card-img">
        <img src="${escapeHtml(job.image)}" alt="${escapeHtml(job.title)}"/>
        <div class="badge-abs"><span class="${getBadgeClass(job.badge.tone)}">${escapeHtml(translateJobBadge(job.badge.label))}</span></div>
        <button
          class="save-btn${saved ? ' saved' : ''}"
          style="${saved ? 'background:rgba(0,122,255,0.15);' : ''}"
          onclick="toggleSavedJob('${job.id}', event)"
          aria-label="${escapeHtml(saved ? t('jobs.unsave') : t('jobs.save'))}"
        >
          ${getBookmarkIcon(saved)}
        </button>
      </div>
      <div class="job-body">
        <div class="job-company">${escapeHtml(job.company)}</div>
        <div class="job-title-row">
          <div class="job-name">${escapeHtml(job.title)}</div>
          <div class="job-price">${escapeHtml(job.salary)}</div>
        </div>
        <div class="job-meta-row">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#007AFF" stroke-width="1.8"></path><circle cx="12" cy="10" r="3" stroke="#007AFF" stroke-width="1.8"></circle></svg>
          ${escapeHtml(translateLocationLabel(job.location))}
        </div>
        <div class="job-meta-row">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true"><rect x="2" y="7" width="20" height="15" rx="2" stroke="#8E8E93" stroke-width="1.8"></rect><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#8E8E93" stroke-width="1.8"></path></svg>
          ${escapeHtml(translateJobSchedule(job.schedule))} · ${escapeHtml(translateJobContract(job.type))}
        </div>
        <div class="job-meta-row">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true"><path d="M4 8h16M4 12h10M4 16h8" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round"></path></svg>
          ${escapeHtml(job.summary)}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-tinted btn-h36" style="flex:1;" onclick="openJobDetails('${job.id}')">${escapeHtml(t('jobs.details'))}</button>
          ${canModerate
            ? `<button class="btn btn-red btn-h36" style="padding:0 14px;" onclick="deleteJob('${job.id}', event)">${escapeHtml(t('jobs.delete'))}</button>`
            : ''}
        </div>
      </div>
    </article>`;
}

function renderJobsSummary(count) {
  const summary = document.getElementById('jobs-summary');
  if (!summary) return;

  const countCopy = formatCount(count);
  const baseCopy = count === 1
    ? t('jobs.visibleOne')
    : t('jobs.visibleOther', { count: countCopy });
  const categoryCopy = activeCategory !== 'Todos' ? ` · ${translateJobCategory(activeCategory)}` : '';
  summary.textContent = `${baseCopy}${categoryCopy}`;
}

function renderEmptyJobs() {
  return `
    <div class="empty-state">
      <div class="empty-title">${escapeHtml(t('jobs.emptyTitle'))}</div>
      <div class="empty-copy">${escapeHtml(t('jobs.emptyCopy'))}</div>
      <button class="btn btn-gray btn-h44" style="margin:16px auto 0;padding:0 18px;" onclick="resetJobFilters()">${escapeHtml(t('jobs.clear'))}</button>
    </div>`;
}

function syncJobNotifications() {
  return undefined;
}

export function renderJobs() {
  const container = document.getElementById('jobs-list');
  if (!container) return;

  syncAdminJobComposer();

  const jobs = getFilteredJobs();
  renderJobsSummary(jobs.length);

  container.innerHTML = jobs.length
    ? jobs.map(renderJobCard).join('')
    : renderEmptyJobs();
}

function renderJobDetails(job) {
  const content = document.getElementById('job-detail-content');
  if (!content) return;

  const saved = DB.isJobSaved(job.id);
  const canModerate = DB.isAdminSession();
  const requirements = job.requirements.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const benefits = job.benefits.map(item => `<li>${escapeHtml(item)}</li>`).join('');

  content.innerHTML = `
    <div class="detail-hero">
      <img src="${escapeHtml(job.image)}" alt="${escapeHtml(job.title)}"/>
      <div class="detail-hero-copy">
        <div class="${getBadgeClass(job.badge.tone)}" style="margin-bottom:10px;">${escapeHtml(translateJobBadge(job.badge.label))}</div>
        <div class="detail-title">${escapeHtml(job.title)}</div>
        <div class="detail-subtitle">${escapeHtml(job.company)} · ${escapeHtml(translateLocationLabel(job.location))}</div>
      </div>
    </div>
    <div class="detail-scroll-body">
      <div class="detail-metrics">
        <div class="detail-metric">
          <div class="detail-metric-value">${escapeHtml(job.salary)}</div>
          <div class="detail-metric-label">${escapeHtml(t('jobs.salary'))}</div>
        </div>
        <div class="detail-metric">
          <div class="detail-metric-value">${escapeHtml(translateJobContract(job.type))}</div>
          <div class="detail-metric-label">${escapeHtml(t('jobs.contract'))}</div>
        </div>
        <div class="detail-metric">
          <div class="detail-metric-value">${escapeHtml(translateJobMode(job.mode))}</div>
          <div class="detail-metric-label">${escapeHtml(t('jobs.mode'))}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">${escapeHtml(t('jobs.summary'))}</div>
        <div class="detail-paragraph">${escapeHtml(job.description)}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">${escapeHtml(t('jobs.requirements'))}</div>
        <ul class="detail-list">${requirements}</ul>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">${escapeHtml(t('jobs.benefits'))}</div>
        <ul class="detail-list">${benefits}</ul>
      </div>

      <div class="detail-actions">
        <button class="btn ${saved ? 'btn-gray' : 'btn-filled'} btn-h44" style="flex:1;" onclick="toggleSavedJob('${job.id}', event)">
          ${escapeHtml(saved ? t('jobs.unsave') : t('jobs.save'))}
        </button>
        <button class="btn btn-tinted btn-h44" style="flex:1;" onclick="openJobContact('${job.id}')">${escapeHtml(t('jobs.contact'))}</button>
        ${canModerate
          ? `<button class="btn btn-red btn-h44" style="flex:1;" onclick="deleteJob('${job.id}', event)">${escapeHtml(t('jobs.delete'))}</button>`
          : ''}
      </div>
    </div>`;
}

export function openJobDetails(id) {
  const job = getJobById(id);
  const modal = document.getElementById('job-detail-modal');
  if (!job || !modal) return;

  currentJobId = id;
  renderJobDetails(job);
  modal.style.display = 'flex';
}

export function closeJobDetails() {
  const modal = document.getElementById('job-detail-modal');
  if (modal) modal.style.display = 'none';
  currentJobId = null;
}

export function openJobContact(id = currentJobId) {
  const job = getJobById(id);
  if (!job?.contactUrl) return;
  openExternalUrl(job.contactUrl);
}

export async function toggleSavedJob(id, event) {
  if (event) event.stopPropagation();

  const job = getJobById(id);
  if (!job) return;

  try {
    const saved = await DB.toggleSavedJob(job);
    if (saved == null) {
      toast('Inicia sesión para guardar ofertas.');
      if (typeof window.go === 'function') window.go('s-login');
      return;
    }

    toast(saved ? t('jobs.save') : t('jobs.unsave'));

    renderJobs();
    if (currentJobId === id) renderJobDetails(job);
    emitAppEvent('arraigo:saved-changed', { type: 'job', id, saved });
  } catch (error) {
    console.error('No se pudo actualizar la oferta guardada:', error);
    toast('No se pudo guardar la oferta.');
  }
}

export async function deleteJob(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (!DB.isAdminSession()) {
    toast(t('jobs.deleteForbidden'));
    return;
  }

  try {
    const deleted = await DB.hideJob(id);
    if (!deleted) {
      toast(t('jobs.deleteForbidden'));
      return;
    }

    if (currentJobId === id) closeJobDetails();
    renderJobs();
    emitAppEvent('arraigo:saved-changed', { type: 'job', id, hidden: true });
    toast(t('jobs.deleted'));
  } catch (error) {
    console.error('No se pudo eliminar la oferta:', error);
    toast('No se pudo eliminar la oferta.');
  }
}

export async function saveAdminJob() {
  if (!DB.isAdminSession()) {
    toast(t('jobs.adminOnlyComposer'));
    return;
  }

  try {
    const job = await DB.createJob({
      category: readJobFormValue('job-category'),
      badge: {
        label: readJobFormValue('job-badge-label'),
        tone: readJobFormValue('job-badge-tone')
      },
      company: readJobFormValue('job-company'),
      title: readJobFormValue('job-title'),
      salary: readJobFormValue('job-salary'),
      location: readJobFormValue('job-location'),
      type: readJobFormValue('job-type'),
      schedule: readJobFormValue('job-schedule'),
      mode: readJobFormValue('job-mode'),
      image: adminJobImageDraft || buildJobPlaceholder(readJobFormValue('job-title')),
      summary: readJobFormValue('job-summary'),
      description: readJobFormValue('job-description'),
      requirements: readJobFormLines('job-requirements'),
      benefits: readJobFormLines('job-benefits'),
      contactUrl: readJobFormValue('job-contact')
    });

    if (!job) {
      toast(t('jobs.adminRequiredFields'));
      return;
    }

    clearAdminJobForm();
    renderJobs();
    emitAppEvent('arraigo:notifications-changed');
    emitAppEvent('arraigo:jobs-changed', { type: 'created', id: job.id });
    toast(t('jobs.created'));
  } catch (error) {
    console.error('No se pudo crear la oferta:', error);
    toast('No se pudo crear la oferta.');
  }
}

export function setJobFilter(category, event) {
  if (event) event.preventDefault();
  activeCategory = category || 'Todos';
  syncJobFilterChips();
  renderJobs();
}

export function resetJobFilters() {
  activeCategory = 'Todos';
  searchTerm = '';

  const input = document.getElementById('jobs-search');
  if (input) input.value = '';

  syncJobFilterChips();
  renderJobs();
}

export function initJobs() {
  syncJobNotifications();
  syncAdminJobComposer();

  const search = document.getElementById('jobs-search');
  if (search) {
    search.addEventListener('input', event => {
      searchTerm = event.target.value.trim().toLowerCase();
      renderJobs();
    });
  }

  window.addEventListener('arraigo:saved-changed', event => {
    if (event.detail?.type !== 'job') return;
    renderJobs();
    if (currentJobId) {
      const job = getJobById(currentJobId);
      if (job) renderJobDetails(job);
    }
  });

  window.addEventListener('arraigo:language-changed', () => {
    renderJobs();
    if (currentJobId) {
      const job = getJobById(currentJobId);
      if (job) renderJobDetails(job);
    }
  });

  window.addEventListener('arraigo:session-changed', () => {
    syncAdminJobComposer();
    renderJobs();
  });

  window.addEventListener('arraigo:jobs-changed', () => {
    renderJobs();
    if (currentJobId) {
      const job = getJobById(currentJobId);
      if (job) renderJobDetails(job);
    }
  });

  syncJobFilterChips();
  renderJobs();
}

window.openJobDetails = openJobDetails;
window.closeJobDetails = closeJobDetails;
window.toggleSavedJob = toggleSavedJob;
window.openJobContact = openJobContact;
window.setJobFilter = setJobFilter;
window.resetJobFilters = resetJobFilters;
window.deleteJob = deleteJob;
window.handleJobImageChange = handleJobImageChange;
window.syncJobTitlePreview = syncJobTitlePreview;
window.saveAdminJob = saveAdminJob;
