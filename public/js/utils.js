// ── Utility functions ──
import { state } from './state.js';

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function haptic(style = 'light') {
  if (navigator.vibrate) {
    const p = { light: 10, medium: 25, heavy: 50, success: [10, 50, 10] };
    navigator.vibrate(p[style] || 10);
  }
}

export function showNotif(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

export function showToast(msg) {
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast').classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(hideToast, 5000);
}

export function hideToast() {
  document.getElementById('toast').classList.remove('show');
}
