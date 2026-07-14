// ── Item CRUD actions ──
import { state } from './state.js';
import { api } from './api.js';
import { haptic, showNotif, showToast, hideToast } from './utils.js';
import { render, updateShopBadge } from './render.js';

export function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

export function selectCat(cat) {
  haptic();
  state.activeCat = cat;
  render();
}

export async function addItem() {
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
  state.items.push(optimisticItem);
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
  state.items = state.items.filter(i => i.id !== tempId);
  if (data) {
    if (data.merged) {
      const idx = state.items.findIndex(i => i.id === data.id);
      if (idx >= 0) state.items[idx] = data; else state.items.push(data);
      showNotif(`✅ "${data.name}" already exists — quantity updated to ${data.quantity}`);
    } else {
      state.items.push(data);
    }
    localStorage.setItem('grocery_items', JSON.stringify(state.items));
  } else {
    showNotif(`⚠️ Failed to add "${name}" — will retry when online`);
  }
  render();
}

export async function toggle(id) {
  haptic('medium');
  const idx = state.items.findIndex(i => i.id === id);
  if (idx < 0) return;
  const prevState = state.items[idx].in_stock;
  state.items[idx] = { ...state.items[idx], in_stock: !prevState };

  // Patch DOM directly — no full render
  const el = document.querySelector(`.item[data-id="${id}"]`);
  if (el) {
    el.classList.toggle('out', !state.items[idx].in_stock);
    const btn = el.querySelector('.btn-toggle');
    if (btn) btn.textContent = state.items[idx].in_stock ? 'Out' : '✓';
  }
  updateShopBadge();

  const data = await api(`/api/items/${id}/toggle`, { method: 'POST' });
  if (data) {
    state.items[idx] = data;
    if (data.in_stock !== !prevState) {
      if (el) {
        el.classList.toggle('out', !data.in_stock);
        const btn = el.querySelector('.btn-toggle');
        if (btn) btn.textContent = data.in_stock ? 'Out' : '✓';
      }
    }
  } else {
    state.items[idx] = { ...state.items[idx], in_stock: prevState };
    if (el) {
      el.classList.toggle('out', !prevState);
      const btn = el.querySelector('.btn-toggle');
      if (btn) btn.textContent = prevState ? 'Out' : '✓';
    }
    showNotif('⚠️ Failed to update — reverted');
  }
  updateShopBadge();
}

export function adjustQty(id, delta) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  changeQty(id, item.quantity + delta);
}

export async function changeQty(id, newQty) {
  if (newQty < 0) return;
  haptic();
  const idx = state.items.findIndex(i => i.id === id);
  if (idx < 0) return;
  const prevQty = state.items[idx].quantity;
  const prevStock = state.items[idx].in_stock;
  state.items[idx] = { ...state.items[idx], quantity: newQty };
  if (newQty === 0) state.items[idx].in_stock = false;

  // Patch DOM directly
  const el = document.querySelector(`.item[data-id="${id}"]`);
  if (el) {
    const qtySpan = el.querySelector('.qty-ctrl span');
    if (qtySpan) qtySpan.textContent = `${newQty} ${state.items[idx].unit || 'pcs'}`;
    if (newQty === 0) {
      el.classList.add('out');
      const btn = el.querySelector('.btn-toggle');
      if (btn) btn.textContent = '✓';
    }
  }
  updateShopBadge();

  const updates = { quantity: newQty };
  if (newQty === 0) updates.in_stock = false;
  const data = await api(`/api/items/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
  if (data) {
    state.items[idx] = data;
    if (data.quantity !== newQty && el) {
      const qtySpan = el.querySelector('.qty-ctrl span');
      if (qtySpan) qtySpan.textContent = `${data.quantity} ${data.unit || 'pcs'}`;
    }
  } else {
    state.items[idx] = { ...state.items[idx], quantity: prevQty, in_stock: prevStock };
    if (el) {
      const qtySpan = el.querySelector('.qty-ctrl span');
      if (qtySpan) qtySpan.textContent = `${prevQty} ${state.items[idx].unit || 'pcs'}`;
      if (newQty === 0) {
        el.classList.toggle('out', !prevStock);
        const btn = el.querySelector('.btn-toggle');
        if (btn) btn.textContent = prevStock ? 'Out' : '✓';
      }
    }
  }
  updateShopBadge();
}

export function del(id) {
  haptic('medium');
  const item = state.items.find(i => i.id === id);
  state.pendingDeleteId = id;
  document.getElementById('confirm-del-name').textContent = item.name;
  document.getElementById('confirmDeleteModal').classList.add('show');
}

export async function confirmDel() {
  closeModal('confirmDeleteModal');
  const id = state.pendingDeleteId;
  if (!id) return;
  haptic('heavy');
  const el = document.querySelector(`.item[data-id="${id}"]`);
  const item = state.items.find(i => i.id === id);
  if (el) el.classList.add('removing');
  state.deletedHistory.push(item);
  if (state.deletedHistory.length > 10) state.deletedHistory.shift();
  await new Promise(r => setTimeout(r, 250));
  await api(`/api/items/${id}`, { method: 'DELETE' });
  state.items = state.items.filter(i => i.id !== id);
  render();
  showToast(`"${item.name}" deleted`);
  state.pendingDeleteId = null;
}

export async function undoLastDelete() {
  if (!state.deletedHistory.length) return;
  haptic();
  const item = state.deletedHistory.pop();
  const { id, ...rest } = item;
  const data = await api('/api/items', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(rest) });
  if (data) { state.items.push(data); render(); }
  hideToast();
}

export async function moveToTop(id) {
  haptic();
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  const minOrder = Math.min(...state.items.filter(i => i.category === item.category).map(i => i.sort_order)) - 1;
  const data = await api(`/api/items/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sort_order: minOrder }) });
  if (data) { const idx = state.items.findIndex(i => i.id === id); if (idx >= 0) state.items[idx] = data; render(); showNotif(`↑ "${item.name}" moved to top`); }
}

export function openEdit(id) {
  haptic();
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  state.editingId = id;
  document.getElementById('edit-name').value = item.name;
  document.getElementById('edit-note').value = item.note || '';
  document.getElementById('edit-qty').value = item.quantity;
  document.getElementById('edit-unit').value = item.unit || 'pcs';
  document.getElementById('edit-cat').value = item.category || 'Other';
  document.getElementById('editModal').classList.add('show');
  setTimeout(() => document.getElementById('edit-name').focus(), 100);
}

export async function saveEdit() {
  if (!state.editingId) return;
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
  const data = await api(`/api/items/${state.editingId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
  if (data) {
    const idx = state.items.findIndex(i => i.id === state.editingId);
    if (idx >= 0) state.items[idx] = data;
    render();
    showNotif(`✅ "${name}" updated`);
  }
  state.editingId = null;
  closeModal('editModal');
}
