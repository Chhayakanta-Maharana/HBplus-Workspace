import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../theme';
import type { DashboardSection, UserRole } from '../types/auth';
import { NAV_ITEMS } from './Sidebar';

interface MobileBottomNavProps {
  role: UserRole;
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
}

export function MobileBottomNav({
  role,
  activeSection,
  onSelectSection,
}: MobileBottomNavProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === 'admin'
  );

  return (
    <View style={styles.container}>
      {visibleItems.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectSection(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabPressed,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={19}
              color={isActive ? '#F59E0B' : '#9CA3AF'}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, isActive && styles.labelActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111214',
    borderTopWidth: 1,
    borderTopColor: '#23262C',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  tabPressed: {
    opacity: 0.75,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 10.5,
    fontWeight: '500',
  },
  labelActive: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});
