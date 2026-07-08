import React, { Component, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';
import KText from './ui/KText';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  private slideAnim = new Animated.Value(40);
  private fadeAnim = new Animated.Value(0);

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error);
    console.error("Caught by Global Error Boundary:", error, errorInfo);

    Animated.parallel([
      Animated.timing(this.slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      // Fallback
      this.slideAnim.setValue(40);
      this.fadeAnim.setValue(0);
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: this.fadeAnim,
                transform: [{ translateY: this.slideAnim }],
              },
            ]}
          >
            <KText variant="headlineMd" style={styles.icon}>⚠️</KText>
            <KText variant="headlineMd" style={styles.title}>Something went wrong, but your current bill is saved.</KText>
            <KText variant="bodyMd" style={styles.subtitle}>We&apos;ve logged the error and are working on it.</KText>
            <TouchableOpacity style={styles.btn} onPress={this.handleRestart}>
              <KText variant="labelCaps" style={styles.btnText}>Restart App</KText>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KiranaColors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: KiranaSpacing.marginPage },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: KiranaColors.onSurface, textAlign: 'center', marginBottom: 12 },
  subtitle: { color: KiranaColors.onSurfaceVariant, textAlign: 'center', marginBottom: 32 },
  btn: {
    backgroundColor: KiranaColors.primaryContainer,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.navy,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: KiranaRadius.md,
  },
  btnText: { color: KiranaColors.navy },
});
