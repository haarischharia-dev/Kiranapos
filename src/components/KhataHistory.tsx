import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import KText from './ui/KText';
import { openDatabase } from '../db/database';
import { getKhataHistory } from '../db/khataRepo';
import { KhataEntry } from '../types/db';
import BillDetailsModal from './BillDetailsModal';

interface KhataHistoryProps {
  customerId?: string | null;
  onBack: () => void;
}

export default function KhataHistory({ customerId, onBack }: KhataHistoryProps) {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.headerBox, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <KText variant="bodyMd" style={styles.backBtnText}>← Back</KText>
        </TouchableOpacity>
        <KText variant="headlineMd" style={styles.headerTitle}>Transaction History</KText>
        <View style={styles.spacer} />
      </View>

      {!customerId ? (
        <View style={styles.emptyContainer}>
          <KText variant="bodyMd" style={styles.emptyText}>No customer selected.</KText>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <KText variant="bodyMd" style={styles.emptyText}>No transaction history.</KText>
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
                  <KText variant="bodyMd" style={[styles.typeLabel, isDebit ? styles.labelDebit : styles.labelCredit]}>
                    {isDebit ? 'Sale Bill' : 'Payment Received'}
                  </KText>
                  <KText variant="bodyMd" style={styles.dateText}>{formatDate(item.created_at)}</KText>
                  {isDebit ? (
                    <KText variant="labelCaps" style={styles.tapToView}>Tap to view items</KText>
                  ) : null}
                </View>
                <View style={styles.cardAmount}>
                  <KText variant="priceSub" style={[styles.amountValue, isDebit ? styles.amountDebit : styles.amountCredit]}>
                    {isDebit ? '+' : '-'}₹{item.amount.toFixed(2)}
                  </KText>
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
    backgroundColor: KiranaColors.background,
  },
  headerBox: {
    flexDirection: 'row',
    backgroundColor: KiranaColors.surface,
    paddingBottom: 16,
    paddingHorizontal: KiranaSpacing.gutter,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  backBtn: {
    padding: 8,
    width: 80,
  },
  backBtnText: {
    color: KiranaColors.primary,
    fontFamily: 'WorkSans_600SemiBold',
  },
  headerTitle: {
    color: KiranaColors.onSurface,
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
    color: KiranaColors.outline,
  },
  listContainer: {
    padding: KiranaSpacing.gutter,
  },
  card: {
    backgroundColor: KiranaColors.surface,
    borderRadius: KiranaRadius.md,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  typeLabel: {
    fontFamily: 'WorkSans_600SemiBold',
    marginBottom: 4,
  },
  labelDebit: {
    color: KiranaColors.owed,
  },
  labelCredit: {
    color: KiranaColors.settled,
  },
  dateText: {
    color: KiranaColors.onSurfaceVariant,
  },
  tapToView: {
    color: KiranaColors.primary,
    marginTop: 6,
    fontSize: 10,
  },
  cardAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 20,
  },
  amountDebit: {
    color: KiranaColors.owed,
  },
  amountCredit: {
    color: KiranaColors.settled,
  },
});
