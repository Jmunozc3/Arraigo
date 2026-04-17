// ══════════════════════════════════
// auth.js — Autenticación con Supabase Auth
// ══════════════════════════════════

import { DB } from './db.js?v=20260417204131';
import { emitAppEvent, toast } from './utils.js?v=20260417204131';
import { go } from './nav.js?v=20260417204131';
import { updateHomeProfile } from './profile.js?v=20260417204131';
import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  normalizeRegionValue,
  normalizeStatusValue,
  setLanguage,
  t
} from './i18n.js?v=20260417204131';

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

function buildMissingFieldsMessage(baseMessage, missingLabels = []) {
  if (!missingLabels.length) return baseMessage;
  return `${baseMessage} (${missingLabels.join(', ')})`;
}

function hideAuthError(errorElement) {
  if (!errorElement) return;
  errorElement.textContent = '';
  errorElement.style.display = 'none';
}

function isScreenActive(screenId) {
  return document.getElementById(screenId)?.classList.contains('active') ?? false;
}

function focusAuthField(fieldId) {
  window.setTimeout(() => {
    document.getElementById(fieldId)?.focus();
  }, 80);
}

function getTextInputValue(fieldId) {
  const field = document.getElementById(fieldId);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return '';
  return String(field.value || field.getAttribute('value') || '').trim();
}

async function commitActiveAuthField(screenId) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !active.closest(`#${screenId}`)) return;

  if (
    active instanceof HTMLInputElement
    || active instanceof HTMLTextAreaElement
    || active instanceof HTMLSelectElement
  ) {
    active.blur();
    await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  }
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
  [getRegisterErrorElement(), getLoginErrorElement()].forEach(hideAuthError);
}

function clearRegisterError() {
  hideAuthError(getRegisterErrorElement());
}

function clearLoginError() {
  hideAuthError(getLoginErrorElement());
}

function bindAuthFieldListeners() {
  const loginScreen = document.getElementById('s-login');
  const registerScreen = document.getElementById('s-register');

  loginScreen?.addEventListener('input', clearLoginError);
  registerScreen?.addEventListener('input', clearRegisterError);
  registerScreen?.addEventListener('change', clearRegisterError);
}

function bindAuthKeyboardSubmit() {
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const tagName = target.tagName;
    if (tagName !== 'INPUT' && tagName !== 'SELECT') return;

    if (isScreenActive('s-login') && target.closest('#s-login')) {
      event.preventDefault();
      doLogin();
      return;
    }

    if (isScreenActive('s-register') && target.closest('#s-register')) {
      event.preventDefault();
      doReg();
    }
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
  const rawMessage = String(error?.message || '').trim();
  const message = rawMessage.toLowerCase();
  if (message.includes('already registered')) return t('auth.emailExists');
  if (message.includes('invalid login credentials')) return t('auth.invalid');
  if (message.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (message.includes('database error saving new user')) {
    return 'Supabase no pudo guardar el usuario. Suele pasar cuando falta ejecutar completo `supabase/schema.sql` o falla el trigger de `profiles`.';
  }
  if (message.includes('signups not allowed')) {
    return 'El registro por email está desactivado en Supabase.';
  }
  if (message.includes('invalid email')) {
    return 'El correo no es válido.';
  }
  if (rawMessage) {
    return `${t(fallbackKey)} Detalle: ${rawMessage}`;
  }
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
  clearAuthErrors();
  go('s-register');
  calcProg();
  openExperimentNotice();
  focusAuthField('reg-name');
}

export function openLoginScreen() {
  clearAuthErrors();
  go('s-login');
  focusAuthField('login-email');
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
  if (!isScreenActive('s-register')) return;
  await commitActiveAuthField('s-register');

  const name = getTextInputValue('reg-name');
  const email = getTextInputValue('reg-email').toLowerCase();
  const pass = getTextInputValue('reg-pass');
  const errEl = getRegisterErrorElement();
  clearRegisterError();
  const missingFields = [];

  if (!name) missingFields.push(t('register.nameLabel'));
  if (!email) missingFields.push(t('register.emailLabel'));
  if (!pass) missingFields.push(t('register.passwordLabel'));

  if (missingFields.length) {
    errEl.textContent = buildMissingFieldsMessage(t('auth.required'), missingFields);
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
      const loginEmail = document.getElementById('login-email');
      if (loginEmail) loginEmail.value = email;
      openLoginScreen();
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
  if (!isScreenActive('s-login')) return;
  await commitActiveAuthField('s-login');

  const email = getTextInputValue('login-email').toLowerCase();
  const pass = getTextInputValue('login-pass');
  const errEl = getLoginErrorElement();
  clearLoginError();
  const missingFields = [];

  if (!email) missingFields.push(t('login.emailLabel'));
  if (!pass) missingFields.push(t('login.passwordLabel'));

  if (missingFields.length) {
    errEl.textContent = buildMissingFieldsMessage(t('auth.loginRequired'), missingFields);
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
  bindAuthFieldListeners();
  bindAuthKeyboardSubmit();

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
window.openLoginScreen = openLoginScreen;
window.requestPasswordRecovery = requestPasswordRecovery;
window.doReg = doReg;
window.doLogin = doLogin;
window.doLogout = doLogout;
