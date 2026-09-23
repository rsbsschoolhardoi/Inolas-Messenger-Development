/**
 * CloudStorageService - Infinite Cloud Storage Engine for Zenoa
 * Uploads large media (images, videos, audio notes, documents) to Cloud Bucket
 * and stores lightweight CDN/Storage URLs in Firestore documents.
 */

import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, isFirebaseConfigured } from './firebaseClient';

let storageInstance: any = null;

export function getFirebaseStorage() {
  if (!isFirebaseConfigured || !app) return null;
  if (!storageInstance) {
    try {
      storageInstance = getStorage(app);
    } catch (e) {
      console.warn("Firebase Storage init error:", e);
    }
  }
  return storageInstance;
}

/**
 * Upload Base64 Data URL or Blob directly to Firebase Cloud Storage
 * Returns public Cloud URL for unlimited multi-user media distribution.
 */
const MAX_SAFE_INLINE_PAYLOAD_CHARS = 750 * 1024; // 750 KB safe limit for Firestore 1MB doc boundary

export async function uploadMediaToCloud(
  dataUrlOrBlob: string | Blob | File,
  path: string,
  contentType?: string
): Promise<string> {
  const storage = getFirebaseStorage();
  
  if (!storage) {
    // If Cloud storage is not accessible, check inline size
    if (typeof dataUrlOrBlob === 'string') {
      if (dataUrlOrBlob.length > MAX_SAFE_INLINE_PAYLOAD_CHARS) {
        console.warn(`[CloudStorage] Payload exceeds safe inline limit (${dataUrlOrBlob.length} chars). Suppressing oversized payload to prevent Firestore crash.`);
        return '';
      }
      return dataUrlOrBlob;
    }
    return '';
  }

  try {
    const storageRef = ref(storage, path);

    if (typeof dataUrlOrBlob === 'string') {
      // Data URL upload (e.g. data:image/jpeg;base64,...)
      if (dataUrlOrBlob.startsWith('data:')) {
        const uploadResult = await uploadString(storageRef, dataUrlOrBlob, 'data_url');
        return await getDownloadURL(uploadResult.ref);
      } else {
        // Plain string or already a public URL
        return dataUrlOrBlob;
      }
    } else {
      // Blob or File upload
      const metadata = contentType ? { contentType } : undefined;
      const uploadResult = await uploadBytes(storageRef, dataUrlOrBlob, metadata);
      return await getDownloadURL(uploadResult.ref);
    }
  } catch (error) {
    console.warn("Cloud Storage upload notice (falling back gracefully):", error);
    // Graceful fallback to inline representation if within safe Firestore document limits
    if (typeof dataUrlOrBlob === 'string') {
      if (dataUrlOrBlob.length > MAX_SAFE_INLINE_PAYLOAD_CHARS) {
        console.warn(`[CloudStorage] Fallback payload exceeds safe inline size (${dataUrlOrBlob.length} chars). Suppressed to prevent Firestore write exception.`);
        return '';
      }
      return dataUrlOrBlob;
    }
    return '';
  }
}
