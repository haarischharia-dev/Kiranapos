import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useCatalogSync } from '../../src/hooks/useCatalogSync';
import { useNetworkBannerStore } from '../../src/store/networkBannerStore';
import KiranaTabBar from '../../src/components/ui/KiranaTabBar';

export default function TabLayout() {
  const bannerInset = useNetworkBannerStore((state) => state.bottomInset);

  useCatalogSync();

  return (
    <Tabs
      initialRouteName="scan"
      tabBar={(props) => (
        <View style={{ marginBottom: bannerInset }}>
          <KiranaTabBar {...props} />
        </View>
      )}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="khata" options={{ title: 'Khata' }} />
      <Tabs.Screen name="audit" options={{ title: 'Inventory' }} />
      <Tabs.Screen name="index" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
