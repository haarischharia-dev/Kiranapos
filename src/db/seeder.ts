import { SQLiteDatabase } from 'expo-sqlite';
import { storage } from './seedImporter';
import seedData from './seed.json';

export async function injectMasterDatabase(db: SQLiteDatabase) {
  const isMasterSeeded = storage.getBoolean('is_master_seeded');
  
  if (isMasterSeeded) {
    return;
  }

  try {
    await db.withTransactionAsync(async () => {
      for (const item of seedData) {
        // Use provided ID or generate a new one
        const id = item.id || Math.random().toString(36).substring(2, 15);
        
        await db.runAsync(
          `INSERT OR IGNORE INTO products 
           (id, barcode, name, price, is_loose, stock, updated_at, synced_to_global) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.barcode,
            item.name,
            item.price || 0,
            item.is_loose || 0,
            item.stock || 0,
            item.updated_at || new Date().toISOString(),
            1  // synced_to_global = 1 (seed data doesn't need upload)
          ]
        );
      }
    });

    storage.set('is_master_seeded', true);
    console.log('✅ Seed Engine: Successfully injected structural master catalog.');
  } catch (error) {
    console.error('❌ Seed Engine: Failed to inject master database', error);
  }
}
