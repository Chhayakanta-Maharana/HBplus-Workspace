export type UserRole = 'admin' | 'user';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date | null;
  lastLoginAt: Date | null;
}

export interface RecentSignInRecord {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  lastLoginAt: Date | null;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  description: string;
  assigneeUid: string; // Specific user UID or 'ALL'
  assigneeName: string;
  assigneeEmail: string;
  assignedByUid: string;
  assignedByName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assigneeUid: string;
  assigneeName: string;
  assigneeEmail: string;
  assignedByUid: string;
  assignedByName: string;
  priority: TaskPriority;
  dueDate: string;
}

export interface ProvisionMemberInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type DashboardSection =
  | 'dashboard'
  | 'tasks'
  | 'team'
  | 'reports'
  | 'settings';

export interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  allowedDomain: string;
  isConfigured: boolean;
  signInWithGoogle: (loginHint?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}
