import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/styles/styles';
import { dateTimeHelpers } from '@/types/events';
import Ionicons from '@expo/vector-icons/Ionicons';

interface EventDateTimePickerProps {
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
  isAllDay: boolean;
  onDateTimeChange: (type: 'start' | 'end', isoString: string) => void;
}

export const EventDateTimePicker: React.FC<EventDateTimePickerProps> = ({
  startDate,
  endDate,
  isAllDay,
  onDateTimeChange,
}) => {
  const [showPicker, setShowPicker] = useState<{
    type: 'start' | 'end';
    mode: 'date' | 'time';
  } | null>(null);

  // ✅ Helper to get current Date object from ISO string
  const getDateFromISO = (isoString: string): Date => {
    try {
      return new Date(isoString);
    } catch (error) {
      console.error('Error parsing ISO date:', error);
      return new Date();
    }
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    
    if (!selectedDate || !showPicker) return;

    const { type, mode } = showPicker;
    
    if (mode === 'date') {
      // ✅ For date changes, preserve time component
      const currentISO = type === 'start' ? startDate : endDate;
      const currentTime = dateTimeHelpers.extractTimeFromISO(currentISO) || '12:00:00';
      const newDateStr = dateTimeHelpers.formatDateForStorage(selectedDate);
      const newISO = dateTimeHelpers.createISOString(newDateStr, currentTime);
      onDateTimeChange(type, newISO);
    } else if (mode === 'time') {
      // ✅ For time changes, preserve date component
      const currentISO = type === 'start' ? startDate : endDate;
      const currentDateStr = dateTimeHelpers.extractDateFromISO(currentISO);
      const newTimeStr = dateTimeHelpers.formatTimeForStorage(selectedDate);
      const newISO = dateTimeHelpers.createISOString(currentDateStr, newTimeStr);
      onDateTimeChange(type, newISO);
    }

    if (Platform.OS === 'ios') {
      setShowPicker(null);
    }
  };

  const showDateTimePicker = (type: 'start' | 'end', mode: 'date' | 'time') => {
    setShowPicker({ type, mode });
  };

  const getCurrentPickerValue = (): Date => {
    if (!showPicker) return new Date();
    return getDateFromISO(showPicker.type === 'start' ? startDate : endDate);
  };

  // ✅ Format for display
  const formatDateForDisplay = (isoString: string): string => {
    try {
      const date = getDateFromISO(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return isoString;
    }
  };

  const formatTimeForDisplay = (isoString: string): string => {
    if (isAllDay) return 'All day';
    
    try {
      const date = getDateFromISO(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return isoString;
    }
  };

  const isMultiDay = dateTimeHelpers.extractDateFromISO(startDate) !== 
                    dateTimeHelpers.extractDateFromISO(endDate);

  return (
    <View style={styles.container}>
      {/* Date Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Date</Text>
        </View>
        
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => showDateTimePicker('start', 'date')}
          >
            <Text style={styles.dateTimeLabel}>From</Text>
            <Text style={styles.dateTimeValue}>{formatDateForDisplay(startDate)}</Text>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => showDateTimePicker('end', 'date')}
          >
            <Text style={styles.dateTimeLabel}>To</Text>
            <Text style={styles.dateTimeValue}>{formatDateForDisplay(endDate)}</Text>
          </TouchableOpacity>
        </View>

        {isMultiDay && (
          <View style={styles.multiDayIndicator}>
            <Ionicons name="calendar" size={16} color={colors.warning} />
            <Text style={styles.multiDayText}>Multi-day event</Text>
          </View>
        )}
      </View>

      {/* Time Section - Only show if not all-day */}
      {!isAllDay && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>Time</Text>
          </View>
          
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => showDateTimePicker('start', 'time')}
            >
              <Text style={styles.dateTimeLabel}>From</Text>
              <Text style={styles.dateTimeValue}>
                {formatTimeForDisplay(startDate)}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
            </View>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => showDateTimePicker('end', 'time')}
            >
              <Text style={styles.dateTimeLabel}>To</Text>
              <Text style={styles.dateTimeValue}>
                {formatTimeForDisplay(endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal for Picker */}
      {showPicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {showPicker.mode === 'date' ? 'Select Date' : 'Select Time'}
                </Text>
                <TouchableOpacity onPress={() => setShowPicker(null)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={getCurrentPickerValue()}
                  mode={showPicker.mode}
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateTimeChange}
                  style={styles.picker}
                  textColor={colors.text}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// ✅ FIXED: Use correct color properties
const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: colors.cardBackground, // ✅ Use existing color
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder, // ✅ Use existing color
  },
  dateTimeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  separator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  separatorLine: {
    width: 12,
    height: 2,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
  },
  multiDayIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  multiDayText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  doneText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  pickerWrapper: {
    padding: 20,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    backgroundColor: colors.background,
  },
});