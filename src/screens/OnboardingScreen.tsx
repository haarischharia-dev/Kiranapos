import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { storage } from '../db/seedImporter';
import { bleManager, ensureBluetoothIsOn } from '../utils/bleManager';
import KText from '../components/ui/KText';
import KInput from '../components/ui/KInput';
import KButton from '../components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [paired, setPaired] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lang, setLang] = useState('en');

  const handleSetLang = (selectedLang: string) => {
    setLang(selectedLang);
    storage.set('app_language', selectedLang);
  };

  const handleNext = () => {
    if (step === 1) {
      if (shopName.trim()) {
        storage.set('shop_name', shopName);
      }
      setStep(2);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    storage.set('has_onboarded', true);
    router.replace('/(tabs)');
  };

  const handleFindPrinter = async () => {
    const isReady = await ensureBluetoothIsOn();
    if (!isReady) return;

    setScanning(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setScanning(false);
        return;
      }
      if (device && device.name) {
        bleManager.stopDeviceScan();
        storage.set('saved_printer_id', device.id);
        setPaired(true);
        setScanning(false);
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 5000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === 1 ? (
        <View style={styles.stepContainer}>
          <KText variant="headlineLg" style={styles.title}>Welcome to KiranaPOS</KText>
          <KText variant="labelCaps" style={styles.subtitle}>1. Select Language</KText>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => handleSetLang('en')}
            >
              <KText variant="bodyLg" style={[styles.langText, lang === 'en' && styles.langTextActive]}>English</KText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
              onPress={() => handleSetLang('hi')}
            >
              <KText variant="bodyLg" style={[styles.langText, lang === 'hi' && styles.langTextActive]}>हिंदी</KText>
            </TouchableOpacity>
          </View>

          <KInput
            label="2. Shop Name"
            placeholder="Enter your shop name"
            value={shopName}
            onChangeText={setShopName}
          />

          <KButton label="Continue" onPress={handleNext} height={64} />
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <KText variant="headlineLg" style={styles.title}>Hardware Setup</KText>
          <KText variant="bodyMd" style={styles.subtitleBody}>Pair your Bluetooth receipt printer</KText>

          {paired ? (
            <View style={styles.successBox}>
              <KText variant="bodyLg" style={styles.successText}>Printer paired successfully</KText>
            </View>
          ) : (
            <KButton
              label={scanning ? 'Scanning...' : 'Find My Printer'}
              onPress={handleFindPrinter}
              disabled={scanning}
              height={64}
            />
          )}

          <KButton label="Skip for Now" variant="secondary" onPress={handleNext} style={styles.skipBtn} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
    justifyContent: 'center',
  },
  stepContainer: {
    padding: KiranaSpacing.marginPage,
    gap: 8,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: KiranaColors.onSurfaceVariant,
  },
  subtitleBody: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 16,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  langBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: KiranaColors.surface,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    minHeight: KiranaSpacing.touchMin,
    justifyContent: 'center',
  },
  langBtnActive: {
    backgroundColor: KiranaColors.primaryContainer,
    borderColor: KiranaColors.onPrimaryContainer,
  },
  langText: {
    color: KiranaColors.onSurface,
  },
  langTextActive: {
    color: KiranaColors.navy,
    fontFamily: 'WorkSans_600SemiBold',
  },
  skipBtn: {
    marginTop: 8,
  },
  successBox: {
    backgroundColor: KiranaColors.successContainer,
    padding: 24,
    borderRadius: KiranaRadius.md,
    marginVertical: 16,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.success,
  },
  successText: {
    color: KiranaColors.success,
    textAlign: 'center',
    fontFamily: 'WorkSans_600SemiBold',
  },
});
