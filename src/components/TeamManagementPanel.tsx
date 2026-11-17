import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme';
import type {
  ProvisionMemberInput,
  UserProfile,
  UserRole,
} from '../types/auth';
import {
  isEmailAllowed,
  UNAUTHORIZED_DOMAIN_ERROR,
} from '../utils/domain';
import { ErrorBanner } from './ErrorBanner';
import { RoleBadge } from './RoleBadge';
import { UserAvatar } from './UserAvatar';

interface TeamManagementPanelProps {
  members: UserProfile[];
  currentUid: string;
  allowedDomain: string;
  isLoading: boolean;
  onUpdateRole: (uid: string, nextRole: UserRole) => Promise<void>;
  onCreateMember: (input: ProvisionMemberInput) => Promise<void>;
}

export function TeamManagementPanel({
  members,
  currentUid,
  allowedDomain,
  isLoading,
  onUpdateRole,
  onCreateMember,
}: TeamManagementPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [isCreating, setIsCreating] = useState(false);

  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setActionError(null);
    setCreatedBanner(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setActionError('Please enter the member full name.');
      return;
    }

    if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
      setActionError(UNAUTHORIZED_DOMAIN_ERROR);
      return;
    }

    if (password.length < 6) {
      setActionError('Initial password must be at least 6 characters.');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateMember({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role,
      });

      setCreatedBanner(
        `Account created for ${trimmedName} (${trimmedEmail}) as ${role.toUpperCase()}. They can now log in directly with their email & password.`
      );
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to create member account. Verify Email/Password is enabled and Firestore rules are published.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRole = async (member: UserProfile) => {
    if (member.uid === currentUid) {
      return;
    }

    setActionError(null);
    setUpdatingUid(member.uid);
    try {
      const nextRole: UserRole = member.role === 'admin' ? 'user' : 'admin';
      await onUpdateRole(member.uid, nextRole);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to update role. Verify Firestore security rules.'
      );
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Admin Create Member Account Card */}
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Ionicons name="person-add-outline" size={16} color="#D97706" />
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.title}>Create Member Account</Text>
              <Text style={styles.subtitle}>
                Provision an @{allowedDomain} account directly — the user can log in immediately with email &amp; password
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setShowCreateForm((prev) => !prev)}
            style={({ pressed }) => [
              styles.toggleBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={showCreateForm ? 'chevron-up' : 'person-add'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.toggleBtnText}>
              {showCreateForm ? 'Hide Form' : 'New Account'}
            </Text>
          </Pressable>
        </View>

        {showCreateForm ? (
          <View style={styles.formBody}>
            {actionError ? (
              <ErrorBanner
                message={actionError}
                onDismiss={() => setActionError(null)}
              />
            ) : null}

            {createdBanner ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                <Text style={styles.successText}>{createdBanner}</Text>
              </View>
            ) : null}

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Priya Verma"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.fieldLabel}>
                  Official Email (@{allowedDomain}) *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={`name@${allowedDomain}`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.fieldLabel}>Initial Password *</Text>
                <View style={styles.passwordInputRow}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.fieldGroup, styles.flexOne]}>
                <Text style={styles.fieldLabel}>Assign Role</Text>
                <View style={styles.roleChipsRow}>
                  {(['user', 'admin'] as const).map((r) => {
                    const active = role === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        style={[
                          styles.roleChip,
                          active && styles.roleChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleChipText,
                            active && styles.roleChipTextActive,
                          ]}
                        >
                          {r === 'admin' ? 'Admin' : 'User'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => void handleCreateAccount()}
              disabled={isCreating}
              style={({ pressed }) => [
                styles.createSubmitBtn,
                pressed && styles.pressed,
                isCreating && styles.disabled,
              ]}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.createSubmitText}>
                    Create Member Account
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Team Directory & Role Management Card */}
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <Ionicons name="shield-checkmark" size={16} color="#D97706" />
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.title}>Team &amp; Role Directory</Text>
              <Text style={styles.subtitle}>
                Admin-only directory. Firestore rules prevent any user from changing their own role.
              </Text>
            </View>
          </View>
        </View>

        {isLoading && members.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.emptyText}>Loading team members...</Text>
          </View>
        ) : (
          <View>
            {members.map((member, idx) => {
              const isSelf = member.uid === currentUid;
              const isUpdating = updatingUid === member.uid;
              const isLast = idx === members.length - 1;

              return (
                <View
                  key={member.uid}
                  style={[styles.memberRow, !isLast && styles.rowBorder]}
                >
                  <View style={styles.memberLeft}>
                    <UserAvatar
                      name={member.name}
                      photoURL={member.photoURL}
                      size={38}
                    />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.name} {isSelf ? '(You)' : ''}
                      </Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {member.email}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.memberRight}>
                    <RoleBadge role={member.role} size="sm" tone="light" />
                    {isSelf ? (
                      <Text style={styles.protectedHint}>Protected</Text>
                    ) : (
                      <Pressable
                        onPress={() => void handleToggleRole(member)}
                        disabled={isUpdating}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.roleActionButton,
                          pressed && styles.pressed,
                          isUpdating && styles.disabled,
                        ]}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.roleActionText}>
                            {member.role === 'admin'
                              ? 'Make User'
                              : 'Make Admin'}
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg - 4,
  },
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
    padding: spacing.lg - 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg - 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
    minWidth: 220,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141619',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  formBody: {
    padding: spacing.lg - 4,
    gap: spacing.md,
  },
  twoColRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  flexOne: {
    flex: 1,
    minWidth: 180,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.sm + 2,
    paddingHorizontal: spacing.md - 2,
    height: 42,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.sm + 2,
    paddingHorizontal: spacing.md - 2,
    height: 42,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: '#0F172A',
    fontSize: 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  roleChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: 42,
    alignItems: 'center',
  },
  roleChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  roleChipActive: {
    backgroundColor: '#141619',
    borderColor: '#141619',
  },
  roleChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  createSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#141619',
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: radii.pill,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  createSubmitText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: radii.md,
    padding: spacing.sm + 4,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
    minWidth: 200,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    color: '#64748B',
    fontSize: 12.5,
    marginTop: 2,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  protectedHint: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  roleActionButton: {
    paddingHorizontal: spacing.sm + 6,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: '#141619',
    minWidth: 104,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  roleActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.6,
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
