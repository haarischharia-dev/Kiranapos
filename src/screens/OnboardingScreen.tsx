import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { storage } from '../db/seedImporter';
import { bleManager, ensureBluetoothIsOn } from '../utils/bleManager';

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
        // Broad filter, ideally checking specifically for POS printer names or characteristics
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
          <Text style={styles.title}>Welcome to KiranaPOS</Text>
          <Text style={styles.subtitle}>1. Select Language</Text>
          <View style={styles.langRow}>
            <TouchableOpacity 
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} 
              onPress={() => handleSetLang('en')}
            >
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]} 
              onPress={() => handleSetLang('hi')}
            >
              <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>हिंदी</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>2. Shop Name</Text>
          <TextInput 
            style={styles.input}
            placeholder="Enter your shop name"
            value={shopName}
            onChangeText={setShopName}
          />
          
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Hardware Setup</Text>
          <Text style={styles.subtitle}>Pair your Bluetooth Receipt Printer</Text>
          
          {paired ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ Printer Paired Successfully!</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleFindPrinter}
              disabled={scanning}
            >
              <Text style={styles.primaryBtnText}>{scanning ? 'Scanning...' : 'Find My Printer'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleNext}>
            <Text style={styles.secondaryBtnText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  stepContainer: { padding: 32 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 24, textAlign: 'center', color: '#2d3436' },
  subtitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 24, color: '#636e72' },
  langRow: { flexDirection: 'row', justifyContent: 'space-between' },
  langBtn: { flex: 1, padding: 16, backgroundColor: '#f1f2f6', marginHorizontal: 8, borderRadius: 12, alignItems: 'center' },
  langBtnActive: { backgroundColor: '#0984e3' },
  langText: { fontSize: 18, fontWeight: '600', color: '#2d3436' },
  langTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#dcdde1', padding: 16, borderRadius: 12, fontSize: 18, marginBottom: 32 },
  primaryBtn: { backgroundColor: '#00b894', padding: 20, borderRadius: 12, alignItems: 'center', marginVertical: 8, shadowColor: '#00b894', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  secondaryBtn: { padding: 18, alignItems: 'center', marginVertical: 8 },
  secondaryBtnText: { color: '#b2bec3', fontSize: 16, fontWeight: '700' },
  successBox: { backgroundColor: '#e8f8f5', padding: 24, borderRadius: 12, marginVertical: 16 },
  successText: { fontSize: 20, color: '#00b894', textAlign: 'center', fontWeight: 'bold' }
});
