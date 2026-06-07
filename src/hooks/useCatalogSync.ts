import { useEffect } from 'react';
import { useNetworkState } from 'expo-network';
import { storage as syncStorage } from '../db/seedImporter';
import { openDatabase } from '../db/database';
import { pushLocalProducts, pullGlobalProducts } from '../utils/syncEngine';
const LAST_TRIGGER_KEY = 'last_catalog_trigger_time';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useCatalogSync() {
  const networkState = useNetworkState();

  useEffect(() => {
    // Treat null as online just in case
    const isOnline = networkState.isConnected !== false;

    if (!isOnline) {
      return;
    }

    const lastTrigger = syncStorage.getNumber(LAST_TRIGGER_KEY) || 0;
    const now = Date.now();

    if (now - lastTrigger > SYNC_INTERVAL_MS) {
      console.log('🔄 [CatalogSync] 24h passed, triggering background sync...');
      
      // Fire and forget (don't block UI thread)
      (async () => {
        try {
          const db = await openDatabase();
          await pushLocalProducts(db);
          await pullGlobalProducts(db);
          
          syncStorage.set(LAST_TRIGGER_KEY, now);
        } catch (err) {
          console.error('❌ [CatalogSync] Sync failed:', err);
        }
      })();
    }
  }, [networkState.isConnected]);
}
