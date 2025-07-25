import { Stack } from 'expo-router';

export default function CalendarStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="eventDetails" options={{ title: 'Event Details' }} />
    </Stack>
  );
}