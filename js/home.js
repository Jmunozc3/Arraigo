// ══════════════════════════════════
// home.js — Inicio, accesos rápidos y noticias
// ══════════════════════════════════

import { DB } from './db.js';
import { escapeHtml, openExternalUrl, toast } from './utils.js';
import { getIntlLocale, t } from './i18n.js';

const SEPE_URL = 'https://www.sepe.es/HomeSepe/';
const NEWS_SEARCH_URL = 'https://news.google.com/search?q=empleo+rural+OR+despoblacion+OR+pueblos+Espana&hl=es&gl=ES&ceid=ES:es';
const NEWS_FEED_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dempleo%2520rural%2520OR%2520despoblacion%2520OR%2520pueblos%2520Espana%26hl%3Des%26gl%3DES%26ceid%3DES%3Aes';
const HOME_NEWS_CACHE_KEY = 'arraigo_home_news_cache_v1';
const HOME_NEWS_CACHE_TTL_MS = 30 * 60 * 1000;

const NEWS_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80',
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=900&q=80',
  'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=900&q=80'
];

let homeNewsItems = [];
let homeNewsStatusMode = 'loading';

function getNotificationTypeLabel(type) {
  if (type === 'job') return t('notifications.typeJob');
  if (type === 'community') return t('notifications.typeCommunity');
  return t('notifications.typeSystem');
}

function ensureNotificationExamples() {
  const meta = DB.getNotificationMeta();
  if (meta.examplesSeeded) return;

  DB.addNotification({
    type: 'system',
    title: t('notifications.welcomeTitle'),
    body: t('notifications.welcomeBody'),
    isRead: false
  });

  DB.saveNotificationMeta({
    ...meta,
    examplesSeeded: true
  });
}

function renderNotificationBadge() {
  const badge = document.getElementById('home-notification-badge');
  if (!badge) return;

  const unread = DB.getUnreadNotificationsCount();
  if (!unread) {
    badge.style.display = 'none';
    badge.textContent = '0';
    return;
  }

  badge.style.display = 'flex';
  badge.textContent = unread > 9 ? '9+' : String(unread);
}

function renderNotificationsList() {
  const list = document.getElementById('notifications-list');
  const empty = document.getElementById('notifications-empty');
  if (!list || !empty) return;

  const notifications = DB.getNotifications();
  if (!notifications.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = t('notifications.empty');
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = notifications.map(notification => `
    <button class="cell" style="width:100%;background:none;border:none;text-align:left;${notification.isRead ? '' : 'background:rgba(0,122,255,0.05);'}" onclick="openNotificationAction('${notification.id}')">
      <div style="width:40px;height:40px;border-radius:12px;background:${notification.type === 'job' ? 'rgba(0,122,255,0.12)' : (notification.type === 'community' ? 'rgba(52,199,89,0.14)' : 'rgba(255,149,0,0.14)')};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          ${notification.type === 'job'
            ? '<rect x="2" y="7" width="20" height="15" rx="2" stroke="#007AFF" stroke-width="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#007AFF" stroke-width="1.8"/>'
            : notification.type === 'community'
              ? '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="#34C759" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="4" stroke="#34C759" stroke-width="1.8"/><path d="M22 21v-2a4 4 0 00-3-3.87" stroke="#34C759" stroke-width="1.8" stroke-linecap="round"/><path d="M16 3.13a4 4 0 010 7.75" stroke="#34C759" stroke-width="1.8" stroke-linecap="round"/>'
              : '<path d="M12 2v12" stroke="#FF9500" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="18" r="1.4" fill="#FF9500"/><path d="M10.3 3.9L3.7 15.3a2 2 0 001.7 3h13.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="#FF9500" stroke-width="1.8" stroke-linejoin="round"/>'}
        </svg>
      </div>
      <div class="cell-content">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <div class="cell-title" style="font-size:15px;font-weight:700;">${escapeHtml(notification.title)}</div>
          <span class="badge ${notification.isRead ? 'badge-green-fill' : 'badge-blue-fill'}">${escapeHtml(getNotificationTypeLabel(notification.type))}</span>
        </div>
        <div class="cell-subtitle" style="margin-top:6px;line-height:1.45;">${escapeHtml(notification.body)}</div>
        <div style="font-size:12px;color:var(--label2);margin-top:8px;">${escapeHtml(formatRelativeTime(notification.createdAt))}</div>
      </div>
      <svg viewBox="0 0 24 24" width="8" height="13" fill="none"><path d="M9 18l6-6-6-6" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round"/></svg>
    </button>`).join('');
}

function syncNotificationsUi() {
  renderNotificationBadge();
  renderNotificationsList();
}

function formatRelativeTime(dateValue) {
  const formatter = new Intl.RelativeTimeFormat(getIntlLocale(), { numeric: 'auto' });
  if (!dateValue) return formatter.format(0, 'day');

  const normalizedValue = typeof dateValue === 'number'
    ? dateValue
    : String(dateValue).replace(' ', 'T');
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return formatter.format(0, 'day');

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

function getCachedHomeNews() {
  try {
    return JSON.parse(localStorage.getItem(HOME_NEWS_CACHE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function saveCachedHomeNews(items) {
  localStorage.setItem(HOME_NEWS_CACHE_KEY, JSON.stringify({
    fetchedAt: Date.now(),
    items
  }));
}

function splitHeadline(rawTitle) {
  const title = String(rawTitle || '').trim();
  const lastSeparator = title.lastIndexOf(' - ');

  if (lastSeparator <= 0) {
    return { title, source: 'Google News' };
  }

  return {
    title: title.slice(0, lastSeparator).trim(),
    source: title.slice(lastSeparator + 3).trim() || 'Google News'
  };
}

function normalizeNewsItem(item, index) {
  const headline = splitHeadline(item?.title);
  return {
    id: item?.guid || item?.link || `news-${index}`,
    title: headline.title,
    source: headline.source,
    link: item?.link || NEWS_SEARCH_URL,
    publishedAt: item?.pubDate || '',
    image: item?.thumbnail || NEWS_FALLBACK_IMAGES[index % NEWS_FALLBACK_IMAGES.length]
  };
}

function setHomeNewsStatus(message, isError = false, mode = 'loading') {
  const status = document.getElementById('home-news-status');
  if (!status) return;

  homeNewsStatusMode = mode;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function renderHomeNewsStatus() {
  const cached = getCachedHomeNews();

  if (homeNewsStatusMode === 'cached-error') {
    setHomeNewsStatus(t('homeNews.cachedError'), true, 'cached-error');
    return;
  }

  if (homeNewsStatusMode === 'failed') {
    setHomeNewsStatus(t('homeNews.failed'), true, 'failed');
    return;
  }

  if (homeNewsStatusMode === 'updating') {
    setHomeNewsStatus(t('homeNews.updating'), false, 'updating');
    return;
  }

  if (cached?.fetchedAt) {
    setHomeNewsStatus(
      t('homeNews.updated', { relative: formatRelativeTime(cached.fetchedAt) }),
      false,
      'updated'
    );
    return;
  }

  setHomeNewsStatus(t('homeNews.loading'), false, 'loading');
}

function renderHomeNewsList(items) {
  const featured = document.getElementById('home-news-featured');
  const list = document.getElementById('home-news-list');
  const listWrap = document.getElementById('home-news-list-wrap');

  if (!featured || !list || !listWrap) return;

  if (!items.length) {
    featured.innerHTML = `
      <div class="empty-state" style="margin-top:0;">
        <div class="empty-title">${escapeHtml(t('homeNews.emptyTitle'))}</div>
        <div class="empty-copy">${escapeHtml(t('homeNews.emptyCopy'))}</div>
        <button class="btn btn-gray btn-h44" style="margin:16px auto 0;padding:0 18px;" onclick="refreshHomeNews()">${escapeHtml(t('homeNews.retry'))}</button>
      </div>`;
    list.innerHTML = '';
    listWrap.style.display = 'none';
    return;
  }

  const [firstItem, ...restItems] = items;

  featured.innerHTML = `
    <button class="news-featured" onclick="openHomeNews(0)">
      <div style="position:relative;height:190px;">
        <img src="${escapeHtml(firstItem.image)}" style="width:100%;height:100%;object-fit:cover;" alt="${escapeHtml(firstItem.title)}"/>
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.72),transparent);display:flex;flex-direction:column;justify-content:flex-end;padding:16px;">
          <span class="badge badge-blue-fill" style="align-self:flex-start;margin-bottom:8px;">${escapeHtml(t('homeNews.featuredBadge'))}</span>
          <div style="font-size:17px;font-weight:700;color:#fff;letter-spacing:-0.3px;line-height:1.3;">${escapeHtml(firstItem.title)}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.72);margin-top:5px;">${escapeHtml(formatRelativeTime(firstItem.publishedAt))} · ${escapeHtml(firstItem.source)}</div>
        </div>
      </div>
    </button>`;

  list.innerHTML = restItems.map((item, index) => `
    <button class="cell news-cell" onclick="openHomeNews(${index + 1})">
      <img src="${escapeHtml(item.image)}" style="width:50px;height:50px;border-radius:10px;object-fit:cover;flex-shrink:0;" alt="${escapeHtml(item.title)}"/>
      <div class="cell-content">
        <div class="news-kicker">${escapeHtml(item.source)}</div>
        <div class="cell-title" style="font-size:15px;font-weight:600;line-height:1.35;">${escapeHtml(item.title)}</div>
        <div class="news-meta">${escapeHtml(formatRelativeTime(item.publishedAt))}</div>
      </div>
      <svg viewBox="0 0 24 24" width="8" height="13" fill="none"><path d="M9 18l6-6-6-6" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round"/></svg>
    </button>`).join('');

  listWrap.style.display = restItems.length ? 'block' : 'none';
}

async function loadHomeNews(forceRefresh = false) {
  const cached = getCachedHomeNews();
  const cacheIsFresh = cached?.fetchedAt && (Date.now() - cached.fetchedAt) < HOME_NEWS_CACHE_TTL_MS;

  if (!forceRefresh && cacheIsFresh && Array.isArray(cached?.items) && cached.items.length) {
    homeNewsItems = cached.items;
    renderHomeNewsList(homeNewsItems);
    homeNewsStatusMode = 'updated';
    renderHomeNewsStatus();
    return;
  }

  if (Array.isArray(cached?.items) && cached.items.length) {
    homeNewsItems = cached.items;
    renderHomeNewsList(homeNewsItems);
  }

  setHomeNewsStatus(t('homeNews.updating'), false, 'updating');

  try {
    const response = await fetch(NEWS_FEED_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const items = Array.isArray(payload?.items)
      ? payload.items.slice(0, 8).map(normalizeNewsItem).filter(item => item.title)
      : [];

    if (!items.length) throw new Error('Sin elementos en el feed');

    homeNewsItems = items;
    saveCachedHomeNews(items);
    renderHomeNewsList(items);
    homeNewsStatusMode = 'updated';
    renderHomeNewsStatus();
  } catch (error) {
    console.error('No se pudieron cargar las noticias:', error);

    if (Array.isArray(cached?.items) && cached.items.length) {
      homeNewsItems = cached.items;
      renderHomeNewsList(homeNewsItems);
      setHomeNewsStatus(t('homeNews.cachedError'), true, 'cached-error');
      return;
    }

    homeNewsItems = [];
    renderHomeNewsList([]);
    setHomeNewsStatus(t('homeNews.failed'), true, 'failed');
  }
}

function rerenderHomeLanguage() {
  updateHomeQuickAccess();
  renderHomeNewsList(homeNewsItems);
  renderHomeNewsStatus();
  renderNotificationsList();
  renderNotificationBadge();
}

export function openNotifications() {
  const modal = document.getElementById('notifications-modal');
  if (!modal) return;

  renderNotificationsList();
  modal.style.display = 'flex';
  DB.markAllNotificationsRead();
  renderNotificationsList();
  renderNotificationBadge();
}

export function closeNotifications() {
  const modal = document.getElementById('notifications-modal');
  if (modal) modal.style.display = 'none';
}

export function openNotificationAction(notificationId) {
  const notification = DB.getNotifications().find(item => item.id === notificationId);
  if (!notification) return;

  closeNotifications();

  if (notification.actionType === 'job' && notification.actionTargetId) {
    if (typeof window.switchTo === 'function') window.switchTo('s-jobs');
    if (typeof window.openJobDetails === 'function') {
      setTimeout(() => window.openJobDetails(notification.actionTargetId), 80);
    }
    return;
  }

  if (notification.actionType === 'community') {
    if (typeof window.switchTo === 'function') window.switchTo('s-communities');
    return;
  }

  toast(t('notifications.opened'));
}

export function openSepeWebsite() {
  openExternalUrl(SEPE_URL);
}

export function openSepeShortcut() {
  openSepeWebsite();
}

export function updateHomeQuickAccess() {
  const savedCopy = document.getElementById('home-saved-copy');
  if (!savedCopy) return;

  const savedJobs = DB.getSavedJobs().length;
  const savedTowns = DB.getSavedTowns().length;

  if (!savedJobs && !savedTowns) {
    savedCopy.textContent = t('home.savedDefault');
    return;
  }

  const format = new Intl.NumberFormat(getIntlLocale());
  savedCopy.textContent = `${format.format(savedJobs)} ${t('common.jobs').toLowerCase()} · ${format.format(savedTowns)} ${t('common.towns').toLowerCase()}`;
}

export function refreshHomeNews() {
  return loadHomeNews(true);
}

export function openHomeNews(index) {
  const item = homeNewsItems[Number(index)] || null;
  openExternalUrl(item?.link || NEWS_SEARCH_URL);
}

export function initHome() {
  ensureNotificationExamples();
  updateHomeQuickAccess();
  renderHomeNewsStatus();
  syncNotificationsUi();
  loadHomeNews();

  window.addEventListener('arraigo:saved-changed', updateHomeQuickAccess);
  window.addEventListener('arraigo:language-changed', rerenderHomeLanguage);
  window.addEventListener('arraigo:notifications-changed', syncNotificationsUi);
  window.addEventListener('focus', () => {
    const cached = getCachedHomeNews();
    const isStale = !cached?.fetchedAt || (Date.now() - cached.fetchedAt) > HOME_NEWS_CACHE_TTL_MS;
    if (isStale) loadHomeNews();
  });
}

window.openNotifications = openNotifications;
window.closeNotifications = closeNotifications;
window.openNotificationAction = openNotificationAction;
window.openSepeWebsite = openSepeWebsite;
window.openSepeShortcut = openSepeShortcut;
window.refreshHomeNews = refreshHomeNews;
window.openHomeNews = openHomeNews;
