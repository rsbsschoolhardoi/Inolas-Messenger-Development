import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Silence verbose internal Firebase SDK network retry warnings
try {
  setLogLevel('error');
} catch (e) {
  // ignore if not supported
}

// Standardize configuration to avoid passing extra keys to initializeApp
const standardFirebaseConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId,
};

export const isFirebaseConfigured = !!(
  standardFirebaseConfig.projectId &&
  standardFirebaseConfig.apiKey
);

let initializedApp: any = null;
let initializedDb: any = null;
let initializedAuth: any = null;

if (isFirebaseConfigured) {
  try {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      initializedApp = initializeApp(standardFirebaseConfig);
    } else {
      const defaultApp = existingApps[0];
      if (defaultApp.options.projectId !== standardFirebaseConfig.projectId) {
        console.warn("Firebase project mismatch, initializing zenoa-app");
        try {
          initializedApp = initializeApp(standardFirebaseConfig, "zenoa-app");
        } catch (e) {
          initializedApp = getApp("zenoa-app");
        }
      } else {
        initializedApp = defaultApp;
      }
    }

    // Initialize Auth
    initializedAuth = getAuth(initializedApp);
    
    // Determine database ID (default for custom projects like zenoa-inolas)
    const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

    try {
      initializedDb = initializeFirestore(
        initializedApp,
        {
          experimentalAutoDetectLongPolling: true,
        },
        databaseId
      );
    } catch (e) {
      console.warn("initializeFirestore already called or failed, falling back to getFirestore:", e);
      initializedDb = getFirestore(initializedApp, databaseId);
    }

    console.log(`Firestore initialized for project: ${initializedApp.options.projectId}, database: ${databaseId}`);
  } catch (err) {
    console.error("Firebase startup failed:", err);
  }
}

export const app = initializedApp;
export const db = initializedDb;
export const auth = initializedAuth;
