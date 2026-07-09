// Handles async local SQLite queries for sub-5ms hardware barcode scans
import { SQLiteDatabase } from 'expo-sqlite';
import { Product } from '../types/db';

export async function findByBarcode(db: SQLiteDatabase, barcode: string): Promise<Product | null> {
  return db.getFirstAsync('SELECT * FROM products WHERE barcode = ? LIMIT 1', [barcode]);
}

export async function upsertProduct(db: SQLiteDatabase, product: Product): Promise<void> {
  const synced = product.synced_to_global !== undefined ? product.synced_to_global : 0;
  await db.runAsync(
    'INSERT OR REPLACE INTO products (id, barcode, name, price, is_loose, stock, updated_at, synced_to_global) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [product.id, product.barcode, product.name, product.price, product.is_loose, product.stock, product.updated_at, synced]
  );
}

export async function searchByName(db: SQLiteDatabase, query: string): Promise<Product[]> {
  return db.getAllAsync('SELECT * FROM products WHERE name LIKE ?', [`%${query}%`]);
}

/** Offline search by product name or barcode (partial match). */
export async function searchProducts(db: SQLiteDatabase, query: string): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const like = `%${trimmed}%`;
  return db.getAllAsync(
    `SELECT * FROM products
     WHERE LOWER(name) LIKE LOWER(?)
        OR barcode LIKE ?
     ORDER BY name ASC
     LIMIT 25`,
    [like, like],
  );
}

export async function topLooseItems(db: SQLiteDatabase): Promise<Product[]> {
  return db.getAllAsync(`
    SELECT p.* 
    FROM products p 
    LEFT JOIN tap_events t ON p.id = t.product_id 
    WHERE p.is_loose = 1 
    GROUP BY p.id 
    ORDER BY COUNT(t.id) DESC, p.name ASC 
    LIMIT 20
  `);
}

export async function findLooseByDisplayName(
  db: SQLiteDatabase,
  displayName: string
): Promise<Product | null> {
  const normalized = displayName.trim().toLowerCase();
  return db.getFirstAsync(
    'SELECT * FROM products WHERE is_loose = 1 AND LOWER(TRIM(name)) = ? LIMIT 1',
    [normalized]
  );
}

export async function deleteLooseProduct(db: SQLiteDatabase, productId: string): Promise<void> {
  await db.runAsync('DELETE FROM products WHERE id = ? AND is_loose = 1', [productId]);
}

export async function logTapEvent(db: SQLiteDatabase, productId: string): Promise<void> {
  const id = Math.random().toString(36).substring(2, 15);
  await db.runAsync(
    'INSERT INTO tap_events (id, product_id, tap_count, last_tapped_at) VALUES (?, ?, 1, ?)',
    [id, productId, new Date().toISOString()]
  );
}

export async function incrementStock(db: SQLiteDatabase, barcode: string, quantity: number): Promise<void> {
  await db.runAsync(
    'UPDATE products SET stock = stock + ?, updated_at = ? WHERE barcode = ?',
    [quantity, new Date().toISOString(), barcode]
  );
}
