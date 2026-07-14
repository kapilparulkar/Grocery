// ── Grocery App — Main Entry Point ──
import { SUPABASE_URL, SUPABASE_KEY, catOrder, catEmoji } from './config.js';
import { state } from './state.js';
import { esc, haptic, showNotif, showToast, hideToast } from './utils.js';
import { api, updateOfflineStatus, flushOfflineQueue } from './api.js';
import { render, updateShopBadge, showSkeleton } from './render.js';
import { closeModal, selectCat, addItem, toggle, adjustQty, changeQty, del, confirmDel, undoLastDelete, moveToTop, openEdit, saveEdit } from './actions.js';

// ── Local aliases removed — use state.* directly ──

// ── QUICK WIN: Show cached data instantly, or skeleton if no cache ──
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

function initRealtime() {
  if (!state.activeFamilyId) return;
  // Clean up existing channel
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
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected');
        }
      });
  } catch(e) {
    console.warn('Realtime init failed, falling back to polling', e);
    state.realtimeChannel = null;
  }
}

// Offline queue — imported from api.js

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// Haptic — imported from utils.js

// Theme
function toggleTheme() {
  haptic();
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
(function(){ const t = localStorage.getItem('theme'); if(t) document.documentElement.setAttribute('data-theme', t); })();

// Tabs (removed - navigation now in drawer)

// closeModal, selectCat — imported from actions.js

// Drawer
function switchView(view) {
  const isHome = view === 'home';
  document.getElementById('view-home').style.display = isHome ? '' : 'none';
  document.getElementById('view-shop').style.display = isHome ? 'none' : '';
  document.getElementById('tab-btn-home').classList.toggle('active', isHome);
  document.getElementById('tab-btn-shop').classList.toggle('active', !isHome);
  document.getElementById('menu-home').classList.toggle('active-view', isHome);
  document.getElementById('menu-shop').classList.toggle('active-view', !isHome);
  if (isHome) render();
  else renderShop();
}

// updateShopBadge — imported from render.js

function openDrawer() {
  haptic();
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('show');
  // Sync toggles
  document.getElementById('themeToggle').classList.toggle('on', document.documentElement.getAttribute('data-theme') === 'dark');
  document.getElementById('deleteToggle').classList.toggle('on', document.getElementById('view-home').classList.contains('delete-mode'));
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('show');
}
function drawerAction(action) {
  closeDrawer();
  if (action === 'home') {
    switchView('home');
  } else if (action === 'shop') {
    switchView('shop');
  } else if (action === 'add') {
    document.getElementById('addModal').classList.add('show');
    setTimeout(() => document.getElementById('inp-name').focus(), 100);
  } else if (action === 'voice') {
    voiceInput();
  } else if (action === 'bulk') {
    openBulk();
  } else if (action === 'delete') {
    toggleDeleteMode();
  } else if (action === 'pdf') {
    exportPDF();
  } else if (action === 'share') {
    shareList();
  } else if (action === 'theme') {
    toggleTheme();
    openDrawer();
  } else if (action === 'logout') {
    localStorage.removeItem('sb_token');
    window.location.href = '/auth.html';
  } else if (action === 'invite') {
    api('/api/auth/me').then(d => {
      if (d && d.member) {
        document.getElementById('modal-invite-code').textContent = d.member.families.invite_code;
        document.getElementById('inviteModal').classList.add('show');
      }
    });
  } else if (action === 'add-family') {
    window.location.href = '/auth.html?add=true';
  } else if (action === 'about') {
    document.getElementById('aboutModal').classList.add('show');
  }
}

function toggleDeleteMode() {
  haptic();
  document.getElementById('view-home').classList.toggle('delete-mode');
}

// API — imported from api.js

async function load() {
  // Load families on first load
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

async function loadFamilies() {
  const d = await api('/api/auth/me');
  if (d && d.memberships) {
    state.allFamilies = d.memberships;
    if (!state.activeFamilyId && state.allFamilies.length > 0) {
      state.activeFamilyId = state.allFamilies[0].family_id;
      localStorage.setItem('active_family_id', state.activeFamilyId);
    }
    updateFamilyHeader();
  }
}

function updateFamilyHeader() {
  const active = state.allFamilies.find(f => f.family_id === state.activeFamilyId) || state.allFamilies[0];
  if (active) {
    document.getElementById('active-family-name').textContent = active.families.name;
  }
  // Show caret only if multiple families
  document.getElementById('family-caret').style.display = state.allFamilies.length > 1 ? '' : 'none';
}

function toggleFamilySwitcher() {
  if (state.allFamilies.length <= 1) return;
  const dd = document.getElementById('familySwitcherDropdown');
  dd.classList.toggle('show');
  if (dd.classList.contains('show')) {
    let html = state.allFamilies.map(f => {
      const isActive = f.family_id === state.activeFamilyId;
      return `<button class="family-switch-item${isActive?' active':''}" onclick="switchFamily('${f.family_id}')">
        <span>🏠</span>
        <span>${esc(f.families.name)}</span>
        ${isActive ? '<span class="check">✓</span>' : ''}
      </button>`;
    }).join('');
    html += `<button class="family-switch-item" onclick="drawerAction('add-family')" style="border-top:1px solid var(--border)">
      <span>🔑</span><span>Join Another Family</span>
    </button>`;
    dd.innerHTML = html;
  }
}

async function switchFamily(familyId) {
  state.activeFamilyId = familyId;
  localStorage.setItem('active_family_id', familyId);
  document.getElementById('familySwitcherDropdown').classList.remove('show');
  updateFamilyHeader();
  state.items = [];
  state.lastDataHash = '';
  await load();
  showNotif('Switched to ' + (state.allFamilies.find(f => f.family_id === familyId)?.families.name || 'family'));
}

// render, updateShopBadge, closeModal, selectCat, addItem, toggle, adjustQty, changeQty,
// del, confirmDel, undoLastDelete, moveToTop, openEdit, saveEdit
// — all imported from render.js and actions.js

// Bulk
function openBulk() { haptic(); document.getElementById('bulkModal').classList.add('show'); }
async function bulkAdd() {
  const text = document.getElementById('bulk-text').value.trim();
  if (!text) return;
  haptic('success');
  const cat = document.getElementById('bulk-cat').value;
  const data = await api('/api/items/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({items: text, category: cat}) });
  if (data) { items.push(...data); render(); showNotif(`✅ Added ${data.length} state.items`); }
  document.getElementById('bulk-text').value = '';
  closeModal('bulkModal');
}

// Voice
function voiceInput() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { showNotif('⚠️ Voice not supported'); return; }
  const btn = document.querySelector('.hamburger');
  if (state.recognition) { state.recognition.stop(); return; }
  haptic('medium');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.recognition = new SR();
  state.recognition.continuous = false;
  state.recognition.interimResults = false;
  state.recognition.lang = 'en-US';
  btn.classList.add('voice-active');
  showNotif('🎤 Listening...');
  state.recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const match = text.match(/(?:add\s+)?(\d+)?\s*(.+?)(?:\s+to\s+(.+))?$/i);
    if (match) {
      const name = match[2].trim();
      const qty = match[1] || '1';
      const cat = match[3] ? match[3].trim() : null;
      state.voicePending = { name, qty, cat };
      document.getElementById('voice-heard').textContent = `"${text}"`;
      document.getElementById('voice-parsed').innerHTML = `<b>${name}</b> ×${qty}${cat ? ` → ${cat}` : ''}`;
      document.getElementById('voiceConfirmModal').classList.add('show');
    }
    haptic('success');
  };
  state.recognition.onend = () => { btn.classList.remove('voice-active'); state.recognition = null; };
  state.recognition.onerror = () => { btn.classList.remove('voice-active'); state.recognition = null; showNotif('⚠️ Voice failed'); };
  state.recognition.start();
}

async function confirmVoiceAdd() {
  if (!state.voicePending) return;
  closeModal('voiceConfirmModal');
  document.getElementById('inp-name').value = state.voicePending.name;
  document.getElementById('inp-qty').value = state.voicePending.qty;
  if (state.voicePending.cat) {
    const sel = document.getElementById('inp-cat');
    for (let opt of sel.options) { if (opt.value.toLowerCase() === state.voicePending.cat.toLowerCase()) { sel.value = opt.value; break; } }
  }
  autoDetectUnit();
  await addItem();
  state.voicePending = null;
}

// Smart unit detection based on item name
function autoDetectUnit() {
  const name = document.getElementById('inp-name').value.toLowerCase();
  const unitSel = document.getElementById('inp-unit');
  const lItems = /\b(milk|oil|juice|water|buttermilk|lassi)\b/;
  const mlItems = /\b(essence|drops|syrup|vinegar|sauce|ketchup)\b/;
  const kgItems = /\b(rice|atta|flour|dal|sugar|salt|rajma|chole|chickpea|peas|potato|onion|tomato|wheat|maida|sooji|suji|besan|poha|jaggery|gud)\b/;
  const gItems = /\b(powder|masala|haldi|turmeric|chilli|coriander|cumin|jeera|hing|asafoetida|saffron|kesar|ajwain|methi|seeds)\b/;
  const bundleItems = /\b(coriander leaves|curry leaves|spinach|palak|methi|mint|pudina)\b/;
  const dozenItems = /\b(eggs?|banana)\b/;
  const packetItems = /\b(maggi|noodle|biscuit|chips|papad|bread|pav)\b/;

  if (lItems.test(name)) unitSel.value = 'L';
  else if (mlItems.test(name)) unitSel.value = 'ml';
  else if (bundleItems.test(name)) unitSel.value = 'bundle';
  else if (dozenItems.test(name)) unitSel.value = 'dozen';
  else if (packetItems.test(name)) unitSel.value = 'packet';
  else if (gItems.test(name)) unitSel.value = 'g';
  else if (kgItems.test(name)) unitSel.value = 'kg';
  else unitSel.value = 'pcs';
}

// Autocomplete from master state.items
let state.acTimer = null;
function onNameInput() {
  autoDetectUnit();
  clearTimeout(state.acTimer);
  const q = document.getElementById('inp-name').value.trim();
  if (q.length < 2) { hideAc(); return; }
  state.acTimer = setTimeout(() => fetchMasterItems(q), 250);
}

async function fetchMasterItems(q) {
  const data = await api(`/api/master-state.items?q=${encodeURIComponent(q)}`);
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

// Shopping mode
function shopSelectAll(checked) {
  haptic();
  document.querySelectorAll('.shopping-item input').forEach(cb => {
    cb.checked = checked;
    cb.closest('.shopping-item').classList.toggle('checked', checked);
  });
}

function renderShop() {
  const outItems = items.filter(it => !it.in_stock);
  let html = '';
  if (!outItems.length) { html = '<p style="color:var(--muted);text-align:center;margin-top:30px">All state.items in stock! 🎉</p>'; }
  // Group by category
  const grouped = {};
  outItems.forEach(it => { const c = it.category || 'Other'; if (!grouped[c]) grouped[c] = []; grouped[c].push(it); });
  for (const cat of catOrder) {
    if (!grouped[cat]) continue;
    html += `<div style="font-size:.75rem;color:var(--muted);font-weight:600;margin:10px 0 4px;text-transform:uppercase">${catEmoji[cat]||''} ${cat}</div>`;
    grouped[cat].forEach(it => {
      html += `<div class="shopping-item">
        <input type="checkbox" data-id="${it.id}">
        <div class="info">
          <div class="name">${esc(it.name)}</div>
          <div style="font-size:.75rem;color:var(--muted)">${it.note ? esc(it.note) + ' · ' : ''}${it.quantity} ${esc(it.unit || 'pcs')}</div>
        </div>
        <input type="number" min="0.1" step="0.1" value="${it.quantity}" data-id="${it.id}" class="shop-qty" style="padding:6px;border:1px solid var(--border);border-radius:6px;font-size:14px;text-align:center;background:var(--bg);color:var(--text)">
      </div>`;
    });
  }
  document.getElementById('shop-list').innerHTML = html;
  document.querySelectorAll('.shopping-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function() { haptic(); this.closest('.shopping-item').classList.toggle('checked', this.checked); });
  });
  document.querySelectorAll('.shop-qty').forEach(inp => {
    inp.addEventListener('change', function() {
      const id = parseInt(this.dataset.id);
      const qty = parseInt(this.value) || 1;
      changeQty(id, qty);
    });
  });
}

async function doneShop() {
  const checked = [...document.querySelectorAll('.shopping-item input[type="checkbox"]:checked')];
  if (!checked.length) return;
  // Validate no zero quantities
  const zeroItems = [];
  const ids = [];
  checked.forEach(cb => {
    const id = parseInt(cb.dataset.id);
    const qtyInput = cb.closest('.shopping-item').querySelector('.shop-qty');
    const qty = parseInt(qtyInput.value) || 0;
    if (qty === 0) {
      zeroItems.push(id);
      qtyInput.style.border = '2px solid var(--red)';
      setTimeout(() => qtyInput.style.border = '1px solid var(--border)', 2000);
    } else {
      ids.push(id);
    }
  });
  if (zeroItems.length) {
    showNotif(`⚠️ ${zeroItems.length} item(s) have 0 quantity — fix before restocking`);
    if (!ids.length) return;
  }
  haptic('success');
  await api('/api/items/bulk-restock', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ids}) });
  items.forEach(it => { if (ids.includes(it.id)) it.in_stock = true; });
  renderShop();
  updateShopBadge();
  showNotif(`✅ ${ids.length} item(s) restocked!`);
}

// Share — sends actual shopping list text via WhatsApp or native share
function shareList() {
  haptic();
  const outItems = items.filter(i => !i.in_stock);
  let text = '🛒 *Shopping List*\n';
  if (outItems.length) {
    const grouped = {};
    outItems.forEach(it => { const c = it.category||'Other'; if(!grouped[c]) grouped[c]=[]; grouped[c].push(it); });
    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      text += `\n*${catEmoji[cat]||''} ${cat}*\n`;
      grouped[cat].forEach(it => { text += `☐ ${it.name} ×${it.quantity}\n`; });
    }
  } else {
    text += '\n✅ All state.items in stock!';
  }
  if (navigator.share) {
    navigator.share({ title: 'Shopping List', text });
  } else {
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank');
  }
}

// Notifications — imported from utils.js

// Smart polling (30s, pauses when tab hidden, refreshes on visibility)
let state.lastDataHash = '';
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
    // Refresh immediately when coming back, then resume polling
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

// Export to PDF
function exportPDF() {
  haptic();
  const outItems = items.filter(i => !i.in_stock);
  const inItems = items.filter(i => i.in_stock);

  let html = `<html><head><title>Grocery List</title><style>
    body { font-family: -apple-system, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .date { color: #666; font-size: .85rem; margin-bottom: 20px; }
    h2 { font-size: 1rem; margin: 16px 0 8px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: .9rem; }
    td:first-child { width: 20px; }
    .qty { color: #666; font-size: .8rem; }
    .cat { color: #999; font-size: .75rem; }
    @media print { body { padding: 0; } }
  </style></head><body>`;
  html += `<h1>🛒 Shopping List</h1><p class="date">${new Date().toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>`;

  if (outItems.length) {
    html += '<h2>❌ Need to Buy</h2><table>';
    const grouped = {};
    outItems.forEach(it => { const c = it.category||'Other'; if(!grouped[c]) grouped[c]=[]; grouped[c].push(it); });
    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      grouped[cat].sort((a,b) => a.name.localeCompare(b.name)).forEach(it => {
        html += `<tr><td>☐</td><td>${it.name} <span class="qty">×${it.quantity}</span> <span class="cat">${it.category}</span></td></tr>`;
      });
    }
    html += '</table>';
  }

  if (inItems.length) {
    html += '<h2>✅ In Stock</h2><table>';
    const grouped = {};
    inItems.forEach(it => { const c = it.category||'Other'; if(!grouped[c]) grouped[c]=[]; grouped[c].push(it); });
    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      grouped[cat].sort((a,b) => a.name.localeCompare(b.name)).forEach(it => {
        html += `<tr><td>☑</td><td>${it.name} <span class="qty">×${it.quantity}</span> <span class="cat">${it.category}</span></td></tr>`;
      });
    }
    html += '</table>';
  }

  html += '</body></html>';
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

// Keyboard - add item on Enter
document.getElementById('inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });

// ── UNIFIED SEARCH + ADD FROM CATALOG ──────────────────────────────
let state.masterSearchTimer = null;
let state.lastMasterResults = [];

function onSearchInput(value) {
  render(); // filter existing state.items as usual
  const q = value.trim();
  const sugBox = document.getElementById('search-suggestions');

  // Show/hide clear button
  document.getElementById('search-clear').classList.toggle('show', q.length > 0);

  if (!q || q.length < 2) {
    sugBox.style.display = 'none';
    state.lastMasterResults = [];
    return;
  }

  clearTimeout(state.masterSearchTimer);
  state.masterSearchTimer = setTimeout(async () => {
    const data = await api(`/api/master-state.items?q=${encodeURIComponent(q)}`);
    if (!data || !Array.isArray(data)) {
      // API failed, but still show "Add as custom item" option
      state.lastMasterResults = [];
      renderSuggestions(q);
      return;
    }

    // Filter out state.items already in the family list
    const existingNames = new Set(items.map(i => i.name.toLowerCase()));
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

  if (html) {
    sugBox.innerHTML = html;
    sugBox.style.display = 'block';
  } else {
    sugBox.style.display = 'none';
  }
}

async function quickAddByIndex(idx) {
  const it = state.lastMasterResults[idx];
  if (!it) return;
  haptic('success');

  // Optimistic: add to list and remove from suggestions immediately
  const tempId = -Date.now();
  items.push({ id: tempId, name: it.name, category: it.category, quantity: it.default_quantity || 1, unit: it.unit || 'pcs', in_stock: true, sort_order: 9999, added_by: 'You', _optimistic: true });
  state.lastMasterResults = state.lastMasterResults.filter(x => x.name !== it.name);
  const q = document.getElementById('main-search').value.trim();
  renderSuggestions(q);
  render();
  showNotif(`✅ Added "${it.name}"`);

  const data = await api('/api/items', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name: it.name, category: it.category, quantity: it.default_quantity || 1, unit: it.unit || 'pcs' })
  });
  state.items = items.filter(i => i.id !== tempId);
  if (data) {
    if (data.merged) {
      const i = items.findIndex(x => x.id === data.id);
      if (i >= 0) state.items[i] = data;
      showNotif(`✅ "${data.name}" qty updated to ${data.quantity}`);
    } else {
      items.push(data);
    }
    localStorage.setItem('grocery_items', JSON.stringify(state.items));
    render();
  }
}

async function quickAddCustom() {
  const name = document.getElementById('main-search').value.trim();
  if (!name) return;
  haptic('success');
  const data = await api('/api/items', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name, category: 'Other', quantity: 1, unit: 'pcs' })
  });
  if (data) {
    if (data.merged) {
      const i = items.findIndex(x => x.id === data.id);
      if (i >= 0) state.items[i] = data;
      showNotif(`✅ "${data.name}" qty updated to ${data.quantity}`);
    } else {
      items.push(data);
      showNotif(`✅ Added "${name}"`);
    }
    localStorage.setItem('grocery_items', JSON.stringify(state.items));
    document.getElementById('main-search').value = '';
    document.getElementById('search-suggestions').style.display = 'none';
    render();
  }
}

// Hide suggestions on Escape
document.getElementById('main-search').addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    clearSearch();
  }
});

function clearSearch() {
  document.getElementById('main-search').value = '';
  document.getElementById('search-suggestions').style.display = 'none';
  document.getElementById('search-clear').classList.remove('show');
  state.lastMasterResults = [];
  render();
}

// Close family switcher when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.family-switcher') && !e.target.closest('.family-switcher-dropdown')) {
    document.getElementById('familySwitcherDropdown').classList.remove('show');
  }
});

// Swipe support (RAF-throttled for smooth performance)
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

// Pull-to-refresh (spring-based feel)
let pullStartY = 0, isPulling = false;
document.addEventListener('touchstart', e => {
  if (window.scrollY === 0 && !e.target.closest('.item') && !e.target.closest('.modal')) {
    pullStartY = e.touches[0].clientY; isPulling = true;
  }
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

// PWA
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

// Init
updateOfflineStatus();

// Onboarding
let obStep = 0;
function showOnboarding() {
  if (localStorage.getItem('onboarding_done')) return;
  document.getElementById('onboarding').classList.add('show');
}
function nextOnboardingStep() {
  obStep++;
  if (obStep > 3) { dismissOnboarding(); return; }
  document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ob-step-' + obStep).classList.add('active');
  document.querySelectorAll('.onboarding-dots .dot').forEach(d => d.classList.toggle('active', parseInt(d.dataset.step) === obStep));
  if (obStep === 3) document.getElementById('ob-next').textContent = 'Get Started ✓';
}
function dismissOnboarding() {
  document.getElementById('onboarding').classList.remove('show');
  localStorage.setItem('onboarding_done', '1');
}

// Refresh token via Supabase then load
window._load = load; // expose for offline queue flush
(function initApp() {
  const token = localStorage.getItem('sb_token');
  if (!token) { window.location.href = '/auth.html'; return; }
  // Verify token is still valid via our own API
  fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } })
    .then(r => r.json())
    .then(d => {
      if (d && d.user) {
        load().then(() => showOnboarding());
      } else {
        localStorage.removeItem('sb_token');
        window.location.href = '/auth.html';
      }
    })
    .catch(() => load());
})();

// ?? Expose functions to inline onclick handlers ??
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.drawerAction = drawerAction;
window.toggleFamilySwitcher = toggleFamilySwitcher;
window.switchFamily = switchFamily;
window.switchView = switchView;
window.selectCat = selectCat;
window.toggle = toggle;
window.adjustQty = adjustQty;
window.moveToTop = moveToTop;
window.del = del;
window.confirmDel = confirmDel;
window.undoLastDelete = undoLastDelete;
window.openEdit = openEdit;
window.saveEdit = saveEdit;
window.addItem = addItem;
window.bulkAdd = bulkAdd;
window.closeModal = closeModal;
window.onSearchInput = onSearchInput;
window.quickAddByIndex = quickAddByIndex;
window.quickAddCustom = quickAddCustom;
window.clearSearch = clearSearch;
window.onNameInput = onNameInput;
window.selectMasterIdx = selectMasterIdx;
window.confirmVoiceAdd = confirmVoiceAdd;
window.shopSelectAll = shopSelectAll;
window.doneShop = doneShop;
window.nextOnboardingStep = nextOnboardingStep;
window.dismissOnboarding = dismissOnboarding;
