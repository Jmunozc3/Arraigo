// ══════════════════════════════════
// main.js — Punto de entrada principal
// Importa todos los módulos y arranca la app
// ══════════════════════════════════

import './utils.js?v=20260417204131';
import './towns.js?v=20260417204131';   // towns antes de nav (nav importa initMap)
import './nav.js?v=20260417204131';
import { DB } from './db.js?v=20260417204131';
import { initI18n } from './i18n.js?v=20260417204131';
import { initAuth } from './auth.js?v=20260417204131';
import { initHome } from './home.js?v=20260417204131';
import { initProfile } from './profile.js?v=20260417204131';
import { initJobs } from './jobs.js?v=20260417204131';
import { initSaved } from './saved.js?v=20260417204131';
import { initTowns } from './towns.js?v=20260417204131';
import { initCommunities } from './communities.js?v=20260417204131';
import { initLocationTracking } from './location.js?v=20260417204131';
import { initAdmin } from './admin.js?v=20260417204131';

// Arranque cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await DB.bootstrap();
  } catch (error) {
    console.error('No se pudo inicializar Supabase:', error);
  }
  initI18n();
  initAuth();
  initProfile(); // carga sesión activa y conecta botón Editar
  initHome();
  initJobs();
  initTowns();
  initSaved();
  initCommunities();
  initAdmin();
  initLocationTracking();
  if (typeof window.calcProg === 'function') window.calcProg();
});
