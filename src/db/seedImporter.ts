import { createMMKV } from 'react-native-mmkv';
import { SQLiteDatabase } from 'expo-sqlite';
import { Product } from '../types/db';
import seedData from './seed.json';

export const storage = createMMKV();

export async function runSeedImporter(db: SQLiteDatabase) {
  const isDbSeeded = storage.getBoolean('is_db_seeded');
  
  if (isDbSeeded) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const item of seedData as Product[]) {
      await db.runAsync(
        'INSERT INTO products (id, barcode, name, price, is_loose, stock, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.barcode, item.name, item.price, item.is_loose, item.stock, item.updated_at]
      );
    }
  });

  storage.set('is_db_seeded', true);
}
