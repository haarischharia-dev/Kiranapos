import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing, KiranaType } from '@/constants/kirana-design';
import KText from './KText';

type Variant = 'primary' | 'secondary' | 'navy' | 'danger';

type KButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  height?: number;
};

export default function KButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
  style,
  labelStyle,
  height = KiranaSpacing.touchMin,
}: KButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.base,
        { minHeight: height },
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'navy' && styles.navy,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? KiranaColors.navy : KiranaColors.onPrimary} />
      ) : (
        <KText
          variant="labelCaps"
          style={[
            styles.label,
            variant === 'secondary' && styles.secondaryLabel,
            (variant === 'navy' || variant === 'danger') && styles.onDarkLabel,
            labelStyle,
          ]}
        >
          {label}
        </KText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: KiranaRadius.md,
    borderWidth: KiranaBorder.card,
  },
  primary: {
    backgroundColor: KiranaColors.primaryContainer,
    borderColor: KiranaColors.onPrimaryContainer,
  },
  secondary: {
    backgroundColor: KiranaColors.surface,
    borderColor: KiranaColors.navy,
  },
  navy: {
    backgroundColor: KiranaColors.navy,
    borderColor: KiranaColors.navy,
  },
  danger: {
    backgroundColor: KiranaColors.error,
    borderColor: KiranaColors.error,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: KiranaColors.navy,
    fontSize: 14,
  },
  secondaryLabel: {
    color: KiranaColors.navy,
  },
  onDarkLabel: {
    color: KiranaColors.onPrimary,
  },
});
