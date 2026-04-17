// ══════════════════════════════════
// profile.js — Gestión de perfil de usuario
// ══════════════════════════════════

import { DB } from './db.js?v=20260417204131';
import { setValue, setSelect, toast } from './utils.js?v=20260417204131';
import { go } from './nav.js?v=20260417204131';
import {
  getIntlLocale,
  getLanguage,
  normalizeRegionValue,
  normalizeStatusValue,
  t,
  translateRegionValue,
  translateStatusValue
} from './i18n.js?v=20260417204131';

const POLICY_SECTION_STYLE = 'background:rgba(116,116,128,0.08);border-radius:16px;padding:16px;';
const POLICY_TITLE_STYLE = 'font-size:15px;font-weight:700;color:var(--label);letter-spacing:-0.2px;';
const POLICY_TEXT_STYLE = 'font-size:13px;color:var(--label2);line-height:1.65;margin-top:8px;';
const POLICY_LIST_STYLE = 'margin:10px 0 0 18px;font-size:13px;color:var(--label2);line-height:1.65;';
const POLICY_SUBSECTION_STYLE = 'margin-top:12px;padding-top:12px;border-top:0.5px solid var(--sep);';
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
      <div style="font-size:16px;font-weight:800;letter-spacing:-0.3px;color:var(--ios-blue);">POLÍTICA DE PRIVACIDAD</div>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">1. Responsable del tratamiento</div>
        <div style="${POLICY_TEXT_STYLE}">De conformidad con el artículo 13 del Reglamento General de Protección de Datos (RGPD):</div>
        <ul style="${POLICY_LIST_STYLE}">
          <li>Comunidad de Madrid</li>
          <li>Dirección: [Añadir dirección oficial]</li>
          <li>Correo electrónico de contacto: [Añadir email de contacto]</li>
        </ul>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">2. Finalidad del tratamiento</div>
        <div style="${POLICY_TEXT_STYLE}">En virtud del artículo 5.1.b del RGPD (principio de limitación de la finalidad), los datos personales serán tratados con las siguientes finalidades:</div>
        <ul style="${POLICY_LIST_STYLE}">
          <li>Gestionar la creación y mantenimiento de la cuenta de usuario</li>
          <li>Facilitar el acceso a ofertas de empleo</li>
          <li>Recomendar municipios y oportunidades en entornos rurales</li>
          <li>Personalizar la experiencia dentro de la aplicación</li>
          <li>Mejorar el funcionamiento y rendimiento de la app</li>
          <li>Garantizar la seguridad del servicio</li>
        </ul>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">3. Base legal del tratamiento</div>
        <div style="${POLICY_TEXT_STYLE}">El tratamiento de los datos personales se fundamenta en el artículo 6 del RGPD:</div>

        <div style="${POLICY_SUBSECTION_STYLE}">
          <div style="${POLICY_TITLE_STYLE}">a) Consentimiento del usuario (artículo 6.1.a RGPD)</div>
          <div style="${POLICY_TEXT_STYLE}">El usuario otorga su consentimiento expreso para:</div>
          <ul style="${POLICY_LIST_STYLE}">
            <li>El uso de la ubicación (GPS)</li>
            <li>La personalización de contenidos</li>
            <li>La recomendación de oportunidades laborales y municipios</li>
          </ul>
          <div style="${POLICY_TEXT_STYLE}">Según el artículo 7 del RGPD, el consentimiento podrá retirarse en cualquier momento.</div>
        </div>

        <div style="${POLICY_SUBSECTION_STYLE}">
          <div style="${POLICY_TITLE_STYLE}">b) Ejecución de un contrato o servicio (artículo 6.1.b RGPD)</div>
          <div style="${POLICY_TEXT_STYLE}">El tratamiento es necesario para:</div>
          <ul style="${POLICY_LIST_STYLE}">
            <li>Crear y gestionar la cuenta del usuario</li>
            <li>Permitir el acceso a los servicios ofrecidos en la aplicación</li>
          </ul>
        </div>

        <div style="${POLICY_SUBSECTION_STYLE}">
          <div style="${POLICY_TITLE_STYLE}">c) Cumplimiento de obligaciones legales (artículo 6.1.c RGPD)</div>
          <div style="${POLICY_TEXT_STYLE}">Los datos podrán ser tratados cuando sea necesario para cumplir con obligaciones legales aplicables a la Comunidad de Madrid.</div>
        </div>

        <div style="${POLICY_SUBSECTION_STYLE}">
          <div style="${POLICY_TITLE_STYLE}">d) Interés legítimo (artículo 6.1.f RGPD)</div>
          <div style="${POLICY_TEXT_STYLE}">Se tratarán datos con base en el interés legítimo para:</div>
          <ul style="${POLICY_LIST_STYLE}">
            <li>Mejorar la aplicación</li>
            <li>Garantizar la seguridad del servicio</li>
          </ul>
          <div style="${POLICY_TEXT_STYLE}">De acuerdo con el artículo 21 del RGPD, el usuario podrá oponerse a este tratamiento.</div>
          <div style="${POLICY_TEXT_STYLE}">En ningún caso este tratamiento afectará a los derechos y libertades fundamentales del usuario.</div>
        </div>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">4. Conservación de los datos</div>
        <div style="${POLICY_TEXT_STYLE}">En cumplimiento del artículo 5.1.e del RGPD (limitación del plazo de conservación):</div>
        <ul style="${POLICY_LIST_STYLE}">
          <li>Los datos se conservarán mientras el usuario mantenga su cuenta activa</li>
          <li>Durante el tiempo necesario para cumplir obligaciones legales</li>
          <li>Hasta que el usuario solicite su supresión</li>
        </ul>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">5. Cesión de datos</div>
        <div style="${POLICY_TEXT_STYLE}">De acuerdo con el artículo 6 y el artículo 28 del RGPD:</div>
        <ul style="${POLICY_LIST_STYLE}">
          <li>No se cederán datos a terceros salvo obligación legal</li>
          <li>Podrán acceder a los datos proveedores de servicios (encargados del tratamiento), bajo contrato conforme al artículo 28 del RGPD</li>
          <li>En ningún caso se venderán datos personales</li>
        </ul>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">6. Derechos del usuario</div>
        <div style="${POLICY_TEXT_STYLE}">Según los artículos 15 a 22 del RGPD, el usuario tiene derecho a:</div>
        <ul style="${POLICY_LIST_STYLE}">
          <li>Acceso (art. 15)</li>
          <li>Rectificación (art. 16)</li>
          <li>Supresión (art. 17)</li>
          <li>Limitación del tratamiento (art. 18)</li>
          <li>Portabilidad de los datos (art. 20)</li>
          <li>Oposición (art. 21)</li>
        </ul>
        <div style="${POLICY_TEXT_STYLE}">Asimismo, tiene derecho a no ser objeto de decisiones automatizadas (artículo 22).</div>
        <div style="${POLICY_TEXT_STYLE}">Para ejercer estos derechos:</div>
        <div style="${POLICY_TEXT_STYLE}">[Añadir correo de contacto]</div>
        <div style="${POLICY_TEXT_STYLE}">También tiene derecho a presentar reclamación ante la Agencia Española de Protección de Datos.</div>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">7. Seguridad de los datos</div>
        <div style="${POLICY_TEXT_STYLE}">En cumplimiento del artículo 32 del RGPD, se aplican medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos personales.</div>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">8. Delegado de Protección de Datos</div>
        <div style="${POLICY_TEXT_STYLE}">De acuerdo con el artículo 37 del RGPD:</div>
        <div style="${POLICY_TEXT_STYLE}">[Añadir correo del Delegado de Protección de Datos]</div>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">9. Uso de cookies y tecnologías similares</div>
        <div style="${POLICY_TEXT_STYLE}">En aplicación de la Ley de Servicios de la Sociedad de la Información:</div>
        <ul style="${POLICY_LIST_STYLE}">
          <li>Se podrán utilizar cookies o tecnologías similares</li>
          <li>Su finalidad será mejorar la experiencia del usuario, analizar el uso y personalizar contenidos</li>
          <li>El usuario podrá configurarlas o rechazarlas cuando sea posible</li>
        </ul>
      </section>

      <section style="${POLICY_SECTION_STYLE}">
        <div style="${POLICY_TITLE_STYLE}">10. Modificaciones de la política de privacidad</div>
        <div style="${POLICY_TEXT_STYLE}">La Comunidad de Madrid se reserva el derecho a modificar la presente política para adaptarla a novedades legislativas, conforme al artículo 13 del RGPD.</div>
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
    const age = session.age ? `${session.age} · ` : '';
    const status = session.role === 'admin'
      ? t('profile.adminStatus')
      : translateStatusValue(session.status) || t('profile.defaultStatus');
    metaEl.textContent = age + status;
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
    const townInput = document.getElementById('ep-town');

    if (document.getElementById('s-editprofile')?.classList.contains('active')) {
      if (townInput && !townInput.value && session?.town) townInput.value = session.town;
      if (session?.region) setSelect('ep-region', normalizeRegionValue(session.region));
      if (session?.status) setSelect('ep-status', normalizeStatusValue(session.status));
      syncAdditionalProfileBanner(session, getAdditionalProfileDraft());
      if (!regionValue && !statusValue) return;
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
