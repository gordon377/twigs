import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View, Button } from 'react-native';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import { colors } from '@/styles/styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarHeader } from '@/components/Drawer';
import { EventsList, SingleDateCalendar } from '@/components/Calendar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

//Note: May have to look at localizing the calendar to the user's preference (date format, time zone, calendar type, etc.)

const linearAccent = "#585ABF";

const linearTheme: CalendarTheme = {
  rowMonth: {
    content: {
      textAlign: "left",
      color: "rgba(255, 255, 255, 0.5)",
      fontWeight: "700",
    },
  },
  rowWeek: {
    container: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
      borderStyle: "solid",
    },
  },
  itemWeekName: { content: { color: "rgba(255, 255, 255, 0.5)" } },
  itemDayContainer: {
    activeDayFiller: {
      backgroundColor: linearAccent,
    },
  },
  itemDay: {
    idle: ({ isPressed, isWeekend }) => ({
      container: {
        backgroundColor: isPressed ? linearAccent : "transparent",
        borderRadius: 4,
      },
      content: {
        color: isWeekend && !isPressed ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
      },
    }),
    today: ({ isPressed }) => ({
      container: {
        borderColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: isPressed ? 4 : 30,
        backgroundColor: isPressed ? linearAccent : "transparent",
      },
      content: {
        color: isPressed ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
      },
    }),
    active: ({ isEndOfRange, isStartOfRange }) => ({
      container: {
        backgroundColor: linearAccent,
        borderTopLeftRadius: isStartOfRange ? 4 : 0,
        borderBottomLeftRadius: isStartOfRange ? 4 : 0,
        borderTopRightRadius: isEndOfRange ? 4 : 0,
        borderBottomRightRadius: isEndOfRange ? 4 : 0,
      },
      content: {
        color: "#ffffff",
      },
    }),
  },
};




function monthIncrement(today:any, increment: number) {
  const next = new Date(today);
  next.setMonth(next.getMonth() + increment);
  return toDateId(next);
}



export default function CalendarScreen() {
  const today = toDateId(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // Example right actions for the header
  const rightActions = [
    {
      icon: <Ionicons name="options-outline" size={24} color="#070c1f" />,
      onPress: () => { /* handle options (viewing) */ },
    },
    {
      icon: <Ionicons name="search" size={24} color="#070c1f" />,
      onPress: () => { /* handle search */ },
    },
    {
      icon: <Ionicons name="add-sharp" size={24} color="#070c1f" />,
      onPress: () => { 
        router.push(`/(tabs)/calendar/createEvent?selectedDate=${selectedDate}`);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <CalendarHeader
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color="#070c1f" />,
          onPress: () => {/* handle back navigation */}
        }}
        rightActions={rightActions}
      />
      <View style={{ flex: 1 }}>
        {/* Calendar takes up top half */}
        <View style={{ flex: 1 }}>
          <SingleDateCalendar 
            today={today}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </View>
        {/* Events list takes up bottom half */}
        <View style={{ flex: 1, borderTopWidth: 1, borderColor: colors.offWhite }}>
          <EventsList date={selectedDate} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.darkGreen,
    margin: 8,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});