import { SQLiteDatabase } from 'expo-sqlite';
import { Customer, KhataEntry } from '../types/db';
import { CartItem } from '../store/cartStore';
import { track } from '../utils/telemetry';

export async function searchCustomers(db: SQLiteDatabase, query: string): Promise<Customer[]> {
  const searchTerm = `%${query}%`;
  return await db.getAllAsync<Customer>(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC LIMIT 20',
    [searchTerm, searchTerm]
  );
}

export async function createCustomer(db: SQLiteDatabase, name: string, phone: string): Promise<Customer> {
  const id = Math.random().toString(36).substring(2, 15);
  await db.runAsync(
    'INSERT INTO customers (id, name, phone, outstanding_balance) VALUES (?, ?, ?, 0)',
    [id, name, phone]
  );
  return { id, name, phone, outstanding_balance: 0 };
}

export async function addKhataEntry(
  db: SQLiteDatabase,
  customerId: string,
  amount: number,
  type: 'debit' | 'credit',
  cartItems?: CartItem[]
): Promise<void> {
  const entryId = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // Insert the ledger entry
    await db.runAsync(
      'INSERT INTO khata_entries (id, customer_id, amount, entry_type, created_at) VALUES (?, ?, ?, ?, ?)',
      [entryId, customerId, amount, type, now]
    );

    // If it's a debit (sale) and we have cart items, save the bill!
    if (type === 'debit' && cartItems && cartItems.length > 0) {
      await db.runAsync(
        'INSERT INTO sales (id, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?)',
        [entryId, amount, 'khata', now] // Use entryId as saleId
      );

      for (const item of cartItems) {
        const saleItemId = Math.random().toString(36).substring(2, 15);
        const subtotal = item.product.price * item.quantity;
        await db.runAsync(
          'INSERT INTO sale_items (id, sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?, ?)',
          [saleItemId, entryId, item.product.id, item.quantity, subtotal]
        );
      }
    }

    const modifier = type === 'debit' ? amount : -amount;
    await db.runAsync(
      'UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
      [modifier, customerId]
    );
  });

  // A credit entry means the customer paid down their outstanding balance.
  // Fires only after the ledger entry + balance update commit successfully.
  if (type === 'credit') {
    track('Khata_Recovered', { amount, customerId });
  }
}

export async function getKhataBalances(db: SQLiteDatabase): Promise<Customer[]> {
  return await db.getAllAsync<Customer>(
    'SELECT * FROM customers WHERE outstanding_balance > 0 ORDER BY outstanding_balance DESC'
  );
}

export async function upsertCustomerAndCharge(
  db: SQLiteDatabase,
  name: string,
  phone: string,
  amount: number,
  cartItems?: CartItem[]
): Promise<void> {
  const id = Math.random().toString(36).substring(2, 15);
  await db.withTransactionAsync(async () => {
    const result = await db.getFirstAsync<{ id: string }>(
      `INSERT INTO customers (id, name, phone, outstanding_balance) 
       VALUES (?, ?, ?, 0) 
       ON CONFLICT(phone) DO UPDATE SET name=excluded.name 
       RETURNING id`,
      [id, name, phone]
    );
    
    if (result && result.id) {
      const entryId = Math.random().toString(36).substring(2, 15);
      const now = new Date().toISOString();
      await db.runAsync(
        'INSERT INTO khata_entries (id, customer_id, amount, entry_type, created_at) VALUES (?, ?, ?, ?, ?)',
        [entryId, result.id, amount, 'debit', now]
      );

      // Save bill
      if (cartItems && cartItems.length > 0) {
        await db.runAsync(
          'INSERT INTO sales (id, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?)',
          [entryId, amount, 'khata', now]
        );

        for (const item of cartItems) {
          const saleItemId = Math.random().toString(36).substring(2, 15);
          const subtotal = item.product.price * item.quantity;
          await db.runAsync(
            'INSERT INTO sale_items (id, sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?, ?)',
            [saleItemId, entryId, item.product.id, item.quantity, subtotal]
          );
        }
      }

      await db.runAsync(
        'UPDATE customers SET outstanding_balance = outstanding_balance + ? WHERE id = ?',
        [amount, result.id]
      );
    }
  });
}

// Fetch history for a single customer
export async function getKhataHistory(db: SQLiteDatabase, customerId: string): Promise<KhataEntry[]> {
  // Guard: a null/undefined id would bind as NULL and can crash the native layer.
  if (!customerId) {
    return [];
  }
  return await db.getAllAsync<KhataEntry>(
    'SELECT * FROM khata_entries WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );
}

export interface BillLineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Fetch bill line items for a specific sale (which uses khata_entry id)
export async function getBillDetails(db: SQLiteDatabase, saleId: string): Promise<BillLineItem[]> {
  return await db.getAllAsync<BillLineItem>(
    `SELECT 
      si.id, 
      p.name, 
      si.quantity, 
      p.price, 
      si.subtotal 
     FROM sale_items si 
     JOIN products p ON si.product_id = p.id 
     WHERE si.sale_id = ?`,
    [saleId]
  );
}
