import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme/tokens';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>habittt</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 32,
    color: colors.text,
  },
});
