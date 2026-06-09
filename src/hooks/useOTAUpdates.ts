import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';

/**
 * Production builds: apply downloaded OTA bundles without requiring a manual restart.
 * Native expo-updates downloads on startup; we reload as soon as the bundle is ready.
 */
export function useOTAUpdates() {
  const { isUpdateAvailable, isUpdatePending, isStartupProcedureRunning } =
    Updates.useUpdates();
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    if (!isUpdatePending || reloadingRef.current) return;

    reloadingRef.current = true;
    Updates.reloadAsync().catch((error) => {
      reloadingRef.current = false;
      console.log('OTA reload skipped:', error);
    });
  }, [isUpdatePending]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (isStartupProcedureRunning || !isUpdateAvailable || isUpdatePending) return;

    Updates.fetchUpdateAsync().catch((error) => {
      console.log('OTA fetch skipped:', error);
    });
  }, [isUpdateAvailable, isUpdatePending, isStartupProcedureRunning]);
}
