import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LabScreen } from '../screens/LabScreen';
import { OpeningScreen } from '../screens/OpeningScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ShelfScreen } from '../screens/ShelfScreen';
import { colors } from '../theme/tokens';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.background },
};

/**
 * Native stack: real native transitions, swipe-back on iOS and the back
 * button on Android. Screens draw their own top bar (mockup style).
 */
export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName="Opening"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Opening" component={OpeningScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Shelf" component={ShelfScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          {__DEV__ && (
            <Stack.Screen name="Lab">
              {({ navigation }) => <LabScreen onBack={navigation.goBack} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
