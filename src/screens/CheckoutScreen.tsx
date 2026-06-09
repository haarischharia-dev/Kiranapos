import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import KText from '../components/ui/KText';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import ReceiptPreview from '../components/ReceiptPreview';
import { useCartStore } from '../store/cartStore';
import CustomerPickerModal from '../components/CustomerPickerModal';
import UPIPaymentModal from '../components/UPIPaymentModal';
import { buildSmartReceipt } from '../utils/receiptBuilder';
import { openDatabase } from '../db/database';
import { ensureBluetoothIsOn } from '../utils/bleManager';
import { track } from '../utils/telemetry';

export default function CheckoutScreen() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);

  const [isUpiModalVisible, setUpiModalVisible] = useState(false);
  const [isKhataModalVisible, setKhataModalVisible] = useState(false);

  // Unified finalize sale method
  const finalizeSale = async (method: 'cash' | 'upi' | 'khata', customerId?: string) => {
    console.log(`Sale Finalized! Method: ${method}, Total: ${total}`);

    let success = false;
    
    // SQLite Sale Persistence
    if (method === 'cash' || method === 'upi') {
      try {
        const db = await openDatabase();
        const saleId = Math.random().toString(36).substring(2, 15);
        const now = new Date().toISOString(); // Explicitly ISO standard for robust SQLite querying
        
        await db.withTransactionAsync(async () => {
          await db.runAsync(
            'INSERT INTO sales (id, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?)',
            [saleId, total, method, now]
          );
          for (const item of items) {
            const saleItemId = Math.random().toString(36).substring(2, 15);
            const subtotal = item.product.price * item.quantity;
            await db.runAsync(
              'INSERT INTO sale_items (id, sale_id, product_id, quantity, subtotal) VALUES (?, ?, ?, ?, ?)',
              [saleItemId, saleId, item.product.id, item.quantity, subtotal]
            );
          }
        });

        // Only fires after the sale + line items commit successfully.
        track('Checkout_Completed', { amount: total });
        success = true;
      } catch (err) {
        console.error("Failed to save sale to DB", err);
        success = false;
      }
    } else if (method === 'khata') {
      // CustomerPickerModal handles DB save automatically
      success = true;
    }

    if (!success) {
      alert("Failed to save bill. Please try again.");
      return;
    }

    // Build the printable receipt before the cart is cleared.
    if (method === 'cash') {
      const isReady = await ensureBluetoothIsOn();
      if (isReady) {
        const receiptItems = items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }));
        const receiptBytes = buildSmartReceipt(receiptItems, total);
        console.log("🖨️ Receipt Bytes Generated! Length:", receiptBytes.length);
      }
    }

    // Clear the cart
    clearCart();
    
    // Close modals
    setUpiModalVisible(false);
    setKhataModalVisible(false);

    // Note: Eventually call the print engine here (or handle inside Khata repos)
  };

  const handleCash = () => {
    finalizeSale('cash');
  };
  
  const handleUpi = () => {
    setUpiModalVisible(true);
  };
  
  const handleKhata = () => {
    setKhataModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Half: Scrollable Receipt Preview */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {items.length === 0 ? (
          <KText variant="bodyMd" style={styles.emptyText}>Cart is empty</KText>
        ) : (
          <ReceiptPreview cartItems={items} total={total} />
        )}
      </ScrollView>

      {/* Bottom Half: Fixed Footer with 3-Way Tender */}
      <View style={styles.footer}>
        <KText variant="labelCaps" style={styles.tenderLabel}>Select Payment Method</KText>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            testID="checkout-cash-btn"
            style={[styles.tenderBtn, styles.cashBtn]} 
            onPress={handleCash}
            disabled={items.length === 0}
          >
            <KText variant="labelCaps" style={styles.tenderBtnText}>Cash</KText>
          </TouchableOpacity>
          <TouchableOpacity 
            testID="checkout-upi-btn"
            style={[styles.tenderBtn, styles.upiBtn]} 
            onPress={handleUpi}
            disabled={items.length === 0}
          >
            <KText variant="labelCaps" style={styles.tenderBtnText}>UPI</KText>
          </TouchableOpacity>
          <TouchableOpacity 
            testID="checkout-khata-btn"
            style={[styles.tenderBtn, styles.khataBtn]} 
            onPress={handleKhata}
            disabled={items.length === 0}
          >
            <KText variant="labelCaps" style={styles.tenderBtnText}>Khata</KText>
          </TouchableOpacity>
        </View>
      </View>

      <UPIPaymentModal
        visible={isUpiModalVisible}
        totalAmount={total}
        onClose={() => setUpiModalVisible(false)}
        onMarkPaid={() => finalizeSale('upi')}
      />

      <CustomerPickerModal
        visible={isKhataModalVisible}
        remainingDebt={total} // Using the full total as the remaining debt
        cartItems={items}
        onClose={() => setKhataModalVisible(false)}
        onComplete={() => finalizeSale('khata')} // CustomerPickerModal handles DB save automatically
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  scrollContent: {
    paddingVertical: KiranaSpacing.marginPage,
    paddingHorizontal: KiranaSpacing.gutter,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: KiranaColors.onSurfaceVariant,
  },
  footer: {
    backgroundColor: KiranaColors.surface,
    padding: KiranaSpacing.marginPage,
    borderTopWidth: KiranaBorder.card,
    borderTopColor: KiranaColors.outlineVariant,
  },
  tenderLabel: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  tenderBtn: {
    flex: 1,
    minHeight: KiranaSpacing.touchMin,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: KiranaBorder.card,
  },
  cashBtn: {
    backgroundColor: KiranaColors.success,
    borderColor: KiranaColors.success,
  },
  upiBtn: {
    backgroundColor: KiranaColors.tertiary,
    borderColor: KiranaColors.tertiary,
  },
  khataBtn: {
    backgroundColor: KiranaColors.primaryContainer,
    borderColor: KiranaColors.onPrimaryContainer,
  },
  tenderBtnText: {
    color: KiranaColors.onPrimary,
    fontSize: 13,
  },
});
