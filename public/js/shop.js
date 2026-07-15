// ── Shopping mode ──
import { catOrder, catEmoji } from './config.js';
import { state } from './state.js';
import { api } from './api.js';
import { esc, haptic, showNotif } from './utils.js';
import { render, updateShopBadge } from './render.js';
import { changeQty } from './actions.js';

export function switchView(view) {
  const isHome = view === 'home';
  document.getElementById('view-home').classList.toggle('view-hidden', !isHome);
  document.getElementById('view-shop').classList.toggle('view-hidden', isHome);
  document.getElementById('tab-btn-home').classList.toggle('active', isHome);
  document.getElementById('tab-btn-shop').classList.toggle('active', !isHome);
  document.getElementById('menu-home').classList.toggle('active-view', isHome);
  document.getElementById('menu-shop').classList.toggle('active-view', !isHome);
  if (isHome) render();
  else renderShop();
}

export function shopSelectAll(checked) {
  haptic();
  document.querySelectorAll('.shopping-item input').forEach(cb => {
    cb.checked = checked;
    cb.closest('.shopping-item').classList.toggle('checked', checked);
  });
}

export function renderShop() {
  const outItems = state.items.filter(it => !it.in_stock);
  let html = '';
  if (!outItems.length) { html = '<p style="color:var(--muted);text-align:center;margin-top:30px">All items in stock! 🎉</p>'; }
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

export async function doneShop() {
  const checked = [...document.querySelectorAll('.shopping-item input[type="checkbox"]:checked')];
  if (!checked.length) return;
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
  state.items.forEach(it => { if (ids.includes(it.id)) it.in_stock = true; });
  renderShop();
  updateShopBadge();
  showNotif(`✅ ${ids.length} item(s) restocked!`);
}
