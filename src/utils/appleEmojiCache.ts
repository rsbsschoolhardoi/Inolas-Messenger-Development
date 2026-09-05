/**
 * Persistent Client-Side Apple Emoji Cache
 * Uses Browser CacheStorage + IndexedDB + In-Memory Object URL Map.
 * Eliminates redundant network requests and loading flickers across sessions.
 */

import { getAppleEmojiCandidateUrls, getAppleEmojiFilename } from './appleEmoji';

const CACHE_NAME = 'apple-emojis-cache-v1';
const memoryBlobUrls = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string | null>>();

// Check browser features safely
const hasCacheStorage = typeof window !== 'undefined' && 'caches' in window;
const hasIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;

// IndexedDB fallback if CacheStorage is blocked in iframe
const DB_NAME = 'zenoa_apple_emojis';
const STORE_NAME = 'blobs';

function openEmojiDB(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'filename' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Retrieves a persistent cached blob URL for an emoji, or fetches and caches it.
 */
export async function getCachedEmojiBlobUrl(emoji: string): Promise<string | null> {
  const filename = getAppleEmojiFilename(emoji);
  if (!filename) return null;

  // 1. In-memory cache hit (0ms)
  if (memoryBlobUrls.has(filename)) {
    return memoryBlobUrls.get(filename)!;
  }

  // Deduplicate inflight fetches
  if (pendingFetches.has(filename)) {
    return pendingFetches.get(filename)!;
  }

  const fetchPromise = (async (): Promise<string | null> => {
    // 2. Check CacheStorage (Disk cache, persistent across reloads)
    if (hasCacheStorage) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const candidateUrls = getAppleEmojiCandidateUrls(emoji);
        for (const url of candidateUrls) {
          const match = await cache.match(url);
          if (match) {
            const blob = await match.blob();
            const blobUrl = URL.createObjectURL(blob);
            memoryBlobUrls.set(filename, blobUrl);
            return blobUrl;
          }
        }
      } catch (_e) {
        // Cache storage restricted or unavailable
      }
    }

    // 3. Check IndexedDB fallback
    try {
      const db = await openEmojiDB();
      if (db) {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(filename);
        const result = await new Promise<any>((resolve) => {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
        if (result && result.blob) {
          const blobUrl = URL.createObjectURL(result.blob);
          memoryBlobUrls.set(filename, blobUrl);
          return blobUrl;
        }
      }
    } catch (_e) {
      // IndexedDB query failed
    }

    // 4. Fetch from upstream with candidate fallback
    const candidateUrls = getAppleEmojiCandidateUrls(emoji);
    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          const clonedForCache = response.clone();
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobUrls.set(filename, blobUrl);

          // Persist to CacheStorage
          if (hasCacheStorage) {
            caches.open(CACHE_NAME).then(c => c.put(url, clonedForCache)).catch(() => {});
          }

          // Persist to IndexedDB
          openEmojiDB().then(db => {
            if (db) {
              const tx = db.transaction(STORE_NAME, 'readwrite');
              tx.objectStore(STORE_NAME).put({ filename, blob, savedAt: Date.now() });
            }
          }).catch(() => {});

          return blobUrl;
        }
      } catch (_e) {
        // Continue to next candidate
      }
    }

    return null;
  })();

  pendingFetches.set(filename, fetchPromise);
  try {
    const res = await fetchPromise;
    return res;
  } finally {
    pendingFetches.delete(filename);
  }
}

/**
 * Returns any synchronously available cached URL (e.g. from memory)
 */
export function getSyncCachedEmojiUrl(emoji: string): string | null {
  const filename = getAppleEmojiFilename(emoji);
  if (!filename) return null;
  return memoryBlobUrls.get(filename) || null;
}

/**
 * Pre-warms the cache with common emojis in the background
 */
export function preloadCommonEmojis(): void {
  if (typeof window === 'undefined') return;

  const popular = [
    '😂', '❤️', '😍', '🔥', '✨', '👍', '🙏', '😊', '😭', '🎉', '🥰', '👏',
    '🤣', '😁', '😆', '😃', '😘', '🥺', '💯', '🤔', '😎', '🫡', '👀', '👋',
    '💀', '💖', '💕', '✌️', '💪', '🙌', '🤩', '🥳', '😴', '🙄', '🤤', '🤤',
    '🎂', '🍕', '☕', '🚀', '⭐', '🌟', '🌈', '👑', '🇮🇳', '🇺🇸'
  ];

  const idleTask = () => {
    popular.forEach((em, idx) => {
      setTimeout(() => {
        getCachedEmojiBlobUrl(em).catch(() => {});
      }, idx * 40);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(idleTask);
  } else {
    setTimeout(idleTask, 1000);
  }
}
