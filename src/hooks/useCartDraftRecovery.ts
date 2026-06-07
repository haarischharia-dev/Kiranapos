import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { storage } from '../db/seedImporter';

function readDraftLength(): number {
  try {
    const draft = storage.getString('cart_draft');
    if (!draft || draft === '[]') return 0;
    const parsed = JSON.parse(draft);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Runs once at app root so draft recovery is not tied to the Scan tab mounting.
 * Cart items are bootstrapped from MMKV in cartStore; this alert lets the
 * cashier explicitly discard a stale draft if needed.
 */
export function useCartDraftRecovery() {
  const hasPrompted = useRef(false);
  const hydrate = useCartStore((state) => state.hydrate);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (hasPrompted.current) return;

    const itemCount = readDraftLength();
    if (itemCount === 0) return;

    hasPrompted.current = true;

    // Defer until navigation/splash settles so Android doesn't swallow the alert.
    const timer = setTimeout(() => {
      Alert.alert(
        'Unfinished Bill',
        'An unfinished bill was detected. Do you want to resume it or clear it?',
        [
          { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
          { text: 'Resume', style: 'default', onPress: () => hydrate() },
        ],
        { cancelable: false }
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [hydrate, clearCart]);
}
