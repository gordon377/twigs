import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/styles';
import { CalendarHeader } from '@/components/Drawer';
import CalendarManagement from '@/components/CalendarManagement';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function ManageCalendarsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <CalendarHeader
        title="Manage Calendars"
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back()
        }}
      />
      
      <CalendarManagement
        visible={true}
        onClose={() => router.back()}
        mode="manage"
      />
    </SafeAreaView>
  );
}