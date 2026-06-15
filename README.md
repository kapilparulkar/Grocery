# 🛒 Grocery App (Netlify + Supabase)

Family grocery list app — accessible from anywhere, syncs across all devices.

## Setup Guide

### Step 1: Create Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com) → Sign up → New Project
2. Note your **Project URL** and **anon public key** (Settings → API)
3. Go to **SQL Editor** and run this:

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  quantity INTEGER DEFAULT 1,
  in_stock BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime (optional)
ALTER TABLE items REPLICA IDENTITY FULL;

-- Allow public access (using anon key)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON items FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Push to GitHub

```bash
cd grocery-app-netlify
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/grocery-app.git
git push -u origin main
```

### Step 3: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) → Sign up with GitHub
2. Click **"Add new site"** → **"Import an existing project"**
3. Select your GitHub repo
4. Build settings (auto-detected):
   - Build command: *(leave empty)*
   - Publish directory: `public`
5. Click **Deploy**

### Step 4: Add Environment Variables

In Netlify dashboard → Site settings → Environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | `your-anon-public-key` |

Then **redeploy** (Deploys → Trigger deploy).

### Step 5: Load Default Indian Groceries (Optional)

In Supabase SQL Editor, run:

```sql
INSERT INTO items (name, category, quantity, in_stock, sort_order) VALUES
('Rice (Basmati)', 'Produce', 5, true, 1),
('Wheat Flour (Atta)', 'Produce', 5, true, 2),
('Toor Dal', 'Produce', 1, true, 3),
('Moong Dal', 'Produce', 1, true, 4),
('Chana Dal', 'Produce', 1, true, 5),
('Urad Dal', 'Produce', 1, true, 6),
('Masoor Dal', 'Produce', 1, true, 7),
('Rajma', 'Produce', 1, true, 8),
('Chole (Chickpeas)', 'Produce', 1, true, 9),
('Poha', 'Produce', 1, true, 10),
('Suji (Semolina)', 'Produce', 1, true, 11),
('Besan (Gram Flour)', 'Produce', 1, true, 12),
('Onions', 'Produce', 2, true, 13),
('Tomatoes', 'Produce', 1, true, 14),
('Potatoes', 'Produce', 2, true, 15),
('Green Chillies', 'Produce', 1, true, 16),
('Ginger', 'Produce', 1, true, 17),
('Garlic', 'Produce', 1, true, 18),
('Coriander Leaves', 'Produce', 1, true, 19),
('Curry Leaves', 'Produce', 1, true, 20),
('Spinach (Palak)', 'Produce', 1, true, 21),
('Cauliflower', 'Produce', 1, true, 22),
('Capsicum', 'Produce', 1, true, 23),
('Okra (Bhindi)', 'Produce', 1, true, 24),
('Milk', 'Dairy', 2, true, 25),
('Curd (Dahi)', 'Dairy', 1, true, 26),
('Paneer', 'Dairy', 1, true, 27),
('Butter', 'Dairy', 1, true, 28),
('Ghee', 'Dairy', 1, true, 29),
('Turmeric Powder (Haldi)', 'Other', 1, true, 30),
('Red Chilli Powder', 'Other', 1, true, 31),
('Coriander Powder', 'Other', 1, true, 32),
('Cumin Powder (Jeera)', 'Other', 1, true, 33),
('Garam Masala', 'Other', 1, true, 34),
('Cumin Seeds', 'Other', 1, true, 35),
('Mustard Seeds', 'Other', 1, true, 36),
('Hing (Asafoetida)', 'Other', 1, true, 37),
('Salt', 'Other', 1, true, 38),
('Sugar', 'Other', 1, true, 39),
('Mustard Oil', 'Other', 1, true, 40),
('Sunflower Oil', 'Other', 1, true, 41),
('Tea (Chai Patti)', 'Beverages', 1, true, 42),
('Coffee Powder', 'Beverages', 1, true, 43),
('Biscuits', 'Snacks', 2, true, 44),
('Maggi Noodles', 'Snacks', 4, true, 45),
('Papad', 'Snacks', 1, true, 46),
('Pickle (Achar)', 'Snacks', 1, true, 47),
('Cashews (Kaju)', 'Snacks', 1, true, 48),
('Almonds (Badam)', 'Snacks', 1, true, 49),
('Bread', 'Bakery', 1, true, 50),
('Peas', 'Frozen', 1, true, 51),
('Dish Soap (Vim)', 'Household', 1, true, 52),
('Detergent (Surf)', 'Household', 1, true, 53),
('Floor Cleaner', 'Household', 1, true, 54),
('Dustbin Bags', 'Household', 1, true, 55),
('Soap', 'Personal Care', 2, true, 56),
('Shampoo', 'Personal Care', 1, true, 57),
('Toothpaste', 'Personal Care', 1, true, 58);
```

## Done! 🎉

Your app is now live at `https://your-site-name.netlify.app`

Share this URL with family — everyone can add/remove/toggle items from their phone.

## Local Development

```bash
npm install
npx netlify dev
```

Open: http://localhost:8888
```Kapil
```
