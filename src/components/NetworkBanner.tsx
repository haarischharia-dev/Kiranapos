import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkState } from '../hooks/useNetworkState';
import {
  NETWORK_BANNER_HEIGHT,
  useNetworkBannerStore,
} from '../store/networkBannerStore';
import { KiranaColors } from '@/constants/kirana-design';
import KText from './ui/KText';

const BANNER_HEIGHT = NETWORK_BANNER_HEIGHT;

type BannerMode = 'hidden' | 'offline' | 'back_online';

export default function NetworkBanner() {
  const { isOffline } = useNetworkState();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(BANNER_HEIGHT + insets.bottom)).current;
  const wasOfflineRef = useRef(false);
  const [mode, setMode] = useState<BannerMode>('hidden');
  const setBottomInset = useNetworkBannerStore((state) => state.setBottomInset);

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
      setMode('offline');
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setMode('back_online');
      const timer = setTimeout(() => setMode('hidden'), 1000);
      return () => clearTimeout(timer);
    }

    setMode('hidden');
  }, [isOffline]);

  const isVisible = mode !== 'hidden';
  const hiddenOffset = BANNER_HEIGHT + insets.bottom;

  useEffect(() => {
    setBottomInset(isVisible ? BANNER_HEIGHT : 0);

    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : hiddenOffset,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isVisible, hiddenOffset, slideAnim, setBottomInset]);

  const backgroundColor = mode === 'back_online' ? KiranaColors.success : KiranaColors.navy;
  const label =
    mode === 'back_online'
      ? 'Back online'
      : 'No internet — sales are saving locally.';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.banner}>
        <KText variant="bodyMd" style={styles.text} numberOfLines={1}>
          {label}
        </KText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  text: {
    color: KiranaColors.onPrimary,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
