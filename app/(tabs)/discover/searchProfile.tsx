import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BigProfile from '@/components/BigProfile';

export default function SearchProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Params expected: username, displayName, bio, email, avatarUrl
  return (
    <BigProfile
      username={typeof params.username === 'string' ? params.username : undefined}
      displayName={typeof params.displayName === 'string' ? params.displayName : undefined}
      bio={typeof params.bio === 'string' ? params.bio : undefined}
      email={typeof params.email === 'string' ? params.email : undefined}
      avatarUrl={typeof params.avatarUrl === 'string' ? params.avatarUrl : undefined}
      userId= {typeof params.id === 'string' ? params.id : undefined}
      onClose={() => router.back()}
    />
  );
}
