// ── Render functions ──
import { catOrder, catEmoji } from './config.js';
import { state } from './state.js';
import { esc } from './utils.js';

export function render() {
  const search = document.getElementById('main-search').value.toLowerCase();
  const filtered = state.items.filter(it => !search || it.name.toLowerCase().includes(search));

  const categories = {};
  filtered.forEach(it => {
    const cat = it.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(it);
  });

  // Category tabs
  let tabsHtml = `<div class="cat-tab${state.activeCat==='All'?' active':''}" onclick="selectCat('All')">All<span class="count">${filtered.length}</span></div>`;
  for (const cat of catOrder) {
    if (categories[cat]) {
      tabsHtml += `<div class="cat-tab${state.activeCat===cat?' active':''}" onclick="selectCat('${cat}')">${catEmoji[cat]||''} ${cat}<span class="count">${categories[cat].length}</span></div>`;
    }
  }
  document.getElementById('cat-tabs').innerHTML = tabsHtml;

  const sortedCats = Object.keys(categories).sort((a,b) => catOrder.indexOf(a) - catOrder.indexOf(b));
  const visibleCats = state.activeCat === 'All' ? sortedCats : sortedCats.filter(c => c === state.activeCat);

  let html = '';
  for (const cat of visibleCats) {
    const catItems = categories[cat].sort((a,b) => b.in_stock - a.in_stock || a.name.localeCompare(b.name));
    html += `<div class="category-group"><div class="category-title">${catEmoji[cat]||'📦'} ${esc(cat)} (${catItems.length})</div>`;
    for (const it of catItems) {
      const cls = it.in_stock ? '' : ' out';
      const toggleLabel = it.in_stock ? 'Out' : '✓';
      const noteHtml = it.note ? `<div class="note">📝 ${esc(it.note)}</div>` : '';
      html += `<div class="item${cls}" data-id="${it.id}">
        <div class="swipe-bg left">◀ Out</div>
        <div class="swipe-bg right">Restock ▶</div>
        <div class="info" onclick="openEdit(${it.id})" style="cursor:pointer"><div class="name">${esc(it.name)}</div>${noteHtml}${it.added_by ? `<div style="font-size:.7rem;color:var(--muted)">Added by ${esc(it.added_by)}</div>` : ''}</div>
        <div class="qty-ctrl">
          <button onclick="adjustQty(${it.id},-1)">−</button>
          <span>${it.quantity} ${esc(it.unit || 'pcs')}</span>
          <button onclick="adjustQty(${it.id},1)">+</button>
        </div>
        <button class="btn-move-top" onclick="moveToTop(${it.id})">↑</button>
        <button class="btn-toggle" onclick="toggle(${it.id})">${toggleLabel}</button>
        <button class="btn-del" onclick="del(${it.id})">✕</button>
      </div>`;
    }
    html += '</div>';
  }
  document.getElementById('list').innerHTML = html || `<div class="empty-state">
    <div class="emoji">🛒</div>
    <div class="title">Your list is empty</div>
    <div class="hint">Search above to add items from the catalog,<br>or use the ☰ menu → Add Item</div>
  </div>`;
  updateShopBadge();
}

export function updateShopBadge() {
  const count = state.items.filter(i => !i.in_stock).length;
  document.getElementById('shop-badge').textContent = count > 0 ? `(${count})` : '';
}

export function showSkeleton() {
  const listEl = document.getElementById('list');
  if (!listEl) return;
  let sk = '<div class="skeleton skeleton-cat"></div>';
  for (let i = 0; i < 6; i++) {
    sk += `<div class="skeleton-item"><div class="skeleton sk-name"></div><div class="skeleton sk-qty"></div></div>`;
  }
  listEl.innerHTML = sk;
}
