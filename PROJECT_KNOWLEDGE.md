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
│   Realtime → postgres_changes subscriptions     │
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
| Realtime | Supabase Realtime (postgres_changes) |
| MCP Server | Python (`mcp/supabase_mcp_server.py`) — local dev tooling |
| Dependencies | `@supabase/supabase-js`, `@netlify/functions`, `netlify-cli` |

---

## File Structure

```
Grocery/
├── public/
│   ├── app.html              ← HTML shell (253 lines, structure only)
│   ├── css/
│   │   └── app.css           ← All styles (230 lines)
│   ├── js/
│   │   ├── main.js           ← Entry point: imports, realtime, polling, search, gestures, drawer, init (~290 lines)
│   │   ├── config.js         ← Supabase URL/key, category constants
│   │   ├── state.js          ← Shared mutable state object
│   │   ├── utils.js          ← esc(), haptic(), showNotif(), showToast(), hideToast()
│   │   ├── api.js            ← fetch wrapper, auth headers, offline queue
│   │   ├── render.js         ← render(), updateShopBadge(), showSkeleton()
│   │   ├── actions.js        ← addItem, toggle, changeQty, del, openEdit, saveEdit, etc.
│   │   ├── theme.js          ← toggleTheme, initTheme
│   │   ├── onboarding.js     ← showOnboarding, nextOnboardingStep, dismissOnboarding
│   │   ├── bulk.js           ← openBulk, bulkAdd
│   │   ├── voice.js          ← voiceInput, confirmVoiceAdd, autoDetectUnit
│   │   ├── family.js         ← loadFamilies, switchFamily, toggleFamilySwitcher
│   │   ├── shop.js           ← switchView, renderShop, doneShop, shopSelectAll
│   │   └── share.js          ← shareList, exportPDF
│   ├── sw.js                 ← Service worker (cache v8, all modules cached)
│   ├── manifest.json         ← PWA manifest
│   └── _headers              ← Custom CORS headers for Netlify CDN
├── netlify/functions/
│   ├── api.js                ← All API logic (auth, family, items CRUD, master search)
│   └── verify.js             ← Standalone token verification
├── mcp/
│   └── supabase_mcp_server.py  ← Python MCP server for dev tooling
├── sql/
│   ├── master_items.sql       ← Master catalog schema + seed data
│   └── master_items_full.sql  ← Extended seed data
├── netlify.toml              ← Netlify config: publish dir, functions, redirects
├── package.json              ← npm deps and scripts
├── PROJECT_KNOWLEDGE.md      ← This file
└── REFACTOR_TASKS.md         ← Refactoring task tracker
```

---

## Setup Guide

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign up → New Project
2. Note your **Project URL** and **anon public key** (Settings → API)
3. Run the SQL setup (see Database Schema section below)

### Step 2: Database Setup

Run in Supabase SQL Editor:

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

-- RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON family_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON items FOR ALL USING (true) WITH CHECK (true);
```

Then run `sql/master_items.sql` to populate the autocomplete catalog.

### Step 3: Deploy to Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → Import project from GitHub
3. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `public`
4. Deploy

### Step 4: Environment Variables

In Netlify dashboard → Site settings → Environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon/public key |
| `SUPABASE_SERVICE_KEY` | Your service role key (secret) |

Redeploy after adding variables.

### Step 5: Enable Realtime

In Supabase dashboard: **Database** → **Replication** → Enable realtime for the `items` table.

### Local Development

```bash
npm install
npx netlify dev
# Opens at http://localhost:8888
```

---

## Database Schema

### Tables (Supabase PostgreSQL)

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
| id | SERIAL (PK) | |
| family_id | UUID → families | ON DELETE CASCADE |
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
| quantity | NUMERIC | Default 1 |
| unit | TEXT | pcs, kg, g, L, ml, packet, dozen, bundle |
| in_stock | BOOLEAN | true = in stock, false = need to buy |
| sort_order | INTEGER | Display ordering |
| family_id | UUID → families | ON DELETE CASCADE |
| added_by | TEXT | Display name of who added |
| note | TEXT | Optional (brand, size, etc.) |
| created_at | TIMESTAMPTZ | |

**master_items** (326 rows — catalog for autocomplete)
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL (PK) | |
| name | TEXT (UNIQUE) | Display name |
| aliases | TEXT[] | Alternative search names |
| category | TEXT | Category grouping (18 categories) |
| unit | TEXT | Default measurement unit |
| default_quantity | NUMERIC | Default qty when adding |
| popular_score | INTEGER | Popularity ranking (higher = more common) |

**Indexes on master_items:**
- `idx_master_name_trgm` — GIN trigram index for fuzzy search
- `idx_master_category` — B-tree on category

### Relationships

```
families (1) ──── (*) family_members (*) ──── (1) auth.users
families (1) ──── (*) items
```

### Row Level Security (RLS)

All tables have RLS enabled:
- `families`, `family_members`, `items` — currently "allow all" (secured at API layer)
- `master_items` — public SELECT allowed (for autocomplete)

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header.  
Family-scoped endpoints use `X-Family-Id` header for multi-family users.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/me` | User info + all family memberships |
| POST | `/api/auth/family/create` | Create family (limit 1 per user), seed default items |
| POST | `/api/auth/family/join` | Join existing family via invite code |
| GET | `/api/auth/family/members` | List members (requires X-Family-Id) |
| GET | `/api/master-items?q=` | Fuzzy search master catalog (name + aliases) |
| GET | `/api/items` | Get all items for active family |
| POST | `/api/items` | Add item (deduplicates, merges quantity if exists) |
| POST | `/api/items/bulk` | Bulk add (newline-separated text) |
| PUT | `/api/items/:id` | Update item fields |
| POST | `/api/items/:id/toggle` | Toggle in_stock status |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/items/bulk-restock` | Restock multiple items (after shopping) |

---

## Authentication Flow

1. User opens app → `index.html` checks for `sb_token` in localStorage
2. If no token → redirect to `auth.html`
3. "Continue with Google" → Supabase OAuth redirect
4. After consent → redirect back to `/auth.html` with session
5. Supabase client extracts session, stores `access_token` in localStorage
6. First-time user → family create/join screen
7. Returning user → redirected to `app.html`
8. All API calls include `Authorization: Bearer <token>`
9. Backend validates token via `supabase.auth.getUser()`

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Google OAuth login | ✅ | Via Supabase |
| Multi-family support | ✅ | Create, join, switch |
| CRUD items | ✅ | Add, edit, toggle, delete |
| Duplicate detection | ✅ | Merges quantity if item exists |
| Bulk add | ✅ | Paste newline-separated list |
| Shopping mode | ✅ | Checklist + bulk restock, proper alignment |
| Categories | ✅ | Filterable tabs |
| Search + autocomplete | ✅ | Client filter + master catalog suggestions |
| Master catalog (326 items) | ✅ | Indian grocery focus with aliases |
| Offline support | ✅ | Queues mutations, syncs on reconnect |
| Voice input | ✅ | Web Speech API with confirmation modal |
| PDF export | ✅ | Client-side generation + print |
| Share list | ✅ | Web Share API / WhatsApp fallback |
| Dark mode | ✅ | Toggle with persistence |
| PWA installable | ✅ | Service worker + manifest |
| Realtime sync | ✅ | Supabase postgres_changes subscription |
| Swipe gestures | ✅ | Swipe left/right to toggle stock status |
| Pull-to-refresh | ✅ | Spring-based animation with progress text |
| Onboarding tutorial | ✅ | 4-step walkthrough for new users |
| Smart unit detection | ✅ | Auto-detects unit from item name |
| Quantity controls | ✅ | +/- buttons inline |
| Move to top | ✅ | Prioritize items within category |
| Undo delete | ✅ | Toast with undo (last 10 items) |
| Cached instant render | ✅ | Shows localStorage data immediately |
| Smart polling | ✅ | 30s interval, pauses when tab hidden |
| Item notes | ✅ | Optional note per item (brand, size) |
| Search clear button | ✅ | ✕ button to clear search input |
| Optimistic UI | ✅ | Toggle, add, qty change — instant response, no blink |
| Skeleton loading | ✅ | Shimmer placeholders on first visit (no cache) |
| DOM patching | ✅ | Toggle/qty update without full re-render |
| Better empty state | ✅ | Styled card with icon + helpful hints |
| GPU-accelerated animations | ✅ | `will-change` on items and buttons |

---

## MCP Server (Dev Tooling)

A custom Python MCP server at `mcp/supabase_mcp_server.py` provides direct database access from the IDE.

**Config:** `.kiro/settings/mcp.json` (workspace level at `c:\RnD\.kiro\settings\`)

**Available tools:**
- `execute_sql` — Raw SQL (needs service role key; currently limited)
- `list_tables` — List public schema tables
- `describe_table` — Column details
- `query_table` — PostgREST query with filters
- `insert_row` — Insert data
- `update_rows` — Update with filters
- `delete_rows` — Delete with filters
- `get_table_row_count` — Exact count
- `search_items` — Search master_items by name

**Note:** Uses `verify=False` for corporate proxy/Zscaler compatibility.

---

## Design Decisions

- **No framework/bundler** — uses native ES modules (`<script type="module">`) with no build step. 14 focused JS files loaded via HTTP/2 multiplexing.
- **Modular architecture** — split from a 1417-line monolith into 14 files. Each module imports only what it needs. Shared state via `state.js` object.
- **Supabase service key backend-only** — admin operations use service key server-side. Anon key is safe for client.
- **Default Indian grocery items** — seeded on family creation from master_items catalog.
- **Invite codes** — 6-char uppercase, easy to share verbally.
- **Family-scoped data** — every item has `family_id`. API resolves active family from memberships + header.
- **Master catalog grows organically** — new items added by users get inserted into master_items with `popular_score: 1`.
- **Optimistic caching** — localStorage cache shown immediately, fresh data fetched in background.
- **DOM patching over full re-render** — toggle and quantity changes patch individual DOM elements instead of rebuilding the entire list with innerHTML. Full render only for structural changes (add, delete, filter).
- **Single serverless function** — all routes in one `api.js` file (simpler deployment, trade-off: monolithic).

---

## Categories

**In the app UI (10):**
```
Produce | Dairy | Meat | Bakery | Frozen | Beverages | Snacks | Household | Personal Care | Other
```

**In master_items catalog (18):**
```
Grains & Flours | Pulses & Lentils | Spices - Whole | Spices - Powder | Oils & Ghee | Dairy |
Vegetables | Fruits | Dry Fruits & Nuts | Beverages | Snacks | Pickles & Preserves |
Sweeteners & Baking | Frozen | Bakery | Household | Personal Care | Baby Care
```

---

## Security Review

### 🔴 Critical

| # | Issue | Description |
|---|-------|-------------|
| 1 | SQL injection via search | Master-items search previously interpolated user input into `.or()` filter. **Fixed** — now uses separate `.ilike()` and `.contains()` calls with input sanitization. |
| 2 | No family membership validation | If `X-Family-Id` header is tampered, fallback logic silently uses first family. |
| 3 | Service key fallback to anon key | If `SUPABASE_SERVICE_KEY` is missing, admin ops run with anon key. Should fail fast. |

### 🟠 High

| # | Issue | Description |
|---|-------|-------------|
| 4 | Weak invite codes | `Math.random()` is not cryptographically secure. Should use `crypto.randomBytes()`. |
| 5 | Wildcard CORS | `Access-Control-Allow-Origin: *` allows any site to make requests. |
| 6 | No input length validation | Names, notes, bulk text have no max length. |
| 7 | Bulk add no item limit | `/items/bulk` splits by newlines with no cap on item count. |
| 8 | No brute-force protection on join | Invite codes are only 6 chars with no rate limit. |

### 🟡 Medium

| # | Issue | Description |
|---|-------|-------------|
| 9 | No token refresh | Access tokens expire after 1h. App doesn't use `onAuthStateChange`. |
| 10 | localStorage token storage | Vulnerable to XSS. HttpOnly cookies would be safer. |
| 11 | Race condition on qty merge | Read-then-update pattern. Concurrent requests cause lost updates. |
| 12 | No Content-Security-Policy | Missing CSP allows inline scripts, external injection. |

### Recommended Fixes (Priority)

1. ~~Sanitize search input~~ ✅ Done
2. Replace `Math.random()` with `crypto.randomBytes()` for invite codes
3. Restrict CORS to actual Netlify domain
4. Add input validation (max lengths for name: 100, note: 500, bulk: 50 items)
5. Fail fast if `SUPABASE_SERVICE_KEY` is missing
6. Add token refresh via `onAuthStateChange`
7. Use atomic SQL increment for quantity merges
8. Add CSP header

---

## Known Limitations

1. ~~**Monolithic app.html**~~ ✅ Resolved — split into 14 ES modules
2. **No tests** — no test framework or coverage
3. **No CI/CD pipeline** — relies on Netlify auto-deploy
4. **No rate limiting** — beyond Netlify's built-in limits
5. **No drag-to-reorder** — `sort_order` exists but no drag UI
6. **Category mismatch** — app uses 10 categories, master_items uses 18
7. **Shopping mode loses progress on refresh** — checked state is DOM-only
8. **No token refresh** — tokens expire after 1h without auto-renewal
9. **verify.js is redundant** — token verification already done in api.js
10. **Inline onclick handlers** — still use `window.*` exports (optional Phase 3 cleanup)

---

## Future Roadmap

### Quick Wins
- Floating "+" FAB button for quick add
- Persist shopping mode checked state in localStorage
- Logout confirmation dialog
- Item count summary in header ("3 items needed")
- Search highlighting in suggestions
- ~~Optimistic UI (update immediately, confirm with server)~~ ✅ Done
- ~~Skeleton loading placeholders~~ ✅ Done

### Medium Effort
- Sort options (name, recently added, quantity)
- Search within shopping mode
- Swipe-to-delete (left swipe past threshold)
- Last purchased timestamp tracking
- Export/import list as JSON backup
- Drag-and-drop reorder
- ~~Better pull-to-refresh animation (spring-based)~~ ✅ Done

### Bigger Features
- Push notifications (family member adds items)
- Recurring items with scheduled auto-mark
- Price tracking + shopping budget
- Activity log (who did what, when)
- Multi-language support (Hindi UI)
- Move to component framework (Svelte + Vite) for maintainability
- Native app wrapper (Capacitor) for app store presence

---

*Last updated: July 14, 2026 — Refactoring complete (Phase 1-3)*
