// ── Share and PDF export ──
import { catOrder, catEmoji } from './config.js';
import { state } from './state.js';
import { haptic } from './utils.js';

export function shareList() {
  haptic();
  const outItems = state.items.filter(i => !i.in_stock);
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
    text += '\n✅ All items in stock!';
  }
  if (navigator.share) {
    navigator.share({ title: 'Shopping List', text });
  } else {
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank');
  }
}

export function exportPDF() {
  haptic();
  const outItems = state.items.filter(i => !i.in_stock);
  const inItems = state.items.filter(i => i.in_stock);

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
