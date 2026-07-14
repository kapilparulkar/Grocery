let items = [];
let deletedHistory = [];
let toastTimer = null;
let activeCat = 'All';
let recognition = null;
let isOnline = navigator.onLine;
let offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
let voicePending = null;

const catOrder = ['Produce','Dairy','Meat','Bakery','Frozen','Beverages','Snacks','Household','Personal Care','Other'];
const catEmoji = {Produce:'ðŸ¥¬',Dairy:'ðŸ¥›',Meat:'ðŸ¥©',Bakery:'ðŸž',Frozen:'ðŸ§Š',Beverages:'â˜•',Snacks:'ðŸª',Household:'ðŸ§¹','Personal Care':'ðŸ§´',Other:'ðŸ“¦'};
let realtimeChannel = null;
let activeFamilyId = localStorage.getItem('active_family_id') || null;
let allFamilies = [];
let supabaseClient = null;

// â”€â”€ QUICK WIN: Show cached data instantly, or skeleton if no cache â”€â”€
(function renderCachedItems() {
  const cached = localStorage.getItem('grocery_items');
  if (cached) {
    try {
      items = JSON.parse(cached);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => render());
      } else {
        setTimeout(render, 0);
      }
    } catch(e) { /* ignore corrupt cache */ }
  } else {
    // Show skeleton placeholders while waiting for first load
    const showSkeleton = () => {
      const listEl = document.getElementById('list');
      if (!listEl) return;
      let sk = '<div class="skeleton skeleton-cat"></div>';
      for (let i = 0; i < 6; i++) {
        sk += `<div class="skeleton-item"><div class="skeleton sk-name"></div><div class="skeleton sk-qty"></div></div>`;
      }
      listEl.innerHTML = sk;
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showSkeleton);
    } else {
      setTimeout(showSkeleton, 0);
    }
  }
})();

function initRealtime() {
  if (!activeFamilyId) return;
  // Clean up existing channel
  if (realtimeChannel && supabaseClient) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  try {
    const SUPABASE_URL = 'https://hgnyfhilnbcoemxfpozm.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnbnlmaGlsbmJjb2VteGZwb3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTYyNTgsImV4cCI6MjA5NzA5MjI1OH0.o8ZTGLDH0be9FAkRkKYcm-MNEOZ44GG1uZuKuZqQLj4';
    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    realtimeChannel = supabaseClient
      .channel('items-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `family_id=eq.${activeFamilyId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const exists = items.find(i => i.id === payload.new.id);
          if (!exists) { items.push(payload.new); render(); }
        } else if (payload.eventType === 'UPDATE') {
          const idx = items.findIndex(i => i.id === payload.new.id);
          if (idx >= 0) { items[idx] = payload.new; const scrollY = window.scrollY; render(); window.scrollTo(0, scrollY); }
        } else if (payload.eventType === 'DELETE') {
          items = items.filter(i => i.id !== payload.old.id);
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
    realtimeChannel = null;
  }
}

// Offline queue
function updateOfflineStatus() {
  isOnline = navigator.onLine;
  document.getElementById('offline-bar').classList.toggle('show', !isOnline);
  if (isOnline) flushOfflineQueue();
}

async function flushOfflineQueue() {
  if (!offlineQueue.length) return;
  const queue = [...offlineQueue];
  offlineQueue = [];
  localStorage.setItem('offlineQueue', '[]');
  for (const op of queue) {
    try {
      await fetch(op.url, op.opts);
    } catch(e) {
      offlineQueue.push(op);
    }
  }
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  if (!offlineQueue.length) { showNotif('âœ… Synced!'); load(); }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// Haptic
function haptic(style = 'light') {
  if (navigator.vibrate) {
    const p = { light: 10, medium: 25, heavy: 50, success: [10, 50, 10] };
    navigator.vibrate(p[style] || 10);
  }
}

// Theme
function toggleTheme() {
  haptic();
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
(function(){ const t = localStorage.getItem('theme'); if(t) document.documentElement.setAttribute('data-theme', t); })();

// Tabs (removed - navigation now in drawer)

function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function selectCat(cat) { haptic(); activeCat = cat; render(); }

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

function updateShopBadge() {
  const count = items.filter(i => !i.in_stock).length;
  document.getElementById('shop-badge').textContent = count > 0 ? `(${count})` : '';
}

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

// API with auth token
function authHeaders(extra) {
  const token = localStorage.getItem('sb_token');
  const h = {'Content-Type':'application/json','Authorization':'Bearer '+token};
  if (activeFamilyId) h['X-Family-Id'] = activeFamilyId;
  return Object.assign(h, extra||{});
}
async function api(url, opts) {
  if (!opts) opts = {};
  opts.headers = authHeaders(opts.headers);
  try {
    if (!navigator.onLine) {
      if (opts.method && opts.method !== 'GET') {
        offlineQueue.push({ url, opts });
        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
        showNotif('ðŸ“¡ Saved offline â€” will sync later');
      }
      return null;
    }
    const r = await fetch(url, opts);
    if (r.status === 401) { localStorage.removeItem('sb_token'); window.location.href='/auth.html'; return null; }
    return await r.json();
  } catch(e) {
    if (opts.method && opts.method !== 'GET') {
      offlineQueue.push({ url, opts });
      localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
      showNotif('ðŸ“¡ Saved offline â€” will sync later');
    } else {
      showNotif('âš ï¸ Server unreachable');
    }
    return null;
  }
}

async function load() {
  // Load families on first load
  if (allFamilies.length === 0) await loadFamilies();
  const data = await api('/api/items');
  if (data && Array.isArray(data)) {
    items = data;
    lastDataHash = JSON.stringify(data);
    localStorage.setItem('grocery_items', JSON.stringify(items));
    render();
    initRealtime();
  }
  startPolling();
}

async function loadFamilies() {
  const d = await api('/api/auth/me');
  if (d && d.memberships) {
    allFamilies = d.memberships;
    if (!activeFamilyId && allFamilies.length > 0) {
      activeFamilyId = allFamilies[0].family_id;
      localStorage.setItem('active_family_id', activeFamilyId);
    }
    updateFamilyHeader();
  }
}

function updateFamilyHeader() {
  const active = allFamilies.find(f => f.family_id === activeFamilyId) || allFamilies[0];
  if (active) {
    document.getElementById('active-family-name').textContent = active.families.name;
  }
  // Show caret only if multiple families
  document.getElementById('family-caret').style.display = allFamilies.length > 1 ? '' : 'none';
}

function toggleFamilySwitcher() {
  if (allFamilies.length <= 1) return;
  const dd = document.getElementById('familySwitcherDropdown');
  dd.classList.toggle('show');
  if (dd.classList.contains('show')) {
    let html = allFamilies.map(f => {
      const isActive = f.family_id === activeFamilyId;
      return `<button class="family-switch-item${isActive?' active':''}" onclick="switchFamily('${f.family_id}')">
        <span>ðŸ </span>
        <span>${esc(f.families.name)}</span>
        ${isActive ? '<span class="check">âœ“</span>' : ''}
      </button>`;
    }).join('');
    html += `<button class="family-switch-item" onclick="drawerAction('add-family')" style="border-top:1px solid var(--border)">
      <span>ðŸ”‘</span><span>Join Another Family</span>
    </button>`;
    dd.innerHTML = html;
  }
}

async function switchFamily(familyId) {
  activeFamilyId = familyId;
  localStorage.setItem('active_family_id', familyId);
  document.getElementById('familySwitcherDropdown').classList.remove('show');
  updateFamilyHeader();
  items = [];
  lastDataHash = '';
  await load();
  showNotif('Switched to ' + (allFamilies.find(f => f.family_id === familyId)?.families.name || 'family'));
}

function render() {
  const search = document.getElementById('main-search').value.toLowerCase();
  const filtered = items.filter(it => !search || it.name.toLowerCase().includes(search));

  const categories = {};
  filtered.forEach(it => {
    const cat = it.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(it);
  });

  // Category tabs
  let tabsHtml = `<div class="cat-tab${activeCat==='All'?' active':''}" onclick="selectCat('All')">All<span class="count">${filtered.length}</span></div>`;
  for (const cat of catOrder) {
    if (categories[cat]) {
      tabsHtml += `<div class="cat-tab${activeCat===cat?' active':''}" onclick="selectCat('${cat}')">${catEmoji[cat]||''} ${cat}<span class="count">${categories[cat].length}</span></div>`;
    }
  }
  document.getElementById('cat-tabs').innerHTML = tabsHtml;

  const sortedCats = Object.keys(categories).sort((a,b) => catOrder.indexOf(a) - catOrder.indexOf(b));
  const visibleCats = activeCat === 'All' ? sortedCats : sortedCats.filter(c => c === activeCat);

  let html = '';
  for (const cat of visibleCats) {
    const catItems = categories[cat].sort((a,b) => b.in_stock - a.in_stock || a.name.localeCompare(b.name));
    html += `<div class="category-group"><div class="category-title">${catEmoji[cat]||'ðŸ“¦'} ${esc(cat)} (${catItems.length})</div>`;
    for (const it of catItems) {
      const cls = it.in_stock ? '' : ' out';
      const toggleLabel = it.in_stock ? 'Out' : 'âœ“';
      const noteHtml = it.note ? `<div class="note">ðŸ“ ${esc(it.note)}</div>` : '';
      html += `<div class="item${cls}" data-id="${it.id}">
        <div class="swipe-bg left">â—€ Out</div>
        <div class="swipe-bg right">Restock â–¶</div>
        <div class="info" onclick="openEdit(${it.id})" style="cursor:pointer"><div class="name">${esc(it.name)}</div>${noteHtml}${it.added_by ? `<div style="font-size:.7rem;color:var(--muted)">Added by ${esc(it.added_by)}</div>` : ''}</div>
        <div class="qty-ctrl">
          <button onclick="adjustQty(${it.id},-1)">âˆ’</button>
          <span>${it.quantity} ${esc(it.unit || 'pcs')}</span>
          <button onclick="adjustQty(${it.id},1)">+</button>
        </div>
        <button class="btn-move-top" onclick="moveToTop(${it.id})">â†‘</button>
        <button class="btn-toggle" onclick="toggle(${it.id})">${toggleLabel}</button>
        <button class="btn-del" onclick="del(${it.id})">âœ•</button>
      </div>`;
    }
    html += '</div>';
  }
  document.getElementById('list').innerHTML = html || `<div class="empty-state">
    <div class="emoji">ðŸ›’</div>
    <div class="title">Your list is empty</div>
    <div class="hint">Search above to add items from the catalog,<br>or use the â˜° menu â†’ Add Item</div>
  </div>`;
  updateShopBadge();
}

// CRUD
async function addItem() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) { document.getElementById('inp-name').style.animation = 'shake .4s'; setTimeout(() => document.getElementById('inp-name').style.animation = '', 400); return; }
  haptic('success');
  const qty = parseInt(document.getElementById('inp-qty').value) || 1;
  const cat = document.getElementById('inp-cat').value;
  const note = document.getElementById('inp-note').value.trim();
  const unit = document.getElementById('inp-unit').value;

  // Optimistic UI: show item immediately with temp ID
  const tempId = -Date.now();
  const optimisticItem = { id: tempId, name, quantity: qty, category: cat, note: note || null, unit, in_stock: true, sort_order: 9999, added_by: 'You', _optimistic: true };
  items.push(optimisticItem);
  render();

  // Clear form and close modal immediately (feels instant)
  document.getElementById('inp-name').value = '';
  document.getElementById('inp-qty').value = '1';
  document.getElementById('inp-note').value = '';
  document.getElementById('inp-unit').value = 'pcs';
  closeModal('addModal');

  // Now make the actual API call
  const data = await api('/api/items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, quantity: qty, category: cat, note: note || undefined, unit}) });
  // Remove optimistic item
  items = items.filter(i => i.id !== tempId);
  if (data) {
    if (data.merged) {
      const idx = items.findIndex(i => i.id === data.id);
      if (idx >= 0) items[idx] = data; else items.push(data);
      showNotif(`âœ… "${data.name}" already exists â€” quantity updated to ${data.quantity}`);
    } else {
      items.push(data);
    }
    localStorage.setItem('grocery_items', JSON.stringify(items));
  } else {
    showNotif(`âš ï¸ Failed to add "${name}" â€” will retry when online`);
  }
  render();
}

async function toggle(id) {
  haptic('medium');
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return;
  const prevState = items[idx].in_stock;
  items[idx] = { ...items[idx], in_stock: !prevState };

  // Patch DOM directly â€” no full render
  const el = document.querySelector(`.item[data-id="${id}"]`);
  if (el) {
    el.classList.toggle('out', !items[idx].in_stock);
    const btn = el.querySelector('.btn-toggle');
    if (btn) btn.textContent = items[idx].in_stock ? 'Out' : 'âœ“';
  }
  updateShopBadge();

  const data = await api(`/api/items/${id}/toggle`, { method: 'POST' });
  if (data) {
    items[idx] = data;
    // If server disagrees, patch again
    if (data.in_stock !== !prevState) {
      if (el) {
        el.classList.toggle('out', !data.in_stock);
        const btn = el.querySelector('.btn-toggle');
        if (btn) btn.textContent = data.in_stock ? 'Out' : 'âœ“';
      }
    }
  } else {
    // Revert on failure
    items[idx] = { ...items[idx], in_stock: prevState };
    if (el) {
      el.classList.toggle('out', !prevState);
      const btn = el.querySelector('.btn-toggle');
      if (btn) btn.textContent = prevState ? 'Out' : 'âœ“';
    }
    showNotif('âš ï¸ Failed to update â€” reverted');
  }
  updateShopBadge();
}

// Helper: looks up current qty from items array, then calls changeQty with the adjusted value
function adjustQty(id, delta) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  changeQty(id, item.quantity + delta);
}

async function changeQty(id, newQty) {
  if (newQty < 0) return;
  haptic();
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return;
  const prevQty = items[idx].quantity;
  const prevStock = items[idx].in_stock;
  items[idx] = { ...items[idx], quantity: newQty };
  if (newQty === 0) items[idx].in_stock = false;

  // Patch DOM directly â€” no full render
  const el = document.querySelector(`.item[data-id="${id}"]`);
  if (el) {
    const qtySpan = el.querySelector('.qty-ctrl span');
    if (qtySpan) qtySpan.textContent = `${newQty} ${items[idx].unit || 'pcs'}`;
    if (newQty === 0) {
      el.classList.add('out');
      const btn = el.querySelector('.btn-toggle');
      if (btn) btn.textContent = 'âœ“';
    }
  }
  updateShopBadge();

  const updates = { quantity: newQty };
  if (newQty === 0) updates.in_stock = false;
  const data = await api(`/api/items/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
  if (data) {
    items[idx] = data;
    // Patch if server returned different quantity
    if (data.quantity !== newQty && el) {
      const qtySpan = el.querySelector('.qty-ctrl span');
      if (qtySpan) qtySpan.textContent = `${data.quantity} ${data.unit || 'pcs'}`;
    }
  } else {
    // Revert on failure
    items[idx] = { ...items[idx], quantity: prevQty, in_stock: prevStock };
    if (el) {
      const qtySpan = el.querySelector('.qty-ctrl span');
      if (qtySpan) qtySpan.textContent = `${prevQty} ${items[idx].unit || 'pcs'}`;
      if (newQty === 0) {
        el.classList.toggle('out', !prevStock);
        const btn = el.querySelector('.btn-toggle');
        if (btn) btn.textContent = prevStock ? 'Out' : 'âœ“';
      }
    }
  }
  updateShopBadge();
}

let pendingDeleteId = null;
function del(id) {
  haptic('medium');
  const item = items.find(i => i.id === id);
  pendingDeleteId = id;
  document.getElementById('confirm-del-name').textContent = item.name;
  document.getElementById('confirmDeleteModal').classList.add('show');
}
async function confirmDel() {
  closeModal('confirmDeleteModal');
  const id = pendingDeleteId;
  if (!id) return;
  haptic('heavy');
  const el = document.querySelector(`.item[data-id="${id}"]`);
  const item = items.find(i => i.id === id);
  if (el) el.classList.add('removing');
  deletedHistory.push(item);
  if (deletedHistory.length > 10) deletedHistory.shift();
  await new Promise(r => setTimeout(r, 250));
  await api(`/api/items/${id}`, { method: 'DELETE' });
  items = items.filter(i => i.id !== id);
  render();
  showToast(`"${item.name}" deleted`);
  pendingDeleteId = null;
}

async function undoLastDelete() {
  if (!deletedHistory.length) return;
  haptic();
  const item = deletedHistory.pop();
  const { id, ...rest } = item;
  const data = await api('/api/items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(rest) });
  if (data) { items.push(data); render(); }
  hideToast();
}

async function moveToTop(id) {
  haptic();
  const item = items.find(i => i.id === id);
  if (!item) return;
  const minOrder = Math.min(...items.filter(i => i.category === item.category).map(i => i.sort_order)) - 1;
  const data = await api(`/api/items/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sort_order: minOrder }) });
  if (data) { const idx = items.findIndex(i => i.id === id); if (idx >= 0) items[idx] = data; render(); showNotif(`â†‘ "${item.name}" moved to top`); }
}

// Edit item
let editingId = null;
function openEdit(id) {
  haptic();
  const item = items.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('edit-name').value = item.name;
  document.getElementById('edit-note').value = item.note || '';
  document.getElementById('edit-qty').value = item.quantity;
  document.getElementById('edit-unit').value = item.unit || 'pcs';
  document.getElementById('edit-cat').value = item.category || 'Other';
  document.getElementById('editModal').classList.add('show');
  setTimeout(() => document.getElementById('edit-name').focus(), 100);
}
async function saveEdit() {
  if (!editingId) return;
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { document.getElementById('edit-name').style.animation = 'shake .4s'; setTimeout(() => document.getElementById('edit-name').style.animation = '', 400); return; }
  haptic('success');
  const updates = {
    name,
    note: document.getElementById('edit-note').value.trim() || null,
    quantity: parseFloat(document.getElementById('edit-qty').value) || 1,
    unit: document.getElementById('edit-unit').value,
    category: document.getElementById('edit-cat').value
  };
  const data = await api(`/api/items/${editingId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
  if (data) {
    const idx = items.findIndex(i => i.id === editingId);
    if (idx >= 0) items[idx] = data;
    render();
    showNotif(`âœ… "${name}" updated`);
  }
  editingId = null;
  closeModal('editModal');
}

// Bulk
function openBulk() { haptic(); document.getElementById('bulkModal').classList.add('show'); }
async function bulkAdd() {
  const text = document.getElementById('bulk-text').value.trim();
  if (!text) return;
  haptic('success');
  const cat = document.getElementById('bulk-cat').value;
  const data = await api('/api/items/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({items: text, category: cat}) });
  if (data) { items.push(...data); render(); showNotif(`âœ… Added ${data.length} items`); }
  document.getElementById('bulk-text').value = '';
  closeModal('bulkModal');
}

// Voice
function voiceInput() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { showNotif('âš ï¸ Voice not supported'); return; }
  const btn = document.querySelector('.hamburger');
  if (recognition) { recognition.stop(); return; }
  haptic('medium');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  btn.classList.add('voice-active');
  showNotif('ðŸŽ¤ Listening...');
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const match = text.match(/(?:add\s+)?(\d+)?\s*(.+?)(?:\s+to\s+(.+))?$/i);
    if (match) {
      const name = match[2].trim();
      const qty = match[1] || '1';
      const cat = match[3] ? match[3].trim() : null;
      voicePending = { name, qty, cat };
      document.getElementById('voice-heard').textContent = `"${text}"`;
      document.getElementById('voice-parsed').innerHTML = `<b>${name}</b> Ã—${qty}${cat ? ` â†’ ${cat}` : ''}`;
      document.getElementById('voiceConfirmModal').classList.add('show');
    }
    haptic('success');
  };
  recognition.onend = () => { btn.classList.remove('voice-active'); recognition = null; };
  recognition.onerror = () => { btn.classList.remove('voice-active'); recognition = null; showNotif('âš ï¸ Voice failed'); };
  recognition.start();
}

async function confirmVoiceAdd() {
  if (!voicePending) return;
  closeModal('voiceConfirmModal');
  document.getElementById('inp-name').value = voicePending.name;
  document.getElementById('inp-qty').value = voicePending.qty;
  if (voicePending.cat) {
    const sel = document.getElementById('inp-cat');
    for (let opt of sel.options) { if (opt.value.toLowerCase() === voicePending.cat.toLowerCase()) { sel.value = opt.value; break; } }
  }
  autoDetectUnit();
  await addItem();
  voicePending = null;
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

// Autocomplete from master items
let acTimer = null;
function onNameInput() {
  autoDetectUnit();
  clearTimeout(acTimer);
  const q = document.getElementById('inp-name').value.trim();
  if (q.length < 2) { hideAc(); return; }
  acTimer = setTimeout(() => fetchMasterItems(q), 250);
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
  if (!outItems.length) { html = '<p style="color:var(--muted);text-align:center;margin-top:30px">All items in stock! ðŸŽ‰</p>'; }
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
          <div style="font-size:.75rem;color:var(--muted)">${it.note ? esc(it.note) + ' Â· ' : ''}${it.quantity} ${esc(it.unit || 'pcs')}</div>
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
    showNotif(`âš ï¸ ${zeroItems.length} item(s) have 0 quantity â€” fix before restocking`);
    if (!ids.length) return;
  }
  haptic('success');
  await api('/api/items/bulk-restock', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ids}) });
  items.forEach(it => { if (ids.includes(it.id)) it.in_stock = true; });
  renderShop();
  updateShopBadge();
  showNotif(`âœ… ${ids.length} item(s) restocked!`);
}

// Share â€” sends actual shopping list text via WhatsApp or native share
function shareList() {
  haptic();
  const outItems = items.filter(i => !i.in_stock);
  let text = 'ðŸ›’ *Shopping List*\n';
  if (outItems.length) {
    const grouped = {};
    outItems.forEach(it => { const c = it.category||'Other'; if(!grouped[c]) grouped[c]=[]; grouped[c].push(it); });
    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      text += `\n*${catEmoji[cat]||''} ${cat}*\n`;
      grouped[cat].forEach(it => { text += `â˜ ${it.name} Ã—${it.quantity}\n`; });
    }
  } else {
    text += '\nâœ… All items in stock!';
  }
  if (navigator.share) {
    navigator.share({ title: 'Shopping List', text });
  } else {
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank');
  }
}

// Notifications
function showNotif(msg) { const el = document.getElementById('notif'); el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
function showToast(msg) { document.getElementById('toast-msg').textContent = msg; document.getElementById('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 5000); }
function hideToast() { document.getElementById('toast').classList.remove('show'); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// Smart polling (30s, pauses when tab hidden, refreshes on visibility)
let lastDataHash = '';
let pollTimer = null;

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (realtimeChannel) return;
    if (document.hidden) return;
    const data = await api('/api/items');
    if (!data || !Array.isArray(data)) return;
    const hash = JSON.stringify(data);
    if (hash !== lastDataHash) {
      lastDataHash = hash;
      items = data;
      localStorage.setItem('grocery_items', JSON.stringify(items));
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
        if (hash !== lastDataHash) {
          lastDataHash = hash;
          items = data;
          localStorage.setItem('grocery_items', JSON.stringify(items));
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
  html += `<h1>ðŸ›’ Shopping List</h1><p class="date">${new Date().toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>`;

  if (outItems.length) {
    html += '<h2>âŒ Need to Buy</h2><table>';
    const grouped = {};
    outItems.forEach(it => { const c = it.category||'Other'; if(!grouped[c]) grouped[c]=[]; grouped[c].push(it); });
    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      grouped[cat].sort((a,b) => a.name.localeCompare(b.name)).forEach(it => {
        html += `<tr><td>â˜</td><td>${it.name} <span class="qty">Ã—${it.quantity}</span> <span class="cat">${it.category}</span></td></tr>`;
      });
    }
    html += '</table>';
  }

  if (inItems.length) {
    html += '<h2>âœ… In Stock</h2><table>';
    const grouped = {};
    inItems.forEach(it => { const c = it.category||'Other'; if(!grouped[c]) grouped[c]=[]; grouped[c].push(it); });
    for (const cat of catOrder) {
      if (!grouped[cat]) continue;
      grouped[cat].sort((a,b) => a.name.localeCompare(b.name)).forEach(it => {
        html += `<tr><td>â˜‘</td><td>${it.name} <span class="qty">Ã—${it.quantity}</span> <span class="cat">${it.category}</span></td></tr>`;
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

// â”€â”€ UNIFIED SEARCH + ADD FROM CATALOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let masterSearchTimer = null;
let lastMasterResults = [];

function onSearchInput(value) {
  render(); // filter existing items as usual
  const q = value.trim();
  const sugBox = document.getElementById('search-suggestions');

  // Show/hide clear button
  document.getElementById('search-clear').classList.toggle('show', q.length > 0);

  if (!q || q.length < 2) {
    sugBox.style.display = 'none';
    lastMasterResults = [];
    return;
  }

  clearTimeout(masterSearchTimer);
  masterSearchTimer = setTimeout(async () => {
    const data = await api(`/api/master-items?q=${encodeURIComponent(q)}`);
    if (!data || !Array.isArray(data)) {
      // API failed, but still show "Add as custom item" option
      lastMasterResults = [];
      renderSuggestions(q);
      return;
    }

    // Filter out items already in the family list
    const existingNames = new Set(items.map(i => i.name.toLowerCase()));
    lastMasterResults = data.filter(it => !existingNames.has(it.name.toLowerCase()));

    renderSuggestions(q);
  }, 300);
}

function renderSuggestions(query) {
  const sugBox = document.getElementById('search-suggestions');
  let html = '';

  if (lastMasterResults.length > 0) {
    html += `<div class="sug-section">âž• Add from catalog</div>`;
    for (let i = 0; i < lastMasterResults.length; i++) {
      const it = lastMasterResults[i];
      html += `<div class="sug-item">
        <div class="si-info">
          <div class="si-name">${esc(it.name)}</div>
          <div class="si-cat">${esc(it.category)} Â· ${it.default_quantity} ${esc(it.unit)}</div>
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
  const it = lastMasterResults[idx];
  if (!it) return;
  haptic('success');

  // Optimistic: add to list and remove from suggestions immediately
  const tempId = -Date.now();
  items.push({ id: tempId, name: it.name, category: it.category, quantity: it.default_quantity || 1, unit: it.unit || 'pcs', in_stock: true, sort_order: 9999, added_by: 'You', _optimistic: true });
  lastMasterResults = lastMasterResults.filter(x => x.name !== it.name);
  const q = document.getElementById('main-search').value.trim();
  renderSuggestions(q);
  render();
  showNotif(`âœ… Added "${it.name}"`);

  const data = await api('/api/items', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name: it.name, category: it.category, quantity: it.default_quantity || 1, unit: it.unit || 'pcs' })
  });
  items = items.filter(i => i.id !== tempId);
  if (data) {
    if (data.merged) {
      const i = items.findIndex(x => x.id === data.id);
      if (i >= 0) items[i] = data;
      showNotif(`âœ… "${data.name}" qty updated to ${data.quantity}`);
    } else {
      items.push(data);
    }
    localStorage.setItem('grocery_items', JSON.stringify(items));
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
      if (i >= 0) items[i] = data;
      showNotif(`âœ… "${data.name}" qty updated to ${data.quantity}`);
    } else {
      items.push(data);
      showNotif(`âœ… Added "${name}"`);
    }
    localStorage.setItem('grocery_items', JSON.stringify(items));
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
  lastMasterResults = [];
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
    indicator.textContent = diff > 80 ? 'â†“ Release to refresh' : 'â†“ Pull to refresh';
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
  indicator.textContent = 'â†“ Pull to refresh';
  if (diff > 80) { haptic('medium'); load(); showNotif('ðŸ”„ Refreshed'); }
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
  if (obStep === 3) document.getElementById('ob-next').textContent = 'Get Started âœ“';
}
function dismissOnboarding() {
  document.getElementById('onboarding').classList.remove('show');
  localStorage.setItem('onboarding_done', '1');
}

// Refresh token via Supabase then load
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

// ── Expose functions to inline onclick handlers ──
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
