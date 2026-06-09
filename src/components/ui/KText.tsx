import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { KiranaColors, KiranaType } from '@/constants/kirana-design';

type Variant = keyof typeof KiranaType;

type KTextProps = TextProps & {
  variant?: Variant;
  color?: string;
};

export default function KText({ variant = 'bodyMd', color, style, ...rest }: KTextProps) {
  return (
    <Text
      style={[KiranaType[variant], { color: color ?? KiranaColors.onSurface }, style]}
      {...rest}
    />
  );
}

export const kTextStyles = StyleSheet.create({
  owed: { color: KiranaColors.owed },
  settled: { color: KiranaColors.settled },
  muted: { color: KiranaColors.onSurfaceVariant },
});
