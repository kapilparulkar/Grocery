# Refactor: Monolithic app.html → Vanilla ES Modules

## Goal

Split the ~1500-line `app.html` into a clean modular structure using native ES modules (`<script type="module">`). No framework, no bundler, no build step. The app must work identically after each phase.

---

## Target Structure

```
public/
├── app.html              ← Slim HTML shell (~120 lines, structure only)
├── css/
│   └── app.css           ← All styles (~230 lines)
├── js/
│   ├── main.js           ← Entry point: imports, auth check, init
│   ├── config.js         ← Supabase URL/key, category constants
│   ├── state.js          ← Shared state (items, families, activeCat, etc.)
│   ├── api.js            ← fetch wrapper, auth headers, offline queue
│   ├── utils.js          ← esc(), haptic(), showNotif(), showToast(), hideToast()
│   ├── render.js         ← render(), skeleton, empty state, updateShopBadge()
│   ├── actions.js        ← addItem, toggle, changeQty, adjustQty, del, confirmDel, undoLastDelete, moveToTop
│   ├── edit.js           ← openEdit, saveEdit
│   ├── search.js         ← onSearchInput, renderSuggestions, quickAddByIndex, quickAddCustom, clearSearch
│   ├── voice.js          ← voiceInput, confirmVoiceAdd, autoDetectUnit
│   ├── bulk.js           ← openBulk, bulkAdd
│   ├── shop.js           ← renderShop, doneShop, shopSelectAll, switchView
│   ├── drawer.js         ← openDrawer, closeDrawer, drawerAction, toggleDeleteMode
│   ├── family.js         ← loadFamilies, switchFamily, toggleFamilySwitcher, updateFamilyHeader
│   ├── realtime.js       ← initRealtime, startPolling, stopPolling, visibility handler
│   ├── gestures.js       ← swipe handlers, pull-to-refresh
│   ├── share.js          ← shareList, exportPDF
│   ├── theme.js          ← toggleTheme, theme init
│   └── onboarding.js     ← showOnboarding, nextOnboardingStep, dismissOnboarding
├── sw.js
├── manifest.json
└── _headers
```

---

## Phase 1: Extract Without Changing Behavior

**Goal:** Move CSS and JS out of `app.html` into separate files. No logic changes. App works identically.

### Task 1.1: Extract CSS
- [ ] Create `public/css/app.css`
- [ ] Copy everything between `<style>...</style>` tags into `app.css`
- [ ] Replace the `<style>` block in `app.html` with `<link rel="stylesheet" href="/css/app.css">`
- [ ] **Test:** App loads with same styling, dark mode works, all animations work

### Task 1.2: Extract JS into single file
- [ ] Create `public/js/main.js`
- [ ] Copy everything between `<script>...</script>` tags into `main.js`
- [ ] Replace the `<script>` block in `app.html` with `<script type="module" src="/js/main.js"></script>`
- [ ] Add all functions that are called from `onclick` attributes to `window` (e.g., `window.toggle = toggle`)
- [ ] **Test:** All features work — add, toggle, search, shopping mode, drawer, voice, swipe

### Task 1.3: Fix inline event handlers
- [ ] Identify all `onclick="..."` attributes in the HTML
- [ ] For each, the corresponding function must be exposed on `window` from `main.js`
- [ ] Create a list of all functions that need `window.X = X` exports:
  - `openDrawer`, `closeDrawer`, `drawerAction`
  - `toggleFamilySwitcher`, `switchFamily`
  - `switchView`, `selectCat`
  - `toggle`, `adjustQty`, `moveToTop`, `del`, `openEdit`
  - `addItem`, `bulkAdd`, `closeModal`
  - `onSearchInput`, `quickAddByIndex`, `quickAddCustom`, `clearSearch`
  - `confirmVoiceAdd`, `voiceInput`
  - `shopSelectAll`, `doneShop`
  - `confirmDel`, `saveEdit`, `undoLastDelete`
  - `nextOnboardingStep`, `dismissOnboarding`
  - `onNameInput`
- [ ] **Test:** Every button, link, and input event still fires correctly

### Task 1.4: Update service worker cache
- [ ] Add `/css/app.css` and `/js/main.js` to the `ASSETS` array in `sw.js`
- [ ] Bump cache version to `grocery-v5`
- [ ] **Test:** App works offline after first load

---

## Phase 2: Split JS into Modules

**Goal:** Break `main.js` into focused modules. Each module exports its functions. `main.js` becomes a thin orchestrator.

### Task 2.1: Create `js/config.js`
- [ ] Extract: `SUPABASE_URL`, `SUPABASE_KEY`, `catOrder`, `catEmoji`
- [ ] Export them as named exports
- [ ] Import in files that need them

### Task 2.2: Create `js/state.js`
- [ ] Extract all shared state variables:
  - `items`, `deletedHistory`, `toastTimer`, `activeCat`, `recognition`
  - `isOnline`, `offlineQueue`, `voicePending`
  - `realtimeChannel`, `activeFamilyId`, `allFamilies`, `supabaseClient`
  - `lastDataHash`, `pollTimer`, `editingId`, `pendingDeleteId`
  - `masterSearchTimer`, `lastMasterResults`
- [ ] Export as a single `state` object or individual `let` exports with getter/setter functions
- [ ] **Decision:** Use a simple object (`export const state = { items: [], ... }`) for easy mutation across modules

### Task 2.3: Create `js/utils.js`
- [ ] Extract: `esc()`, `haptic()`, `showNotif()`, `showToast()`, `hideToast()`
- [ ] Export as named exports
- [ ] Update imports in modules that use them
- [ ] **Test:** Notifications and toasts still appear correctly

### Task 2.4: Create `js/api.js`
- [ ] Extract: `authHeaders()`, `api()`, `updateOfflineStatus()`, `flushOfflineQueue()`
- [ ] Import `state` for `activeFamilyId`, `offlineQueue`
- [ ] Import `showNotif` from utils
- [ ] Export `api` function
- [ ] **Test:** API calls work, offline queue works, 401 redirects to auth

### Task 2.5: Create `js/render.js`
- [ ] Extract: `render()`, `updateShopBadge()`, skeleton loading logic
- [ ] Import: `state`, `config`, `esc` from utils
- [ ] Export: `render`, `updateShopBadge`
- [ ] **Test:** List renders correctly, category tabs work, empty state shows

### Task 2.6: Create `js/actions.js`
- [ ] Extract: `addItem()`, `toggle()`, `changeQty()`, `adjustQty()`, `del()`, `confirmDel()`, `undoLastDelete()`, `moveToTop()`
- [ ] Import: `state`, `api`, `render`, `updateShopBadge`, `haptic`, `showNotif`, `showToast`
- [ ] Export all functions
- [ ] Expose on `window`: `toggle`, `adjustQty`, `del`, `confirmDel`, `undoLastDelete`, `moveToTop`, `addItem`
- [ ] **Test:** Add, toggle, quantity, delete, undo all work

### Task 2.7: Create `js/edit.js`
- [ ] Extract: `openEdit()`, `saveEdit()`
- [ ] Import: `state`, `api`, `render`, `haptic`, `showNotif`
- [ ] Expose on `window`: `openEdit`, `saveEdit`
- [ ] **Test:** Tap item → edit modal → save works

### Task 2.8: Create `js/search.js`
- [ ] Extract: `onSearchInput()`, `renderSuggestions()`, `quickAddByIndex()`, `quickAddCustom()`, `clearSearch()`, `onNameInput()`, `fetchMasterItems()`, `selectMasterIdx()`, `hideAc()`
- [ ] Import: `state`, `api`, `render`, `esc`, `haptic`, `showNotif`
- [ ] Expose on `window`: `onSearchInput`, `quickAddByIndex`, `quickAddCustom`, `clearSearch`, `onNameInput`, `selectMasterIdx`
- [ ] **Test:** Search suggestions appear, adding from catalog works, autocomplete in add modal works

### Task 2.9: Create `js/voice.js`
- [ ] Extract: `voiceInput()`, `confirmVoiceAdd()`, `autoDetectUnit()`
- [ ] Import: `state`, `haptic`, `showNotif`
- [ ] Import `addItem` from actions (for confirmVoiceAdd)
- [ ] Expose on `window`: `confirmVoiceAdd`
- [ ] **Test:** Voice input → confirmation modal → add works

### Task 2.10: Create `js/bulk.js`
- [ ] Extract: `openBulk()`, `bulkAdd()`
- [ ] Import: `state`, `api`, `render`, `haptic`, `showNotif`
- [ ] Expose on `window`: `bulkAdd`
- [ ] **Test:** Bulk add modal → paste items → add all works

### Task 2.11: Create `js/shop.js`
- [ ] Extract: `renderShop()`, `doneShop()`, `shopSelectAll()`, `switchView()`
- [ ] Import: `state`, `api`, `render`, `updateShopBadge`, `haptic`, `showNotif`, `esc`
- [ ] Expose on `window`: `switchView`, `shopSelectAll`, `doneShop`
- [ ] **Test:** Shop tab shows out-of-stock items, check + done shopping works, badge updates

### Task 2.12: Create `js/drawer.js`
- [ ] Extract: `openDrawer()`, `closeDrawer()`, `drawerAction()`, `toggleDeleteMode()`
- [ ] Import: `state`, `api`, `haptic`, `showNotif`
- [ ] Import other module functions as needed (switchView, voiceInput, openBulk, etc.)
- [ ] Expose on `window`: `openDrawer`, `closeDrawer`, `drawerAction`
- [ ] **Test:** Hamburger menu opens, all drawer actions work

### Task 2.13: Create `js/family.js`
- [ ] Extract: `loadFamilies()`, `switchFamily()`, `toggleFamilySwitcher()`, `updateFamilyHeader()`
- [ ] Import: `state`, `api`, `esc`, `showNotif`
- [ ] Expose on `window`: `toggleFamilySwitcher`, `switchFamily`
- [ ] **Test:** Family switcher dropdown works, switching families reloads items

### Task 2.14: Create `js/realtime.js`
- [ ] Extract: `initRealtime()`, `startPolling()`, `stopPolling()`, visibility change handler
- [ ] Import: `state`, `render`, `api`
- [ ] Export: `initRealtime`, `startPolling`, `stopPolling`
- [ ] **Test:** Realtime updates from another device appear, polling resumes on tab focus

### Task 2.15: Create `js/gestures.js`
- [ ] Extract: swipe touch handlers (touchstart, touchmove, touchend for items)
- [ ] Extract: pull-to-refresh touch handlers
- [ ] Import: `state`, `haptic`, `render`, `showNotif`
- [ ] Export: `setupGestures()` function that attaches all listeners
- [ ] **Test:** Swipe left/right toggles stock, pull down refreshes

### Task 2.16: Create `js/share.js`
- [ ] Extract: `shareList()`, `exportPDF()`
- [ ] Import: `state`, `haptic`, `esc`, `catOrder`, `catEmoji`
- [ ] Expose on `window` if called from drawer (or import in drawer.js)
- [ ] **Test:** Share generates correct text, PDF opens print dialog

### Task 2.17: Create `js/theme.js`
- [ ] Extract: `toggleTheme()`, theme initialization IIFE
- [ ] Import: `haptic`
- [ ] Export: `toggleTheme`, `initTheme`
- [ ] **Test:** Dark mode toggle works, persists across reload

### Task 2.18: Create `js/onboarding.js`
- [ ] Extract: `showOnboarding()`, `nextOnboardingStep()`, `dismissOnboarding()`, `obStep` variable
- [ ] Expose on `window`: `nextOnboardingStep`, `dismissOnboarding`
- [ ] **Test:** First visit shows onboarding, skip works, doesn't show again

### Task 2.19: Slim down `js/main.js`
- [ ] `main.js` should only contain:
  - Imports from all modules
  - Auth check (redirect if no token)
  - Call `load()` → `showOnboarding()`
  - Call `setupGestures()`
  - Call `initTheme()`
  - `window.*` assignments for all onclick-exposed functions
  - Register service worker
  - Cached items render on load
- [ ] **Test:** Full end-to-end test of all features

---

## Phase 3: Clean Up HTML

**Goal:** Remove all inline styles and inline event handlers from the HTML. Move everything to CSS classes and JS event listeners.

### Task 3.1: Remove inline styles from HTML
- [ ] Audit all `style="..."` attributes in `app.html`
- [ ] Create CSS classes for each pattern (e.g., `.drawer-spacer`, `.modal-field-row`)
- [ ] Replace inline styles with class names
- [ ] **Test:** Visual appearance unchanged

### Task 3.2: Convert onclick to addEventListener (optional, lower priority)
- [ ] For each `onclick="functionName()"` in HTML:
  - Add `id` or `data-action` attribute
  - In the relevant JS module, use `document.getElementById(...).addEventListener('click', ...)`
- [ ] Remove all `window.X = X` assignments (no longer needed)
- [ ] **Note:** This is optional — inline onclick works fine with `window` exports. Only do if you want fully separated concerns.
- [ ] **Test:** All interactions still work

### Task 3.3: Remove dynamic HTML event handlers in render()
- [ ] In `render()`, items use `onclick="toggle(${it.id})"` etc.
- [ ] Replace with event delegation: one listener on `#list` that reads `data-id` and `data-action`
- [ ] Example:
  ```javascript
  document.getElementById('list').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.closest('.item').dataset.id);
    const action = btn.dataset.action;
    if (action === 'toggle') toggle(id);
    else if (action === 'del') del(id);
    // etc.
  });
  ```
- [ ] **Benefit:** Fewer DOM listeners, works even after innerHTML rebuild
- [ ] **Test:** All item buttons work (toggle, qty, delete, move, edit)

---

## Phase 4: Final Polish

### Task 4.1: Update service worker
- [ ] Add all new JS files to cache list (or use a glob pattern)
- [ ] Test offline works with modular structure

### Task 4.2: Update PROJECT_KNOWLEDGE.md
- [ ] Update file structure section
- [ ] Update design decisions
- [ ] Mark "monolithic app.html" as resolved in limitations

### Task 4.3: Performance check
- [ ] Verify no regression in load time (HTTP/2 multiplexing handles many small files)
- [ ] Check no circular imports between modules
- [ ] Verify localStorage cache still renders instantly

---

## Phase 2 Batching Strategy

Phase 2 is split into batches to manage complexity and avoid encoding issues. Only Kiro file tools (`fs_write`, `str_replace`) are used — no PowerShell file operations.

**Batch 1 — Foundations** (other modules depend on these):
- `config.js` — constants (catOrder, catEmoji, Supabase URL/key)
- `state.js` — shared mutable state object
- `utils.js` — esc, haptic, showNotif, showToast, hideToast
- `api.js` — authHeaders, api(), offline queue, updateOfflineStatus, flushOfflineQueue

**Batch 2 — Core Features:**
- `render.js` — render(), updateShopBadge(), skeleton loading
- `actions.js` — addItem, toggle, adjustQty, changeQty, del, confirmDel, undoLastDelete, moveToTop

**Batch 3 — Remaining Modules:**
- `edit.js`, `search.js`, `voice.js`, `bulk.js`, `shop.js`, `drawer.js`, `family.js`, `realtime.js`, `gestures.js`, `share.js`, `theme.js`, `onboarding.js`

**Batch 4 — Finalize:**
- Slim `main.js` to imports + init + window exports
- Update service worker cache

Each batch = test the app end-to-end before proceeding to the next.

---

## Migration Rules

1. **One task = one working commit.** The app must function after each task.
2. **No logic changes during extraction.** Copy code exactly, just move it.
3. **Test after every task.** Minimum: load app, add item, toggle, search, shop mode.
4. **Phase 2 tasks can be done in any order** (except 2.1-2.4 should come first since other modules depend on them).
5. **Keep inline onclick during Phase 2.** Convert to addEventListener only in Phase 3 (optional).

---

## Estimated Effort

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1 | 4 tasks | ~1 hour |
| Phase 2 | 19 tasks | ~3-4 hours |
| Phase 3 | 3 tasks | ~1-2 hours (optional) |
| Phase 4 | 3 tasks | ~30 min |
| **Total** | **29 tasks** | **~6-7 hours** |

---

## Rollback Plan

Keep a `legacy/app.html.bak` copy of the original monolithic file. If anything goes wrong during migration, restore it and the app works instantly — no build step to fix.

---

*Created: July 14, 2026*
