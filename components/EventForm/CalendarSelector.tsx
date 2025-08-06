import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { colors } from '@/styles/styles';
import { Calendar } from '@/types/events';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CalendarSelectorProps {
  calendars: Calendar[];
  selectedCalendarId?: string;
  selectedCalendarName?: string;
  onCalendarSelect: (calendar: Calendar) => void;
}

export function CalendarSelector({ calendars, selectedCalendarId, selectedCalendarName, onCalendarSelect }: CalendarSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId);
  const calendarColor = selectedCalendar?.hexcode || colors.primary;

  return (
    <>
      <TouchableOpacity style={styles.compactSelector} onPress={() => setShowModal(true)}>
        <View style={styles.compactSelectorContent}>
          <View style={[styles.calendarDot, { backgroundColor: calendarColor }]} />
          <Text style={styles.calendarNameText}>{selectedCalendarName || 'Select Calendar'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Calendar</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.calendarList} showsVerticalScrollIndicator={false}>
              {calendars.map((calendar) => (
                <TouchableOpacity
                  key={calendar.id}
                  style={[styles.calendarOption, selectedCalendarId === calendar.id && styles.calendarOptionSelected]}
                  onPress={() => {
                    onCalendarSelect(calendar);
                    setShowModal(false);
                  }}
                >
                  <View style={styles.calendarOptionContent}>
                    <View style={[styles.calendarColorDot, { backgroundColor: calendar.hexcode }]} />
                    <Text style={[
                      styles.calendarOptionText,
                      selectedCalendarId === calendar.id && styles.calendarOptionTextSelected
                    ]}>
                      {calendar.name}
                    </Text>
                  </View>
                  
                  {selectedCalendarId === calendar.id && (
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#059669', // Your colors.success value
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      shadowColor: '#059669',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3,
                      elevation: 3,
                    }}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calendarNameText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // New checkmark container style
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
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
  calendarList: {
    flex: 1,
    padding: 16,
  },
  calendarOption: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  calendarOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  calendarOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  calendarOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  calendarOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});