import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useCartStore } from '../store/cartStore';
import { KiranaBorder, KiranaColors, KiranaSpacing } from '@/constants/kirana-design';
import KText from './ui/KText';

export default function CartView() {
  const items = useCartStore((state) => state.items);
  const incrementQuantity = useCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useCartStore((state) => state.decrementQuantity);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <KText variant="bodyMd" style={styles.emptyText}>
          Scan items to add them to cart
        </KText>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.product.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => {
        const lineTotal = item.product.price * item.quantity;
        return (
          <View style={[styles.cartItemRow, index % 2 === 1 && styles.cartItemAlt]}>
            <View style={styles.itemInfo}>
              <KText variant="headlineMd" style={styles.itemName} numberOfLines={1}>
                {item.product.name}
              </KText>
              <KText variant="bodyMd" style={styles.itemPrice}>
                ₹{item.product.price.toFixed(2)} / unit
              </KText>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => decrementQuantity(item.product.id)}
              >
                <KText variant="priceSub" style={styles.stepperBtnText}>−</KText>
              </TouchableOpacity>
              <KText variant="priceSub" style={styles.quantityText}>
                {String(item.quantity).padStart(2, '0')}
              </KText>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => incrementQuantity(item.product.id)}
              >
                <KText variant="priceSub" style={styles.stepperBtnText}>+</KText>
              </TouchableOpacity>
            </View>

            <KText variant="priceLine" style={styles.lineTotal}>
              ₹{lineTotal.toFixed(0)}
            </KText>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: KiranaSpacing.gutter,
    backgroundColor: KiranaColors.background,
  },
  emptyText: {
    color: KiranaColors.onSurfaceVariant,
    textAlign: 'center',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KiranaColors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    gap: 6,
  },
  cartItemAlt: {
    backgroundColor: KiranaColors.surfaceDim,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 18,
    lineHeight: 20,
    color: KiranaColors.onSurface,
  },
  itemPrice: {
    color: KiranaColors.secondary,
    marginTop: 1,
    fontSize: 14,
    lineHeight: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.onSurface,
    borderRadius: 6,
    backgroundColor: KiranaColors.surface,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: KiranaColors.onSurface,
    fontSize: 20,
    lineHeight: 22,
  },
  quantityText: {
    minWidth: 30,
    textAlign: 'center',
    color: KiranaColors.onSurface,
    fontSize: 18,
    lineHeight: 20,
  },
  lineTotal: {
    minWidth: 48,
    textAlign: 'right',
    color: KiranaColors.onSurface,
    fontSize: 19,
    lineHeight: 21,
  },
});
