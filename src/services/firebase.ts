import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuthDependencies } from './authPersistence';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const PLACEHOLDER_PREFIXES = ['your_', 'your-'];

function isValueConfigured(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return !PLACEHOLDER_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export const isFirebaseConfigured: boolean =
  isValueConfigured(firebaseConfig.apiKey) &&
  isValueConfigured(firebaseConfig.authDomain) &&
  isValueConfigured(firebaseConfig.projectId) &&
  isValueConfigured(firebaseConfig.appId);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  try {
    firebaseAuth = initializeAuth(firebaseApp, getAuthDependencies());
  } catch {
    // Handles hot reload / Fast Refresh when Auth is already initialized
    firebaseAuth = getAuth(firebaseApp);
  }

  firestoreDb = getFirestore(firebaseApp);
}

export {
  firebaseConfig,
  firebaseApp as app,
  firebaseAuth as auth,
  firestoreDb as db,
};
