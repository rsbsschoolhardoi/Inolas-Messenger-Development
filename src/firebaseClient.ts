import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

export const isFirebaseConfigured = !!(
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey
);

let initializedApp: any = null;
let initializedDb: any = null;
let initializedAuth: any = null;

if (isFirebaseConfigured) {
  try {
    initializedApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    initializedDb = initializeFirestore(
      initializedApp,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      dbId
    );
    initializedAuth = getAuth(initializedApp);
  } catch (err) {
    console.warn("Firebase initialization fallback:", err);
  }
}

export const app = initializedApp;
export const db = initializedDb;
export const auth = initializedAuth;
