import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Show header for all profile screens
        headerStyle: { backgroundColor: '#25292e' },
        headerTintColor: '#fff',
        animation: 'slide_from_right', // iOS-style stack animation
      }}
    >
    </Stack>
  );
}