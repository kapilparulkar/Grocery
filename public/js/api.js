// ── API wrapper with auth, offline queue ──
import { state } from './state.js';
import { showNotif } from './utils.js';

function authHeaders(extra) {
  const token = localStorage.getItem('sb_token');
  const h = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
  if (state.activeFamilyId) h['X-Family-Id'] = state.activeFamilyId;
  return Object.assign(h, extra || {});
}

export async function api(url, opts) {
  if (!opts) opts = {};
  opts.headers = authHeaders(opts.headers);
  try {
    if (!navigator.onLine) {
      if (opts.method && opts.method !== 'GET') {
        state.offlineQueue.push({ url, opts });
        localStorage.setItem('offlineQueue', JSON.stringify(state.offlineQueue));
        showNotif('📡 Saved offline — will sync later');
      }
      return null;
    }
    const r = await fetch(url, opts);
    if (r.status === 401) { localStorage.removeItem('sb_token'); window.location.href = '/auth.html'; return null; }
    return await r.json();
  } catch (e) {
    if (opts.method && opts.method !== 'GET') {
      state.offlineQueue.push({ url, opts });
      localStorage.setItem('offlineQueue', JSON.stringify(state.offlineQueue));
      showNotif('📡 Saved offline — will sync later');
    } else {
      showNotif('⚠️ Server unreachable');
    }
    return null;
  }
}

export function updateOfflineStatus() {
  state.isOnline = navigator.onLine;
  document.getElementById('offline-bar').classList.toggle('show', !state.isOnline);
  if (state.isOnline) flushOfflineQueue();
}

export async function flushOfflineQueue() {
  if (!state.offlineQueue.length) return;
  const queue = [...state.offlineQueue];
  state.offlineQueue = [];
  localStorage.setItem('offlineQueue', '[]');
  for (const op of queue) {
    try {
      await fetch(op.url, op.opts);
    } catch (e) {
      state.offlineQueue.push(op);
    }
  }
  localStorage.setItem('offlineQueue', JSON.stringify(state.offlineQueue));
  if (!state.offlineQueue.length) {
    showNotif('✅ Synced!');
    // Note: load() will be called from main.js after importing
    if (window._load) window._load();
  }
}
