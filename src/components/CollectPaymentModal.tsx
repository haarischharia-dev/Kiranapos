import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import KText from './ui/KText';
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
          <KText variant="headlineMd" style={styles.headerTitle}>Collect Payment</KText>

          {customer && (
            <>
              <KText variant="headlineMd" style={styles.customerName}>{customer.name}</KText>
              <KText variant="labelCaps" style={styles.outstandingLabel}>Outstanding Due</KText>
              <KText variant="priceDisplay" style={styles.outstandingValue}>₹{outstanding.toFixed(2)}</KText>

              <KText variant="bodyMd" style={styles.inputLabel}>Amount Received</KText>
              <View style={styles.inputRow}>
                <KText variant="priceSub" style={styles.currencySymbol}>₹</KText>
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
                <KText variant="bodyMd" style={styles.fullBtnText}>Full Amount (₹{outstanding.toFixed(2)})</KText>
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
                  <KText variant="labelCaps" style={styles.confirmBtnText}>Record Payment</KText>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
            <KText variant="bodyMd" style={styles.cancelBtnText}>Cancel</KText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: KiranaColors.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: KiranaColors.surface,
    width: '90%',
    borderRadius: KiranaRadius.xl,
    borderWidth: KiranaBorder.focus,
    borderColor: KiranaColors.navy,
    padding: KiranaSpacing.marginPage,
    alignItems: 'center',
  },
  headerTitle: {
    color: KiranaColors.onSurface,
    marginBottom: 16,
  },
  customerName: {
    color: KiranaColors.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  outstandingLabel: {
    color: KiranaColors.owed,
    fontSize: 10,
  },
  outstandingValue: {
    color: KiranaColors.owed,
    fontSize: 32,
    marginTop: 2,
    marginBottom: 24,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 16,
    backgroundColor: KiranaColors.surfaceDim,
  },
  currencySymbol: {
    color: KiranaColors.onSurface,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'JetBrainsMono_700Bold',
    color: KiranaColors.onSurface,
    paddingVertical: 14,
  },
  fullBtn: {
    backgroundColor: KiranaColors.surfaceDim,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    width: '100%',
    paddingVertical: 14,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    marginBottom: 20,
  },
  fullBtnText: {
    color: KiranaColors.onSurface,
    fontFamily: 'WorkSans_600SemiBold',
  },
  confirmBtn: {
    backgroundColor: KiranaColors.settled,
    width: '100%',
    paddingVertical: 18,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.navy,
  },
  confirmBtnDisabled: {
    backgroundColor: KiranaColors.outlineVariant,
  },
  confirmBtnText: {
    color: KiranaColors.onPrimary,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: KiranaColors.onSurfaceVariant,
    fontFamily: 'WorkSans_600SemiBold',
  },
});
