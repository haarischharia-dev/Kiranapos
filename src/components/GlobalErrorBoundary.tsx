import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
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
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Something went wrong, but your current bill is saved.</Text>
            <Text style={styles.subtitle}>We've logged the error and are working on it.</Text>
            <TouchableOpacity style={styles.btn} onPress={this.handleRestart}>
              <Text style={styles.btnText}>Restart App</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2d3436', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#636e72', textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: '#0984e3', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
