import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme';
import type { DashboardSection, UserProfile } from '../types/auth';
import { BrandLogo } from './BrandLogo';
import { RoleBadge } from './RoleBadge';
import { UserAvatar } from './UserAvatar';

export interface NavItemConfig {
  id: DashboardSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
  { id: 'tasks', label: 'Tasks', icon: 'checkbox-outline' },
  { id: 'team', label: 'Team', icon: 'people-outline', adminOnly: true },
  { id: 'reports', label: 'Reports', icon: 'document-text-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

interface SidebarProps {
  user: UserProfile;
  allowedDomain: string;
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  onLogout: () => void;
  onCloseMobile?: () => void;
}

export function Sidebar({
  user,
  allowedDomain,
  activeSection,
  onSelectSection,
  onLogout,
  onCloseMobile,
}: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user.role === 'admin'
  );

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* Brand Header (Real HB+ Logo) */}
        <View style={styles.brandRow}>
          <BrandLogo size="sm" />

          {onCloseMobile ? (
            <Pressable
              onPress={onCloseMobile}
              accessibilityRole="button"
              accessibilityLabel="Close navigation drawer"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        {/* Navigation Links */}
        <View style={styles.navGroup}>
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  onSelectSection(item.id);
                  onCloseMobile?.();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.navItem,
                  isActive && styles.navItemActive,
                  pressed && !isActive && styles.navItemPressed,
                ]}
              >
                <View
                  style={[
                    styles.navIconWrap,
                    isActive && styles.navIconWrapActive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : '#9CA3AF'}
                  />
                </View>
                <Text
                  style={[styles.navLabel, isActive && styles.navLabelActive]}
                >
                  {item.label}
                </Text>
                {item.adminOnly ? (
                  <View style={styles.adminPill}>
                    <Text style={styles.adminPillText}>Admin</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom Workspace User Card + Amber/Dark Logout CTA */}
      <View style={styles.bottomCard}>
        <View style={styles.userRow}>
          <UserAvatar name={user.name} photoURL={user.photoURL} size={36} />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <RoleBadge role={user.role} size="sm" tone="dark" />
          <Text style={styles.domainTag}>@{allowedDomain}</Text>
        </View>

        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
        >
          <Text style={styles.logoutText}>Log out</Text>
          <Ionicons name="arrow-forward" size={15} color="#111214" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 244,
    height: '100%',
    backgroundColor: '#111214',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg - 4,
    justifyContent: 'space-between',
  },
  topSection: {
    gap: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  brandMarkGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  amberLogoBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
  },
  logoBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  logoBarShort: {
    height: 11,
    backgroundColor: '#FACC15',
  },
  logoBarMid: {
    height: 17,
    backgroundColor: '#F59E0B',
  },
  logoBarTall: {
    height: 23,
    backgroundColor: '#EA580C',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
  pressed: {
    opacity: 0.75,
  },
  navGroup: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  navItemActive: {
    backgroundColor: '#222429',
  },
  navItemPressed: {
    backgroundColor: '#1A1C20',
  },
  navIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: '#EA580C',
  },
  navLabel: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  adminPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  adminPillText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomCard: {
    backgroundColor: '#1A1C20',
    borderWidth: 1,
    borderColor: '#272A30',
    borderRadius: radii.lg + 2,
    padding: spacing.md - 2,
    gap: spacing.sm + 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  domainTag: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: '#FBBF24',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  logoutButtonPressed: {
    backgroundColor: '#F59E0B',
  },
  logoutText: {
    color: '#111214',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
