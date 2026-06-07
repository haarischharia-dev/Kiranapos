import { useEffect } from 'react';
import { openDatabase } from '../db/database';
import { syncDatabase } from '../db/sync';

export function useSync() {
  useEffect(() => {
    let isActive = true;

    const performSync = async () => {
      try {
        const db = await openDatabase();
        if (!isActive) return;
        await syncDatabase(db);
      } catch (error) {
        // Silently catch sync errors (e.g. offline)
        console.log('Background sync failed silently:', error);
      }
    };

    performSync();

    return () => {
      isActive = false;
    };
  }, []);
}
