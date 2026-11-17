import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  mapAuthError,
  registerWithEmailPassword,
  requestPasswordReset,
  signInWithEmailPassword,
  signInWithGoogleIdToken,
  signInWithGoogleWeb,
  signOutUser,
  terminateUnauthorizedSession,
} from '../services/auth';
import { getUserProfile, upsertUserProfile } from '../services/users';
import { useNativeGoogleAuth } from '../services/nativeGoogleAuth';
import {
  getAllowedDomain,
  isEmailAllowed,
  UNAUTHORIZED_DOMAIN_ERROR,
} from '../utils/domain';
import type { AuthContextValue, UserProfile } from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const allowedDomain = useMemo(() => getAllowedDomain(), []);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    isFirebaseConfigured && Boolean(auth)
  );
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Prevents duplicate profile upserts when signIn triggers onAuthStateChanged
  const activeSignInUidRef = useRef<string | null>(null);
  const isManualSignInRef = useRef<boolean>(false);

  const hydrateAuthorizedUser = useCallback(
    async (firebaseUser: User, shouldRecordLogin: boolean): Promise<void> => {
      // Always re-verify allowed domain before granting access or touching Firestore
      if (!isEmailAllowed(firebaseUser.email, allowedDomain)) {
        setUser(null);
        setError(UNAUTHORIZED_DOMAIN_ERROR);
        await terminateUnauthorizedSession();
        return;
      }

      try {
        let profile: UserProfile | null = null;
        if (shouldRecordLogin) {
          profile = await upsertUserProfile(firebaseUser);
        } else {
          profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            profile = await upsertUserProfile(firebaseUser);
          }
        }

        setUser(profile);
        setError(null);
      } catch (err) {
        // If Firestore security rules reject the user (e.g. server-side domain check),
        // sign out immediately so client state stays consistent with server rules.
        await terminateUnauthorizedSession();
        setUser(null);
        setError(mapAuthError(err));
      }
    },
    [allowedDomain]
  );

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) {
        return;
      }

      if (!firebaseUser) {
        activeSignInUidRef.current = null;
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Immediately block unauthorized emails before any state update or route transition
      if (!isEmailAllowed(firebaseUser.email, allowedDomain)) {
        setUser(null);
        setError(UNAUTHORIZED_DOMAIN_ERROR);
        setIsAuthenticating(false);
        setIsLoading(false);
        await terminateUnauthorizedSession();
        return;
      }

      // If the active manual sign-in handler is already hydrating this UID, avoid duplicate writes
      if (activeSignInUidRef.current === firebaseUser.uid) {
        setIsLoading(false);
        return;
      }

      const shouldRecordLogin = isManualSignInRef.current;
      isManualSignInRef.current = false;

      await hydrateAuthorizedUser(firebaseUser, shouldRecordLogin);

      if (isMounted) {
        setIsAuthenticating(false);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [allowedDomain, hydrateAuthorizedUser]);

  const handleNativeIdToken = useCallback(
    async (idToken: string | undefined) => {
      setIsAuthenticating(true);
      setError(null);
      isManualSignInRef.current = true;

      try {
        const firebaseUser = await signInWithGoogleIdToken(idToken, allowedDomain);
        activeSignInUidRef.current = firebaseUser.uid;
        await hydrateAuthorizedUser(firebaseUser, true);
      } catch (err) {
        setUser(null);
        setError(mapAuthError(err));
      } finally {
        isManualSignInRef.current = false;
        setIsAuthenticating(false);
      }
    },
    [allowedDomain, hydrateAuthorizedUser]
  );

  const handleNativeCancel = useCallback(() => {
    isManualSignInRef.current = false;
    setIsAuthenticating(false);
    setError('Sign-in was cancelled. Select "Continue with Google" to try again.');
  }, []);

  const handleNativeError = useCallback((message: string) => {
    isManualSignInRef.current = false;
    setIsAuthenticating(false);
    setError(message);
  }, []);

  const nativeAuth = useNativeGoogleAuth({
    allowedDomain,
    onIdToken: handleNativeIdToken,
    onCancel: handleNativeCancel,
    onError: handleNativeError,
  });

  const signInWithGoogle = useCallback(async (loginHint?: string) => {
    if (isAuthenticating) {
      return;
    }

    setError(null);

    if (!isFirebaseConfigured || !auth) {
      setError(
        'Firebase is not configured. Copy .env.example to .env and add your Firebase credentials.'
      );
      return;
    }

    setIsAuthenticating(true);
    isManualSignInRef.current = true;

    if (Platform.OS === 'web') {
      try {
        const firebaseUser = await signInWithGoogleWeb(allowedDomain, loginHint);
        activeSignInUidRef.current = firebaseUser.uid;
        await hydrateAuthorizedUser(firebaseUser, true);
      } catch (err) {
        setUser(null);
        setError(mapAuthError(err));
      } finally {
        isManualSignInRef.current = false;
        setIsAuthenticating(false);
      }
      return;
    }

    try {
      await nativeAuth.promptSignIn();
    } catch (err) {
      isManualSignInRef.current = false;
      setIsAuthenticating(false);
      setError(mapAuthError(err));
    }
  }, [allowedDomain, hydrateAuthorizedUser, isAuthenticating, nativeAuth]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isAuthenticating) {
        return;
      }

      setError(null);
      setIsAuthenticating(true);
      isManualSignInRef.current = true;

      try {
        const firebaseUser = await signInWithEmailPassword(
          email,
          password,
          allowedDomain
        );
        activeSignInUidRef.current = firebaseUser.uid;
        await hydrateAuthorizedUser(firebaseUser, true);
      } catch (err) {
        setUser(null);
        setError(mapAuthError(err));
      } finally {
        isManualSignInRef.current = false;
        setIsAuthenticating(false);
      }
    },
    [allowedDomain, hydrateAuthorizedUser, isAuthenticating]
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      if (isAuthenticating) {
        return;
      }

      setError(null);
      setIsAuthenticating(true);
      isManualSignInRef.current = true;

      try {
        const firebaseUser = await registerWithEmailPassword(
          name,
          email,
          password,
          allowedDomain
        );
        activeSignInUidRef.current = firebaseUser.uid;
        await hydrateAuthorizedUser(firebaseUser, true);
      } catch (err) {
        setUser(null);
        setError(mapAuthError(err));
      } finally {
        isManualSignInRef.current = false;
        setIsAuthenticating(false);
      }
    },
    [allowedDomain, hydrateAuthorizedUser, isAuthenticating]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      setError(null);
      try {
        await requestPasswordReset(email, allowedDomain);
      } catch (err) {
        setError(mapAuthError(err));
        throw err;
      }
    },
    [allowedDomain]
  );

  const logout = useCallback(async () => {
    setError(null);
    activeSignInUidRef.current = null;
    isManualSignInRef.current = false;

    try {
      await signOutUser();
    } finally {
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth?.currentUser) {
      return;
    }
    const fresh = await getUserProfile(auth.currentUser.uid);
    if (fresh) {
      setUser(fresh);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticating,
      error,
      allowedDomain,
      isConfigured: isFirebaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      logout,
      clearError,
      refreshProfile,
    }),
    [
      user,
      isLoading,
      isAuthenticating,
      error,
      allowedDomain,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      logout,
      clearError,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return ctx;
}
