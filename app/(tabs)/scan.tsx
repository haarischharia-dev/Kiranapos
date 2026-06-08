import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Vibration, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner, type CameraDevice } from 'react-native-vision-camera';
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
import { storage } from '../../src/db/seedImporter';

const POS_CAMERA_ZOOM_KEY = 'pos_camera_zoom';
const ZOOM_STEP = 0.1;
const MAX_NORMALIZED_ZOOM = 0.3;

const ZOOM_PRESETS = [
  { label: '1x', value: 0 },
  { label: '1.5x', value: 0.1 },
  { label: '2x', value: 0.2 },
] as const;

function clampNormalizedZoom(value: number): number {
  return Math.max(0, Math.min(MAX_NORMALIZED_ZOOM, Math.round(value * 10) / 10));
}

function toDeviceZoom(normalized: number, device: CameraDevice): number {
  const ratio = clampNormalizedZoom(normalized) / MAX_NORMALIZED_ZOOM;
  const maxScanZoom = Math.min(device.maxZoom, device.neutralZoom * 2);
  return device.minZoom + ratio * (maxScanZoom - device.minZoom);
}

function readSavedZoom(): number {
  const saved = storage.getNumber(POS_CAMERA_ZOOM_KEY);
  return clampNormalizedZoom(saved ?? 0);
}

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
  const [zoom, setZoom] = useState(readSavedZoom);
  const cameraRef = useRef<Camera>(null);

  const persistZoom = useCallback((nextZoom: number) => {
    const clamped = clampNormalizedZoom(nextZoom);
    setZoom(clamped);
    storage.set(POS_CAMERA_ZOOM_KEY, clamped);
  }, []);

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

  useEffect(() => {
    if (!isFocused || isModalVisible || !cameraRef.current) return;
    cameraRef.current.focus({ x: 0.5, y: 0.5 }).catch(() => {});
  }, [isFocused, isModalVisible, zoom, cameraKey]);

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
          ref={cameraRef}
          key={cameraKey}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !isModalVisible}
          codeScanner={codeScanner}
          zoom={toDeviceZoom(zoom, device)}
          onError={handleCameraError}
        />

        <View style={styles.zoomControls} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.zoomStepBtn, zoom <= 0 && styles.zoomStepBtnDisabled]}
            onPress={() => persistZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= 0}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomStepBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.zoomPresetRow}>
            {ZOOM_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[styles.zoomPresetBtn, zoom === preset.value && styles.zoomPresetBtnActive]}
                onPress={() => persistZoom(preset.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.zoomPresetText,
                    zoom === preset.value && styles.zoomPresetTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.zoomStepBtn, zoom >= MAX_NORMALIZED_ZOOM && styles.zoomStepBtnDisabled]}
            onPress={() => persistZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_NORMALIZED_ZOOM}
            activeOpacity={0.8}
          >
            <Text style={styles.zoomStepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Target Overlay Box */}
        <View style={styles.overlay} pointerEvents="none">
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
  zoomControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  zoomStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomStepBtnDisabled: {
    opacity: 0.35,
  },
  zoomStepBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  zoomPresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomPresetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  zoomPresetBtnActive: {
    backgroundColor: '#00b894',
  },
  zoomPresetText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomPresetTextActive: {
    color: '#fff',
  },
});
