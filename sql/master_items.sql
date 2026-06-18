-- Master Items Catalog
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE master_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'Other',
  unit TEXT DEFAULT 'pcs',
  default_quantity NUMERIC DEFAULT 1,
  popular_score INTEGER DEFAULT 0
);

-- Enable trigram index for fuzzy search
CREATE INDEX idx_master_name_trgm ON master_items USING gin(name gin_trgm_ops);
CREATE INDEX idx_master_category ON master_items(category);

-- RLS
ALTER TABLE master_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read" ON master_items FOR SELECT USING (true);

-- Seed data: Indian grocery items
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
-- Grains & Staples
('Rice (Basmati)', '{chawal,basmati,rice}', 'Produce', 'kg', 5, 95),
('Wheat Flour (Atta)', '{atta,gehun,wheat flour}', 'Produce', 'kg', 5, 95),
('Maida', '{all purpose flour,refined flour,maida}', 'Produce', 'kg', 1, 60),
('Sooji (Semolina)', '{suji,rava,semolina}', 'Produce', 'kg', 1, 70),
('Poha', '{flattened rice,chivda,beaten rice}', 'Produce', 'kg', 1, 65),
('Besan (Gram Flour)', '{gram flour,chickpea flour,besan}', 'Produce', 'kg', 1, 70),

-- Dals & Pulses
('Toor Dal', '{arhar dal,pigeon pea,toor}', 'Produce', 'kg', 1, 90),
('Moong Dal', '{green gram,moong}', 'Produce', 'kg', 1, 85),
('Chana Dal', '{bengal gram,chana}', 'Produce', 'kg', 1, 80),
('Urad Dal', '{black gram,urad}', 'Produce', 'kg', 1, 75),
('Masoor Dal', '{red lentil,masoor}', 'Produce', 'kg', 1, 80),
('Rajma', '{kidney beans,rajma}', 'Produce', 'kg', 1, 75),
('Chole (Chickpeas)', '{kabuli chana,garbanzo,chole,chickpeas}', 'Produce', 'kg', 1, 80),

-- Vegetables
('Onions', '{pyaz,kanda,onion}', 'Produce', 'kg', 2, 98),
('Tomatoes', '{tamatar,tomato}', 'Produce', 'kg', 1, 97),
('Potatoes', '{aloo,potato}', 'Produce', 'kg', 2, 96),
('Green Chillies', '{hari mirch,chilli,mirchi}', 'Produce', 'g', 100, 90),
('Ginger', '{adrak}', 'Produce', 'g', 100, 88),
('Garlic', '{lahsun}', 'Produce', 'g', 100, 87),
('Coriander Leaves', '{dhaniya patta,cilantro,hara dhaniya}', 'Produce', 'bundle', 1, 85),
('Curry Leaves', '{kadi patta,meetha neem}', 'Produce', 'bundle', 1, 80),
('Spinach (Palak)', '{palak,spinach}', 'Produce', 'bundle', 1, 75),
('Cauliflower', '{gobi,phool gobi}', 'Produce', 'pcs', 1, 70),
('Capsicum', '{shimla mirch,bell pepper}', 'Produce', 'pcs', 1, 65),
('Okra (Bhindi)', '{bhindi,lady finger,okra}', 'Produce', 'g', 250, 70),
('Brinjal (Baingan)', '{baingan,eggplant,brinjal}', 'Produce', 'g', 500, 60),
('Bottle Gourd (Lauki)', '{lauki,ghiya,dudhi}', 'Produce', 'pcs', 1, 55),
('Bitter Gourd (Karela)', '{karela}', 'Produce', 'g', 250, 50),
('Cabbage', '{patta gobi,band gobi}', 'Produce', 'pcs', 1, 60),
('Carrot', '{gajar}', 'Produce', 'kg', 0.5, 65),
('Beans', '{french beans,sem}', 'Produce', 'g', 250, 60),
('Pumpkin (Kaddu)', '{kaddu,sitaphal}', 'Produce', 'kg', 1, 50),
('Lemon', '{nimbu,lime}', 'Produce', 'pcs', 4, 75),
('Cucumber', '{kheera,kakdi}', 'Produce', 'pcs', 2, 60),
('Mushroom', '{khumb}', 'Produce', 'g', 200, 50),

-- Fruits
('Banana', '{kela}', 'Produce', 'dozen', 1, 80),
('Apple', '{seb}', 'Produce', 'kg', 1, 70),
('Mango', '{aam}', 'Produce', 'kg', 1, 65),
('Grapes', '{angoor}', 'Produce', 'kg', 0.5, 55),
('Orange', '{santra,narangi}', 'Produce', 'kg', 1, 60),
('Papaya', '{papita}', 'Produce', 'pcs', 1, 50),
('Watermelon', '{tarbooz}', 'Produce', 'pcs', 1, 45),
('Pomegranate', '{anar}', 'Produce', 'pcs', 2, 55),

-- Dairy
('Milk', '{doodh,dudh}', 'Dairy', 'L', 1, 99),
('Curd (Dahi)', '{dahi,yogurt,curd}', 'Dairy', 'kg', 1, 90),
('Paneer', '{cottage cheese,paneer}', 'Dairy', 'g', 200, 85),
('Butter', '{makhan}', 'Dairy', 'g', 100, 80),
('Ghee', '{clarified butter,desi ghee}', 'Dairy', 'L', 1, 85),
('Cheese', '{cheese slice,processed cheese}', 'Dairy', 'g', 200, 60),
('Cream', '{malai,fresh cream}', 'Dairy', 'ml', 200, 50),
('Buttermilk', '{chaach,mattha}', 'Dairy', 'L', 1, 55),

-- Spices & Masalas
('Turmeric Powder (Haldi)', '{haldi,turmeric}', 'Other', 'g', 100, 90),
('Red Chilli Powder', '{lal mirch,red chilli}', 'Other', 'g', 100, 90),
('Coriander Powder', '{dhaniya powder,dhaniya}', 'Other', 'g', 100, 85),
('Cumin Powder (Jeera)', '{jeera powder,cumin}', 'Other', 'g', 100, 85),
('Garam Masala', '{garam masala}', 'Other', 'g', 50, 85),
('Cumin Seeds', '{jeera,sabut jeera,cumin seeds}', 'Other', 'g', 100, 80),
('Mustard Seeds', '{rai,sarson,mustard}', 'Other', 'g', 100, 75),
('Hing (Asafoetida)', '{asafoetida,heeng,hing}', 'Other', 'g', 50, 70),
('Salt', '{namak}', 'Other', 'kg', 1, 95),
('Sugar', '{cheeni,shakkar}', 'Other', 'kg', 1, 95),
('Black Pepper', '{kali mirch}', 'Other', 'g', 50, 65),
('Bay Leaf (Tej Patta)', '{tej patta,bay leaf}', 'Other', 'g', 20, 55),
('Cinnamon (Dalchini)', '{dalchini,cinnamon}', 'Other', 'g', 50, 60),
('Cardamom (Elaichi)', '{elaichi,cardamom}', 'Other', 'g', 25, 65),
('Cloves (Laung)', '{laung,cloves}', 'Other', 'g', 25, 55),
('Fennel Seeds (Saunf)', '{saunf,fennel}', 'Other', 'g', 50, 50),
('Fenugreek Seeds (Methi)', '{methi dana,fenugreek}', 'Other', 'g', 50, 50),
('Chaat Masala', '{chaat masala}', 'Other', 'g', 50, 55),
('Kitchen King Masala', '{kitchen king}', 'Other', 'g', 50, 50),
('Biryani Masala', '{biryani masala}', 'Other', 'g', 50, 50),
('Sambhar Masala', '{sambhar masala,sambar}', 'Other', 'g', 50, 50),
('Pav Bhaji Masala', '{pav bhaji masala}', 'Other', 'g', 50, 50),
('Tamarind (Imli)', '{imli,tamarind}', 'Other', 'g', 200, 55),
('Jaggery (Gud)', '{gud,jaggery}', 'Other', 'g', 500, 55),
('Dry Mango Powder (Amchur)', '{amchur,amchoor}', 'Other', 'g', 50, 45),

-- Oils
('Mustard Oil', '{sarson ka tel,mustard}', 'Other', 'L', 1, 80),
('Sunflower Oil', '{refined oil,sunflower}', 'Other', 'L', 1, 80),
('Coconut Oil', '{nariyal tel,coconut}', 'Other', 'L', 1, 60),
('Olive Oil', '{jaitun tel,olive}', 'Other', 'ml', 500, 45),
('Sesame Oil (Til)', '{til ka tel,gingelly}', 'Other', 'ml', 500, 40),

-- Beverages
('Tea (Chai Patti)', '{chai,tea leaves,chai patti}', 'Beverages', 'g', 250, 95),
('Coffee Powder', '{filter coffee,coffee}', 'Beverages', 'g', 100, 70),
('Green Tea', '{green tea}', 'Beverages', 'packet', 1, 45),
('Horlicks', '{horlicks,health drink}', 'Beverages', 'g', 500, 50),
('Bournvita', '{bournvita}', 'Beverages', 'g', 500, 50),

-- Snacks
('Biscuits', '{biscuit,cookies}', 'Snacks', 'packet', 2, 80),
('Maggi Noodles', '{noodles,instant noodles,maggi}', 'Snacks', 'packet', 4, 85),
('Papad', '{papadum,papad}', 'Snacks', 'packet', 1, 70),
('Pickle (Achar)', '{achar,pickle}', 'Snacks', 'g', 400, 65),
('Cashews (Kaju)', '{kaju,cashew}', 'Snacks', 'g', 250, 60),
('Almonds (Badam)', '{badam,almond}', 'Snacks', 'g', 250, 60),
('Raisins (Kishmish)', '{kishmish,raisin}', 'Snacks', 'g', 100, 50),
('Walnuts (Akhrot)', '{akhrot,walnut}', 'Snacks', 'g', 250, 45),
('Peanuts (Moongfali)', '{moongfali,mungfali,peanut}', 'Snacks', 'g', 250, 55),
('Chips', '{potato chips,lays}', 'Snacks', 'packet', 2, 60),
('Namkeen', '{bhujia,mixture,namkeen}', 'Snacks', 'g', 200, 55),
('Popcorn', '{popcorn,makka}', 'Snacks', 'packet', 1, 40),

-- Bakery
('Bread', '{pav,loaf,bread}', 'Bakery', 'packet', 1, 85),
('Pav', '{bun,pav}', 'Bakery', 'packet', 1, 60),
('Cake', '{cake}', 'Bakery', 'pcs', 1, 40),
('Rusk', '{toast,rusk}', 'Bakery', 'packet', 1, 50),

-- Frozen
('Peas (Frozen)', '{matar,frozen peas}', 'Frozen', 'g', 500, 70),
('Frozen Corn', '{makka,corn,frozen corn}', 'Frozen', 'g', 500, 50),
('Ice Cream', '{ice cream}', 'Frozen', 'L', 1, 55),
('Frozen Parathas', '{paratha,frozen paratha}', 'Frozen', 'packet', 1, 45),

-- Household
('Dish Soap (Vim)', '{vim,dish wash,dish soap}', 'Household', 'pcs', 1, 85),
('Detergent (Surf)', '{surf,washing powder,detergent,tide}', 'Household', 'kg', 1, 85),
('Floor Cleaner', '{phenyl,lizol,floor cleaner}', 'Household', 'L', 1, 70),
('Dustbin Bags', '{garbage bags,dustbin bags}', 'Household', 'packet', 1, 65),
('Sponge', '{scrubber,sponge}', 'Household', 'pcs', 2, 50),
('Toilet Cleaner', '{harpic,toilet cleaner}', 'Household', 'L', 1, 65),
('Broom (Jhadu)', '{jhadu,broom}', 'Household', 'pcs', 1, 40),
('Aluminium Foil', '{foil,aluminium foil}', 'Household', 'pcs', 1, 45),
('Cling Wrap', '{food wrap,cling wrap}', 'Household', 'pcs', 1, 40),
('Tissue Paper', '{tissue,napkins}', 'Household', 'packet', 1, 60),
('Mosquito Repellent', '{goodnight,allout,mosquito}', 'Household', 'pcs', 1, 55),

-- Personal Care
('Soap', '{bathing soap,body wash,soap}', 'Personal Care', 'pcs', 2, 85),
('Shampoo', '{shampoo}', 'Personal Care', 'ml', 200, 80),
('Toothpaste', '{toothpaste,colgate}', 'Personal Care', 'pcs', 1, 85),
('Toothbrush', '{toothbrush}', 'Personal Care', 'pcs', 1, 60),
('Hair Oil', '{coconut oil,hair oil}', 'Personal Care', 'ml', 200, 60),
('Face Wash', '{face wash}', 'Personal Care', 'ml', 100, 55),
('Deodorant', '{deo,deodorant}', 'Personal Care', 'pcs', 1, 50),
('Razor', '{razor,blade}', 'Personal Care', 'packet', 1, 45),
('Sanitary Pads', '{pads,sanitary}', 'Personal Care', 'packet', 1, 60),
('Hand Wash', '{handwash,hand wash}', 'Personal Care', 'ml', 250, 65),
('Moisturizer', '{cream,moisturizer,lotion}', 'Personal Care', 'ml', 100, 50),
('Sunscreen', '{sunscreen}', 'Personal Care', 'ml', 50, 40);


-- Function to atomically increment popular_score when an existing item is re-added
CREATE OR REPLACE FUNCTION increment_popular_score(item_name TEXT)
RETURNS void AS $$
BEGIN
  UPDATE master_items
  SET popular_score = popular_score + 1
  WHERE lower(name) = lower(item_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
