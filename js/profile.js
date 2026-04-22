// ══════════════════════════════════
// profile.js — Gestión de perfil de usuario
// ══════════════════════════════════

import { DB } from './db.js?v=20260417204131';
import { setValue, setSelect, toast } from './utils.js?v=20260417204131';
import { go } from './nav.js?v=20260417204131';
import {
  getIntlLocale,
  getLanguage,
  normalizeGenderValue,
  normalizeRegionValue,
  normalizeStatusValue,
  t,
  translateGenderValue,
  translateRegionValue,
  translateStatusValue
} from './i18n.js?v=20260417204131';

const POLICY_SECTION_STYLE = 'background:rgba(116,116,128,0.08);border-radius:16px;padding:16px;';
const POLICY_TEXT_STYLE = 'font-size:13px;color:var(--label2);line-height:1.65;margin-top:8px;';
const ADDITIONAL_PROFILE_FIELDS = [
  'territorialOrigin',
  'previousProfessionalActivity',
  'spatialProfessionalTrajectory',
  'educationCenters',
  'familyTrajectory'
];

const PRIVACY_COPY = {
  es: `
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:18px;">
      <section style="${POLICY_SECTION_STYLE}">
        <p style="${POLICY_TEXT_STYLE}margin-top:0;">En cumplimiento de lo dispuesto en la normativa vigente en materia de Protección de Datos de Carácter Personal, se informa a los intervinientes de que los datos personales que figuran en este Convenio y los que se deriven de la relación, serán tratados por ambas partes con la finalidad de gestionar la colaboración establecida, siendo la base para el tratamiento la correcta ejecución del Convenio. Es necesario facilitar dichos datos pues en caso contrario no sería posible gestionar la colaboración existente entre las partes.</p>
        <p style="${POLICY_TEXT_STYLE}">Los datos no serán cedidos a terceros salvo a las Administraciones Públicas en los casos previstos en la Ley y para los fines en ella definidos.</p>
        <p style="${POLICY_TEXT_STYLE}">Los interesados podrán ponerse en contacto con el Delegado de Protección de Datos (DPO) de la Universidad Antonio de Nebrija en la siguiente dirección: DPO@nebrija.es</p>
        <p style="${POLICY_TEXT_STYLE}">Los datos se conservarán mientras se mantenga la colaboración y no se solicite su supresión y en cualquier caso en cumplimiento de plazos legales de prescripción que le resulten de aplicación.</p>
        <p style="${POLICY_TEXT_STYLE}">Los interesados pueden ejercitar sus derechos de acceso, rectificación, supresión, portabilidad y la limitación u oposición dirigiéndose por escrito a los domicilios correspondientes a ambas partes.</p>
        <p style="${POLICY_TEXT_STYLE}">Asimismo, los interesados tienen derecho a reclamar ante la Autoridad de Control (Agencia Española de Protección de Datos www.aepd.es).</p>
        <p style="${POLICY_TEXT_STYLE}">En el supuesto de que, como consecuencia del desarrollo del presente Convenio, sea necesario que las partes se intercambien información personal de los alumnos, cada una de ellas se compromete a dar entero cumplimiento a las obligaciones en materia de protección de datos recogidas en el Reglamento del Parlamento Europeo y del Consejo relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos y por el que se deroga la Directiva 95/46/CE (RGPD). En concreto, las partes se obligan a informar a los afectados sobre el tratamiento de sus datos personales conforme a lo estipulado en el artículo 13 del RGPD y de la cesión de los mismos, debiendo recabar su consentimiento, en el supuesto de que se requiera contar con el mismo.</p>
      </section>
    </div>
  `
};

function setToggleState(element, enabled) {
  if (!element) return;
  element.classList.toggle('on', Boolean(enabled));
}

function readInputValue(id) {
  const element = document.getElementById(id);
  return typeof element?.value === 'string' ? element.value.trim() : '';
}

function getAdditionalProfile(session) {
  return session?.additionalProfile || {};
}

function getAdditionalProfileDraft() {
  return {
    gender: normalizeGenderValue(document.getElementById('ep-gender')?.value || ''),
    territorialOrigin: readInputValue('ep-territorial-origin'),
    previousProfessionalActivity: readInputValue('ep-previous-professional-activity'),
    spatialProfessionalTrajectory: readInputValue('ep-spatial-professional-trajectory'),
    educationCenters: readInputValue('ep-education-centers'),
    familyTrajectory: readInputValue('ep-family-trajectory')
  };
}

function getAdditionalProfileProgress(additionalProfile = {}) {
  const filled = ADDITIONAL_PROFILE_FIELDS.filter(field => String(additionalProfile[field] || '').trim() !== '').length;
  return {
    filled,
    total: ADDITIONAL_PROFILE_FIELDS.length,
    complete: filled === ADDITIONAL_PROFILE_FIELDS.length
  };
}

function syncAdditionalProfileBanner(session = DB.getSession(), draft = getAdditionalProfile(session)) {
  const banner = document.getElementById('ep-extra-info-banner');
  const title = document.getElementById('ep-extra-info-banner-title');
  const copy = document.getElementById('ep-extra-info-banner-copy');
  if (!banner || !title || !copy) return;

  const progress = getAdditionalProfileProgress(draft);
  banner.classList.toggle('complete', progress.complete);
  title.textContent = progress.complete
    ? t('editProfile.additionalInfoReadyTitle')
    : t('editProfile.additionalInfoPendingTitle');
  copy.textContent = progress.complete
    ? t('editProfile.additionalInfoReadyCopy')
    : t('editProfile.additionalInfoPendingCopy', progress);
}

function getLatestLocationCopy(session) {
  if (!session?.email) return t('tracking.pending');

  const latestLocation = DB.getUserLocations(session.email)[0];
  if (!latestLocation) return t('tracking.none');

  return t('tracking.latest', {
    date: new Date(latestLocation.capturedAt).toLocaleString(getIntlLocale())
  });
}

function syncHomeRoleUi(session) {
  const badge = document.getElementById('home-role-badge');
  const adminButton = document.getElementById('home-admin-btn');

  if (badge) {
    if (!session) {
      badge.style.display = 'none';
    } else {
      badge.style.display = 'inline-flex';
      badge.textContent = session.role === 'admin' ? t('role.admin') : t('role.active');
      badge.className = session.role === 'admin' ? 'badge badge-red-fill' : 'badge badge-green-fill';
    }
  }

  if (adminButton) {
    adminButton.style.display = session?.role === 'admin' ? 'flex' : 'none';
  }
}

function syncProfileLocationStatus(session) {
  const locationMeta = document.getElementById('profile-location-status');
  if (!locationMeta) return;
  locationMeta.textContent = session ? getLatestLocationCopy(session) : t('editProfile.trackingEmpty');
}

function renderPrivacyContent() {
  const copyContainer = document.getElementById('privacy-copy');
  if (!copyContainer) return;

  const language = getLanguage();
  const content = PRIVACY_COPY[language] || PRIVACY_COPY.es;
  copyContainer.innerHTML = content;
}

export function updateHomeProfile() {
  const session = DB.getSession();
  const nameEl = document.getElementById('home-name');
  const metaEl = document.getElementById('home-meta');
  const avatarEl = document.getElementById('home-avatar');

  if (!session) {
    if (nameEl) nameEl.textContent = t('profile.guest');
    if (metaEl) metaEl.textContent = t('profile.guestStatus');
    if (avatarEl) avatarEl.src = 'https://i.pravatar.cc/136?img=3';
    syncHomeRoleUi(null);
    return;
  }

  if (nameEl) nameEl.textContent = session.name || t('profile.guest');

  if (metaEl) {
    const gender = translateGenderValue(session.additionalProfile?.gender || '');
    const status = session.role === 'admin'
      ? t('profile.adminStatus')
      : translateStatusValue(session.status) || t('profile.defaultStatus');
    metaEl.textContent = [session.age, gender, status].filter(Boolean).join(' · ');
  }

  if (avatarEl && session.avatar) avatarEl.src = session.avatar;
  syncHomeRoleUi(session);
}

export function openEditProfile() {
  const session = DB.getSession();
  if (!session) {
    if (typeof window.openLoginScreen === 'function') window.openLoginScreen();
    else go('s-login');
    return;
  }

  const additionalProfile = getAdditionalProfile(session);

  setValue('ep-name', session.name);
  setValue('ep-age', session.age);
  setSelect('ep-gender', normalizeGenderValue(additionalProfile.gender));
  setValue('ep-email', session.email);
  setValue('ep-phone', session.phone);
  setValue('ep-town', session.town);
  setValue('ep-country', session.country);
  setSelect('ep-status', normalizeStatusValue(session.status));
  setSelect('ep-region', normalizeRegionValue(session.region));
  setValue('ep-territorial-origin', additionalProfile.territorialOrigin);
  setValue('ep-previous-professional-activity', additionalProfile.previousProfessionalActivity);
  setValue('ep-spatial-professional-trajectory', additionalProfile.spatialProfessionalTrajectory);
  setValue('ep-education-centers', additionalProfile.educationCenters);
  setValue('ep-family-trajectory', additionalProfile.familyTrajectory);

  const img = document.getElementById('edit-avatar-img');
  if (img && session.avatar) img.src = session.avatar;

  setToggleState(document.getElementById('ep-track-toggle'), session.trackingEnabled !== false);
  syncProfileLocationStatus(session);
  syncAdditionalProfileBanner(session, additionalProfile);

  go('s-editprofile');
}

export async function saveProfile() {
  const session = DB.getSession();
  if (!session) {
    go('s-home');
    return;
  }

  const updated = {
    name: readInputValue('ep-name'),
    age: readInputValue('ep-age'),
    email: session.email,
    phone: readInputValue('ep-phone'),
    town: readInputValue('ep-town'),
    country: readInputValue('ep-country'),
    status: normalizeStatusValue(document.getElementById('ep-status')?.value || ''),
    region: normalizeRegionValue(document.getElementById('ep-region')?.value || ''),
    avatar: document.getElementById('edit-avatar-img')?.src || session.avatar,
    trackingEnabled: document.getElementById('ep-track-toggle')?.classList.contains('on') ?? session.trackingEnabled,
    additionalProfile: getAdditionalProfileDraft()
  };

  try {
    await DB.saveProfile(session.email, updated);
    const nextSession = DB.getSession();
    updateHomeProfile();
    syncProfileLocationStatus(nextSession);
    syncAdditionalProfileBanner(nextSession);

    window.dispatchEvent(new CustomEvent('arraigo:session-changed', {
      detail: { session: nextSession }
    }));

    go('s-home');
    toast(t('profile.updated'));
  } catch (error) {
    console.error('No se pudo guardar el perfil:', error);
    toast('No se pudo guardar el perfil.');
  }
}

export function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = loadEvent => {
    const src = loadEvent.target.result;
    const img = document.getElementById('edit-avatar-img');
    if (img) img.src = src;
    toast(t('profile.photoUpdated'));
  };
  reader.readAsDataURL(file);
}

export function openPrivacy() {
  renderPrivacyContent();
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.style.display = 'flex';
}

export function closePrivacy() {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.style.display = 'none';
}

export function acceptPrivacy() {
  closePrivacy();
  const toggle = document.getElementById('tog');
  if (toggle && !toggle.classList.contains('on')) {
    toggle.classList.add('on');
    if (typeof window.calcProg === 'function') window.calcProg();
  }
  toast(t('profile.privacyAccepted'));
}

export function toggleProfileTracking() {
  const toggle = document.getElementById('ep-track-toggle');
  if (!toggle) return;

  toggle.classList.toggle('on');
  const isEnabled = toggle.classList.contains('on');
  toast(isEnabled ? t('tracking.enabled') : t('tracking.disabled'));
}

export function initProfile() {
  const editBtn = document.querySelector('#s-home .btn-gray');
  if (editBtn) {
    editBtn.onclick = event => {
      event.stopPropagation();
      openEditProfile();
    };
  }

  [
    'ep-territorial-origin',
    'ep-previous-professional-activity',
    'ep-spatial-professional-trajectory',
    'ep-education-centers',
    'ep-family-trajectory'
  ].forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener('input', () => {
      syncAdditionalProfileBanner(DB.getSession(), getAdditionalProfileDraft());
    });
  });

  updateHomeProfile();
  syncProfileLocationStatus(DB.getSession());
  syncAdditionalProfileBanner(DB.getSession());
  renderPrivacyContent();

  window.addEventListener('arraigo:session-changed', () => {
    updateHomeProfile();
    syncProfileLocationStatus(DB.getSession());
    syncAdditionalProfileBanner(DB.getSession());
  });

  window.addEventListener('arraigo:location-captured', () => {
    updateHomeProfile();
    syncProfileLocationStatus(DB.getSession());
  });

  window.addEventListener('arraigo:language-changed', () => {
    updateHomeProfile();
    syncProfileLocationStatus(DB.getSession());
    renderPrivacyContent();

    const session = DB.getSession();
    const regionValue = translateRegionValue(session?.region || '');
    const statusValue = translateStatusValue(session?.status || '');
    const genderValue = translateGenderValue(session?.additionalProfile?.gender || '');
    const townInput = document.getElementById('ep-town');

    if (document.getElementById('s-editprofile')?.classList.contains('active')) {
      if (townInput && !townInput.value && session?.town) townInput.value = session.town;
      if (session?.additionalProfile?.gender) setSelect('ep-gender', normalizeGenderValue(session.additionalProfile.gender));
      if (session?.region) setSelect('ep-region', normalizeRegionValue(session.region));
      if (session?.status) setSelect('ep-status', normalizeStatusValue(session.status));
      syncAdditionalProfileBanner(session, getAdditionalProfileDraft());
      if (!regionValue && !statusValue && !genderValue) return;
    }
  });
}

window.openEditProfile = openEditProfile;
window.saveProfile = saveProfile;
window.handleAvatarChange = handleAvatarChange;
window.openPrivacy = openPrivacy;
window.closePrivacy = closePrivacy;
window.acceptPrivacy = acceptPrivacy;
window.toggleProfileTracking = toggleProfileTracking;
