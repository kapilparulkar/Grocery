# 🛒 Grocery App — Project Knowledge

## Overview

A **family grocery list PWA** that enables multiple family members to manage a shared shopping list from any device. Built with vanilla HTML/JS, deployed on Netlify with Supabase as the backend.

**Live URL pattern:** `https://<site-name>.netlify.app`

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 User's Device (PWA)             │
│                                                 │
│   index.html → auth gate (redirect)            │
│   auth.html  → Google login + family setup     │
│   app.html   → Main grocery list SPA           │
└─────────────────────┬───────────────────────────┘
                      │ HTTPS (/api/* → serverless)
┌─────────────────────▼───────────────────────────┐
│                   Netlify                        │
│                                                 │
│   public/        → Static frontend (CDN)        │
│   netlify/functions/api.js  → Serverless API    │
│   netlify/functions/verify.js → Token check     │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                  Supabase                        │
│                                                 │
│   Auth   → Google OAuth + JWT session mgmt      │
│   DB     → PostgreSQL (families, members, items)│
│   RLS    → Row Level Security (data isolation)  │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework, no bundler) |
| Backend | Netlify Functions (Node.js serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Google OAuth via Supabase |
| Hosting | Netlify (static + functions) |
| PWA | Service worker (`sw.js`) + `manifest.json` |
| Dependencies | `@supabase/supabase-js`, `@netlify/functions`, `netlify-cli` |

---

## File Structure

```
grocery-app-netlify/
├── public/
│   ├── index.html         ← Entry point: checks auth, redirects to auth.html or app.html
│   ├── auth.html          ← Login screen + family create/join flows
│   ├── app.html           ← Main app (list view, shopping mode, drawer, modals)
│   ├── sw.js              ← Service worker (cache-first for assets, network for API)
│   ├── manifest.json      ← PWA manifest (installable on mobile)
│   └── _headers           ← Custom HTTP headers for Netlify CDN
├── netlify/functions/
│   ├── api.js             ← All API logic (auth, family, items CRUD)
│   └── verify.js          ← Standalone token verification
├── netlify.toml           ← Netlify config: publish dir, function dir, redirects
├── package.json           ← npm deps and scripts
├── .env.example           ← Required environment variables template
├── fix_api.py             ← One-off migration patch (can be removed)
├── README.md              ← Setup & deployment guide
├── GOOGLE_AUTH_PLAN.md    ← Auth + multi-family implementation plan
└── PROJECT_KNOWLEDGE.md   ← This file
```

---

## Database Schema

### Tables

**families**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | `gen_random_uuid()` |
| name | TEXT | e.g. "Sharma Family" |
| invite_code | TEXT (UNIQUE) | 6-char uppercase code |
| created_by | UUID → auth.users | Family creator |
| created_at | TIMESTAMPTZ | Auto |

**family_members**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| family_id | UUID → families | |
| user_id | UUID → auth.users | |
| display_name | TEXT | e.g. "Dad", "Mum", "Priya" |
| role | TEXT | `admin` or `member` |
| joined_at | TIMESTAMPTZ | |
| UNIQUE | (family_id, user_id) | |

**items**
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL (PK) | |
| name | TEXT | Item name |
| category | TEXT | Produce, Dairy, Snacks, etc. |
| quantity | INTEGER | Default 1 |
| in_stock | BOOLEAN | true = need to buy, false = bought |
| sort_order | INTEGER | Display ordering |
| family_id | UUID → families | Data isolation |
| added_by | TEXT | Display name of who added |
| created_at | TIMESTAMPTZ | |

### Row Level Security (RLS)

All tables have RLS enabled. Policies ensure users can only access data belonging to families they are a member of.

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header.  
Family-scoped endpoints use `X-Family-Id` header for multi-family users.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/me` | User info + all family memberships |
| POST | `/api/auth/family/create` | Create family, add user as admin, seed items from master_items |
| POST | `/api/auth/family/join` | Join existing family via invite code |
| GET | `/api/auth/family/members` | List members of a family (requires X-Family-Id) |
| GET | `/api/master-items/search?q=` | Autocomplete search against master_items catalog |
| GET | `/api/items` | Get all items for active family |
| POST | `/api/items` | Add single item |
| POST | `/api/items/bulk` | Bulk add (newline-separated text) |
| PUT | `/api/items/:id` | Update item (name, category, quantity, in_stock) |
| POST | `/api/items/:id/toggle` | Toggle in_stock status |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/items/bulk-restock` | Mark multiple items as in_stock (after shopping) |

---

## Authentication Flow

1. User opens app → `index.html` checks for `sb_token` in localStorage
2. If no token → redirect to `auth.html` (login screen)
3. User clicks "Continue with Google" → Supabase OAuth redirect
4. After Google consent → redirect back to `/auth.html` with session
5. Supabase client extracts session, stores `access_token` in localStorage
6. First-time user → shown family create/join screen
7. Returning user → redirected to `app.html`
8. All API calls include `Authorization: Bearer <token>`
9. Backend validates token via `supabase.auth.getUser()`

---

## User Flows

### New User
```
Open app → Google login → Family setup (create or join) → Set display name → App loads
```

### Returning User
```
Open app → Token valid → App loads immediately
```

### Inviting Family Members
```
Drawer → Invite → Show 6-char code → Share via copy/WhatsApp
Other member: Login → Join Family → Enter code → Done
```

### Multi-Family
```
Header tap → Family switcher dropdown → Select another family → Items reload
```

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Google OAuth login | ✅ Done | Via Supabase |
| Multi-family support | ✅ Done | Create, join, switch |
| CRUD items | ✅ Done | Add, edit, toggle, delete |
| Bulk add | ✅ Done | Paste newline-separated list |
| Shopping mode | ✅ Done | Checklist + bulk restock |
| Categories | ✅ Done | Filterable tabs |
| Search | ✅ Done | Client-side filter |
| Offline support | ✅ Done | Queues mutations, syncs on reconnect |
| Voice input | ✅ Done | Web Speech API |
| PDF export | ✅ Done | Client-side generation |
| Share list | ✅ Done | Web Share API |
| Dark mode | ✅ Done | Toggle with persistence |
| PWA installable | ✅ Done | Service worker + manifest |
| Realtime sync | ⚠️ Planned | `initRealtime()` is empty stub |
| Swipe gestures | ⚠️ Partial | CSS exists, JS may be incomplete |

---

## Environment Variables

Required in Netlify dashboard (Site settings → Environment variables):

| Key | Description |
|-----|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (for admin ops in api.js) |

---

## Development

```bash
npm install
npx netlify dev
# Opens at http://localhost:8888
```

The `netlify dev` command serves static files from `public/` and proxies `/api/*` to the local functions runtime.

---

## Deployment

1. Push to GitHub
2. Netlify auto-deploys from the connected repo
3. Build command: *(none — no build step)*
4. Publish directory: `public`
5. Functions directory: `netlify/functions`

---

## Design Decisions

- **No framework/bundler** — keeps deployment trivial (just static files + functions). Trade-off: harder to maintain as the app grows.
- **Single-file SPA (app.html)** — all app logic in one file for simplicity. ~830 lines of inline CSS + JS.
- **Supabase service key on backend only** — admin operations (cross-family queries, inserts with family_id) use the service key server-side. The anon key is public-safe.
- **Default Indian grocery items** — seeded on family creation for the target audience.
- **Invite codes** — 6-char uppercase alphanumeric, easy to share verbally or via message.
- **Family-scoped data** — every item belongs to a `family_id`. API resolves the active family from user's memberships + `X-Family-Id` header.

---

## Categories

```
Produce | Dairy | Meat | Bakery | Frozen | Beverages | Snacks | Household | Personal Care | Other
```

---

## Known Limitations / TODOs

1. **Realtime sync not wired** — `initRealtime()` is a no-op. Devices won't see each other's changes without refresh.
2. **No tests** — no test framework or test files.
3. **No CI/CD pipeline** — relies on Netlify auto-deploy.
4. **fix_api.py left in repo** — one-off patch script, should be cleaned up.
5. **Monolithic app.html** — would benefit from splitting CSS/JS into separate files if features keep growing.
6. **No rate limiting** — API has no throttling beyond Netlify's built-in limits.
7. **No item reordering UI** — `sort_order` exists in DB but drag-to-reorder isn't implemented.

---

## Performance Analysis (Mobile)

### Identified Bottlenecks

| # | Issue | Impact | Details |
|---|-------|--------|---------|
| 1 | **Cascading page loads** | High | User goes through `index.html` → API call → redirect to `app.html` → API call → API call → render. Three pages and 2+ sequential network calls before content shows. |
| 2 | **Netlify Functions cold start** | High | Serverless functions have ~500ms–1.5s cold start. Two sequential API calls (`auth/me` then `items`) means 1.5–3s delay on first load. |
| 3 | **Full DOM rebuild on every change** | Medium | `render()` uses `innerHTML` to rebuild the entire list (50+ items with child elements). No diffing or incremental updates — causes jank on low-end phones. |
| 4 | **5-second polling interval** | Medium | `setInterval` fetches all items every 5s, JSON-stringifies for comparison, potentially re-renders. Wakes CPU/radio constantly on mobile. |
| 5 | **No data caching** | Medium | Every page load fetches fresh from API. No "show cached, refresh in background" pattern. |
| 6 | **Supabase SDK from CDN** | Low-Med | `auth.html` loads ~45KB (gzipped) supabase-js from jsdelivr CDN. If CDN is slow, auth page hangs. |
| 7 | **Global touch listeners without RAF** | Low | `touchmove` handler runs querySelector + style updates on every frame without `requestAnimationFrame`, causing layout thrashing during swipes. |

### Recommended Fixes

#### High Impact

| # | Fix | Effort | Details |
|---|-----|--------|---------|
| 1 | **Eliminate index.html redirect** | Low | Go directly to `app.html`. Handle auth check inline — show login UI if needed. Saves a full page load + one API call. |
| 2 | **Show cached data instantly** | Low | On `app.html` load, render items from `localStorage` immediately, then fetch fresh data in background. User sees list in <100ms on repeat visits. |
| 3 | **Single `/api/init` endpoint** | Medium | Merge `auth/me` + `items` into one API call. Returns user, memberships, AND items in a single response. Cuts 2 sequential calls to 1. |
| 4 | **Use Netlify Edge Functions** | Medium | Move API from Node.js functions (cold start) to Edge Functions (Deno, no cold start, runs at CDN edge). Response drops from ~800ms to ~50ms. |

#### Medium Impact

| # | Fix | Effort | Details |
|---|-----|--------|---------|
| 5 | **Incremental DOM updates** | Medium | Instead of full `innerHTML` rebuild, patch only changed items using `data-id` attributes. |
| 6 | **Reduce polling / use Visibility API** | Low | Only poll when tab is visible. Increase interval to 30s. Better: wire up Supabase Realtime (stub exists). |
| 7 | **Debounce search rendering** | Low | Add 150ms debounce on `oninput="render()"` to avoid re-rendering on every keystroke. |
| 8 | **Throttle swipe handlers** | Low | Wrap `touchmove` in `requestAnimationFrame` to prevent layout thrashing. |

#### Low Impact (nice to have)

| # | Fix | Effort | Details |
|---|-----|--------|---------|
| 9 | **Preconnect to Supabase** | Trivial | Add `<link rel="preconnect" href="https://...supabase.co">` in HTML head. |
| 10 | **Self-host Supabase JS** | Low | Bundle supabase-js locally instead of fetching from CDN on auth page. |
| 11 | **Virtualized/lazy list rendering** | Medium | For 50+ items, render only visible items using Intersection Observer. |
| 12 | **Trim API response payload** | Low | Only return fields needed for rendering (skip `created_at`, `sort_order`). |

### Quick Win Implementation

```javascript
// Show cached data instantly (add to top of app.html <script>)
const cached = localStorage.getItem('grocery_items');
if (cached) {
  items = JSON.parse(cached);
  render(); // User sees their list in <100ms
}

// In load() — save to cache after fetch
async function load() {
  const data = await api('/api/init'); // single endpoint
  if (data && data.items) {
    items = data.items;
    localStorage.setItem('grocery_items', JSON.stringify(items));
    render();
  }
}
```

---

## Database: master_items Table

A reference/catalog table in Supabase used for autocomplete suggestions and seeding new families.

**Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL (PK) | Auto-increment |
| name | TEXT | Display name (e.g. "Sooji (Semolina)") |
| aliases | TEXT[] | Alternative search names (e.g. ["suji", "rava", "semolina"]) |
| category | TEXT | Category grouping |
| unit | TEXT | Measurement unit (kg, g, L, mL, pcs, pkt, bunch, dozen, roll) |
| default_quantity | TEXT | Default qty when adding |
| popular_score | INTEGER | Popularity ranking (higher = more common, max 99) |

**Categories (18):**
Grains & Flours, Pulses & Lentils, Spices - Whole, Spices - Powder, Oils & Ghee, Dairy, Vegetables, Fruits, Dry Fruits & Nuts, Beverages, Snacks, Pickles & Preserves, Sweeteners & Baking, Frozen, Bakery, Household, Personal Care, Baby Care, Pooja & Misc, Meat & Seafood, Condiments

**Total items:** ~328 (see `master_items_seed.sql`)

**Use cases:**
- Seed default items when a new family is created (queries items with `popular_score >= 75`)
- Autocomplete/suggestions when users add items via `/api/master-items/search?q=` endpoint (searches by name + aliases)
- Smart defaults (pre-fill unit, quantity, and category from master data)
- Sort suggestions by `popular_score`

**Integration status:** ✅ Wired up
- `api.js` — `getDefaultItems()` queries `master_items` for family seeding (fallback to hardcoded list if table empty)
- `api.js` — `GET /api/master-items/search?q=` endpoint for autocomplete
- `app.html` — Autocomplete dropdown on the "Add Item" modal, auto-fills name, category, and quantity

---

*Last updated: July 2026*
