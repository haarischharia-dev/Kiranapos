import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNetworkState } from 'expo-network';
import { storage } from '../../db/seedImporter';
import { KiranaBorder, KiranaColors, KiranaSpacing } from '@/constants/kirana-design';
import KText from './KText';

type StoreHeaderProps = {
  includeTopInset?: boolean;
};

export default function StoreHeader({ includeTopInset = true }: StoreHeaderProps) {
  const insets = useSafeAreaInsets();
  const networkState = useNetworkState();
  const [shopName, setShopName] = useState(
    () => storage.getString('shop_name') ?? 'My Kirana Store',
  );

  useFocusEffect(
    useCallback(() => {
      setShopName(storage.getString('shop_name') ?? 'My Kirana Store');
    }, []),
  );

  const isOnline = networkState.isConnected !== false;

  return (
    <View
      style={[
        styles.container,
        includeTopInset ? { paddingTop: insets.top + 8 } : { paddingTop: 4 },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <MaterialIcons name="storefront" size={22} color={KiranaColors.onSurface} />
        </View>
        <KText variant="headlineMd" style={styles.title} numberOfLines={1}>
          {shopName}
        </KText>
        <View style={styles.syncBox}>
          <MaterialIcons
            name="sync"
            size={22}
            color={KiranaColors.onSurface}
            style={!isOnline ? styles.syncOffline : undefined}
          />
          <View
            style={[
              styles.syncDot,
              { backgroundColor: isOnline ? KiranaColors.success : KiranaColors.error },
            ]}
          />
        </View>
      </View>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: KiranaColors.background,
    paddingHorizontal: KiranaSpacing.gutter,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: 6,
    backgroundColor: KiranaColors.surface,
  },
  title: {
    flex: 1,
    color: KiranaColors.onSurface,
  },
  syncBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: KiranaColors.surface,
  },
  syncOffline: {
    opacity: 0.35,
  },
  rule: {
    marginTop: 10,
    height: KiranaBorder.hairline,
    backgroundColor: KiranaColors.outlineVariant,
  },
});
