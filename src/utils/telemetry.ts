import { PostHog } from 'posthog-react-native';
import { createMMKV } from 'react-native-mmkv';

// MMKV is synchronous and JSI-backed, so persistence never touches the JS event
// loop. This keeps PostHog from contending with the React UI thread during rapid
// barcode scanning, and sidesteps the expo-file-system deprecation crash that
// posthog-react-native hits on Expo SDK 54 stable.
const telemetryStore = createMMKV({ id: 'posthog-telemetry' });

const mmkvStorage = {
  getItem: (key: string) => telemetryStore.getString(key) ?? null,
  setItem: (key: string, value: string) => telemetryStore.set(key, value),
};

export const posthog = new PostHog('phc_uhauVnj7vUgtreFVhVqiBUb24Qr9MNDH9MZdJy5mjCSV', {
  host: 'https://us.i.posthog.com',
  customStorage: mmkvStorage,
});

export type TelemetryEvent = 'App_Started' | 'Checkout_Completed' | 'Day_Close_Viewed' | 'Khata_Recovered';

export const track = (event: TelemetryEvent, properties?: Record<string, any>) => {
  posthog.capture(event, properties);
};
