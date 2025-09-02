import { Stack } from 'expo-router';
import React from 'react';

export default function DiscoverLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Discover', headerShown: false }} />
      <Stack.Screen name="searchProfile" options={{ title: 'Profile', presentation: 'transparentModal', headerShown: false }} />
    </Stack>
  );
}
