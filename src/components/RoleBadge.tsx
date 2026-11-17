import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme';
import type { UserRole } from '../types/auth';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
  tone?: 'light' | 'dark';
}

export function RoleBadge({
  role,
  size = 'md',
  tone = 'light',
}: RoleBadgeProps) {
  const isAdmin = role === 'admin';
  const isSmall = size === 'sm';
  const isDark = tone === 'dark';

  return (
    <View
      style={[
        styles.badge,
        isAdmin
          ? isDark
            ? styles.adminDark
            : styles.adminLight
          : isDark
            ? styles.userDark
            : styles.userLight,
        isSmall && styles.badgeSmall,
      ]}
    >
      <Ionicons
        name={isAdmin ? 'shield-checkmark' : 'person'}
        size={isSmall ? 11 : 13}
        color={
          isAdmin
            ? isDark
              ? '#FBBF24'
              : '#B45309'
            : isDark
              ? '#CBD5E1'
              : '#475569'
        }
      />
      <Text
        style={[
          styles.label,
          isAdmin
            ? isDark
              ? styles.adminTextDark
              : styles.adminTextLight
            : isDark
              ? styles.userTextDark
              : styles.userTextLight,
          isSmall && styles.labelSmall,
        ]}
      >
        {isAdmin ? 'Admin' : 'User'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  adminLight: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  adminDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  userLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  userDark: {
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  labelSmall: {
    fontSize: 11,
  },
  adminTextLight: {
    color: '#B45309',
  },
  adminTextDark: {
    color: '#FBBF24',
  },
  userTextLight: {
    color: '#334155',
  },
  userTextDark: {
    color: '#E2E8F0',
  },
});
