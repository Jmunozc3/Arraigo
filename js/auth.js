// ══════════════════════════════════
// auth.js — Autenticación con Supabase Auth
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

const SUPABASE_CONFIG_ERROR = 'Falta configurar la anon key de Supabase.';

function getAuthRedirectUrl() {
  try {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch (error) {
    return window.location.href;
  }
}

function syncSessionUi() {
  updateHomeProfile();
  emitAppEvent('arraigo:session-changed', {
    session: DB.getSession()
  });
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

function getClientOrShowError(targetErrorElement) {
  const client = DB.getClient();
  if (client) return client;

  if (targetErrorElement) {
    targetErrorElement.textContent = SUPABASE_CONFIG_ERROR;
    targetErrorElement.style.display = 'block';
  }

  toast(SUPABASE_CONFIG_ERROR);
  return null;
}

function getAuthMessage(error, fallbackKey) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('already registered')) return t('auth.emailExists');
  if (message.includes('invalid login credentials')) return t('auth.invalid');
  if (message.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  return t(fallbackKey);
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

export async function requestPasswordRecovery() {
  const client = DB.getClient();
  const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();

  if (!client || !email) {
    toast(t('auth.recovery'));
    return;
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl()
  });
  if (error) {
    toast(t('auth.recovery'));
    return;
  }

  toast('Si el correo existe, recibirás instrucciones para restablecer la contraseña.');
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

  const client = getClientOrShowError(errEl);
  if (!client) return;

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          name,
          age,
          town,
          phone,
          status,
          country,
          region,
          tracking_enabled: trackingEnabled,
          avatar: 'https://i.pravatar.cc/136?img=3',
          additional_profile: {},
          privacy_accepted_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      errEl.textContent = getAuthMessage(error, 'auth.required');
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    const bar = document.getElementById('reg-bar');
    if (bar) bar.style.width = '100%';

    await DB.refreshState();
    syncSessionUi();

    if (!data?.session) {
      go('s-login');
      toast('Cuenta creada. Revisa tu correo para confirmar el acceso si tu proyecto lo requiere.');
      return;
    }

    setTimeout(() => {
      go('s-home');
      toast(t('auth.accountCreated'));
    }, 200);
  } catch (error) {
    console.error('No se pudo completar el registro:', error);
    errEl.textContent = 'No se pudo completar el registro.';
    errEl.style.display = 'block';
  }
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

  const client = getClientOrShowError(errEl);
  if (!client) return;

  try {
    const { error } = await client.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      errEl.textContent = getAuthMessage(error, 'auth.invalid');
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    await DB.refreshState();
    syncSessionUi();
    go('s-home');

    const profile = DB.getSession();
    const welcomeName = (profile?.name || t('profile.guest')).split(' ')[0];
    const welcomeMessage = profile?.role === 'admin'
      ? t('auth.adminWelcome', { name: welcomeName })
      : t('auth.welcome', { name: welcomeName });
    toast(welcomeMessage);
  } catch (error) {
    console.error('No se pudo iniciar sesión:', error);
    errEl.textContent = 'No se pudo iniciar sesión.';
    errEl.style.display = 'block';
  }
}

export async function doLogout() {
  try {
    await DB.clearSession();
    syncSessionUi();
    go('s-splash');
    toast(t('auth.sessionClosed'));
  } catch (error) {
    console.error('No se pudo cerrar la sesión:', error);
    toast('No se pudo cerrar la sesión.');
  }
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
