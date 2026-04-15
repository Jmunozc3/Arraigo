// ══════════════════════════════════
// main.js — Punto de entrada principal
// Importa todos los módulos y arranca la app
// ══════════════════════════════════

import './utils.js';
import './towns.js';   // towns antes de nav (nav importa initMap)
import './nav.js';
import { DB } from './db.js';
import { initI18n } from './i18n.js';
import { initAuth } from './auth.js';
import { initHome } from './home.js';
import { initProfile } from './profile.js';
import { initJobs } from './jobs.js';
import { initSaved } from './saved.js';
import { initTowns } from './towns.js';
import { initCommunities } from './communities.js';
import { initLocationTracking } from './location.js';
import { initAdmin } from './admin.js';

// Arranque cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  DB.bootstrap();
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
