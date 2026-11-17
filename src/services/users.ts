import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { db, firebaseConfig } from './firebase';
import {
  getAllowedDomain,
  isEmailAllowed,
  isFixedAdminEmail,
  UNAUTHORIZED_DOMAIN_ERROR,
} from '../utils/domain';
import { mapAuthError } from './auth';
import type {
  ProvisionMemberInput,
  RecentSignInRecord,
  UserProfile,
  UserRole,
} from '../types/auth';

const USERS_COLLECTION = 'users';

interface FirestoreUserDoc {
  email?: string;
  name?: string;
  photoURL?: string | null;
  role?: string;
  createdAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
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

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'user';
}

function deriveFallbackName(email: string): string {
  const localPart = email.split('@')[0] ?? 'Workspace Member';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function mapDocToProfile(uid: string, data: FirestoreUserDoc): UserProfile {
  const email = (data.email ?? '').toLowerCase();
  return {
    uid,
    email,
    name:
      data.name && data.name.trim().length > 0
        ? data.name
        : deriveFallbackName(email),
    photoURL: data.photoURL ?? null,
    role: normalizeRole(data.role),
    createdAt: toDate(data.createdAt),
    lastLoginAt: toDate(data.lastLoginAt),
  };
}

/**
 * Creates users/{uid} with default role "user" on first login,
 * or updates name, photoURL, and lastLoginAt on subsequent logins
 * without modifying role, email, or createdAt.
 */
export async function upsertUserProfile(
  firebaseUser: User
): Promise<UserProfile> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const email = (firebaseUser.email ?? '').toLowerCase();
  const displayName =
    firebaseUser.displayName && firebaseUser.displayName.trim().length > 0
      ? firebaseUser.displayName.trim()
      : deriveFallbackName(email);
  const photoURL = firebaseUser.photoURL ?? null;

  const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
  const existingSnap = await getDoc(userRef);
  const fixedAdmin = isFixedAdminEmail(email);

  if (!existingSnap.exists()) {
    await setDoc(userRef, {
      email,
      name: fixedAdmin && !firebaseUser.displayName ? 'HB+ Admin' : displayName,
      photoURL,
      role: fixedAdmin ? 'admin' : 'user',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    const existingData = existingSnap.data() as FirestoreUserDoc;
    await updateDoc(userRef, {
      name: displayName,
      photoURL,
      lastLoginAt: serverTimestamp(),
      ...(fixedAdmin && existingData.role !== 'admin' ? { role: 'admin' } : {}),
    });
  }

  const freshSnap = await getDoc(userRef);
  if (freshSnap.exists()) {
    return mapDocToProfile(
      firebaseUser.uid,
      freshSnap.data() as FirestoreUserDoc
    );
  }

  const now = new Date();
  return {
    uid: firebaseUser.uid,
    email,
    name: displayName,
    photoURL,
    role: 'user',
    createdAt: now,
    lastLoginAt: now,
  };
}

/**
 * Fetches an existing user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) {
    return null;
  }

  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    return null;
  }

  return mapDocToProfile(uid, snap.data() as FirestoreUserDoc);
}

/**
 * Fetches the most recent workspace sign-ins ordered by lastLoginAt descending.
 */
export async function getRecentSignIns(
  maxCount = 15
): Promise<RecentSignInRecord[]> {
  if (!db) {
    return [];
  }

  const q = query(
    collection(db, USERS_COLLECTION),
    orderBy('lastLoginAt', 'desc'),
    limit(maxCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const profile = mapDocToProfile(
      docSnap.id,
      docSnap.data() as FirestoreUserDoc
    );
    return {
      uid: profile.uid,
      name: profile.name,
      email: profile.email,
      photoURL: profile.photoURL,
      role: profile.role,
      lastLoginAt: profile.lastLoginAt,
    };
  });
}

/**
 * Fetches all workspace members (used in Admin Team view & Task assignee picker).
 */
export async function getTeamMembers(): Promise<UserProfile[]> {
  if (!db) {
    return [];
  }

  const q = query(collection(db, USERS_COLLECTION), limit(100));
  const snapshot = await getDocs(q);

  const members = snapshot.docs.map((docSnap) =>
    mapDocToProfile(docSnap.id, docSnap.data() as FirestoreUserDoc)
  );

  // Sort by most recent login (or createdAt fallback) client-side so newly provisioned
  // accounts with lastLoginAt == null are never dropped by Firestore orderBy.
  return members.sort((a, b) => {
    const aTime = (a.lastLoginAt ?? a.createdAt)?.getTime() ?? 0;
    const bTime = (b.lastLoginAt ?? b.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

/**
 * Updates another user's role. Enforced server-side by firestore.rules:
 * only admins can call this, and users cannot modify their own role.
 */
export async function updateMemberRole(
  targetUid: string,
  nextRole: UserRole
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const userRef = doc(db, USERS_COLLECTION, targetUid);
  await updateDoc(userRef, {
    role: nextRole,
  });
}

/**
 * Admin-only account provisioning: creates a Firebase Auth Email/Password user
 * using a temporary secondary Firebase app instance (inMemoryPersistence) so the
 * currently logged-in Admin session is NEVER disrupted or signed out, then saves
 * users/{uid} in Firestore with the chosen role so the new user can log in immediately.
 */
export async function createMemberAccountByAdmin(
  input: ProvisionMemberInput,
  allowedDomain: string = getAllowedDomain()
): Promise<UserProfile> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const trimmedName = input.name.trim();
  const trimmedEmail = input.email.trim().toLowerCase();

  if (!trimmedName) {
    throw new Error('Please enter the member full name.');
  }

  if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
    throw new Error(UNAUTHORIZED_DOMAIN_ERROR);
  }

  if (!input.password || input.password.length < 6) {
    throw new Error('Initial password must be at least 6 characters.');
  }

  const secondaryAppName = `hbplus-provision-${Date.now()}`;
  const existing = getApps().find((a) => a.name === secondaryAppName);
  const secondaryApp = existing ?? initializeApp(firebaseConfig, secondaryAppName);

  try {
    const secondaryAuth = initializeAuth(secondaryApp, {
      persistence: inMemoryPersistence,
    });

    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      trimmedEmail,
      input.password
    );

    await updateProfile(credential.user, { displayName: trimmedName });
    const newUid = credential.user.uid;

    // Immediately sign out secondary instance before writing Firestore doc as Admin
    await signOut(secondaryAuth);

    const userRef = doc(db, USERS_COLLECTION, newUid);
    await setDoc(userRef, {
      email: trimmedEmail,
      name: trimmedName,
      photoURL: null,
      role: input.role,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    const now = new Date();
    return {
      uid: newUid,
      email: trimmedEmail,
      name: trimmedName,
      photoURL: null,
      role: input.role,
      createdAt: now,
      lastLoginAt: now,
    };
  } catch (err) {
    throw new Error(mapAuthError(err));
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}
