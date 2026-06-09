import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { storage } from '../db/seedImporter';
import { unsafeResetDatabase } from '../db/database';
import { supabase } from '../utils/supabase';
import { useCartStore } from '../store/cartStore';
import KText from '../components/ui/KText';
import KButton from '../components/ui/KButton';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

const LEGAL_URLS = {
  privacy:
    'https://balsam-candytuft-7eb.notion.site/KiranaPOS-Privacy-Policy-379eda337a8d80f996cdcc3de89e4518?source=copy_link',
  terms:
    'https://balsam-candytuft-7eb.notion.site/KiranaPOS-Terms-of-Service-379eda337a8d8099a73ee49e7c5263cb?source=copy_link',
} as const;

async function openLegalLink(url: string, label: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unable to open link', `${label} is not available right now.`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', `${label} could not be opened.`);
  }
}

export default function SettingsScreen() {
  const [isDeleting, setIsDeleting] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);

  const runAccountDeletion = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        body: {},
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(String(data.error));
      }

      storage.clearAll();
      clearCart();
      await unsafeResetDatabase();
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account deletion failed';
      Alert.alert('Delete failed', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your shop products will be saved to the global catalogue, then your account and all private data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This cannot be undone. Delete your account now?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: runAccountDeletion,
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KText variant="headlineMd" style={styles.title}>Settings</KText>

      <KText variant="labelCaps" style={styles.sectionLabel}>Legal</KText>
      <View style={styles.legalGroup}>
        <TouchableOpacity
          testID="privacy-policy-btn"
          style={styles.legalRow}
          onPress={() => openLegalLink(LEGAL_URLS.privacy, 'Privacy Policy')}
          activeOpacity={0.7}
        >
          <KText variant="bodyMd" style={styles.legalRowText}>Privacy Policy</KText>
          <KText variant="bodyLg" style={styles.legalRowChevron}>›</KText>
        </TouchableOpacity>
        <TouchableOpacity
          testID="terms-of-service-btn"
          style={[styles.legalRow, styles.legalRowLast]}
          onPress={() => openLegalLink(LEGAL_URLS.terms, 'Terms of Service')}
          activeOpacity={0.7}
        >
          <KText variant="bodyMd" style={styles.legalRowText}>Terms of Service</KText>
          <KText variant="bodyLg" style={styles.legalRowChevron}>›</KText>
        </TouchableOpacity>
      </View>

      <KText variant="labelCaps" style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Account</KText>

      <KButton
        testID="delete-account-btn"
        label={isDeleting ? 'Deleting...' : 'Delete Account'}
        variant="danger"
        onPress={handleDeleteAccount}
        disabled={isDeleting}
        loading={isDeleting}
        height={64}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
    padding: KiranaSpacing.marginPage,
  },
  title: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 28,
  },
  legalGroup: {
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.lg,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: KiranaColors.surface,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    minHeight: KiranaSpacing.touchMin,
  },
  legalRowLast: {
    borderBottomWidth: 0,
  },
  legalRowText: {
    fontFamily: 'WorkSans_600SemiBold',
    color: KiranaColors.onSurface,
  },
  legalRowChevron: {
    color: KiranaColors.outline,
  },
});
