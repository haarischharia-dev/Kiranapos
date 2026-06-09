import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CartItem } from '../store/cartStore';
import { getShopNameReceipt } from '../utils/shopName';
import { KiranaBorder, KiranaColors, KiranaRadius } from '@/constants/kirana-design';
import KText from './ui/KText';

interface ReceiptPreviewProps {
  cartItems: CartItem[];
  total: number;
}

const mono = Platform.select({ ios: 'JetBrainsMono_500Medium', android: 'JetBrainsMono_500Medium' });

export default function ReceiptPreview({ cartItems, total }: ReceiptPreviewProps) {
  const dateStr = new Date().toLocaleString();

  return (
    <View style={styles.container}>
      <View style={styles.receiptPaper}>
        <KText variant="headlineMd" style={styles.shopName}>
          {getShopNameReceipt()}
        </KText>
        <KText variant="bodyMd" style={[styles.mono, styles.dateText]}>{dateStr}</KText>
        <KText variant="bodyMd" style={[styles.mono, styles.divider]}>--------------------------------</KText>

        {cartItems.map((item) => {
          const subtotal = item.quantity * item.product.price;
          return (
            <View key={item.product.id} style={styles.itemRow}>
              <KText variant="bodyMd" style={[styles.mono, styles.itemName]}>{item.product.name}</KText>
              <KText variant="bodyMd" style={[styles.mono, styles.itemCalc]}>
                {item.quantity} x {item.product.price.toFixed(2)} = {subtotal.toFixed(2)}
              </KText>
            </View>
          );
        })}

        <KText variant="bodyMd" style={[styles.mono, styles.divider]}>--------------------------------</KText>
        <KText variant="priceSub" style={[styles.mono, styles.totalText]}>
          Total: Rs. {total.toFixed(2)}
        </KText>

        <View style={styles.footerSpacing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  receiptPaper: {
    backgroundColor: KiranaColors.surface,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    borderStyle: 'dashed',
  },
  shopName: {
    textAlign: 'center',
    marginBottom: 8,
    color: KiranaColors.onSurface,
  },
  mono: {
    fontFamily: mono,
  },
  dateText: {
    textAlign: 'left',
    marginBottom: 8,
    color: KiranaColors.onSurfaceVariant,
  },
  divider: {
    textAlign: 'center',
    marginVertical: 8,
    color: KiranaColors.onSurface,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemName: {
    textAlign: 'left',
    color: KiranaColors.onSurface,
  },
  itemCalc: {
    textAlign: 'right',
    marginTop: 2,
    color: KiranaColors.onSurface,
  },
  totalText: {
    textAlign: 'right',
    marginTop: 8,
    color: KiranaColors.onSurface,
  },
  footerSpacing: {
    height: 16,
  },
});
