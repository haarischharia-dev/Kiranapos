import { bleManager } from './bleManager';

// Fast array to Base64 encoder suitable for React Native
const bytesToBase64 = (bytes: number[]): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] !== undefined ? bytes[i + 1] : NaN;
    const b3 = bytes[i + 2] !== undefined ? bytes[i + 2] : NaN;

    base64 += chars[b1 >> 2];
    base64 += chars[((b1 & 3) << 4) | (isNaN(b2) ? 0 : b2 >> 4)];
    base64 += isNaN(b2) ? '=' : chars[((b2 & 15) << 2) | (isNaN(b3) ? 0 : b3 >> 6)];
    base64 += isNaN(b3) ? '=' : chars[b3 & 63];
  }
  return base64;
};

export const writeBytesToPrinter = async (
  deviceId: string,
  serviceUUID: string,
  characteristicUUID: string,
  bytesArray: number[]
) => {
  // Safe chunk size below default MTUs (usually 185, using 100 to be very safe)
  const CHUNK_SIZE = 100;

  for (let i = 0; i < bytesArray.length; i += CHUNK_SIZE) {
    const chunk = bytesArray.slice(i, i + CHUNK_SIZE);
    const base64Chunk = bytesToBase64(chunk);

    try {
      await bleManager.writeCharacteristicWithResponseForDevice(
        deviceId,
        serviceUUID,
        characteristicUUID,
        base64Chunk
      );
    } catch (error) {
      console.error('BLE Write Error:', error);
      alert('Printer Disconnected. Please reconnect.');
      break; // Stop transmitting if the connection broke
    }

    // 40ms delay between chunks to prevent hardware buffer overflow
    await new Promise(resolve => setTimeout(resolve, 40));
  }
};
