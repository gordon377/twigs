import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="+not-found" options={{ title: 'Default Error Page'}} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false}} />
    </Stack>
  );
}
