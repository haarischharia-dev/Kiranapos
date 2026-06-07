import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

function isDeviceOffline(state: NetInfoState): boolean {
  // Airplane mode sets isConnected to false immediately on Android.
  // isInternetReachable can lag as null — only treat an explicit false as offline.
  return state.isConnected === false || state.isInternetReachable === false;
}

export function useNetworkState() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Seed the current state on mount — the listener alone can miss the first snapshot.
    NetInfo.fetch().then((state) => setIsOffline(isDeviceOffline(state)));

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(isDeviceOffline(state));
    });

    return () => unsubscribe();
  }, []);

  return { isOffline };
}
