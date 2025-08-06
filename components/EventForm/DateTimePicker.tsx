import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, Animated } from 'react-native';
import { colors } from '@/styles/styles';
import { dateTimeHelpers } from '@/types/events';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  onDateChange: (type: 'start' | 'end', value: string) => void;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
}

export function EventDateTimePicker({ 
  startDate, 
  endDate, 
  startTime, 
  endTime, 
  isAllDay, 
  onDateChange, 
  onTimeChange 
}: DateTimePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempValue, setTempValue] = useState(new Date());
  
  const modalAnimations = {
    opacity: React.useRef(new Animated.Value(0)).current,
    translateY: React.useRef(new Animated.Value(300)).current,
  };

  const formatTimeForDisplay = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const openPicker = (target: 'start' | 'end', mode: 'date' | 'time') => {
    setPickerTarget(target);
    setPickerMode(mode);
    
    if (mode === 'date') {
      setTempValue(new Date(target === 'start' ? startDate : endDate));
    } else {
      const currentTime = target === 'start' ? startTime : endTime;
      if (currentTime) {
        const [hours, minutes] = currentTime.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
        setTempValue(timeDate);
      }
    }
    
    setShowModal(true);
    modalAnimations.opacity.setValue(0);
    modalAnimations.translateY.setValue(300);
    
    Animated.parallel([
      Animated.timing(modalAnimations.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(modalAnimations.translateY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const closePicker = () => {
    Animated.parallel([
      Animated.timing(modalAnimations.opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(modalAnimations.translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowModal(false));
  };

  const confirmSelection = () => {
    if (pickerMode === 'date') {
      const dateStr = dateTimeHelpers.formatDateForStorage(tempValue);
      onDateChange(pickerTarget, dateStr);
    } else {
      const timeStr = dateTimeHelpers.formatTimeForStorage(tempValue);
      onTimeChange(pickerTarget, timeStr);
    }
    closePicker();
  };

  const renderButton = (type: 'start' | 'end', mode: 'date' | 'time') => {
    const isDate = mode === 'date';
    const value = isDate 
      ? formatDateForDisplay(type === 'start' ? startDate : endDate)
      : formatTimeForDisplay(type === 'start' ? startTime : endTime);
    
    return (
      <TouchableOpacity 
        style={isDate ? styles.dateButton : styles.timeButton}
        onPress={() => openPicker(type, mode)}
      >
        <Ionicons 
          name={isDate ? "calendar-outline" : "time-outline"} 
          size={16} 
          color={isDate ? colors.primary : colors.white} 
        />
        <Text style={isDate ? styles.dateButtonText : styles.timeButtonText}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Start Date/Time */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="play" size={16} color={colors.success} />
          <Text style={styles.sectionLabel}>STARTS</Text>
        </View>
        <View style={styles.dateTimeRow}>
          {renderButton('start', 'date')}
          {!isAllDay && renderButton('start', 'time')}
        </View>
      </View>

      {/* End Date/Time */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stop" size={16} color={colors.danger} />
          <Text style={styles.sectionLabel}>ENDS</Text>
        </View>
        <View style={styles.dateTimeRow}>
          {renderButton('end', 'date')}
          {!isAllDay && renderButton('end', 'time')}
        </View>
      </View>

      {/* Picker Modal */}
      <Modal visible={showModal} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: modalAnimations.opacity }]}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closePicker} />
          
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: modalAnimations.translateY }] }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={confirmSelection}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempValue}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => selectedDate && setTempValue(selectedDate)}
                style={styles.picker}
                textColor={colors.text}
                accentColor={colors.primary}
                minuteInterval={5}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '20',
  },
  dateButtonText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  timeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, minWidth: 110,
  },
  timeButtonText: { fontSize: 15, color: colors.white, fontWeight: '600' },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, width: '100%' },
  modalContainer: {
    backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder, backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  cancelText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  doneButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 8 },
  doneText: { fontSize: 16, color: colors.white, fontWeight: '700' },
  pickerContainer: { paddingVertical: 20, alignItems: 'center', minHeight: 200 },
  picker: { width: '100%', height: 200, backgroundColor: colors.background },
});