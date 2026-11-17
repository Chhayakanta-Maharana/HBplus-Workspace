import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { BrandLogo } from '../../src/components/BrandLogo';
import { DashboardCharts } from '../../src/components/DashboardCharts';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { MetricCard } from '../../src/components/MetricCard';
import { MobileBottomNav } from '../../src/components/MobileBottomNav';
import { RecentSignInsTable } from '../../src/components/RecentSignInsTable';
import { RoleBadge } from '../../src/components/RoleBadge';
import { Sidebar } from '../../src/components/Sidebar';
import { TasksPanel } from '../../src/components/TasksPanel';
import { TeamManagementPanel } from '../../src/components/TeamManagementPanel';
import { UserAvatar } from '../../src/components/UserAvatar';
import {
  createMemberAccountByAdmin,
  getRecentSignIns,
  getTeamMembers,
  updateMemberRole,
} from '../../src/services/users';
import {
  createWorkspaceTask,
  deleteWorkspaceTask,
  getWorkspaceTasks,
  updateWorkspaceTaskStatus,
} from '../../src/services/tasks';
import {
  mapAuthError,
  updateCurrentUserPassword,
} from '../../src/services/auth';
import { breakpoints, radii, spacing } from '../../src/theme';
import type {
  CreateTaskInput,
  DashboardSection,
  ProvisionMemberInput,
  RecentSignInRecord,
  TaskStatus,
  UserProfile,
  UserRole,
  WorkspaceTask,
} from '../../src/types/auth';

function formatDate(date: Date | null): string {
  if (!date) {
    return 'Just now';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function getCurrentMonthRange(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  const year = now.getFullYear();
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return `01 ${month} ${year} - ${lastDay} ${month} ${year}`;
}

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 600;
  const isTablet = width >= 600 && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;
  const isWideCharts = width >= breakpoints.desktop + 80;
  const isCompactTable = width < breakpoints.tablet;

  const { user, allowedDomain, logout } = useAuth();

  const [activeSection, setActiveSection] =
    useState<DashboardSection>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [recentSignIns, setRecentSignIns] = useState<RecentSignInRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isAdmin = user?.role === 'admin';
  const effectiveSection: DashboardSection =
    !isAdmin && activeSection === 'team' ? 'dashboard' : activeSection;

  const fetchWorkspaceSnapshot = useCallback(async (currentUser: UserProfile) => {
    const [signIns, fetchedTasks, members] = await Promise.all([
      getRecentSignIns(15),
      getWorkspaceTasks(currentUser.uid, currentUser.role).catch(() => []),
      currentUser.role === 'admin' ? getTeamMembers() : Promise.resolve([]),
    ]);

    const normalizedSignIns: RecentSignInRecord[] =
      signIns.length > 0
        ? signIns
        : [
            {
              uid: currentUser.uid,
              name: currentUser.name,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: currentUser.role,
              lastLoginAt: currentUser.lastLoginAt ?? new Date(),
            },
          ];

    return { signIns: normalizedSignIns, members, tasks: fetchedTasks };
  }, []);

  const loadWorkspaceData = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoadingData(true);
    setDataError(null);
    try {
      const {
        signIns,
        members,
        tasks: fetchedTasks,
      } = await fetchWorkspaceSnapshot(user);
      setRecentSignIns(signIns);
      setTasks(fetchedTasks);
      if (user.role === 'admin') {
        setTeamMembers(members);
      }
    } catch {
      setDataError(
        'Could not refresh workspace directory from Firestore. Displaying your active session.'
      );
      setRecentSignIns([
        {
          uid: user.uid,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          lastLoginAt: user.lastLoginAt ?? new Date(),
        },
      ]);
    } finally {
      setIsLoadingData(false);
    }
  }, [fetchWorkspaceSnapshot, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    void fetchWorkspaceSnapshot(user)
      .then(({ signIns, members, tasks: fetchedTasks }) => {
        if (isCancelled) {
          return;
        }
        setRecentSignIns(signIns);
        setTasks(fetchedTasks);
        if (user.role === 'admin') {
          setTeamMembers(members);
        }
        setDataError(null);
        setIsLoadingData(false);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }
        setDataError(
          'Could not refresh workspace directory from Firestore. Displaying your active session.'
        );
        setRecentSignIns([
          {
            uid: user.uid,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            role: user.role,
            lastLoginAt: user.lastLoginAt ?? new Date(),
          },
        ]);
        setIsLoadingData(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [fetchWorkspaceSnapshot, user]);

  const handleRoleUpdate = useCallback(
    async (targetUid: string, nextRole: UserRole) => {
      await updateMemberRole(targetUid, nextRole);
      await loadWorkspaceData();
    },
    [loadWorkspaceData]
  );

  const handleCreateMember = useCallback(
    async (input: ProvisionMemberInput) => {
      await createMemberAccountByAdmin(input, allowedDomain);
      await loadWorkspaceData();
    },
    [allowedDomain, loadWorkspaceData]
  );

  const handleCreateTask = useCallback(
    async (input: CreateTaskInput) => {
      await createWorkspaceTask(input);
      await loadWorkspaceData();
    },
    [loadWorkspaceData]
  );

  const handleUpdateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await updateWorkspaceTaskStatus(taskId, status);
      await loadWorkspaceData();
    },
    [loadWorkspaceData]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await deleteWorkspaceTask(taskId);
      await loadWorkspaceData();
    },
    [loadWorkspaceData]
  );

  const handleLogout = useCallback(async () => {
    setDrawerOpen(false);
    await logout();
  }, [logout]);

  const handleUpdatePassword = useCallback(async () => {
    setPasswordFeedback(null);
    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'Passwords do not match.',
      });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await updateCurrentUserPassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordFeedback({
        type: 'success',
        message:
          'Password saved! You can now sign in directly using your email and password.',
      });
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        message: mapAuthError(err),
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }, [confirmNewPassword, newPassword]);

  const filteredSignIns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return recentSignIns;
    }
    return recentSignIns.filter(
      (record) =>
        record.name.toLowerCase().includes(q) ||
        record.email.toLowerCase().includes(q) ||
        record.role.toLowerCase().includes(q)
    );
  }, [recentSignIns, searchQuery]);

  const filteredTeam = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return teamMembers;
    }
    return teamMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q)
    );
  }, [teamMembers, searchQuery]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return tasks;
    }
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.assigneeName.toLowerCase().includes(q) ||
        task.status.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const metrics = useMemo(() => {
    const totalTracked = Math.max(recentSignIns.length, 1);
    const adminCount = recentSignIns.filter((r) => r.role === 'admin').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const openTasks = tasks.length - completedTasks;

    return [
      {
        label: 'Verified Members',
        value: String(totalTracked),
        deltaText: `${adminCount} admin${adminCount === 1 ? '' : 's'} · 100% domain verified`,
        icon: 'bar-chart-outline' as const,
        variant: 'dark' as const,
        positive: true,
        sparkHeights: [36, 52, 44, 70, 56, 84, 96],
      },
      {
        label: isAdmin ? 'Assigned Tasks' : 'My Tasks',
        value: String(tasks.length),
        deltaText: `${openTasks} open · ${completedTasks} completed`,
        icon: 'checkbox-outline' as const,
        variant: 'light' as const,
        positive: true,
        sparkHeights: [44, 62, 48, 76, 60, 82, 74],
      },
      {
        label: 'Allowed Domain',
        value: `@${allowedDomain}`,
        deltaText: 'Client + Firestore rules',
        icon: 'shield-checkmark-outline' as const,
        variant: 'light' as const,
        positive: true,
        sparkHeights: [55, 65, 60, 80, 74, 88, 92],
      },
      {
        label: 'Recent Sign-Ins',
        value: String(recentSignIns.length),
        deltaText: isAdmin ? 'Admin RBAC active' : 'Standard User access',
        icon: 'pulse-outline' as const,
        variant: 'light' as const,
        positive: false,
        sparkHeights: [40, 58, 50, 68, 76, 70, 86],
      },
    ];
  }, [allowedDomain, isAdmin, recentSignIns, tasks]);

  const monthRangeLabel = useMemo(() => getCurrentMonthRange(), []);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.outerShell}>
      <View style={styles.layout}>
        {/* Desktop Persistent Dark Sidebar */}
        {isDesktop ? (
          <Sidebar
            user={user}
            allowedDomain={allowedDomain}
            activeSection={effectiveSection}
            onSelectSection={setActiveSection}
            onLogout={() => void handleLogout()}
          />
        ) : null}

        {/* Right Column: Dark Top Bar + Crisp Rounded Light Content Sheet */}
        <View style={styles.rightColumn}>
          {/* Top Dark Chrome Bar (mirrors Quantro top bar, zero overflow on 375px mobile) */}
          <View
            style={[
              styles.topDarkBar,
              isSmallMobile && styles.topDarkBarMobile,
            ]}
          >
            <View style={styles.topBarLeft}>
              {!isDesktop ? (
                <Pressable
                  onPress={() => setDrawerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open navigation menu"
                  style={({ pressed }) => [
                    styles.menuIconButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="menu" size={20} color="#FFFFFF" />
                </Pressable>
              ) : null}

              {isSmallMobile ? (
                <View style={styles.mobileBrandInline}>
                  <BrandLogo size="sm" />
                </View>
              ) : (
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={16} color="#9CA3AF" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search members, sign-ins, tasks..."
                    placeholderTextColor="#6B7280"
                    style={styles.searchInput}
                    accessibilityLabel="Search workspace members"
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable
                      onPress={() => setSearchQuery('')}
                      hitSlop={6}
                      accessibilityLabel="Clear search"
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  ) : (
                    <Ionicons
                      name="options-outline"
                      size={16}
                      color="#6B7280"
                    />
                  )}
                </View>
              )}
            </View>

            <View style={styles.topBarRight}>
              {isDesktop ? (
                <View style={styles.datePill}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#9CA3AF"
                  />
                  <Text style={styles.datePillText}>{monthRangeLabel}</Text>
                </View>
              ) : null}

              {!isSmallMobile ? (
                <View style={styles.bellButton}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#E5E7EB"
                  />
                  <View style={styles.bellDot} />
                </View>
              ) : null}

              <View style={styles.profilePill}>
                <UserAvatar
                  name={user.name}
                  photoURL={user.photoURL}
                  size={isSmallMobile ? 32 : 34}
                />
                {isDesktop ? (
                  <View style={styles.profileTextGroup}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text style={styles.profileRole}>
                      {isAdmin ? 'Admin' : 'User'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {!isDesktop ? (
                <Pressable
                  onPress={() => void handleLogout()}
                  accessibilityRole="button"
                  accessibilityLabel="Log out"
                  style={({ pressed }) => [
                    styles.mobileLogoutBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="log-out-outline" size={18} color="#FBBF24" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Rounded Crisp Light Content Sheet */}
          <View
            style={[
              styles.contentSheet,
              isDesktop && styles.contentSheetDesktop,
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.contentContainer,
                !isDesktop && styles.contentContainerMobile,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Page Title & Greeting Row */}
              <View style={styles.pageHeaderRow}>
                <View style={styles.pageHeaderLeft}>
                  <View style={styles.titleWithBadge}>
                    <Text
                      style={[
                        styles.pageTitle,
                        isSmallMobile && styles.pageTitleMobile,
                      ]}
                    >
                      {effectiveSection === 'dashboard'
                        ? `Welcome, ${user.name}`
                        : effectiveSection === 'tasks'
                          ? isAdmin
                            ? 'Task Management'
                            : 'My Assigned Tasks'
                          : effectiveSection === 'team'
                            ? 'Team & Account Provisioning'
                            : effectiveSection === 'reports'
                              ? 'Access Reports'
                              : 'Workspace Settings'}
                    </Text>
                    <RoleBadge role={user.role} tone="light" />
                  </View>
                  <Text style={styles.pageSubtitle}>
                    {user.email} · Real-time domain-restricted workspace portal
                  </Text>
                </View>

                <View style={styles.headerActions}>
                  {isAdmin && effectiveSection !== 'tasks' ? (
                    <Pressable
                      onPress={() => setActiveSection('tasks')}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.blackActionBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={styles.blackActionText}>Assign Task</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => void loadWorkspaceData()}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.blackActionBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="refresh" size={15} color="#FFFFFF" />
                    <Text style={styles.blackActionText}>Sync Data</Text>
                  </Pressable>
                </View>
              </View>

              {/* Dedicated Full-Width Search Bar on Small Mobile (< 600px) */}
              {isSmallMobile ? (
                <View style={styles.mobileSearchBox}>
                  <Ionicons name="search" size={16} color="#64748B" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search members, sign-ins, tasks..."
                    placeholderTextColor="#94A3B8"
                    style={styles.mobileSearchInput}
                    accessibilityLabel="Search workspace"
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable
                      onPress={() => setSearchQuery('')}
                      hitSlop={6}
                      accessibilityLabel="Clear search"
                    >
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {dataError ? (
                <ErrorBanner
                  message={dataError}
                  onDismiss={() => setDataError(null)}
                />
              ) : null}

              {/* Dashboard Overview */}
              {effectiveSection === 'dashboard' ? (
                <>
                  {/* 4 Metric Cards: 1-col on phone, 2x2 on tablet, 4-col on desktop */}
                  <View
                    style={[
                      styles.metricsGrid,
                      isSmallMobile && styles.metricsGridMobile,
                    ]}
                  >
                    {metrics.map((metric, idx) => (
                      <View
                        key={metric.label}
                        style={
                          isSmallMobile
                            ? styles.metricSlotMobile
                            : isTablet
                              ? styles.metricSlotTablet
                              : styles.metricSlotDesktop
                        }
                      >
                        <MetricCard
                          label={metric.label}
                          value={metric.value}
                          deltaText={metric.deltaText}
                          icon={metric.icon}
                          variant={metric.variant}
                          positive={metric.positive}
                          sparkHeights={metric.sparkHeights}
                          animationIndex={idx}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Analytics Row (Overview Bar Chart + Access Breakdown Donut) */}
                  <DashboardCharts
                    records={recentSignIns}
                    allowedDomain={allowedDomain}
                    isWide={isWideCharts}
                  />

                  {/* Recent Sign-Ins Table */}
                  <RecentSignInsTable
                    records={filteredSignIns}
                    currentUid={user.uid}
                    isLoading={isLoadingData}
                    isCompact={isCompactTable}
                    onRefresh={() => void loadWorkspaceData()}
                  />
                </>
              ) : null}

              {/* Tasks Section (Admin: Assign to All/Particular User; User: View & Update Status) */}
              {effectiveSection === 'tasks' ? (
                <TasksPanel
                  tasks={filteredTasks}
                  members={teamMembers}
                  currentUser={user}
                  isLoading={isLoadingData}
                  onCreateTask={handleCreateTask}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDeleteTask={handleDeleteTask}
                />
              ) : null}

              {/* Admin-Only Team & Account Provisioning Section */}
              {effectiveSection === 'team' && isAdmin ? (
                <TeamManagementPanel
                  members={filteredTeam}
                  currentUid={user.uid}
                  allowedDomain={allowedDomain}
                  isLoading={isLoadingData}
                  onUpdateRole={handleRoleUpdate}
                  onCreateMember={handleCreateMember}
                />
              ) : null}

              {/* Reports Section */}
              {effectiveSection === 'reports' ? (
                <>
                  <DashboardCharts
                    records={recentSignIns}
                    allowedDomain={allowedDomain}
                    isWide={isWideCharts}
                  />
                  <RecentSignInsTable
                    records={filteredSignIns}
                    currentUid={user.uid}
                    isLoading={isLoadingData}
                    isCompact={isCompactTable}
                    onRefresh={() => void loadWorkspaceData()}
                  />
                </>
              ) : null}

              {/* Settings Section */}
              {effectiveSection === 'settings' ? (
                <View style={styles.settingsCard}>
                  <View style={styles.settingsHeader}>
                    <View style={styles.settingsIconBox}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={18}
                        color="#EA580C"
                      />
                    </View>
                    <View>
                      <Text style={styles.settingsTitle}>
                        Account &amp; Security Policy
                      </Text>
                      <Text style={styles.settingsSubtitle}>
                        Managed by Firebase Authentication and Firestore rules
                      </Text>
                    </View>
                  </View>

                  <View style={styles.settingsList}>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingKey}>Signed-in Account</Text>
                      <Text style={styles.settingValue}>{user.email}</Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingKey}>Assigned Role</Text>
                      <RoleBadge role={user.role} size="sm" tone="light" />
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingKey}>Allowed Domain</Text>
                      <Text style={styles.settingValue}>@{allowedDomain}</Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingKey}>Token Persistence</Text>
                      <Text style={styles.settingValue}>
                        {Platform.OS === 'web'
                          ? 'Firebase browserLocalPersistence'
                          : 'Firebase SecureStore (Keychain / Keystore)'}
                      </Text>
                    </View>
                    <View style={[styles.settingRow, styles.settingRowLast]}>
                      <Text style={styles.settingKey}>Account Created</Text>
                      <Text style={styles.settingValue}>
                        {formatDate(user.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.passwordCard}>
                    <Text style={styles.passwordSectionTitle}>
                      Set or Change Login Password
                    </Text>
                    <Text style={styles.settingsSubtitle}>
                      Set a password here to sign in directly with Email + Password (even if you originally logged in with Google).
                    </Text>

                    {passwordFeedback ? (
                      <View
                        style={[
                          styles.feedbackBox,
                          passwordFeedback.type === 'success'
                            ? styles.feedbackSuccess
                            : styles.feedbackError,
                        ]}
                      >
                        <Text
                          style={[
                            styles.feedbackText,
                            passwordFeedback.type === 'success'
                              ? styles.feedbackTextSuccess
                              : styles.feedbackTextError,
                          ]}
                        >
                          {passwordFeedback.message}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.passwordInputsRow}>
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New password (min 6 chars)"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        autoCapitalize="none"
                        style={styles.settingsInput}
                      />
                      <TextInput
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        autoCapitalize="none"
                        style={styles.settingsInput}
                      />
                    </View>

                    <Pressable
                      onPress={() => void handleUpdatePassword()}
                      disabled={isUpdatingPassword}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.blackActionBtn,
                        styles.selfStartBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="key-outline"
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.blackActionText}>
                        {isUpdatingPassword ? 'Saving...' : 'Save Password'}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => void handleLogout()}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.settingsLogoutBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                    <Text style={styles.settingsLogoutText}>
                      Sign out of workspace
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>

          {/* Mobile Dark Bottom Navigation */}
          {!isDesktop ? (
            <MobileBottomNav
              role={user.role}
              activeSection={effectiveSection}
              onSelectSection={setActiveSection}
            />
          ) : null}
        </View>
      </View>

      {/* Mobile Slide-Over Dark Drawer */}
      {!isDesktop ? (
        <Modal
          visible={drawerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={styles.drawerBackdrop}>
            <View style={styles.drawerPanel}>
              <Sidebar
                user={user}
                allowedDomain={allowedDomain}
                activeSection={effectiveSection}
                onSelectSection={setActiveSection}
                onLogout={() => void handleLogout()}
                onCloseMobile={() => setDrawerOpen(false)}
              />
            </View>
            <Pressable
              style={styles.drawerDismissArea}
              onPress={() => setDrawerOpen(false)}
              accessibilityLabel="Close drawer backdrop"
            />
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerShell: {
    flex: 1,
    backgroundColor: '#111214',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111214',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#111214',
  },

  /* Top Dark Chrome Header */
  topDarkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
    backgroundColor: '#111214',
  },
  topDarkBarMobile: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
    minWidth: 0,
    maxWidth: 420,
  },
  mobileBrandInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  miniAmberBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    height: 18,
  },
  miniBar: {
    width: 4.5,
    borderRadius: 2,
  },
  miniBarShort: {
    height: 8,
    backgroundColor: '#FACC15',
  },
  miniBarMid: {
    height: 13,
    backgroundColor: '#F59E0B',
  },
  miniBarTall: {
    height: 18,
    backgroundColor: '#EA580C',
  },
  mobileBrandText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  menuIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    height: 38,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#F3F4F6',
    fontSize: 13,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  mobileSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    height: 42,
    width: '100%',
  },
  mobileSearchInput: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 14,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flexShrink: 0,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    height: 36,
  },
  datePillText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  profileTextGroup: {
    maxWidth: 140,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  profileRole: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  mobileLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Crisp Light Rounded Content Canvas */
  contentSheet: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    overflow: 'hidden',
  },
  contentSheetDesktop: {
    borderTopLeftRadius: 22,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg - 4,
  },
  contentContainerMobile: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pageHeaderLeft: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
  },
  pageTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageTitleMobile: {
    fontSize: 20,
    lineHeight: 26,
  },
  pageSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  blackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#141619',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  blackActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricsGridMobile: {
    gap: spacing.sm + 4,
  },
  metricSlotMobile: {
    width: '100%',
  },
  metricSlotTablet: {
    width: '48%',
    flexGrow: 1,
  },
  metricSlotDesktop: {
    flex: 1,
    minWidth: 200,
  },

  /* Settings Card */
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radii.lg + 4,
    padding: spacing.lg,
    gap: spacing.lg - 4,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  settingsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
  },
  settingsList: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingKey: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '500',
  },
  settingValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '600',
  },
  settingsLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#141619',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.pill,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  settingsLogoutText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  passwordCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  passwordSectionTitle: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '700',
  },
  passwordInputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 4,
  },
  settingsInput: {
    flex: 1,
    minWidth: 180,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radii.sm + 2,
    paddingHorizontal: spacing.md - 2,
    color: '#0F172A',
    fontSize: 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  selfStartBtn: {
    alignSelf: 'flex-start',
  },
  feedbackBox: {
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  feedbackText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#15803D',
  },
  feedbackTextError: {
    color: '#B91C1C',
  },

  /* Drawer */
  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerPanel: {
    height: '100%',
  },
  drawerDismissArea: {
    flex: 1,
  },
  pressed: {
    opacity: 0.78,
  },
});
