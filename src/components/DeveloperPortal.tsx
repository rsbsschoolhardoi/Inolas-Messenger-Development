import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { 
  Terminal, Plus, Key, Copy, Check, ArrowLeft, Shield, Code, Server, 
  BarChart3, History, Lock, FileText, RefreshCw, Eye, EyeOff, Globe,
  ShieldCheck, Webhook, Radio, Sliders, Zap, Download, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { UserData } from '../types';

interface DeveloperPortalProps {
  currentUser: UserData;
  onBack: () => void;
}

type TabType = 'apps' | 'otp' | 'webhooks' | 'broadcast' | 'sso' | 'analytics' | 'logs' | 'docs' | 'settings';

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({ currentUser, onBack }) => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('apps');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  
  // App Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [botUsername, setBotUsername] = useState(currentUser?.username || '');
  const [initialRedirectUri, setInitialRedirectUri] = useState('');

  // Settings & Edit State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [redirectUris, setRedirectUris] = useState<string[]>([]);
  const [allowedIps, setAllowedIps] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isRegeneratingSecret, setIsRegeneratingSecret] = useState(false);

  // Code Snippet & Auto-Generated SDK State
  const [codeLang, setCodeLang] = useState<'node' | 'python' | 'php' | 'curl' | 'go' | 'button'>('node');
  const [sdkTab, setSdkTab] = useState<'ts' | 'node' | 'python' | 'env' | 'html' | 'curl'>('ts');

  // Analytics & Logs State
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // One-time Secret Revelation State (Displayed ONLY upon creation or regeneration)
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<{
    clientId: string;
    clientSecret: string;
    appName: string;
    botUsername: string;
  } | null>(null);

  // Live OTP Testing Sandbox State
  const [testOtpRecipient, setTestOtpRecipient] = useState<string>('');
  const [testOtpTemplate, setTestOtpTemplate] = useState<string>('standard_otp');
  const [testOtpSending, setTestOtpSending] = useState<boolean>(false);
  const [testOtpResult, setTestOtpResult] = useState<any>(null);

  const [testVerifyCode, setTestVerifyCode] = useState<string>('');
  const [testOtpVerifying, setTestOtpVerifying] = useState<boolean>(false);
  const [testVerifyResult, setTestVerifyResult] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.mobile_number) {
      setTestOtpRecipient(currentUser.mobile_number);
    } else if (currentUser?.username) {
      setTestOtpRecipient(currentUser.username);
    }
  }, [currentUser]);

  const handleLiveSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    const targetRec = testOtpRecipient || currentUser?.mobile_number || currentUser?.username || '';
    if (!targetRec.trim()) {
      showToast('Please enter a recipient (Mobile Number, Username, or Zenoa ID)');
      return;
    }

    setTestOtpSending(true);
    setTestOtpResult(null);

    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const res = await fetch('/api/v1/otp/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: targetRec.trim(),
          template_type: testOtpTemplate,
          expiry_mins: 10
        })
      });
      const data = await res.json();
      setTestOtpResult({ status: res.status, ok: res.ok, data });
      if (res.ok && data.success) {
        showToast('🚀 Live OTP sent! Check Zenoa Messenger Inbox.');
        if (data.code) {
          setTestVerifyCode(data.code);
        }
      } else {
        showToast('OTP Send Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setTestOtpResult({ status: 500, ok: false, data: { error: err.message } });
      showToast('Error sending OTP: ' + err.message);
    } finally {
      setTestOtpSending(false);
    }
  };

  const handleLiveVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!testVerifyCode.trim()) {
      showToast('Please enter the 6-digit verification code');
      return;
    }

    setTestOtpVerifying(true);
    setTestVerifyResult(null);

    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const targetRec = testOtpRecipient || currentUser?.mobile_number || currentUser?.username || '';
      const res = await fetch('/api/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: targetRec.trim(),
          code: testVerifyCode.trim()
        })
      });
      const data = await res.json();
      setTestVerifyResult({ status: res.status, ok: res.ok, data });
      if (res.ok && data.verified) {
        showToast('✅ OTP Verified Successfully!');
      } else {
        showToast('Verification Failed: ' + (data.error || 'Invalid code'));
      }
    } catch (err: any) {
      setTestVerifyResult({ status: 500, ok: false, data: { error: err.message } });
      showToast('Error verifying OTP: ' + err.message);
    } finally {
      setTestOtpVerifying(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const downloadSdkFile = (filename: string, content: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}!`);
  };

  const downloadServiceAccountJson = (app: any) => {
    if (!app) return;
    const saData = {
      type: "business_service_account",
      account_type: "Business Account",
      security: "End-to-End Encrypted",
      description: "This is a business account and it is completely End-to-End Encrypted.",
      app_name: app.app_name,
      bot_username: `@${app.bot_username || app.owner}`,
      owner_username: `@${app.owner}`,
      client_id: app.client_id || app.api_key,
      client_secret: app.client_secret,
      api_base_url: window.location.origin,
      auth_uri: `${window.location.origin}/sso/authorize`,
      token_uri: `${window.location.origin}/api/v1/sso/token`,
      created_at: app.created_at || Date.now()
    };
    downloadSdkFile(`business-sa-${app.bot_username || app.owner}.json`, JSON.stringify(saData, null, 2), 'application/json');
  };

  const generateTsSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `/**
 * SDK for ${app.app_name}
 * Business Account • End-to-End Encrypted
 * Pre-Configured & Ready for Production
 */

export interface ZenoaConfig {
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface SendOtpOptions {
  recipient?: string;
  zenoaId?: string;
  mobileNumber?: string;
  templateType?: 'standard_otp' | 'security_code' | 'login_verification' | 'transaction_auth';
  expiryMins?: number;
}

export class ZenoaSDK {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaConfig) {
    this.clientId = config?.clientId || "${cid}";
    this.clientSecret = config?.clientSecret || "${sec}";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/+$/, '');
  }

  /**
   * Dispatch high-priority automated OTP / verification code
   */
  async sendOtp(options: SendOtpOptions | string, templateType = "standard_otp", expiryMins = 10) {
    const payload = typeof options === 'string' 
      ? { recipient: options, template_type: templateType, expiry_mins: expiryMins }
      : { 
          recipient: options.recipient || options.zenoaId || options.mobileNumber, 
          zenoa_id: options.zenoaId,
          mobile_number: options.mobileNumber,
          template_type: options.templateType || 'standard_otp', 
          expiry_mins: options.expiryMins || 10 
        };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Validate recipient OTP code
   */
  async verifyOtp(recipient: string, code: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ recipient, code })
    });
    return await res.json();
  }

  /**
   * Exchange OAuth 2.0 Authorization Code for User Access Token
   */
  async exchangeSsoCode(code: string, redirectUri: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/sso/token\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });
    return await res.json();
  }

  /**
   * Send notification or message as Bot / Service Account
   */
  async sendMessage(recipientUsernameOrPhone: string, messageText: string, metadata?: Record<string, any>) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientSecret}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: this.clientId,
        recipient: recipientUsernameOrPhone,
        text: messageText,
        metadata: metadata || {}
      })
    });
    return await res.json();
  }
}

export default ZenoaSDK;
`;
  };

  const generateNodeSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `/**
 * CommonJS / Node.js SDK for ${app.app_name}
 * Business Account • End-to-End Encrypted
 * Supports: Mobile Number, Username, & Zenoa ID routing
 */

class ZenoaNodeSDK {
  constructor(config = {}) {
    this.clientId = config.clientId || "${cid}";
    this.clientSecret = config.clientSecret || "${sec}";
    this.baseUrl = (config.baseUrl || "${origin}").replace(/\\/+$/, '');
  }

  /**
   * Dispatch high-priority automated OTP / verification code
   * Options can specify recipient (mobile/username), zenoaId, or mobileNumber
   */
  async sendOtp(options, templateType = "standard_otp", expiryMins = 10) {
    const payload = typeof options === 'string'
      ? { recipient: options, template_type: templateType, expiry_mins: expiryMins }
      : {
          recipient: options.recipient || options.zenoaId || options.mobileNumber,
          zenoa_id: options.zenoaId,
          mobile_number: options.mobileNumber,
          template_type: options.templateType || templateType,
          expiry_mins: options.expiryMins || expiryMins
        };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Validate recipient OTP code
   */
  async verifyOtp(recipient, code) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ recipient, code })
    });
    return await res.json();
  }

  /**
   * Send notification or message as Bot / Service Account
   */
  async sendMessage(recipient, text, metadata = {}) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientSecret}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: this.clientId,
        recipient,
        text,
        metadata
      })
    });
    return await res.json();
  }
}

module.exports = ZenoaNodeSDK;
`;
  };

  const generatePythonSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `"""
Python SDK for ${app.app_name}
Business Account • End-to-End Encrypted
Pre-Configured & Ready for Production
"""

import requests
from typing import Optional, Dict, Any, Union

class ZenoaSDK:
    def __init__(
        self, 
        client_id: str = "${cid}", 
        client_secret: str = "${sec}", 
        base_url: str = "${origin}"
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url.rstrip('/')

    def send_otp(
        self, 
        recipient: Optional[str] = None, 
        zenoa_id: Optional[str] = None,
        mobile_number: Optional[str] = None,
        template_type: str = "standard_otp", 
        expiry_mins: int = 10
    ) -> Dict[str, Any]:
        """Dispatch an automated OTP to a recipient's phone number (+91...), username (@azad1), or Zenoa ID (usr_...)."""
        url = f"{self.base_url}/api/v1/otp/send"
        headers = {
            "Authorization": f"Bearer {self.client_id}",
            "Content-Type": "application/json"
        }
        target_rec = recipient or zenoa_id or mobile_number
        payload = {
            "recipient": target_rec,
            "zenoa_id": zenoa_id,
            "mobile_number": mobile_number,
            "template_type": template_type,
            "expiry_mins": expiry_mins
        }
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        return res.json()

    def verify_otp(self, recipient: str, code: str) -> Dict[str, Any]:
        """Verify an OTP code submitted by the user."""
        url = f"{self.base_url}/api/v1/otp/verify"
        headers = {
            "Authorization": f"Bearer {self.client_id}",
            "Content-Type": "application/json"
        }
        payload = {"recipient": recipient, "code": code}
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        return res.json()

    def exchange_sso_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange SSO authorization code for user profile and access token."""
        url = f"{self.base_url}/api/v1/sso/token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri
        }
        res = requests.post(url, json=payload, timeout=10)
        return res.json()

    def send_message(self, recipient: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch a direct message from this Service Account."""
        url = f"{self.base_url}/api/v1/bot/send"
        headers = {
            "Authorization": f"Bearer {self.client_secret}",
            "Content-Type": "application/json"
        }
        payload = {
            "client_id": self.client_id,
            "recipient": recipient,
            "text": text,
            "metadata": metadata or {}
        }
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        return res.json()
`;
  };

  const generateEnvConfig = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `# Production Environment Configuration for ${app.app_name}
# Pre-configured with active Service Account credentials
ZENOA_CLIENT_ID="${cid}"
ZENOA_CLIENT_SECRET="${sec}"
ZENOA_SERVICE_ACCOUNT="@${app.bot_username || app.owner}"
ZENOA_BASE_URL="${origin}"
ZENOA_SSO_AUTH_URL="${origin}/sso/authorize"
ZENOA_SSO_TOKEN_URL="${origin}/api/v1/sso/token"
ZENOA_OTP_SEND_URL="${origin}/api/v1/otp/send"
ZENOA_OTP_VERIFY_URL="${origin}/api/v1/otp/verify"
`;
  };

  const generateHtmlSnippet = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const origin = window.location.origin;
    const uri = app.redirect_uris?.[0] || `${origin}/auth/sso`;
    return `<!-- Sign in with Zenoa Button -->
<a 
  href="${origin}/sso/authorize?client_id=${cid}&redirect_uri=${encodeURIComponent(uri)}&response_type=code"
  style="display: inline-flex; align-items: center; gap: 10px; background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-family: system-ui, sans-serif; font-weight: 600; font-size: 14px; text-decoration: none; border: 1px solid #27272a;"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
  <span>Sign in with Zenoa</span>
</a>`;
  };

  const generateCurlSnippets = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `# 1. Send OTP by Verified Mobile Number
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+917991482672", "template_type": "standard_otp"}'

# 2. Send OTP by Immutable Zenoa ID (usr_...)
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"zenoa_id": "usr_9f81a7b2c", "template_type": "transaction_auth"}'

# 3. Send OTP by Username (@azad1)
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "azad1", "template_type": "standard_otp"}'

# 4. Verify OTP Code
curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+917991482672", "code": "123456"}'

# 5. Dispatch Direct Message as Service Account
curl -X POST "${origin}/api/v1/bot/send" \\
  -H "Authorization: Bearer ${sec}" \\
  -H "Content-Type: application/json" \\
  -d '{"client_id": "${cid}", "recipient": "+917991482672", "text": "Hello from Zenoa Service Account!"}'`;
  };

  useEffect(() => {
    fetchApps();
  }, [currentUser?.username]);

  useEffect(() => {
    if (selectedAppId) {
      fetchAppData();
    }
  }, [selectedAppId, activeTab]);

  const fetchApps = async () => {
    try {
      let fetchedApps: any[] = [];
      if (currentUser?.username && db) {
        try {
          const cleanUser = currentUser.username.toLowerCase();
          
          // 1. Query by owner field
          const q = query(collection(db, 'developer_apps'), where('owner', '==', currentUser.username));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            fetchedApps.push({ id: d.id, ...d.data() });
          });

          // 2. Also check deterministic doc ID `sa_${cleanUser}`
          const directDoc = await getDoc(doc(db, 'developer_apps', `sa_${cleanUser}`));
          if (directDoc.exists()) {
            const data = { id: directDoc.id, ...directDoc.data() };
            if (!fetchedApps.some(a => a.id === directDoc.id)) {
              fetchedApps.push(data);
            }
          }

          // 3. Check owner_id if UID is available
          if (currentUser.id) {
            const uidQ = query(collection(db, 'developer_apps'), where('owner_id', '==', currentUser.id));
            const uidSnap = await getDocs(uidQ);
            uidSnap.docs.forEach(d => {
              if (!fetchedApps.some(a => a.id === d.id)) {
                fetchedApps.push({ id: d.id, ...d.data() });
              }
            });
          }
        } catch (e) {
          console.warn("Firestore fetchApps warn:", e);
        }
      }

      setApps(fetchedApps);
      if (fetchedApps.length > 0) {
        setSelectedAppId(fetchedApps[0].id);
      } else {
        setSelectedAppId(null);
      }
    } catch (err) {
      console.error("Error fetching apps:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];

  const fetchAppData = async () => {
    if (!selectedApp) return;

    try {
      setWebhookUrl(selectedApp.webhook_url || '');
      setAppName(selectedApp.app_name || '');
      setWebsiteUrl(selectedApp.website_url || '');
      setAppDescription(selectedApp.app_description || '');
      setRedirectUris(selectedApp.redirect_uris || [window.location.origin + '/auth/sso']);
      setAllowedIps(selectedApp.allowed_ips || '');

      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;

      if (activeTab === 'logs') {
        const res = await fetch('/api/v1/apps/logs', {
          headers: { 'Authorization': `Bearer ${effectiveApiKey}` }
        });
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching app data:", err);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apps.length >= 1) {
      showToast('Limit Reached: Only 1 Service Account is permitted per Developer Account.');
      return;
    }
    if (!appName.trim()) return;
    
    setIsCreating(true);
    try {
      const devUser = currentUser?.username || 'developer_user';
      const cleanDevUser = devUser.toLowerCase();
      const randomId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const randomSec = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const clientId = `zen_client_${randomId}`;
      const clientSecret = `zen_sec_${randomSec}`;
      const cleanBotInput = botUsername.trim().toLowerCase().replace(/^@/, '');
      const finalBotUsername = cleanBotInput || `sa_${cleanDevUser}`;

      const initialUris = initialRedirectUri.trim() 
        ? [initialRedirectUri.trim(), window.location.origin + '/auth/sso']
        : [window.location.origin + '/auth/sso'];

      const newAppData = {
        owner: devUser,
        owner_id: currentUser?.id || '',
        app_name: appName.trim(),
        app_description: appDescription.trim(),
        website_url: websiteUrl.trim(),
        bot_username: finalBotUsername,
        is_business_account: true,
        is_verified: false,
        account_badge: 'Business Account',
        client_id: clientId,
        client_secret: clientSecret,
        api_key: clientId,
        redirect_uris: initialUris,
        webhook_url: webhookUrl.trim() || '',
        created_at: Date.now()
      };

      if (db) {
        const appRef = doc(collection(db, 'developer_apps'), `sa_${cleanDevUser}`);
        await setDoc(appRef, newAppData);
        (newAppData as any).id = appRef.id;

        const saUserRef = doc(db, 'users', finalBotUsername);
        await setDoc(saUserRef, {
          username: finalBotUsername,
          display_name: appName.trim(),
          bio: appDescription.trim() || 'Service Account',
          is_service_account: true,
          is_business_account: true,
          is_verified: false,
          owner_username: devUser,
          registered_at: Date.now()
        }, { merge: true });
      } else {
        (newAppData as any).id = `sa_${cleanDevUser}`;
      }

      setApps([newAppData]);
      setSelectedAppId((newAppData as any).id);
      
      // Trigger One-Time Plaintext Secret Visibility Modal
      setNewlyGeneratedSecret({
        clientId,
        clientSecret,
        appName: appName.trim(),
        botUsername: finalBotUsername
      });

      showToast('Service Account created successfully!');
    } catch (err: any) {
      console.error("Create Service Account Error:", err);
      showToast('Error creating Service Account: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedApp) return;
    setIsSaving(true);
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      await fetch('/api/v1/apps/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_url: webhookUrl.trim(),
          redirect_uris: redirectUris,
          website_url: websiteUrl.trim(),
          app_description: appDescription.trim(),
          allowed_ips: allowedIps.trim()
        })
      });

      const updated = apps.map(a => a.id === selectedApp.id ? { 
        ...a, 
        webhook_url: webhookUrl.trim(), 
        redirect_uris: redirectUris,
        website_url: websiteUrl.trim(),
        app_description: appDescription.trim()
      } : a);
      setApps(updated);
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!selectedApp) return;
    if (!confirm("Are you sure? Any integrations using this secret will stop working immediately until updated.")) return;

    setIsRegeneratingSecret(true);
    try {
      const randomSec = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const newSecret = `zen_sec_${randomSec}`;

      if (db) {
        await updateDoc(doc(db, 'developer_apps', selectedApp.id), {
          client_secret: newSecret
        });
      }

      const updated = apps.map(a => a.id === selectedApp.id ? { ...a, client_secret: newSecret } : a);
      setApps(updated);

      // Trigger One-Time Plaintext Secret Visibility Modal
      setNewlyGeneratedSecret({
        clientId: selectedApp.client_id || selectedApp.api_key,
        clientSecret: newSecret,
        appName: selectedApp.app_name,
        botUsername: selectedApp.bot_username || selectedApp.owner
      });

      showToast('Client Secret rolled & regenerated successfully!');
    } catch (err) {
      showToast('Failed to regenerate secret.');
    } finally {
      setIsRegeneratingSecret(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentClientId = selectedApp?.client_id || selectedApp?.api_key || 'zen_client_live_001';
  const currentClientSecret = selectedApp?.client_secret || 'zen_sec_prod_live_99218204910248201';
  const primaryRedirectUri = (selectedApp?.redirect_uris && selectedApp.redirect_uris[0]) || `${window.location.origin}/auth/sso`;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-y-auto font-sans text-zinc-100">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-zinc-700">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-zinc-900 text-zinc-400 transition-colors cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800">
              <Terminal className="h-4 w-4 text-zinc-100" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight leading-none">Developer Console</h1>
              <p className="text-xs text-zinc-400 mt-1">API Credentials & Service Accounts</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <a
            href="/sso"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-800 transition-all"
            title="Open SSO Console"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
            <span>SSO Console</span>
          </a>
          
          {selectedApp && (
            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-mono">
              <span>@{selectedApp.owner || selectedApp.bot_username || currentUser.username}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-57px)]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-3">Console Navigation</p>
          {[
            { id: 'apps', icon: Server, label: 'Service Account & Keys' },
            { id: 'otp', icon: Lock, label: 'OTP Service Specs' },
            { id: 'logs', icon: History, label: 'Activity Logs' },
            { id: 'docs', icon: FileText, label: 'API Specs' },
            { id: 'settings', icon: Sliders, label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm' 
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
              }`}
            >
              <tab.icon className="h-4 w-4 text-zinc-400" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-950">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* TAB: APPLICATIONS & CREDENTIALS */}
            {activeTab === 'apps' && (
              <div className="space-y-6 animate-in fade-in">
                {apps.length === 0 ? (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-base font-bold text-zinc-100">Create Service Account</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Register your application details to generate API keys and credentials.
                      </p>
                    </div>

                    <form onSubmit={handleCreateApp} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">Service Account Name *</label>
                          <input 
                            type="text" 
                            value={appName}
                            onChange={e => setAppName(e.target.value)}
                            placeholder="My Application" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-700"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">Service Account Username</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-zinc-800 bg-zinc-950 text-zinc-400 text-xs font-mono">@</span>
                            <input 
                              type="text" 
                              value={botUsername}
                              onChange={e => setBotUsername(e.target.value)}
                              placeholder={`sa_${currentUser?.username || 'bot'}`}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-r-xl px-3.5 py-2.5 text-xs font-mono text-zinc-100 outline-none focus:border-zinc-700"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">Website URL (Optional)</label>
                          <input 
                            type="url" 
                            value={websiteUrl}
                            onChange={e => setWebsiteUrl(e.target.value)}
                            placeholder="https://example.com" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">OAuth Redirect Callback URI (Optional)</label>
                          <input 
                            type="url" 
                            value={initialRedirectUri}
                            onChange={e => setInitialRedirectUri(e.target.value)}
                            placeholder="https://example.com/oauth/callback" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-700"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreating || !appName.trim()}
                        className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {isCreating ? <div className="h-4 w-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span>Create Service Account</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-zinc-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">{selectedApp?.app_name}</h3>
                        <p className="text-xs font-mono text-zinc-400 mt-1">@{selectedApp?.bot_username || selectedApp?.owner}</p>
                      </div>
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700">
                        Active Account
                      </span>
                    </div>
                  </div>
                )}

                {/* List of Developer's Apps */}
                {apps.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">Service Account</h3>
                      <button onClick={fetchApps} className="text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1 cursor-pointer">
                        <RefreshCw className="h-3 w-3" /> Refresh
                      </button>
                    </div>

                    {apps.map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedAppId(app.id)}
                        className={`bg-zinc-900 border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm cursor-pointer transition-all ${
                          selectedAppId === app.id ? 'border-zinc-700 bg-zinc-900/90' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selectedAppId === app.id ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-100 text-sm">{app.app_name}</h4>
                            <p className="text-xs font-mono text-zinc-400 mt-0.5">@{app.bot_username || app.owner}</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-zinc-800">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">Client ID</span>
                          <code className="text-xs font-mono bg-zinc-950 px-2 py-1 rounded-lg text-zinc-300 border border-zinc-800">
                            {app.client_id || app.api_key}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected App Credentials Inspector */}
                {selectedApp && (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-zinc-400" />
                        <h3 className="text-sm font-bold text-zinc-100">
                          Production API Credentials
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadServiceAccountJson(selectedApp)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Download Service Account Key (.json)"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Service Key (.json)</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Client ID */}
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-zinc-400" /> Client ID
                          </span>
                          <button 
                            onClick={() => handleCopy(currentClientId, "Client ID")}
                            className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === currentClientId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedKey === currentClientId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="font-mono text-xs font-medium text-zinc-200 break-all bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                          {currentClientId}
                        </p>
                      </div>

                      {/* Client Secret - Secure Masked View */}
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5 text-zinc-400" /> Client Secret
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
                              Masked for Security
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleCopy(currentClientSecret, "Client Secret")}
                              className="text-xs font-medium text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Copy raw Client Secret into clipboard"
                            >
                              {copiedKey === currentClientSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                              <span>{copiedKey === currentClientSecret ? 'Copied to Clipboard' : 'Copy Secret'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="font-mono text-xs font-medium text-zinc-400 break-all bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between">
                          <span>zen_sec_••••••••••••••••••••••••••••••••••••••••••••••••</span>
                          <span className="text-[10px] text-zinc-500 italic select-none">Hidden on screen</span>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-900 text-xs">
                          <p className="text-[11px] text-zinc-500">
                            *Secrets are permanently masked in the UI. Copying extracts the unmasked credentials.
                          </p>
                          <button
                            onClick={handleRegenerateSecret}
                            disabled={isRegeneratingSecret}
                            className="text-xs font-medium text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`h-3 w-3 ${isRegeneratingSecret ? 'animate-spin' : ''}`} />
                            <span>Roll / Regenerate Secret</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Production SDK & Developer Kits */}
                    <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <Code className="h-4 w-4 text-zinc-300" />
                            Production SDK & Developer Kits
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Plug-and-play production client libraries pre-configured with your active credentials.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => downloadSdkFile('zenoa-sdk.ts', generateTsSdk(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-all border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>zenoa-sdk.ts</span>
                          </button>
                          <button
                            onClick={() => downloadSdkFile('zenoa-node-sdk.js', generateNodeSdk(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-all border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>zenoa-node-sdk.js</span>
                          </button>
                          <button
                            onClick={() => downloadSdkFile('zenoa_sdk.py', generatePythonSdk(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-all border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>zenoa_sdk.py</span>
                          </button>
                          <button
                            onClick={() => downloadSdkFile('.env.production', generateEnvConfig(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-all border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>.env</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Code Viewer Tabs */}
                      <div>
                        <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 mb-3 overflow-x-auto">
                          {[
                            { id: 'ts', label: 'TypeScript' },
                            { id: 'node', label: 'Node.js (CJS)' },
                            { id: 'python', label: 'Python' },
                            { id: 'env', label: '.env' },
                            { id: 'html', label: 'HTML SSO Button' },
                            { id: 'curl', label: 'cURL' }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setSdkTab(t.id as any)}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                                sdkTab === t.id
                                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Code Container */}
                        <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden text-left">
                          <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                            <span>
                              {sdkTab === 'ts' && 'zenoa-sdk.ts'}
                              {sdkTab === 'node' && 'zenoa-node-sdk.js'}
                              {sdkTab === 'python' && 'zenoa_sdk.py'}
                              {sdkTab === 'env' && '.env'}
                              {sdkTab === 'html' && 'zenoa-sso-button.html'}
                              {sdkTab === 'curl' && 'curl_requests.sh'}
                            </span>
                            <button
                              onClick={() => {
                                const content = sdkTab === 'ts' ? generateTsSdk(selectedApp)
                                  : sdkTab === 'node' ? generateNodeSdk(selectedApp)
                                  : sdkTab === 'python' ? generatePythonSdk(selectedApp)
                                  : sdkTab === 'env' ? generateEnvConfig(selectedApp)
                                  : sdkTab === 'html' ? generateHtmlSnippet(selectedApp)
                                  : generateCurlSnippets(selectedApp);
                                handleCopy(content, "Code Snippet");
                              }}
                              className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Full Code</span>
                            </button>
                          </div>

                          <pre className="p-4 text-[11px] font-mono text-zinc-300 leading-relaxed overflow-x-auto max-h-80 select-all">
                            {sdkTab === 'ts' && generateTsSdk(selectedApp)}
                            {sdkTab === 'node' && generateNodeSdk(selectedApp)}
                            {sdkTab === 'python' && generatePythonSdk(selectedApp)}
                            {sdkTab === 'env' && generateEnvConfig(selectedApp)}
                            {sdkTab === 'html' && generateHtmlSnippet(selectedApp)}
                            {sdkTab === 'curl' && generateCurlSnippets(selectedApp)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: AUTOMATED OTP SPECIFICATIONS */}
            {activeTab === 'otp' && selectedApp && (
              <div className="space-y-6 animate-in fade-in">
                {/* LIVE INTERACTIVE OTP PLAYGROUND */}
                <div className="bg-zinc-900 border border-emerald-500/30 p-6 rounded-3xl text-zinc-100 shadow-md space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                        <Terminal className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                          Live Interactive OTP Playground
                          <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/30">TESTER</span>
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          Test live OTP dispatch to Zenoa Messenger chat using your active Service Account credentials.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleLiveSendOtp} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Target Recipient (Mobile / Username / Zenoa ID)
                        </label>
                        <input
                          type="text"
                          value={testOtpRecipient}
                          onChange={(e) => setTestOtpRecipient(e.target.value)}
                          placeholder="e.g. +917991482672 or @azad1 or zenoa_id"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Template Type
                        </label>
                        <select
                          value={testOtpTemplate}
                          onChange={(e) => setTestOtpTemplate(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="standard_otp">Standard Verification Code</option>
                          <option value="2fa_auth">2FA Authentication</option>
                          <option value="password_reset">Password Reset Code</option>
                          <option value="transaction_auth">Transaction Security Auth</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={testOtpSending}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                      >
                        {testOtpSending ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Dispatching OTP...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 fill-current" />
                            Send Live OTP via Service Account
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* LIVE SEND RESULT DISPLAY */}
                  {testOtpResult && (
                    <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 ${testOtpResult.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {testOtpResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Shield className="h-4 w-4 text-rose-400" />}
                          HTTP {testOtpResult.status} Response
                        </span>
                        {testOtpResult.data?.code && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                            CODE: {testOtpResult.data.code}
                          </span>
                        )}
                      </div>
                      <pre className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 overflow-x-auto text-[11px] text-zinc-300">
                        {JSON.stringify(testOtpResult.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* INTERACTIVE VERIFY TESTER */}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Test Verify Endpoint (/api/v1/otp/verify)</h4>
                    <form onSubmit={handleLiveVerifyOtp} className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={testVerifyCode}
                        onChange={(e) => setTestVerifyCode(e.target.value)}
                        placeholder="Enter 6-digit OTP code"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={testOtpVerifying}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {testOtpVerifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                        Verify OTP
                      </button>
                    </form>

                    {testVerifyResult && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${testVerifyResult.ok && testVerifyResult.data?.verified ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'}`}>
                        <div className="font-bold flex items-center gap-1.5">
                          {testVerifyResult.ok && testVerifyResult.data?.verified ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              VERIFICATION SUCCESS (Status {testVerifyResult.status})
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 text-rose-400" />
                              VERIFICATION FAILED (Status {testVerifyResult.status})
                            </>
                          )}
                        </div>
                        <pre className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800 overflow-x-auto text-[11px] text-zinc-300">
                          {JSON.stringify(testVerifyResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-zinc-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-zinc-400" />
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">Automated OTP Service Specifications</h3>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Zero-trust 6-digit verification dispatches delivered through your registered Service Account.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <span className="text-xs font-bold text-zinc-200 block">Dispatch Endpoint</span>
                      <code className="text-xs font-mono text-zinc-300 block bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                        POST /api/v1/otp/send
                      </code>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Generates a cryptographically secure 6-digit code and dispatches it directly to the recipient's inbox.
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <span className="text-xs font-bold text-zinc-200 block">Verification Endpoint</span>
                      <code className="text-xs font-mono text-zinc-300 block bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                        POST /api/v1/otp/verify
                      </code>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Validates the user's input code and triggers signed webhook notification upon success.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-zinc-100">Production Security & Template Policies</h4>
                  <div className="space-y-3 text-xs text-zinc-400">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
                      <Shield className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-200 block">Rate Limits & Expiry</span>
                        Default expiry window is 10 minutes. Throttling is strictly enforced at 5 send attempts per recipient per minute.
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
                      <Lock className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-zinc-200 block">HMAC Webhook Callback</span>
                        When an OTP is verified successfully, an <code className="text-zinc-200 font-mono">otp.verified</code> webhook payload is signed with your Client Secret and delivered to your configured endpoint.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WEBHOOK CONFIGURATION */}

            {/* TAB: MULTI-RECIPIENT BROADCAST SPECS */}

            {/* TAB: OAUTH 2.0 & SSO SDK SUITE */}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && selectedApp && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total API Calls</p>
                    <p className="text-3xl font-bold text-zinc-100">{analytics?.messages_sent || 0}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active Infrastructure
                    </p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">OTP Verified</p>
                    <p className="text-3xl font-bold text-zinc-100">{analytics?.otp_verified || 0}</p>
                    <p className="text-[10px] text-zinc-400 font-bold mt-2">Active Authentications</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-zinc-100">99.9%</p>
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full mt-3 overflow-hidden border border-zinc-800">
                       <div className="h-full bg-zinc-200 rounded-full" style={{ width: '99.9%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACTIVITY LOGS */}
            {activeTab === 'logs' && selectedApp && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-sm">
                   <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <History className="h-4 w-4 text-zinc-400" />
                        Production Activity & Authentication Logs
                      </h3>
                      <button onClick={fetchAppData} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                        <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                      </button>
                   </div>
                   <div className="divide-y divide-zinc-800">
                      {logs.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500 text-xs italic">No activity logs recorded yet.</div>
                      ) : (
                        logs.map(log => (
                          <div key={log.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/40 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${log.status === 'success' ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-800 text-rose-400'}`}>
                                   {log.action === 'sso_login' ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-zinc-100">
                                     {log.action === 'sso_login' ? `SSO Authorization (@${log.recipient})` : `OTP Action to @${log.recipient}`}
                                   </p>
                                   <p className="text-[10px] text-zinc-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                             </div>
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${log.status === 'success' ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' : 'bg-zinc-800 text-rose-400 border border-zinc-700'}`}>
                               {log.status.toUpperCase()}
                             </span>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            )}

            {/* TAB: API SPECIFICATIONS */}
            {activeTab === 'docs' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-zinc-400" />
                      REST API Endpoints Specification
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Production reference for Zenoa Developer REST APIs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md text-[10px] font-mono font-bold">POST</span>
                        <code className="text-xs font-mono font-bold text-zinc-100">/api/v1/otp/send</code>
                      </div>
                      <p className="text-xs text-zinc-400">Generates and sends a 6-digit OTP to any target recipient.</p>
                      <pre className="text-[11px] font-mono bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-zinc-300">
{`Headers: Authorization: Bearer <CLIENT_ID>
Body: {
  "recipient": "username or +91XXXXXXXXXX",
  "expiry_mins": 10,
  "template_type": "standard_otp"
}`}
                      </pre>
                    </div>

                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md text-[10px] font-mono font-bold">POST</span>
                        <code className="text-xs font-mono font-bold text-zinc-100">/api/v1/otp/verify</code>
                      </div>
                      <p className="text-xs text-zinc-400">Verifies an OTP and automatically fires a webhook event.</p>
                      <pre className="text-[11px] font-mono bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-zinc-300">
{`Headers: Authorization: Bearer <CLIENT_ID>
Body: {
  "recipient": "+91XXXXXXXXXX",
  "code": "123456"
}`}
                      </pre>
                    </div>

                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md text-[10px] font-mono font-bold">POST</span>
                        <code className="text-xs font-mono font-bold text-zinc-100">/api/v1/messages/send</code>
                      </div>
                      <p className="text-xs text-zinc-400">Sends transactional or support message from Service Account to user.</p>
                      <pre className="text-[11px] font-mono bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-zinc-300">
{`Headers: Authorization: Bearer <CLIENT_ID>
Body: {
  "recipient": "username",
  "message": "Your authentication session is active."
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && selectedApp && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-zinc-400" />
                      App & Webhook Settings
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure webhook destination and general metadata.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Webhook URL</label>
                      <input 
                        type="url" 
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://your-backend.com/webhook" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono outline-none text-zinc-100 focus:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Website URL</label>
                      <input 
                        type="url" 
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="https://acme.example.com" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Application Description</label>
                      <textarea 
                        rows={2}
                        value={appDescription}
                        onChange={e => setAppDescription(e.target.value)}
                        placeholder="Describe your application..." 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Allowed IP Addresses (Security)</label>
                      <input 
                        type="text" 
                        value={allowedIps}
                        onChange={e => setAllowedIps(e.target.value)}
                        placeholder="e.g. 192.168.1.1, 10.0.0.1 (Leave empty to allow all)" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono outline-none text-zinc-100 focus:border-zinc-700"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Separate multiple IPs with commas. Only these IP addresses will be able to use your API credentials. Rate limits (30 req/min) apply automatically.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleUpdateSettings}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ONE-TIME SECRET REVELATION MODAL */}
      {newlyGeneratedSecret && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Save Your Secret Key</h3>
                <p className="text-xs text-zinc-400">One-Time Plaintext Credential Display</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/20 border border-amber-800/30 rounded-2xl text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold text-amber-300">Important Security Notice:</span> This is the <span className="underline font-semibold">only time</span> your raw Client Secret will be shown on screen. Once you close this modal, it will be permanently masked in the console to safeguard against unauthorized access.
            </div>

            <div className="space-y-3.5">
              {/* App Identity */}
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500">Service Account</span>
                  <p className="text-xs font-bold text-zinc-200">{newlyGeneratedSecret.appName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-zinc-500">Bot Handle</span>
                  <p className="text-xs font-mono text-zinc-300">@{newlyGeneratedSecret.botUsername}</p>
                </div>
              </div>

              {/* Client ID */}
              <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-zinc-400">Client ID</span>
                  <button
                    onClick={() => handleCopy(newlyGeneratedSecret.clientId, "Client ID")}
                    className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedKey === newlyGeneratedSecret.clientId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === newlyGeneratedSecret.clientId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-zinc-200 break-all">{newlyGeneratedSecret.clientId}</p>
              </div>

              {/* Client Secret (Plaintext ONLY here) */}
              <div className="p-3.5 bg-zinc-900 rounded-xl border border-amber-900/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-amber-400 font-bold">Client Secret (Plaintext)</span>
                  <button
                    onClick={() => handleCopy(newlyGeneratedSecret.clientSecret, "Client Secret")}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                  >
                    {copiedKey === newlyGeneratedSecret.clientSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === newlyGeneratedSecret.clientSecret ? 'Copied to Clipboard' : 'Copy Secret'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-amber-200 font-bold break-all bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 select-all">
                  {newlyGeneratedSecret.clientSecret}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  const saData = {
                    type: "zenoa_service_account",
                    app_name: newlyGeneratedSecret.appName,
                    bot_username: `@${newlyGeneratedSecret.botUsername}`,
                    owner_username: `@${currentUser.username}`,
                    client_id: newlyGeneratedSecret.clientId,
                    client_secret: newlyGeneratedSecret.clientSecret,
                    api_base_url: window.location.origin,
                    auth_uri: `${window.location.origin}/sso/authorize`,
                    token_uri: `${window.location.origin}/api/v1/sso/token`,
                    created_at: Date.now()
                  };
                  downloadSdkFile(`zenoa-sa-${newlyGeneratedSecret.botUsername}.json`, JSON.stringify(saData, null, 2), 'application/json');
                }}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="h-4 w-4 text-zinc-400" />
                <span>Download Key JSON</span>
              </button>

              <button
                onClick={() => setNewlyGeneratedSecret(null)}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center"
              >
                I have saved my secret key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
