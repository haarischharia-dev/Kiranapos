import { PermissionsAndroid, Platform, Rationale } from 'react-native';

const bluetoothScanRationale: Rationale = {
  title: 'Bluetooth scan permission',
  message:
    'KiranaPOS needs Bluetooth scan permission to discover nearby receipt printers and Bluetooth accessories.',
  buttonPositive: 'Allow',
  buttonNegative: 'Deny',
};

const bluetoothConnectRationale: Rationale = {
  title: 'Bluetooth connect permission',
  message:
    'KiranaPOS needs Bluetooth connect permission to pair with and communicate with nearby receipt printers and Bluetooth accessories.',
  buttonPositive: 'Allow',
  buttonNegative: 'Deny',
};

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 31) {
    return true;
  }

  const hasScanPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
  );
  const hasConnectPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
  );

  if (hasScanPermission && hasConnectPermission) {
    return true;
  }

  const scanStatus = hasScanPermission
    ? PermissionsAndroid.RESULTS.GRANTED
    : await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        bluetoothScanRationale
      );

  const connectStatus = hasConnectPermission
    ? PermissionsAndroid.RESULTS.GRANTED
    : await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        bluetoothConnectRationale
      );

  return (
    scanStatus === PermissionsAndroid.RESULTS.GRANTED &&
    connectStatus === PermissionsAndroid.RESULTS.GRANTED
  );
}
