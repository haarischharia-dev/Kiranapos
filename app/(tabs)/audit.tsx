import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text, Vibration, Modal, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { openDatabase } from '../../src/db/database';
import { incrementStock } from '../../src/db/productRepo';
import { isIndianRetailBarcode } from '../../src/utils/barcodeValidation';

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
        <Text style={styles.permissionText}>Camera permission is required for Audits.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
          <Text style={styles.actionBtnText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>No back camera device found.</Text>
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
      <Text style={styles.keyText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Full Screen Camera for Audit */}
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
          <Text style={styles.overlayText}>Aim at a barcode</Text>
        </View>
      </View>

      {/* Quantity Intake Custom Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Intake Audit</Text>
              <Text style={styles.barcodeText}>{scannedBarcode}</Text>
            </View>
            
            {/* Display Screen */}
            <View style={styles.displayScreen}>
              <Text style={styles.displayText}>
                {intakeQty === '' ? '1 (Default)' : intakeQty}
              </Text>
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

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>CONFIRM INTAKE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: '#00b894',
    padding: 14,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#00b894',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  overlayText: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#1e272e',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  barcodeText: {
    fontSize: 14,
    color: '#00b894',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  displayScreen: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#333',
  },
  displayText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#00b894',
  },
  keypad: {
    marginBottom: 20,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keyBtn: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  confirmBtn: {
    backgroundColor: '#00b894',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  }
});
