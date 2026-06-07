import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { openDatabase } from '../src/db/database';
import { injectMasterDatabase } from '../src/db/seeder';
import { storage } from '../src/db/seedImporter'; // or wherever MMKV is exported
import { useCartDraftRecovery } from '../src/hooks/useCartDraftRecovery';
import { useOTAUpdates } from '../src/hooks/useOTAUpdates';
import { useSync } from '../src/hooks/useSync';
import { track } from '../src/utils/telemetry';

import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Sentry from '@sentry/react-native';
import GlobalErrorBoundary from '../src/components/GlobalErrorBoundary';
import NetworkBanner from '../src/components/NetworkBanner';

Sentry.init({
  dsn: 'https://f961f285de122d2949b8f8f45e2611bd@o4511288331796480.ingest.us.sentry.io/4511507617939456',
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Wire the Background Trigger independently
  useSync();
  useOTAUpdates();
  useCartDraftRecovery();

  useEffect(() => {
    track('App_Started');
  }, []);

  useEffect(() => {
    async function setupDb() {
      try {
        // openDatabase() now runs schema init/migrations internally.
        const db = await openDatabase();
        await injectMasterDatabase(db);
      } catch (error) {
        console.error('Failed to initialize local database:', error);
      }
    }
    setupDb();
    
    // Check onboarding status and redirect if needed
    setTimeout(() => {
      const hasOnboarded = storage.getBoolean('has_onboarded');
      if (!hasOnboarded) {
        router.replace('/onboarding');
      }
    }, 100);
  }, []);

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="day-close" options={{ title: 'Day Close (EOD)' }} />
            <Stack.Screen name="checkout" options={{ presentation: 'modal', title: 'Settle Bill' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        <NetworkBanner />
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
