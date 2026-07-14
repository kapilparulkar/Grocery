// ── Voice input + unit detection ──
import { state } from './state.js';
import { haptic, showNotif } from './utils.js';
import { closeModal } from './actions.js';
import { addItem } from './actions.js';

export function voiceInput() {
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

export async function confirmVoiceAdd() {
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

export function autoDetectUnit() {
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
