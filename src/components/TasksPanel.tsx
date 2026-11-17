import React, { useMemo, useState } from 'react';
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
  CreateTaskInput,
  TaskPriority,
  TaskStatus,
  UserProfile,
  WorkspaceTask,
} from '../types/auth';
import { ErrorBanner } from './ErrorBanner';

interface TasksPanelProps {
  tasks: WorkspaceTask[];
  members: UserProfile[];
  currentUser: UserProfile;
  isLoading: boolean;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TasksPanel({
  tasks,
  members,
  currentUser,
  isLoading,
  onCreateTask,
  onUpdateStatus,
  onDeleteTask,
}: TasksPanelProps) {
  const isAdmin = currentUser.role === 'admin';

  const [showCreateForm, setShowCreateForm] = useState(isAdmin);
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');

  // Create form state (Admin)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssigneeUid, setSelectedAssigneeUid] = useState<string>('ALL');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') {
      return tasks;
    }
    return tasks.filter((t) => t.status === filterStatus);
  }, [tasks, filterStatus]);

  const handleAssignSubmit = async () => {
    setActionError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setActionError('Please enter a task title.');
      return;
    }

    const targetMember =
      selectedAssigneeUid === 'ALL'
        ? null
        : members.find((m) => m.uid === selectedAssigneeUid) ?? null;

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim(),
        assigneeUid: targetMember ? targetMember.uid : 'ALL',
        assigneeName: targetMember ? targetMember.name : 'All Workspace Users',
        assigneeEmail: targetMember ? targetMember.email : 'All members',
        assignedByUid: currentUser.uid,
        assignedByName: currentUser.name,
        priority,
        dueDate: dueDate.trim(),
      });

      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setSuccessMsg(
        targetMember
          ? `Task assigned to ${targetMember.name} (${targetMember.email}).`
          : 'Task assigned to all workspace users.'
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to assign task. Verify Firestore rules are published.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    setActionError(null);
    setUpdatingTaskId(taskId);
    try {
      await onUpdateStatus(taskId, nextStatus);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update task status.'
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    setActionError(null);
    setUpdatingTaskId(taskId);
    try {
      await onDeleteTask(taskId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to delete task.'
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Admin Task Assignment Card */}
      {isAdmin ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBoxAmber}>
                <Ionicons name="add-circle-outline" size={18} color="#EA580C" />
              </View>
              <View style={styles.headerMeta}>
                <Text style={styles.cardTitle}>Assign Workspace Task</Text>
                <Text style={styles.cardSubtitle}>
                  Assign a task to all users or pick a particular team member
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowCreateForm((prev) => !prev)}
              style={({ pressed }) => [
                styles.toggleFormBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={showCreateForm ? 'chevron-up' : 'add'}
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.toggleFormText}>
                {showCreateForm ? 'Hide Form' : 'Assign Task'}
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

              {successMsg ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                  <Text style={styles.successText}>{successMsg}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Task Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Complete Q4 Security Audit"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add clear instructions or deliverables..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea]}
                />
              </View>

              {/* Assignee Picker: All Users OR Particular User */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Assign To</Text>
                <View style={styles.chipsWrap}>
                  <Pressable
                    onPress={() => setSelectedAssigneeUid('ALL')}
                    style={[
                      styles.chip,
                      selectedAssigneeUid === 'ALL' && styles.chipActive,
                    ]}
                  >
                    <Ionicons
                      name="people"
                      size={13}
                      color={
                        selectedAssigneeUid === 'ALL' ? '#FFFFFF' : '#475569'
                      }
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selectedAssigneeUid === 'ALL' && styles.chipTextActive,
                      ]}
                    >
                      All Users
                    </Text>
                  </Pressable>

                  {members.map((member) => {
                    const isSelected = selectedAssigneeUid === member.uid;
                    return (
                      <Pressable
                        key={member.uid}
                        onPress={() => setSelectedAssigneeUid(member.uid)}
                        style={[styles.chip, isSelected && styles.chipActive]}
                      >
                        <Ionicons
                          name="person"
                          size={12}
                          color={isSelected ? '#FFFFFF' : '#475569'}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {member.name} ({member.email.split('@')[0]})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Priority & Due Date */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, styles.flexOne]}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.chipsWrap}>
                    {PRIORITY_OPTIONS.map((opt) => {
                      const active = priority === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setPriority(opt.value)}
                          style={[styles.chip, active && styles.chipAmberActive]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipAmberTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.fieldGroup, styles.flexOne]}>
                  <Text style={styles.label}>Due Date (optional)</Text>
                  <TextInput
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="e.g. 2026-11-30"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>
              </View>

              <Pressable
                onPress={() => void handleAssignSubmit()}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.pressed,
                  isSubmitting && styles.disabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Assign Task</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Tasks List Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBoxDark}>
              <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.cardTitle}>
                {isAdmin ? 'All Assigned Tasks' : 'My Assigned Tasks'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isAdmin
                  ? `${tasks.length} total task${tasks.length === 1 ? '' : 's'} across workspace`
                  : 'Tasks assigned to you by workspace administrators'}
              </Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {(['all', 'pending', 'in_progress', 'completed'] as const).map(
              (key) => {
                const active = filterStatus === key;
                const label =
                  key === 'all'
                    ? 'All'
                    : key === 'in_progress'
                      ? 'In Progress'
                      : key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <Pressable
                    key={key}
                    onPress={() => setFilterStatus(key)}
                    style={[
                      styles.filterPill,
                      active && styles.filterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </View>

        {!isAdmin && actionError ? (
          <View style={styles.bannerPad}>
            <ErrorBanner
              message={actionError}
              onDismiss={() => setActionError(null)}
            />
          </View>
        ) : null}

        {isLoading && filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.emptyText}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>
              {isAdmin
                ? 'No tasks match this filter. Use "Assign Task" above to create one.'
                : 'No tasks assigned to you right now.'}
            </Text>
          </View>
        ) : (
          <View>
            {filteredTasks.map((task, idx) => {
              const isLast = idx === filteredTasks.length - 1;
              const isBusy = updatingTaskId === task.id;
              const priorityStyle =
                task.priority === 'high'
                  ? styles.priorityHigh
                  : task.priority === 'low'
                    ? styles.priorityLow
                    : styles.priorityMedium;
              const priorityTextStyle =
                task.priority === 'high'
                  ? styles.priorityHighText
                  : task.priority === 'low'
                    ? styles.priorityLowText
                    : styles.priorityMediumText;

              return (
                <View
                  key={task.id}
                  style={[styles.taskRow, !isLast && styles.rowBorder]}
                >
                  <View style={styles.taskTopLine}>
                    <View style={styles.taskTitleGroup}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={[styles.priorityPill, priorityStyle]}>
                        <Text style={[styles.priorityText, priorityTextStyle]}>
                          {task.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {isAdmin ? (
                      <Pressable
                        onPress={() => void handleDelete(task.id)}
                        disabled={isBusy}
                        accessibilityRole="button"
                        accessibilityLabel="Delete task"
                        style={({ pressed }) => [
                          styles.deleteIconBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#DC2626"
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  {task.description ? (
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  ) : null}

                  <View style={styles.taskMetaRow}>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name={
                          task.assigneeUid === 'ALL'
                            ? 'people-outline'
                            : 'person-outline'
                        }
                        size={13}
                        color="#475569"
                      />
                      <Text style={styles.metaChipText}>
                        Assigned to: {task.assigneeName}
                      </Text>
                    </View>

                    <View style={styles.metaChip}>
                      <Ionicons
                        name="shield-outline"
                        size={13}
                        color="#475569"
                      />
                      <Text style={styles.metaChipText}>
                        By: {task.assignedByName}
                      </Text>
                    </View>

                    {task.dueDate ? (
                      <View style={styles.metaChip}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color="#D97706"
                        />
                        <Text style={styles.metaChipText}>
                          Due: {task.dueDate}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Status Controls */}
                  <View style={styles.statusRow}>
                    <Text style={styles.statusRowLabel}>Status:</Text>
                    {STATUS_OPTIONS.map((opt) => {
                      const active = task.status === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          disabled={isBusy || active}
                          onPress={() =>
                            void handleStatusChange(task.id, opt.value)
                          }
                          style={[
                            styles.statusBtn,
                            active &&
                              (opt.value === 'completed'
                                ? styles.statusBtnCompleted
                                : opt.value === 'in_progress'
                                  ? styles.statusBtnProgress
                                  : styles.statusBtnPending),
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBtnText,
                              active &&
                                (opt.value === 'completed'
                                  ? styles.statusTextCompleted
                                  : opt.value === 'in_progress'
                                    ? styles.statusTextProgress
                                    : styles.statusTextPending),
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#F59E0B" />
                    ) : null}
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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
    minWidth: 200,
  },
  iconBoxAmber: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#141619',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
  },
  toggleFormBtn: {
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
  toggleFormText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  formBody: {
    padding: spacing.lg - 4,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
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
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  chipActive: {
    backgroundColor: '#141619',
    borderColor: '#141619',
  },
  chipText: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipAmberActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipAmberTextActive: {
    color: '#B45309',
  },
  submitBtn: {
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
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#141619',
  },
  filterText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  bannerPad: {
    padding: spacing.md,
  },
  taskRow: {
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md,
    gap: spacing.sm + 2,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  taskTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  taskTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flex: 1,
  },
  taskTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityLow: {
    backgroundColor: '#F1F5F9',
  },
  priorityText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  priorityHighText: {
    color: '#B91C1C',
  },
  priorityMediumText: {
    color: '#B45309',
  },
  priorityLowText: {
    color: '#475569',
  },
  deleteIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  taskDesc: {
    color: '#475569',
    fontSize: 13.5,
    lineHeight: 20,
  },
  taskMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  statusRowLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  statusBtnPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statusBtnProgress: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  statusBtnCompleted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  statusBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextProgress: {
    color: '#1D4ED8',
  },
  statusTextCompleted: {
    color: '#15803D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13.5,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.6,
  },
});
