import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TextInput, Vibration, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useNetworkState } from 'expo-network';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { openDatabase } from '../../src/db/database';
import { findByBarcode, searchProducts } from '../../src/db/productRepo';
import { Product } from '../../src/types/db';
import { fetchProductFromInternet } from '../../src/utils/barcodeApi';
import { isIndianRetailBarcode } from '../../src/utils/barcodeValidation';
import { useCartStore } from '../../src/store/cartStore';
import { useMacroBarcodeCamera } from '../../src/hooks/useMacroBarcodeCamera';
import CartView from '../../src/components/CartView';
import QuickTapGrid from '../../src/components/QuickTapGrid';
import QuickTapStrip from '../../src/components/QuickTapStrip';
import NewProductModal from '../../src/components/NewProductModal';
import CheckoutBar from '../../src/components/ui/CheckoutBar';
import KText from '../../src/components/ui/KText';
import KButton from '../../src/components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const networkState = useNetworkState();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [bottomView, setBottomView] = useState<'cart' | 'grid'>('cart');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraLayout, setCameraLayout] = useState<{ width: number; height: number } | null>(null);
  const cameraRef = useRef<Camera>(null);

  const cameraActive = isFocused && !isModalVisible;
  const {
    device,
    format,
    macroZoom,
    markCodeSeen,
    onPreviewStarted,
    onPreviewStopped,
  } = useMacroBarcodeCamera({
    cameraRef,
    isActive: cameraActive,
    cameraLayout,
  });

  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const addItem = useCartStore((state) => state.addItem);
  const total = getTotal();

  const trimmedSearch = searchQuery.trim();
  const showSearchResults = trimmedSearch.length > 0;

  useEffect(() => {
    if (!trimmedSearch) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const db = await openDatabase();
        const results = await searchProducts(db, trimmedSearch);
        if (!cancelled) setSearchResults(results);
      } catch (error) {
        console.error('Product search failed:', error);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedSearch]);

  const handleSelectSearchResult = (product: Product) => {
    Vibration.vibrate(30);
    addItem(product);
    setSearchQuery('');
    setSearchResults([]);
    setBottomView('cart');
  };

  const handleCameraError = useCallback((error: { message?: string }) => {
    console.warn('📸 Camera error — attempting auto-recovery:', error?.message ?? error);
    setTimeout(() => setCameraKey((k) => k + 1), 600);
  }, []);

  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'code-128', 'upc-a'],
    onCodeScanned: async (codes) => {
      const code = codes[0];
      if (!code?.value || isProcessing.current) return;

      markCodeSeen();

      if (!isIndianRetailBarcode(code.value)) return;

      const now = Date.now();

      if (code.value === lastScannedCode.current && now - lastScannedTime.current < 1200) {
        return;
      }

      lastScannedCode.current = code.value;
      lastScannedTime.current = now;
      isProcessing.current = true;

      try {
        const db = await openDatabase();
        const product = await findByBarcode(db, code.value);

        if (product) {
          Vibration.vibrate(50);
          addItem(product);
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
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionBody}>
          <KText variant="headlineMd" style={styles.permissionTitle}>Camera Access Required</KText>
          <KText variant="bodyLg" style={styles.permissionSub}>कैमरा एक्सेस की आवश्यकता है</KText>
          <KButton label="Grant Permission" onPress={requestPermission} height={56} />
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <KText variant="bodyLg">No Camera Device Found</KText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.cameraSection, { paddingTop: insets.top + 12 }]}>
      <View
        style={styles.cameraHalf}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraLayout((prev) =>
            prev?.width === width && prev?.height === height ? prev : { width, height },
          );
        }}
      >
        <Camera
          ref={cameraRef}
          key={cameraKey}
          style={StyleSheet.absoluteFill}
          device={device}
          format={format}
          isActive={cameraActive}
          codeScanner={codeScanner}
          zoom={macroZoom}
          enableZoomGesture={false}
          onError={handleCameraError}
          onPreviewStarted={onPreviewStarted}
          onPreviewStopped={onPreviewStopped}
        />

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.scanBadge}>
              <MaterialIcons name="qr-code-scanner" size={20} color={KiranaColors.primaryContainer} />
              <KText variant="labelCaps" style={styles.scanBadgeText}>Scan Barcode</KText>
            </View>
          </View>
          {isSearchingCloud ? (
            <KText variant="labelCaps" style={styles.overlayStatus}>Searching catalogs...</KText>
          ) : null}
        </View>
      </View>
      </View>

      <QuickTapStrip refreshKey={bottomView} />

      <View style={styles.sectionHeader}>
        <KText variant="labelCaps" style={styles.sectionTitle}>Current Items</KText>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, bottomView === 'cart' && styles.toggleBtnActive]}
            onPress={() => setBottomView('cart')}
          >
            <KText variant="labelCaps" style={styles.toggleText}>Cart</KText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, bottomView === 'grid' && styles.toggleBtnActive]}
            onPress={() => setBottomView('grid')}
          >
            <KText variant="labelCaps" style={styles.toggleText}>Loose</KText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <MaterialIcons name="search" size={18} color={KiranaColors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search item or SKU"
            placeholderTextColor={KiranaColors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.cartHalf}>
        {showSearchResults ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.searchList}
            ListEmptyComponent={
              <View style={styles.searchEmpty}>
                <KText variant="bodyMd" style={styles.searchEmptyText}>
                  {isSearching ? 'Searching…' : 'No items found'}
                </KText>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchRowItem}
                activeOpacity={0.85}
                onPress={() => handleSelectSearchResult(item)}
              >
                <View style={styles.searchRowInfo}>
                  <KText variant="bodyMd" style={styles.searchRowName} numberOfLines={1}>
                    {item.name}
                  </KText>
                  {item.barcode ? (
                    <KText variant="labelCaps" style={styles.searchRowBarcode}>
                      {item.barcode}
                    </KText>
                  ) : null}
                </View>
                <KText variant="priceLine" style={styles.searchRowPrice}>
                  ₹{item.price.toFixed(0)}
                </KText>
              </TouchableOpacity>
            )}
          />
        ) : bottomView === 'cart' ? (
          <CartView />
        ) : (
          <QuickTapGrid />
        )}
      </View>

      <CheckoutBar
        total={total}
        disabled={items.length === 0}
        onPress={() => {
          if (items.length === 0) return;
          router.push('/checkout');
        }}
      />

      <NewProductModal
        visible={isModalVisible}
        barcode={unknownBarcode}
        initialName={newName}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const CORNER = 28;
const CORNER_THICK = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: KiranaColors.background,
    justifyContent: 'center',
  },
  permissionBody: {
    padding: KiranaSpacing.marginPage,
    gap: 12,
    alignItems: 'center',
  },
  permissionTitle: {
    textAlign: 'center',
  },
  permissionSub: {
    textAlign: 'center',
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 8,
  },
  cameraSection: {
    backgroundColor: KiranaColors.background,
    paddingBottom: 6,
  },
  cameraHalf: {
    flexGrow: 0,
    flexShrink: 0,
    height: 200,
    marginTop: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: KiranaRadius.md,
    marginHorizontal: KiranaSpacing.gutter,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 36,
  },
  scanFrame: {
    width: 250,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: KiranaColors.scannerFrame,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scanBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  overlayStatus: {
    marginTop: 10,
    color: KiranaColors.primaryContainer,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: KiranaSpacing.gutter,
    paddingVertical: 5,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    backgroundColor: KiranaColors.surfaceContainer,
  },
  sectionTitle: {
    color: KiranaColors.onSurface,
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.sm,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: KiranaColors.surface,
  },
  toggleBtnActive: {
    backgroundColor: KiranaColors.primaryContainer,
  },
  toggleText: {
    fontSize: 11,
    color: KiranaColors.navy,
  },
  cartHalf: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  searchRow: {
    paddingHorizontal: KiranaSpacing.gutter,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: KiranaColors.surfaceContainer,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  searchInputWrap: {
    alignSelf: 'flex-start',
    width: '72%',
    maxWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    backgroundColor: KiranaColors.surface,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'WorkSans_400Regular',
    fontSize: 16,
    color: KiranaColors.onSurface,
    paddingVertical: 6,
  },
  searchList: {
    paddingHorizontal: KiranaSpacing.gutter,
    paddingBottom: 8,
  },
  searchRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  searchRowInfo: {
    flex: 1,
    gap: 2,
  },
  searchRowName: {
    color: KiranaColors.onSurface,
    fontFamily: 'WorkSans_600SemiBold',
  },
  searchRowBarcode: {
    color: KiranaColors.outline,
    fontSize: 10,
  },
  searchRowPrice: {
    color: KiranaColors.primary,
  },
  searchEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  searchEmptyText: {
    color: KiranaColors.onSurfaceVariant,
  },
});
