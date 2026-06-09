import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../utils/supabase';
import KText from '../components/ui/KText';
import KInput from '../components/ui/KInput';
import KButton from '../components/ui/KButton';
import { KiranaColors, KiranaSpacing } from '@/constants/kirana-design';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      Alert.alert('Sign in failed', message);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <KText variant="headlineLg" style={styles.title}>KiranaPOS</KText>
        <KText variant="bodyMd" style={styles.subtitle}>Sign in to sync your shop catalogue</KText>

        <KInput
          label="Email"
          placeholder="you@shop.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <KInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <KButton
          label="Sign In"
          onPress={handleSignIn}
          loading={isSigningIn}
          height={64}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
    justifyContent: 'center',
    padding: KiranaSpacing.marginPage,
  },
  card: {
    backgroundColor: KiranaColors.surface,
    borderWidth: 2,
    borderColor: KiranaColors.navy,
    borderRadius: 12,
    padding: KiranaSpacing.marginPage,
    gap: 4,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 16,
  },
});
