// ── Theme toggle ──
import { haptic } from './utils.js';

export function toggleTheme() {
  haptic();
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

export function initTheme() {
  const t = localStorage.getItem('theme');
  if (t) document.documentElement.setAttribute('data-theme', t);
}
