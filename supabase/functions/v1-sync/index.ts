import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const API_VERSION = 'v1';
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

/** In-memory sliding window; resets per edge isolate. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

type TableChanges = {
  created?: Record<string, unknown>[];
  updated?: Record<string, unknown>[];
  deleted?: string[];
};

type WatermelonPushBody = {
  action?: 'push';
  changes?: Record<string, TableChanges>;
  lastPulledAt?: number;
};

type WatermelonPullBody = {
  action?: 'pull';
  lastPulledAt?: number;
  schemaVersion?: number;
};

type SyncRequestBody = WatermelonPushBody | WatermelonPullBody;

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-API-Version': API_VERSION, ...headers },
  });
}

function getClientKey(req: Request, userId: string | null): string {
  if (userId) return `uid:${userId}`;
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  return `ip:${ip}`;
}

function checkRateLimit(key: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    rateBuckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  return { allowed: true };
}

function resolveAction(req: Request, body: SyncRequestBody): 'push' | 'pull' | null {
  const url = new URL(req.url);
  const pathAction = url.pathname.split('/').filter(Boolean).pop();

  if (pathAction === 'push' || pathAction === 'pull') {
    return pathAction;
  }

  if (body.action === 'push' || body.action === 'pull') {
    return body.action;
  }

  return null;
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

async function handlePull(
  supabase: ReturnType<typeof createClient>,
  body: WatermelonPullBody,
): Promise<Response> {
  const lastPulledAt = body.lastPulledAt ?? 0;
  const since = new Date(lastPulledAt).toISOString();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .gt('last_modified', since);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const changes: Record<string, TableChanges> = {
    products: {
      created: [],
      updated: (data ?? []) as Record<string, unknown>[],
      deleted: [],
    },
  };

  return jsonResponse({
    changes,
    timestamp: Date.now(),
    schemaVersion: body.schemaVersion ?? 1,
  });
}

async function handlePush(
  supabase: ReturnType<typeof createClient>,
  body: WatermelonPushBody,
): Promise<Response> {
  const productChanges = body.changes?.products;
  if (!productChanges) {
    return jsonResponse({ error: 'Missing changes.products payload' }, 400);
  }

  const upsertRows = [
    ...(productChanges.created ?? []),
    ...(productChanges.updated ?? []),
  ].map((row) => ({
    id: String(row.id),
    barcode: String(row.barcode),
    name: String(row.name),
    price: Number(row.price ?? 0),
    is_loose: Number(row.is_loose ?? 0),
    stock: Number(row.stock ?? 0),
    last_modified: new Date().toISOString(),
  }));

  if (upsertRows.length > 0) {
    const { error } = await supabase.from('products').upsert(upsertRows, { onConflict: 'barcode' });
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  const deletedIds = productChanges.deleted ?? [];
  if (deletedIds.length > 0) {
    const { error } = await supabase.from('products').delete().in('id', deletedIds);
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }

  return jsonResponse({
    success: true,
    pushedAt: Date.now(),
    lastPulledAt: body.lastPulledAt ?? null,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const userId = await getUserId(req);
  const rateKey = getClientKey(req, userId);
  const rate = checkRateLimit(rateKey);

  if (!rate.allowed) {
    return jsonResponse(
      { error: 'Too Many Requests', retryAfterSec: rate.retryAfterSec },
      429,
      { 'Retry-After': String(rate.retryAfterSec) },
    );
  }

  let body: SyncRequestBody;
  try {
    body = (await req.json()) as SyncRequestBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const action = resolveAction(req, body);
  if (!action) {
    return jsonResponse({ error: 'Route to push or pull via path or action field' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: req.headers.get('Authorization')
          ? { Authorization: req.headers.get('Authorization')! }
          : {},
      },
    },
  );

  if (action === 'pull') {
    return handlePull(supabase, body as WatermelonPullBody);
  }

  return handlePush(supabase, body as WatermelonPushBody);
});
