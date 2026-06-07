import { BleManager } from 'react-native-ble-plx';
import { storage } from '../db/seedImporter';
import { Alert } from 'react-native';

export const bleManager = new BleManager();

export const ensureBluetoothIsOn = async (): Promise<boolean> => {
  const state = await bleManager.state();
  if (state === 'PoweredOff' || state === 'Unauthorized') {
    Alert.alert("Bluetooth Required", "Please turn on Bluetooth in your phone settings to use the printer.", [{ text: "OK" }]);
    return false;
  }
  return true;
};

export const connectToPrinter = async (deviceId: string) => {
  try {
    const device = await bleManager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    await device.requestMTU(185);
    storage.set('saved_printer_id', deviceId);
    return device;
  } catch (error) {
    console.error('Failed to connect to printer:', error);
    throw error;
  }
};
