import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ShopProduct = {
  barcode: string;
  name: string;
  price: number | null;
  is_loose: number | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  // Step A: Extract user_id from Auth context
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const userId = authData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Step B: Harvest shop-scoped products
  const { data: shopProducts, error: harvestError } = await admin
    .from('products')
    .select('barcode, name, price, is_loose')
    .eq('shop_id', userId);

  if (harvestError) {
    console.error('Harvest failed:', harvestError.message);
    return jsonResponse({ error: 'Failed to harvest products' }, 500);
  }

  const harvested = (shopProducts ?? []) as ShopProduct[];

  // Step C: Merge into global_products (ignore duplicate barcodes)
  if (harvested.length > 0) {
    const globalRows = harvested.map((product) => ({
      barcode: product.barcode,
      name: product.name,
      price: Math.max(0, Number(product.price ?? 0)),
      is_loose: Number(product.is_loose ?? 0),
      created_at: new Date().toISOString(),
    }));

    const { error: mergeError } = await admin
      .from('global_products')
      .upsert(globalRows, { onConflict: 'barcode', ignoreDuplicates: true });

    if (mergeError) {
      console.error('Merge failed:', mergeError.message);
      return jsonResponse({ error: 'Failed to merge into global catalogue' }, 500);
    }
  }

  // Step D: Wipe user — cascades sales, khata_entries, and private products
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('Delete user failed:', deleteError.message);
    return jsonResponse({ error: 'Failed to delete account' }, 500);
  }

  return jsonResponse({
    success: true,
    harvested: harvested.length,
    message: 'Account deleted; products merged into global catalogue',
  });
});
