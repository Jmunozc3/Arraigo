// ══════════════════════════════════
// nav.js — Navegación entre pantallas
// ══════════════════════════════════

import { initMap } from './towns.js';

let cur = 's-splash';

export function go(id) {
  if (id === cur) return;
  const prev = document.getElementById(cur);
  const next = document.getElementById(id);
  if (!prev || !next) return;
  prev.classList.remove('active');
  next.classList.add('active');
  cur = id;
}

export function switchTo(screenId) {
  if (screenId === 's-towns') {
    setTimeout(initMap, 80);
  }
  if (screenId === 's-communities' && typeof window.renderCommunitiesScreen === 'function') {
    setTimeout(window.renderCommunitiesScreen, 40);
  }
  if (screenId === 's-admin' && typeof window.renderAdminScreen === 'function') {
    setTimeout(window.renderAdminScreen, 80);
  }
  go(screenId);

  // Actualizar tab activo en la pantalla actual
  const s = document.getElementById(screenId);
  if (s) {
    s.querySelectorAll('.tab-item').forEach(b => {
      b.classList.remove('active');
      const oc = b.getAttribute('onclick') || '';
      if (oc.includes(screenId)) b.classList.add('active');
    });
  }
}

// Exponer globalmente para uso desde onclick en HTML
window.go       = go;
window.switchTo = switchTo;
