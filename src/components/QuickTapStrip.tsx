import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { openDatabase } from '../db/database';
import { topLooseItems } from '../db/productRepo';
import { Product } from '../types/db';
import { useLooseQuickTap } from '../hooks/useLooseQuickTap';
import LooseCalculatorModal from './LooseCalculatorModal';

function shortLooseLabel(name: string): string {
  const stripped = name.replace(/\s*\([\d.]+\s+\w+\)$/i, '').trim();
  return stripped.length > 14 ? `${stripped.slice(0, 13)}…` : stripped || name;
}

interface QuickTapStripProps {
  /** Bumped when cart/grid tab changes so the strip picks up new loose items. */
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
    }, [fetchItems])
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
              <Text style={styles.chipName} numberOfLines={1}>
                {shortLooseLabel(product.name)}
              </Text>
              <Text style={styles.chipPrice}>₹{product.price.toFixed(0)}</Text>
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
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  stripContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    minWidth: 72,
    maxWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1f2933',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
  },
  chipTop: {
    borderColor: '#00b894',
    backgroundColor: '#163d34',
  },
  chipName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f5f5f5',
    marginBottom: 2,
    textAlign: 'center',
  },
  chipPrice: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00b894',
  },
});
