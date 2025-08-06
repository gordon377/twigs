import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/styles';
import Ionicons from '@expo/vector-icons/Ionicons';

interface FormCardProps {
  children: React.ReactNode;
  icon?: string;
  label?: string;
  style?: any;
}

export function FormCard({ children, icon, label, style }: FormCardProps) {
  return (
    <View style={[styles.card, style]}>
      {label && (
        <View style={styles.header}>
          {icon && <Ionicons name={icon as any} size={16} color={colors.primary} />}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});