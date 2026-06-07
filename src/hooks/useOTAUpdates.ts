import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * Production builds: apply any downloaded OTA bundle immediately.
 * Native expo-updates downloads during startup but won't switch until reload —
 * without this, the app can stay stuck on the old embedded bundle forever.
 */
export function useOTAUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    let cancelled = false;

    async function applyPendingOrFetch() {
      try {
        if (!Updates.isEnabled) return;

        // Critical: native layer sets this when a bundle was downloaded on a prior launch.
        if (Updates.isUpdatePending) {
          if (!cancelled) {
            await Updates.reloadAsync();
          }
          return;
        }

        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;

        await Updates.fetchUpdateAsync();
        if (!cancelled) {
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('OTA sync skipped:', error);
      }
    }

    applyPendingOrFetch();

    return () => {
      cancelled = true;
    };
  }, []);
}
