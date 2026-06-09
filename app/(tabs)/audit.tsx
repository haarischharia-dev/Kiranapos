import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Vibration, Modal, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { openDatabase } from '../../src/db/database';
import { incrementStock } from '../../src/db/productRepo';
import { isIndianRetailBarcode } from '../../src/utils/barcodeValidation';
import KText from '../../src/components/ui/KText';
import KButton from '../../src/components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

export default function AuditScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [intakeQty, setIntakeQty] = useState('');
  // Bumping this key remounts the Camera to recover from transient
  // session-configuration errors instead of crashing the screen.
  const [cameraKey, setCameraKey] = useState(0);

  const handleCameraError = useCallback((error: { message?: string }) => {
    console.warn('📸 Audit camera error — attempting auto-recovery:', error?.message ?? error);
    setTimeout(() => setCameraKey((k) => k + 1), 600);
  }, []);

  // CRITICAL: Scan-Cooldown Guard state
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a'],
    onCodeScanned: (codes) => {
      const code = codes[0];
      if (!code?.value) return;
      if (!isIndianRetailBarcode(code.value)) return;

      const now = Date.now();
      if (code.value === lastScannedCode.current && (now - lastScannedTime.current) < 1200) {
        return; // Ignore ghost scan
      }

      lastScannedCode.current = code.value;
      lastScannedTime.current = now;

      Vibration.vibrate(50); // Haptic feedback
      setScannedBarcode(code.value);
      setIntakeQty(''); // Reset custom keypad
      setModalVisible(true); // Pause camera and open modal
    }
  });

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <KText variant="bodyLg" style={styles.permissionText}>Camera permission is required for inventory intake.</KText>
        <KButton label="Request Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <KText variant="bodyLg" style={styles.permissionText}>No back camera device found.</KText>
      </View>
    );
  }

  const handleKeypadPress = (key: string) => {
    Vibration.vibrate(10);
    if (key === 'C') {
      setIntakeQty('');
    } else if (key === 'X') {
      setIntakeQty(prev => prev.slice(0, -1));
    } else {
      if (intakeQty.length < 5) {
        setIntakeQty(prev => prev + key);
      }
    }
  };

  const handleConfirm = async () => {
    const qtyToApply = intakeQty === '' ? 1 : parseInt(intakeQty, 10);
    
    if (qtyToApply > 0) {
      try {
        const db = await openDatabase();
        await incrementStock(db, scannedBarcode, qtyToApply);
        console.log(`Audit: Added ${qtyToApply} to barcode ${scannedBarcode}`);
      } catch (err) {
        console.error('Failed to audit item', err);
      }
    }
    
    setModalVisible(false); // Instantly drop modal and re-arm
  };

  const KeypadButton = ({ label, flex = 1 }: { label: string, flex?: number }) => (
    <TouchableOpacity 
      style={[styles.keyBtn, { flex }]} 
      onPress={() => handleKeypadPress(label)}
      activeOpacity={0.7}
    >
      <KText variant="priceSub" style={styles.keyText}>{label}</KText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
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
          <KText variant="labelCaps" style={styles.overlayText}>Scan to add stock</KText>
        </View>
      </View>

      {/* Quantity Intake Custom Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <KText variant="headlineMd" style={styles.modalTitle}>Intake Audit</KText>
              <KText variant="bodyMd" style={styles.barcodeText}>{scannedBarcode}</KText>
            </View>
            
            {/* Display Screen */}
            <View style={styles.displayScreen}>
              <KText variant="priceDisplay" style={styles.displayText}>
                {intakeQty === '' ? '1' : intakeQty}
              </KText>
            </View>
            
            {/* Custom Massive Keypad */}
            <View style={styles.keypad}>
              <View style={styles.keyRow}>
                <KeypadButton label="1" />
                <KeypadButton label="2" />
                <KeypadButton label="3" />
              </View>
              <View style={styles.keyRow}>
                <KeypadButton label="4" />
                <KeypadButton label="5" />
                <KeypadButton label="6" />
              </View>
              <View style={styles.keyRow}>
                <KeypadButton label="7" />
                <KeypadButton label="8" />
                <KeypadButton label="9" />
              </View>
              <View style={styles.keyRow}>
                <KeypadButton label="C" />
                <KeypadButton label="0" />
                <KeypadButton label="X" />
              </View>
            </View>

            <KButton label="Confirm Intake" onPress={handleConfirm} height={64} />
            <KButton label="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={styles.cancelBtn} />

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: KiranaColors.background,
    padding: KiranaSpacing.marginPage,
    gap: 16,
  },
  permissionText: {
    color: KiranaColors.onSurface,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: 250,
    height: 150,
    borderWidth: KiranaBorder.focus,
    borderColor: KiranaColors.scannerFrame,
    backgroundColor: 'transparent',
    borderRadius: KiranaRadius.lg,
  },
  overlayText: {
    marginTop: 20,
    color: KiranaColors.surface,
    backgroundColor: 'rgba(35,26,19,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: KiranaColors.modalBackdrop,
  },
  modalContent: {
    backgroundColor: KiranaColors.surface,
    borderTopLeftRadius: KiranaRadius.xl,
    borderTopRightRadius: KiranaRadius.xl,
    borderWidth: KiranaBorder.focus,
    borderColor: KiranaColors.navy,
    padding: KiranaSpacing.marginPage,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: KiranaColors.onSurface,
  },
  barcodeText: {
    color: KiranaColors.primary,
    marginTop: 4,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  displayScreen: {
    backgroundColor: KiranaColors.navy,
    borderRadius: KiranaRadius.md,
    padding: 20,
    marginBottom: 20,
    alignItems: 'flex-end',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outline,
  },
  displayText: {
    color: KiranaColors.primaryContainer,
    fontSize: 40,
  },
  keypad: {
    marginBottom: 20,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  keyBtn: {
    backgroundColor: KiranaColors.surfaceDim,
    borderRadius: KiranaRadius.md,
    minHeight: 72,
    minWidth: 72,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
  },
  keyText: {
    color: KiranaColors.onSurface,
    fontSize: 28,
  },
  cancelBtn: {
    marginTop: 8,
  },
});
