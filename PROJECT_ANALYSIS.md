# Grocery App - Project Analysis

## Overview

Family grocery list PWA deployed on Netlify with Supabase as the backend. Supports multi-family households, real-time collaboration, and offline usage.

## Architecture

- **Frontend**: Vanilla HTML/CSS/JS (no framework) — 3 pages
- **Backend**: Netlify serverless functions
- **Database**: Supabase (PostgreSQL) — tables: `items`, `families`, `family_members`
- **Auth**: Supabase Google OAuth → JWT tokens in `localStorage`
- **Hosting**: Netlify (static files + functions)

## File Structure

| File | Purpose |
|------|---------|
| `netlify/functions/api.js` | Main API — CRUD for items, family management |
| `netlify/functions/verify.js` | Simple token verification endpoint |
| `public/index.html` | Entry point — redirects to auth or app |
| `public/auth.html` | Login + family create/join flows |
| `public/app.html` | Main app (~650 lines, single-file SPA) |
| `public/sw.js` | Service worker for caching |
| `public/manifest.json` | PWA manifest |
| `public/_headers` | CORS headers for Netlify functions |
| `netlify.toml` | Build config + redirects |
| `App.js` | **Unused** — likely a leftover |

## Features

| Feature | Implementation |
|---------|---------------|
| Multi-family support | `X-Family-Id` header, family switcher UI |
| Google OAuth | Supabase OAuth → token persisted in localStorage |
| Offline support | Queue operations locally, flush when back online |
| PWA | Service worker + manifest for installability |
| Voice input | Web Speech API |
| Swipe gestures | Touch events for toggling stock status |
| Pull-to-refresh | Custom touch handler |
| Shopping mode | Separate view for "out of stock" items |
| PDF export | Dynamic HTML window with print |
| Dark mode | CSS variables + `data-theme` attribute |
| Bulk add | Newline-separated text input |
| Invite system | Random 6-char invite codes |

## API Endpoints (`netlify/functions/api.js`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Returns user + all family memberships |
| POST | `/api/auth/family/create` | Create a new family + seed default items |
| POST | `/api/auth/family/join` | Join family via invite code |
| GET | `/api/auth/family/members` | List family members (requires `X-Family-Id`) |
| GET | `/api/items` | Get all items for active family |
| POST | `/api/items` | Add single item |
| POST | `/api/items/bulk` | Bulk add items (newline-separated) |
| PUT | `/api/items/:id` | Update item (name, category, quantity, in_stock) |
| POST | `/api/items/:id/toggle` | Toggle in_stock status |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/items/bulk-restock` | Restock multiple items by IDs |

## Database Schema

```sql
-- Families
families (id, name, invite_code, created_by)

-- Family Members
family_members (id, family_id, user_id, display_name, role, joined_at)

-- Items
items (id, name, category, quantity, in_stock, sort_order, family_id, added_by, created_at)
```

## Notable Issues & Observations

1. **`initRealtime()` is a no-op** — function exists but is empty; app falls back to 5-second polling.
2. **`App.js` is unused** — never referenced by any page.
3. **Admin client fallback** — `getAdmin()` falls back to `SUPABASE_ANON_KEY` if `SUPABASE_SERVICE_KEY` isn't set, breaking RLS-bypassing operations.
4. **No input sanitization on server** — item names/categories are inserted directly into Supabase queries without validation.
5. **No rate limiting** — all endpoints are open without throttling.
6. **Hardcoded Supabase credentials in `auth.html`** — anon key is safe for client-side, but URL is project-specific.
7. **Single function handles all routes** — path-matching inside one handler rather than separate files.

## Tech Stack

- **Runtime**: Node.js (Netlify Functions)
- **Database**: Supabase (PostgreSQL + Auth)
- **Dependencies**: `@supabase/supabase-js` (client), `@netlify/functions`, `netlify-cli`
- **Frontend CDN**: Supabase JS loaded via CDN in `auth.html`

## Local Development

```bash
npm install
npx netlify dev
# Open: http://localhost:8888
```

## Environment Variables (Netlify)

| Key | Description |
|-----|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (for admin operations) |


---

## User Experience Improvements

### High Priority (Pain Points)

1. ~~**No real-time sync** — `initRealtime()` is empty. Family members wait up to 5s polling to see each other's changes. Implement Supabase Realtime subscriptions for instant updates.~~ ✅ **DONE** — Implemented Supabase Realtime `postgres_changes` subscription on the `items` table filtered by `family_id`. Handles INSERT/UPDATE/DELETE events instantly. Falls back to 5s polling if realtime fails.

2. **No "quick add" from the main screen** — Users must open the drawer or modal to add items. A floating action button (FAB) or inline input at the top would be much faster for repeated adds.

3. **No edit item** — Once added, users can't rename an item or change its category without deleting and re-adding. An inline edit (tap item name) or edit modal would help.

4. **Shopping mode loses progress on refresh** — Checked items in shop mode are only in DOM state. If the page refreshes mid-shopping, all checkmarks are lost.

5. ~~**No duplicate detection** — Adding "Milk" when "Milk" already exists creates a duplicate instead of incrementing quantity. Users will inevitably end up with duplicates.~~ ✅ **DONE** — Backend now detects duplicates (case-insensitive) and increments quantity instead of creating a new entry.

### Medium Priority (Quality of Life)

6. ~~**No item reordering** — Users can't drag items to prioritize what to buy first. A drag-to-reorder (or at least "move to top") would help.~~ ✅ **DONE** — Added "↑" move-to-top button on each item that sets sort_order to top of its category.

7. ~~**No "Select All / Deselect All" in shopping mode** — With 50+ items marked out-of-stock, manually checking each one is tedious.~~ ✅ **DONE** — Added Select All / Deselect All buttons in shopping mode.

8. ~~**No history/recently deleted** — Only the last deleted item supports undo. If you accidentally delete two items, the first one is gone forever.~~ ✅ **DONE** — Now keeps last 10 deleted items in a history stack; undo restores the most recent.

9. ~~**Voice input has no visual feedback of what was heard** — It silently adds the item. Users should see a confirmation of the parsed text before it's added.~~ ✅ **DONE** — Voice now shows a confirmation modal with the raw transcript and parsed item before adding.

10. ~~**No item notes/comments** — Users often want to add context like "Get the 1kg pack" or "Brand: Aashirvaad". There's no notes field.~~ ✅ **DONE** — Added optional note field to items (visible in list and shopping mode).

11. ~~**Category filter resets on data refresh** — The 5s polling re-renders the whole list, resetting the user's scroll position and potentially their category filter context.~~ ✅ **DONE** — Polling now preserves activeCat selection and restores scroll position after re-render.

### Low Priority (Nice to Have)

12. **No price tracking** — Users can't track approximate costs or set a budget for their shopping trip.

13. **No recurring items / scheduled reminders** — Items bought weekly (milk, bread) should auto-mark as "needed" on a schedule.

14. **No multi-language support** — The app targets Indian families but is English-only. Hindi UI option would increase adoption.

15. **Shopping mode doesn't group by category** — It lists items flat. Grouping by category (like the main view does) would make in-store navigation faster.

16. **No "last purchased" timestamp** — Users can't see when an item was last bought to judge if they need it again.

17. **PWA icon is just an SVG emoji** — On home screens, a proper icon with background would look more polished.

18. ~~**No onboarding/tutorial** — First-time users see 58 default items with no explanation of swipe gestures, shopping mode, or voice commands.~~ ✅ **DONE** — Added a 4-step onboarding overlay (Welcome, Gestures, Shopping Mode, Pro Tips) shown on first visit, with skip option. Stored in localStorage so it only shows once.
