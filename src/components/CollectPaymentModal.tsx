import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Customer } from '../types/db';
import { openDatabase } from '../db/database';
import { addKhataEntry } from '../db/khataRepo';

interface CollectPaymentModalProps {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onCollected: () => void;
}

export default function CollectPaymentModal({
  visible,
  customer,
  onClose,
  onCollected,
}: CollectPaymentModalProps) {
  const outstanding = customer?.outstanding_balance ?? 0;
  const [amountText, setAmountText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill with the full outstanding balance each time the modal opens for a customer.
  useEffect(() => {
    if (visible && customer) {
      setAmountText(outstanding > 0 ? String(outstanding.toFixed(2)) : '');
    }
  }, [visible, customer]);

  const parsedAmount = parseFloat(amountText);
  const isValid =
    !Number.isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= outstanding;

  const handleConfirm = async () => {
    if (!customer || !isValid || isSaving) return;

    setIsSaving(true);
    try {
      const db = await openDatabase();
      // 'credit' reduces the outstanding balance and fires Khata_Recovered telemetry
      // from the repository layer once the transaction commits.
      await addKhataEntry(db, customer.id, parsedAmount, 'credit');
      onCollected();
    } catch (err) {
      console.error('Failed to record khata payment', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.headerTitle}>Collect Payment</Text>

          {customer && (
            <>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.outstandingLabel}>Outstanding Due</Text>
              <Text style={styles.outstandingValue}>₹{outstanding.toFixed(2)}</Text>

              <Text style={styles.inputLabel}>Amount Received</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#b2bec3"
                  editable={!isSaving}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.fullBtn}
                activeOpacity={0.8}
                onPress={() => setAmountText(String(outstanding.toFixed(2)))}
                disabled={isSaving}
              >
                <Text style={styles.fullBtnText}>Full Amount (₹{outstanding.toFixed(2)})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, (!isValid || isSaving) && styles.confirmBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleConfirm}
                disabled={!isValid || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Record Payment</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2d3436',
    marginBottom: 12,
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff7675',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  outstandingValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#d63031',
    marginTop: 2,
    marginBottom: 24,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dcdde1',
    borderRadius: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2d3436',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#2d3436',
    paddingVertical: 14,
  },
  fullBtn: {
    backgroundColor: '#f1f2f6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  fullBtnText: {
    color: '#2d3436',
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#00b894',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmBtnDisabled: {
    backgroundColor: '#b2bec3',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
