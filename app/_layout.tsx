import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutContent() {
  const { isLoading, isAuthenticated } = useAuth();

  // ✅ Show nothing while loading (splash screen remains visible)
  if (isLoading) {
    console.log('🔄 Still loading, keeping splash screen visible');
    return null;
  }

  console.log('🎨 Rendering app UI, splash screen will hide soon');

  // ✅ Array-based conditional rendering
  const screens = !isAuthenticated ? [
    <Stack.Screen key="index" name="index" />,
    <Stack.Screen key="logIn" name="logIn" />,
    <Stack.Screen key="signUpPassword" name="signUpPassword" />,
    <Stack.Screen key="signUpUser" name="signUpUser" />,
  ] : [
    <Stack.Screen key="tabs" name="(tabs)" />,
  ];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        presentation: 'card',
        gestureEnabled: false,
      }}
    >
      {screens}
      <Stack.Screen name="+not-found" options={{ title: 'Default Error Page'}} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProfileProvider>
        <EventsProvider>
          <AuthProvider>
            <RootLayoutContent />
          </AuthProvider>
        </EventsProvider>
      </ProfileProvider>
    </GestureHandlerRootView>
  );
}
