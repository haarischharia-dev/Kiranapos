import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, TextInput } from 'react-native';
import StoreHeader from '../../src/components/ui/StoreHeader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from 'expo-router';
import { Customer } from '../../src/types/db';
import { openDatabase } from '../../src/db/database';
import { getKhataBalances } from '../../src/db/khataRepo';
import KhataHistory from '../../src/components/KhataHistory';
import CollectPaymentModal from '../../src/components/CollectPaymentModal';
import { sendKhataReminder } from '../../src/utils/whatsapp';
import Skeleton from '../../src/components/Skeleton';
import { useDelayedLoading } from '../../src/hooks/useDelayedLoading';
import KText from '../../src/components/ui/KText';
import KButton from '../../src/components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

const AVATAR_COLORS = [
  KiranaColors.avatarOrange,
  KiranaColors.avatarBlue,
  KiranaColors.avatarTeal,
  KiranaColors.secondaryContainer,
];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function KhataScreen() {
  const [debtors, setDebtors] = useState<Customer[]>([]);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [collectFrom, setCollectFrom] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    }, [activeCustomerId]),
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
  const activeCount = debtors.filter((c) => c.outstanding_balance > 0).length;
  const filtered = debtors.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <StoreHeader />
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={KiranaColors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Customer Name..."
          placeholderTextColor={KiranaColors.outline}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <KText variant="labelCaps" style={styles.summaryLabel}>Total Collectable</KText>
          <KText variant="priceDisplay" style={styles.summaryOwed}>
            ₹{totalOutstanding.toFixed(0)}
          </KText>
        </View>
        <View style={styles.summaryCard}>
          <KText variant="labelCaps" style={styles.summaryLabel}>Active Customers</KText>
          <KText variant="priceDisplay" style={styles.summaryCount}>
            {activeCount}
          </KText>
        </View>
      </View>

      {isDelayedLoading ? (
        <View style={styles.listContainer}>
          <Skeleton height={110} width="100%" radius={8} />
          <View style={{ height: 12 }} />
          <Skeleton height={110} width="100%" radius={8} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <KText variant="headlineMd" style={styles.emptyText}>No outstanding dues</KText>
          <KText variant="bodyMd" style={styles.emptySub}>All customers are settled up</KText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, index }) => {
            const owed = item.outstanding_balance;
            const isSettled = owed <= 0;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setActiveCustomerId(item.id)}
              >
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                  <KText variant="labelCaps" style={styles.avatarText}>{initials(item.name)}</KText>
                </View>

                <View style={styles.cardBody}>
                  <KText variant="bodyMd" style={styles.customerName}>{item.name}</KText>
                  <KText variant="labelCaps" style={styles.updatedLabel}>Last updated · today</KText>
                  <View style={styles.amountRow}>
                    <KText variant="priceSub" style={isSettled ? styles.settled : styles.owed}>
                      ₹{owed.toFixed(0)} {isSettled ? 'settled' : 'owed'}
                    </KText>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.waBtn, isSettled && styles.waBtnDisabled]}
                  onPress={() => !isSettled && sendKhataReminder(item.phone, item.name, owed)}
                  disabled={isSettled}
                >
                  <MaterialIcons
                    name="chat"
                    size={20}
                    color={isSettled ? KiranaColors.outline : KiranaColors.settled}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {debtors.some((c) => c.outstanding_balance > 0) ? (
        <View style={styles.footer}>
          <KButton
            label="Collect Payment"
            onPress={() => {
              const firstDue = debtors.find((c) => c.outstanding_balance > 0);
              if (firstDue) setCollectFrom(firstDue);
            }}
            height={64}
          />
        </View>
      ) : null}

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
    backgroundColor: KiranaColors.background,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: KiranaSpacing.gutter,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    backgroundColor: KiranaColors.surface,
    paddingHorizontal: 12,
    minHeight: KiranaSpacing.touchMin,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'WorkSans_400Regular',
    fontSize: 16,
    color: KiranaColors.onSurface,
    paddingVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: KiranaSpacing.gutter,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    padding: 14,
    gap: 4,
  },
  summaryLabel: {
    color: KiranaColors.onSurfaceVariant,
    fontSize: 10,
  },
  summaryOwed: {
    color: KiranaColors.owed,
    fontSize: 28,
    lineHeight: 34,
  },
  summaryCount: {
    color: KiranaColors.primary,
    fontSize: 28,
    lineHeight: 34,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: KiranaColors.onSurfaceVariant,
  },
  emptySub: {
    color: KiranaColors.outline,
  },
  listContainer: {
    paddingHorizontal: KiranaSpacing.gutter,
    paddingBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: KiranaRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.onSurface,
  },
  avatarText: {
    color: KiranaColors.navy,
    fontSize: 14,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 17,
    color: KiranaColors.onSurface,
  },
  updatedLabel: {
    color: KiranaColors.outline,
    fontSize: 9,
  },
  amountRow: {
    marginTop: 4,
  },
  owed: {
    color: KiranaColors.owed,
    fontSize: 18,
  },
  settled: {
    color: KiranaColors.settled,
    fontSize: 18,
  },
  waBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.settled,
    borderRadius: KiranaRadius.sm,
    backgroundColor: KiranaColors.surface,
  },
  waBtnDisabled: {
    borderColor: KiranaColors.outlineVariant,
    opacity: 0.5,
  },
  footer: {
    padding: KiranaSpacing.gutter,
    gap: 8,
    borderTopWidth: KiranaBorder.hairline,
    borderTopColor: KiranaColors.outlineVariant,
    backgroundColor: KiranaColors.surface,
  },
  collectBtn: {
    backgroundColor: KiranaColors.primaryContainer,
  },
});
