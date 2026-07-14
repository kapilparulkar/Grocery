// ── Shared mutable state ──
// All modules import this object and mutate its properties directly.

export const state = {
  items: [],
  deletedHistory: [],
  toastTimer: null,
  activeCat: 'All',
  recognition: null,
  isOnline: navigator.onLine,
  offlineQueue: JSON.parse(localStorage.getItem('offlineQueue') || '[]'),
  voicePending: null,
  realtimeChannel: null,
  activeFamilyId: localStorage.getItem('active_family_id') || null,
  allFamilies: [],
  supabaseClient: null,
  lastDataHash: '',
  pollTimer: null,
  editingId: null,
  pendingDeleteId: null,
  masterSearchTimer: null,
  lastMasterResults: [],
  acTimer: null,
};
