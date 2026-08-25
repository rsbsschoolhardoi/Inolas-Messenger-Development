/**
 * StorageManager - High-Capacity IndexedDB & Storage Optimization Engine for Zenoa
 * Expands storage limits from 5MB (localStorage) to Gigabytes (IndexedDB).
 */

const DB_NAME = 'zenoa_storage_v1';
const DB_VERSION = 1;

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
  messageCount: number;
  mediaCount: number;
  mediaSizeBytes: number;
}

class StorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result as IDBDatabase;
          
          // Store 1: Media Cache (Blobs, DataURLs, Audio, Photos)
          if (!db.objectStoreNames.contains('media_cache')) {
            const mediaStore = db.createObjectStore('media_cache', { keyPath: 'id' });
            mediaStore.createIndex('timestamp', 'timestamp', { unique: false });
            mediaStore.createIndex('chat_id', 'chat_id', { unique: false });
          }

          // Store 2: Offline Messages
          if (!db.objectStoreNames.contains('messages')) {
            const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
            msgStore.createIndex('chat_id', 'chat_id', { unique: false });
            msgStore.createIndex('created_at', 'created_at', { unique: false });
          }

          // Store 3: Key-Value Config / Drafts
          if (!db.objectStoreNames.contains('kv_store')) {
            db.createObjectStore('kv_store', { keyPath: 'key' });
          }
        };

        request.onsuccess = (event: any) => {
          resolve(event.target.result);
        };

        request.onerror = (event: any) => {
          console.warn("IndexedDB open error, falling back to memory:", event.target.error);
          reject(event.target.error);
        };
      } catch (err) {
        console.warn("IndexedDB initialization error:", err);
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save media asset (photo, audio, video, document) into high-capacity IndexedDB
   */
  async saveMedia(id: string, dataUrlOrBlob: string | Blob, meta?: { chat_id?: string; fileName?: string; mimeType?: string }): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('media_cache', 'readwrite');
      const store = tx.objectStore('media_cache');
      
      const sizeBytes = typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob.length : dataUrlOrBlob.size;
      
      store.put({
        id,
        data: dataUrlOrBlob,
        sizeBytes,
        chat_id: meta?.chat_id || '',
        fileName: meta?.fileName || '',
        mimeType: meta?.mimeType || '',
        timestamp: Date.now()
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn("StorageManager.saveMedia error:", err);
    }
  }

  /**
   * Retrieve cached media by ID or filename
   */
  async getMedia(id: string): Promise<string | Blob | null> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('media_cache', 'readonly');
      const store = tx.objectStore('media_cache');
      const request = store.get(id);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          if (request.result && request.result.data) {
            resolve(request.result.data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Persist messages batch to local IndexedDB for fast offline retrieval
   */
  async saveMessages(messages: any[]): Promise<void> {
    if (!messages || messages.length === 0) return;
    try {
      const db = await this.initDB();
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');

      for (const msg of messages) {
        if (msg && msg.id) {
          store.put(msg);
        }
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn("StorageManager.saveMessages error:", err);
    }
  }

  /**
   * Load cached messages for a chat from IndexedDB
   */
  async getMessagesForChat(chatId: string): Promise<any[]> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('chat_id');
      const request = index.getAll(chatId);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const results = request.result || [];
          results.sort((a: any, b: any) => (a.created_at || 0) - (b.created_at || 0));
          resolve(results);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete a single message from local IndexedDB
   */
  async deleteMessage(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      store.delete(id);
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (err) {
      console.warn("StorageManager.deleteMessage error:", err);
    }
  }

  /**
   * Delete all local messages for a specific chat
   */
  async deleteMessagesForChat(chatId: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      const index = store.index('chat_id');
      const request = index.getAllKeys(chatId);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const keys = request.result || [];
          for (const key of keys) {
            store.delete(key);
          }
          resolve();
        };
        request.onerror = () => resolve();
      });
    } catch (err) {
      console.warn("StorageManager.deleteMessagesForChat error:", err);
    }
  }

  /**
   * Retrieve all messages stored across all chats in local IndexedDB
   */
  async getAllMessages(): Promise<any[]> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Clear all local message & chat data from device
   */
  async wipeAllData(): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(['messages', 'media_cache', 'kv_store'], 'readwrite');
      tx.objectStore('messages').clear();
      tx.objectStore('media_cache').clear();
      tx.objectStore('kv_store').clear();
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (err) {
      console.warn("StorageManager.wipeAllData error:", err);
    }
  }

  /**
   * Clear all media cache from IndexedDB to free space
   */
  async clearMediaCache(): Promise<number> {
    try {
      const db = await this.initDB();
      const tx = db.transaction('media_cache', 'readwrite');
      const store = tx.objectStore('media_cache');
      const countReq = store.count();

      return new Promise((resolve) => {
        countReq.onsuccess = () => {
          const count = countReq.result || 0;
          store.clear();
          tx.oncomplete = () => resolve(count);
        };
        countReq.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Estimate total device storage capacity and utilization
   */
  async getStorageEstimate(): Promise<StorageEstimateInfo> {
    let usageBytes = 0;
    let quotaBytes = 50 * 1024 * 1024 * 1024; // default 50GB estimate
    let messageCount = 0;
    let mediaCount = 0;
    let mediaSizeBytes = 0;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined) usageBytes = estimate.usage;
        if (estimate.quota !== undefined) quotaBytes = estimate.quota;
      } catch (e) {
        console.warn("Storage estimate API notice:", e);
      }
    }

    // Inspect IndexedDB stores
    try {
      const db = await this.initDB();
      
      const msgTx = db.transaction('messages', 'readonly');
      const msgStore = msgTx.objectStore('messages');
      messageCount = await new Promise<number>((res) => {
        const req = msgStore.count();
        req.onsuccess = () => res(req.result || 0);
        req.onerror = () => res(0);
      });

      const mediaTx = db.transaction('media_cache', 'readonly');
      const mediaStore = mediaTx.objectStore('media_cache');
      mediaCount = await new Promise<number>((res) => {
        const req = mediaStore.count();
        req.onsuccess = () => res(req.result || 0);
        req.onerror = () => res(0);
      });

      const allMediaReq = mediaStore.getAll();
      await new Promise<void>((res) => {
        allMediaReq.onsuccess = () => {
          const items = allMediaReq.result || [];
          for (const item of items) {
            mediaSizeBytes += (item.sizeBytes || 0);
          }
          res();
        };
        allMediaReq.onerror = () => res();
      });
    } catch (e) {
      // Fallback
    }

    const percentUsed = quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 1000) / 10) : 0;

    return {
      usageBytes,
      quotaBytes,
      usageFormatted: this.formatBytes(usageBytes),
      quotaFormatted: this.formatBytes(quotaBytes),
      percentUsed,
      messageCount,
      mediaCount,
      mediaSizeBytes
    };
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export const storageManager = new StorageManager();
