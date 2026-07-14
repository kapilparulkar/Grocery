// ── Bulk add ──
import { state } from './state.js';
import { api } from './api.js';
import { haptic, showNotif } from './utils.js';
import { render } from './render.js';
import { closeModal } from './actions.js';

export function openBulk() {
  haptic();
  document.getElementById('bulkModal').classList.add('show');
}

export async function bulkAdd() {
  const text = document.getElementById('bulk-text').value.trim();
  if (!text) return;
  haptic('success');
  const cat = document.getElementById('bulk-cat').value;
  const data = await api('/api/items/bulk', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({items: text, category: cat}) });
  if (data) { state.items.push(...data); render(); showNotif(`✅ Added ${data.length} items`); }
  document.getElementById('bulk-text').value = '';
  closeModal('bulkModal');
}
