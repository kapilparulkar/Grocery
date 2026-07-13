-- ============================================================
-- master_items table seed data for Grocery App (Supabase)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS master_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  unit TEXT DEFAULT 'pcs',
  default_quantity TEXT DEFAULT '1',
  popular_score INTEGER DEFAULT 50
);

-- Clear existing data (optional — comment out if appending)
TRUNCATE master_items RESTART IDENTITY;

-- ============================================================
-- GRAINS & FLOURS
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Basmati Rice', ARRAY['chawal','basmati'], 'Grains & Flours', 'kg', '5', 99),
('Raw Rice (Sona Masoori)', ARRAY['pacharisi','sona masoori'], 'Grains & Flours', 'kg', '5', 90),
('Brown Rice', ARRAY['brown chawal'], 'Grains & Flours', 'kg', '2', 55),
('Wheat Flour (Atta)', ARRAY['atta','gehun ka atta','chapati flour'], 'Grains & Flours', 'kg', '5', 98),
('Maida (All Purpose Flour)', ARRAY['maida','refined flour','APF'], 'Grains & Flours', 'kg', '1', 75),
('Sooji (Semolina)', ARRAY['suji','rava','semolina'], 'Grains & Flours', 'kg', '1', 80),
('Besan (Gram Flour)', ARRAY['besan','chickpea flour'], 'Grains & Flours', 'kg', '1', 82),
('Rice Flour', ARRAY['chawal ka atta'], 'Grains & Flours', 'kg', '0.5', 60),
('Poha (Flattened Rice)', ARRAY['chivda rice','aval','beaten rice'], 'Grains & Flours', 'kg', '1', 78),
('Puffed Rice (Murmura)', ARRAY['kurmura','lai','mamra'], 'Grains & Flours', 'kg', '0.5', 55),
('Vermicelli (Seviyan)', ARRAY['sevai','semiya'], 'Grains & Flours', 'kg', '0.5', 65),
('Cracked Wheat (Dalia)', ARRAY['bulgur wheat','lapsi'], 'Grains & Flours', 'kg', '0.5', 55),
('Corn Flour (Makki Atta)', ARRAY['maize flour','makki ka atta'], 'Grains & Flours', 'kg', '0.5', 50),
('Ragi Flour (Finger Millet)', ARRAY['nachni','ragi'], 'Grains & Flours', 'kg', '0.5', 50),
('Jowar Flour (Sorghum)', ARRAY['jowar ka atta'], 'Grains & Flours', 'kg', '0.5', 45),
('Bajra Flour (Pearl Millet)', ARRAY['bajra ka atta'], 'Grains & Flours', 'kg', '0.5', 45),
('Sabudana (Sago)', ARRAY['tapioca pearls','javvarisi'], 'Grains & Flours', 'kg', '0.5', 60),
('Bread Crumbs', ARRAY['breadcrumbs'], 'Grains & Flours', 'g', '200', 30),
('Idli Rava', ARRAY['idli rice'], 'Grains & Flours', 'kg', '1', 55),
('Millet (Foxtail)', ARRAY['kangni','thinai'], 'Grains & Flours', 'kg', '0.5', 40);

-- ============================================================
-- PULSES & LENTILS
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Toor Dal (Arhar)', ARRAY['pigeon pea','arhar dal'], 'Pulses & Lentils', 'kg', '1', 95),
('Moong Dal (Split)', ARRAY['mung dal','yellow moong'], 'Pulses & Lentils', 'kg', '1', 90),
('Moong Dal (Whole Green)', ARRAY['sabut moong','green gram'], 'Pulses & Lentils', 'kg', '0.5', 70),
('Chana Dal', ARRAY['bengal gram dal','split chickpea'], 'Pulses & Lentils', 'kg', '1', 88),
('Masoor Dal (Red Lentil)', ARRAY['malka masoor','pink lentil'], 'Pulses & Lentils', 'kg', '1', 87),
('Masoor Dal (Whole Brown)', ARRAY['sabut masoor'], 'Pulses & Lentils', 'kg', '0.5', 55),
('Urad Dal (Split)', ARRAY['white urad','dhuli urad'], 'Pulses & Lentils', 'kg', '0.5', 80),
('Urad Dal (Whole Black)', ARRAY['sabut urad','kali dal'], 'Pulses & Lentils', 'kg', '0.5', 75),
('Rajma (Kidney Beans)', ARRAY['rajma','red kidney beans'], 'Pulses & Lentils', 'kg', '0.5', 82),
('Chole (Chickpeas)', ARRAY['kabuli chana','garbanzo'], 'Pulses & Lentils', 'kg', '0.5', 85),
('Kala Chana (Black Chickpeas)', ARRAY['desi chana','brown chana'], 'Pulses & Lentils', 'kg', '0.5', 60),
('Lobiya (Black-eyed Peas)', ARRAY['rongi','chavli'], 'Pulses & Lentils', 'kg', '0.5', 50),
('Moth Dal (Matki)', ARRAY['moth beans','turkish gram'], 'Pulses & Lentils', 'kg', '0.5', 40),
('Kulthi Dal (Horse Gram)', ARRAY['kollu'], 'Pulses & Lentils', 'kg', '0.5', 30),
('Val Dal (Field Beans)', ARRAY['vaal','hyacinth bean'], 'Pulses & Lentils', 'kg', '0.5', 30),
('Soya Chunks', ARRAY['nutrela','meal maker','soybean'], 'Pulses & Lentils', 'g', '200', 55),
('Peanuts (Raw)', ARRAY['moongphali','groundnut'], 'Pulses & Lentils', 'kg', '0.5', 70);

-- ============================================================
-- SPICES — WHOLE
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Cumin Seeds (Jeera)', ARRAY['jeera','safed jeera'], 'Spices - Whole', 'g', '100', 97),
('Mustard Seeds (Rai)', ARRAY['sarson','rai'], 'Spices - Whole', 'g', '100', 90),
('Coriander Seeds (Dhania)', ARRAY['sabut dhania'], 'Spices - Whole', 'g', '100', 75),
('Fennel Seeds (Saunf)', ARRAY['saunf','moti saunf'], 'Spices - Whole', 'g', '100', 70),
('Fenugreek Seeds (Methi Dana)', ARRAY['methi seeds'], 'Spices - Whole', 'g', '50', 65),
('Carom Seeds (Ajwain)', ARRAY['ajwain','bishops weed'], 'Spices - Whole', 'g', '50', 60),
('Kalonji (Nigella Seeds)', ARRAY['onion seeds','mangrail'], 'Spices - Whole', 'g', '50', 55),
('Green Cardamom (Elaichi)', ARRAY['chhoti elaichi','hari elaichi'], 'Spices - Whole', 'g', '25', 85),
('Black Cardamom (Badi Elaichi)', ARRAY['kali elaichi'], 'Spices - Whole', 'g', '25', 50),
('Cloves (Laung)', ARRAY['laung'], 'Spices - Whole', 'g', '25', 80),
('Cinnamon Sticks (Dalchini)', ARRAY['dalchini','cassia bark'], 'Spices - Whole', 'g', '50', 80),
('Black Pepper (Kali Mirch)', ARRAY['peppercorn','golki'], 'Spices - Whole', 'g', '50', 78),
('Bay Leaves (Tej Patta)', ARRAY['tej patta','indian bay leaf'], 'Spices - Whole', 'g', '25', 72),
('Star Anise (Chakri Phool)', ARRAY['biryani phool','star anise'], 'Spices - Whole', 'g', '25', 45),
('Mace (Javitri)', ARRAY['javitri'], 'Spices - Whole', 'g', '10', 35),
('Nutmeg (Jaiphal)', ARRAY['jaiphal'], 'Spices - Whole', 'pcs', '2', 40),
('Dry Red Chillies', ARRAY['sabut lal mirch','whole red chilli'], 'Spices - Whole', 'g', '100', 85),
('Saffron (Kesar)', ARRAY['kesar','zafran'], 'Spices - Whole', 'g', '1', 40),
('Asafoetida (Hing)', ARRAY['hing','heeng'], 'Spices - Whole', 'g', '25', 88),
('White Sesame Seeds (Til)', ARRAY['safed til'], 'Spices - Whole', 'g', '100', 55),
('Black Sesame Seeds', ARRAY['kala til'], 'Spices - Whole', 'g', '50', 35),
('Poppy Seeds (Khus Khus)', ARRAY['posto','khus khus'], 'Spices - Whole', 'g', '50', 40),
('Shah Jeera (Black Cumin)', ARRAY['kala jeera','caraway'], 'Spices - Whole', 'g', '25', 35);

-- ============================================================
-- SPICES — POWDERED
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Turmeric Powder (Haldi)', ARRAY['haldi powder'], 'Spices - Powder', 'g', '100', 99),
('Red Chilli Powder', ARRAY['lal mirch powder','mirchi'], 'Spices - Powder', 'g', '100', 97),
('Kashmiri Red Chilli Powder', ARRAY['kashmiri mirch','deghi mirch'], 'Spices - Powder', 'g', '100', 70),
('Coriander Powder (Dhania)', ARRAY['dhania powder'], 'Spices - Powder', 'g', '100', 95),
('Cumin Powder (Jeera)', ARRAY['jeera powder'], 'Spices - Powder', 'g', '100', 90),
('Garam Masala', ARRAY['garam masala powder'], 'Spices - Powder', 'g', '100', 92),
('Chaat Masala', ARRAY['chat masala'], 'Spices - Powder', 'g', '50', 70),
('Amchur Powder (Dry Mango)', ARRAY['aamchoor','mango powder'], 'Spices - Powder', 'g', '50', 55),
('Sambhar Masala', ARRAY['sambar powder'], 'Spices - Powder', 'g', '100', 60),
('Pav Bhaji Masala', ARRAY['pav bhaji powder'], 'Spices - Powder', 'g', '100', 55),
('Biryani Masala', ARRAY['biryani powder'], 'Spices - Powder', 'g', '50', 55),
('Chana Masala Powder', ARRAY['chole masala'], 'Spices - Powder', 'g', '100', 60),
('Kitchen King Masala', ARRAY['kitchen king'], 'Spices - Powder', 'g', '100', 55),
('Meat Masala', ARRAY['non-veg masala'], 'Spices - Powder', 'g', '100', 45),
('Chicken Masala', ARRAY['chicken curry powder'], 'Spices - Powder', 'g', '100', 50),
('Fish Masala', ARRAY['fish curry powder'], 'Spices - Powder', 'g', '50', 35),
('Curry Powder', ARRAY['curry masala'], 'Spices - Powder', 'g', '100', 50),
('Black Pepper Powder', ARRAY['kali mirch powder'], 'Spices - Powder', 'g', '50', 65),
('Dry Ginger Powder (Sonth)', ARRAY['saunth','soonth'], 'Spices - Powder', 'g', '50', 45),
('Kasoori Methi (Dry Fenugreek)', ARRAY['dry methi leaves'], 'Spices - Powder', 'g', '25', 72),
('Black Salt (Kala Namak)', ARRAY['kala namak','rock salt'], 'Spices - Powder', 'g', '50', 55),
('Panch Phoron', ARRAY['bengali five spice'], 'Spices - Powder', 'g', '50', 30);

-- ============================================================
-- OILS & GHEE
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Mustard Oil (Sarson Ka Tel)', ARRAY['sarson oil','kachi ghani'], 'Oils & Ghee', 'L', '1', 85),
('Sunflower Oil', ARRAY['refined sunflower'], 'Oils & Ghee', 'L', '1', 88),
('Groundnut Oil (Peanut Oil)', ARRAY['moongphali tel'], 'Oils & Ghee', 'L', '1', 70),
('Coconut Oil', ARRAY['nariyal tel'], 'Oils & Ghee', 'L', '0.5', 72),
('Sesame Oil (Til Oil)', ARRAY['gingelly oil','til ka tel'], 'Oils & Ghee', 'mL', '200', 55),
('Ghee (Clarified Butter)', ARRAY['desi ghee'], 'Oils & Ghee', 'kg', '0.5', 90),
('Olive Oil', ARRAY['jaitun ka tel'], 'Oils & Ghee', 'L', '0.5', 50),
('Rice Bran Oil', ARRAY['rice bran'], 'Oils & Ghee', 'L', '1', 55),
('Vanaspati (Hydrogenated Oil)', ARRAY['dalda'], 'Oils & Ghee', 'kg', '0.5', 30),
('Castor Oil', ARRAY['arandi ka tel'], 'Oils & Ghee', 'mL', '100', 20);

-- ============================================================
-- DAIRY
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Milk (Full Cream)', ARRAY['doodh','full fat milk'], 'Dairy', 'L', '1', 99),
('Milk (Toned)', ARRAY['toned doodh'], 'Dairy', 'L', '1', 85),
('Curd (Dahi)', ARRAY['yogurt','dahi'], 'Dairy', 'kg', '0.5', 95),
('Paneer (Cottage Cheese)', ARRAY['paneer'], 'Dairy', 'g', '200', 88),
('Butter', ARRAY['makhan','amul butter'], 'Dairy', 'g', '100', 85),
('Cheese (Processed)', ARRAY['cheese slice','amul cheese'], 'Dairy', 'g', '200', 65),
('Cream (Fresh)', ARRAY['malai','heavy cream'], 'Dairy', 'mL', '200', 50),
('Buttermilk (Chaas)', ARRAY['mattha','chaas'], 'Dairy', 'L', '1', 60),
('Condensed Milk (Milkmaid)', ARRAY['milkmaid','mithai mate'], 'Dairy', 'g', '400', 50),
('Khoya (Mawa)', ARRAY['mawa','khoya'], 'Dairy', 'g', '250', 40),
('Milk Powder', ARRAY['doodh powder'], 'Dairy', 'g', '200', 35);

-- ============================================================
-- VEGETABLES
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Onions', ARRAY['pyaaz','kanda'], 'Vegetables', 'kg', '2', 99),
('Tomatoes', ARRAY['tamatar'], 'Vegetables', 'kg', '1', 99),
('Potatoes (Aloo)', ARRAY['aloo','batata'], 'Vegetables', 'kg', '2', 98),
('Green Chillies', ARRAY['hari mirch'], 'Vegetables', 'g', '100', 95),
('Ginger (Adrak)', ARRAY['adrak'], 'Vegetables', 'g', '100', 95),
('Garlic (Lehsun)', ARRAY['lahsun'], 'Vegetables', 'g', '100', 93),
('Coriander Leaves (Dhaniya)', ARRAY['hara dhania','cilantro'], 'Vegetables', 'bunch', '1', 92),
('Curry Leaves (Kadi Patta)', ARRAY['meetha neem'], 'Vegetables', 'bunch', '1', 80),
('Mint Leaves (Pudina)', ARRAY['pudina'], 'Vegetables', 'bunch', '1', 70),
('Spinach (Palak)', ARRAY['palak'], 'Vegetables', 'bunch', '1', 75),
('Cauliflower (Gobi)', ARRAY['phool gobi'], 'Vegetables', 'pcs', '1', 80),
('Cabbage (Patta Gobi)', ARRAY['band gobi'], 'Vegetables', 'pcs', '1', 65),
('Capsicum (Bell Pepper)', ARRAY['shimla mirch'], 'Vegetables', 'pcs', '2', 70),
('Okra (Bhindi)', ARRAY['lady finger','bhindi'], 'Vegetables', 'g', '250', 78),
('Brinjal (Baingan)', ARRAY['eggplant','aubergine'], 'Vegetables', 'g', '250', 70),
('Bottle Gourd (Lauki)', ARRAY['ghiya','doodhi'], 'Vegetables', 'pcs', '1', 65),
('Ridge Gourd (Turai)', ARRAY['tori','jhingni'], 'Vegetables', 'pcs', '2', 55),
('Bitter Gourd (Karela)', ARRAY['karela'], 'Vegetables', 'g', '250', 50),
('Drumstick (Moringa)', ARRAY['sahjan','murungai'], 'Vegetables', 'pcs', '3', 55),
('Peas (Matar)', ARRAY['hara matar','green peas'], 'Vegetables', 'kg', '0.5', 80),
('French Beans', ARRAY['beans'], 'Vegetables', 'g', '250', 60),
('Carrot (Gajar)', ARRAY['gajar'], 'Vegetables', 'kg', '0.5', 72),
('Radish (Mooli)', ARRAY['mooli'], 'Vegetables', 'pcs', '2', 50),
('Beetroot (Chukandar)', ARRAY['chukandar'], 'Vegetables', 'kg', '0.5', 50),
('Sweet Potato (Shakarkand)', ARRAY['shakarkandi'], 'Vegetables', 'kg', '0.5', 45),
('Raw Banana (Kaccha Kela)', ARRAY['kacha kela','plantain'], 'Vegetables', 'pcs', '4', 50),
('Lemon (Nimbu)', ARRAY['nimbu','lime'], 'Vegetables', 'pcs', '6', 88),
('Coconut (Nariyal)', ARRAY['fresh nariyal'], 'Vegetables', 'pcs', '1', 65),
('Mushroom', ARRAY['button mushroom'], 'Vegetables', 'g', '200', 50),
('Fenugreek Leaves (Methi)', ARRAY['methi saag'], 'Vegetables', 'bunch', '1', 65),
('Spring Onion', ARRAY['hara pyaaz'], 'Vegetables', 'bunch', '1', 45),
('Cucumber (Kheera)', ARRAY['kheera','kakdi'], 'Vegetables', 'pcs', '2', 60),
('Tinda (Apple Gourd)', ARRAY['tinda'], 'Vegetables', 'g', '250', 35),
('Parwal (Pointed Gourd)', ARRAY['parwal'], 'Vegetables', 'g', '250', 35),
('Arbi (Taro Root)', ARRAY['colocasia','arbi'], 'Vegetables', 'g', '250', 45),
('Yam (Suran/Jimikand)', ARRAY['jimikand','elephant yam'], 'Vegetables', 'kg', '0.5', 35),
('Jackfruit (Raw Kathal)', ARRAY['kathal','raw jackfruit'], 'Vegetables', 'kg', '0.5', 30),
('Ivy Gourd (Kundru)', ARRAY['tindora','tendli'], 'Vegetables', 'g', '250', 40),
('Cluster Beans (Gavar)', ARRAY['guvar phali','gawar'], 'Vegetables', 'g', '250', 45),
('Lotus Stem (Kamal Kakdi)', ARRAY['bhein','nadru'], 'Vegetables', 'g', '250', 30),
('Corn (Bhutta)', ARRAY['makai','sweet corn'], 'Vegetables', 'pcs', '4', 55),
('Banana Flower (Mocha)', ARRAY['vazhaipoo','kele ka phool'], 'Vegetables', 'pcs', '1', 25);

-- ============================================================
-- FRUITS
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Banana (Kela)', ARRAY['kela'], 'Fruits', 'dozen', '1', 95),
('Apple (Seb)', ARRAY['seb'], 'Fruits', 'kg', '1', 88),
('Mango (Aam)', ARRAY['aam'], 'Fruits', 'kg', '1', 85),
('Papaya', ARRAY['papita'], 'Fruits', 'pcs', '1', 65),
('Guava (Amrood)', ARRAY['amrud','peru'], 'Fruits', 'kg', '0.5', 65),
('Pomegranate (Anar)', ARRAY['anar'], 'Fruits', 'pcs', '2', 70),
('Grapes (Angoor)', ARRAY['angur'], 'Fruits', 'kg', '0.5', 65),
('Watermelon (Tarbooz)', ARRAY['tarbooj'], 'Fruits', 'pcs', '1', 60),
('Muskmelon (Kharbooja)', ARRAY['kharbooja'], 'Fruits', 'pcs', '1', 50),
('Orange (Santra)', ARRAY['santra','narangi'], 'Fruits', 'kg', '1', 75),
('Sweet Lime (Mosambi)', ARRAY['mousambi'], 'Fruits', 'kg', '1', 70),
('Chiku (Sapota)', ARRAY['sapodilla','chikoo'], 'Fruits', 'kg', '0.5', 55),
('Pineapple (Ananas)', ARRAY['ananas'], 'Fruits', 'pcs', '1', 55),
('Coconut Water', ARRAY['nariyal pani'], 'Fruits', 'pcs', '2', 60),
('Custard Apple (Sitaphal)', ARRAY['sharifa'], 'Fruits', 'kg', '0.5', 40),
('Litchi', ARRAY['lychee'], 'Fruits', 'kg', '0.5', 45),
('Pear (Nashpati)', ARRAY['nashpati'], 'Fruits', 'kg', '0.5', 45),
('Jackfruit (Ripe)', ARRAY['paka kathal'], 'Fruits', 'kg', '1', 30);

-- ============================================================
-- DRY FRUITS & NUTS
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Cashews (Kaju)', ARRAY['kaju'], 'Dry Fruits & Nuts', 'g', '250', 90),
('Almonds (Badam)', ARRAY['badam'], 'Dry Fruits & Nuts', 'g', '250', 90),
('Walnuts (Akhrot)', ARRAY['akhrot'], 'Dry Fruits & Nuts', 'g', '250', 70),
('Pistachios (Pista)', ARRAY['pista'], 'Dry Fruits & Nuts', 'g', '250', 65),
('Raisins (Kishmish)', ARRAY['kishmish','munakka'], 'Dry Fruits & Nuts', 'g', '250', 80),
('Dates (Khajoor)', ARRAY['khajur','chhuhara'], 'Dry Fruits & Nuts', 'g', '250', 70),
('Dried Figs (Anjeer)', ARRAY['anjeer'], 'Dry Fruits & Nuts', 'g', '200', 50),
('Fox Nuts (Makhana)', ARRAY['phool makhana','lotus seeds'], 'Dry Fruits & Nuts', 'g', '200', 65),
('Dry Coconut (Copra)', ARRAY['copra','sukha nariyal'], 'Dry Fruits & Nuts', 'g', '200', 45),
('Apricots (Khubani)', ARRAY['jardalu','khubani'], 'Dry Fruits & Nuts', 'g', '200', 35),
('Charoli (Chironji)', ARRAY['chironji'], 'Dry Fruits & Nuts', 'g', '50', 30),
('Flax Seeds (Alsi)', ARRAY['alsi','linseed'], 'Dry Fruits & Nuts', 'g', '200', 55),
('Chia Seeds', ARRAY['chia'], 'Dry Fruits & Nuts', 'g', '200', 50),
('Pumpkin Seeds', ARRAY['kaddu ke beej'], 'Dry Fruits & Nuts', 'g', '200', 45),
('Sunflower Seeds', ARRAY['surajmukhi beej'], 'Dry Fruits & Nuts', 'g', '200', 40),
('Mixed Dry Fruits', ARRAY['meva mix'], 'Dry Fruits & Nuts', 'g', '500', 60),
('Pine Nuts (Chilgoza)', ARRAY['chilgoza'], 'Dry Fruits & Nuts', 'g', '50', 20);

-- ============================================================
-- BEVERAGES
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Tea (Chai Patti)', ARRAY['chai','assam tea','CTC tea'], 'Beverages', 'g', '250', 98),
('Green Tea', ARRAY['green chai','herbal tea'], 'Beverages', 'g', '100', 55),
('Coffee Powder', ARRAY['filter coffee','instant coffee'], 'Beverages', 'g', '200', 75),
('Bournvita / Horlicks', ARRAY['health drink','malt'], 'Beverages', 'g', '500', 65),
('Rooh Afza', ARRAY['rooh afza','sharbat'], 'Beverages', 'mL', '750', 50),
('Lemon Juice (Packaged)', ARRAY['real lemon','nimbu pani'], 'Beverages', 'mL', '500', 40),
('Mango Juice (Frooti/Maaza)', ARRAY['frooti','maaza','slice'], 'Beverages', 'mL', '1000', 60),
('Coconut Water (Packaged)', ARRAY['packaged nariyal pani'], 'Beverages', 'mL', '1000', 45),
('Glucose (Glucon-D)', ARRAY['glucose powder'], 'Beverages', 'g', '500', 45),
('Elaichi Powder (for Tea)', ARRAY['cardamom tea mix'], 'Beverages', 'g', '50', 40),
('Soda Water', ARRAY['club soda'], 'Beverages', 'L', '1', 30),
('Mineral Water', ARRAY['packaged water'], 'Beverages', 'L', '5', 50),
('Jaljeera Mix', ARRAY['jaljeera powder'], 'Beverages', 'g', '100', 40);

-- ============================================================
-- SNACKS & NAMKEEN
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Biscuits', ARRAY['parle-g','marie','cookies'], 'Snacks', 'pkt', '2', 90),
('Maggi Noodles', ARRAY['instant noodles','maggi'], 'Snacks', 'pkt', '4', 88),
('Papad (Lentil Crackers)', ARRAY['papad','appalam'], 'Snacks', 'pkt', '1', 80),
('Namkeen (Bhujia)', ARRAY['haldiram bhujia','sev'], 'Snacks', 'g', '200', 75),
('Chips (Potato)', ARRAY['aloo chips','lays','kurkure'], 'Snacks', 'pkt', '2', 70),
('Murmura (Puffed Rice Snack)', ARRAY['bhel mix','jhal muri'], 'Snacks', 'g', '200', 45),
('Mathri', ARRAY['matthi','namak pare'], 'Snacks', 'g', '250', 40),
('Mixture (South Indian)', ARRAY['kerala mixture','madras mix'], 'Snacks', 'g', '200', 50),
('Rusk (Toast)', ARRAY['suji rusk'], 'Snacks', 'pkt', '1', 55),
('Cake (Packaged)', ARRAY['muffin','plum cake'], 'Snacks', 'pkt', '1', 40),
('Khakhra', ARRAY['gujarati khakra'], 'Snacks', 'pkt', '1', 45),
('Thepla (Packaged)', ARRAY['ready thepla'], 'Snacks', 'pkt', '1', 35),
('Fryums (Ready to Fry)', ARRAY['papad fryums','wheels'], 'Snacks', 'g', '200', 45),
('Popcorn Kernels', ARRAY['makka dana','popcorn'], 'Snacks', 'g', '200', 35),
('Makhana (Roasted)', ARRAY['foxnut snack','roasted makhana'], 'Snacks', 'g', '100', 50);

-- ============================================================
-- PICKLES, CHUTNEYS & PRESERVES
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Mango Pickle (Aam ka Achar)', ARRAY['aam ka achar','avakaya'], 'Pickles & Preserves', 'g', '400', 85),
('Lime Pickle (Nimbu Achar)', ARRAY['nimbu ka achar','lemon pickle'], 'Pickles & Preserves', 'g', '300', 65),
('Mixed Pickle', ARRAY['mixed achar'], 'Pickles & Preserves', 'g', '400', 70),
('Garlic Pickle (Lehsun Achar)', ARRAY['lahsun ka achar'], 'Pickles & Preserves', 'g', '300', 50),
('Green Chilli Pickle', ARRAY['mirchi ka achar'], 'Pickles & Preserves', 'g', '300', 50),
('Tamarind Paste (Imli)', ARRAY['imli paste'], 'Pickles & Preserves', 'g', '200', 65),
('Tomato Ketchup', ARRAY['sauce','ketchup'], 'Pickles & Preserves', 'g', '500', 75),
('Green Chutney (Packaged)', ARRAY['mint chutney','pudina chutney'], 'Pickles & Preserves', 'g', '200', 40),
('Jam (Mixed Fruit)', ARRAY['fruit jam','kissan'], 'Pickles & Preserves', 'g', '500', 60),
('Honey (Shahad)', ARRAY['madhu','shahad'], 'Pickles & Preserves', 'g', '500', 65),
('Murabba (Amla/Apple)', ARRAY['amla murabba','apple murabba'], 'Pickles & Preserves', 'g', '500', 30);

-- ============================================================
-- SWEETENERS & BAKING
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Sugar (Cheeni)', ARRAY['cheeni','shakkar'], 'Sweeteners & Baking', 'kg', '2', 98),
('Jaggery (Gud)', ARRAY['gur','bellam','vellam'], 'Sweeteners & Baking', 'kg', '0.5', 75),
('Jaggery Powder', ARRAY['gud powder'], 'Sweeteners & Baking', 'g', '500', 50),
('Mishri (Rock Sugar)', ARRAY['patasa','rock candy'], 'Sweeteners & Baking', 'g', '250', 35),
('Salt (Namak)', ARRAY['iodized salt','tata namak'], 'Sweeteners & Baking', 'kg', '1', 99),
('Baking Soda', ARRAY['meetha soda','cooking soda'], 'Sweeteners & Baking', 'g', '100', 55),
('Baking Powder', ARRAY['baking powder'], 'Sweeteners & Baking', 'g', '100', 50),
('Yeast (Instant)', ARRAY['khameer'], 'Sweeteners & Baking', 'g', '50', 30),
('Cocoa Powder', ARRAY['chocolate powder'], 'Sweeteners & Baking', 'g', '100', 40),
('Custard Powder', ARRAY['custard'], 'Sweeteners & Baking', 'g', '100', 40),
('Vanilla Essence', ARRAY['vanilla extract'], 'Sweeteners & Baking', 'mL', '25', 35),
('Food Colour (Set)', ARRAY['rang'], 'Sweeteners & Baking', 'mL', '20', 20),
('Agar-Agar (China Grass)', ARRAY['china grass'], 'Sweeteners & Baking', 'g', '25', 20),
('Corn Starch', ARRAY['corn flour thickener'], 'Sweeteners & Baking', 'g', '200', 50);

-- ============================================================
-- FROZEN FOODS
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Frozen Peas', ARRAY['matar','green peas frozen'], 'Frozen', 'g', '500', 85),
('Frozen Mixed Vegetables', ARRAY['mix veg'], 'Frozen', 'g', '500', 70),
('Frozen Sweet Corn', ARRAY['corn kernels'], 'Frozen', 'g', '500', 60),
('Frozen Parathas', ARRAY['ready paratha'], 'Frozen', 'pkt', '1', 65),
('Frozen Samosas', ARRAY['ready samosa'], 'Frozen', 'pkt', '1', 50),
('Frozen Chapati', ARRAY['ready roti'], 'Frozen', 'pkt', '1', 45),
('Ice Cream', ARRAY['kulfi','ice cream'], 'Frozen', 'L', '1', 70),
('Frozen Paneer Tikka', ARRAY['paneer tikka'], 'Frozen', 'pkt', '1', 35),
('Frozen French Fries', ARRAY['fries','finger chips'], 'Frozen', 'g', '500', 55);

-- ============================================================
-- BAKERY & BREAD
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Bread (White/Brown)', ARRAY['bread loaf','sandwich bread'], 'Bakery', 'pkt', '1', 88),
('Pav (Dinner Rolls)', ARRAY['ladi pav'], 'Bakery', 'pkt', '1', 70),
('Butter Naan (Packaged)', ARRAY['tandoori naan'], 'Bakery', 'pkt', '1', 40),
('Pizza Base', ARRAY['pizza bread'], 'Bakery', 'pkt', '1', 35),
('Tortilla / Wrap', ARRAY['wrap bread','roti wrap'], 'Bakery', 'pkt', '1', 30),
('Breadsticks', ARRAY['grissini'], 'Bakery', 'pkt', '1', 20);

-- ============================================================
-- HOUSEHOLD
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Dish Soap (Vim/Pril)', ARRAY['bartan soap','dishwash bar'], 'Household', 'pcs', '1', 92),
('Dishwash Liquid', ARRAY['vim liquid','pril'], 'Household', 'mL', '500', 80),
('Detergent Powder (Surf/Tide)', ARRAY['washing powder','kapde ka sabun'], 'Household', 'kg', '1', 90),
('Liquid Detergent', ARRAY['liquid surf','ariel liquid'], 'Household', 'mL', '1000', 60),
('Floor Cleaner (Lizol)', ARRAY['phenyl','lizol'], 'Household', 'mL', '500', 82),
('Toilet Cleaner (Harpic)', ARRAY['harpic','washroom cleaner'], 'Household', 'mL', '500', 80),
('Glass Cleaner (Colin)', ARRAY['colin','window cleaner'], 'Household', 'mL', '500', 50),
('Dustbin Bags', ARRAY['garbage bags','kachra bags'], 'Household', 'pkt', '1', 75),
('Scrubber (Steel/Sponge)', ARRAY['scotch brite','bartan scrubber'], 'Household', 'pcs', '2', 72),
('Broom (Jhaadu)', ARRAY['jhaadu','phool jhaadu'], 'Household', 'pcs', '1', 40),
('Mop (Pocha)', ARRAY['floor mop','pocha'], 'Household', 'pcs', '1', 35),
('Naphthalene Balls', ARRAY['moth balls'], 'Household', 'pkt', '1', 40),
('Room Freshener', ARRAY['air freshener','odonil'], 'Household', 'pcs', '1', 50),
('Mosquito Repellent', ARRAY['all out','good knight','coil'], 'Household', 'pcs', '1', 70),
('Matchbox / Lighter', ARRAY['matchstick','dibbi'], 'Household', 'pkt', '1', 60),
('Aluminium Foil', ARRAY['foil paper'], 'Household', 'roll', '1', 55),
('Cling Wrap', ARRAY['food wrap','plastic wrap'], 'Household', 'roll', '1', 45),
('Paper Towels / Tissues', ARRAY['kitchen roll','tissue paper'], 'Household', 'pkt', '1', 65),
('Steel Wool', ARRAY['juna','steel juna'], 'Household', 'pkt', '1', 40),
('Hand Wash (Liquid)', ARRAY['dettol handwash'], 'Household', 'mL', '250', 78),
('Sanitizer', ARRAY['hand sanitizer'], 'Household', 'mL', '200', 55);

-- ============================================================
-- PERSONAL CARE
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Bathing Soap', ARRAY['nahane ka sabun','body soap'], 'Personal Care', 'pcs', '3', 92),
('Shampoo', ARRAY['baal ka shampoo'], 'Personal Care', 'mL', '200', 85),
('Conditioner', ARRAY['hair conditioner'], 'Personal Care', 'mL', '200', 50),
('Hair Oil (Coconut/Amla)', ARRAY['nariyal tel','baal ka tel'], 'Personal Care', 'mL', '200', 75),
('Toothpaste', ARRAY['colgate','dant manjan'], 'Personal Care', 'g', '100', 95),
('Toothbrush', ARRAY['dant ka brush'], 'Personal Care', 'pcs', '2', 80),
('Face Wash', ARRAY['face cleanser'], 'Personal Care', 'mL', '100', 60),
('Body Lotion', ARRAY['moisturizer'], 'Personal Care', 'mL', '200', 50),
('Sunscreen', ARRAY['sunblock'], 'Personal Care', 'mL', '50', 40),
('Deodorant', ARRAY['deo','perfume spray'], 'Personal Care', 'pcs', '1', 55),
('Razor / Blades', ARRAY['shaving razor'], 'Personal Care', 'pkt', '1', 50),
('Shaving Cream / Foam', ARRAY['shaving gel'], 'Personal Care', 'g', '70', 45),
('Cotton (Rui)', ARRAY['cotton balls','surgical cotton'], 'Personal Care', 'g', '100', 40),
('Sanitary Pads', ARRAY['pads','whisper','stayfree'], 'Personal Care', 'pkt', '1', 70),
('Comb', ARRAY['kanghi'], 'Personal Care', 'pcs', '1', 30),
('Nail Cutter', ARRAY['nail clipper'], 'Personal Care', 'pcs', '1', 20),
('Talcum Powder', ARRAY['body powder','ponds'], 'Personal Care', 'g', '100', 40),
('Petroleum Jelly (Vaseline)', ARRAY['vaseline'], 'Personal Care', 'g', '50', 35),
('Kajal / Eyeliner', ARRAY['surma','kajal'], 'Personal Care', 'pcs', '1', 40),
('Lip Balm', ARRAY['lip care'], 'Personal Care', 'pcs', '1', 30);

-- ============================================================
-- BABY CARE
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Diapers', ARRAY['nappies','pampers','huggies'], 'Baby Care', 'pkt', '1', 80),
('Baby Wipes', ARRAY['wet wipes','baby wet tissue'], 'Baby Care', 'pkt', '1', 70),
('Baby Powder', ARRAY['johnson baby powder'], 'Baby Care', 'g', '200', 55),
('Baby Soap / Wash', ARRAY['baby bath','baby shampoo'], 'Baby Care', 'mL', '200', 60),
('Baby Cereal (Cerelac)', ARRAY['cerelac','baby food'], 'Baby Care', 'g', '300', 55),
('Baby Oil', ARRAY['johnson oil'], 'Baby Care', 'mL', '200', 50),
('Feeding Bottle', ARRAY['milk bottle','sipper'], 'Baby Care', 'pcs', '1', 40),
('Rash Cream', ARRAY['diaper cream'], 'Baby Care', 'g', '50', 45);

-- ============================================================
-- POOJA & MISCELLANEOUS
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Agarbatti (Incense Sticks)', ARRAY['dhoop','incense'], 'Pooja & Misc', 'pkt', '1', 75),
('Camphor (Kapoor)', ARRAY['kapur'], 'Pooja & Misc', 'g', '50', 65),
('Diya Oil (Pooja Tel)', ARRAY['deepak oil','sesame oil for pooja'], 'Pooja & Misc', 'mL', '200', 55),
('Cotton Wicks (Batti)', ARRAY['diya batti'], 'Pooja & Misc', 'pkt', '1', 55),
('Sindoor / Kumkum', ARRAY['roli','kumkum'], 'Pooja & Misc', 'g', '25', 40),
('Haldi Sticks (for Pooja)', ARRAY['pooja haldi'], 'Pooja & Misc', 'pcs', '2', 30),
('Coconut (for Pooja)', ARRAY['nariyal','pooja nariyal'], 'Pooja & Misc', 'pcs', '1', 45),
('Supari (Betel Nut)', ARRAY['areca nut'], 'Pooja & Misc', 'g', '50', 35),
('Paan Leaves (Betel)', ARRAY['betel leaf'], 'Pooja & Misc', 'pcs', '5', 30),
('Gulal / Rang', ARRAY['holi colour'], 'Pooja & Misc', 'g', '100', 20);

-- ============================================================
-- MEAT & SEAFOOD
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Chicken (Whole)', ARRAY['murga','broiler'], 'Meat & Seafood', 'kg', '1', 85),
('Chicken (Boneless)', ARRAY['chicken breast','tikka cut'], 'Meat & Seafood', 'kg', '0.5', 80),
('Chicken (Curry Cut)', ARRAY['chicken pieces'], 'Meat & Seafood', 'kg', '1', 82),
('Mutton (Goat Meat)', ARRAY['bakra','gosht'], 'Meat & Seafood', 'kg', '0.5', 75),
('Fish (Rohu)', ARRAY['rohu','rui'], 'Meat & Seafood', 'kg', '1', 65),
('Fish (Pomfret)', ARRAY['paplet','pomfret'], 'Meat & Seafood', 'kg', '0.5', 55),
('Prawns (Jhinga)', ARRAY['shrimp','jheenga'], 'Meat & Seafood', 'kg', '0.5', 55),
('Eggs (Anda)', ARRAY['murgi ka anda','hen eggs'], 'Meat & Seafood', 'dozen', '1', 92),
('Keema (Mince)', ARRAY['mutton mince','chicken mince'], 'Meat & Seafood', 'kg', '0.5', 55),
('Fish (Surmai / King Fish)', ARRAY['surmai','king mackerel'], 'Meat & Seafood', 'kg', '0.5', 45),
('Crab (Kekda)', ARRAY['kekda'], 'Meat & Seafood', 'kg', '0.5', 30);

-- ============================================================
-- CONDIMENTS & SAUCES
-- ============================================================
INSERT INTO master_items (name, aliases, category, unit, default_quantity, popular_score) VALUES
('Soy Sauce', ARRAY['soya sauce'], 'Condiments', 'mL', '200', 50),
('Vinegar', ARRAY['sirka','white vinegar'], 'Condiments', 'mL', '200', 55),
('Chilli Sauce (Schezwan)', ARRAY['schezwan sauce','hot sauce'], 'Condiments', 'mL', '200', 55),
('Mayonnaise', ARRAY['mayo'], 'Condiments', 'g', '250', 45),
('Mustard Sauce (Kasundi)', ARRAY['kasundi','mustard paste'], 'Condiments', 'g', '200', 35),
('Worcestershire Sauce', ARRAY['english sauce'], 'Condiments', 'mL', '200', 25),
('Peanut Butter', ARRAY['peanut spread'], 'Condiments', 'g', '250', 45),
('Ghee Tadka (Ready)', ARRAY['tadka ghee'], 'Condiments', 'mL', '200', 30);

-- ============================================================
-- Done! Total: ~328 items across 18 categories
-- ============================================================
