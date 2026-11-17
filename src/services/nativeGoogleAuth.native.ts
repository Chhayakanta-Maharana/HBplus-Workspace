import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type {
  NativeGoogleAuthController,
  NativeGoogleAuthHandlers,
} from './nativeGoogleAuth';

WebBrowser.maybeCompleteAuthSession();

const PLACEHOLDER_CLIENT_ID = 'unconfigured-oauth-client-id.apps.googleusercontent.com';

function normalizeClientId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('your-')) {
    return null;
  }
  return trimmed;
}

/**
 * Native Google Sign-In using expo-auth-session Google provider.
 * Requests an ID token (with `hd` hosted domain hint) and passes it to Firebase signInWithCredential.
 */
export function useNativeGoogleAuth(
  handlers: NativeGoogleAuthHandlers
): NativeGoogleAuthController {
  const { allowedDomain, onIdToken, onCancel, onError } = handlers;

  const androidClientId = normalizeClientId(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  );
  const iosClientId = normalizeClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
  const webClientId = normalizeClientId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

  const hasPlatformClientId =
    Platform.OS === 'ios'
      ? Boolean(iosClientId || webClientId)
      : Boolean(androidClientId || webClientId);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webClientId ?? PLACEHOLDER_CLIENT_ID,
    androidClientId: androidClientId ?? webClientId ?? PLACEHOLDER_CLIENT_ID,
    iosClientId: iosClientId ?? webClientId ?? PLACEHOLDER_CLIENT_ID,
    selectAccount: true,
    extraParams: allowedDomain !== 'gmail.com' ? { hd: allowedDomain } : undefined,
  });

  // Track last handled response to prevent duplicate exchanges on re-render
  const handledResponseRef = useRef<unknown>(null);

  useEffect(() => {
    if (!response || response === handledResponseRef.current) {
      return;
    }

    if (response.type === 'success') {
      // On Android/iOS with auto code exchange, wait until id_token or authentication is populated
      const idToken =
        response.params?.id_token || response.authentication?.idToken || undefined;

      if (!idToken && response.params?.code && !response.authentication) {
        return;
      }

      handledResponseRef.current = response;
      void onIdToken(idToken);
      return;
    }

    handledResponseRef.current = response;

    if (response.type === 'cancel' || response.type === 'dismiss') {
      onCancel();
      return;
    }

    if (response.type === 'error') {
      const errorMessage =
        response.error?.message ||
        'Google authentication failed. Please try again.';
      onError(errorMessage);
    }
  }, [response, onIdToken, onCancel, onError]);

  const promptSignIn = useCallback(async () => {
    if (!hasPlatformClientId) {
      onError(
        `Google OAuth client ID is not configured for ${Platform.OS}. Update your .env file.`
      );
      return;
    }

    if (!request) {
      onError('Google Sign-In is still initializing. Please try again in a moment.');
      return;
    }

    const result = await promptAsync();
    if (result.type === 'cancel' || result.type === 'dismiss') {
      handledResponseRef.current = result;
      onCancel();
    }
  }, [hasPlatformClientId, request, promptAsync, onCancel, onError]);

  return {
    isReady: Boolean(request),
    isConfigured: hasPlatformClientId,
    promptSignIn,
  };
}
