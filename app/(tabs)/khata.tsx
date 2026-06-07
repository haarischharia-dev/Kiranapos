import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Customer } from '../../src/types/db';
import { openDatabase } from '../../src/db/database';
import { getKhataBalances } from '../../src/db/khataRepo';
import KhataHistory from '../../src/components/KhataHistory';
import CollectPaymentModal from '../../src/components/CollectPaymentModal';
import { sendKhataReminder } from '../../src/utils/whatsapp';
import Skeleton from '../../src/components/Skeleton';
import { useDelayedLoading } from '../../src/hooks/useDelayedLoading';

export default function KhataScreen() {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [collectFrom, setCollectFrom] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDelayedLoading = useDelayedLoading(isLoading);

  const refreshBalances = async () => {
    setIsLoading(true);
    try {
      const db = await openDatabase();
      const results = await getKhataBalances(db);
      setDebtors(results);
    } catch (err) {
      console.error('Failed to fetch khata balances', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!activeCustomerId) {
        refreshBalances();
      }
    }, [activeCustomerId])
  );

  const handleCollected = () => {
    setCollectFrom(null);
    refreshBalances();
  };

  if (activeCustomerId) {
    return (
      <KhataHistory 
        customerId={activeCustomerId} 
        onBack={() => setActiveCustomerId(null)} 
      />
    );
  }

  const totalOutstanding = debtors.reduce((sum, c) => sum + c.outstanding_balance, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Digital Khata</Text>
        <Text style={styles.headerSub}>Total Outstanding Due</Text>
        <Text style={styles.totalValue}>₹{totalOutstanding.toFixed(2)}</Text>
      </View>

      {isDelayedLoading ? (
        <View style={styles.listContainer}>
          <Skeleton height={120} width="100%" radius={16} />
          <View style={{ height: 12 }} />
          <Skeleton height={120} width="100%" radius={16} />
          <View style={{ height: 12 }} />
          <Skeleton height={120} width="100%" radius={16} />
        </View>
      ) : debtors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No outstanding dues.</Text>
          <Text style={styles.emptySub}>All customers are settled up!</Text>
        </View>
      ) : (
        <FlatList
          data={debtors}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => setActiveCustomerId(item.id)}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardInfo}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                </View>
                <View style={styles.cardAmount}>
                  <Text style={styles.dueLabel}>DUE</Text>
                  <Text style={styles.dueValue}>₹{item.outstanding_balance.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.collectButton}
                  activeOpacity={0.8}
                  onPress={() => setCollectFrom(item)}
                >
                  <Text style={styles.collectButtonText}>Collect Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.remindButton}
                  activeOpacity={0.8}
                  onPress={() => sendKhataReminder(item.phone, item.name, item.outstanding_balance)}
                >
                  <Text style={styles.remindButtonText}>Remind on WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <CollectPaymentModal
        visible={!!collectFrom}
        customer={collectFrom}
        onClose={() => setCollectFrom(null)}
        onCollected={handleCollected}
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
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 16,
  },
  headerSub: {
    fontSize: 14,
    color: '#636e72',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#d63031',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b2bec3',
  },
  emptySub: {
    fontSize: 14,
    color: '#dfe6e9',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#d63031',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  customerPhone: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 4,
  },
  cardAmount: {
    alignItems: 'flex-end',
  },
  dueLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff7675',
    letterSpacing: 1,
  },
  dueValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#d63031',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  collectButton: {
    flex: 1,
    backgroundColor: '#00b894',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  collectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  remindButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  remindButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
