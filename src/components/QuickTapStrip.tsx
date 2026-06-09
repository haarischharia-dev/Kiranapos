import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '../db/database';
import { topLooseItems } from '../db/productRepo';
import { Product } from '../types/db';
import { useLooseQuickTap } from '../hooks/useLooseQuickTap';
import LooseCalculatorModal from './LooseCalculatorModal';
import KText from './ui/KText';
import { KiranaBorder, KiranaColors, KiranaRadius } from '@/constants/kirana-design';

function shortLooseLabel(name: string): string {
  const stripped = name.replace(/\s*\([\d.]+\s+\w+\)$/i, '').trim();
  return stripped.length > 14 ? `${stripped.slice(0, 13)}…` : stripped || name;
}

interface QuickTapStripProps {
  refreshKey?: string;
}

export default function QuickTapStrip({ refreshKey }: QuickTapStripProps) {
  const [looseItems, setLooseItems] = useState<Product[]>([]);
  const quickTap = useLooseQuickTap();

  const fetchItems = useCallback(async () => {
    try {
      const db = await openDatabase();
      const items = await topLooseItems(db);
      setLooseItems(items);
    } catch (error) {
      console.error('Failed to load quick tap strip:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems]),
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshKey]);

  if (looseItems.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.stripContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
        >
          {looseItems.map((product, index) => (
            <TouchableOpacity
              key={product.id}
              style={[styles.chip, index === 0 && styles.chipTop]}
              onPress={() => quickTap.openProduct(product)}
              activeOpacity={0.75}
            >
              <KText variant="labelCaps" style={styles.chipName} numberOfLines={1}>
                {shortLooseLabel(product.name)}
              </KText>
              <KText variant="priceLine" style={styles.chipPrice}>
                ₹{product.price.toFixed(0)}
              </KText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <LooseCalculatorModal
        visible={quickTap.calcModalVisible}
        product={quickTap.selectedProduct}
        displayUnit={quickTap.displayUnit}
        inputQty={quickTap.inputQty}
        inputAmt={quickTap.inputAmt}
        qtyShortcuts={quickTap.qtyShortcuts}
        amtShortcuts={quickTap.amtShortcuts}
        onClose={quickTap.closeCalculator}
        onQtyChange={quickTap.handleQtyChange}
        onAmtChange={quickTap.handleAmtChange}
        onToggleUnit={quickTap.toggleDisplayUnit}
        onAddToCart={quickTap.handleAddToCart}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stripContainer: {
    backgroundColor: KiranaColors.navy,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  stripContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    minWidth: 76,
    maxWidth: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: KiranaRadius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: KiranaBorder.hairline,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  chipTop: {
    borderColor: KiranaColors.primaryContainer,
    backgroundColor: 'rgba(255,153,51,0.18)',
  },
  chipName: {
    fontSize: 11,
    color: KiranaColors.surface,
    marginBottom: 1,
    textAlign: 'center',
  },
  chipPrice: {
    fontSize: 14,
    lineHeight: 16,
    color: KiranaColors.primaryContainer,
  },
});
