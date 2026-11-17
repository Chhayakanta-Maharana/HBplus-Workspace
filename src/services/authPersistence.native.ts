import * as FirebaseAuth from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import type { Dependencies, Persistence } from 'firebase/auth';

interface ReactNativeAsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

type ReactNativeFirebaseAuth = typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: ReactNativeAsyncStorage) => Persistence;
};

// expo-secure-store recommends <= 2048 bytes per entry; chunk safely below that limit
const CHUNK_SIZE = 1800;

/**
 * Encodes arbitrary Firebase storage keys (which contain characters like ':')
 * into SecureStore-safe keys matching [A-Za-z0-9._-].
 */
function sanitizeSecureStoreKey(rawKey: string): string {
  const encoded = rawKey.replace(/[^A-Za-z0-9._-]/g, (char) => {
    const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
    return `_x${hex}_`;
  });
  return `fb_${encoded}`;
}

function getChunkCountKey(baseKey: string): string {
  return `${baseKey}.__chunks`;
}

function getChunkKey(baseKey: string, index: number): string {
  return `${baseKey}.__c${index}`;
}

async function clearChunks(baseKey: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(getChunkCountKey(baseKey));
  if (countStr) {
    const count = Number.parseInt(countStr, 10);
    if (!Number.isNaN(count) && count > 0) {
      await Promise.all(
        Array.from({ length: count }, (_, idx) =>
          SecureStore.deleteItemAsync(getChunkKey(baseKey, idx)).catch(() => undefined)
        )
      );
    }
    await SecureStore.deleteItemAsync(getChunkCountKey(baseKey)).catch(() => undefined);
  }
  await SecureStore.deleteItemAsync(baseKey).catch(() => undefined);
}

/**
 * SecureStore-backed AsyncStorage adapter for Firebase Auth on iOS/Android.
 * Uses iOS Keychain and Android Keystore (EncryptedSharedPreferences)
 * with chunking so Firebase session payloads never exceed OS item limits.
 */
const secureStorageAdapter: ReactNativeAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    const safeKey = sanitizeSecureStoreKey(key);
    const countStr = await SecureStore.getItemAsync(getChunkCountKey(safeKey));

    if (!countStr) {
      return SecureStore.getItemAsync(safeKey);
    }

    const count = Number.parseInt(countStr, 10);
    if (Number.isNaN(count) || count <= 0) {
      return null;
    }

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, idx) =>
        SecureStore.getItemAsync(getChunkKey(safeKey, idx))
      )
    );

    if (chunks.some((chunk) => chunk === null)) {
      return null;
    }

    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const safeKey = sanitizeSecureStoreKey(key);
    await clearChunks(safeKey);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(safeKey, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
      return;
    }

    const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
    const writes: Promise<void>[] = [];

    for (let i = 0; i < totalChunks; i += 1) {
      const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      writes.push(
        SecureStore.setItemAsync(getChunkKey(safeKey, i), slice, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        })
      );
    }

    await Promise.all(writes);
    await SecureStore.setItemAsync(getChunkCountKey(safeKey), String(totalChunks), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  },

  async removeItem(key: string): Promise<void> {
    const safeKey = sanitizeSecureStoreKey(key);
    await clearChunks(safeKey);
  },
};

/**
 * Native persistence using Firebase's getReactNativePersistence backed by expo-secure-store.
 */
export function getAuthDependencies(): Dependencies {
  const rnAuth = FirebaseAuth as ReactNativeFirebaseAuth;
  if (typeof rnAuth.getReactNativePersistence === 'function') {
    return {
      persistence: rnAuth.getReactNativePersistence(secureStorageAdapter),
    };
  }
  return {
    persistence: FirebaseAuth.inMemoryPersistence,
  };
}
