import type {
  NativeGoogleAuthController,
  NativeGoogleAuthHandlers,
} from './nativeGoogleAuth';

/**
 * Web implementation: no-op because web uses Firebase signInWithPopup directly.
 */
export function useNativeGoogleAuth(
  _handlers: NativeGoogleAuthHandlers
): NativeGoogleAuthController {
  return {
    isReady: true,
    isConfigured: true,
    promptSignIn: async () => undefined,
  };
}
