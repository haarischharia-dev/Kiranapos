import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import KText from './KText';

type KInputProps = TextInputProps & {
  label?: string;
  error?: string | null;
};

export default function KInput({ label, error, style, ...rest }: KInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <KText variant="labelCaps" style={styles.label}>{label}</KText> : null}
      <TextInput
        placeholderTextColor={KiranaColors.outline}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <KText variant="bodyMd" style={styles.error}>{error}</KText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    marginBottom: KiranaSpacing.stackGap,
  },
  label: {
    color: KiranaColors.onSurfaceVariant,
  },
  input: {
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    backgroundColor: KiranaColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: 'WorkSans_400Regular',
    color: KiranaColors.onSurface,
    minHeight: KiranaSpacing.touchMin,
  },
  inputError: {
    borderColor: KiranaColors.error,
    borderWidth: KiranaBorder.focus,
  },
  error: {
    color: KiranaColors.error,
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
  },
});
