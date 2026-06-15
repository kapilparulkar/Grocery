const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api/', '').replace('/api/', '');
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : null;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

  if (method === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // GET /items
    if (path === 'items' && method === 'GET') {
      const { data, error } = await supabase.from('items').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // POST /items
    if (path === 'items' && method === 'POST') {
      const { data: max } = await supabase.from('items').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      const nextOrder = (max && max.length > 0 ? max[0].sort_order : 0) + 1;
      const { data, error } = await supabase.from('items').insert({
        name: body.name,
        category: body.category || 'Other',
        quantity: body.quantity || 1,
        in_stock: true,
        sort_order: nextOrder
      }).select();
      if (error) throw error;
      return { statusCode: 201, headers, body: JSON.stringify(data[0]) };
    }

    // POST /items/bulk
    if (path === 'items/bulk' && method === 'POST') {
      const { data: max } = await supabase.from('items').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      let nextOrder = (max && max.length > 0 ? max[0].sort_order : 0) + 1;
      const lines = body.items.split('\n').map(l => l.trim().replace(/^-\s*/, '')).filter(Boolean);
      const rows = lines.map(name => ({ name, category: body.category || 'Other', quantity: 1, in_stock: true, sort_order: nextOrder++ }));
      const { data, error } = await supabase.from('items').insert(rows).select();
      if (error) throw error;
      return { statusCode: 201, headers, body: JSON.stringify(data) };
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
      const { data, error } = await supabase.from('items').update(updates).eq('id', id).select();
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data[0]) };
    }

    // POST /items/:id/toggle
    const toggleMatch = path.match(/^items\/(\d+)\/toggle$/);
    if (toggleMatch && method === 'POST') {
      const id = parseInt(toggleMatch[1]);
      const { data: item } = await supabase.from('items').select('in_stock').eq('id', id).single();
      const { data, error } = await supabase.from('items').update({ in_stock: !item.in_stock }).eq('id', id).select();
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data[0]) };
    }

    // DELETE /items/:id
    const delMatch = path.match(/^items\/(\d+)$/);
    if (delMatch && method === 'DELETE') {
      const id = parseInt(delMatch[1]);
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // POST /items/bulk-restock
    if (path === 'items/bulk-restock' && method === 'POST') {
      const { error } = await supabase.from('items').update({ in_stock: true }).in('id', body.ids);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
