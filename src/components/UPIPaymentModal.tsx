import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNetworkState } from 'expo-network';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import KText from './ui/KText';

interface UPIPaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onMarkPaid: () => void;
}

export default function UPIPaymentModal({ visible, totalAmount, onClose, onMarkPaid }: UPIPaymentModalProps) {
  const networkState = useNetworkState();
  const isOnline = networkState.isConnected !== false; // Treat null as online just in case

  const upiId = 'shopkeeper@upi';
  const payeeName = 'KiranaStore';
  const amountStr = totalAmount.toFixed(2);
  
  const upiIntentString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amountStr}&cu=INR`;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (visible && isOnline) {
      // Simulate 5s webhook callback
      timeout = setTimeout(() => {
        onMarkPaid();
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [visible, isOnline]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.headerTitle}>UPI Payment</Text>
          
          <Text style={styles.scanText}>Scan to pay</Text>
          <Text style={styles.amountText}>₹{amountStr}</Text>

          <View style={styles.qrContainer}>
            {visible && (
              <QRCode
                value={upiIntentString}
                size={250}
                backgroundColor="#ffffff"
                color="#000000"
              />
            )}
          </View>

          {isOnline ? (
            <View style={styles.listeningBox}>
              <ActivityIndicator size="small" color={KiranaColors.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.listeningText}>Listening for Bank Confirmation...</Text>
              
              <TouchableOpacity style={styles.forcePrintBtn} onPress={onMarkPaid} activeOpacity={0.8}>
                <Text style={styles.forcePrintText}>Force Print & Clear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.subText}>Offline: Tap Paid after checking your bank SMS/App.</Text>
              <TouchableOpacity style={styles.paidBtn} onPress={onMarkPaid} activeOpacity={0.8}>
                <Text style={styles.paidBtnText}>Mark as Paid (Offline Mode)</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
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
    marginBottom: 20,
  },
  scanText: {
    color: KiranaColors.onSurfaceVariant,
  },
  amountText: {
    fontSize: 42,
    fontFamily: 'JetBrainsMono_700Bold',
    color: KiranaColors.settled,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: KiranaColors.surface,
    borderRadius: KiranaRadius.lg,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    marginBottom: 24,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'WorkSans_400Regular',
    color: KiranaColors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  listeningBox: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  listeningText: {
    fontSize: 14,
    fontFamily: 'WorkSans_600SemiBold',
    color: KiranaColors.primary,
    marginBottom: 16,
  },
  forcePrintBtn: {
    backgroundColor: KiranaColors.surfaceDim,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    width: '100%',
    paddingVertical: 14,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
  },
  forcePrintText: {
    color: KiranaColors.onSurfaceVariant,
    fontSize: 14,
    fontFamily: 'WorkSans_600SemiBold',
  },
  paidBtn: {
    backgroundColor: KiranaColors.settled,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.navy,
    width: '100%',
    paddingVertical: 18,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    marginBottom: 12,
  },
  paidBtnText: {
    color: KiranaColors.onPrimary,
    fontSize: 16,
    fontFamily: 'ArchivoNarrow_700Bold',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: KiranaColors.onSurfaceVariant,
    fontSize: 16,
    fontFamily: 'WorkSans_600SemiBold',
  },
});
