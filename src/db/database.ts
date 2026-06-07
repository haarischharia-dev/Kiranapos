import * as SQLite from 'expo-sqlite';

// Single shared connection for the whole app. Opening `kirana.db` repeatedly
// with openDatabaseAsync creates multiple native handles that race under WAL,
// which leaves the native pointer null and surfaces as
// "NativeDatabase.prepareAsync has been rejected: NullPointerException".
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const openDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('kirana.db');
      // Run schema creation + migrations before handing the connection to any
      // caller, so background sync can never query a column (e.g.
      // synced_to_global) that the ALTER hasn't added yet.
      await initializeDatabase(db);
      return db;
    })().catch((err) => {
      // Reset so a later call can retry instead of caching a failed open.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
};

export const initializeDatabase = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT UNIQUE,
      name TEXT,
      price REAL,
      is_loose INTEGER,
      stock REAL,
      updated_at TEXT,
      synced_to_global INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      total_amount REAL,
      payment_method TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_id TEXT,
      quantity REAL,
      subtotal REAL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT UNIQUE,
      outstanding_balance REAL
    );

    CREATE TABLE IF NOT EXISTS khata_entries (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      amount REAL,
      entry_type TEXT,
      created_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tap_events (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      tap_count INTEGER,
      last_tapped_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_khata_entries_customer_id ON khata_entries(customer_id);
  `);

  try {
    await db.execAsync(`ALTER TABLE products ADD COLUMN synced_to_global INTEGER DEFAULT 0;`);
  } catch (e) {
    // Column already exists, ignore
  }
};
