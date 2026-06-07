export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  is_loose: number;
  stock: number;
  updated_at: string;
  synced_to_global?: number;
}

export interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstanding_balance: number;
}

export interface KhataEntry {
  id: string;
  customer_id: string;
  amount: number;
  entry_type: string;
  created_at: string;
}

export interface TapEvent {
  id: string;
  product_id: string;
  tap_count: number;
  last_tapped_at: string;
}
