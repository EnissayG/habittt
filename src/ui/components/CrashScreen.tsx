import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, fonts, spacing } from '../theme/tokens';

interface CrashBoundaryProps {
  children: ReactNode;
}

/**
 * The last safety net (ADR 0024): if a screen fails while drawing, the app
 * says so gently and offers to start again, instead of a blank or frozen
 * screen. Nothing the person wrote is lost: everything is in the database.
 */
export class CrashBoundary extends Component<CrashBoundaryProps, { failed: boolean; key: number }> {
  state = { failed: false, key: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={styles.screen} accessibilityLiveRegion="polite">
          <Text style={styles.title}>Quelque chose s&apos;est mal passé.</Text>
          <Text style={styles.body}>
            Tes plantes et tes notes sont bien gardées. Tu peux reprendre là où tu étais.
          </Text>
          <Button
            label="Reprendre"
            onPress={() => this.setState(({ key }) => ({ failed: false, key: key + 1 }))}
          />
        </View>
      );
    }
    // A new key starts the screens again from the opening.
    return (
      <View key={this.state.key} style={styles.fill}>
        {this.props.children}
      </View>
    );
  }
}

// Drawn outside the lights (the theme may be what failed): the light palette.
const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
    gap: spacing.md,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text },
});
