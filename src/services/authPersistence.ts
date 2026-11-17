import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  type Dependencies,
} from 'firebase/auth';

/**
 * Fallback auth dependencies for TypeScript resolution.
 * At runtime, Metro resolves authPersistence.web.ts on web
 * and authPersistence.native.ts on iOS/Android.
 */
export function getAuthDependencies(): Dependencies {
  return {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  };
}
