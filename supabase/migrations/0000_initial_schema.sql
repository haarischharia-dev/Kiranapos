-- Core tables for KiranaPOS cloud sync (India-first, shop-scoped sales/khata)

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_loose INTEGER NOT NULL DEFAULT 0,
  stock DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS global_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_loose INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES auth.users(id),
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS khata_entries (
  id TEXT PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  entry_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_last_modified ON products(last_modified);
CREATE INDEX IF NOT EXISTS idx_global_products_barcode ON global_products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_khata_entries_shop_id ON khata_entries(shop_id);
