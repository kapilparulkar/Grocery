// ── Family management ──
import { state } from './state.js';
import { api } from './api.js';
import { esc, showNotif } from './utils.js';

export async function loadFamilies() {
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

export function updateFamilyHeader() {
  const active = state.allFamilies.find(f => f.family_id === state.activeFamilyId) || state.allFamilies[0];
  if (active) {
    document.getElementById('active-family-name').textContent = active.families.name;
  }
  document.getElementById('family-caret').style.display = state.allFamilies.length > 1 ? '' : 'none';
}

export function toggleFamilySwitcher() {
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

export async function switchFamily(familyId) {
  state.activeFamilyId = familyId;
  localStorage.setItem('active_family_id', familyId);
  document.getElementById('familySwitcherDropdown').classList.remove('show');
  updateFamilyHeader();
  state.items = [];
  state.lastDataHash = '';
  // load() will be called via window._load
  if (window._load) await window._load();
  showNotif('Switched to ' + (state.allFamilies.find(f => f.family_id === familyId)?.families.name || 'family'));
}
