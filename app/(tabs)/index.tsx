import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import KText from '../../src/components/ui/KText';
import StoreHeader from '../../src/components/ui/StoreHeader';
import KButton from '../../src/components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StoreHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <KText variant="headlineMd" style={styles.heading}>Profile</KText>
        <KText variant="bodyMd" style={styles.subheading}>
          Day-end reports, settings, and account.
        </KText>

        <View style={styles.tileGrid}>
          <View style={styles.tileCard}>
            <MaterialIcons name="summarize" size={28} color={KiranaColors.navy} />
            <KText variant="labelCaps" style={styles.tileTitle}>Day Close</KText>
            <KText variant="bodyMd" style={styles.tileSub}>EOD revenue & item counts</KText>
            <KButton
              testID="day-close-btn"
              label="Open Day Close"
              onPress={() => router.push('/day-close')}
              style={styles.tileBtn}
            />
          </View>

          <View style={styles.tileCard}>
            <MaterialIcons name="settings" size={28} color={KiranaColors.navy} />
            <KText variant="labelCaps" style={styles.tileTitle}>Settings</KText>
            <KText variant="bodyMd" style={styles.tileSub}>Account, legal, printer</KText>
            <KButton
              testID="settings-btn"
              label="Open Settings"
              variant="secondary"
              onPress={() => router.push('/settings')}
              style={styles.tileBtn}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  content: {
    padding: KiranaSpacing.marginPage,
    gap: KiranaSpacing.stackGap,
  },
  heading: {
    color: KiranaColors.onSurface,
  },
  subheading: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 8,
  },
  tileGrid: {
    gap: KiranaSpacing.stackGap,
  },
  tileCard: {
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.lg,
    padding: KiranaSpacing.marginPage,
    gap: 8,
  },
  tileTitle: {
    color: KiranaColors.onSurface,
    fontSize: 13,
  },
  tileSub: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 4,
  },
  tileBtn: {
    alignSelf: 'flex-start',
    minWidth: 180,
  },
});
