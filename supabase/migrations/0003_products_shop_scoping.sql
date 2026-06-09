-- Shop-scoped private products + cascade wipe on account deletion

ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_shop_id_fkey;
ALTER TABLE sales
  ADD CONSTRAINT sales_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE khata_entries DROP CONSTRAINT IF EXISTS khata_entries_shop_id_fkey;
ALTER TABLE khata_entries
  ADD CONSTRAINT khata_entries_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES auth.users(id) ON DELETE CASCADE;
