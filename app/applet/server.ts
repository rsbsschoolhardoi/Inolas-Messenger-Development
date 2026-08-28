import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK safely
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'zenoa-inolas'
    });
  }
} catch (e) {
  console.warn("Firebase Admin SDK initialization warning:", e);
}

const getDb = () => {
  try {
    return admin.apps.length ? admin.firestore() : null;
  } catch (e) {
    return null;
  }
};

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'zenoa-developer-api', timestamp: new Date().toISOString() });
});

app.get('/api/v1/docs', (req, res) => {
  res.json({
    name: "Zenoa Bot & Developer REST API",
    version: "1.0.0",
    endpoints: [
      {
        path: "/api/v1/messages/send",
        method: "POST",
        description: "Send automated messages from your verified bot to any Zenoa user.",
        headers: {
          "Authorization": "Bearer zen_live_<your_api_key>",
          "Content-Type": "application/json"
        },
        body: {
          "recipient": "username (string, required)",
          "message": "Message text (string, required)",
          "media_url": "Optional media or attachment URL (string)"
        }
      }
    ]
  });
});

app.post('/api/v1/messages/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header. Use "Bearer zen_live_..."' });
    }

    const apiKey = authHeader.split(' ')[1];
    if (!apiKey || !apiKey.startsWith('zen_live_')) {
      return res.status(401).json({ error: 'Invalid API key format.' });
    }

    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database service unavailable on server.' });
    }

    // 1. Authenticate API Key against developer_apps collection
    const appsRef = db.collection('developer_apps');
    const querySnapshot = await appsRef.where('api_key', '==', apiKey).get();

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or revoked API key.' });
    }

    const appData = querySnapshot.docs[0].data();
    const botUsername = appData.bot_username;
    const appName = appData.app_name;

    // 2. Parse request body
    const { recipient, message, media_url } = req.body;
    if (!recipient || (!message && !media_url)) {
      return res.status(400).json({ error: 'Missing required fields: "recipient" and either "message" or "media_url".' });
    }

    const cleanRecipient = recipient.toLowerCase().replace(/^@/, '').trim();

    // 3. Verify recipient exists in users collection
    const recipientRef = db.collection('users').doc(cleanRecipient);
    const recipientSnap = await recipientRef.get();

    if (!recipientSnap.exists) {
      return res.status(404).json({ error: `Recipient @${cleanRecipient} not found on Zenoa.` });
    }

    // 4. Construct or find DM chat ID between bot and recipient
    const participants = [botUsername, cleanRecipient].sort();
    const chatId = `dm_${participants[0]}_${participants[1]}`;

    const chatRef = db.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();

    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!chatSnap.exists) {
      await chatRef.set({
        id: chatId,
        type: 'dm',
        participants: participants,
        created_at: now,
        updated_at: now,
        last_message: message || '[Attachment]',
        last_message_time: timeStr
      });
    } else {
      await chatRef.update({
        updated_at: now,
        last_message: message || '[Attachment]',
        last_message_time: timeStr
      });
    }

    // 5. Create real message document
    const messageId = 'msg_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const messagePayload: any = {
      id: messageId,
      chat_id: chatId,
      created_at: now,
      sender: botUsername,
      text: message || '',
      type: media_url ? 'image' : 'text',
      timestamp: timeStr,
      reactions: [],
      read_by: [botUsername]
    };

    if (media_url) {
      messagePayload.media_url = media_url;
    }

    await db.collection('messages').doc(messageId).set(messagePayload);

    console.log(`[Developer API] Bot @${botUsername} (${appName}) successfully sent message to @${cleanRecipient} in chat ${chatId}`);

    return res.status(200).json({
      success: true,
      message: "Message dispatched successfully",
      data: {
        message_id: messageId,
        chat_id: chatId,
        sender: botUsername,
        recipient: cleanRecipient,
        app_name: appName,
        timestamp: now
      }
    });

  } catch (err: any) {
    console.error("Error handling API message send:", err);
    return res.status(500).json({ error: 'Internal server error processing API request', details: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Bypass Vite middleware for /api routes
    app.use((req, res, next) => {
      if (req.url.startsWith('/api')) {
        return next();
      }
      return vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zenoa Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
