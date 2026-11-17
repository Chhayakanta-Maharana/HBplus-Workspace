import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  type Dependencies,
} from 'firebase/auth';

/**
 * Web persistence using Firebase's browserLocalPersistence
 * plus browserPopupRedirectResolver (required for signInWithPopup).
 * Tokens remain managed exclusively by the Firebase SDK.
 */
export function getAuthDependencies(): Dependencies {
  return {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  };
}
