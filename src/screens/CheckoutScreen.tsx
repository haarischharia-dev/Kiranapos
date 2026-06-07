import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
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
          <Text style={styles.emptyText}>Cart is empty</Text>
        ) : (
          <ReceiptPreview cartItems={items} total={total} />
        )}
      </ScrollView>

      {/* Bottom Half: Fixed Footer with 3-Way Tender */}
      <View style={styles.footer}>
        <Text style={styles.tenderLabel}>Select Payment Method</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            testID="checkout-cash-btn"
            style={[styles.tenderBtn, styles.cashBtn]} 
            onPress={handleCash}
            disabled={items.length === 0}
          >
            <Text style={styles.tenderBtnText}>💵 Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            testID="checkout-upi-btn"
            style={[styles.tenderBtn, styles.upiBtn]} 
            onPress={handleUpi}
            disabled={items.length === 0}
          >
            <Text style={styles.tenderBtnText}>📱 UPI</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            testID="checkout-khata-btn"
            style={[styles.tenderBtn, styles.khataBtn]} 
            onPress={handleKhata}
            disabled={items.length === 0}
          >
            <Text style={styles.tenderBtnText}>📖 Khata</Text>
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
    backgroundColor: '#f5f6fa',
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#636e72',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#dcdde1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tenderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tenderBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cashBtn: {
    backgroundColor: '#00b894',
  },
  upiBtn: {
    backgroundColor: '#0984e3',
  },
  khataBtn: {
    backgroundColor: '#d63031',
  },
  tenderBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
