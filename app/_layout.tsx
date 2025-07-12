import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Default Error Page'}} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false}} />
      </Stack>
    </GestureHandlerRootView>
  );
}
