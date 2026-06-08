import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text, Button, Vibration, Platform, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useNetworkState } from 'expo-network';
import { openDatabase } from '../../src/db/database';
import { findByBarcode, upsertProduct } from '../../src/db/productRepo';
import { fetchProductFromInternet } from '../../src/utils/barcodeApi';
import { isIndianRetailBarcode } from '../../src/utils/barcodeValidation';
import { useCartStore } from '../../src/store/cartStore';
import CartView from '../../src/components/CartView';
import QuickTapGrid from '../../src/components/QuickTapGrid';
import QuickTapStrip from '../../src/components/QuickTapStrip';
import NewProductModal from '../../src/components/NewProductModal';
export default function ScannerScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  const networkState = useNetworkState();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [bottomView, setBottomView] = useState<'cart' | 'grid'>('cart');
  // Bumping this key remounts the Camera to recover from transient
  // session-configuration errors without blocking the cashier.
  const [cameraKey, setCameraKey] = useState(0);

  const handleCameraError = useCallback((error: { message?: string }) => {
    console.warn('📸 Camera error — attempting auto-recovery:', error?.message ?? error);
    setTimeout(() => setCameraKey((k) => k + 1), 600);
  }, []);

  const addItem = useCartStore((state) => state.addItem);

  // CRITICAL: Scan-Cooldown Guard state
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'code-128', 'upc-a'],
    onCodeScanned: async (codes) => {
      const code = codes[0];
      if (!code || !code.value || isProcessing.current) return;
      if (!isIndianRetailBarcode(code.value)) return;

      const now = Date.now();
      
      // Cooldown Guard logic (1200ms lock-out for same barcode)
      if (
        code.value === lastScannedCode.current && 
        now - lastScannedTime.current < 1200
      ) {
        return; // Ignore duplicate ghost scan
      }

      // Valid scan
      lastScannedCode.current = code.value;
      lastScannedTime.current = now;
      isProcessing.current = true;

      try {
        const db = await openDatabase();
        const product = await findByBarcode(db, code.value);
        
        if (product) {
          Vibration.vibrate(50); // Haptic feedback
          addItem(product);
          console.log(`Added to cart: ${product.name}`);
        } else {
          setUnknownBarcode(code.value);
          let fetchedName = '';
          
          if (networkState.isConnected) {
            setIsSearchingCloud(true);
            const globalResult = await fetchProductFromInternet(code.value);
            setIsSearchingCloud(false);
            if (globalResult) {
              fetchedName = globalResult;
            }
          }
          
          setNewName(fetchedName);
          setModalVisible(true);
        }
      } catch (error) {
        console.error('Failed to lookup barcode:', error);
      } finally {
        isProcessing.current = false;
      }
    }
  });

  if (!hasPermission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: '#d63031' }]}>
        <Text style={[styles.permissionText, { color: '#fff', fontSize: 28, textAlign: 'center' }]}>Camera Access Required</Text>
        <Text style={[styles.permissionText, { color: '#fff', fontSize: 28, marginBottom: 40, textAlign: 'center' }]}>कैमरा एक्सेस की आवश्यकता है</Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 20, borderRadius: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 }}
          onPress={requestPermission}
        >
          <Text style={{ color: '#d63031', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' }}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>No Camera Device Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Half: Camera */}
      <View style={styles.cameraHalf}>
        <Camera
          key={cameraKey}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !isModalVisible}
          codeScanner={codeScanner}
          onError={handleCameraError}
        />
        
        {/* Target Overlay Box */}
        <View style={styles.overlay}>
          <View style={styles.targetBox} />
          {isSearchingCloud ? (
            <Text style={styles.overlayTextCloud}>Searching catalogs...</Text>
          ) : (
            <Text style={styles.overlayText}>Aim at a barcode</Text>
          )}
        </View>
      </View>

      <QuickTapStrip refreshKey={bottomView} />

      {/* Bottom Half: Toggle and Content */}
      <View style={styles.cartHalf}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabBtn, bottomView === 'cart' && styles.tabBtnActive]}
            onPress={() => setBottomView('cart')}
          >
            <Text style={[styles.tabText, bottomView === 'cart' && styles.tabTextActive]}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, bottomView === 'grid' && styles.tabBtnActive]}
            onPress={() => setBottomView('grid')}
          >
            <Text style={[styles.tabText, bottomView === 'grid' && styles.tabTextActive]}>Loose Items</Text>
          </TouchableOpacity>
        </View>

        {bottomView === 'cart' ? <CartView /> : <QuickTapGrid />}
      </View>

      <NewProductModal
        visible={isModalVisible}
        barcode={unknownBarcode}
        initialName={newName}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHalf: {
    flexGrow: 0,
    flexShrink: 0,
    height: 294,
    overflow: 'hidden',
  },
  cartHalf: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#00b894',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#00b894',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  permissionSubText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 65,
  },
  targetBox: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  overlayText: {
    marginTop: 20,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  overlayTextCloud: {
    marginTop: 20,
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
