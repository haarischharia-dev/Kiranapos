import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { CartItem } from '../store/cartStore';

interface ReceiptPreviewProps {
  cartItems: CartItem[];
  total: number;
}

export default function ReceiptPreview({ cartItems, total }: ReceiptPreviewProps) {
  const dateStr = new Date().toLocaleString();

  return (
    <View style={styles.container}>
      <View style={styles.receiptPaper}>
        {/* Top jagged edge simulated by dashed border in styling */}
        <Text style={styles.shopName}>KIRANA STORE</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
        <Text style={styles.divider}>--------------------------------</Text>
        
        {cartItems.map((item) => {
          const subtotal = item.quantity * item.product.price;
          return (
            <View key={item.product.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemCalc}>
                {item.quantity} x {item.product.price.toFixed(2)} = {subtotal.toFixed(2)}
              </Text>
            </View>
          );
        })}

        <Text style={styles.divider}>--------------------------------</Text>
        <Text style={styles.totalText}>Total: Rs. {total.toFixed(2)}</Text>
        
        <View style={styles.footerSpacing} />
      </View>
    </View>
  );
}

const fontFamily = Platform.select({ ios: 'Courier', android: 'monospace' });

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  receiptPaper: {
    backgroundColor: '#fffdf5', // slight off-white/yellowish paper color
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#b2bec3',
  },
  shopName: {
    fontFamily,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2d3436',
  },
  dateText: {
    fontFamily,
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 8,
    color: '#636e72',
  },
  divider: {
    fontFamily,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
    color: '#2d3436',
  },
  itemRow: {
    marginBottom: 8,
  },
  itemName: {
    fontFamily,
    fontSize: 14,
    textAlign: 'left',
    color: '#2d3436',
  },
  itemCalc: {
    fontFamily,
    fontSize: 14,
    textAlign: 'right',
    marginTop: 2,
    color: '#2d3436',
  },
  totalText: {
    fontFamily,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 8,
    color: '#2d3436',
  },
  footerSpacing: {
    height: 16,
  },
});
