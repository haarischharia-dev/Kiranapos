import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import KText from '../components/ui/KText';
import KButton from '../components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import { useFocusEffect } from 'expo-router';
import { fetchDayCloseSummary, DayCloseSummary } from '../utils/analytics';
import { writeBytesToPrinter } from '../utils/blePrinter';
import { EscPos } from '../utils/escpos';
import { storage } from '../db/seedImporter'; // Adjust if storage is exported elsewhere
import { ensureBluetoothIsOn } from '../utils/bleManager';
import { track } from '../utils/telemetry';
import Skeleton from '../components/Skeleton';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

export default function DayCloseScreen() {
  const [summary, setSummary] = useState<DayCloseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDelayedLoading = useDelayedLoading(isLoading);

  useEffect(() => {
    track('Day_Close_Viewed');
  }, []);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDayCloseSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load day close summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [])
  );

  const handleShare = async () => {
    if (!summary) return;
    const dateStr = new Date().toLocaleDateString();
    const template = `*Day Close Summary - ${dateStr}*\n\nTotal Revenue: Rs. ${summary.totalRevenue.toFixed(2)}\n- Cash: Rs. ${summary.cashSales.toFixed(2)}\n- UPI: Rs. ${summary.upiSales.toFixed(2)}\n- Khata Added: Rs. ${summary.khataSales.toFixed(2)}\n\nTotal Items Swiped: ${summary.itemCount}\n\n_Generated via KiranaPOS_`;
    
    const encoded = encodeURIComponent(template);
    
    try {
      await Linking.openURL('https://wa.me/?text=' + encoded);
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
  };

  const handlePrint = async () => {
    const isReady = await ensureBluetoothIsOn();
    if (!isReady) return;

    if (!summary) return;
    try {
      const bytes: number[] = [];
      const add = (data: number[]) => bytes.push(...data);
      
      add(EscPos.init());
      add(EscPos.alignCenter());
      add(EscPos.boldOn());
      add(EscPos.textSizeDouble());
      add(EscPos.text('DAY CLOSE SUMMARY\n'));
      add(EscPos.textSizeNormal());
      add(EscPos.boldOff());
      add(EscPos.feed());
      
      add(EscPos.alignLeft());
      add(EscPos.text(`Date: ${new Date().toLocaleString()}\n`));
      add(EscPos.text('--------------------------------\n'));
      
      add(EscPos.text(`Total Revenue: Rs. ${summary.totalRevenue.toFixed(2)}\n`));
      add(EscPos.text(`- Cash: Rs. ${summary.cashSales.toFixed(2)}\n`));
      add(EscPos.text(`- UPI: Rs. ${summary.upiSales.toFixed(2)}\n`));
      add(EscPos.text(`- Khata Added: Rs. ${summary.khataSales.toFixed(2)}\n`));
      add(EscPos.text('--------------------------------\n'));
      add(EscPos.text(`Total Items Swiped: ${summary.itemCount}\n`));
      add(EscPos.text(`Khata Recovered: Rs. ${summary.khataRecovered.toFixed(2)}\n`));
      add(EscPos.feed());
      add(EscPos.alignCenter());
      add(EscPos.text('Generated via KiranaPOS\n'));
      
      // Clear tear bar
      add(EscPos.feed());
      add(EscPos.feed());
      add(EscPos.feed());
      add(EscPos.feed());

      console.log("🖨️ Receipt Bytes Generated! Length:", bytes.length);

      const printerId = storage.getString('saved_printer_id');
      if (!printerId) {
        alert('No printer connected. Please connect a printer first.');
        return;
      }

      // Standard generic printer characteristics (adjust if specific UUIDs were stored)
      const SERVICE_UUID = '49535343-FE7D-4AE5-8FA9-9FAFD205E455'; 
      const CHAR_UUID = '49535343-1E4D-4BD9-BA61-23C647249616';
      
      await writeBytesToPrinter(printerId, SERVICE_UUID, CHAR_UUID, bytes);
      
    } catch (err) {
      console.error('Print failed', err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <KText variant="labelCaps" style={styles.headerTitle}>Today&apos;s Total Collected</KText>
        <KText variant="priceDisplay" style={styles.mainTally}>
          ₹{summary?.totalRevenue.toFixed(2) || '0.00'}
        </KText>
        <KButton label="Refresh" variant="secondary" onPress={loadSummary} style={styles.refreshBtn} />
      </View>

      {isDelayedLoading ? (
        <View style={styles.cardsContainer}>
          <Skeleton height={80} width="100%" radius={16} />
          <View style={{ height: 12 }} />
          <Skeleton height={80} width="100%" radius={16} />
          <View style={{ height: 12 }} />
          <Skeleton height={80} width="100%" radius={16} />
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.cashCard]}>
            <KText variant="labelCaps" style={styles.cardLabel}>Cash</KText>
            <KText variant="priceSub" style={styles.cardValue}>₹{summary?.cashSales.toFixed(2) || '0.00'}</KText>
          </View>
          <View style={[styles.card, styles.upiCard]}>
            <KText variant="labelCaps" style={styles.cardLabel}>UPI</KText>
            <KText variant="priceSub" style={styles.cardValue}>₹{summary?.upiSales.toFixed(2) || '0.00'}</KText>
          </View>
          <View style={[styles.card, styles.khataCard]}>
            <KText variant="labelCaps" style={styles.cardLabel}>Khata Added</KText>
            <KText variant="priceSub" style={styles.cardValue}>₹{summary?.khataSales.toFixed(2) || '0.00'}</KText>
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <KText variant="bodyMd" style={styles.statLabel}>Total Items Sold</KText>
          <KText variant="priceSub" style={styles.statValue}>{summary?.itemCount || 0}</KText>
        </View>
        <View style={styles.statRow}>
          <KText variant="bodyMd" style={styles.statLabel}>Khata Recovered (Credits)</KText>
          <KText variant="priceSub" style={styles.statValue}>₹{summary?.khataRecovered.toFixed(2) || '0.00'}</KText>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <KText variant="bodyMd" style={styles.syncStatusText}>
          Catalogue updated: {storage.getString('last_sync_timestamp') || 'Pending'}
        </KText>
        <KButton label="Share via WhatsApp" onPress={handleShare} style={styles.actionBtn} />
        <KButton label="Print EOD Slip" variant="navy" onPress={handlePrint} style={styles.actionBtn} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  headerBox: {
    backgroundColor: KiranaColors.surface,
    padding: KiranaSpacing.marginPage,
    alignItems: 'center',
    borderBottomWidth: KiranaBorder.card,
    borderBottomColor: KiranaColors.outlineVariant,
    marginBottom: 16,
  },
  headerTitle: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 8,
  },
  mainTally: {
    color: KiranaColors.onSurface,
    marginBottom: 16,
  },
  refreshBtn: {
    minWidth: 120,
  },
  cardsContainer: {
    paddingHorizontal: KiranaSpacing.gutter,
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: KiranaRadius.lg,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
  },
  cashCard: {
    borderLeftWidth: 6,
    borderLeftColor: KiranaColors.success,
  },
  upiCard: {
    borderLeftWidth: 6,
    borderLeftColor: KiranaColors.tertiary,
  },
  khataCard: {
    borderLeftWidth: 6,
    borderLeftColor: KiranaColors.primaryContainer,
  },
  cardLabel: {
    color: KiranaColors.onSurface,
  },
  cardValue: {
    color: KiranaColors.onSurface,
  },
  statsContainer: {
    backgroundColor: KiranaColors.surface,
    marginHorizontal: KiranaSpacing.gutter,
    borderRadius: KiranaRadius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  statLabel: {
    color: KiranaColors.onSurfaceVariant,
  },
  statValue: {
    color: KiranaColors.onSurface,
  },
  actionsContainer: {
    paddingHorizontal: KiranaSpacing.gutter,
    paddingBottom: 40,
    gap: 10,
  },
  syncStatusText: {
    textAlign: 'center',
    color: KiranaColors.outline,
    marginBottom: 8,
  },
  actionBtn: {
    width: '100%',
  },
});
