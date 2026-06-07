import { SQLiteDatabase } from 'expo-sqlite';
import { storage as syncStorage } from '../db/seedImporter';
import { supabase } from './supabase';
import { Product } from '../types/db';
const LAST_SYNC_KEY = 'last_catalog_sync_timestamp';

export const pushLocalProducts = async (db: SQLiteDatabase) => {
  try {
    const unsyncedProducts = await db.getAllAsync<Product>('SELECT * FROM products WHERE synced_to_global = 0');
    
    if (unsyncedProducts.length === 0) {
      console.log('☁️ [Sync] No local products to push.');
      return;
    }

    console.log(`☁️ [Sync] Pushing ${unsyncedProducts.length} products to global catalog...`);
    
    const { error } = await supabase
      .from('global_products')
      .upsert(
        unsyncedProducts.map(p => ({
          barcode: p.barcode,
          name: p.name,
          price: p.price,
          is_loose: p.is_loose,
          created_at: p.updated_at
        })),
        { onConflict: 'barcode' }
      );

    if (error) throw error;

    // Mark as synced locally
    await db.withTransactionAsync(async () => {
      for (const p of unsyncedProducts) {
        await db.runAsync('UPDATE products SET synced_to_global = 1 WHERE id = ?', [p.id]);
      }
    });

    console.log('☁️ [Sync] Push successful.');
  } catch (err) {
    console.error('☁️ [Sync] Push failed:', err);
  }
};

export const pullGlobalProducts = async (db: SQLiteDatabase) => {
  try {
    const lastSyncStr = syncStorage.getString(LAST_SYNC_KEY) || '1970-01-01T00:00:00Z';
    
    console.log(`☁️ [Sync] Pulling global products since ${lastSyncStr}...`);
    
    const { data, error } = await supabase
      .from('global_products')
      .select('*')
      .gt('created_at', lastSyncStr);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('☁️ [Sync] No new products from global catalog.');
      syncStorage.set(LAST_SYNC_KEY, new Date().toISOString());
      return;
    }

    console.log(`☁️ [Sync] Pulled ${data.length} new products. Merging into local DB...`);

    await db.withTransactionAsync(async () => {
      for (const gp of data) {
        // We use INSERT OR IGNORE so we don't overwrite local pricing modifications
        const localId = Math.random().toString(36).substring(2, 15);
        await db.runAsync(
          `INSERT OR IGNORE INTO products (id, barcode, name, price, is_loose, stock, updated_at, synced_to_global) 
           VALUES (?, ?, ?, ?, ?, 0, ?, 1)`,
          [localId, gp.barcode, gp.name, gp.price, gp.is_loose, new Date().toISOString()]
        );
      }
    });

    syncStorage.set(LAST_SYNC_KEY, new Date().toISOString());
    console.log('☁️ [Sync] Pull successful.');
  } catch (err) {
    console.error('☁️ [Sync] Pull failed:', err);
  }
};
