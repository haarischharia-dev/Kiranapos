import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNetworkState } from 'expo-network';

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
              <ActivityIndicator size="small" color="#0984e3" style={{ marginBottom: 8 }} />
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
    marginBottom: 20,
  },
  scanText: {
    fontSize: 16,
    color: '#666',
  },
  amountText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00b894',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  subText: {
    fontSize: 14,
    color: '#888',
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
    color: '#0984e3',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  forcePrintBtn: {
    backgroundColor: '#dfe6e9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  forcePrintText: {
    color: '#636e72',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paidBtn: {
    backgroundColor: '#00b894',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  paidBtnText: {
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
