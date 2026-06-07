import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { openDatabase } from '../db/database';
import { getKhataHistory } from '../db/khataRepo';
import { KhataEntry } from '../types/db';
import BillDetailsModal from './BillDetailsModal';

interface KhataHistoryProps {
  customerId?: string | null;
  onBack: () => void;
}

export default function KhataHistory({ customerId, onBack }: KhataHistoryProps) {
  const [history, setHistory] = useState<KhataEntry[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  useEffect(() => {
    // Guard: never run the query with an undefined/null customerId.
    // Passing undefined into the SQL bind params can crash the native bridge.
    if (!customerId) {
      setHistory([]);
      return;
    }
    fetchHistory(customerId);
  }, [customerId]);

  const fetchHistory = async (id: string) => {
    try {
      const db = await openDatabase();
      const results = await getKhataHistory(db, id);
      setHistory(results);
    } catch (err) {
      console.error('Failed to fetch khata history', err);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  };

  const handleRowPress = (entry: KhataEntry) => {
    if (entry.entry_type === 'debit') {
      setSelectedBillId(entry.id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.spacer} />
      </View>

      {!customerId ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No customer selected.</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transaction history.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isDebit = item.entry_type === 'debit';
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={isDebit ? 0.7 : 1}
                onPress={() => handleRowPress(item)}
              >
                <View style={styles.cardInfo}>
                  <Text style={[styles.typeLabel, isDebit ? styles.labelDebit : styles.labelCredit]}>
                    {isDebit ? 'Sale Bill' : 'Payment Received'}
                  </Text>
                  <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  {isDebit && <Text style={styles.tapToView}>Tap to view items</Text>}
                </View>
                <View style={styles.cardAmount}>
                  <Text style={[styles.amountValue, isDebit ? styles.amountDebit : styles.amountCredit]}>
                    {isDebit ? '+' : '-'}₹{item.amount.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <BillDetailsModal
        visible={!!selectedBillId}
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
  },
  backBtn: {
    padding: 8,
    width: 80,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0984e3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  spacer: {
    width: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b2bec3',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  labelDebit: {
    color: '#d63031',
  },
  labelCredit: {
    color: '#00b894',
  },
  dateText: {
    fontSize: 14,
    color: '#636e72',
  },
  tapToView: {
    fontSize: 12,
    color: '#0984e3',
    marginTop: 6,
    fontWeight: '600',
  },
  cardAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  amountDebit: {
    color: '#d63031',
  },
  amountCredit: {
    color: '#00b894',
  },
});
