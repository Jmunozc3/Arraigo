// ══════════════════════════════════
// utils.js — Utilidades compartidas
// ══════════════════════════════════

let toastTimer;

export function toast(msg) {
  clearTimeout(toastTimer);
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

export function chipSel(el) {
  const row = el.closest('.chip-scroll');
  row.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('chip-active');
    c.classList.add('chip-inactive');
  });
  el.classList.remove('chip-inactive');
  el.classList.add('chip-active');
}

export function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

export function setSelect(id, val) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!val) {
    el.selectedIndex = 0;
    return;
  }

  let matched = false;
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value === val || el.options[i].text === val) {
      el.selectedIndex = i;
      matched = true;
      break;
    }
  }

  if (!matched) el.selectedIndex = 0;
}

export function openExternalUrl(url) {
  if (!url) return;
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) window.location.href = url;
}

export function escapeHtml(value) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return String(value ?? '').replace(/[&<>"']/g, char => map[char]);
}

export function emitAppEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// Exponer globalmente para uso desde onclick en HTML
window.toast           = toast;
window.chipSel         = chipSel;
window.openExternalUrl = openExternalUrl;
