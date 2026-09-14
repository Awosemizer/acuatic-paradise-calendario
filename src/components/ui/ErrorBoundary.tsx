import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>{this.props.fallbackTitle ?? 'Algo salió mal'}</Text>
          <Text style={styles.body}>{this.state.error.message}</Text>
          <Pressable onPress={() => this.setState({ error: null })} style={styles.btn}>
            <Text style={styles.btnText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  title: { color: colors.navy, fontWeight: '800', fontSize: 18, textAlign: 'center' },
  body: { color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  btn: {
    marginTop: 8,
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnText: { color: colors.white, fontWeight: '800' },
});
