export interface NativeGoogleAuthHandlers {
  allowedDomain: string;
  onIdToken: (idToken: string | undefined) => Promise<void>;
  onCancel: () => void;
  onError: (message: string) => void;
}

export interface NativeGoogleAuthController {
  isReady: boolean;
  isConfigured: boolean;
  promptSignIn: () => Promise<void>;
}

/**
 * Fallback hook for TypeScript resolution.
 * Metro resolves nativeGoogleAuth.web.ts on web and nativeGoogleAuth.native.ts on iOS/Android.
 */
export function useNativeGoogleAuth(
  _handlers: NativeGoogleAuthHandlers
): NativeGoogleAuthController {
  return {
    isReady: false,
    isConfigured: false,
    promptSignIn: async () => undefined,
  };
}
