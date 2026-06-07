import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { bleManager, connectToPrinter } from '../utils/bleManager';
import { usePrinter } from '../hooks/usePrinter';

export default function PrinterSettings() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const { printerState, setPrinterState } = usePrinter();

  const startScan = () => {
    setIsScanning(true);
    setDevices([]);
    
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }
      
      if (device && device.name) {
        const lowerName = device.name.toLowerCase();
        // Filter common 58mm printer names or any device with a name
        if (lowerName.includes('mtp') || lowerName.includes('pt') || lowerName.includes('printer') || lowerName.includes('blue')) {
          setDevices((prev) => {
            if (!prev.find((d) => d.id === device.id)) {
              return [...prev, device];
            }
            return prev;
          });
        }
      }
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const handleConnect = async (deviceId: string) => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
    setPrinterState('connecting');
    try {
      await connectToPrinter(deviceId);
      setPrinterState('connected');
    } catch (error) {
      console.error('Failed to connect:', error);
      setPrinterState('disconnected');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Printer Settings</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {printerState.toUpperCase()}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={startScan}
        disabled={isScanning || printerState === 'connecting'}
      >
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Scanning...' : 'Scan for Printers'}
        </Text>
      </TouchableOpacity>

      {isScanning && <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.deviceItem}
            onPress={() => handleConnect(item.id)}
          >
            <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isScanning ? (
            <Text style={styles.emptyText}>No printers found.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3436',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginBottom: 16,
  },
  deviceItem: {
    padding: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  deviceId: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#636e72',
    marginTop: 32,
  },
});
