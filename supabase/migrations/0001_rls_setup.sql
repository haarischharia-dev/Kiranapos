-- RLS Policy for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for products" ON products FOR SELECT USING (true);

-- RLS Policy for sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop read own sales" ON sales FOR SELECT USING (shop_id = auth.uid());
CREATE POLICY "Shop insert own sales" ON sales FOR INSERT WITH CHECK (shop_id = auth.uid());
CREATE POLICY "Shop update own sales" ON sales FOR UPDATE USING (shop_id = auth.uid());

-- RLS Policy for khata_entries
ALTER TABLE khata_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop read own khata" ON khata_entries FOR SELECT USING (shop_id = auth.uid());
CREATE POLICY "Shop insert own khata" ON khata_entries FOR INSERT WITH CHECK (shop_id = auth.uid());
CREATE POLICY "Shop update own khata" ON khata_entries FOR UPDATE USING (shop_id = auth.uid());
