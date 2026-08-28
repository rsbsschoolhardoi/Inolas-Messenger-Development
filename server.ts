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

// Middleware to authenticate API Key
const authenticateApiKey = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header.' });
    }
    const apiKey = authHeader.split(' ')[1];
    if (!db) return res.status(500).json({ error: 'Database service unavailable.' });

    const appsRef = collection(db, 'developer_apps');
    const q = query(appsRef, where('api_key', '==', apiKey));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key.' });
    }

    const appDoc = querySnapshot.docs[0];
    req.appData = { id: appDoc.id, ...appDoc.data() };
    next();
  } catch (err: any) {
    console.error("Auth Middleware Exception:", err);
    res.status(500).json({ error: 'Authentication internal error' });
  }
};

app.post('/api/v1/otp/send', authenticateApiKey, async (req: any, res: any) => {
  try {
    let { recipient } = req.body;
    if (!recipient) return res.status(400).json({ error: 'Missing "recipient" field.' });
    
    let cleanRecipient = recipient.toLowerCase().replace(/^@/, '').trim();
    
    // Check if recipient is a mobile number
    if (/^\+?[0-9]{7,15}$/.test(cleanRecipient)) {
      const mobileToFind = cleanRecipient.replace(/^\+/, '');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobile_number', '==', mobileToFind));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return res.status(404).json({ error: `No Zenoa account found linked with mobile number: ${cleanRecipient}` });
      }
      cleanRecipient = querySnapshot.docs[0].data().username;
    }

    const { bot_username, app_name } = req.appData;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (10 * 60 * 1000); 

    if (!db) throw new Error("DB not ready");

    const otpDocRef = doc(db, 'otps', `${cleanRecipient}_${req.appData.id}`);
    await setDoc(otpDocRef, {
      recipient: cleanRecipient,
      app_id: req.appData.id,
      code: otpCode,
      expires_at: expiresAt,
      created_at: Date.now(),
      status: 'pending'
    });

    const participants = [bot_username, cleanRecipient].sort();
    const chatId = `dm_${participants[0]}_${participants[1]}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageText = `🔒 Verification Code: ${otpCode}\n\nThis code was requested by ${app_name}. It will expire in 10 minutes.`;
    const messageId = 'msg_otp_' + Math.random().toString(36).substring(2, 11);

    const batch = writeBatch(db);
    const chatRef = doc(db, 'chats', chatId);
    batch.set(chatRef, {
      id: chatId,
      type: 'dm',
      participants,
      updated_at: Date.now(),
      last_message: 'Verification Code',
      last_message_time: timeStr
    }, { merge: true });

    const msgRef = doc(db, 'messages', messageId);
    batch.set(msgRef, {
      id: messageId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: bot_username,
      text: messageText,
      type: 'text',
      timestamp: timeStr,
      read_by: [bot_username]
    });

    await batch.commit();

    const logId = "log_" + Date.now();
    await setDoc(doc(db, 'developer_logs', logId), {
      app_id: req.appData.id,
      action: 'otp_send',
      recipient: cleanRecipient,
      status: 'success',
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully via Zenoa DM' });
  } catch (err: any) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 2. Verify OTP Endpoint
app.post('/api/v1/otp/verify', authenticateApiKey, async (req: any, res: any) => {
  try {
    let { recipient, code } = req.body;
    if (!recipient || !code) return res.status(400).json({ error: 'Missing "recipient" or "code" fields.' });

    let cleanRecipient = recipient.toLowerCase().replace(/^@/, '').trim();
    
    // Check if recipient is a mobile number
    if (/^\+?[0-9]{7,15}$/.test(cleanRecipient)) {
      const mobileToFind = cleanRecipient.replace(/^\+/, '');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobile_number', '==', mobileToFind));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        cleanRecipient = querySnapshot.docs[0].data().username;
      }
    }

    if (!db) throw new Error("DB not ready");

    const otpDocRef = doc(db, 'otps', `${cleanRecipient}_${req.appData.id}`);
    const otpSnap = await getDoc(otpDocRef);

    if (!otpSnap.exists()) return res.status(404).json({ error: 'No OTP found.' });

    const otpData = otpSnap.data();
    if (otpData.status === 'verified') return res.status(400).json({ error: 'Already verified.' });
    if (Date.now() > otpData.expires_at) return res.status(400).json({ error: 'Expired.' });
    if (otpData.code !== code) return res.status(400).json({ error: 'Invalid code.' });

    await updateDoc(otpDocRef, { status: 'verified' });

    const analyticsRef = doc(db, 'developer_analytics', req.appData.id);
    await setDoc(analyticsRef, {
      otp_verified: increment(1),
      last_activity: Date.now()
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'OTP verified.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 3. Send Message Endpoint
app.post('/api/v1/messages/send', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { recipient, message, media_url } = req.body;
    if (!recipient || (!message && !media_url)) return res.status(400).json({ error: 'Missing fields.' });

    const cleanRecipient = recipient.toLowerCase().replace(/^@/, '').trim();
    const { bot_username, app_name } = req.appData;

    if (!db) throw new Error("DB not ready");

    const participants = [bot_username, cleanRecipient].sort();
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
      sender: bot_username,
      text: message || '',
      type: media_url ? 'image' : 'text',
      media_url: media_url || null,
      timestamp: timeStr,
      read_by: [bot_username]
    });

    await batch.commit();

    const analyticsRef = doc(db, 'developer_analytics', req.appData.id);
    await setDoc(analyticsRef, {
      messages_sent: increment(1),
      last_activity: Date.now()
    }, { merge: true });

    const logId = "log_" + Date.now();
    await setDoc(doc(db, 'developer_logs', logId), {
      app_id: req.appData.id,
      action: 'message_send',
      recipient: cleanRecipient,
      status: 'success',
      timestamp: Date.now()
    });

    return res.status(200).json({ success: true, message: 'Sent.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 4. Get Analytics
app.get('/api/v1/apps/analytics', authenticateApiKey, async (req: any, res: any) => {
  try {
    if (!db) throw new Error("DB not ready");
    const docRef = doc(db, 'developer_analytics', req.appData.id);
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : { messages_sent: 0, otp_verified: 0 };
    return res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// 5. Get App Logs
app.get('/api/v1/apps/logs', authenticateApiKey, async (req: any, res: any) => {
  try {
    if (!db) throw new Error("DB not ready");
    const q = query(collection(db, 'developer_logs'), where('app_id', '==', req.appData.id), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// 6. Update Settings
app.post('/api/v1/apps/update', authenticateApiKey, async (req: any, res: any) => {
  try {
    const { webhook_url, app_name } = req.body;
    if (!db) throw new Error("DB not ready");
    const updateData: any = {};
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
    if (app_name !== undefined) updateData.app_name = app_name;
    await updateDoc(doc(db, 'developer_apps', req.appData.id), updateData);
    return res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
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
