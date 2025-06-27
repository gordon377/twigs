import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View, Button } from 'react-native';
import { Calendar, CalendarTheme, toDateId } from '@marceloterreiro/flash-calendar';
import { CalendarListDateRange } from '@/components/Calendar';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';

//Note: May have to look at localizing the calendar to the user's preference (date format, time zone, calendar type, etc.)

const linearAccent = "#585ABF";
const today = toDateId(new Date());


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

export default function CalendarScreen(){
  const [selectedDate, setSelectedDate] = useState(today);
  const [showRange, setShowRange] = useState(false);

  return (
    <View style={styles.cal}>
      <Text style={styles.text}>
        Selected date: {selectedDate} 
        {"\n"}
        Selected date range: 
      </Text>
      <Calendar.List
        //theme={linearTheme}
        calendarInitialMonthId={today}
        calendarActiveDateRanges={[
          {
            startId: selectedDate,
            endId: selectedDate,
          },
        ]}
        onCalendarDayPress={setSelectedDate}
      />
      <View style={styles.cal}>
        <Text style={styles.text}>Date Range Picker</Text>
        <CalendarListDateRange />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cal: {
    flex: 1,
    backgroundColor: '#fff', 
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: '#000',
  },
});