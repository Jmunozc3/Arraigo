// ══════════════════════════════════
// communities.js — Comunidades y asociaciones
// ══════════════════════════════════

import { DB } from './db.js';
import { emitAppEvent, escapeHtml, openExternalUrl, toast } from './utils.js';
import { getIntlLocale, t } from './i18n.js';

let communityImageDraft = '';

function readValue(id) {
  const element = document.getElementById(id);
  return typeof element?.value === 'string' ? element.value.trim() : '';
}

function buildCommunityPlaceholder(title = 'Comunidad') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#1570EF"/>
          <stop offset="100%" stop-color="#2DCB70"/>
        </linearGradient>
        <linearGradient id="card" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.26)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.12)"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="140" fill="url(#bg)"/>
      <circle cx="940" cy="180" r="170" fill="rgba(255,255,255,0.10)"/>
      <circle cx="210" cy="960" r="150" fill="rgba(255,255,255,0.08)"/>
      <rect x="240" y="230" width="720" height="740" rx="92" fill="url(#card)" stroke="rgba(255,255,255,0.28)" stroke-width="16"/>
      <rect x="320" y="320" width="560" height="360" rx="54" fill="rgba(255,255,255,0.18)"/>
      <circle cx="735" cy="430" r="62" fill="rgba(255,255,255,0.88)"/>
      <path d="M355 635l145-155 112 100 118-145 150 200H355z" fill="rgba(255,255,255,0.92)"/>
      <rect x="320" y="760" width="430" height="48" rx="24" fill="rgba(255,255,255,0.86)"/>
      <rect x="320" y="835" width="300" height="36" rx="18" fill="rgba(255,255,255,0.62)"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeChatLink(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function getChatType(link) {
  const value = String(link || '').toLowerCase();
  if (value.includes('whatsapp') || value.includes('wa.me')) return 'whatsapp';
  if (value.includes('telegram') || value.includes('t.me')) return 'telegram';
  return 'link';
}

function getChatTypeLabel(chatType) {
  if (chatType === 'whatsapp') return t('communities.whatsapp');
  if (chatType === 'telegram') return t('communities.telegram');
  return t('communities.chat');
}

function formatCommunityDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return t('admin.noDate');
  return date.toLocaleString(getIntlLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function syncCommunityImagePreview(image = '', title = '') {
  const preview = document.getElementById('community-image-preview');
  if (!preview) return;
  const fallbackImage = buildCommunityPlaceholder(title || t('common.communities'));
  preview.onerror = () => {
    preview.onerror = null;
    preview.src = fallbackImage;
  };
  preview.src = image || fallbackImage;
}

function clearCommunityForm() {
  ['community-title', 'community-description', 'community-link'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });

  const imageInput = document.getElementById('community-image-input');
  if (imageInput) imageInput.value = '';

  communityImageDraft = '';
  syncCommunityImagePreview('', '');
}

function renderCommunitiesList() {
  const list = document.getElementById('communities-list');
  if (!list) return;

  const communities = DB.getCommunities();
  const session = DB.getSession();
  if (!communities.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-title">${escapeHtml(t('communities.emptyTitle'))}</div>
        <div class="empty-copy">${escapeHtml(t('communities.emptyCopy'))}</div>
      </div>`;
    return;
  }

  const sessionIsAdmin = session?.role === 'admin';
  list.innerHTML = communities.map(community => `
    <article class="community-card">
      <div class="community-cover">
        <img src="${escapeHtml(community.image || buildCommunityPlaceholder(community.title))}" alt="${escapeHtml(community.title)}" onerror="this.onerror=null;this.src='${escapeHtml(buildCommunityPlaceholder(community.title))}'"/>
      </div>
      <div class="community-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div>
            <div class="community-title">${escapeHtml(community.title)}</div>
            <div class="community-subtitle">${escapeHtml(community.createdByName)}</div>
          </div>
          <span class="badge badge-blue-fill">${escapeHtml(getChatTypeLabel(community.chatType || getChatType(community.chatLink)))}</span>
        </div>
        <div class="community-description">${escapeHtml(community.description)}</div>
        <div class="community-meta">${escapeHtml(t('communities.createdBy', {
          name: community.createdByName || community.createdByEmail,
          date: formatCommunityDate(community.createdAt)
        }))}</div>
        <div class="saved-actions" style="margin-top:14px;">
          <button class="btn btn-filled btn-h44" style="flex:1;" onclick="openCommunityChat('${community.id}')">${escapeHtml(t('communities.openChat'))}</button>
          ${(sessionIsAdmin || session?.email === community.createdByEmail)
            ? `<button class="btn btn-red btn-h44" style="flex:1;" onclick="deleteCommunity('${community.id}')">${escapeHtml(t('communities.delete'))}</button>`
            : ''}
        </div>
      </div>
    </article>`).join('');
}

export function handleCommunityImageChange(event) {
  const file = event?.target?.files?.[0];
  if (!file) {
    communityImageDraft = '';
    syncCommunityImagePreview('', readValue('community-title'));
    return;
  }

  const reader = new FileReader();
  reader.onload = loadEvent => {
    communityImageDraft = String(loadEvent.target?.result || '');
    syncCommunityImagePreview(communityImageDraft, readValue('community-title'));
  };
  reader.readAsDataURL(file);
}

export function syncCommunityTitlePreview() {
  if (communityImageDraft) return;
  syncCommunityImagePreview('', readValue('community-title'));
}

export function openCommunityChat(communityId) {
  const community = DB.getCommunities().find(item => item.id === communityId);
  if (!community?.chatLink) {
    toast(t('communities.linkMissing'));
    return;
  }

  openExternalUrl(community.chatLink);
}

export function deleteCommunity(communityId) {
  const session = DB.getSession();
  if (!session?.email) {
    toast(t('communities.loginRequired'));
    return;
  }

  const deleted = DB.deleteCommunity(communityId, session.email);
  if (!deleted) {
    toast(t('communities.deleteForbidden'));
    return;
  }

  renderCommunitiesList();
  emitAppEvent('arraigo:communities-changed');
  toast(t('communities.deleted'));
}

export function saveCommunity() {
  const session = DB.getSession();
  if (!session) {
    toast(t('communities.loginRequired'));
    if (typeof window.go === 'function') window.go('s-login');
    return;
  }

  const title = readValue('community-title');
  const description = readValue('community-description');
  const chatLink = normalizeChatLink(readValue('community-link'));
  const chatType = getChatType(chatLink);
  const image = communityImageDraft || buildCommunityPlaceholder(title);

  if (!title || !description || !chatLink) {
    toast(t('communities.required'));
    return;
  }

  try {
    const created = DB.createCommunity({
      title,
      description,
      image,
      chatLink,
      chatType
    });

    if (!created) {
      toast(t('communities.required'));
      return;
    }

    DB.addNotification({
      type: 'community',
      title: t('notifications.newCommunityTitle'),
      body: t('notifications.newCommunityBody', { title: created.title }),
      actionType: 'community',
      actionTargetId: created.id
    });
  } catch (error) {
    console.error('No se pudo guardar la comunidad:', error);
    toast(t('communities.saveFailed'));
    return;
  }

  clearCommunityForm();
  renderCommunitiesList();
  emitAppEvent('arraigo:communities-changed');
  emitAppEvent('arraigo:notifications-changed');
  toast(t('communities.created'));
}

export function renderCommunitiesScreen() {
  syncCommunityImagePreview(communityImageDraft, readValue('community-title'));
  renderCommunitiesList();
}

export function initCommunities() {
  renderCommunitiesScreen();

  window.addEventListener('arraigo:communities-changed', renderCommunitiesScreen);
  window.addEventListener('arraigo:language-changed', renderCommunitiesScreen);
  window.addEventListener('arraigo:session-changed', renderCommunitiesScreen);
}

window.handleCommunityImageChange = handleCommunityImageChange;
window.syncCommunityTitlePreview = syncCommunityTitlePreview;
window.saveCommunity = saveCommunity;
window.openCommunityChat = openCommunityChat;
window.deleteCommunity = deleteCommunity;
window.renderCommunitiesScreen = renderCommunitiesScreen;
