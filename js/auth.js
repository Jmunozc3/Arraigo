// ══════════════════════════════════
// auth.js — Autenticación (registro y login)
// ══════════════════════════════════

import { DB } from './db.js';
import { emitAppEvent, toast } from './utils.js';
import { go } from './nav.js';
import { updateHomeProfile } from './profile.js';
import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  normalizeRegionValue,
  normalizeStatusValue,
  setLanguage,
  t
} from './i18n.js';

function syncSessionUi() {
  updateHomeProfile();
  emitAppEvent('arraigo:session-changed', {
    session: DB.getSession()
  });
}

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function buildPasswordHash(password) {
  return `sha256:${await sha256Hex(password)}`;
}

async function verifyPassword(profile, password) {
  if (!profile) return false;

  if (typeof profile.passwordHash === 'string') {
    return profile.passwordHash === await buildPasswordHash(password);
  }

  if (typeof profile.pass === 'string') {
    return profile.pass === password;
  }

  return false;
}

function getRegisterErrorElement() {
  return document.getElementById('reg-error');
}

function getLoginErrorElement() {
  return document.getElementById('login-error');
}

function syncLanguageSelectionUi(language = getLanguage()) {
  SUPPORTED_LANGUAGES.forEach(code => {
    const cell = document.getElementById(`lc-${code}`);
    const check = document.getElementById(`lk-${code}`);
    const ring = document.getElementById(`lr-${code}`);
    const isActive = code === language;

    if (cell) cell.style.background = isActive ? 'rgba(0,122,255,0.05)' : '';
    if (check) check.style.display = isActive ? 'block' : 'none';
    if (ring) ring.style.display = isActive ? 'none' : 'block';
  });
}

function clearAuthErrors() {
  [getRegisterErrorElement(), getLoginErrorElement()].forEach(errorElement => {
    if (!errorElement) return;
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  });
}

export function selLang(language) {
  setLanguage(language);
  syncLanguageSelectionUi(language);
}

export function calcProg() {
  const inputs = document.querySelectorAll('#s-register input:not([type=checkbox]), #s-register .ios-select');
  let filled = 0;

  inputs.forEach(input => {
    if (input.value && input.value.trim() !== '') filled += 1;
  });

  const termsToggle = document.getElementById('tog');
  if (termsToggle?.classList.contains('on')) filled += 1;

  const bar = document.getElementById('reg-bar');
  if (bar) {
    const progress = Math.max(8, Math.min(100, Math.round((filled / (inputs.length + 1)) * 100)));
    bar.style.width = `${progress}%`;
  }
}

export function openExperimentNotice() {
  const modal = document.getElementById('experiment-modal');
  if (modal) modal.style.display = 'flex';
}

export function closeExperimentNotice() {
  const modal = document.getElementById('experiment-modal');
  if (modal) modal.style.display = 'none';
}

export function openTrackingInfoNotice() {
  const modal = document.getElementById('tracking-info-modal');
  if (modal) modal.style.display = 'flex';
}

export function closeTrackingInfoNotice() {
  const modal = document.getElementById('tracking-info-modal');
  if (modal) modal.style.display = 'none';
}

export function openRegisterScreen() {
  go('s-register');
  calcProg();
  openExperimentNotice();
}

export function requestPasswordRecovery() {
  toast(t('auth.recovery'));
}

export async function doReg() {
  const name = (document.getElementById('reg-name')?.value || '').trim();
  const email = (document.getElementById('reg-email')?.value || '').trim().toLowerCase();
  const pass = (document.getElementById('reg-pass')?.value || '').trim();
  const errEl = getRegisterErrorElement();

  if (!name || !email || !pass) {
    errEl.textContent = t('auth.required');
    errEl.style.display = 'block';
    return;
  }

  if (pass.length < 8) {
    errEl.textContent = t('auth.passwordLength');
    errEl.style.display = 'block';
    return;
  }

  const users = DB.getUsers();
  if (users[email]) {
    errEl.textContent = t('auth.emailExists');
    errEl.style.display = 'block';
    return;
  }

  const age = document.getElementById('reg-age')?.value || '';
  const town = document.getElementById('reg-town')?.value || '';
  const phone = document.getElementById('reg-phone')?.value || '';
  const status = normalizeStatusValue(document.getElementById('reg-status')?.value || '');
  const country = document.getElementById('reg-country')?.value || '';
  const region = normalizeRegionValue(document.getElementById('reg-region')?.value || '');
  const trackingEnabled = document.getElementById('reg-track-toggle')?.classList.contains('on') ?? true;
  const termsAccepted = document.getElementById('tog')?.classList.contains('on');

  if (!termsAccepted) {
    errEl.textContent = t('auth.termsRequired');
    errEl.style.display = 'block';
    return;
  }

  const userData = {
    name,
    email,
    passwordHash: await buildPasswordHash(pass),
    age,
    town,
    phone,
    status,
    country,
    region,
    role: 'user',
    trackingEnabled,
    avatar: 'https://i.pravatar.cc/136?img=3',
    additionalProfile: {},
    createdAt: Date.now()
  };

  DB.saveProfile(email, userData);
  DB.setSession(userData);
  errEl.style.display = 'none';

  const bar = document.getElementById('reg-bar');
  if (bar) bar.style.width = '100%';

  syncSessionUi();

  setTimeout(() => {
    go('s-home');
    toast(t('auth.accountCreated'));
  }, 200);
}

export async function doLogin() {
  const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
  const pass = (document.getElementById('login-pass')?.value || '').trim();
  const errEl = getLoginErrorElement();

  if (!email || !pass) {
    errEl.textContent = t('auth.loginRequired');
    errEl.style.display = 'block';
    return;
  }

  const profile = DB.getProfile(email);
  const validPassword = await verifyPassword(profile, pass);

  if (!profile || !validPassword) {
    errEl.textContent = t('auth.invalid');
    errEl.style.display = 'block';
    return;
  }

  if (!profile.passwordHash) {
    DB.saveProfile(email, {
      passwordHash: await buildPasswordHash(pass),
      pass: null
    });
  }

  errEl.style.display = 'none';
  DB.setSession(profile);
  syncSessionUi();
  go('s-home');

  const welcomeName = (profile.name || t('profile.guest')).split(' ')[0];
  const welcomeMessage = profile.role === 'admin'
    ? t('auth.adminWelcome', { name: welcomeName })
    : t('auth.welcome', { name: welcomeName });
  toast(welcomeMessage);
}

export function doLogout() {
  DB.clearSession();
  syncSessionUi();
  go('s-splash');
  toast(t('auth.sessionClosed'));
}

export function initAuth() {
  syncLanguageSelectionUi();
  clearAuthErrors();

  window.addEventListener('arraigo:language-changed', () => {
    syncLanguageSelectionUi();
    clearAuthErrors();
    calcProg();
  });
}

window.selLang = selLang;
window.calcProg = calcProg;
window.openExperimentNotice = openExperimentNotice;
window.closeExperimentNotice = closeExperimentNotice;
window.openTrackingInfoNotice = openTrackingInfoNotice;
window.closeTrackingInfoNotice = closeTrackingInfoNotice;
window.openRegisterScreen = openRegisterScreen;
window.requestPasswordRecovery = requestPasswordRecovery;
window.doReg = doReg;
window.doLogin = doLogin;
window.doLogout = doLogout;
