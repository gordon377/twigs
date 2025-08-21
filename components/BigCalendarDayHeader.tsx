import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const BigCalendarDayHeader: React.FC<{ date: Date }> = ({ date }) => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayNumber = date.getDate();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.circle}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayNumber}>{dayNumber}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'flex-start',
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dayName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dayNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
});