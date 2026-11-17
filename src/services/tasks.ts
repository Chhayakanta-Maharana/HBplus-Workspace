import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  CreateTaskInput,
  TaskPriority,
  TaskStatus,
  UserRole,
  WorkspaceTask,
} from '../types/auth';

const TASKS_COLLECTION = 'tasks';

interface FirestoreTaskDoc {
  title?: string;
  description?: string;
  assigneeUid?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assignedByUid?: string;
  assignedByName?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return null;
}

function normalizeStatus(value: unknown): TaskStatus {
  if (value === 'in_progress' || value === 'completed') {
    return value;
  }
  return 'pending';
}

function normalizePriority(value: unknown): TaskPriority {
  if (value === 'high' || value === 'low') {
    return value;
  }
  return 'medium';
}

function mapDocToTask(id: string, data: FirestoreTaskDoc): WorkspaceTask {
  return {
    id,
    title: data.title ?? 'Untitled Task',
    description: data.description ?? '',
    assigneeUid: data.assigneeUid ?? 'ALL',
    assigneeName: data.assigneeName ?? 'All Workspace Users',
    assigneeEmail: data.assigneeEmail ?? '',
    assignedByUid: data.assignedByUid ?? '',
    assignedByName: data.assignedByName ?? 'Admin',
    priority: normalizePriority(data.priority),
    status: normalizeStatus(data.status),
    dueDate: data.dueDate ?? '',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * Fetches tasks visible to the signed-in user:
 * - Admins see all workspace tasks.
 * - Normal users see tasks assigned directly to them (assigneeUid == uid)
 *   plus broadcast tasks assigned to all users (assigneeUid == 'ALL').
 */
export async function getWorkspaceTasks(
  uid: string,
  role: UserRole
): Promise<WorkspaceTask[]> {
  if (!db) {
    return [];
  }

  let tasks: WorkspaceTask[] = [];

  if (role === 'admin') {
    const snap = await getDocs(collection(db, TASKS_COLLECTION));
    tasks = snap.docs.map((d) =>
      mapDocToTask(d.id, d.data() as FirestoreTaskDoc)
    );
  } else {
    // Run two simple equality queries (no composite Firestore index needed)
    const [directSnap, broadcastSnap] = await Promise.all([
      getDocs(
        query(collection(db, TASKS_COLLECTION), where('assigneeUid', '==', uid))
      ),
      getDocs(
        query(
          collection(db, TASKS_COLLECTION),
          where('assigneeUid', '==', 'ALL')
        )
      ),
    ]);

    const taskMap = new Map<string, WorkspaceTask>();
    for (const d of directSnap.docs) {
      taskMap.set(d.id, mapDocToTask(d.id, d.data() as FirestoreTaskDoc));
    }
    for (const d of broadcastSnap.docs) {
      taskMap.set(d.id, mapDocToTask(d.id, d.data() as FirestoreTaskDoc));
    }
    tasks = Array.from(taskMap.values());
  }

  return tasks.sort((a, b) => {
    const aTime = (a.updatedAt ?? a.createdAt)?.getTime() ?? 0;
    const bTime = (b.updatedAt ?? b.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

/**
 * Admin-only: assigns a new task to a particular user or to all workspace users ('ALL').
 */
export async function createWorkspaceTask(
  input: CreateTaskInput
): Promise<WorkspaceTask> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    throw new Error('Please enter a task title.');
  }

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    title: trimmedTitle,
    description: input.description.trim(),
    assigneeUid: input.assigneeUid,
    assigneeName: input.assigneeName,
    assigneeEmail: input.assigneeEmail,
    assignedByUid: input.assignedByUid,
    assignedByName: input.assignedByName,
    priority: input.priority,
    status: 'pending',
    dueDate: input.dueDate.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const now = new Date();
  return {
    id: docRef.id,
    title: trimmedTitle,
    description: input.description.trim(),
    assigneeUid: input.assigneeUid,
    assigneeName: input.assigneeName,
    assigneeEmail: input.assigneeEmail,
    assignedByUid: input.assignedByUid,
    assignedByName: input.assignedByName,
    priority: input.priority,
    status: 'pending',
    dueDate: input.dueDate.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Updates a task's status (allowed for Admins and the assigned user via firestore.rules).
 */
export async function updateWorkspaceTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin-only: deletes a workspace task.
 */
export async function deleteWorkspaceTask(taskId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}
