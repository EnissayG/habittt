import { StyleSheet, Text } from 'react-native';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import type { ScreenProps } from '../navigation/types';
import { colors, fonts } from '../theme/tokens';

/** Screen 11, built in phase 3. Reachable from the shelf's gear icon. */
export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  return (
    <Screen>
      <TopBar backLabel="étagère" onBack={navigation.goBack} />
      <Text style={styles.title}>Réglages</Text>
      <Text style={styles.body}>Les réglages arrivent bientôt.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
