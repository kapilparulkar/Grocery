// ── Grocery App — Main Entry Point ──
import { SUPABASE_URL, SUPABASE_KEY, catOrder, catEmoji } from './config.js';
import { state } from './state.js';
import { esc, haptic, showNotif, showToast, hideToast } from './utils.js';
import { api, updateOfflineStatus, flushOfflineQueue } from './api.js';
import { render, updateShopBadge, showSkeleton } from './render.js';
import { closeModal, selectCat, addItem, toggle, adjustQty, changeQty, del, confirmDel, undoLastDelete, moveToTop, openEdit, saveEdit } from './actions.js';
import { toggleTheme, initTheme } from './theme.js';
import { showOnboarding, nextOnboardingStep, dismissOnboarding } from './onboarding.js';
import { openBulk, bulkAdd } from './bulk.js';
import { voiceInput, confirmVoiceAdd, autoDetectUnit } from './voice.js';
import { loadFamilies, updateFamilyHeader, toggleFamilySwitcher, switchFamily } from './family.js';
import { switchView, shopSelectAll, renderShop, doneShop } from './shop.js';
import { shareList, exportPDF } from './share.js';

// ── Init theme immediately ──
initTheme();

// ── Show cached data instantly, or skeleton if no cache ──
(function renderCachedItems() {
  const cached = localStorage.getItem('grocery_items');
  if (cached) {
    try {
      state.items = JSON.parse(cached);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => render());
      } else {
        setTimeout(render, 0);
      }
    } catch(e) { /* ignore corrupt cache */ }
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showSkeleton);
    } else {
      setTimeout(showSkeleton, 0);
    }
  }
})();

// ── Realtime ──
function initRealtime() {
  if (!state.activeFamilyId) return;
  if (state.realtimeChannel && state.supabaseClient) {
    state.supabaseClient.removeChannel(state.realtimeChannel);
    state.realtimeChannel = null;
  }
  try {
    if (!state.supabaseClient) {
      state.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    state.realtimeChannel = state.supabaseClient
      .channel('items-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `family_id=eq.${state.activeFamilyId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const exists = state.items.find(i => i.id === payload.new.id);
          if (!exists) { state.items.push(payload.new); render(); }
        } else if (payload.eventType === 'UPDATE') {
          const idx = state.items.findIndex(i => i.id === payload.new.id);
          if (idx >= 0) { state.items[idx] = payload.new; const scrollY = window.scrollY; render(); window.scrollTo(0, scrollY); }
        } else if (payload.eventType === 'DELETE') {
          state.items = state.items.filter(i => i.id !== payload.old.id);
          render();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('Realtime connected');
      });
  } catch(e) {
    console.warn('Realtime init failed, falling back to polling', e);
    state.realtimeChannel = null;
  }
}

// ── Offline listeners ──
window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// ── Drawer ──
function openDrawer() {
  haptic();
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('themeToggle').classList.toggle('on', document.documentElement.getAttribute('data-theme') === 'dark');
  document.getElementById('deleteToggle').classList.toggle('on', document.getElementById('view-home').classList.contains('delete-mode'));
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('show');
}
function drawerAction(action) {
  closeDrawer();
  if (action === 'home') switchView('home');
  else if (action === 'shop') switchView('shop');
  else if (action === 'add') { document.getElementById('addModal').classList.add('show'); setTimeout(() => document.getElementById('inp-name').focus(), 100); }
  else if (action === 'voice') voiceInput();
  else if (action === 'bulk') openBulk();
  else if (action === 'delete') toggleDeleteMode();
  else if (action === 'pdf') exportPDF();
  else if (action === 'share') shareList();
  else if (action === 'theme') { toggleTheme(); openDrawer(); }
  else if (action === 'logout') { localStorage.removeItem('sb_token'); window.location.href = '/auth.html'; }
  else if (action === 'invite') {
    api('/api/auth/me').then(d => {
      if (d && d.member) { document.getElementById('modal-invite-code').textContent = d.member.families.invite_code; document.getElementById('inviteModal').classList.add('show'); }
    });
  }
  else if (action === 'add-family') window.location.href = '/auth.html?add=true';
  else if (action === 'about') document.getElementById('aboutModal').classList.add('show');
}
function toggleDeleteMode() {
  haptic();
  document.getElementById('view-home').classList.toggle('delete-mode');
}

// ── Load data ──
async function load() {
  if (state.allFamilies.length === 0) await loadFamilies();
  const data = await api('/api/items');
  if (data && Array.isArray(data)) {
    state.items = data;
    state.lastDataHash = JSON.stringify(data);
    localStorage.setItem('grocery_items', JSON.stringify(state.items));
    render();
    initRealtime();
  }
  startPolling();
}

// ── Polling ──
let pollTimer = null;
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (state.realtimeChannel) return;
    if (document.hidden) return;
    const data = await api('/api/items');
    if (!data || !Array.isArray(data)) return;
    const hash = JSON.stringify(data);
    if (hash !== state.lastDataHash) {
      state.lastDataHash = hash;
      state.items = data;
      localStorage.setItem('grocery_items', JSON.stringify(state.items));
      const scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
    }
  }, 30000);
}
function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();
  } else {
    (async () => {
      const data = await api('/api/items');
      if (data && Array.isArray(data)) {
        const hash = JSON.stringify(data);
        if (hash !== state.lastDataHash) {
          state.lastDataHash = hash;
          state.items = data;
          localStorage.setItem('grocery_items', JSON.stringify(state.items));
          const scrollY = window.scrollY;
          render();
          window.scrollTo(0, scrollY);
        }
      }
    })();
    startPolling();
  }
});

// ── Autocomplete in Add Modal ──
function onNameInput() {
  autoDetectUnit();
  clearTimeout(state.acTimer);
  const q = document.getElementById('inp-name').value.trim();
  if (q.length < 2) { hideAc(); return; }
  state.acTimer = setTimeout(() => fetchMasterItems(q), 250);
}

async function fetchMasterItems(q) {
  const data = await api(`/api/master-items?q=${encodeURIComponent(q)}`);
  if (!data || !data.length) { hideAc(); return; }
  window._acResults = data;
  const list = document.getElementById('ac-list');
  list.innerHTML = data.map((it, i) =>
    `<div class="autocomplete-item" onclick="selectMasterIdx(${i})">
      <span class="ac-name">${esc(it.name)}</span>
      <span class="ac-meta">${esc(it.category)} \u00b7 ${it.default_quantity} ${esc(it.unit)}</span>
    </div>`
  ).join('');
  list.classList.add('show');
}

function selectMasterIdx(i) {
  const it = window._acResults[i];
  if (!it) return;
  document.getElementById('inp-name').value = it.name;
  document.getElementById('inp-cat').value = it.category;
  document.getElementById('inp-unit').value = it.unit;
  document.getElementById('inp-qty').value = it.default_quantity;
  hideAc();
}

function hideAc() {
  document.getElementById('ac-list').classList.remove('show');
}

// ── Search + Add from Catalog ──
function onSearchInput(value) {
  render(); // filter existing items as usual
  const q = value.trim();
  const sugBox = document.getElementById('search-suggestions');
  document.getElementById('search-clear').classList.toggle('show', q.length > 0);

  if (!q || q.length < 2) {
    sugBox.style.display = 'none';
    state.lastMasterResults = [];
    return;
  }

  clearTimeout(state.masterSearchTimer);
  state.masterSearchTimer = setTimeout(async () => {
    const data = await api(`/api/master-items?q=${encodeURIComponent(q)}`);
    if (!data || !Array.isArray(data)) {
      state.lastMasterResults = [];
      renderSuggestions(q);
      return;
    }
    const existingNames = new Set(state.items.map(i => i.name.toLowerCase()));
    state.lastMasterResults = data.filter(it => !existingNames.has(it.name.toLowerCase()));
    renderSuggestions(q);
  }, 300);
}

function renderSuggestions(query) {
  const sugBox = document.getElementById('search-suggestions');
  let html = '';
  if (state.lastMasterResults.length > 0) {
    html += `<div class="sug-section">➕ Add from catalog</div>`;
    for (let i = 0; i < state.lastMasterResults.length; i++) {
      const it = state.lastMasterResults[i];
      html += `<div class="sug-item">
        <div class="si-info">
          <div class="si-name">${esc(it.name)}</div>
          <div class="si-cat">${esc(it.category)} · ${it.default_quantity} ${esc(it.unit)}</div>
        </div>
        <button class="si-add" onclick="quickAddByIndex(${i})">+ Add</button>
      </div>`;
    }
  }
  if (query.length >= 2) {
    html += `<div class="sug-custom">
      <span style="flex:1;font-size:.85rem">Add "<b>${esc(query)}</b>" as new item</span>
      <button class="si-add" onclick="quickAddCustom()">+ Add</button>
    </div>`;
  }
  if (html) { sugBox.innerHTML = html; sugBox.style.display = 'block'; }
  else { sugBox.style.display = 'none'; }
}

async function quickAddByIndex(idx) {
  const it = state.lastMasterResults[idx];
  if (!it) return;
  haptic('success');
  const tempId = -Date.now();
  state.items.push({ id: tempId, name: it.name, category: it.category, quantity: it.default_quantity || 1, unit: it.unit || 'pcs', in_stock: true, sort_order: 9999, added_by: 'You', _optimistic: true });
  state.lastMasterResults = state.lastMasterResults.filter(x => x.name !== it.name);
  renderSuggestions(document.getElementById('main-search').value.trim());
  render();
  showNotif(`✅ Added "${it.name}"`);

  const data = await api('/api/items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: it.name, category: it.category, quantity: it.default_quantity || 1, unit: it.unit || 'pcs' }) });
  state.items = state.items.filter(i => i.id !== tempId);
  if (data) {
    if (data.merged) { const i = state.items.findIndex(x => x.id === data.id); if (i >= 0) state.items[i] = data; showNotif(`✅ "${data.name}" qty updated to ${data.quantity}`); }
    else { state.items.push(data); }
    localStorage.setItem('grocery_items', JSON.stringify(state.items));
    render();
  }
}

async function quickAddCustom() {
  const name = document.getElementById('main-search').value.trim();
  if (!name) return;
  haptic('success');
  const data = await api('/api/items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, category: 'Other', quantity: 1, unit: 'pcs' }) });
  if (data) {
    if (data.merged) { const i = state.items.findIndex(x => x.id === data.id); if (i >= 0) state.items[i] = data; showNotif(`✅ "${data.name}" qty updated to ${data.quantity}`); }
    else { state.items.push(data); showNotif(`✅ Added "${name}"`); }
    localStorage.setItem('grocery_items', JSON.stringify(state.items));
    document.getElementById('main-search').value = '';
    document.getElementById('search-suggestions').style.display = 'none';
    render();
  }
}

function clearSearch() {
  document.getElementById('main-search').value = '';
  document.getElementById('search-suggestions').style.display = 'none';
  document.getElementById('search-clear').classList.remove('show');
  state.lastMasterResults = [];
  render();
}

// ── Keyboard shortcuts ──
document.getElementById('inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
document.getElementById('main-search').addEventListener('keydown', e => { if (e.key === 'Escape') clearSearch(); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.family-switcher') && !e.target.closest('.family-switcher-dropdown')) {
    document.getElementById('familySwitcherDropdown').classList.remove('show');
  }
});

// ── Swipe gestures ──
let touchStartX = 0, touchItem = null, rafPending = false;
document.addEventListener('touchstart', e => { const item = e.target.closest('.item'); if (!item || e.target.closest('button')) return; touchStartX = e.touches[0].clientX; touchItem = item; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!touchItem) return;
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 80) { const id = parseInt(touchItem.dataset.id); haptic('medium'); toggle(id); }
  touchItem.style.transform = ''; touchItem.querySelectorAll('.swipe-bg').forEach(el => el.style.opacity = '0'); touchItem = null;
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!touchItem || rafPending) return;
  rafPending = true;
  const clientX = e.touches[0].clientX;
  requestAnimationFrame(() => {
    rafPending = false;
    if (!touchItem) return;
    const diff = clientX - touchStartX;
    if (Math.abs(diff) > 20) {
      touchItem.style.transform = `translateX(${diff * 0.4}px)`;
      if (diff < -40) touchItem.querySelector('.swipe-bg.left').style.opacity = '1'; else touchItem.querySelector('.swipe-bg.left').style.opacity = '0';
      if (diff > 40 && touchItem.classList.contains('out')) touchItem.querySelector('.swipe-bg.right').style.opacity = '1'; else if(touchItem.querySelector('.swipe-bg.right')) touchItem.querySelector('.swipe-bg.right').style.opacity = '0';
    }
  });
}, { passive: true });

// ── Pull-to-refresh ──
let pullStartY = 0, isPulling = false;
document.addEventListener('touchstart', e => {
  if (window.scrollY === 0 && !e.target.closest('.item') && !e.target.closest('.modal')) { pullStartY = e.touches[0].clientY; isPulling = true; }
});
document.addEventListener('touchmove', e => {
  if (!isPulling) return;
  const diff = e.touches[0].clientY - pullStartY;
  const indicator = document.getElementById('pull-indicator');
  if (diff > 20) {
    const progress = Math.min(diff / 100, 1);
    indicator.classList.add('pulling');
    indicator.style.opacity = progress;
    indicator.style.transform = `translateY(${Math.min(diff * 0.3, 30)}px) scale(${0.8 + progress * 0.2})`;
    indicator.textContent = diff > 80 ? '↓ Release to refresh' : '↓ Pull to refresh';
  }
});
document.addEventListener('touchend', e => {
  if (!isPulling) return;
  const diff = e.changedTouches[0].clientY - pullStartY;
  isPulling = false;
  const indicator = document.getElementById('pull-indicator');
  indicator.classList.remove('pulling');
  indicator.style.opacity = '0';
  indicator.style.transform = '';
  indicator.textContent = '↓ Pull to refresh';
  if (diff > 80) { haptic('medium'); load(); showNotif('🔄 Refreshed'); }
});

// ── PWA ──
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');

// ── Init ──
updateOfflineStatus();
window._load = load;

(function initApp() {
  const token = localStorage.getItem('sb_token');
  if (!token) { window.location.href = '/auth.html'; return; }
  fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } })
    .then(r => r.json())
    .then(d => {
      if (d && d.user) { load().then(() => showOnboarding()); }
      else { localStorage.removeItem('sb_token'); window.location.href = '/auth.html'; }
    })
    .catch(() => load());
})();

// ── Event Delegation (replaces all onclick/window.* exports) ──
const actions = {
  openDrawer, closeDrawer, toggleFamilySwitcher, switchView,
  selectCat, toggle, adjustQty, moveToTop, del, confirmDel,
  undoLastDelete, openEdit, saveEdit, addItem, bulkAdd, closeModal,
  onSearchInput, quickAddByIndex, quickAddCustom, clearSearch,
  onNameInput, selectMasterIdx, confirmVoiceAdd, shopSelectAll,
  doneShop, nextOnboardingStep, dismissOnboarding,
  copyInviteCode: () => { navigator.clipboard.writeText(document.getElementById('modal-invite-code').textContent); showNotif('Code copied!'); },
  drawerAction
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const param = el.dataset.param;
  if (action === 'drawerAction' && param) { drawerAction(param); }
  else if (action === 'switchView' && param) { switchView(param); }
  else if (action === 'closeModal' && param) { closeModal(param); }
  else if (action === 'shopSelectAll') { shopSelectAll(param === 'true'); }
  else if (action === 'switchFamily' && param) { switchFamily(param); }
  else if (actions[action]) { actions[action](); }
});

// Input events (can't use data-action for these)
document.getElementById('main-search').addEventListener('input', (e) => onSearchInput(e.target.value));
document.getElementById('inp-name').addEventListener('input', () => onNameInput());

// Also expose key functions on window for dynamically rendered onclick handlers (render.js, shop.js)
window.toggle = toggle;
window.adjustQty = adjustQty;
window.moveToTop = moveToTop;
window.del = del;
window.openEdit = openEdit;
window.selectCat = selectCat;
window.quickAddByIndex = quickAddByIndex;
window.quickAddCustom = quickAddCustom;
window.selectMasterIdx = selectMasterIdx;
window.switchFamily = switchFamily;
window.drawerAction = drawerAction;
