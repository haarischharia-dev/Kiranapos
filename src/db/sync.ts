import { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../utils/supabase';

// Key used to persist the last successful pull timestamp inside the local DB.
const LAST_PULLED_KEY = 'products_last_pulled_at';

async function getLastPulledAt(db: SQLiteDatabase): Promise<number> {
  await db.runAsync(
    'CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)'
  );
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [LAST_PULLED_KEY]
  );
  return row ? Number(row.value) || 0 : 0;
}

async function setLastPulledAt(db: SQLiteDatabase, timestamp: number): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    [LAST_PULLED_KEY, String(timestamp)]
  );
}

async function pullChanges(db: SQLiteDatabase): Promise<void> {
  const lastPulledAt = await getLastPulledAt(db);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .gt('last_modified', new Date(lastPulledAt).toISOString());

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    await setLastPulledAt(db, Date.now());
    return;
  }

  // Conflict resolution: if we already hold a local price, keep it so the
  // server can't clobber a price the shopkeeper set on-device.
  const localProducts = await db.getAllAsync<{ id: string; price: number }>(
    'SELECT id, price FROM products'
  );
  const localPriceMap = new Map<string, number>();
  localProducts.forEach((p) => localPriceMap.set(p.id, p.price));

  await db.withTransactionAsync(async () => {
    for (const product of data as any[]) {
      const localPrice = localPriceMap.get(product.id);
      await db.runAsync(
        'INSERT OR REPLACE INTO products (id, barcode, name, price, is_loose, stock, updated_at, synced_to_global) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [
          product.id,
          product.barcode,
          product.name,
          localPrice !== undefined ? localPrice : product.price,
          product.is_loose,
          product.stock,
          product.last_modified ?? new Date().toISOString(),
        ]
      );
    }
  });

  await setLastPulledAt(db, Date.now());
}

async function pushChanges(db: SQLiteDatabase): Promise<void> {
  // Local rows that originated on-device and haven't reached the server yet.
  const unsynced = await db.getAllAsync<any>(
    'SELECT id, barcode, name, price, is_loose, stock FROM products WHERE synced_to_global = 0'
  );

  if (unsynced.length === 0) {
    return;
  }

  console.log('📤 SYNC PUSH TARGET:', JSON.stringify(unsynced, null, 2));

  const { error } = await supabase.from('products').upsert(
    unsynced.map((p) => ({
      id: p.id,
      barcode: p.barcode,
      name: p.name,
      price: p.price,
      is_loose: p.is_loose,
      stock: p.stock,
    })),
    { onConflict: 'barcode' }
  );

  if (error) {
    throw new Error(error.message || 'Supabase push failed');
  }

  const ids = unsynced.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE products SET synced_to_global = 1 WHERE id IN (${placeholders})`,
    ids
  );
}

export const syncDatabase = async (db: SQLiteDatabase): Promise<void> => {
  if (!db) {
    // Guard: a missing database instance previously surfaced as the
    // "undefined database" crash. Bail out cleanly instead.
    console.warn('syncDatabase called without a database instance; skipping.');
    return;
  }

  try {
    await pushChanges(db);
    await pullChanges(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Offline is a normal state for an offline-first POS — don't treat a
    // failed network request as a crash, just note it and retry next cycle.
    if (message.includes('Network request failed')) {
      console.log('📴 Sync skipped — device offline. Will retry later.');
    } else {
      console.error('🚨 Sync error:', message);
    }
  }
};
