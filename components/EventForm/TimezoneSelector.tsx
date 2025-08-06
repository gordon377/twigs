import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { colors } from '@/styles/styles';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  timezones: string[];
  onTimezoneSelect: (timezone: string) => void;
}

export function TimezoneSelector({ selectedTimezone, timezones, onTimezoneSelect }: TimezoneSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const getTimezoneDisplayName = (timezone: string) => {
    return timezone.split('/').pop()?.replace('_', ' ') || timezone;
  };

  return (
    <>
      <TouchableOpacity style={styles.compactSelector} onPress={() => setShowModal(true)}>
        <Text style={styles.selectedValueText}>
          {getTimezoneDisplayName(selectedTimezone)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      
      {/* Modal for timezone selection */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Timezone</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timezoneList} showsVerticalScrollIndicator={false}>
              {timezones.map((timezone, index) => {
                const isSelected = selectedTimezone === timezone;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.timezoneOption, isSelected && styles.timezoneOptionSelected]}
                    onPress={() => {
                      onTimezoneSelect(timezone);
                      setShowModal(false);
                    }}
                  >
                    <Text style={[styles.timezoneText, isSelected && styles.timezoneTextSelected]}>
                      {getTimezoneDisplayName(timezone)}
                    </Text>
                    <Text style={styles.timezoneSubtext}>
                      {timezone}
                    </Text>
                    
                    {isSelected && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
    gap: 8,
  },
  selectedValueText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
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
  timezoneList: {
    flex: 1,
    padding: 16,
  },
  timezoneOption: {
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
  timezoneOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  timezoneText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  timezoneTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  timezoneSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginRight: 12,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});