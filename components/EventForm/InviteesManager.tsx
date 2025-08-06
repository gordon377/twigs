import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '@/styles/styles';
import Ionicons from '@expo/vector-icons/Ionicons';

interface InviteesManagerProps {
  invitees: string[];
  onInviteesChange: (invitees: string[]) => void;
}

export function InviteesManager({ invitees, onInviteesChange }: InviteesManagerProps) {
  const [newInvitee, setNewInvitee] = useState('');

  const addInvitee = () => {
    const email = newInvitee.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (invitees.includes(email)) {
      Alert.alert('Error', 'This email is already added');
      return;
    }
    onInviteesChange([...invitees, email]);
    setNewInvitee('');
  };

  const removeInvitee = (email: string) => {
    onInviteesChange(invitees.filter(invitee => invitee !== email));
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail" size={16} color={colors.info} />
          <Text style={styles.sectionLabel}>INVITEES</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{invitees.length}</Text>
        </View>
      </View>

      <View style={styles.inviteeRow}>
        <TextInput
          style={styles.inviteeInput}
          value={newInvitee}
          onChangeText={setNewInvitee}
          placeholder="Enter email address"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          onSubmitEditing={addInvitee}
        />
        <TouchableOpacity style={styles.addButton} onPress={addInvitee}>
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {invitees.length > 0 && (
        <View style={styles.inviteesList}>
          {invitees.map((invitee, index) => (
            <View key={index} style={styles.inviteeItem}>
              <View style={styles.inviteeInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{invitee.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.inviteeEmail}>{invitee}</Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => removeInvitee(invitee)}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    backgroundColor: colors.info,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
  },
  inviteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  inviteeInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.offWhite,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  addButton: {
    backgroundColor: colors.info,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteesList: {
    gap: 8,
  },
  inviteeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.offWhite,
    borderRadius: 10,
  },
  inviteeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  inviteeEmail: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
});