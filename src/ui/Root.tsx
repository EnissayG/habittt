import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { HabitId } from '../domain';
import { HabitScreen } from './screens/HabitScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LabScreen } from './screens/LabScreen';
import { NewHabitScreen } from './screens/NewHabitScreen';
import { colors } from './theme/tokens';

// Minimal navigation: three screens do not justify a router yet.
type Route = { name: 'home' } | { name: 'new' } | { name: 'habit'; id: HabitId } | { name: 'lab' };

export function Root() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const goHome = () => setRoute({ name: 'home' });

  // Android back button returns home instead of closing the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') return false;
      setRoute({ name: 'home' });
      return true;
    });
    return () => subscription.remove();
  }, [route.name]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {route.name === 'home' && (
          <HomeScreen
            onOpenHabit={(id) => setRoute({ name: 'habit', id })}
            onNewHabit={() => setRoute({ name: 'new' })}
            onOpenLab={__DEV__ ? () => setRoute({ name: 'lab' }) : undefined}
          />
        )}
        {route.name === 'new' && (
          <NewHabitScreen onCreated={(id) => setRoute({ name: 'habit', id })} onCancel={goHome} />
        )}
        {route.name === 'habit' && <HabitScreen habitId={route.id} onBack={goHome} />}
        {__DEV__ && route.name === 'lab' && <LabScreen onBack={goHome} />}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
});
