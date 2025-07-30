import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { EventsProvider } from '@/contexts/EventsContext'; // ✅ Add EventsProvider

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProfileProvider>
        <EventsProvider> {/* ✅ Add EventsProvider */}
          <Stack
            screenOptions={{
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              animation: 'slide_from_right',
              presentation: 'card',
              headerShown: false,
              // ✅ Remove gestureResponseDistance - default works fine
            }}
          >
            <Stack.Screen name="logIn" />
            <Stack.Screen name="index" />
            <Stack.Screen name="signUpPassword" />
            <Stack.Screen name="signUpUser" />
            <Stack.Screen name="+not-found" options={{ title: 'Default Error Page'}} />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </EventsProvider>
      </ProfileProvider>
    </GestureHandlerRootView>
  );
}
