import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
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
            <Text style={styles.headerTitle}>Bill Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading receipt...</Text>
            </View>
          ) : lineItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found for this bill.</Text>
            </View>
          ) : (
            <FlatList
              data={lineItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>
                      {item.quantity} x ₹{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>₹{item.subtotal.toFixed(2)}</Text>
                </View>
              )}
            />
          )}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items:</Text>
              <Text style={styles.summaryValue}>{totalQuantity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bill Amount:</Text>
              <Text style={styles.summaryTotal}>₹{totalAmount.toFixed(2)}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#dfe6e9',
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#b2bec3',
  },
  listContainer: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  itemSub: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 4,
  },
  itemSubtotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  summaryBox: {
    padding: 24,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636e72',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  summaryTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#d63031',
  },
});
