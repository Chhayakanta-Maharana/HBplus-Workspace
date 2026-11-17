import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme';
import type { RecentSignInRecord } from '../types/auth';
import { RoleBadge } from './RoleBadge';
import { UserAvatar } from './UserAvatar';

interface RecentSignInsTableProps {
  records: RecentSignInRecord[];
  currentUid: string;
  isLoading: boolean;
  isCompact: boolean;
  onRefresh: () => void;
}

function formatDateTime(date: Date | null): string {
  if (!date) {
    return 'Just now';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function RecentSignInsTable({
  records,
  currentUid,
  isLoading,
  isCompact,
  onRefresh,
}: RecentSignInsTableProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="time-outline" size={16} color="#0F172A" />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.title}>Recent Sign-Ins</Text>
            <Text style={styles.subtitle}>
              Verified workspace sessions recorded in Firestore
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onRefresh}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Refresh recent sign-ins"
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.refreshButtonPressed,
          ]}
        >
          <Ionicons name="refresh" size={14} color="#0F172A" />
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>

      {!isCompact ? (
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.colHeader, styles.memberCol]}>MEMBER</Text>
          <Text style={[styles.colHeader, styles.roleCol]}>ROLE</Text>
          <Text style={[styles.colHeader, styles.timeCol]}>LAST SIGN-IN</Text>
          <Text style={[styles.colHeader, styles.statusCol]}>STATUS</Text>
        </View>
      ) : null}

      {isLoading && records.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={styles.emptyText}>Loading recent sign-ins...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={24} color="#94A3B8" />
          <Text style={styles.emptyText}>No matching sign-in records found.</Text>
        </View>
      ) : (
        <View style={styles.rowsContainer}>
          {records.map((record, index) => {
            const isCurrentUser = record.uid === currentUid;
            const isLast = index === records.length - 1;

            if (isCompact) {
              return (
                <View
                  key={record.uid}
                  style={[styles.compactRow, !isLast && styles.rowBorder]}
                >
                  <View style={styles.compactTop}>
                    <UserAvatar
                      name={record.name}
                      photoURL={record.photoURL}
                      size={36}
                    />
                    <View style={styles.memberMeta}>
                      <View style={styles.nameLine}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {record.name}
                        </Text>
                        {isCurrentUser ? (
                          <View style={styles.youTag}>
                            <Text style={styles.youTagText}>You</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {record.email}
                      </Text>
                    </View>
                    <RoleBadge role={record.role} size="sm" tone="light" />
                  </View>

                  <View style={styles.compactBottom}>
                    <Text style={styles.timestampText}>
                      {formatDateTime(record.lastLoginAt)}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>Verified</Text>
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={record.uid}
                style={[styles.tableRow, !isLast && styles.rowBorder]}
              >
                <View style={[styles.memberCell, styles.memberCol]}>
                  <UserAvatar
                    name={record.name}
                    photoURL={record.photoURL}
                    size={36}
                  />
                  <View style={styles.memberMeta}>
                    <View style={styles.nameLine}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {record.name}
                      </Text>
                      {isCurrentUser ? (
                        <View style={styles.youTag}>
                          <Text style={styles.youTagText}>You</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {record.email}
                    </Text>
                  </View>
                </View>

                <View style={styles.roleCol}>
                  <RoleBadge role={record.role} size="sm" tone="light" />
                </View>

                <View style={styles.timeCol}>
                  <Text style={styles.timestampText}>
                    {formatDateTime(record.lastLoginAt)}
                  </Text>
                </View>

                <View style={styles.statusCol}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>Verified</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radii.lg + 4,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 1,
  },
  title: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  refreshButtonPressed: {
    opacity: 0.75,
  },
  refreshLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.sm + 2,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  rowsContainer: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md - 3,
  },
  compactRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm + 4,
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  compactBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 48,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberCol: {
    flex: 2.2,
    paddingRight: spacing.md,
  },
  roleCol: {
    flex: 0.9,
    paddingRight: spacing.sm,
  },
  timeCol: {
    flex: 1.1,
    paddingRight: spacing.sm,
  },
  statusCol: {
    flex: 0.85,
    alignItems: 'flex-end',
  },
  memberCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  memberMeta: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  youTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youTagText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
  },
  memberEmail: {
    color: '#64748B',
    fontSize: 12.5,
    marginTop: 2,
  },
  timestampText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusText: {
    color: '#15803D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13.5,
  },
});
