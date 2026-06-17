const { createClient } = require('@supabase/supabase-js');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Family-Id'
};

function getSupabase(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

function getAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
  );
}

function resp(statusCode, data) {
  return { statusCode, headers, body: JSON.stringify(data) };
}

const DEFAULT_ITEMS = [
  {name:'Rice (Basmati)',category:'Produce',quantity:5},{name:'Wheat Flour (Atta)',category:'Produce',quantity:5},
  {name:'Toor Dal',category:'Produce',quantity:1},{name:'Moong Dal',category:'Produce',quantity:1},
  {name:'Chana Dal',category:'Produce',quantity:1},{name:'Urad Dal',category:'Produce',quantity:1},
  {name:'Masoor Dal',category:'Produce',quantity:1},{name:'Rajma',category:'Produce',quantity:1},
  {name:'Chole (Chickpeas)',category:'Produce',quantity:1},{name:'Poha',category:'Produce',quantity:1},
  {name:'Suji (Semolina)',category:'Produce',quantity:1},{name:'Besan (Gram Flour)',category:'Produce',quantity:1},
  {name:'Onions',category:'Produce',quantity:2},{name:'Tomatoes',category:'Produce',quantity:1},
  {name:'Potatoes',category:'Produce',quantity:2},{name:'Green Chillies',category:'Produce',quantity:1},
  {name:'Ginger',category:'Produce',quantity:1},{name:'Garlic',category:'Produce',quantity:1},
  {name:'Coriander Leaves',category:'Produce',quantity:1},{name:'Curry Leaves',category:'Produce',quantity:1},
  {name:'Spinach (Palak)',category:'Produce',quantity:1},{name:'Cauliflower',category:'Produce',quantity:1},
  {name:'Capsicum',category:'Produce',quantity:1},{name:'Okra (Bhindi)',category:'Produce',quantity:1},
  {name:'Milk',category:'Dairy',quantity:2},{name:'Curd (Dahi)',category:'Dairy',quantity:1},
  {name:'Paneer',category:'Dairy',quantity:1},{name:'Butter',category:'Dairy',quantity:1},{name:'Ghee',category:'Dairy',quantity:1},
  {name:'Turmeric Powder (Haldi)',category:'Other',quantity:1},{name:'Red Chilli Powder',category:'Other',quantity:1},
  {name:'Coriander Powder',category:'Other',quantity:1},{name:'Cumin Powder (Jeera)',category:'Other',quantity:1},
  {name:'Garam Masala',category:'Other',quantity:1},{name:'Cumin Seeds',category:'Other',quantity:1},
  {name:'Mustard Seeds',category:'Other',quantity:1},{name:'Hing (Asafoetida)',category:'Other',quantity:1},
  {name:'Salt',category:'Other',quantity:1},{name:'Sugar',category:'Other',quantity:1},
  {name:'Mustard Oil',category:'Other',quantity:1},{name:'Sunflower Oil',category:'Other',quantity:1},
  {name:'Tamarind (Imli)',category:'Other',quantity:1},{name:'Jaggery (Gud)',category:'Other',quantity:1},
  {name:'Tea (Chai Patti)',category:'Beverages',quantity:1},{name:'Coffee Powder',category:'Beverages',quantity:1},
  {name:'Biscuits',category:'Snacks',quantity:2},{name:'Maggi Noodles',category:'Snacks',quantity:4},
  {name:'Papad',category:'Snacks',quantity:1},{name:'Pickle (Achar)',category:'Snacks',quantity:1},
  {name:'Cashews (Kaju)',category:'Snacks',quantity:1},{name:'Almonds (Badam)',category:'Snacks',quantity:1},
  {name:'Bread',category:'Bakery',quantity:1},{name:'Peas',category:'Frozen',quantity:1},
  {name:'Dish Soap (Vim)',category:'Household',quantity:1},{name:'Detergent',category:'Household',quantity:1},
  {name:'Floor Cleaner',category:'Household',quantity:1},{name:'Dustbin Bags',category:'Household',quantity:1},
  {name:'Soap',category:'Personal Care',quantity:2},{name:'Shampoo',category:'Personal Care',quantity:1},
  {name:'Toothpaste',category:'Personal Care',quantity:1}
];

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api/', '').replace('/api/', '');
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : null;

  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) return resp(401, { error: 'Unauthorized' });

  const supabase = getSupabase(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return resp(401, { error: 'Invalid token' });

  // Active family from header (sent by frontend when user switches family)
  const requestedFamilyId = event.headers['x-family-id'];

  try {

    // GET /auth/me — returns user + all families they belong to
    if (path === 'auth/me' && method === 'GET') {
      const { data: memberships } = await getAdmin()
        .from('family_members')
        .select('display_name, role, family_id, families(id, name, invite_code)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true });
      return resp(200, { user: { id: user.id, email: user.email }, memberships: memberships || [] });
    }

    // POST /auth/family/create
    if (path === 'auth/family/create' && method === 'POST') {
      const admin = getAdmin();
      const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: family, error: fErr } = await admin.from('families')
        .insert({ name: body.family_name, invite_code, created_by: user.id }).select().single();
      if (fErr) throw fErr;

      const { error: mErr } = await admin.from('family_members')
        .insert({ family_id: family.id, user_id: user.id, display_name: body.display_name, role: 'admin' });
      if (mErr) throw mErr;

      const rows = DEFAULT_ITEMS.map((it, i) => ({
        ...it, family_id: family.id, in_stock: true, sort_order: i + 1, added_by: body.display_name
      }));
      await admin.from('items').insert(rows);

      return resp(201, { family });
    }

    // POST /auth/family/join
    if (path === 'auth/family/join' && method === 'POST') {
      const admin = getAdmin();
      const { data: family, error: fErr } = await admin.from('families')
        .select('id, name, invite_code').eq('invite_code', body.invite_code.toUpperCase()).single();
      if (fErr || !family) return resp(404, { error: 'Invalid invite code' });

      const { data: existing } = await admin.from('family_members')
        .select('id').eq('family_id', family.id).eq('user_id', user.id).single();
      if (existing) return resp(400, { error: 'Already a member' });

      const { error: mErr } = await admin.from('family_members')
        .insert({ family_id: family.id, user_id: user.id, display_name: body.display_name, role: 'member' });
      if (mErr) throw mErr;

      return resp(200, { family });
    }

    // GET /auth/family/members
    if (path === 'auth/family/members' && method === 'GET') {
      const fid = requestedFamilyId;
      if (!fid) return resp(400, { error: 'X-Family-Id header required' });
      const { data, error } = await getAdmin().from('family_members')
        .select('display_name, role, joined_at').eq('family_id', fid).order('joined_at');
      if (error) throw error;
      return resp(200, data);
    }

    // ── ITEMS — resolve active family ────────────────────────────────
    const { data: allMemberships } = await getAdmin().from('family_members')
      .select('family_id, display_name').eq('user_id', user.id).order('joined_at', { ascending: true });

    if (!allMemberships || allMemberships.length === 0)
      return resp(403, { error: 'Not in a family' });

    // Use requested family if user is a member, else fall back to first
    const activeMembership = requestedFamilyId
      ? allMemberships.find(m => m.family_id === requestedFamilyId) || allMemberships[0]
      : allMemberships[0];

    const family_id = activeMembership.family_id;
    const display_name = activeMembership.display_name;

    // GET /items
    if (path === 'items' && method === 'GET') {
      const { data, error } = await getAdmin().from('items').select('*')
        .eq('family_id', family_id).order('sort_order', { ascending: true });
      if (error) throw error;
      return resp(200, data);
    }

    // POST /items
    if (path === 'items' && method === 'POST') {
      // Check for duplicate (case-insensitive)
      const { data: existing } = await getAdmin().from('items')
        .select('*').eq('family_id', family_id).ilike('name', body.name.trim()).limit(1);
      if (existing && existing.length > 0) {
        const item = existing[0];
        const newQty = item.quantity + (body.quantity || 1);
        const { data, error } = await getAdmin().from('items')
          .update({ quantity: newQty, in_stock: true }).eq('id', item.id).select();
        if (error) throw error;
        return resp(200, { ...data[0], merged: true });
      }
      const { data: max } = await getAdmin().from('items').select('sort_order')
        .eq('family_id', family_id).order('sort_order', { ascending: false }).limit(1);
      const nextOrder = (max && max.length > 0 ? max[0].sort_order : 0) + 1;
      const { data, error } = await getAdmin().from('items').insert({
        name: body.name.trim(), category: body.category || 'Other', quantity: body.quantity || 1,
        in_stock: true, sort_order: nextOrder, family_id, added_by: display_name,
        note: body.note || null
      }).select();
      if (error) throw error;
      return resp(201, data[0]);
    }

    // POST /items/bulk
    if (path === 'items/bulk' && method === 'POST') {
      const { data: max } = await getAdmin().from('items').select('sort_order')
        .eq('family_id', family_id).order('sort_order', { ascending: false }).limit(1);
      let nextOrder = (max && max.length > 0 ? max[0].sort_order : 0) + 1;
      const lines = body.items.split('\n').map(l => l.trim().replace(/^-\s*/, '')).filter(Boolean);
      const rows = lines.map(name => ({
        name, category: body.category || 'Other', quantity: 1,
        in_stock: true, sort_order: nextOrder++, family_id, added_by: display_name
      }));
      const { data, error } = await getAdmin().from('items').insert(rows).select();
      if (error) throw error;
      return resp(201, data);
    }

    // PUT /items/:id
    const putMatch = path.match(/^items\/(\d+)$/);
    if (putMatch && method === 'PUT') {
      const id = parseInt(putMatch[1]);
      const updates = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.category !== undefined) updates.category = body.category;
      if (body.quantity !== undefined) updates.quantity = body.quantity;
      if (body.in_stock !== undefined) updates.in_stock = body.in_stock;
      if (body.note !== undefined) updates.note = body.note;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
      const { data, error } = await getAdmin().from('items').update(updates)
        .eq('id', id).eq('family_id', family_id).select();
      if (error) throw error;
      return resp(200, data[0]);
    }

    // POST /items/:id/toggle
    const toggleMatch = path.match(/^items\/(\d+)\/toggle$/);
    if (toggleMatch && method === 'POST') {
      const id = parseInt(toggleMatch[1]);
      const { data: item } = await getAdmin().from('items').select('in_stock')
        .eq('id', id).eq('family_id', family_id).single();
      const { data, error } = await getAdmin().from('items').update({ in_stock: !item.in_stock })
        .eq('id', id).eq('family_id', family_id).select();
      if (error) throw error;
      return resp(200, data[0]);
    }

    // DELETE /items/:id
    const delMatch = path.match(/^items\/(\d+)$/);
    if (delMatch && method === 'DELETE') {
      const id = parseInt(delMatch[1]);
      const { error } = await getAdmin().from('items').delete().eq('id', id).eq('family_id', family_id);
      if (error) throw error;
      return resp(200, { success: true });
    }

    // POST /items/bulk-restock
    if (path === 'items/bulk-restock' && method === 'POST') {
      const { error } = await getAdmin().from('items').update({ in_stock: true })
        .in('id', body.ids).eq('family_id', family_id);
      if (error) throw error;
      return resp(200, { success: true });
    }

    return resp(404, { error: 'Not found' });

  } catch (err) {
    return resp(500, { error: err.message });
  }
};
