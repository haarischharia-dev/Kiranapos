import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { KiranaColors } from '@/constants/kirana-design';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | 'round';
}

export default function Skeleton({ width, height, radius = 8 }: SkeletonProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.85]),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as number | `${number}%` | undefined,
          height: height as number | `${number}%` | undefined,
          borderRadius: radius === 'round' ? 9999 : radius,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: KiranaColors.outlineVariant,
  },
});
