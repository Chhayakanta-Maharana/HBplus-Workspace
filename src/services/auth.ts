import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import {
  getAllowedDomain,
  getFixedAdminConfig,
  isEmailAllowed,
  UNAUTHORIZED_DOMAIN_ERROR,
} from '../utils/domain';

export type AuthFlowErrorCode =
  | 'UNAUTHORIZED_DOMAIN'
  | 'NOT_CONFIGURED'
  | 'CANCELLED'
  | 'MISSING_ID_TOKEN'
  | 'VALIDATION_ERROR';

export class AuthFlowError extends Error {
  public readonly code: AuthFlowErrorCode;

  constructor(code: AuthFlowErrorCode, message: string) {
    super(message);
    this.name = 'AuthFlowError';
    this.code = code;
  }
}

/**
 * Immediately terminates an unauthorized session and removes any persisted Firebase session.
 */
export async function terminateUnauthorizedSession(): Promise<void> {
  if (!auth) {
    return;
  }

  try {
    await signOut(auth);
  } catch {
    // Ensure sign-out errors never prevent enforcing domain restriction
  }
}

/**
 * Validates that the signed-in Firebase user's email belongs to the allowed domain.
 * Immediately signs out and throws UNAUTHORIZED_DOMAIN_ERROR if not allowed.
 */
export async function enforceAllowedDomain(
  firebaseUser: User,
  allowedDomain: string = getAllowedDomain()
): Promise<User> {
  if (!isEmailAllowed(firebaseUser.email, allowedDomain)) {
    await terminateUnauthorizedSession();
    throw new AuthFlowError('UNAUTHORIZED_DOMAIN', UNAUTHORIZED_DOMAIN_ERROR);
  }

  return firebaseUser;
}

/**
 * Web Google Sign-In using Firebase signInWithPopup + GoogleAuthProvider.
 * Passes the `hd` hosted domain hint and enforces strict domain validation immediately.
 */
export async function signInWithGoogleWeb(
  allowedDomain: string = getAllowedDomain(),
  loginHint?: string
): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new AuthFlowError(
      'NOT_CONFIGURED',
      'Firebase is not configured. Copy .env.example to .env and provide your Firebase credentials.'
    );
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const customParams: Record<string, string> = {
    prompt: 'select_account',
  };
  // Google's `hd` parameter targets Google Workspace domains; omit it only when
  // locally testing with consumer gmail.com accounts so account selection works smoothly.
  if (allowedDomain !== 'gmail.com') {
    customParams.hd = allowedDomain;
  }
  if (loginHint && loginHint.trim().length > 0) {
    customParams.login_hint = loginHint.trim();
  }
  provider.setCustomParameters(customParams);

  const credential = await signInWithPopup(auth, provider);
  return enforceAllowedDomain(credential.user, allowedDomain);
}

/**
 * Native Google Sign-In credential exchange using an ID token obtained from expo-auth-session.
 * Enforces strict domain validation immediately after exchanging the token.
 */
export async function signInWithGoogleIdToken(
  idToken: string | undefined,
  allowedDomain: string = getAllowedDomain()
): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new AuthFlowError(
      'NOT_CONFIGURED',
      'Firebase is not configured. Copy .env.example to .env and provide your Firebase credentials.'
    );
  }

  if (!idToken) {
    throw new AuthFlowError(
      'MISSING_ID_TOKEN',
      'Google did not return an ID token. Verify your OAuth client IDs and try again.'
    );
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  return enforceAllowedDomain(userCredential.user, allowedDomain);
}

/**
 * Manual Email + Password Sign-In (for already registered domain accounts).
 * Strictly enforces the allowed domain before and after Firebase Auth.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string,
  allowedDomain: string = getAllowedDomain()
): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new AuthFlowError(
      'NOT_CONFIGURED',
      'Firebase is not configured. Copy .env.example to .env and provide your Firebase credentials.'
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    throw new AuthFlowError(
      'VALIDATION_ERROR',
      'Please enter both your email and password.'
    );
  }

  if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
    throw new AuthFlowError('UNAUTHORIZED_DOMAIN', UNAUTHORIZED_DOMAIN_ERROR);
  }

  const fixedAdmin = getFixedAdminConfig();
  const isFixedAdminCredMatch =
    trimmedEmail === fixedAdmin.email && password === fixedAdmin.password;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      trimmedEmail,
      password
    );
    return enforceAllowedDomain(userCredential.user, allowedDomain);
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code ?? '')
        : '';

    // Auto-provision the permanent fixed admin account on its very first sign-in
    if (
      isFixedAdminCredMatch &&
      (code === 'auth/user-not-found' || code === 'auth/invalid-credential')
    ) {
      const created = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      await updateProfile(created.user, { displayName: 'HB+ Admin' });
      return enforceAllowedDomain(created.user, allowedDomain);
    }

    throw err;
  }
}

/**
 * Manual Email + Password Registration (strictly restricted to the allowed domain).
 */
export async function registerWithEmailPassword(
  name: string,
  email: string,
  password: string,
  allowedDomain: string = getAllowedDomain()
): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new AuthFlowError(
      'NOT_CONFIGURED',
      'Firebase is not configured. Copy .env.example to .env and provide your Firebase credentials.'
    );
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    throw new AuthFlowError('VALIDATION_ERROR', 'Please enter your full name.');
  }

  if (!trimmedEmail || !password) {
    throw new AuthFlowError(
      'VALIDATION_ERROR',
      'Please enter your official email and password.'
    );
  }

  if (password.length < 6) {
    throw new AuthFlowError(
      'VALIDATION_ERROR',
      'Password must be at least 6 characters long.'
    );
  }

  if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
    throw new AuthFlowError('UNAUTHORIZED_DOMAIN', UNAUTHORIZED_DOMAIN_ERROR);
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    trimmedEmail,
    password
  );

  await updateProfile(userCredential.user, { displayName: trimmedName });
  return enforceAllowedDomain(userCredential.user, allowedDomain);
}

/**
 * Sends a Firebase password reset email for allowed-domain accounts.
 */
export async function requestPasswordReset(
  email: string,
  allowedDomain: string = getAllowedDomain()
): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new AuthFlowError(
      'NOT_CONFIGURED',
      'Firebase is not configured. Copy .env.example to .env and provide your Firebase credentials.'
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new AuthFlowError(
      'VALIDATION_ERROR',
      'Enter your email address first so we can send a password reset link.'
    );
  }

  if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
    throw new AuthFlowError('UNAUTHORIZED_DOMAIN', UNAUTHORIZED_DOMAIN_ERROR);
  }

  const actionCodeSettings =
    typeof window !== 'undefined' && window.location?.origin
      ? {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        }
      : undefined;

  await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);
}

/**
 * Sets or updates the password for the currently signed-in user directly inside Settings.
 * Allows Google-authenticated users to also set a password for direct manual email login.
 */
export async function updateCurrentUserPassword(
  newPassword: string
): Promise<void> {
  if (!auth?.currentUser) {
    throw new AuthFlowError(
      'VALIDATION_ERROR',
      'You must be signed in to update your password.'
    );
  }

  if (newPassword.length < 6) {
    throw new AuthFlowError(
      'VALIDATION_ERROR',
      'Password must be at least 6 characters long.'
    );
  }

  await updatePassword(auth.currentUser, newPassword);
}

/**
 * Signs the current user out of Firebase Auth and clears the active session.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    return;
  }
  await signOut(auth);
}

/**
 * Maps Firebase Auth, Firestore, and Expo AuthSession errors to clear user-facing messages.
 */
export function mapAuthError(error: unknown): string {
  if (error instanceof AuthFlowError) {
    return error.message;
  }

  const firebaseCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  switch (firebaseCode) {
    case 'auth/user-not-found':
      return 'Account not found. Please click "Register here" to create an account or continue with Google.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. If you have not registered yet, click "Register here" or continue with Google.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in with your password or continue with Google.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in request was cancelled because another sign-in window is open.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to authentication service. Check your connection and retry.';
    case 'auth/user-disabled':
      return 'This workspace account has been disabled. Contact your administrator.';
    case 'auth/unauthorized-domain':
      return 'This app domain is not authorized in Firebase Console. Add it under Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console. Enable Email/Password and Google under Authentication > Sign-in method.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is invalid. Double-check your .env configuration.';
    case 'auth/requires-recent-login':
      return 'For security, please log out and sign back in once, then set your new password.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    case 'permission-denied':
      return UNAUTHORIZED_DOMAIN_ERROR;
    default:
      break;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    if (error.message.toLowerCase().includes('network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    return error.message;
  }

  return 'Unable to complete authentication. Please try again.';
}
