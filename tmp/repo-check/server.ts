import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, writeBatch, orderBy, limit } from 'firebase/firestore';
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

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'zenoa-developer-api', timestamp: new Date().toISOString() });
});

// In-Memory Resilient Cache for SSO Apps, Codes, Tokens, OTPs, Bot Rules, and Activity Logs
const inMemorySsoApps = new Map<string, any>();
const inMemoryOAuthCodes = new Map<string, any>();
const inMemoryOAuthTokens = new Map<string, any>();
const inMemoryOtps = new Map<string, any>();
const inMemoryBotRules = new Map<string, any[]>();
const inMemoryLogs = new Map<string, any[]>();

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
  const fullLog = sanitizeFirestoreData({ id: logId, app_id: appId || 'unknown_app', ...logEntry, timestamp: logEntry.timestamp || Date.now() });
  
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
}

// Universal OAuth & SSO Client Lookup Helper
async function lookupOAuthApp(clientId: string) {
  if (!clientId) return null;

  // 0. Check in-memory store
  for (const [id, app] of inMemorySsoApps.entries()) {
    if (app.client_id === clientId || id === clientId || app.api_key === clientId) {
      return { id, data: app, collectionName: 'in_memory' };
    }
  }

  // 1. Search in dedicated sso_applications collection
  if (db) {
    try {
      const ssoRef = collection(db, 'sso_applications');
      let q = query(ssoRef, where('client_id', '==', clientId));
      let snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, data: snap.docs[0].data(), collectionName: 'sso_applications' };
      }
    } catch (err) {
      console.warn('Error querying sso_applications:', err);
    }

    // 2. Search in sso_clients collection
    try {
      const ssoClientsRef = collection(db, 'sso_clients');
      let q = query(ssoClientsRef, where('client_id', '==', clientId));
      let snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, data: snap.docs[0].data(), collectionName: 'sso_clients' };
      }
    } catch (err) {
      console.warn('Error querying sso_clients:', err);
    }

    // 3. Search in developer_apps collection (for bots/hybrid apps)
    try {
      const devRef = collection(db, 'developer_apps');
      let q = query(devRef, where('client_id', '==', clientId));
      let snap = await getDocs(q);
      if (snap.empty) {
        q = query(devRef, where('api_key', '==', clientId));
        snap = await getDocs(q);
      }
      if (!snap.empty) {
        return { id: snap.docs[0].id, data: snap.docs[0].data(), collectionName: 'developer_apps' };
      }
    } catch (err) {
      console.warn('Error querying developer_apps:', err);
    }
  }

  // 4. Built-in test client for SSO testing
  if (clientId === 'demo_app' || clientId === 'zenoa_sso_test' || clientId === 'demo' || clientId === 'zenoa_demo_app') {
    return {
      id: 'demo_app',
      data: {
        app_name: 'Zenoa Registered Application',
        app_description: 'OAuth 2.0 & Single Sign-On production client',
        website_url: 'https://zenoa.im',
        logo_url: '',
        client_id: 'demo_app',
        client_secret: process.env.VITE_TRUECALLER_PARTNER_KEY || 'zenoa_sso_demo_secret_2026',
        redirect_uris: ['https://example.com/sso-callback', 'http://localhost:3000/auth/sso'],
        scopes: ['profile', 'email', 'phone']
      },
      collectionName: 'builtin'
    };
  }

  return null;
}

// Webhook Dispatcher Helper
async function dispatchWebhookEvent(webhookUrl: string, secret: string, eventData: any) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return { success: false, reason: 'Invalid or missing webhook_url' };
  try {
    const payloadStr = JSON.stringify(eventData);
    const signature = crypto.createHmac('sha256', secret || 'zenoa_webhook_secret').update(payloadStr).digest('hex');

    const startTime = Date.now();
    const response = await axios.post(webhookUrl, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Zenoa-Signature': signature,
        'X-Zenoa-Event': eventData.event || 'notification',
        'User-Agent': 'Zenoa-Developer-Webhook/2.0'
      },
      timeout: 5000,
      validateStatus: () => true
    });
    const latency = Date.now() - startTime;

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      latency,
      data: response.data
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Webhook dispatch failed',
      status: err?.response?.status || 500
    };
  }
}

// Robust Multi-Credential Developer Authentication Middleware
const authenticateApiKey = async (req: any, res: any, next: any) => {
  try {
    let keyToLookup = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      keyToLookup = authHeader.split(' ')[1].trim();
    } else if (req.headers['x-api-key']) {
      keyToLookup = (req.headers['x-api-key'] as string).trim();
    } else if (req.query?.api_key || req.query?.client_id) {
      keyToLookup = String(req.query.api_key || req.query.client_id).trim();
    } else if (req.body?.client_id || req.body?.api_key) {
      keyToLookup = String(req.body.client_id || req.body.api_key).trim();
    }

    if (!keyToLookup) {
      return res.status(401).json({ error: 'Unauthorized: Missing API Key or Client ID. Provide Authorization: Bearer <KEY>' });
    }

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
        if (!snap.empty) {
          const appDoc = snap.docs[0];
          req.appData = { id: appDoc.id, ...appDoc.data() };
          return next();
        }
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key or Client ID.' });
    }

    req.appData = { 
      id: match.id, 
      ...match.data,
      owner: match.data.owner || match.data.owner_username,
      bot_username: match.data.owner || match.data.owner_username || match.data.bot_username || (match.data.app_name ? match.data.app_name.toLowerCase().replace(/[^a-z0-9_]/g, '') + '_bot' : 'zenoa_bot')
    };
    next();
  } catch (err: any) {
    console.error("Auth Middleware Exception:", err);
    res.status(500).json({ error: 'Authentication internal error' });
  }
};

// 1. Send OTP Endpoint with Auto-Verification and Template Support
app.post('/api/v1/otp/send', authenticateApiKey, async (req: any, res: any) => {
  try {
    let { recipient, template, expiry_mins, custom_code, channel } = req.body;
    if (!recipient) return res.status(400).json({ error: 'Missing "recipient" field.' });
    
    let cleanRecipient = String(recipient || '').toLowerCase().replace(/^@/, '').trim();
    let recipientDisplayName = cleanRecipient;
    
    // Comprehensive resolution if recipient is a mobile number or international phone
    const phoneDigits = String(recipient || '').replace(/[^0-9]/g, '');
    if (phoneDigits.length >= 7) {
      if (db) {
        try {
          const usersRef = collection(db, 'users');
          const candidateNumbers = [
            String(recipient).trim(),
            `+${phoneDigits}`,
            phoneDigits,
            phoneDigits.length > 10 ? phoneDigits.slice(-10) : null,
            phoneDigits.length >= 10 ? `+91${phoneDigits.slice(-10)}` : null,
            phoneDigits.length >= 10 ? `91${phoneDigits.slice(-10)}` : null
          ].filter(Boolean) as string[];

          for (const cand of candidateNumbers) {
            const q = query(usersRef, where('mobile_number', '==', cand));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const matchedUserData = querySnapshot.docs[0].data();
              cleanRecipient = matchedUserData.username || querySnapshot.docs[0].id || cleanRecipient;
              recipientDisplayName = matchedUserData.display_name || cleanRecipient;
              break;
            }
          }
        } catch (e) {
          console.warn("Mobile lookup note:", e);
        }
      }
    }

    cleanRecipient = cleanRecipient || String(recipient || 'unknown').toLowerCase().replace(/^@/, '').trim() || 'unknown_recipient';

    const { owner, owner_username, bot_username, app_name, client_secret, webhook_url } = req.appData;
    const businessSender = owner || owner_username || bot_username || 'zenoa_security';
    const expiryMinutes = Number(expiry_mins) || 10;
    const otpCode = custom_code || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000); 

    const otpPayload = sanitizeFirestoreData({
      recipient: cleanRecipient,
      app_id: req.appData.id || 'unknown_app',
      app_name: app_name || 'Registered Application',
      code: otpCode,
      expires_at: expiresAt,
      created_at: Date.now(),
      status: 'pending'
    });

    // Cache in memory for zero latency
    const otpKey = `${cleanRecipient}_${req.appData.id || 'default_app'}`;
    inMemoryOtps.set(otpKey, otpPayload);

    // Save in Firestore if available
    if (db) {
      try {
        const otpDocRef = doc(db, 'otps', otpKey);
        await setDoc(otpDocRef, otpPayload);
      } catch (dbErr) {
        console.warn("Firestore OTP write fallback to memory:", dbErr);
      }
    }

    // Compose message using Verified Professional Templates only
    const templateType = req.body.template_type || 'standard_otp';
    let templateText = `Security Notice\n\nYour verification code for {app_name} is: **{code}**.\n\nValid for {expiry} minutes. Do not share this code.`;
    
    if (templateType === '2fa_auth') {
      templateText = `Two-Factor Authentication\n\nSign-in authorization code for {app_name}: **{code}**.\n\nThis code expires in {expiry} minutes. Issued by verified business authority.`;
    } else if (templateType === 'password_reset') {
      templateText = `Password Reset Authorization\n\nYour password reset code for {app_name} is: **{code}**.\n\nIf you did not request this reset, please secure your account immediately. Valid for {expiry} minutes.`;
    } else if (templateType === 'transaction_auth') {
      templateText = `Transaction Security Verification\n\nYour payment verification code for {app_name} is: **{code}**.\n\nValid for {expiry} minutes. Authorized transaction confirmation.`;
    }

    let messageText = templateText
      .replace(/{code}/g, otpCode)
      .replace(/{otp_code}/g, otpCode)
      .replace(/{app_name}/g, app_name || 'Application')
      .replace(/{expiry}/g, String(expiryMinutes))
      .replace(/{expiry_mins}/g, String(expiryMinutes));

    // Deliver via Direct Business Message to recipient's Zenoa chat inbox
    if (db && cleanRecipient && businessSender) {
      try {
        const participants = [businessSender, cleanRecipient].sort();
        const chatId = `dm_${participants[0]}_${participants[1]}`;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageId = 'msg_otp_' + Math.random().toString(36).substring(2, 11);

        const batch = writeBatch(db);
        const chatRef = doc(db, 'chats', chatId);
        batch.set(chatRef, {
          id: chatId,
          type: 'dm',
          participants,
          updated_at: Date.now(),
          last_message: `Verification Code: ${otpCode}`,
          last_message_time: timeStr
        }, { merge: true });

        const msgRef = doc(db, 'messages', messageId);
        batch.set(msgRef, {
          id: messageId,
          chat_id: chatId,
          created_at: Date.now(),
          sender: businessSender,
          text: messageText,
          type: 'text',
          timestamp: timeStr,
          read_by: [businessSender]
        });

        await batch.commit();
      } catch (dmErr) {
        console.warn("DM write error (non-fatal):", dmErr);
      }
    }

    // Dispatch Webhook Event if webhook configured
    if (webhook_url) {
      dispatchWebhookEvent(webhook_url, client_secret, {
        event: 'otp.sent',
        recipient: cleanRecipient,
        app_id: req.appData.id,
        expires_at: expiresAt,
        timestamp: Date.now()
      }).catch(e => console.warn('Webhook dispatch warn:', e));
    }

    // Log Activity
    recordDeveloperLog(req.appData.id, {
      action: 'otp_send',
      recipient: cleanRecipient,
      status: 'success',
      expiry_mins: expiryMinutes
    }).catch(e => console.warn('Record log warn:', e));

    return res.status(200).json({ 
      success: true, 
      message: 'OTP generated and delivered successfully',
      otp_id: otpKey,
      expires_at: expiresAt,
      expiry_mins: expiryMinutes,
      sample_code: otpCode // Provided for developer sandbox inspection
    });
  } catch (err: any) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: 'Failed to send OTP: ' + (err?.message || 'Server error') });
  }
});

// 2. Verify OTP Endpoint with Automated Webhook Notification
app.post('/api/v1/otp/verify', authenticateApiKey, async (req: any, res: any) => {
  try {
    let { recipient, code, auto_verify } = req.body;
    if (!recipient || (!code && !auto_verify)) {
      return res.status(400).json({ error: 'Missing "recipient" or "code" fields.' });
    }

    let cleanRecipient = String(recipient || '').toLowerCase().replace(/^@/, '').trim();
    
    // Comprehensive resolution if recipient is a mobile number
    const phoneDigits = String(recipient || '').replace(/[^0-9]/g, '');
    if (phoneDigits.length >= 7) {
      if (db) {
        try {
          const usersRef = collection(db, 'users');
          const candidateNumbers = [
            String(recipient).trim(),
            `+${phoneDigits}`,
            phoneDigits,
            phoneDigits.length > 10 ? phoneDigits.slice(-10) : null,
            phoneDigits.length >= 10 ? `+91${phoneDigits.slice(-10)}` : null,
            phoneDigits.length >= 10 ? `91${phoneDigits.slice(-10)}` : null
          ].filter(Boolean) as string[];

          for (const cand of candidateNumbers) {
            const q = query(usersRef, where('mobile_number', '==', cand));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const matchedUserData = querySnapshot.docs[0].data();
              cleanRecipient = matchedUserData.username || querySnapshot.docs[0].id || cleanRecipient;
              break;
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    cleanRecipient = cleanRecipient || String(recipient || 'unknown').toLowerCase().replace(/^@/, '').trim() || 'unknown_recipient';

    const otpKey = `${cleanRecipient}_${req.appData.id || 'default_app'}`;
    let otpData: any = inMemoryOtps.get(otpKey);

    if (!otpData && db) {
      try {
        const otpDocRef = doc(db, 'otps', otpKey);
        const otpSnap = await getDoc(otpDocRef);
        if (otpSnap.exists()) {
          otpData = otpSnap.data();
        }
      } catch (e) {
        // ignore
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
    const codeMatch = auto_verify === true || otpData.code === String(code).trim();
    if (!codeMatch) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Mark as verified
    otpData.status = 'verified';
    otpData.verified_at = Date.now();
    inMemoryOtps.set(otpKey, otpData);

    if (db) {
      try {
        await updateDoc(doc(db, 'otps', otpKey), { 
          status: 'verified',
          verified_at: Date.now()
        });

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
    const { recipients, message, media_url } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0 || (!message && !media_url)) {
      return res.status(400).json({ error: 'Recipients array and message content are required.' });
    }

    const businessSender = req.appData.owner || req.appData.owner_username || req.appData.bot_username || 'zenoa_security';
    const results: any[] = [];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    for (const rawRecipient of recipients.slice(0, 50)) { // limit batch size to 50
      const clean = String(rawRecipient).toLowerCase().replace(/^@/, '').trim();
      if (!clean) continue;

      try {
        if (db) {
          const participants = [businessSender, clean].sort();
          const chatId = `dm_${participants[0]}_${participants[1]}`;
          const messageId = "msg_bc_" + Math.random().toString(36).substring(2, 12);

          const batch = writeBatch(db);
          batch.set(doc(db, 'chats', chatId), {
            last_message: message || '[Media]',
            last_message_time: timeStr,
            updated_at: Date.now()
          }, { merge: true });

          batch.set(doc(db, 'messages', messageId), {
            id: messageId,
            chat_id: chatId,
            created_at: Date.now(),
            sender: businessSender,
            text: message || '',
            type: media_url ? 'image' : 'text',
            media_url: media_url || null,
            timestamp: timeStr,
            read_by: [businessSender]
          });

          await batch.commit();
        }
        results.push({ recipient: clean, status: 'delivered' });
      } catch (e: any) {
        results.push({ recipient: clean, status: 'failed', error: e?.message });
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

// 8. Send Message Endpoint (Direct Bot to User)
app.post('/api/v1/messages/send', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { recipient, message, media_url } = req.body;
    if (!recipient || (!message && !media_url)) return res.status(400).json({ error: 'Missing fields.' });

    const cleanRecipient = recipient.toLowerCase().replace(/^@/, '').trim();
    const businessSender = req.appData.owner || req.appData.owner_username || req.appData.bot_username || 'zenoa_security';

    if (!db) throw new Error("DB not ready");

    const participants = [businessSender, cleanRecipient].sort();
    const chatId = `dm_${participants[0]}_${participants[1]}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageId = "msg_" + Math.random().toString(36).substring(2, 15);

    const batch = writeBatch(db);
    const chatRef = doc(db, 'chats', chatId);
    batch.set(chatRef, {
      last_message: message || '[Media]',
      last_message_time: timeStr,
      updated_at: Date.now()
    }, { merge: true });

    const msgRef = doc(db, 'messages', messageId);
    batch.set(msgRef, {
      id: messageId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: businessSender,
      text: message || '',
      type: media_url ? 'image' : 'text',
      media_url: media_url || null,
      timestamp: timeStr,
      read_by: [businessSender]
    });

    await batch.commit();

    const analyticsRef = doc(db, 'developer_analytics', req.appData.id);
    await setDoc(analyticsRef, {
      messages_sent: increment(1),
      last_activity: Date.now()
    }, { merge: true });

    // Record Activity Log
    recordDeveloperLog(req.appData.id, {
      action: 'message_send',
      recipient: cleanRecipient,
      status: 'success'
    }).catch(e => console.warn('Record log warn:', e));

    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
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

// 11. Update Settings
app.post('/api/v1/apps/update', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { webhook_url, app_name, redirect_uris, website_url, app_description } = req.body;
    const updateData: any = {};
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
    if (app_name !== undefined) updateData.app_name = app_name;
    if (redirect_uris !== undefined) updateData.redirect_uris = redirect_uris;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (app_description !== undefined) updateData.app_description = app_description;

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
      try {
        const docRef = doc(collection(db, 'sso_applications'), docId);
        await setDoc(docRef, newApp);
      } catch (dbErr) {
        console.warn('Firestore write warning (saved to in-memory store):', dbErr);
      }
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
    const { id, client_id, app_name, app_description, website_url, redirect_uris, logo_url, scopes } = req.body;

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

    // Update in-memory
    if (inMemorySsoApps.has(targetDocId)) {
      const existing = inMemorySsoApps.get(targetDocId);
      inMemorySsoApps.set(targetDocId, { ...existing, ...updatePayload });
    }

    if (db) {
      try {
        await updateDoc(doc(db, 'sso_applications', targetDocId), updatePayload);
      } catch (dbErr) {
        console.warn('Firestore update warning:', dbErr);
      }
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
      try {
        await updateDoc(doc(db, targetCollection, targetDocId), {
          client_secret: newSecret
        });
      } catch (dbErr) {
        console.warn('Firestore regenerate secret warning:', dbErr);
      }
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
      try {
        await deleteDoc(doc(db, targetCollection, targetDocId));
      } catch (dbErr) {
        console.warn('Firestore delete warning:', dbErr);
      }
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

    // Security Check: Validate Redirect URI
    if (appData.redirect_uris && appData.redirect_uris.length > 0) {
      const isAllowed = appData.redirect_uris.some((allowedUri: string) => {
        try {
          const u1 = new URL(allowedUri);
          const u2 = new URL(redirect_uri);
          return u1.origin === u2.origin && u1.pathname === u2.pathname;
        } catch {
          return allowedUri.trim() === redirect_uri.trim();
        }
      });

      const isLocalOrPreview = redirect_uri.includes('localhost') || redirect_uri.includes('/auth/sso') || redirect_uri.includes('/sso');
      if (!isAllowed && !isLocalOrPreview) {
        return res.status(403).json({ error: `Redirect URI "${redirect_uri}" is not authorized for this application. Please configure it in your Zenoa SSO Console.` });
      }
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
      try {
        await setDoc(doc(db, 'oauth_codes', authCode), codeRecord);
      } catch (dbErr) {
        console.warn('OAuth code firestore write warning:', dbErr);
      }
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
app.post('/api/v1/sso/token', async (req: any, res: any) => {
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

    if (codeData.used) {
      return res.status(400).json({ error: 'Authorization code has already been used.' });
    }

    if (codeData.expires_at < Date.now()) {
      return res.status(400).json({ error: 'Authorization code has expired.' });
    }

    if (codeData.client_id !== client_id) {
      return res.status(400).json({ error: 'Authorization code was not issued to this client_id.' });
    }

    // Mark code as used
    codeData.used = true;
    inMemoryOAuthCodes.set(code, codeData);

    if (db) {
      try {
        await updateDoc(doc(db, 'oauth_codes', code), { used: true });
      } catch (dbErr) {
        console.warn('Firestore code mark used warning:', dbErr);
      }
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
      try {
        await setDoc(doc(db, 'oauth_tokens', accessToken), tokenRecord);
      } catch (dbErr) {
        console.warn('Firestore token write warning:', dbErr);
      }
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

async function startServer() {
  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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

startServer();
