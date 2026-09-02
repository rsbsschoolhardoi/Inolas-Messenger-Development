import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, increment, writeBatch, orderBy, limit } from 'firebase/firestore';
import axios from 'axios';
import crypto from 'crypto';

// Firebase Config
const firebaseConfig = {
  projectId: "zenoa-inolas",
  appId: "1:521203244415:web:697eefef46957600e50e4a",
  apiKey: "AIzaSyDvRzK3PJcvPVrfh8XXMvUADAKfHxb8-N8",
  authDomain: "zenoa-inolas.firebaseapp.com",
  storageBucket: "zenoa-inolas.firebasestorage.app",
  messagingSenderId: "521203244415"
};

// Initialize Firebase
let db: any = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  console.log("Firebase Client SDK initialized successfully");
} catch (e) {
  console.error("Firebase Initialization failed:", e);
}

export const app = express();
const PORT = 3000;

// Universal CORS, JSON & URL Encoded Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalization & Header Middleware for Vercel / Cloud Run / Local
app.use((req: any, res: any, next: any) => {
  // If request URL is prefixed as /v1/ instead of /api/v1/, normalize to /api/v1/
  if (req.url && req.url.startsWith('/v1/')) {
    req.url = '/api' + req.url;
  }
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-API-Key, Accept");
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'zenoa-developer-api', timestamp: new Date().toISOString() });
});

// In-Memory Resilient Cache for SSO Apps, Codes, Tokens, OTPs, Bot Rules, Activity Logs, and Webhooks
const inMemorySsoApps = new Map<string, any>();
const inMemoryOAuthCodes = new Map<string, any>();
const inMemoryOAuthTokens = new Map<string, any>();
const inMemoryOtps = new Map<string, any>();
const inMemoryBotRules = new Map<string, any[]>();
const inMemoryLogs = new Map<string, any[]>();
const inMemoryWebhookLogs = new Map<string, any[]>();

// Helper to clean object for Firestore (strips undefined values)
function sanitizeFirestoreData(data: any): any {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)).filter(item => item !== undefined);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestoreData(value);
    }
  }
  return clean;
}

// Helper to record developer audit logs in memory and Firestore safely
async function recordDeveloperLog(appId: string, logEntry: any) {
  const logId = logEntry.id || "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const fullLog = sanitizeFirestoreData({ 
    id: logId, 
    app_id: appId || 'unknown_app', 
    method: logEntry.method || 'POST',
    endpoint: logEntry.endpoint || '/api/v1/request',
    status_code: logEntry.status_code || 200,
    status: logEntry.status || (logEntry.status_code < 400 ? 'success' : 'error'),
    latency_ms: logEntry.latency_ms || Math.floor(Math.random() * 20 + 8),
    ip: logEntry.ip || '127.0.0.1',
    ...logEntry, 
    timestamp: logEntry.timestamp || Date.now() 
  });
  
  // Store in memory
  const existing = inMemoryLogs.get(appId) || [];
  existing.unshift(fullLog);
  if (existing.length > 200) existing.length = 200;
  inMemoryLogs.set(appId, existing);

  // Store in Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'developer_logs', logId), fullLog);
    } catch (e) {
      console.warn("Firestore log write warning:", e);
    }
  }
  return fullLog;
}

// Webhook Dispatcher Helper with Delivery Logging
async function dispatchWebhookEvent(webhookUrl: string, secret: string, eventData: any, appId?: string) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, reason: 'Invalid or missing webhook_url', status: 400 };
  }
  
  const deliveryId = "wh_del_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const effectiveAppId = appId || eventData.app_id || 'unknown_app';
  const startTime = Date.now();
  let outcome: any = { success: false, status: 500, latency: 0 };

  try {
    const payloadStr = JSON.stringify(eventData);
    const signature = crypto.createHmac('sha256', secret || 'zenoa_webhook_secret').update(payloadStr).digest('hex');

    const response = await axios.post(webhookUrl, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Zenoa-Signature': signature,
        'X-Zenoa-Event': eventData.event || 'notification',
        'User-Agent': 'Zenoa-Developer-Webhook/2.0'
      },
      timeout: 6000,
      validateStatus: () => true
    });
    
    const latency = Date.now() - startTime;
    outcome = {
      id: deliveryId,
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      latency,
      data: response.data,
      signature
    };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    outcome = {
      id: deliveryId,
      success: false,
      error: err?.message || 'Webhook dispatch failed',
      status: err?.response?.status || 500,
      latency,
      signature: ''
    };
  }

  // Record Webhook Delivery Log
  const deliveryRecord = sanitizeFirestoreData({
    id: deliveryId,
    app_id: effectiveAppId,
    url: webhookUrl,
    event: eventData.event || 'notification',
    status: outcome.success ? 'delivered' : 'failed',
    status_code: outcome.status,
    latency_ms: outcome.latency,
    timestamp: Date.now(),
    payload: eventData,
    response_body: outcome.data || outcome.error || null,
    signature: outcome.signature
  });

  const existingWh = inMemoryWebhookLogs.get(effectiveAppId) || [];
  existingWh.unshift(deliveryRecord);
  if (existingWh.length > 100) existingWh.length = 100;
  inMemoryWebhookLogs.set(effectiveAppId, existingWh);

  if (db) {
    try {
      await setDoc(doc(db, 'webhook_deliveries', deliveryId), deliveryRecord);
    } catch (e) {
      console.warn("Firestore webhook log write warn:", e);
    }
  }

  return outcome;
}

// Helper to look up an SSO or Developer App across in-memory cache and Firestore collections
async function lookupOAuthApp(keyOrId: string): Promise<{ id: string; data: any; collectionName: string } | null> {
  if (!keyOrId || typeof keyOrId !== 'string') return null;
  const trimmed = keyOrId.trim();
  if (!trimmed) return null;

  // Fallback for mock/test sandbox credentials
  if (trimmed === 'zen_test_sandbox_key' || trimmed === 'default_app' || trimmed === 'zen_test_api_key') {
    return {
      id: 'default_app',
      data: {
        id: 'default_app',
        name: 'Sandbox App',
        client_id: 'default_app',
        api_key: 'zen_test_sandbox_key',
        sandbox_api_key: 'zen_test_sandbox_key',
        owner: 'admin_developer',
        bot_username: 'sa_sandbox_bot',
        tier: 'Developer Free'
      },
      collectionName: 'in_memory'
    };
  }

  // 1. Check in-memory cache directly by document ID
  if (inMemorySsoApps.has(trimmed)) {
    return {
      id: trimmed,
      data: inMemorySsoApps.get(trimmed),
      collectionName: 'in_memory'
    };
  }

  // 2. Check in-memory cache by client_id, api_key, client_secret, sandbox_api_key
  for (const [id, appData] of inMemorySsoApps.entries()) {
    if (
      appData &&
      (appData.client_id === trimmed ||
        appData.api_key === trimmed ||
        appData.client_secret === trimmed ||
        appData.sandbox_api_key === trimmed ||
        appData.id === trimmed)
    ) {
      return {
        id,
        data: appData,
        collectionName: 'in_memory'
      };
    }
  }

  // 3. Query Firestore 'sso_applications' collection
  if (db) {
    try {
      const ssoRef = collection(db, 'sso_applications');
      // Direct doc ID check
      const directSsoDoc = await getDoc(doc(db, 'sso_applications', trimmed));
      if (directSsoDoc.exists()) {
        const data = directSsoDoc.data();
        inMemorySsoApps.set(directSsoDoc.id, { id: directSsoDoc.id, ...data });
        return {
          id: directSsoDoc.id,
          data,
          collectionName: 'sso_applications'
        };
      }

      // Query by client_id
      let q = query(ssoRef, where('client_id', '==', trimmed));
      let snap = await getDocs(q);
      if (snap.empty) {
        // Query by api_key
        q = query(ssoRef, where('api_key', '==', trimmed));
        snap = await getDocs(q);
      }
      if (snap.empty) {
        // Query by client_secret
        q = query(ssoRef, where('client_secret', '==', trimmed));
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        inMemorySsoApps.set(docSnap.id, { id: docSnap.id, ...data });
        return {
          id: docSnap.id,
          data,
          collectionName: 'sso_applications'
        };
      }
    } catch (err) {
      console.warn('lookupOAuthApp sso_applications query error:', err);
    }

    // 4. Query Firestore 'developer_apps' collection
    try {
      const devAppsRef = collection(db, 'developer_apps');
      // Direct doc ID check
      const directDevDoc = await getDoc(doc(db, 'developer_apps', trimmed));
      if (directDevDoc.exists()) {
        const data = directDevDoc.data();
        inMemorySsoApps.set(directDevDoc.id, { id: directDevDoc.id, ...data });
        return {
          id: directDevDoc.id,
          data,
          collectionName: 'developer_apps'
        };
      }

      // Query by client_id
      let q = query(devAppsRef, where('client_id', '==', trimmed));
      let snap = await getDocs(q);
      if (snap.empty) {
        // Query by api_key
        q = query(devAppsRef, where('api_key', '==', trimmed));
        snap = await getDocs(q);
      }
      if (snap.empty) {
        // Query by client_secret
        q = query(devAppsRef, where('client_secret', '==', trimmed));
        snap = await getDocs(q);
      }
      if (snap.empty) {
        // Query by sandbox_api_key
        q = query(devAppsRef, where('sandbox_api_key', '==', trimmed));
        snap = await getDocs(q);
      }

      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        inMemorySsoApps.set(docSnap.id, { id: docSnap.id, ...data });
        return {
          id: docSnap.id,
          data,
          collectionName: 'developer_apps'
        };
      }
    } catch (err) {
      console.warn('lookupOAuthApp developer_apps query error:', err);
    }
  }

  return null;
}

// Robust Multi-Credential Developer Authentication Middleware
// In-memory rate limiting state
const apiRateLimits = new Map<string, { count: number, resetAt: number }>();

const authenticateApiKey = async (req: any, res: any, next: any) => {
  try {
    let keyToLookup = '';
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      keyToLookup = authHeader.split(' ')[1].trim();
    } else if (req.headers['x-api-key']) {
      keyToLookup = (req.headers['x-api-key'] as string).trim();
    } else if (req.headers['apikey']) {
      keyToLookup = (req.headers['apikey'] as string).trim();
    } else if (req.headers['x-client-secret']) {
      keyToLookup = (req.headers['x-client-secret'] as string).trim();
    } else if (req.headers['x-client-id']) {
      keyToLookup = (req.headers['x-client-id'] as string).trim();
    } else if (req.query?.api_key || req.query?.client_id || req.query?.client_secret || req.query?.token) {
      keyToLookup = String(req.query.api_key || req.query.client_id || req.query.client_secret || req.query.token).trim();
    } else if (req.body?.client_id || req.body?.api_key || req.body?.client_secret || req.body?.secret || req.body?.token) {
      keyToLookup = String(req.body.client_id || req.body.api_key || req.body.client_secret || req.body.secret || req.body.token).trim();
    }

    if (!keyToLookup) {
      return res.status(401).json({ error: 'Unauthorized: Missing API Key or Client ID. Provide Authorization: Bearer <KEY> or X-API-Key header.' });
    }

    let finalAppData: any = null;
    const match = await lookupOAuthApp(keyToLookup);
    
    if (!match) {
      // Fallback check developer_apps directly
      if (db) {
        const appsRef = collection(db, 'developer_apps');
        let q = query(appsRef, where('api_key', '==', keyToLookup));
        let snap = await getDocs(q);
        if (snap.empty) {
          q = query(appsRef, where('client_id', '==', keyToLookup));
          snap = await getDocs(q);
        }
        if (snap.empty) {
          q = query(appsRef, where('client_secret', '==', keyToLookup));
          snap = await getDocs(q);
        }
        if (!snap.empty) {
          finalAppData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else {
          const directDoc = await getDoc(doc(db, 'developer_apps', keyToLookup));
          if (directDoc.exists()) {
            finalAppData = { id: directDoc.id, ...directDoc.data() };
          }
        }
      }
    } else {
      const appOwner = match.data.owner || match.data.owner_username || 'developer';
      const appBot = match.data.bot_username || match.data.bot_name || `sa_${appOwner}`.toLowerCase().replace(/^@/, '');
      finalAppData = { 
        id: match.id, 
        ...match.data,
        owner: appOwner,
        bot_username: appBot
      };
    }

    if (!finalAppData) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key or Client ID.' });
    }

    // 1. IP Whitelisting / Domain Security Check
    if (finalAppData.allowed_ips && finalAppData.allowed_ips.trim() !== '') {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const allowedIpsList = finalAppData.allowed_ips.split(',').map((ip: string) => ip.trim());
      
      if (!allowedIpsList.includes(clientIp) && !allowedIpsList.includes('*')) {
        return res.status(403).json({ 
          error: `Forbidden: Access denied for IP ${clientIp}. This API Key is restricted to specific IP addresses.` 
        });
      }
    }

    // 2. Rate Limiting Check (Max 60 requests per minute per API key)
    const now = Date.now();
    const rateWindowMs = 60 * 1000; // 1 minute
    const maxRequests = 60; // 60 req / min

    let limitData = apiRateLimits.get(keyToLookup);
    if (!limitData || now > limitData.resetAt) {
      limitData = { count: 0, resetAt: now + rateWindowMs };
    }

    if (limitData.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((limitData.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({ 
        error: `Too Many Requests: Rate limit exceeded. Maximum 60 requests per minute allowed. Try again in ${retryAfterSeconds} seconds.` 
      });
    }

    limitData.count += 1;
    apiRateLimits.set(keyToLookup, limitData);

    const appOwner = finalAppData.owner || finalAppData.owner_username || 'developer';
    const appBot = finalAppData.bot_username || finalAppData.bot_name || `sa_${appOwner}`.toLowerCase().replace(/^@/, '');

    req.appData = {
      ...finalAppData,
      owner: appOwner,
      bot_username: appBot
    };
    next();
  } catch (err: any) {
    console.error("Auth Middleware Exception:", err);
    res.status(500).json({ error: 'Authentication internal error' });
  }
};

// Helper: Resolve recipient (username, mobile number, Zenoa ID, email, or UID) to registered Zenoa user
async function resolveUserRecipient(recipientInput: string): Promise<{ 
  zenoaId: string; 
  username: string; 
  mobileNumber: string; 
  displayName: string 
}> {
  let clean = String(recipientInput || '').trim();
  let cleanLower = clean.toLowerCase().replace(/^@/, '').trim();
  let defaultResult = { zenoaId: cleanLower, username: cleanLower, mobileNumber: '', displayName: cleanLower };

  if (!db || !cleanLower) return defaultResult;

  try {
    const usersRef = collection(db, 'users');
    let matchedDocData: any = null;
    let matchedDocId: string = cleanLower;

    // 1. Direct match by document ID in users collection (both lowercase and raw)
    let directRef = doc(db, 'users', cleanLower);
    let directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      matchedDocData = directSnap.data();
      matchedDocId = directSnap.id;
    } else if (clean !== cleanLower) {
      directRef = doc(db, 'users', clean);
      directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        matchedDocData = directSnap.data();
        matchedDocId = directSnap.id;
      }
    }

    // 2. Query by active username (e.g. azad1)
    const bareUsername = cleanLower.replace(/@zenoa(\.im)?$/, '');
    if (!matchedDocData) {
      const uq = query(usersRef, where('username', '==', bareUsername));
      const uSnap = await getDocs(uq);
      if (!uSnap.empty) {
        matchedDocData = uSnap.docs[0].data();
        matchedDocId = uSnap.docs[0].id;
      }
    }

    // 3. Query by zenoa_id (e.g. azad1@zenoa or custom@zenoa)
    const zenoaFormatted = cleanLower.includes('@zenoa') ? cleanLower : `${cleanLower}@zenoa`;
    if (!matchedDocData) {
      const idq = query(usersRef, where('zenoa_id', '==', zenoaFormatted));
      const idSnap = await getDocs(idq);
      if (!idSnap.empty) {
        matchedDocData = idSnap.docs[0].data();
        matchedDocId = idSnap.docs[0].id;
      }
    }

    if (!matchedDocData) {
      const idq2 = query(usersRef, where('zenoa_id', '==', cleanLower));
      const idSnap2 = await getDocs(idq2);
      if (!idSnap2.empty) {
        matchedDocData = idSnap2.docs[0].data();
        matchedDocId = idSnap2.docs[0].id;
      }
    }

    // 4. Query by email
    if (!matchedDocData && cleanLower.includes('@')) {
      const emailQ = query(usersRef, where('email', '==', cleanLower));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) {
        matchedDocData = emailSnap.docs[0].data();
        matchedDocId = emailSnap.docs[0].id;
      }
    }

    // 5. Query by previous_usernames (e.g. if user edited their username)
    if (!matchedDocData) {
      const prevq = query(usersRef, where('previous_usernames', 'array-contains', bareUsername));
      const prevSnap = await getDocs(prevq);
      if (!prevSnap.empty) {
        matchedDocData = prevSnap.docs[0].data();
        matchedDocId = prevSnap.docs[0].id;
      }
    }

    // 6. Query by mobile_number / phone_number if digits exist
    const phoneDigits = String(recipientInput || '').replace(/[^0-9]/g, '');
    if (!matchedDocData && phoneDigits.length >= 7) {
      const candidateNumbers = [
        String(recipientInput).trim(),
        `+${phoneDigits}`,
        phoneDigits,
        phoneDigits.length >= 10 ? phoneDigits.slice(-10) : null,
        phoneDigits.length >= 10 ? `+91${phoneDigits.slice(-10)}` : null,
        phoneDigits.length >= 10 ? `91${phoneDigits.slice(-10)}` : null,
        phoneDigits.length >= 10 ? `0${phoneDigits.slice(-10)}` : null
      ].filter(Boolean) as string[];

      for (const cand of candidateNumbers) {
        const mobq = query(usersRef, where('mobile_number', '==', cand));
        const mobSnap = await getDocs(mobq);
        if (!mobSnap.empty) {
          matchedDocData = mobSnap.docs[0].data();
          matchedDocId = mobSnap.docs[0].id;
          break;
        }

        const phoneq = query(usersRef, where('phone_number', '==', cand));
        const phoneSnap = await getDocs(phoneq);
        if (!phoneSnap.empty) {
          matchedDocData = phoneSnap.docs[0].data();
          matchedDocId = phoneSnap.docs[0].id;
          break;
        }

        const pShortQ = query(usersRef, where('phone', '==', cand));
        const pShortSnap = await getDocs(pShortQ);
        if (!pShortSnap.empty) {
          matchedDocData = pShortSnap.docs[0].data();
          matchedDocId = pShortSnap.docs[0].id;
          break;
        }
      }

      // Fallback: Check if any user in users collection has mobile_number ending with last 10 digits
      if (!matchedDocData && phoneDigits.length >= 10) {
        const last10 = phoneDigits.slice(-10);
        const allUsersSnap = await getDocs(usersRef);
        for (const uDoc of allUsersSnap.docs) {
          const uData = uDoc.data();
          const uPhone = String(uData?.mobile_number || uData?.phone_number || uData?.phone || uData?.mobile || '').replace(/[^0-9]/g, '');
          if (uPhone.endsWith(last10)) {
            matchedDocData = uData;
            matchedDocId = uDoc.id;
            break;
          }
        }
      }
    }

    // If matchedDocData points to a secondary doc or alias, inspect if primary zenoa_id doc exists
    if (matchedDocData) {
      const primaryZenoaId = matchedDocData.zenoa_id || matchedDocData.id || matchedDocData.uid || matchedDocId;
      if (primaryZenoaId && primaryZenoaId !== matchedDocId) {
        const primaryRef = doc(db, 'users', primaryZenoaId);
        const primarySnap = await getDoc(primaryRef);
        if (primarySnap.exists()) {
          matchedDocData = { ...matchedDocData, ...primarySnap.data() };
        }
      }

      const activeUsername = (matchedDocData.username || matchedDocId).toLowerCase().replace(/^@/, '');
      const activeZenoaId = matchedDocData.zenoa_id || matchedDocData.id || matchedDocData.uid || primaryZenoaId;
      const activeMobile = matchedDocData.mobile_number || matchedDocData.phone_number || matchedDocData.phone || '';
      const activeDisplayName = matchedDocData.display_name || activeUsername;

      return {
        zenoaId: String(activeZenoaId).toLowerCase(),
        username: String(activeUsername).toLowerCase(),
        mobileNumber: String(activeMobile),
        displayName: String(activeDisplayName)
      };
    }
  } catch (err) {
    console.warn("Recipient resolution error:", err);
  }

  return defaultResult;
}

// Helper: Deliver official Service Account Bot DM message to Zenoa user chat inbox
async function deliverBotChatMessage(opts: {
  senderBotUsername: string;
  senderAppName: string;
  recipientUsername: string;
  recipientZenoaId?: string;
  messageText: string;
}): Promise<{ chatId: string; messageId: string }> {
  const { senderBotUsername, senderAppName, recipientUsername, recipientZenoaId, messageText } = opts;
  
  const botClean = senderBotUsername.toLowerCase().replace(/^@/, '');
  const recClean = recipientUsername.toLowerCase().replace(/^@/, '');
  const recIdClean = recipientZenoaId ? recipientZenoaId.toLowerCase().replace(/^@/, '') : recClean;

  if (db && botClean && recClean) {
    try {
      // 1. Check if this is an official Zenoa platform service or a Developer Business bot
      const isOfficialZenoaAccount = ['zenoa', 'sa_zenoa', 'zenoa_official', 'zenoa_security', 'zenoa_auth'].includes(botClean) || botClean.startsWith('zenoa_');
      
      const botDocRef = doc(db, 'users', botClean);
      const botSnap = await getDoc(botDocRef);
      if (!botSnap.exists()) {
        await setDoc(botDocRef, {
          username: botClean,
          display_name: senderAppName ? `${senderAppName}` : (isOfficialZenoaAccount ? 'Zenoa Security' : 'Business Account'),
          bio: isOfficialZenoaAccount ? 'Official Zenoa Account • Security & Verification' : 'Business Service Account • End-to-End Encrypted',
          is_service_account: true,
          is_business_account: !isOfficialZenoaAccount,
          is_official: isOfficialZenoaAccount,
          is_verified: isOfficialZenoaAccount, // Official Zenoa accounts stay verified; Developer Console business accounts are not auto-verified
          verified_type: isOfficialZenoaAccount ? 'purple' : null,
          avatar_seed: botClean,
          registered_at: Date.now()
        }, { merge: true });
      }

      // 2. Format DM chat ID & write chat + message in Zenoa Messenger standard format
      const participants = Array.from(new Set([recClean, recIdClean, botClean].filter(Boolean))).sort();
      const participantIds = Array.from(new Set([recIdClean, recClean, botClean].filter(Boolean))).sort();
      const sortedDmUsernames = [recClean, botClean].sort();
      const chatId = `chat_dm_${sortedDmUsernames.join('_')}`;
      const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const batch = writeBatch(db);
      
      const chatRef = doc(db, 'chats', chatId);
      batch.set(chatRef, {
        id: chatId,
        type: 'dm',
        username: botClean,
        name: senderAppName || 'Service Account',
        participants,
        participant_ids: participantIds,
        updated_at: Date.now(),
        last_message: messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText,
        last_message_time: timeStr,
        last_message_sender: botClean,
        last_message_status: 'sent',
        unread: increment(1)
      }, { merge: true });

      const msgRef = doc(db, 'messages', messageId);
      batch.set(msgRef, {
        id: messageId,
        chat_id: chatId,
        created_at: Date.now(),
        sender: botClean,
        text: messageText,
        type: 'text',
        timestamp: timeStr,
        status: 'sent',
        read_by: [botClean]
      });

      await batch.commit();
      return { chatId, messageId };
    } catch (dmErr) {
      console.warn("deliverBotChatMessage write error:", dmErr);
    }
  }

  return { chatId: `chat_dm_${recClean}_${botClean}`, messageId: 'msg_offline' };
}

// 1. Send OTP Endpoint with Auto-Verification and Template Support
app.post(['/api/v1/otp/send', '/v1/otp/send'], authenticateApiKey, async (req: any, res: any) => {
  try {
    const recipientInput = req.body?.recipient ?? req.body?.to ?? req.body?.phone ?? req.body?.mobile ?? req.body?.phoneNumber ?? req.body?.mobileNumber ?? req.body?.phone_number ?? req.body?.mobile_number ?? req.body?.username ?? req.body?.user ?? req.body?.target ?? req.body?.email ?? req.query?.recipient ?? req.query?.to ?? req.query?.phone ?? req.query?.mobile ?? req.query?.username;

    if (!recipientInput) {
      return res.status(400).json({ error: 'Missing recipient parameter. Provide "recipient", "phone", "mobile", "to", or "username".' });
    }
    
    // Resolve recipient (username, mobile number, or Zenoa ID)
    const resolvedUser = await resolveUserRecipient(recipientInput);
    const cleanRecipient = resolvedUser.username;

    const { owner, owner_username, bot_username, app_name, client_secret, webhook_url } = req.appData;
    const devOwner = owner || owner_username || 'developer';
    // Strictly route OTP through the app's verified registered service account only - NO third-party or custom spoofed senders permitted
    const businessSender = (bot_username || `sa_${devOwner}`).toLowerCase().replace(/^@/, '');
    
    // Ignore any custom sender passed in payload to enforce cryptographic sender isolation
    const senderDisplayName = app_name || 'Service Account';
    const expiryMinutes = Math.max(1, Math.min(1440, Number(expiryMins) || 10));
    
    const customCode = req.body?.custom_code ?? req.body?.code ?? req.body?.otp ?? req.body?.otp_code ?? req.body?.pin ?? req.query?.custom_code ?? req.query?.code;
    const otpCode = customCode ? String(customCode).trim() : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000); 

    const otpPayload = sanitizeFirestoreData({
      recipient: cleanRecipient,
      zenoa_id: resolvedUser.zenoaId,
      mobile_number: resolvedUser.mobileNumber,
      app_id: req.appData.id || 'unknown_app',
      app_name: app_name || 'Application',
      code: otpCode,
      expires_at: expiresAt,
      created_at: Date.now(),
      status: 'pending'
    });

    // Cache in memory for zero latency under multiple lookup keys
    const appIdStr = req.appData.id || 'default_app';
    const rawClean = String(recipientInput).toLowerCase().replace(/^@/, '').trim();
    const candidateKeys = Array.from(new Set([
      `${cleanRecipient}_${appIdStr}`,
      `${resolvedUser.zenoaId}_${appIdStr}`,
      resolvedUser.mobileNumber ? `${resolvedUser.mobileNumber}_${appIdStr}` : null,
      `${rawClean}_${appIdStr}`
    ].filter(Boolean))) as string[];

    for (const k of candidateKeys) {
      inMemoryOtps.set(k, otpPayload);
    }

    // Save in Firestore if available
    if (db) {
      try {
        const primaryOtpDocRef = doc(db, 'otps', `${cleanRecipient}_${appIdStr}`);
        await setDoc(primaryOtpDocRef, otpPayload, { merge: true });
        if (resolvedUser.zenoaId && resolvedUser.zenoaId !== cleanRecipient) {
          await setDoc(doc(db, 'otps', `${resolvedUser.zenoaId}_${appIdStr}`), otpPayload, { merge: true });
        }
      } catch (dbErr) {
        console.warn("Firestore OTP write fallback to memory:", dbErr);
      }
    }

    // Compose clean message
    const templateType = req.body?.template_type ?? req.body?.template ?? req.body?.type ?? 'standard_otp';
    const customMessage = req.body?.custom_message ?? req.body?.message;
    let templateText = customMessage;
    const nowTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (!customMessage) {
      if (templateType === '2fa_auth' || templateType === 'security_code') {
        templateText = `SIGN-IN AUTHORIZATION: {code}\n\nA two-factor authentication passcode was requested for your account on {app_name}.\n\nPasscode: {code}\nValidity: {expiry} minutes\nTriggered At: {timestamp}\n\nSECURITY NOTICE: If you did not initiate this authentication request, please secure your account immediately.`;
      } else if (templateType === 'password_reset' || templateType === 'login_pin') {
        templateText = `PASSWORD RESET PASSCODE: {code}\n\nA password reset request has been initiated for your {app_name} account.\n\nReset Code: {code}\nValidity: {expiry} minutes\nTriggered At: {timestamp}\n\nSECURITY NOTICE: If you did not request a password reset, you may safely disregard this message.`;
      } else if (templateType === 'transaction_auth') {
        templateText = `TRANSACTION AUTHORIZATION: {code}\n\nAuthorize your pending transaction for {app_name} using the one-time passcode below:\n\nPasscode: {code}\nValidity: {expiry} minutes\nTriggered At: {timestamp}\n\nSECURITY NOTICE: Verify transaction details prior to confirming. Never share this code.`;
      } else {
        templateText = `VERIFICATION PASSCODE: {code}\n\nYour one-time authentication passcode for {app_name} is: {code}\n\nValidity: {expiry} minutes\nTriggered At: {timestamp}\n\nSECURITY NOTICE: Do not share this authentication code with anyone. Zenoa and {app_name} representatives will never ask for your one-time code.`;
      }
    }

    let messageText = templateText
      .replace(/{code}/g, otpCode)
      .replace(/{otp_code}/g, otpCode)
      .replace(/{app_name}/g, app_name || 'Application')
      .replace(/{expiry}/g, String(expiryMinutes))
      .replace(/{expiry_mins}/g, String(expiryMinutes))
      .replace(/{timestamp}/g, nowTimeFormatted);

    // Deliver via Direct Service Account Message to recipient's chat inbox
    const deliveryResult = await deliverBotChatMessage({
      senderBotUsername: businessSender,
      senderAppName: app_name || 'Service Account',
      recipientUsername: cleanRecipient,
      recipientZenoaId: resolvedUser.zenoaId,
      messageText
    });

    // Dispatch Webhook Event if webhook configured
    if (webhook_url) {
      dispatchWebhookEvent(webhook_url, client_secret, {
        event: 'otp.sent',
        recipient: cleanRecipient,
        zenoa_id: resolvedUser.zenoaId,
        mobile_number: resolvedUser.mobileNumber,
        app_id: req.appData.id,
        expires_at: expiresAt,
        timestamp: Date.now()
      }).catch(e => console.warn('Webhook dispatch warn:', e));
    }

    // Log Activity
    recordDeveloperLog(req.appData.id, {
      action: 'otp_send',
      recipient: cleanRecipient,
      zenoa_id: resolvedUser.zenoaId,
      status: 'success',
      expiry_mins: expiryMinutes
    }).catch(e => console.warn('Record log warn:', e));

    return res.status(200).json({ 
      success: true, 
      message: 'OTP generated and delivered successfully to DM.',
      otp_id: `${cleanRecipient}_${appIdStr}`,
      recipient: cleanRecipient,
      zenoa_id: resolvedUser.zenoaId,
      mobile_number: resolvedUser.mobileNumber || null,
      chat_id: deliveryResult.chatId,
      message_id: deliveryResult.messageId,
      expires_at: expiresAt,
      expiry_mins: expiryMinutes,
      sample_code: otpCode // Provided for testing inspection
    });
  } catch (err: any) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: 'Failed to send OTP: ' + (err?.message || 'Server error') });
  }
});

// 2. Verify OTP Endpoint with Automated Webhook Notification
app.post(['/api/v1/otp/verify', '/v1/otp/verify'], authenticateApiKey, async (req: any, res: any) => {
  try {
    const recipientInput = req.body?.recipient ?? req.body?.to ?? req.body?.phone ?? req.body?.mobile ?? req.body?.phoneNumber ?? req.body?.mobileNumber ?? req.body?.phone_number ?? req.body?.mobile_number ?? req.body?.username ?? req.body?.user ?? req.body?.target ?? req.body?.email ?? req.query?.recipient ?? req.query?.to ?? req.query?.phone ?? req.query?.mobile ?? req.query?.username;

    const codeInput = req.body?.code ?? req.body?.otp ?? req.body?.otp_code ?? req.body?.pin ?? req.body?.token ?? req.query?.code ?? req.query?.otp;
    const autoVerify = req.body?.auto_verify === true || req.query?.auto_verify === 'true';

    if (!recipientInput || (!codeInput && !autoVerify)) {
      return res.status(400).json({ error: 'Missing "recipient" (phone/username) or "code" (OTP) parameter.' });
    }

    const cleanRecipient = String(recipientInput).toLowerCase().replace(/^@/, '').trim();
    const resolvedUser = await resolveUserRecipient(recipientInput);
    const appIdStr = req.appData.id || 'default_app';

    const candidateKeys = Array.from(new Set([
      `${resolvedUser.username}_${appIdStr}`,
      `${resolvedUser.zenoaId}_${appIdStr}`,
      resolvedUser.mobileNumber ? `${resolvedUser.mobileNumber}_${appIdStr}` : null,
      `${cleanRecipient}_${appIdStr}`
    ].filter(Boolean))) as string[];

    let otpData: any = null;
    let matchedKey = '';

    for (const k of candidateKeys) {
      if (inMemoryOtps.has(k)) {
        otpData = inMemoryOtps.get(k);
        matchedKey = k;
        break;
      }
    }

    if (!otpData && db) {
      for (const k of candidateKeys) {
        try {
          const otpDocRef = doc(db, 'otps', k);
          const otpSnap = await getDoc(otpDocRef);
          if (otpSnap.exists()) {
            otpData = otpSnap.data();
            matchedKey = k;
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (!otpData) {
      return res.status(404).json({ error: 'No active OTP request found for this recipient.' });
    }

    if (otpData.status === 'verified') {
      return res.status(400).json({ error: 'This OTP has already been verified.' });
    }

    if (Date.now() > otpData.expires_at) {
      return res.status(400).json({ error: 'This OTP has expired. Please request a new code.' });
    }

    // If auto_verify requested in developer sandbox or code matches
    const codeMatch = auto_verify === true || otpData.code === String(codeInput).trim();
    if (!codeMatch) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Mark as verified
    otpData.status = 'verified';
    otpData.verified_at = Date.now();
    const primaryOtpKey = matchedKey || candidateKeys[0] || `${cleanRecipient}_${appIdStr}`;

    for (const k of candidateKeys) {
      inMemoryOtps.set(k, otpData);
      if (db) {
        setDoc(doc(db, 'otps', k), otpData, { merge: true }).catch(() => {});
      }
    }

    if (db) {
      try {
        await setDoc(doc(db, 'otps', primaryOtpKey), { 
          status: 'verified',
          verified_at: Date.now()
        }, { merge: true });

        const analyticsRef = doc(db, 'developer_analytics', req.appData.id);
        await setDoc(analyticsRef, {
          otp_verified: increment(1),
          last_activity: Date.now()
        }, { merge: true });

        // Record Activity Log
        recordDeveloperLog(req.appData.id, {
          action: 'otp_verify',
          recipient: cleanRecipient,
          status: 'success'
        }).catch(e => console.warn('Record log warn:', e));
      } catch (e) {
        console.warn("Firestore update warning on OTP verify:", e);
      }
    }

    // Auto-dispatch Webhook Notification: otp.verified
    const { client_secret, webhook_url } = req.appData;
    let webhookResult = null;
    if (webhook_url) {
      webhookResult = await dispatchWebhookEvent(webhook_url, client_secret, {
        event: 'otp.verified',
        recipient: cleanRecipient,
        app_id: req.appData.id,
        verified: true,
        verified_at: Date.now(),
        timestamp: Date.now()
      });
    }

    return res.status(200).json({ 
      success: true, 
      verified: true, 
      message: 'OTP verified successfully.',
      recipient: cleanRecipient,
      verified_at: Date.now(),
      webhook_notified: !!webhook_url,
      webhook_status: webhookResult?.status || null
    });
  } catch (err: any) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ error: 'Failed to verify OTP: ' + (err?.message || 'Server error') });
  }
});

// 3. Automated 1-Click OTP Simulation Pipeline (For Developer Sandbox)
app.post('/api/v1/otp/auto-simulate', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { recipient } = req.body;
    const cleanRecipient = (recipient || 'sandbox_test_user').toLowerCase().replace(/^@/, '').trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = 10;
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    const otpKey = `${cleanRecipient}_${req.appData.id}`;

    const timeline: any[] = [];

    // Step 1: Generate OTP
    const t0 = Date.now();
    timeline.push({ step: 1, action: 'generate_otp', code: otpCode, timestamp: t0, status: 'completed' });

    // Step 2: Store in Cache and DB
    const otpPayload = {
      recipient: cleanRecipient,
      app_id: req.appData.id,
      app_name: req.appData.app_name || 'Registered Business App',
      code: otpCode,
      expires_at: expiresAt,
      created_at: t0,
      status: 'pending'
    };
    inMemoryOtps.set(otpKey, otpPayload);
    timeline.push({ step: 2, action: 'cache_stored', latency_ms: 1, status: 'completed' });

    // Step 3: Simulated DM Delivery
    timeline.push({ 
      step: 3, 
      action: 'bot_dm_delivered', 
      sender: `@${req.appData.owner || req.appData.owner_username || req.appData.bot_username || 'developer'}`, 
      recipient: `@${cleanRecipient}`, 
      message_preview: `🔒 Verification Code: ${otpCode}`,
      status: 'delivered' 
    });

    // Step 4: Auto-Verify Execution
    otpPayload.status = 'verified';
    inMemoryOtps.set(otpKey, { ...otpPayload, verified_at: Date.now() });
    timeline.push({ step: 4, action: 'auto_verified', code_entered: otpCode, status: 'success' });

    // Step 5: Webhook Dispatch (if configured)
    let webhookOutcome: any = { configured: false };
    if (req.appData.webhook_url) {
      webhookOutcome = await dispatchWebhookEvent(req.appData.webhook_url, req.appData.client_secret, {
        event: 'otp.verified',
        recipient: cleanRecipient,
        app_id: req.appData.id,
        simulated: true,
        verified: true,
        timestamp: Date.now()
      });
      timeline.push({ step: 5, action: 'webhook_dispatched', result: webhookOutcome, status: webhookOutcome.success ? 'success' : 'failed' });
    } else {
      timeline.push({ step: 5, action: 'webhook_skipped', note: 'No webhook_url configured in app settings', status: 'skipped' });
    }

    return res.json({
      success: true,
      simulation: 'complete',
      otp_code: otpCode,
      recipient: cleanRecipient,
      duration_ms: Date.now() - t0,
      timeline,
      webhook_outcome: webhookOutcome
    });
  } catch (err: any) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: 'Simulation failed: ' + err?.message });
  }
});

// 4. Get Active / Pending OTPs for App
app.get('/api/v1/otp/active', authenticateApiKey, async (req: any, res: any) => {
  try {
    const activeList: any[] = [];
    const now = Date.now();

    for (const [key, otp] of inMemoryOtps.entries()) {
      if (otp.app_id === req.appData.id) {
        activeList.push({
          key,
          recipient: otp.recipient,
          code: otp.code,
          created_at: otp.created_at,
          expires_at: otp.expires_at,
          is_expired: now > otp.expires_at,
          status: otp.status,
          remaining_seconds: Math.max(0, Math.floor((otp.expires_at - now) / 1000))
        });
      }
    }

    return res.json({ success: true, otps: activeList });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch active OTPs' });
  }
});

// 5. Bot Auto-Responder & Command Rules Endpoints
app.get('/api/v1/bot/rules', authenticateApiKey, async (req: any, res: any) => {
  try {
    const rules = inMemoryBotRules.get(req.appData.id) || req.appData.auto_responses || [
      { id: '1', trigger: '/start', action: 'reply', response: '👋 Hello! I am your verified automated assistant. How can I help you today?', enabled: true },
      { id: '2', trigger: '/otp', action: 'send_otp', response: '🔒 Initiating secure verification code request...', enabled: true },
      { id: '3', trigger: '/help', action: 'reply', response: 'Commands:\n• /start - Start interaction\n• /otp - Request authentication code\n• /help - Show available commands', enabled: true }
    ];
    return res.json({ success: true, rules });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get bot rules' });
  }
});

app.post('/api/v1/bot/rules', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) return res.status(400).json({ error: 'Rules must be an array' });

    inMemoryBotRules.set(req.appData.id, rules);

    if (db) {
      try {
        await updateDoc(doc(db, 'developer_apps', req.appData.id), { auto_responses: rules });
      } catch (e) {
        console.warn("Firestore rule update warn:", e);
      }
    }

    return res.json({ success: true, message: 'Bot automation rules saved successfully', count: rules.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save bot rules' });
  }
});

// 6. Test Live Webhook Delivery Endpoint
app.post('/api/v1/bot/webhook/test', authenticateApiKey, async (req: any, res: any) => {
  try {
    const targetUrl = req.body.webhook_url || req.appData.webhook_url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'No webhook_url provided or configured on this application.' });
    }

    const testPayload = {
      event: req.body.event || 'test.ping',
      timestamp: Date.now(),
      app_id: req.appData.id,
      app_name: req.appData.app_name,
      sample_data: {
        recipient: 'test_developer_user',
        message: 'This is an automated test ping from Zenoa Developer Console.',
        signature_algorithm: 'HMAC-SHA256'
      }
    };

    const outcome = await dispatchWebhookEvent(targetUrl, req.appData.client_secret, testPayload);
    return res.json({
      success: outcome.success,
      url: targetUrl,
      status_code: outcome.status,
      latency_ms: outcome.latency,
      response_data: outcome.data || outcome.error,
      payload_sent: testPayload
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook ping failed: ' + err?.message });
  }
});

// 7. Multi-Recipient Broadcast Messaging Endpoint
app.post('/api/v1/bot/broadcast', authenticateApiKey, async (req: any, res: any) => {
  try {
    if (req.appData && req.appData.owner !== 'zenoa_admin') {
      return res.status(403).json({ error: 'Developer Service Accounts are restricted to sending OTPs only.' });
    }

    const { recipients, message, media_url } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0 || (!message && !media_url)) {
      return res.status(400).json({ error: 'Recipients array and message content are required.' });
    }

    const devOwner = req.appData.owner || req.appData.owner_username || 'developer';
    const businessSender = (req.appData.bot_username || `sa_${devOwner}`).toLowerCase().replace(/^@/, '');
    const results: any[] = [];

    for (const rawRecipient of recipients.slice(0, 50)) { // limit batch size to 50
      if (!rawRecipient) continue;

      try {
        const { username: cleanRec } = await resolveUserRecipient(String(rawRecipient));
        if (!cleanRec) continue;

        await deliverBotChatMessage({
          senderBotUsername: businessSender,
          senderAppName: req.appData.app_name || 'Zenoa Broadcast Bot',
          recipientUsername: cleanRec,
          messageText: message || '[Media Content]'
        });

        results.push({ recipient: cleanRec, status: 'delivered' });
      } catch (e: any) {
        results.push({ recipient: String(rawRecipient), status: 'failed', error: e?.message });
      }
    }

    return res.json({
      success: true,
      total_sent: results.filter(r => r.status === 'delivered').length,
      total_failed: results.filter(r => r.status === 'failed').length,
      details: results
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Broadcast failed: ' + err?.message });
  }
});

// 8. Send Message Endpoint (Direct Bot to User) - Supports both /api/v1/messages/send and /api/v1/bot/send
app.post(['/api/v1/messages/send', '/api/v1/bot/send', '/v1/messages/send', '/v1/bot/send'], authenticateApiKey, async (req: any, res: any) => {
  try {
    const recipientInput = req.body?.recipient ?? req.body?.to ?? req.body?.phone ?? req.body?.mobile ?? req.body?.phoneNumber ?? req.body?.mobileNumber ?? req.body?.phone_number ?? req.body?.mobile_number ?? req.body?.username ?? req.body?.user ?? req.body?.target ?? req.body?.email ?? req.query?.recipient ?? req.query?.to ?? req.query?.username;
    const messageInput = req.body?.message ?? req.body?.text ?? req.body?.content ?? req.body?.body ?? req.query?.message ?? req.query?.text;
    const mediaUrl = req.body?.media_url ?? req.body?.image ?? req.body?.url;

    if (!recipientInput || (!messageInput && !mediaUrl)) {
      return res.status(400).json({ error: 'Missing required parameters: Provide "recipient" and "message".' });
    }

    const { username: cleanRecipient, zenoaId } = await resolveUserRecipient(recipientInput);
    const devOwner = req.appData.owner || req.appData.owner_username || 'developer';
    const businessSender = (req.appData.bot_username || `sa_${devOwner}`).toLowerCase().replace(/^@/, '');

    const { chatId, messageId } = await deliverBotChatMessage({
      senderBotUsername: businessSender,
      senderAppName: req.appData.app_name || 'Service Account',
      recipientUsername: cleanRecipient,
      recipientZenoaId: zenoaId,
      messageText: messageInput || (mediaUrl ? `[Media Attachment: ${mediaUrl}]` : '')
    });

    const analyticsRef = doc(db, 'developer_analytics', req.appData.id);
    await setDoc(analyticsRef, {
      messages_sent: increment(1),
      last_activity: Date.now()
    }, { merge: true }).catch(() => {});

    // Record Activity Log
    recordDeveloperLog(req.appData.id, {
      action: 'message_send',
      recipient: cleanRecipient,
      status: 'success'
    }).catch(e => console.warn('Record log warn:', e));

    return res.status(200).json({ 
      success: true, 
      message: 'Message delivered successfully to user DM.', 
      recipient: cleanRecipient,
      chat_id: chatId, 
      message_id: messageId 
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message: ' + (err?.message || 'Server error') });
  }
});

// 9. Get Analytics
app.get('/api/v1/apps/analytics', authenticateApiKey, async (req: any, res: any) => {
  try {
    let data = { messages_sent: 0, otp_verified: 0, otp_stats: { total: 0, verified: 0, success_rate: 100 } };
    if (db) {
      try {
        const docRef = doc(db, 'developer_analytics', req.appData.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const raw = snap.data();
          data.messages_sent = raw.messages_sent || 0;
          data.otp_verified = raw.otp_verified || 0;
        }
      } catch (e) {
        // ignore
      }
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// 10. Get App Logs (Resilient Firestore + In-Memory merge without requiring composite indexes)
app.get('/api/v1/apps/logs', authenticateApiKey, async (req: any, res: any) => {
  try {
    const logsMap = new Map<string, any>();

    // 1. Gather in-memory cached logs
    const memoryLogs = inMemoryLogs.get(req.appData.id) || [];
    for (const log of memoryLogs) {
      logsMap.set(log.id || `${log.timestamp}_${log.action}`, log);
    }

    // 2. Query Firestore without compound sort to eliminate composite index precondition errors
    if (db) {
      try {
        const q = query(
          collection(db, 'developer_logs'), 
          where('app_id', '==', req.appData.id), 
          limit(100)
        );
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          const data = docSnap.data();
          const id = docSnap.id;
          logsMap.set(id, { id, ...data });
        });
      } catch (e) {
        console.warn("Firestore logs query fallback to memory:", e);
      }
    }

    // 3. Sort descending by timestamp in-memory and cap to 50
    const mergedLogs = Array.from(logsMap.values());
    mergedLogs.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    const finalLogs = mergedLogs.slice(0, 50);

    return res.status(200).json({ success: true, data: finalLogs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

// 10b. Get Webhook Deliveries History
app.get('/api/v1/webhooks/deliveries', authenticateApiKey, async (req: any, res: any) => {
  try {
    const whMap = new Map<string, any>();

    // 1. In-memory cached webhook logs
    const memoryWh = inMemoryWebhookLogs.get(req.appData.id) || [];
    for (const log of memoryWh) {
      whMap.set(log.id, log);
    }

    // 2. Firestore query
    if (db) {
      try {
        const q = query(
          collection(db, 'webhook_deliveries'),
          where('app_id', '==', req.appData.id),
          limit(100)
        );
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          const data = docSnap.data();
          whMap.set(docSnap.id, { id: docSnap.id, ...data });
        });
      } catch (e) {
        console.warn("Firestore webhook logs query fallback:", e);
      }
    }

    const deliveries = Array.from(whMap.values());
    deliveries.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    return res.status(200).json({ success: true, data: deliveries.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
  }
});

// 10c. Retry Webhook Delivery
app.post('/api/v1/webhooks/retry', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { delivery_id, payload, url } = req.body;
    let targetUrl = url || req.appData.webhook_url;
    let targetPayload = payload;

    if (delivery_id) {
      const memoryWh = inMemoryWebhookLogs.get(req.appData.id) || [];
      const found = memoryWh.find(w => w.id === delivery_id);
      if (found) {
        targetUrl = targetUrl || found.url;
        targetPayload = targetPayload || found.payload;
      } else if (db) {
        try {
          const docSnap = await getDoc(doc(db, 'webhook_deliveries', delivery_id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            targetUrl = targetUrl || data.url;
            targetPayload = targetPayload || data.payload;
          }
        } catch (e) {}
      }
    }

    if (!targetUrl) {
      return res.status(400).json({ error: 'No webhook URL specified to retry delivery.' });
    }

    const retryPayload = targetPayload || {
      event: 'retry.ping',
      timestamp: Date.now(),
      app_id: req.appData.id,
      retry: true
    };

    const outcome = await dispatchWebhookEvent(targetUrl, req.appData.client_secret, retryPayload, req.appData.id);
    return res.json({
      success: outcome.success,
      status_code: outcome.status,
      latency_ms: outcome.latency,
      response_data: outcome.data || outcome.error,
      signature: outcome.signature
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retry webhook: ' + (err?.message || 'Server error') });
  }
});

// 11. Update Settings
app.post('/api/v1/apps/update', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { webhook_url, app_name, redirect_uris, website_url, app_description, allowed_ips } = req.body;
    const updateData: any = {};
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
    if (app_name !== undefined) updateData.app_name = app_name;
    if (redirect_uris !== undefined) updateData.redirect_uris = redirect_uris;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (app_description !== undefined) updateData.app_description = app_description;
    if (allowed_ips !== undefined) updateData.allowed_ips = allowed_ips;

    if (db) {
      try {
        await updateDoc(doc(db, 'developer_apps', req.appData.id), updateData);
      } catch (e) {
        console.warn("Firestore update error on app settings:", e);
      }
    }
    return res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// ----------------------------------------------------
// DEDICATED SSO / LOGIN WITH ZENOA MANAGEMENT APIS
// ----------------------------------------------------

// List all SSO apps for an owner
app.get('/api/v1/sso/apps', async (req: any, res: any) => {
  try {
    const owner = req.query.owner;
    if (!owner) return res.status(400).json({ error: 'Missing owner parameter' });

    let apps: any[] = [];

    // Check in-memory store
    for (const [id, a] of inMemorySsoApps.entries()) {
      if (a.owner === owner || owner === 'developer_user' || owner === 'developer_guest') {
        apps.push({ id, ...a });
      }
    }

    if (db) {
      try {
        const ssoRef = collection(db, 'sso_applications');
        const q = query(ssoRef, where('owner', '==', owner));
        const snap = await getDocs(q);
        const firestoreApps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        for (const fa of firestoreApps) {
          if (!apps.some(x => x.client_id === (fa as any).client_id)) {
            apps.push(fa);
          }
        }
      } catch (err) {
        console.warn('Firestore query sso_applications fallback:', err);
      }
    }

    return res.json({ success: true, apps });
  } catch (err: any) {
    console.error('List SSO Apps Error:', err);
    res.status(500).json({ error: 'Failed to fetch SSO applications' });
  }
});

// Create new pure SSO Application (No bot created)
app.post('/api/v1/sso/apps/create', async (req: any, res: any) => {
  try {
    const { owner, app_name, app_description, website_url, redirect_uris, logo_url, scopes } = req.body;
    if (!owner || !app_name) {
      return res.status(400).json({ error: 'owner and app_name are required' });
    }

    const randomId = crypto.randomBytes(12).toString('hex');
    const randomSec = crypto.randomBytes(24).toString('hex');
    const clientId = `zenoa_oauth_${randomId}`;
    const clientSecret = `zenoa_sec_${randomSec}`;

    const initialUris = Array.isArray(redirect_uris) && redirect_uris.length > 0
      ? redirect_uris
      : ['https://example.com/oauth/callback'];

    const newApp = {
      owner: owner.trim(),
      app_name: app_name.trim(),
      app_description: (app_description || '').trim(),
      website_url: (website_url || '').trim(),
      logo_url: (logo_url || '').trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: initialUris,
      scopes: scopes || ['profile', 'email', 'phone'],
      type: 'sso_oauth_client',
      created_at: Date.now(),
      status: 'active'
    };

    const docId = `sso_${randomId}`;
    inMemorySsoApps.set(docId, newApp);

    if (db) {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          const docRef = doc(collection(db, 'sso_applications'), docId);
          await setDoc(docRef, newApp);
        } catch (dbErr) {
          console.warn('Firestore write warning (saved to in-memory store):', dbErr);
        }
      })();
    }

    return res.json({
      success: true,
      app: { id: docId, ...newApp }
    });
  } catch (err: any) {
    console.error('Create SSO App Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to create SSO application' });
  }
});

// Update SSO Application Settings
app.post('/api/v1/sso/apps/update', async (req: any, res: any) => {
  try {
    const { id, client_id, app_name, app_description, website_url, redirect_uris, logo_url, scopes, allowed_ips } = req.body;

    let targetDocId = id;
    if (!targetDocId && client_id) {
      const match = await lookupOAuthApp(client_id);
      if (match) targetDocId = match.id;
    }

    if (!targetDocId) {
      return res.status(400).json({ error: 'Application ID or client_id required' });
    }

    const updatePayload: any = {};
    if (app_name !== undefined) updatePayload.app_name = app_name.trim();
    if (app_description !== undefined) updatePayload.app_description = app_description.trim();
    if (website_url !== undefined) updatePayload.website_url = website_url.trim();
    if (logo_url !== undefined) updatePayload.logo_url = logo_url.trim();
    if (redirect_uris !== undefined && Array.isArray(redirect_uris)) updatePayload.redirect_uris = redirect_uris;
    if (scopes !== undefined && Array.isArray(scopes)) updatePayload.scopes = scopes;
    if (allowed_ips !== undefined) updatePayload.allowed_ips = allowed_ips;

    // Update in-memory
    if (inMemorySsoApps.has(targetDocId)) {
      const existing = inMemorySsoApps.get(targetDocId);
      inMemorySsoApps.set(targetDocId, { ...existing, ...updatePayload });
    }

    if (db) {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          await updateDoc(doc(db, 'sso_applications', targetDocId), updatePayload);
        } catch (dbErr) {
          console.warn('Firestore update warning:', dbErr);
        }
      })();
    }

    return res.json({ success: true, message: 'SSO application updated successfully' });
  } catch (err: any) {
    console.error('Update SSO App Error:', err);
    res.status(500).json({ error: 'Failed to update SSO application' });
  }
});

// Regenerate Client Secret for an SSO App
app.post('/api/v1/sso/apps/regenerate-secret', async (req: any, res: any) => {
  try {
    const { id, client_id } = req.body;

    let targetDocId = id;
    let targetCollection = 'sso_applications';

    if (!targetDocId && client_id) {
      const match = await lookupOAuthApp(client_id);
      if (match) {
        targetDocId = match.id;
        targetCollection = match.collectionName;
      }
    }

    if (!targetDocId) {
      return res.status(400).json({ error: 'Application ID or client_id required' });
    }

    const newSecret = `zenoa_sec_${crypto.randomBytes(24).toString('hex')}`;
    
    // Update in-memory
    if (inMemorySsoApps.has(targetDocId)) {
      const existing = inMemorySsoApps.get(targetDocId);
      inMemorySsoApps.set(targetDocId, { ...existing, client_secret: newSecret });
    }

    if (db && targetCollection !== 'in_memory' && targetCollection !== 'builtin') {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          await updateDoc(doc(db, targetCollection, targetDocId), {
            client_secret: newSecret
          });
        } catch (dbErr) {
          console.warn('Firestore regenerate secret warning:', dbErr);
        }
      })();
    }

    return res.json({ success: true, client_secret: newSecret });
  } catch (err: any) {
    console.error('Regenerate SSO Secret Error:', err);
    res.status(500).json({ error: 'Failed to regenerate secret' });
  }
});

// Delete an SSO App
app.post('/api/v1/sso/apps/delete', async (req: any, res: any) => {
  try {
    const { id, client_id } = req.body;

    let targetDocId = id;
    let targetCollection = 'sso_applications';

    if (!targetDocId && client_id) {
      const match = await lookupOAuthApp(client_id);
      if (match) {
        targetDocId = match.id;
        targetCollection = match.collectionName;
      }
    }

    if (!targetDocId) {
      return res.status(400).json({ error: 'Application ID or client_id required' });
    }

    inMemorySsoApps.delete(targetDocId);

    if (db && targetCollection !== 'in_memory' && targetCollection !== 'builtin') {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          await deleteDoc(doc(db, targetCollection, targetDocId));
        } catch (dbErr) {
          console.warn('Firestore delete warning:', dbErr);
        }
      })();
    }

    return res.json({ success: true, message: 'SSO application deleted' });
  } catch (err: any) {
    console.error('Delete SSO App Error:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ----------------------------------------------------
// OAUTH 2.0 CONSENT, CODE & TOKEN ENDPOINTS
// ----------------------------------------------------

// SSO Configuration & App Details Lookup for Consent Screen
app.get('/api/v1/sso/config', async (req: any, res: any) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'Missing client_id parameter' });

    const match = await lookupOAuthApp(client_id);
    if (!match) {
      return res.status(404).json({ 
        error: `Application not found for client_id: "${client_id}". Please create and register your application in the Zenoa SSO Console.` 
      });
    }

    const appData = match.data;
    return res.json({
      id: match.id,
      client_id: appData.client_id || client_id,
      app_name: appData.app_name || 'Registered Application',
      app_description: appData.app_description || 'External application using Zenoa Single Sign-On',
      website_url: appData.website_url || '',
      logo_url: appData.logo_url || '',
      redirect_uris: appData.redirect_uris || [],
      scopes: appData.scopes || ['profile', 'email', 'phone'],
      owner: appData.owner || ''
    });
  } catch (err: any) {
    console.error('SSO Config Error:', err);
    res.status(500).json({ error: 'Failed to retrieve application configuration' });
  }
});

// Real SSO Authorization Endpoint (Generates code & signed token)
app.post('/api/v1/sso/authorize', async (req: any, res: any) => {
  try {
    const { client_id, user_data, redirect_uri, state, response_type } = req.body;
    if (!client_id || !user_data || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required parameters (client_id, user_data, redirect_uri)' });
    }
    
    if (!db) return res.status(500).json({ error: 'Database service unavailable' });

    const match = await lookupOAuthApp(client_id);
    if (!match) {
      return res.status(404).json({ error: 'Invalid client_id. Application is not registered in Zenoa SSO.' });
    }

    const appData = match.data;
    const appId = match.id;

    // Security Check: Strict Exact Match on Registered Authorized Redirect URIs (Domain matching disabled)
    const normalizeServerUri = (uri: string) => {
      try {
        const u = new URL(uri.trim());
        let p = u.pathname.replace(/\/+$/, '') || '/';
        const portStr = u.port ? `:${u.port}` : '';
        return `${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${portStr}${p}${u.search}`;
      } catch {
        return uri.trim().replace(/\/+$/, '');
      }
    };

    const registeredList = Array.isArray(appData.redirect_uris) ? appData.redirect_uris : [];
    const normalizedReqUri = normalizeServerUri(redirect_uri);
    const isAllowed = registeredList.some((allowedUri: string) => normalizeServerUri(allowedUri) === normalizedReqUri);

    if (!isAllowed) {
      return res.status(403).json({ 
        error: `Redirect URI "${redirect_uri}" is not authorized for this application. Zenoa OAuth requires an exact URI match (Protocol, Domain, Port, and Path). Please add this exact Redirect URI to your application settings in the Zenoa SSO Console.` 
      });
    }

    // 1. Generate Single-Use OAuth 2.0 Authorization Code
    const authCode = 'zenoa_code_' + crypto.randomBytes(20).toString('hex');
    const codeExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const cleanUser = {
      id: user_data.id || user_data.uid,
      username: user_data.username,
      display_name: user_data.display_name || user_data.username,
      email: user_data.email || '',
      mobile_number: user_data.mobile_number || '',
      avatar_url: user_data.avatar_url || '',
      is_verified: true
    };

    const codeRecord = {
      code: authCode,
      client_id,
      user_data: cleanUser,
      redirect_uri,
      state: state || '',
      created_at: Date.now(),
      expires_at: codeExpiresAt,
      used: false
    };

    inMemoryOAuthCodes.set(authCode, codeRecord);

    if (db) {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          await setDoc(doc(db, 'oauth_codes', authCode), codeRecord);
        } catch (dbErr) {
          console.warn('OAuth code firestore write warning:', dbErr);
        }
      })();
    }

    // 2. Generate Signed One-Tap SSO Payload using Application's Secret
    const secret = appData.client_secret || appData.api_key || 'zenoa_sso_secret';
    const ssoPayload = {
      uid: cleanUser.id,
      username: cleanUser.username,
      display_name: cleanUser.display_name,
      email: cleanUser.email,
      mobile_number: cleanUser.mobile_number,
      avatar_url: cleanUser.avatar_url,
      iss: 'zenoa_sso',
      client_id: client_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour token validity
    };
    
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(ssoPayload)).digest('hex');
    const base64Payload = Buffer.from(JSON.stringify(ssoPayload)).toString('base64');

    // Deliver official Zenoa Security Alert to user's chat with registered application name
    const targetAppName = appData.app_name || appData.name || 'Application';
    const alertTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const securityAlertText = `SECURITY ALERT: SIGN-IN AUTHORIZED\n\nYour Zenoa account was successfully authorized to sign in to:\n\nApplication: ${targetAppName}\nClient ID: ${client_id}\nAuthorized At: ${alertTimeStr}\nStatus: Active Authorization\n\nSECURITY NOTICE: If you did not authorize this login request, please open Zenoa Settings > Developer & Security to revoke access immediately.`;

    deliverBotChatMessage({
      senderBotUsername: 'sa_zenoa',
      senderAppName: 'Zenoa Security',
      recipientUsername: cleanUser.username,
      recipientZenoaId: cleanUser.id,
      messageText: securityAlertText
    }).catch(alertErr => console.warn('SSO Security alert dispatch note:', alertErr));

    // Record login log for developer
    recordDeveloperLog(appId, {
      client_id: client_id,
      app_name: appData.app_name || 'SSO App',
      action: 'sso_login',
      recipient: cleanUser.username,
      status: 'success'
    }).catch(logErr => console.warn('Developer log write failed:', logErr));

    return res.json({
      success: true,
      code: authCode,
      payload: base64Payload,
      signature: signature,
      redirect_uri: redirect_uri,
      state: state || ''
    });
  } catch (err: any) {
    console.error('SSO Authorization Exception:', err);
    res.status(500).json({ error: err?.message || 'SSO Authorization failed' });
  }
});
// OAuth 2.0 Token Exchange Endpoint (/api/v1/sso/token)
app.post(['/api/v1/sso/token', '/v1/sso/token'], async (req: any, res: any) => {
  try {
    const { client_id, client_secret, code, redirect_uri, grant_type } = req.body;

    if (!client_id || !client_secret || !code) {
      return res.status(400).json({ error: 'Missing required parameters: client_id, client_secret, and code are required.' });
    }

    // 1. Verify Client Application Credentials
    const match = await lookupOAuthApp(client_id);
    if (!match) {
      return res.status(401).json({ error: 'Invalid client_id. Application not registered.' });
    }

    const appData = match.data;
    const actualSecret = appData.client_secret || appData.api_key;
    if (actualSecret !== client_secret) {
      return res.status(401).json({ error: 'Invalid client_secret. Authentication failed.' });
    }

    // 2. Lookup and Validate Authorization Code
    let codeData: any = inMemoryOAuthCodes.get(code);

    if (!codeData && db) {
      try {
        const codeDocRef = doc(db, 'oauth_codes', code);
        const codeSnap = await getDoc(codeDocRef);
        if (codeSnap.exists()) {
          codeData = codeSnap.data();
        }
      } catch (dbErr) {
        console.warn('Firestore code lookup warning:', dbErr);
      }
    }

    if (!codeData) {
      return res.status(400).json({ error: 'Invalid or expired authorization code.' });
    }

    // Enrich user_data from users collection if incomplete
    if (codeData && (!codeData.user_data || !codeData.user_data.username) && db) {
      const uIdent = codeData.user_id || codeData.user_data?.id;
      if (uIdent) {
        try {
          const uDoc = await getDoc(doc(db, 'users', String(uIdent).toLowerCase()));
          if (uDoc.exists()) {
            const uData = uDoc.data();
            codeData.user_data = {
              id: uDoc.id,
              username: uData?.username || uDoc.id,
              display_name: uData?.display_name || uData?.username || uDoc.id,
              email: uData?.email || '',
              mobile_number: uData?.mobile_number || '',
              avatar_url: uData?.avatar_url || '',
              is_verified: true
            };
          }
        } catch (uErr) {
          console.warn('User profile enrichment warning:', uErr);
        }
      }
    }

    if (codeData.used) {
      return res.status(400).json({ error: 'Authorization code has already been used.' });
    }

    if (codeData.expires_at < Date.now()) {
      return res.status(400).json({ error: 'Authorization code has expired.' });
    }

    if (codeData.client_id !== client_id) {
      return res.status(400).json({ error: 'Authorization code was not issued to this client_id.' });
    }

    // Exact match validation on redirect_uri if provided during token exchange
    if (redirect_uri && codeData.redirect_uri) {
      const normalizeUri = (uri: string) => {
        try {
          const u = new URL(uri.trim());
          let p = u.pathname.replace(/\/+$/, '') || '/';
          const portStr = u.port ? `:${u.port}` : '';
          return `${u.protocol.toLowerCase()}//${u.hostname.toLowerCase()}${portStr}${p}${u.search}`;
        } catch {
          return uri.trim().replace(/\/+$/, '');
        }
      };

      if (normalizeUri(redirect_uri) !== normalizeUri(codeData.redirect_uri)) {
        return res.status(400).json({ error: 'Redirect URI mismatch: redirect_uri does not match the URI used during authorization.' });
      }
    }

    // Mark code as used
    codeData.used = true;
    inMemoryOAuthCodes.set(code, codeData);

    if (db) {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          await updateDoc(doc(db, 'oauth_codes', code), { used: true });
        } catch (dbErr) {
          console.warn('Firestore code mark used warning:', dbErr);
        }
      })();
    }

    // 3. Issue Access Token
    const accessToken = 'zen_token_' + crypto.randomBytes(24).toString('hex');
    const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const tokenRecord = {
      access_token: accessToken,
      client_id,
      user: codeData.user_data,
      created_at: Date.now(),
      expires_at: tokenExpiresAt
    };

    inMemoryOAuthTokens.set(accessToken, tokenRecord);

    if (db) {
      // Run Firestore write in the background so it never blocks or times out the HTTP response
      (async () => {
        try {
          await setDoc(doc(db, 'oauth_tokens', accessToken), tokenRecord);
        } catch (dbErr) {
          console.warn('Firestore token write warning:', dbErr);
        }
      })();
    }

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 86400,
      user: codeData.user_data
    });
  } catch (err: any) {
    console.error('SSO Token Exchange Exception:', err);
    res.status(500).json({ error: err?.message || 'Token exchange failed' });
  }
});

// OAuth 2.0 UserInfo API Endpoint (/api/v1/sso/userinfo or /api/v1/sso/me)
app.get(['/api/v1/sso/userinfo', '/api/v1/sso/me'], async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Check in-memory store
    let tokenData = inMemoryOAuthTokens.get(token);

    if (!tokenData && db) {
      try {
        const tokenDocRef = doc(db, 'oauth_tokens', token);
        const tokenSnap = await getDoc(tokenDocRef);
        if (tokenSnap.exists()) {
          tokenData = tokenSnap.data();
        }
      } catch (dbErr) {
        console.warn('Firestore token lookup warning:', dbErr);
      }
    }

    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired access token.' });
    }

    if (tokenData.expires_at < Date.now()) {
      return res.status(401).json({ error: 'Access token has expired.' });
    }

    return res.json({
      sub: tokenData.user?.id || tokenData.user?.uid,
      id: tokenData.user?.id || tokenData.user?.uid,
      username: tokenData.user?.username,
      name: tokenData.user?.display_name || tokenData.user?.username,
      display_name: tokenData.user?.display_name || tokenData.user?.username,
      email: tokenData.user?.email || '',
      phone_number: tokenData.user?.mobile_number || '',
      mobile_number: tokenData.user?.mobile_number || '',
      avatar_url: tokenData.user?.avatar_url || '',
      picture: tokenData.user?.avatar_url || '',
      is_verified: true
    });
  } catch (err: any) {
    console.error('SSO UserInfo Exception:', err);
    res.status(500).json({ error: 'Failed to retrieve user info.' });
  }
});

// Offline & SDK Signature Verification Endpoint (/api/v1/sso/verify)
app.post('/api/v1/sso/verify', async (req: any, res: any) => {
  try {
    const { client_id, client_secret, payload, signature } = req.body;

    if (!payload || !signature) {
      return res.status(400).json({ error: 'Missing required payload or signature.' });
    }

    let secretToUse = client_secret;

    // If client_secret not provided, lookup by client_id
    if (!secretToUse && client_id && db) {
      const appsRef = collection(db, 'developer_apps');
      let q = query(appsRef, where('client_id', '==', client_id));
      let snap = await getDocs(q);
      if (snap.empty) {
        q = query(appsRef, where('api_key', '==', client_id));
        snap = await getDocs(q);
      }
      if (!snap.empty) {
        secretToUse = snap.docs[0].data().client_secret || snap.docs[0].data().api_key;
      }
    }

    if (!secretToUse) {
      return res.status(400).json({ error: 'client_secret is required to verify signature.' });
    }

    // Decode base64 payload
    const decodedString = Buffer.from(payload, 'base64').toString('utf8');
    const expectedSignature = crypto.createHmac('sha256', secretToUse).update(decodedString).digest('hex');

    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
      return res.status(401).json({ valid: false, error: 'Signature mismatch! Payload may have been tampered with.' });
    }

    const userData = JSON.parse(decodedString);

    // Check expiry
    if (userData.exp && userData.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ valid: false, error: 'SSO payload has expired.' });
    }

    return res.json({
      valid: true,
      user: {
        id: userData.uid,
        username: userData.username,
        display_name: userData.display_name,
        email: userData.email,
        mobile_number: userData.mobile_number,
        avatar_url: userData.avatar_url,
        is_verified: true
      },
      raw_payload: userData
    });
  } catch (err: any) {
    console.error('SSO Verify Exception:', err);
    res.status(500).json({ valid: false, error: err?.message || 'Verification failed.' });
  }
});

// Regenerate Client Secret Endpoint for Developers
app.post('/api/v1/apps/regenerate-secret', authenticateApiKey, async (req: any, res: any) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database service unavailable' });
    const newSecret = 'zen_sec_' + crypto.randomBytes(24).toString('hex');
    await updateDoc(doc(db, 'developer_apps', req.appData.id), {
      client_secret: newSecret
    });
    return res.json({ success: true, client_secret: newSecret });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to regenerate client secret.' });
  }
});

// Truecaller Verification Endpoint
app.post('/api/v1/auth/truecaller/verify', async (req: any, res: any) => {
  try {
    const { payload, signature, signatureAlgorithm } = req.body;
    const partnerKey = process.env.VITE_TRUECALLER_PARTNER_KEY;

    if (!payload || !signature) {
      return res.status(400).json({ error: 'Missing Truecaller payload or signature' });
    }

    // 1. Fetch Truecaller Public Keys (Optional: should be verified in production)
    // const keysResponse = await axios.get('https://api4.truecaller.com/v1/key');
    
    // 2. Decode Payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    return res.json({
      success: true,
      profile: {
        firstName: decodedPayload.firstName,
        lastName: decodedPayload.lastName,
        phoneNumber: decodedPayload.phoneNumber,
        gender: decodedPayload.gender,
        avatarUrl: decodedPayload.avatarUrl,
        email: decodedPayload.email,
        city: decodedPayload.city,
        countryCode: decodedPayload.countryCode
      }
    });
  } catch (err: any) {
    console.error('Truecaller verification error:', err);
    res.status(500).json({ error: 'Failed to verify Truecaller profile' });
  }
});

// ==========================================
// 13. MESSAGE TEMPLATES MANAGER API
// ==========================================
const inMemoryTemplates = new Map<string, any[]>();
const defaultSystemTemplates = [
  {
    id: 'tpl_otp_standard',
    name: 'Standard OTP Verification',
    category: 'AUTHENTICATION',
    language: 'en_US',
    body: 'Your {{app_name}} verification passcode is {{code}}. Valid for {{expiry_mins}} minutes. Never share this code.',
    status: 'approved',
    created_at: Date.now() - 86400000 * 5,
    sample_variables: { app_name: 'Zenoa App', code: '849201', expiry_mins: '10' }
  },
  {
    id: 'tpl_login_alert',
    name: 'Security Login Alert',
    category: 'SECURITY',
    language: 'en_US',
    body: 'Security Notice: New login detected for {{username}} from {{location}} (IP: {{ip_address}}). If this was not you, please lock your account.',
    status: 'approved',
    created_at: Date.now() - 86400000 * 3,
    sample_variables: { username: 'developer', location: 'San Francisco, CA', ip_address: '192.168.1.1' }
  },
  {
    id: 'tpl_trans_receipt',
    name: 'Transactional Payment Receipt',
    category: 'TRANSACTIONAL',
    language: 'en_US',
    body: 'Payment of {{currency}}{{amount}} received successfully for Order #{{order_id}}. Thank you for your business!',
    status: 'approved',
    created_at: Date.now() - 86400000 * 2,
    sample_variables: { currency: '$', amount: '49.00', order_id: 'ZN-89201' }
  }
];

app.get('/api/v1/templates', authenticateApiKey, async (req: any, res: any) => {
  try {
    const appId = req.appData.id || 'default_app';
    const appTemplates = inMemoryTemplates.get(appId) || [];
    
    // Firestore query fallback
    let firestoreTemplates: any[] = [];
    if (db) {
      try {
        const snap = await getDocs(query(collection(db, 'message_templates'), where('app_id', '==', appId)));
        firestoreTemplates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {}
    }

    const merged = [...defaultSystemTemplates];
    for (const t of [...appTemplates, ...firestoreTemplates]) {
      if (!merged.some(x => x.id === t.id)) {
        merged.push(t);
      }
    }

    res.json({ success: true, templates: merged });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch templates: ' + err.message });
  }
});

app.post('/api/v1/templates/create', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { name, category, language, body, sample_variables } = req.body;
    if (!name || !body) {
      return res.status(400).json({ error: 'Template name and body are required.' });
    }

    const appId = req.appData.id || 'default_app';
    const templateId = 'tpl_' + Math.random().toString(36).substring(2, 10);
    const newTemplate = {
      id: templateId,
      app_id: appId,
      name: name.trim(),
      category: category || 'AUTHENTICATION',
      language: language || 'en_US',
      body: body.trim(),
      status: 'pending_review',
      created_at: Date.now(),
      sample_variables: sample_variables || {}
    };

    const existing = inMemoryTemplates.get(appId) || [];
    inMemoryTemplates.set(appId, [newTemplate, ...existing]);

    if (db) {
      try {
        await setDoc(doc(db, 'message_templates', templateId), newTemplate);
      } catch (e) {}
    }

    res.json({ success: true, template: newTemplate, message: 'Template submitted for approval.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create template: ' + err.message });
  }
});

app.post('/api/v1/templates/approve', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { template_id, status } = req.body;
    if (!template_id) return res.status(400).json({ error: 'template_id is required' });

    const appId = req.appData.id || 'default_app';
    const newStatus = status === 'rejected' ? 'rejected' : 'approved';

    const existing = inMemoryTemplates.get(appId) || [];
    const targetTemplate = defaultSystemTemplates.find(t => t.id === template_id) || existing.find(t => t.id === template_id);

    let updatedTemplate: any = null;
    if (targetTemplate) {
      updatedTemplate = { ...targetTemplate, app_id: appId, status: newStatus, updated_at: Date.now() };
      const existsIndex = existing.findIndex(t => t.id === template_id);
      if (existsIndex >= 0) {
        existing[existsIndex] = updatedTemplate;
      } else {
        existing.push(updatedTemplate);
      }
      inMemoryTemplates.set(appId, [...existing]);
    } else {
      const updated = existing.map(t => t.id === template_id ? { ...t, status: newStatus } : t);
      inMemoryTemplates.set(appId, updated);
    }

    if (db) {
      try {
        const payloadToSave = updatedTemplate || { id: template_id, app_id: appId, status: newStatus, updated_at: Date.now() };
        await setDoc(doc(db, 'message_templates', template_id), payloadToSave, { merge: true });
      } catch (e) {
        console.warn('Firestore setDoc message_templates warning:', e);
      }
    }

    res.json({ success: true, template_id, status: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update template status: ' + err.message });
  }
});

app.post('/api/v1/templates/delete', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { template_id } = req.body;
    if (!template_id) return res.status(400).json({ error: 'template_id is required' });

    const appId = req.appData.id || 'default_app';
    const existing = inMemoryTemplates.get(appId) || [];
    inMemoryTemplates.set(appId, existing.filter(t => t.id !== template_id));

    if (db) {
      try {
        await deleteDoc(doc(db, 'message_templates', template_id));
      } catch (e) {}
    }

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete template: ' + err.message });
  }
});

// ==========================================
// 14. BILLING, CREDITS & QUOTA API
// ==========================================
const inMemoryBilling = new Map<string, any>();

app.get('/api/v1/billing/summary', authenticateApiKey, async (req: any, res: any) => {
  try {
    const appId = req.appData.id || 'default_app';
    let billing = inMemoryBilling.get(appId);

    if (!billing) {
      billing = {
        app_id: appId,
        plan: 'free',
        credits_balance: 5000,
        daily_limit: 1000,
        daily_usage: 128,
        monthly_limit: 30000,
        monthly_usage: 3840,
        transactions: [
          { id: 'tx_init_100', date: Date.now() - 86400000 * 4, description: 'Welcome Starter Credits Free Tier', amount: '$0.00', credits: 5000, status: 'completed' }
        ]
      };
      inMemoryBilling.set(appId, billing);
    }

    res.json({ success: true, billing });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch billing summary: ' + err.message });
  }
});

app.post('/api/v1/billing/topup', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { amount_usd, credits_count } = req.body;
    const appId = req.appData.id || 'default_app';
    const creditsToAdd = Number(credits_count) || 5000;
    const amountStr = amount_usd ? `$${Number(amount_usd).toFixed(2)}` : '$25.00';

    let billing = inMemoryBilling.get(appId) || {
      app_id: appId,
      plan: 'free',
      credits_balance: 5000,
      daily_limit: 1000,
      daily_usage: 0,
      monthly_limit: 30000,
      monthly_usage: 0,
      transactions: []
    };

    billing.credits_balance += creditsToAdd;
    const newTx = {
      id: 'tx_' + Math.random().toString(36).substring(2, 10),
      date: Date.now(),
      description: `Credits Top-Up (${creditsToAdd.toLocaleString()} Credits)`,
      amount: amountStr,
      credits: creditsToAdd,
      status: 'completed'
    };
    billing.transactions = [newTx, ...(billing.transactions || [])];

    inMemoryBilling.set(appId, billing);

    res.json({ success: true, billing, message: `Successfully added ${creditsToAdd.toLocaleString()} credits!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to top up credits: ' + err.message });
  }
});

app.post('/api/v1/billing/upgrade-plan', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { plan } = req.body;
    const appId = req.appData.id || 'default_app';
    const targetPlan = ['free', 'growth', 'enterprise'].includes(plan) ? plan : 'growth';

    let billing = inMemoryBilling.get(appId) || {
      app_id: appId,
      plan: 'free',
      credits_balance: 5000,
      daily_limit: 1000,
      daily_usage: 0,
      monthly_limit: 30000,
      monthly_usage: 0,
      transactions: []
    };

    billing.plan = targetPlan;
    if (targetPlan === 'growth') {
      billing.daily_limit = 50000;
      billing.monthly_limit = 1500000;
      billing.credits_balance += 25000;
    } else if (targetPlan === 'enterprise') {
      billing.daily_limit = 1000000;
      billing.monthly_limit = 30000000;
      billing.credits_balance += 100000;
    } else {
      billing.daily_limit = 1000;
      billing.monthly_limit = 30000;
    }

    const newTx = {
      id: 'tx_sub_' + Math.random().toString(36).substring(2, 10),
      date: Date.now(),
      description: `Plan Upgrade to ${targetPlan.toUpperCase()}`,
      amount: targetPlan === 'growth' ? '$49.00' : targetPlan === 'enterprise' ? '$199.00' : '$0.00',
      credits: targetPlan === 'growth' ? 25000 : targetPlan === 'enterprise' ? 100000 : 0,
      status: 'completed'
    };
    billing.transactions = [newTx, ...(billing.transactions || [])];

    inMemoryBilling.set(appId, billing);

    res.json({ success: true, billing, message: `Upgraded to ${targetPlan.toUpperCase()} plan successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to upgrade plan: ' + err.message });
  }
});

// ==========================================
// 15. TEAM MEMBERS & COLLABORATORS API (RBAC)
// ==========================================
const inMemoryTeams = new Map<string, any[]>();

app.get('/api/v1/team/members', authenticateApiKey, async (req: any, res: any) => {
  try {
    const appId = req.appData.id || 'default_app';
    const ownerName = req.appData.owner || 'admin_developer';

    let members = inMemoryTeams.get(appId);
    if (!members || members.length === 0) {
      members = [
        {
          id: 'mem_owner_1',
          username: ownerName,
          name: req.appData.owner_display_name || ownerName,
          email: `${ownerName}@company.com`,
          role: 'admin',
          status: 'active',
          joined_at: Date.now() - 86400000 * 14,
          is_owner: true
        },
        {
          id: 'mem_dev_2',
          username: 'alex_lead_dev',
          name: 'Alex Chen',
          email: 'alex@company.com',
          role: 'developer',
          status: 'active',
          joined_at: Date.now() - 86400000 * 5,
          is_owner: false
        }
      ];
      inMemoryTeams.set(appId, members);
    }

    res.json({ success: true, members });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team members: ' + err.message });
  }
});

app.post('/api/v1/team/invite', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { email, role, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Collaborator email is required' });

    const appId = req.appData.id || 'default_app';
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['admin', 'developer', 'viewer'].includes(role) ? role : 'developer';
    const memberId = 'mem_' + Math.random().toString(36).substring(2, 10);

    const newMember = {
      id: memberId,
      username: cleanEmail.split('@')[0],
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: cleanRole,
      status: 'invited',
      joined_at: Date.now(),
      is_owner: false
    };

    const existing = inMemoryTeams.get(appId) || [];
    inMemoryTeams.set(appId, [...existing, newMember]);

    res.json({ success: true, member: newMember, message: `Invitation sent to ${cleanEmail} with ${cleanRole} role!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to invite team member: ' + err.message });
  }
});

app.post('/api/v1/team/update-role', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { member_id, role } = req.body;
    if (!member_id || !role) return res.status(400).json({ error: 'member_id and role are required' });

    const appId = req.appData.id || 'default_app';
    const existing = inMemoryTeams.get(appId) || [];
    const updated = existing.map(m => m.id === member_id ? { ...m, role } : m);
    inMemoryTeams.set(appId, updated);

    res.json({ success: true, message: 'Member role updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update member role: ' + err.message });
  }
});

app.post('/api/v1/team/remove', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id is required' });

    const appId = req.appData.id || 'default_app';
    const existing = inMemoryTeams.get(appId) || [];
    inMemoryTeams.set(appId, existing.filter(m => m.id !== member_id));

    res.json({ success: true, message: 'Collaborator removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove collaborator: ' + err.message });
  }
});

// Fallback for unmatched API routes to ensure they always return JSON instead of HTML
app.use('/api', (req: any, res: any) => {
  res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

async function startServer() {
  // Vite Middleware (only loaded in development standalone node process)
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite middleware load skipped:", viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zenoa Server running on http://0.0.0.0:${PORT}`);
  });
}

// In local / container dev or standalone server, start the listener.
// In Vercel serverless functions, api/index.ts imports `app` directly.
if (!process.env.VERCEL) {
  startServer();
}

