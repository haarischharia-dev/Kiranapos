import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { KiranaBorder, KiranaColors, KiranaSpacing } from '@/constants/kirana-design';
import KText from './KText';

type CheckoutBarProps = {
  total: number;
  disabled?: boolean;
  onPress: () => void;
};

export default function CheckoutBar({ total, disabled, onPress }: CheckoutBarProps) {
  return (
    <TouchableOpacity
      testID="checkout-btn"
      style={[styles.bar, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <MaterialIcons name="shopping-cart" size={26} color={KiranaColors.navy} />
      <KText variant="labelCaps" style={styles.checkoutLabel}>
        Checkout
      </KText>
      <View style={styles.totalBlock}>
        <KText variant="labelCaps" style={styles.totalLabel}>
          Total
        </KText>
        <KText variant="priceDisplay" style={styles.totalValue}>
          ₹{Math.round(total)}
        </KText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KiranaColors.primaryContainer,
    borderTopWidth: KiranaBorder.card,
    borderColor: KiranaColors.onPrimaryContainer,
    minHeight: 56,
    paddingHorizontal: KiranaSpacing.gutter,
    paddingVertical: 6,
    gap: 10,
  },
  disabled: {
    opacity: 0.45,
  },
  checkoutLabel: {
    flex: 1,
    color: KiranaColors.navy,
    fontSize: 17,
    lineHeight: 18,
  },
  totalBlock: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    color: KiranaColors.navy,
    fontSize: 10,
  },
  totalValue: {
    color: KiranaColors.navy,
    fontSize: 30,
    lineHeight: 32,
  },
});
