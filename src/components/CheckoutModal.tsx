import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

interface CheckoutModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onFullyPaid: () => void;
  onAddToKhata: (remainingDebt: number) => void;
  onShowUpi: (amount: number) => void;
}

export default function CheckoutModal({ visible, totalAmount, onClose, onFullyPaid, onAddToKhata, onShowUpi }: CheckoutModalProps) {
  const [paidNow, setPaidNow] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPaidNow('');
    }
  }, [visible]);

  const paidAmount = parseFloat(paidNow) || 0;
  const remainingDebt = Math.max(0, totalAmount - paidAmount);

  const handleCashPaid = () => {
    console.log("🖨️ Printing Bill...");
    onFullyPaid();
  };

  const handleUpiPress = () => {
    // Show UPI QR for the paidNow amount
    onShowUpi(paidAmount || totalAmount);
  };

  const handleAddToKhataAction = () => {
    onAddToKhata(remainingDebt);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalContent}>
          <Text style={styles.headerTitle}>Checkout</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Bill</Text>
            <Text style={styles.billValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount Paid Now (Cash/UPI)</Text>
            <TextInput
              style={styles.amountInput}
              value={paidNow}
              onChangeText={setPaidNow}
              keyboardType="numeric"
              placeholder="0.00"
              autoFocus={true}
            />
          </View>

          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>Remaining Debt</Text>
            <Text style={styles.debtValue}>₹{remainingDebt.toFixed(2)}</Text>
          </View>

          {remainingDebt <= 0 ? (
            <View style={styles.splitBtnRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.cashBtn]} onPress={handleCashPaid} activeOpacity={0.8}>
                <Text style={styles.actionBtnText}>Pay Cash</Text>
              </TouchableOpacity>
              <View style={styles.spacer} />
              <TouchableOpacity style={[styles.actionBtn, styles.upiBtn]} onPress={handleUpiPress} activeOpacity={0.8}>
                <Text style={styles.actionBtnText}>Show UPI QR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.khataBtn]} onPress={handleAddToKhataAction} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Add ₹{remainingDebt.toFixed(2)} to Khata</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  billLabel: {
    fontSize: 20,
    color: '#636e72',
    fontWeight: '600',
  },
  billValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2d3436',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00b894',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountInput: {
    backgroundColor: '#f5f6fa',
    borderWidth: 2,
    borderColor: '#00b894',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3436',
    textAlign: 'center',
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  debtLabel: {
    fontSize: 18,
    color: '#636e72',
    fontWeight: '600',
  },
  debtValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d63031',
  },
  splitBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  spacer: {
    width: 12,
  },
  cashBtn: {
    backgroundColor: '#00b894',
  },
  upiBtn: {
    backgroundColor: '#0984e3',
  },
  khataBtn: {
    backgroundColor: '#d63031',
    width: '100%',
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#636e72',
    fontSize: 16,
    fontWeight: '600',
  },
});
