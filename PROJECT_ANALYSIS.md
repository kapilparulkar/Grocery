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

### Tables

#### `families`
| Column | Type | Details |
|--------|------|------|
| `id` | UUID | Primary key (auto via `gen_random_uuid()`) |
| `name` | TEXT | e.g. "Sharma Family" |
| `invite_code` | TEXT | 6-char uppercase code (e.g. "A3BX9K"), UNIQUE |
| `created_by` | UUID | References Supabase auth user ID |
| `created_at` | TIMESTAMPTZ | Auto-set |

#### `family_members`
| Column | Type | Details |
|--------|------|------|
| `id` | SERIAL | Primary key |
| `family_id` | UUID/FK | References `families.id` ON DELETE CASCADE |
| `user_id` | UUID | References Supabase auth user ID |
| `display_name` | TEXT | e.g. "Dad", "Priya" |
| `role` | TEXT | `'admin'` or `'member'` |
| `joined_at` | TIMESTAMPTZ | Auto-set |

#### `items`
| Column | Type | Details |
|--------|------|------|
| `id` | SERIAL | Primary key |
| `name` | TEXT | Item name |
| `category` | TEXT | Default `'Other'` |
| `quantity` | NUMERIC | Default `1` |
| `unit` | TEXT | Default `'pcs'` (pcs, kg, g, L, ml, packet, dozen, bundle) |
| `in_stock` | BOOLEAN | Default `true` |
| `sort_order` | INTEGER | For ordering |
| `family_id` | UUID/FK | References `families.id` ON DELETE CASCADE |
| `added_by` | TEXT | Display name of who added it |
| `note` | TEXT | Optional note |
| `created_at` | TIMESTAMPTZ | Auto-set |

### Relationships

```
families (1) ──── (*) family_members (*) ──── (1) auth.users
families (1) ──── (*) items
```

### Full SQL Setup

```sql
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE family_members (
  id SERIAL PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  in_stock BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  added_by TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER TABLE items REPLICA IDENTITY FULL;

-- RLS (allow all via anon key — secured by API layer)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON family_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON items FOR ALL USING (true) WITH CHECK (true);
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

3. ~~**No edit item** — Once added, users can't rename an item or change its category without deleting and re-adding. An inline edit (tap item name) or edit modal would help.~~ ✅ **DONE** — Tapping an item's name/info opens an edit modal where users can change name, note, quantity, and category.

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


---

## Future Suggestions

### Quick Wins

19. **Floating "+" button on main screen** — A FAB (floating action button) at the bottom-right to quickly open the add modal without navigating the drawer. One-tap access.

20. **Shopping mode persist checked state** — Save checked item IDs to `localStorage` so refreshing mid-shop doesn't lose progress.

21. **Confirmation before logout** — Accidental logout loses nothing server-side, but re-auth on mobile is annoying. A quick confirm dialog helps.

22. **Item count summary in header** — Show "3 out of stock" or "All stocked ✓" below the family name for at-a-glance status.

### Medium Effort

23. **Sort options** — Let users sort by: name (A-Z), recently added, quantity, or stock status. Currently only sort_order + alphabetical within category.

24. **Search in shopping mode** — With 50+ out-of-stock items, searching while shopping would help.

25. **Swipe-to-delete** — Currently requires enabling "Delete Mode" via drawer. A left-swipe-past-threshold could trigger delete directly (with undo toast).

26. **Last purchased timestamp** — Track when items were last restocked (`restocked_at` column). Show "Last bought 3 days ago" to help decide if something is needed.

27. **Export/import list as JSON** — For backup or migrating between families.

### Bigger Features

28. **Push notifications** — Notify family members when someone marks items as "out of stock" or adds new items. Uses existing Notification permission request.

29. **Recurring items** — Add a `recurring_days` field. A scheduled function (Netlify Scheduled Functions) auto-marks items as out-of-stock on their cycle.

30. **Price tracking** — Add `price` field to items. Show estimated shopping total in Shopping Mode. Track spending over time.

31. **Activity log** — Show who added/toggled/deleted what and when. Useful for families to see "Dad marked Milk as out of stock 2h ago".


---

## Completed Additional Features

### Unit-based Quantities ✅

Items now support measurement units (pcs, kg, g, L, ml, packet, dozen, bundle).

**Smart auto-detection** based on item name:
- "Milk", "Oil" → L
- "Rice", "Flour", "Dal", "Sugar" → kg
- "Powder", "Masala", "Haldi" → g
- "Coriander leaves", "Spinach" → bundle
- "Eggs", "Banana" → dozen
- "Maggi", "Biscuit", "Bread" → packet
- Everything else → pcs

**DB migration required:**
```sql
ALTER TABLE items ADD COLUMN unit TEXT DEFAULT 'pcs';
```

### Master Items Catalog (Autocomplete) ✅

A `master_items` table serves as a pre-built dictionary of ~120 common Indian grocery items.

**How it works:**
- User types 2+ characters in "Add Item" input → debounced API call searches master catalog
- Dropdown shows matching items with category, unit, and default quantity
- Selecting an item auto-fills name, category, unit, and quantity
- If no match, user can still type freely (manual entry still works)

**Components:**
- `sql/master_items.sql` — Table creation + 120 seed items with aliases
- `GET /api/master-items?q=...` — Searches by name (ilike) and aliases (array contains)
- Frontend autocomplete dropdown with index-based selection (avoids quote escaping issues)

**DB setup required:**
```sql
-- Run sql/master_items.sql in Supabase SQL Editor
```


---

## Security & Code Quality Review

### 🔴 Critical

| # | Issue | File | Description |
|---|-------|------|-------------|
| 1 | **SQL Injection via ilike** | `netlify/functions/api.js` (L90) | The master-items search query interpolates user input directly into a Supabase filter: `.or(\`name.ilike.%${q}%,aliases.cs.{${q.toLowerCase()}}\`\`)`. A crafted `q` value can break out of the filter syntax and manipulate the query. |
| 2 | **SQL Injection via ilike (duplicate check)** | `netlify/functions/api.js` (L135) | `.ilike('name', body.name.trim())` — If `body.name` contains `%` or `_` wildcards, it matches unintended rows, allowing a user to merge into another item. |
| 3 | **No family membership check on item operations** | `netlify/functions/api.js` | If `requestedFamilyId` header is tampered with a UUID the user isn't a member of, the fallback logic (`|| allMemberships[0]`) silently uses the first family. The fallback behavior could mask bugs. |
| 4 | **Service key fallback to anon key** | `netlify/functions/api.js` (L16) | `process.env.SUPABASE_SERVICE_KEY \|\| process.env.SUPABASE_ANON_KEY` — If the service key env var is missing, all admin operations silently run with the anon key. Should fail fast instead. |

### 🟠 High

| # | Issue | File | Description |
|---|-------|------|-------------|
| 5 | **Exposed Supabase anon key in client code** | `public/app.html`, `public/auth.html` | Anon key is hardcoded. While designed to be public (protected by RLS), in this project RLS is largely bypassed by the admin client in functions. If RLS policies are misconfigured, the anon key gives direct DB access. |
| 6 | **Weak invite code (6 chars, no rate limit)** | `netlify/functions/api.js` (L100) | `Math.random().toString(36).substring(2, 8)` — Only ~2.1B combinations. No brute-force protection on the join endpoint. An attacker can enumerate invite codes. |
| 7 | **No CSRF protection** | All API routes | The CORS policy is `Access-Control-Allow-Origin: *` which is overly permissive. |
| 8 | **Wildcard CORS** | `public/_headers`, `netlify/functions/api.js` | `Access-Control-Allow-Origin: *` allows any website to make authenticated requests if the user's token is known. Should restrict to the actual domain. |
| 9 | **No input length validation** | `netlify/functions/api.js` | `body.name`, `body.note`, bulk text — no max length. A user could insert megabytes of text into the database. |
| 10 | **Bulk add has no item count limit** | `netlify/functions/api.js` (L147) | The `/items/bulk` endpoint splits by newlines with no cap. A single request could insert thousands of rows. |

### 🟡 Medium

| # | Issue | File | Description |
|---|-------|------|-------------|
| 11 | **XSS via `esc()` function is incomplete** | `public/app.html` | Several template literals inject into HTML attributes (e.g., `onclick="openEdit(${it.id})"`) which could be exploited if `id` is manipulated (unlikely with integer IDs but defense-in-depth is missing). |
| 12 | **No token refresh mechanism** | `public/app.html` | The app stores `sb_token` in localStorage but never refreshes it. Supabase access tokens expire (default 1 hour). After expiry, all API calls fail until re-auth. |
| 13 | **localStorage token storage** | `public/app.html`, `public/auth.html` | Tokens in localStorage are vulnerable to XSS. HttpOnly cookies would be safer. |
| 14 | **Math.random() for security-sensitive code** | `netlify/functions/api.js` (L100) | `Math.random()` is not cryptographically secure. Use `crypto.randomBytes()` for invite code generation. |
| 15 | **No request body size limit** | `netlify/functions/api.js` | `JSON.parse(event.body)` with no size check. The app should enforce limits smaller than Netlify's default ~6MB. |
| 16 | **Notification permission requested on load** | `public/app.html` | `Notification.requestPermission()` is called immediately but notifications are never used. Degrades user trust. |

### 🟢 Low / Informational

| # | Issue | File | Description |
|---|-------|------|-------------|
| 17 | **Dead code: App.js** | `App.js` | React/Firebase implementation that's not used. Should be removed. |
| 18 | **Service Worker caches CDN script** | `public/sw.js` | Caching `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` may serve stale library versions. |
| 19 | **No Content-Security-Policy header** | `public/_headers` | Missing CSP allows inline scripts, external script injection. |
| 20 | **No error boundary in frontend** | `public/app.html` | Unhandled promise rejections silently fail. API errors don't always surface to the user. |

---

### Code Quality Issues

#### Architecture & Structure

| # | Issue | File | Impact |
|---|-------|------|--------|
| 21 | **Monolithic single-file frontend** | `public/app.html` | ~800 lines of mixed HTML/CSS/JS. Hard to maintain, test, or review. |
| 22 | **Monolithic API handler** | `netlify/functions/api.js` | Single function handles 12+ routes via string matching. No middleware, no route separation. |
| 23 | **Duplicated Supabase credentials** | `public/app.html`, `public/auth.html` | Same URL and key hardcoded in two files. Should be injected at build time. |
| 24 | **No TypeScript or type checking** | All files | No type safety, IDE support is limited, refactoring is risky. |
| 25 | **No tests** | Project-wide | Zero test coverage. Critical business logic (duplicate detection, family membership) is untested. |

#### Code Smells

| # | Issue | File | Description |
|---|-------|------|-------------|
| 26 | **Inconsistent error handling** | `netlify/functions/api.js` | The toggle endpoint doesn't handle the case where the item isn't found (`item` is null). |
| 27 | **Race conditions in quantity update** | `netlify/functions/api.js` (L135-140) | Read-then-update pattern. Two concurrent requests cause a lost update. Should use SQL increment. |
| 28 | **Global state pollution** | `public/app.html` | All variables are global. Name collisions with third-party scripts are possible. |
| 29 | **No debouncing on render()** | `public/app.html` | Search input triggers full DOM rebuild on every keystroke. |
| 30 | **Polling fallback runs unconditionally** | `public/app.html` | If realtime fails to connect, it never retries — just polls forever. |
| 31 | **Magic strings throughout** | All files | Category names, API paths, status values — all hardcoded. Typos won't be caught. |
| 32 | **No pagination** | `netlify/functions/api.js` | `GET /items` returns all items with no limit. |
| 33 | **`verify.js` is redundant** | `netlify/functions/verify.js` | Token verification is already done in `api.js`. This function appears unused by the frontend. |

---

### Recommendations (Priority Order)

#### Immediate (Security)

1. **Sanitize search input** — Escape `%`, `_`, and special chars in the master-items query parameter before interpolation.
2. **Replace `Math.random()`** — Use `require('crypto').randomBytes(4).toString('hex').toUpperCase().slice(0,6)` for invite codes.
3. **Restrict CORS** — Replace `*` with your actual Netlify domain.
4. **Add input validation** — Max lengths for name (100), note (500), bulk text (5000 chars / 50 items).
5. **Fail fast on missing service key** — Throw an error if `SUPABASE_SERVICE_KEY` is not set.
6. **Add rate limiting** — Use Netlify's built-in rate limiting or add a simple per-user request counter.

#### Short-term (Quality)

7. **Add token refresh** — Use Supabase's `onAuthStateChange` to auto-refresh tokens before expiry.
8. **Fix race condition** — Use Supabase's `.rpc()` for atomic increment on quantity merge.
9. **Add null checks** — Toggle endpoint should return 404 if item not found.
10. **Remove dead code** — Delete `App.js` or move to a `legacy/` folder.
11. **Add CSP header** — `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co wss://*.supabase.co`

#### Long-term (Maintainability)

12. **Split frontend** — Extract JS into `app.js`, CSS into `app.css`.
13. **Split API routes** — Use separate function files or a router library.
14. **Add tests** — At minimum, test the API routes with mock Supabase responses.
15. **Add TypeScript** — Even just JSDoc types would improve developer experience.
16. **Add pagination** — Limit to 100 items per page with cursor-based pagination.

---

### Review Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 6 |
| 🟡 Medium | 6 |
| 🟢 Low | 4 |
| Code Quality | 13 |
| **Total** | **33** |

The most urgent fixes are the **SQL injection in search** (#1), **weak invite code generation** (#6/#14), and **wildcard CORS** (#8). These can be fixed in under an hour and significantly improve the security posture.
