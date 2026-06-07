import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
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
        <Text style={styles.headerTitle}>Today's Total Collected</Text>
        <Text style={styles.mainTally}>
          ₹{summary?.totalRevenue.toFixed(2) || '0.00'}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadSummary}>
          <Text style={styles.refreshBtnText}>↻ Refresh</Text>
        </TouchableOpacity>
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
            <Text style={styles.cardLabel}>💵 Cash</Text>
            <Text style={styles.cardValue}>₹{summary?.cashSales.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={[styles.card, styles.upiCard]}>
            <Text style={styles.cardLabel}>📱 UPI</Text>
            <Text style={styles.cardValue}>₹{summary?.upiSales.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={[styles.card, styles.khataCard]}>
            <Text style={styles.cardLabel}>📖 Khata Added</Text>
            <Text style={styles.cardValue}>₹{summary?.khataSales.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Items Sold</Text>
          <Text style={styles.statValue}>{summary?.itemCount || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Khata Recovered (Credits)</Text>
          <Text style={styles.statValue}>₹{summary?.khataRecovered.toFixed(2) || '0.00'}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.syncStatusText}>
          Catalogue updated: {storage.getString('last_sync_timestamp') || 'Pending'}
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share Summary via WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Text style={styles.printBtnText}>Print EOD Slip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerBox: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: '#636e72',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainTally: {
    fontSize: 48,
    fontWeight: '900',
    color: '#2d3436',
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshBtnText: {
    color: '#2d3436',
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cashCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 6,
    borderLeftColor: '#00b894',
  },
  upiCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 6,
    borderLeftColor: '#0984e3',
  },
  khataCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 6,
    borderLeftColor: '#d63031',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2d3436',
  },
  statsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  statLabel: {
    fontSize: 16,
    color: '#636e72',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  syncStatusText: {
    textAlign: 'center',
    color: '#b2bec3',
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  shareBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  printBtn: {
    backgroundColor: '#2d3436',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  printBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
