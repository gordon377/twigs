import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// ✅ Inner component that conditionally renders screens
function RootLayoutContent() {
  const { isLoading, isAuthenticated } = useAuth();


  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        presentation: 'card',
        gestureEnabled: false, // ✅ Disable swipe gestures entirely
      }}
    >
      {/* ✅ Conditionally render screens based on auth state */}
      {!isAuthenticated ? (
        // Unauthenticated screens
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="logIn" />
          <Stack.Screen name="signUpPassword" />
          <Stack.Screen name="signUpUser" />
        </>
      ) : (
        // Authenticated screens only
        <>
          <Stack.Screen name="(tabs)" />
        </>
      )}
      
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
