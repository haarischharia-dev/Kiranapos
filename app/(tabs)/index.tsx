import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">KiranaPOS</ThemedText>
        <ThemedText>Your offline-first store counter</ThemedText>
      </ThemedView>

      <ThemedView style={styles.managementSection}>
        <ThemedText type="subtitle">Store Management</ThemedText>
        <TouchableOpacity
          testID="day-close-btn"
          style={styles.dayCloseBtn}
          onPress={() => router.push('/day-close')}
          activeOpacity={0.85}
        >
          <Text style={styles.dayCloseBtnText}>📊 Day Close (EOD)</Text>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    gap: 8,
    marginBottom: 8,
  },
  managementSection: {
    gap: 12,
    marginBottom: 16,
  },
  dayCloseBtn: {
    backgroundColor: '#0984e3',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dayCloseBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
