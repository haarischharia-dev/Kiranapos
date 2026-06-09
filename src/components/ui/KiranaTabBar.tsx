import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { KiranaBorder, KiranaColors } from '@/constants/kirana-design';
import KText from './KText';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  scan: 'qr-code-scanner',
  khata: 'menu-book',
  audit: 'inventory-2',
  index: 'person',
};

export default function KiranaTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? 'circle';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={[styles.tab, isFocused && styles.tabActive]}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={iconName}
              size={22}
              color={isFocused ? KiranaColors.navy : KiranaColors.onSurfaceVariant}
            />
            <KText variant="labelCaps" style={[styles.label, isFocused && styles.labelActive]}>
              {label}
            </KText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: KiranaColors.background,
    borderTopWidth: KiranaBorder.card,
    borderTopColor: KiranaColors.outlineVariant,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    borderWidth: KiranaBorder.hairline,
    borderColor: 'transparent',
    gap: 1,
  },
  tabActive: {
    backgroundColor: KiranaColors.tabActiveBg,
    borderColor: KiranaColors.onPrimaryContainer,
  },
  label: {
    fontSize: 11,
    color: KiranaColors.onSurfaceVariant,
  },
  labelActive: {
    color: KiranaColors.navy,
  },
});
