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

## Phase 1: Extract Without Changing Behavior ✅ COMPLETE

**Goal:** Move CSS and JS out of `app.html` into separate files.

- [x] Task 1.1: Extract CSS → `public/css/app.css`
- [x] Task 1.2: Extract JS → `public/js/main.js`
- [x] Task 1.3: Window exports for onclick handlers
- [x] Task 1.4: Update service worker cache
- [x] Fix: Encoding issue (PowerShell double-encoded UTF-8, fixed via Python script + manual emoji corrections)

---

## Phase 2: Split JS into Modules ✅ COMPLETE

**Goal:** Break `main.js` into focused modules with ES imports.

- [x] Task 2.1: `js/config.js` — SUPABASE_URL, SUPABASE_KEY, catOrder, catEmoji
- [x] Task 2.2: `js/state.js` — shared mutable state object
- [x] Task 2.3: `js/utils.js` — esc, haptic, showNotif, showToast, hideToast
- [x] Task 2.4: `js/api.js` — authHeaders, api(), updateOfflineStatus, flushOfflineQueue
- [x] Task 2.5: `js/render.js` — render(), updateShopBadge(), showSkeleton()
- [x] Task 2.6: `js/actions.js` — addItem, toggle, adjustQty, changeQty, del, confirmDel, undoLastDelete, moveToTop, openEdit, saveEdit, closeModal, selectCat
- [x] Fix: Converted all bare variable references to `state.*`
- [x] Fix: Removed invalid `let state.*` declarations created by regex
- [x] Fix: Fixed garbled `/api/master-state.items` URL

**Batch 3 (remaining modules):**
- [x] Task 2.7: `js/theme.js` — toggleTheme, initTheme
- [x] Task 2.8: `js/onboarding.js` — showOnboarding, nextOnboardingStep, dismissOnboarding
- [x] Task 2.9: `js/bulk.js` — openBulk, bulkAdd
- [x] Task 2.10: `js/voice.js` — voiceInput, confirmVoiceAdd, autoDetectUnit
- [x] Task 2.11: `js/family.js` — loadFamilies, updateFamilyHeader, toggleFamilySwitcher, switchFamily
- [x] Task 2.12: `js/shop.js` — switchView, shopSelectAll, renderShop, doneShop
- [x] Task 2.13: `js/share.js` — shareList, exportPDF
- [x] Rewrote `main.js` as clean orchestrator (~290 lines)
- [x] Updated service worker to v8 with all module files

---

## Phase 3: Clean Up HTML (Future — Optional)

**Goal:** Remove inline styles and inline event handlers from the HTML.

- [ ] Task 3.1: Remove inline styles from HTML → CSS classes
- [ ] Task 3.2: Convert onclick to addEventListener (optional)
- [ ] Task 3.3: Event delegation on `#list` for dynamic item buttons

---

## Phase 4: Final Polish (Future — Optional)

- [ ] Task 4.1: Extract search/gestures/realtime/drawer from main.js into own modules
- [ ] Task 4.2: Update PROJECT_KNOWLEDGE.md
- [ ] Task 4.3: Performance check (no circular imports, load time OK)

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

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1 | 4 tasks | ✅ Complete |
| Phase 2 | 13 tasks (Batch 1-3) | ✅ Complete |
| Phase 3 | 3 tasks | Future (optional) |
| Phase 4 | 3 tasks | Future (optional) |

## Result

**Before:** 1 monolithic file (`app.html`) at 1417 lines  
**After:** 14 focused module files + 1 HTML shell (253 lines) + 1 CSS file (230 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `app.html` | 253 | HTML structure only |
| `css/app.css` | 230 | All styles |
| `js/main.js` | ~290 | Entry point, realtime, polling, search, gestures, drawer, init |
| `js/config.js` | 7 | Constants |
| `js/state.js` | 22 | Shared mutable state |
| `js/utils.js` | 34 | Utility functions |
| `js/api.js` | 63 | API wrapper + offline queue |
| `js/render.js` | 78 | List rendering + skeleton |
| `js/actions.js` | 198 | CRUD operations + edit |
| `js/theme.js` | 14 | Dark mode |
| `js/onboarding.js` | 22 | Tutorial flow |
| `js/bulk.js` | 23 | Bulk add |
| `js/voice.js` | 73 | Voice input + unit detection |
| `js/family.js` | 55 | Family management |
| `js/shop.js` | 87 | Shopping mode |
| `js/share.js` | 82 | Share + PDF export |

---

## Rollback Plan

Keep a `legacy/app.html.bak` copy of the original monolithic file. If anything goes wrong during migration, restore it and the app works instantly — no build step to fix.

---

*Created: July 14, 2026*
