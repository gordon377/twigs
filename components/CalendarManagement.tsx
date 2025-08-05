import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet,
  Platform, Modal, BackHandler
} from 'react-native';
import { colors } from '@/styles/styles';
import { useEvents } from '@/hooks/useEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Calendar } from '@/types/events';

interface CalendarManagementProps {
  visible: boolean;
  onClose: () => void;
  onSelectCalendar?: (calendar: Calendar) => void;
  selectedCalendarId?: string;
  mode?: 'select' | 'manage'; // select = for event creation, manage = full management
}

export default function CalendarManagement({
  visible,
  onClose,
  onSelectCalendar,
  selectedCalendarId,
  mode = 'select'
}: CalendarManagementProps) {
  const { calendars, addCalendar, updateCalendar, deleteCalendar } = useEvents();
  
  // Modal stack states
  const [activeModal, setActiveModal] = useState<'list' | 'add' | 'edit' | 'manage'>('list');
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  
  // Form states
  const [calendarForm, setCalendarForm] = useState({
    name: '',
    hexcode: '#007AFF',
  });

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      if (activeModal === 'add' || activeModal === 'edit') {
        setActiveModal(mode === 'select' ? 'list' : 'manage');
        return true;
      }
      if (activeModal === 'manage' && mode === 'select') {
        setActiveModal('list');
        return true;
      }
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, activeModal, mode, onClose]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (visible) {
      setActiveModal(mode === 'select' ? 'list' : 'manage');
      resetForm();
    }
  }, [visible, mode]);

  const resetForm = () => {
    setCalendarForm({ name: '', hexcode: '#007AFF' });
    setEditingCalendar(null);
  };

  const handleSelectCalendar = (calendar: Calendar) => {
    if (onSelectCalendar) {
      onSelectCalendar(calendar);
    }
    onClose();
  };

  const openAddCalendar = () => {
    resetForm();
    setActiveModal('add');
  };

  const openEditCalendar = (calendar: Calendar) => {
    setEditingCalendar(calendar);
    setCalendarForm({
      name: calendar.name,
      hexcode: calendar.hexcode,
    });
    setActiveModal('edit');
  };

  const handleSaveCalendar = async () => {
    if (!calendarForm.name.trim()) {
      Alert.alert('Error', 'Please enter a calendar name');
      return;
    }

    if (!calendarForm.hexcode.match(/^#[0-9A-Fa-f]{6}$/)) {
      Alert.alert('Error', 'Please enter a valid hex color (e.g., #FF5733)');
      return;
    }

    try {
      if (editingCalendar) {
        // Update existing calendar
        const updatedCalendar = await updateCalendar(editingCalendar.id, {
          name: calendarForm.name.trim(),
          hexcode: calendarForm.hexcode,
        });

        if (updatedCalendar) {
          Alert.alert('Success', 'Calendar updated successfully!');
          setActiveModal('manage');
        } else {
          Alert.alert('Error', 'Failed to update calendar');
        }
      } else {
        // Create new calendar
        const newCalendar = await addCalendar({
          name: calendarForm.name.trim(),
          hexcode: calendarForm.hexcode,
        });

        if (newCalendar) {
          Alert.alert('Success', 'Calendar added successfully!');
          if (mode === 'select' && onSelectCalendar) {
            handleSelectCalendar(newCalendar);
          } else {
            setActiveModal('manage');
          }
        } else {
          Alert.alert('Error', 'Failed to add calendar');
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Calendar save error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDeleteCalendar = async (calendar: Calendar) => {
    if (calendars.length <= 1) {
      Alert.alert('Error', 'You must have at least one calendar');
      return;
    }

    Alert.alert(
      'Delete Calendar',
      `Are you sure you want to delete "${calendar.name}"? All events in this calendar will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteCalendar(calendar.id);
              if (success) {
                Alert.alert('Success', 'Calendar deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete calendar');
              }
            } catch (error) {
              console.error('Delete calendar error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  const renderCalendarList = () => (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Select Calendar</Text>
        <TouchableOpacity onPress={() => setActiveModal('manage')} style={styles.headerButton}>
          <Ionicons name="settings" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Calendar List */}
      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {/* Section Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Choose a calendar</Text>
          <Text style={styles.sectionSubheader}>{calendars.length} calendar{calendars.length !== 1 ? 's' : ''} available</Text>
        </View>

        {/* Calendar Options */}
        <View style={styles.calendarGrid}>
          {calendars.map((calendar, index) => {
            const isSelected = selectedCalendarId === calendar.id;
            return (
              <TouchableOpacity
                key={calendar.id}
                style={[
                  styles.calendarCard,
                  isSelected && styles.calendarCardSelected,
                  { marginBottom: index === calendars.length - 1 ? 0 : 12 }
                ]}
                onPress={() => handleSelectCalendar(calendar)}
                activeOpacity={0.7}
              >
                {/* Calendar Color & Info */}
                <View style={styles.calendarCardContent}>
                  <View style={styles.calendarLeftSection}>
                    <View style={[
                      styles.calendarColorCircle,
                      { backgroundColor: calendar.hexcode }
                    ]}>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.calendarInfo}>
                      <Text style={[
                        styles.calendarCardTitle,
                        isSelected && styles.calendarCardTitleSelected
                      ]}>
                        {calendar.name}
                      </Text>
                      <Text style={styles.calendarCardSubtitle}>
                        {calendar.hexcode.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Selection Indicator */}
                  <View style={[
                    styles.selectionIndicator,
                    isSelected && styles.selectionIndicatorActive
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                </View>

                {/* Selected Border Glow */}
                {isSelected && <View style={styles.selectedBorder} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add New Calendar Button */}
        <TouchableOpacity 
          style={styles.addNewButton} 
          onPress={openAddCalendar}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIconContainer}>
              <Ionicons name="add" size={20} color={colors.success} />
            </View>
            <View style={styles.addButtonTextContainer}>
              <Text style={styles.addButtonTitle}>Create New Calendar</Text>
              <Text style={styles.addButtonSubtitle}>Add a custom calendar with your preferred color</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderManageCalendars = () => (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => mode === 'select' ? setActiveModal('list') : onClose()}>
          <Text style={styles.cancelText}>
            {mode === 'select' ? '← Back' : 'Close'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Manage Calendars</Text>
        <TouchableOpacity onPress={openAddCalendar}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Calendar Management List */}
      <ScrollView style={styles.modalContent}>
        <Text style={styles.sectionTitle}>
          Your Calendars ({calendars.length})
        </Text>

        {calendars.map((calendar) => (
          <View key={calendar.id} style={styles.calendarManageItem}>
            <View style={styles.calendarInfo}>
              <View style={[styles.calendarDot, { backgroundColor: calendar.hexcode }]} />
              <View style={styles.calendarDetails}>
                <Text style={styles.calendarName}>{calendar.name}</Text>
                <Text style={styles.calendarHex}>Color: {calendar.hexcode}</Text>
              </View>
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditCalendar(calendar)}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
              
              {calendars.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCalendar(calendar)}
                >
                  <Ionicons name="trash" size={16} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>

            {selectedCalendarId === calendar.id && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Currently Selected</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderCalendarForm = () => (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setActiveModal(mode === 'select' ? 'list' : 'manage')}>
          <Text style={styles.cancelText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>
          {editingCalendar ? 'Edit Calendar' : 'Add New Calendar'}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveCalendar}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView style={styles.modalContent}>
        {/* Calendar Name */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Calendar Name</Text>
          <TextInput
            style={styles.formInput}
            value={calendarForm.name}
            onChangeText={(text) => setCalendarForm(prev => ({ ...prev, name: text }))}
            placeholder="e.g., Work, Personal, Family"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
        </View>

        {/* Color Picker */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Calendar Color</Text>
          
          {/* Preset Colors */}
          <View style={styles.colorGrid}>
            {[
              '#007AFF', '#FF6B6B', '#4ECDC4', '#45B7D1',
              '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
              '#FF7675', '#74B9FF', '#00CEC9', '#FDCB6E'
            ].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  calendarForm.hexcode === color && styles.colorOptionSelected
                ]}
                onPress={() => setCalendarForm(prev => ({ ...prev, hexcode: color }))}
              >
                {calendarForm.hexcode === color && (
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Hex Input */}
          <Text style={styles.customColorLabel}>Or enter custom hex code:</Text>
          <View style={styles.hexInputRow}>
            <TextInput
              style={styles.hexInput}
              value={calendarForm.hexcode}
              onChangeText={(text) => setCalendarForm(prev => ({ ...prev, hexcode: text }))}
              placeholder="#007AFF"
              placeholderTextColor={colors.textMuted}
              maxLength={7}
            />
            <View style={[styles.hexPreview, { backgroundColor: calendarForm.hexcode }]} />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.formLabel}>Preview</Text>
          <View style={styles.previewItem}>
            <View style={[styles.calendarDot, { backgroundColor: calendarForm.hexcode }]} />
            <Text style={styles.previewText}>
              {calendarForm.name || 'Calendar Name'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderCurrentModal = () => {
    switch (activeModal) {
      case 'list':
        return renderCalendarList();
      case 'manage':
        return renderManageCalendars();
      case 'add':
      case 'edit':
        return renderCalendarForm();
      default:
        return renderCalendarList();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {renderCurrentModal()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 24,
    maxHeight: '85%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  modalContent: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubheader: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  calendarGrid: {
    paddingHorizontal: 24,
  },
  calendarCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  calendarCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  calendarCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarColorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Removed duplicate calendarInfo style to fix error.
  calendarCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  calendarCardTitleSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  calendarCardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorActive: {
    // Active state handled by icon
  },
  addNewButton: {
    backgroundColor: colors.successLight,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addButtonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addButtonTextContainer: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 2,
  },
  addButtonSubtitle: {
    fontSize: 13,
    color: colors.success + 'CC',
    fontWeight: '500',
  },

  // ... keep all other existing styles for other modals ...
  // Removed duplicate modalHeader style to fix error.
  cancelText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  manageText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
  },
  // modalContent: {
  //   flex: 1,
  //   paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  // },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  calendarOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
  },
  calendarOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  calendarOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
  addCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.successLight,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    marginTop: 8,
  },
  addCalendarText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '700',
  },
  calendarManageItem: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarDetails: {
    flex: 1,
    marginLeft: 12,
  },
  calendarName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  calendarHex: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-end',
  },
  editButton: {
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: colors.dangerLight,
    padding: 8,
    borderRadius: 8,
  },
  currentBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  colorOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  customColorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexInput: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hexPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.offWhite,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});