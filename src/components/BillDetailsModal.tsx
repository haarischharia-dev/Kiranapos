import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import KText from './ui/KText';
import { openDatabase } from '../db/database';
import { getBillDetails, BillLineItem } from '../db/khataRepo';

interface BillDetailsModalProps {
  visible: boolean;
  billId: string | null;
  onClose: () => void;
}

export default function BillDetailsModal({ visible, billId, onClose }: BillDetailsModalProps) {
  const [lineItems, setLineItems] = useState<BillLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && billId) {
      fetchBillDetails();
    } else {
      setLineItems([]);
    }
  }, [visible, billId]);

  const fetchBillDetails = async () => {
    setIsLoading(true);
    try {
      const db = await openDatabase();
      const items = await getBillDetails(db, billId!);
      setLineItems(items);
    } catch (err) {
      console.error('Failed to fetch bill details', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.header}>
            <KText variant="headlineMd" style={styles.headerTitle}>Bill Details</KText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <KText variant="labelCaps" style={styles.closeBtnText}>Done</KText>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.emptyContainer}>
              <KText variant="bodyMd" style={styles.emptyText}>Loading receipt...</KText>
            </View>
          ) : lineItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <KText variant="bodyMd" style={styles.emptyText}>No items found for this bill.</KText>
            </View>
          ) : (
            <FlatList
              data={lineItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <KText variant="bodyMd" style={styles.itemName}>{item.name}</KText>
                    <KText variant="bodyMd" style={styles.itemSub}>
                      {item.quantity} x ₹{item.price.toFixed(2)}
                    </KText>
                  </View>
                  <KText variant="priceLine" style={styles.itemSubtotal}>₹{item.subtotal.toFixed(2)}</KText>
                </View>
              )}
            />
          )}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <KText variant="bodyMd" style={styles.summaryLabel}>Total Items:</KText>
              <KText variant="priceSub" style={styles.summaryValue}>{totalQuantity}</KText>
            </View>
            <View style={styles.summaryRow}>
              <KText variant="bodyMd" style={styles.summaryLabel}>Bill Amount:</KText>
              <KText variant="priceDisplay" style={styles.summaryTotal}>₹{totalAmount.toFixed(2)}</KText>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: KiranaColors.modalBackdrop,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: KiranaColors.surface,
    borderTopLeftRadius: KiranaRadius.xl,
    borderTopRightRadius: KiranaRadius.xl,
    borderWidth: KiranaBorder.focus,
    borderColor: KiranaColors.navy,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: KiranaSpacing.marginPage,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  headerTitle: {
    color: KiranaColors.onSurface,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: KiranaColors.primaryContainer,
    borderRadius: KiranaRadius.sm,
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.navy,
  },
  closeBtnText: {
    color: KiranaColors.navy,
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: KiranaColors.outline,
  },
  listContainer: {
    padding: KiranaSpacing.gutter,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontFamily: 'WorkSans_600SemiBold',
    color: KiranaColors.onSurface,
  },
  itemSub: {
    color: KiranaColors.onSurfaceVariant,
    marginTop: 4,
  },
  itemSubtotal: {
    color: KiranaColors.onSurface,
  },
  summaryBox: {
    padding: KiranaSpacing.marginPage,
    backgroundColor: KiranaColors.surfaceDim,
    borderTopWidth: KiranaBorder.hairline,
    borderTopColor: KiranaColors.outlineVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: 'WorkSans_600SemiBold',
    color: KiranaColors.onSurfaceVariant,
  },
  summaryValue: {
    color: KiranaColors.onSurface,
  },
  summaryTotal: {
    color: KiranaColors.owed,
    fontSize: 28,
  },
});
