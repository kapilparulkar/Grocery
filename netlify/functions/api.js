const { createClient } = require('@supabase/supabase-js');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

function getSupabase(token) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

// Admin client for operations that bypass RLS (e.g. checking invite codes)
const adminSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function resp(statusCode, data) {
  return { statusCode, headers, body: JSON.stringify(data) };
}

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api/', '').replace('/api/', '');
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : null;

  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // Extract auth token
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) return resp(401, { error: 'Unauthorized' });

  const supabase = getSupabase(token);

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return resp(401, { error: 'Invalid token' });

  try {

    // ── AUTH / FAMILY ENDPOINTS ──────────────────────────────────────

    // GET /auth/me — get user + family info
    if (path === 'auth/me' && method === 'GET') {
      const { data: member } = await supabase
        .from('family_members')
        .select('display_name, role, family_id, families(id, name, invite_code)')
        .eq('user_id', user.id)
        .single();
      return resp(200, { user: { id: user.id, email: user.email }, member });
    }

    // POST /auth/family/create — create a new family
    if (path === 'auth/family/create' && method === 'POST') {
      const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: family, error: fErr } = await supabase
        .from('families')
        .insert({ name: body.family_name, invite_code, created_by: user.id })
        .select().single();
      if (fErr) throw fErr;

      const { error: mErr } = await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: user.id, display_name: body.display_name, role: 'admin' });
      if (mErr) throw mErr;

      return resp(201, { family });
    }

    // POST /auth/family/join — join via invite code
    if (path === 'auth/family/join' && method === 'POST') {
      // Use admin client to find family by invite code (bypasses RLS)
      const { data: family, error: fErr } = await adminSupabase
        .from('families')
        .select('id, name, invite_code')
        .eq('invite_code', body.invite_code.toUpperCase())
        .single();
      if (fErr || !family) return resp(404, { error: 'Invalid invite code' });

      // Check not already a member
      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .single();
      if (existing) return resp(400, { error: 'Already a member' });

      const { error: mErr } = await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: user.id, display_name: body.display_name, role: 'member' });
      if (mErr) throw mErr;

      return resp(200, { family });
    }

    // GET /auth/family/members — list family members
    if (path === 'auth/family/members' && method === 'GET') {
      const { data: me } = await supabase
        .from('family_members').select('family_id').eq('user_id', user.id).single();
      if (!me) return resp(404, { error: 'Not in a family' });

      const { data, error } = await supabase
        .from('family_members')
        .select('display_name, role, joined_at')
        .eq('family_id', me.family_id)
        .order('joined_at');
      if (error) throw error;
      return resp(200, data);
    }

    // ── ITEMS ENDPOINTS ──────────────────────────────────────────────

    // Get current user's family_id for all item operations
    const { data: memberData } = await supabase
      .from('family_members').select('family_id, display_name').eq('user_id', user.id).single();
    if (!memberData) return resp(403, { error: 'Not in a family' });

    const family_id = memberData.family_id;
    const display_name = memberData.display_name;

    // GET /items
    if (path === 'items' && method === 'GET') {
      const { data, error } = await supabase
        .from('items').select('*')
        .eq('family_id', family_id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return resp(200, data);
    }

    // POST /items
    if (path === 'items' && method === 'POST') {
      const { data: max } = await supabase.from('items').select('sort_order')
        .eq('family_id', family_id).order('sort_order', { ascending: false }).limit(1);
      const nextOrder = (max && max.length > 0 ? max[0].sort_order : 0) + 1;
      const { data, error } = await supabase.from('items').insert({
        name: body.name, category: body.category || 'Other',
        quantity: body.quantity || 1, in_stock: true,
        sort_order: nextOrder, family_id, added_by: display_name
      }).select();
      if (error) throw error;
      return resp(201, data[0]);
    }

    // POST /items/bulk
    if (path === 'items/bulk' && method === 'POST') {
      const { data: max } = await supabase.from('items').select('sort_order')
        .eq('family_id', family_id).order('sort_order', { ascending: false }).limit(1);
      let nextOrder = (max && max.length > 0 ? max[0].sort_order : 0) + 1;
      const lines = body.items.split('\n').map(l => l.trim().replace(/^-\s*/, '')).filter(Boolean);
      const rows = lines.map(name => ({
        name, category: body.category || 'Other', quantity: 1,
        in_stock: true, sort_order: nextOrder++, family_id, added_by: display_name
      }));
      const { data, error } = await supabase.from('items').insert(rows).select();
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
      const { data, error } = await supabase.from('items').update(updates)
        .eq('id', id).eq('family_id', family_id).select();
      if (error) throw error;
      return resp(200, data[0]);
    }

    // POST /items/:id/toggle
    const toggleMatch = path.match(/^items\/(\d+)\/toggle$/);
    if (toggleMatch && method === 'POST') {
      const id = parseInt(toggleMatch[1]);
      const { data: item } = await supabase.from('items').select('in_stock')
        .eq('id', id).eq('family_id', family_id).single();
      const { data, error } = await supabase.from('items').update({ in_stock: !item.in_stock })
        .eq('id', id).eq('family_id', family_id).select();
      if (error) throw error;
      return resp(200, data[0]);
    }

    // DELETE /items/:id
    const delMatch = path.match(/^items\/(\d+)$/);
    if (delMatch && method === 'DELETE') {
      const id = parseInt(delMatch[1]);
      const { error } = await supabase.from('items').delete()
        .eq('id', id).eq('family_id', family_id);
      if (error) throw error;
      return resp(200, { success: true });
    }

    // POST /items/bulk-restock
    if (path === 'items/bulk-restock' && method === 'POST') {
      const { error } = await supabase.from('items').update({ in_stock: true })
        .in('id', body.ids).eq('family_id', family_id);
      if (error) throw error;
      return resp(200, { success: true });
    }

    return resp(404, { error: 'Not found' });

  } catch (err) {
    return resp(500, { error: err.message });
  }
};
