import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { 
  Terminal, Plus, Key, Copy, Check, ArrowLeft, Bot, Shield, Code, Server, 
  BarChart3, History, Lock, FileText, ExternalLink, Activity, ArrowRight, 
  RefreshCw, Eye, EyeOff, Globe, Link2, Sparkles, AlertCircle, PlayCircle,
  Layers, CheckCircle2, ShieldCheck, Cpu, Database, Send, Webhook, Radio,
  MessageSquare, Sliders, CheckSquare, Zap, Clock, Smartphone, MessageCircle, AlertTriangle,
  Download, Package, FileCode
} from 'lucide-react';
import { UserData } from '../types';

interface DeveloperPortalProps {
  currentUser: UserData;
  onBack: () => void;
}

type TabType = 'apps' | 'otp' | 'bot' | 'webhooks' | 'broadcast' | 'sso' | 'analytics' | 'logs' | 'docs' | 'settings';

interface BotRule {
  id: string;
  trigger: string;
  action: 'reply' | 'send_otp' | 'forward_webhook';
  response: string;
  enabled: boolean;
}

interface ActiveOtpItem {
  key: string;
  recipient: string;
  code: string;
  created_at: number;
  expires_at: number;
  status: string;
  remaining_seconds: number;
}

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
  const [newRedirectUri, setNewRedirectUri] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isRegeneratingSecret, setIsRegeneratingSecret] = useState(false);
  
  // Automated OTP Engine State
  const [otpRecipient, setOtpRecipient] = useState('demo_zenoa_user');
  const [otpExpiryMins, setOtpExpiryMins] = useState(10);
  const [selectedTemplateType, setSelectedTemplateType] = useState('standard_otp');
  const [otpCodeToVerify, setOtpCodeToVerify] = useState('');
  const [activeOtps, setActiveOtps] = useState<ActiveOtpItem[]>([]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpActionFeedback, setOtpActionFeedback] = useState<any>(null);

  // Bot Automation & Rules State
  const [botRules, setBotRules] = useState<BotRule[]>([
    { id: '1', trigger: '/start', action: 'reply', response: 'Welcome. I am your automated verified assistant. Type /otp to verify or /help for commands.', enabled: true },
    { id: '2', trigger: '/otp', action: 'send_otp', response: 'Initiating secure one-time verification code request...', enabled: true },
    { id: '3', trigger: '/help', action: 'reply', response: 'Available Commands:\n- /start - Begin conversation\n- /otp - Request authentication OTP\n- /status - Check service health\n- /help - Command index', enabled: true },
    { id: '4', trigger: 'hi', action: 'reply', response: 'Hello. How can I assist your account today?', enabled: true }
  ]);
  const [newRuleTrigger, setNewRuleTrigger] = useState('');
  const [newRuleResponse, setNewRuleResponse] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'reply' | 'send_otp' | 'forward_webhook'>('reply');
  const [isSavingRules, setIsSavingRules] = useState(false);


  // Broadcast Messaging State
  const [broadcastRecipients, setBroadcastRecipients] = useState('user1, user2, user3');
  const [broadcastMessage, setBroadcastMessage] = useState('Important system notice: Platform maintenance update.');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);
  
  // Code Snippet & Auto-Generated SDK State
  const [codeLang, setCodeLang] = useState<'node' | 'python' | 'php' | 'curl' | 'go' | 'button'>('node');
  const [sdkTab, setSdkTab] = useState<'ts' | 'python' | 'env' | 'html' | 'curl'>('ts');

  // Analytics & Logs State
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

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
    showToast(`Downloaded auto-generated ${filename}!`);
  };

  const generateTsSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_sandbox';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `/**
 * Auto-Generated Zenoa SDK for ${app.app_name}
 * Client ID: ${cid}
 * Environment: ${origin}
 */

export interface ZenoaConfig {
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export class ZenoaSDK {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor(config?: ZenoaConfig) {
    this.clientId = config?.clientId || "${cid}";
    this.clientSecret = config?.clientSecret || "${sec}";
    this.baseUrl = config?.baseUrl || "${origin}";
  }

  /**
   * Send 6-digit OTP to user inbox or mobile number
   */
  async sendOtp(recipient: string, templateType = "standard_otp", expiryMins = 10) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ recipient, template_type: templateType, expiry_mins: expiryMins })
    });
    return await res.json();
  }

  /**
   * Verify 6-digit OTP code entered by recipient
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
   * Exchange OAuth 2.0 Authorization Code for User Profile
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
   * Get OAuth 2.0 Authorization Link for Sign in with Zenoa
   */
  getSsoAuthorizeUrl(redirectUri: string, state = "") {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email phone",
      state
    });
    return \`\${this.baseUrl}/sso/authorize?\${params.toString()}\`;
  }
}

export default ZenoaSDK;
`;
  };

  const generatePythonSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_sandbox';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `# Auto-Generated Zenoa SDK for ${app.app_name}
# Client ID: ${cid}

import requests

class ZenoaSDK:
    def __init__(self, client_id="${cid}", client_secret="${sec}", base_url="${origin}"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url

    def send_otp(self, recipient: str, template_type: str = "standard_otp", expiry_mins: int = 10):
        url = f"{self.base_url}/api/v1/otp/send"
        headers = {
            "Authorization": f"Bearer {self.client_id}",
            "Content-Type": "application/json"
        }
        payload = {
            "recipient": recipient,
            "template_type": template_type,
            "expiry_mins": expiry_mins
        }
        res = requests.post(url, json=payload, headers=headers)
        return res.json()

    def verify_otp(self, recipient: str, code: str):
        url = f"{self.base_url}/api/v1/otp/verify"
        headers = {
            "Authorization": f"Bearer {self.client_id}",
            "Content-Type": "application/json"
        }
        res = requests.post(url, json={"recipient": recipient, "code": code}, headers=headers)
        return res.json()

    def exchange_sso_code(self, code: str, redirect_uri: str):
        url = f"{self.base_url}/api/v1/sso/token"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": redirect_uri
        }
        res = requests.post(url, json=payload)
        return res.json()

    def get_sso_authorize_url(self, redirect_uri: str, state: str = ""):
        return f"{self.base_url}/sso/authorize?client_id={self.client_id}&redirect_uri={redirect_uri}&response_type=code&scope=profile+email+phone&state={state}"
`;
  };

  const generateEnvConfig = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_sandbox';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `# Auto-Generated Environment Variables for ${app.app_name}
ZENOA_CLIENT_ID="${cid}"
ZENOA_CLIENT_SECRET="${sec}"
ZENOA_BOT_USERNAME="${app.bot_username || 'zenoa_assistant_bot'}"
ZENOA_BASE_URL="${origin}"
`;
  };

  const generateHtmlSnippet = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_sandbox';
    const origin = window.location.origin;
    const uri = app.redirect_uris?.[0] || `${origin}/auth/sso`;
    return `<!-- Sign in with Zenoa SSO Button for ${app.app_name} -->
<a 
  href="${origin}/sso/authorize?client_id=${cid}&redirect_uri=${encodeURIComponent(uri)}&response_type=code"
  style="display: inline-flex; align-items: center; gap: 10px; background-color: #6d28d9; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-family: system-ui, -apple-system, sans-serif; font-weight: 600; font-size: 14px; text-decoration: none; border: none; cursor: pointer;"
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
    const cid = app.client_id || app.api_key || 'zen_client_sandbox';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    const uri = app.redirect_uris?.[0] || `${origin}/auth/sso`;
    return `# 1. Send OTP Request
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+91XXXXXXXXXX",
    "template_type": "standard_otp",
    "expiry_mins": 10
  }'

# 2. Verify OTP Request
curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+91XXXXXXXXXX",
    "code": "123456"
  }'

# 3. Exchange OAuth SSO Code for User Profile & Tokens
curl -X POST "${origin}/api/v1/sso/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${cid}",
    "client_secret": "${sec}",
    "code": "AUTH_CODE_FROM_CALLBACK",
    "redirect_uri": "${uri}"
  }'`;
  };

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchAppData();
      fetchActiveOtps();
      fetchBotRules();
    }
  }, [selectedAppId, activeTab]);

  const fetchApps = async () => {
    try {
      let fetchedApps: any[] = [];
      if (currentUser?.username && db) {
        try {
          const q = query(collection(db, 'developer_apps'), where('owner', '==', currentUser.username));
          const snap = await getDocs(q);
          fetchedApps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("Firestore fetchApps warn:", e);
        }
      }

      setApps(fetchedApps);
      if (fetchedApps.length > 0 && !selectedAppId) {
        setSelectedAppId(fetchedApps[0].id);
      } else if (fetchedApps.length === 0) {
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

      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;

      if (activeTab === 'analytics') {
        const res = await fetch('/api/v1/apps/analytics', {
          headers: { 'Authorization': `Bearer ${effectiveApiKey}` }
        });
        const data = await res.json();
        setAnalytics(data.data);
      } else if (activeTab === 'logs') {
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

  const fetchActiveOtps = async () => {
    if (!selectedApp) return;
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const res = await fetch('/api/v1/otp/active', {
        headers: { 'Authorization': `Bearer ${effectiveApiKey}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.otps)) {
        setActiveOtps(data.otps);
      }
    } catch (err) {
      console.warn("Active OTP fetch warn:", err);
    }
  };

  const fetchBotRules = async () => {
    if (!selectedApp) return;
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const res = await fetch('/api/v1/bot/rules', {
        headers: { 'Authorization': `Bearer ${effectiveApiKey}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.rules)) {
        setBotRules(data.rules);
      }
    } catch (err) {
      console.warn("Bot rules fetch warn:", err);
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
      const randomId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const randomSec = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const clientId = `zen_client_${randomId}`;
      const clientSecret = `zen_sec_${randomSec}`;
      const cleanBotInput = botUsername.trim().toLowerCase().replace(/^@/, '');
      const finalBotUsername = cleanBotInput || `sa_${devUser}`;

      const initialUris = initialRedirectUri.trim() 
        ? [initialRedirectUri.trim(), window.location.origin + '/auth/sso']
        : [window.location.origin + '/auth/sso', 'https://example.com/callback'];

      const newAppData = {
        owner: devUser,
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
        const appRef = doc(collection(db, 'developer_apps'), `sa_${devUser}`);
        await setDoc(appRef, newAppData);
        (newAppData as any).id = appRef.id;

        // Register Service Account in 'users' collection so it can be messaged in Zenoa Messenger
        const saUserRef = doc(db, 'users', finalBotUsername);
        await setDoc(saUserRef, {
          username: finalBotUsername,
          display_name: appName.trim(),
          bio: appDescription.trim() || 'Business Account',
          is_service_account: true,
          is_business_account: true,
          is_verified: false,
          owner_username: devUser,
          registered_at: Date.now()
        }, { merge: true });
      } else {
        (newAppData as any).id = `sa_${devUser}`;
      }

      setApps([newAppData]);
      setSelectedAppId((newAppData as any).id);
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
          app_description: appDescription.trim()
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
    if (!confirm("Are you sure? Any integrations using this secret will stop working immediately.")) return;

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
      showToast('Client Secret rolled & regenerated successfully!');
    } catch (err) {
      showToast('Failed to regenerate secret.');
    } finally {
      setIsRegeneratingSecret(false);
    }
  };


  // Manual Trigger OTP
  const handleSendOtp = async () => {
    if (!selectedApp || !otpRecipient) return;
    setIsSendingOtp(true);
    setOtpActionFeedback(null);
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const res = await fetch('/api/v1/otp/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: otpRecipient.trim(),
          template_type: selectedTemplateType,
          expiry_mins: otpExpiryMins
        })
      });
      const data = await res.json();
      setOtpActionFeedback({ type: 'send', status: res.status, data });
      if (data.sample_code) {
        setOtpCodeToVerify(data.sample_code);
      }
      if (res.status === 200) {
        showToast('OTP code dispatched via bot DM!');
        fetchActiveOtps();
      }
    } catch (err: any) {
      setOtpActionFeedback({ type: 'send', status: 500, data: { error: err.message } });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Manual Verify OTP
  const handleVerifyOtp = async (codeToUse?: string) => {
    if (!selectedApp || !otpRecipient) return;
    const code = codeToUse || otpCodeToVerify;
    if (!code) return;

    setIsVerifyingOtp(true);
    setOtpActionFeedback(null);
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const res = await fetch('/api/v1/otp/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: otpRecipient.trim(),
          code: code.trim()
        })
      });
      const data = await res.json();
      setOtpActionFeedback({ type: 'verify', status: res.status, data });
      if (res.status === 200) {
        showToast('✅ OTP verified successfully!');
        fetchActiveOtps();
        fetchAppData();
      }
    } catch (err: any) {
      setOtpActionFeedback({ type: 'verify', status: 500, data: { error: err.message } });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Bot Auto-Responder Rule Management
  const handleAddBotRule = () => {
    if (!newRuleTrigger.trim() || !newRuleResponse.trim()) return;
    const newRule: BotRule = {
      id: `rule_${Date.now()}`,
      trigger: newRuleTrigger.trim(),
      action: newRuleAction,
      response: newRuleResponse.trim(),
      enabled: true
    };
    const updated = [...botRules, newRule];
    setBotRules(updated);
    setNewRuleTrigger('');
    setNewRuleResponse('');
    saveBotRules(updated);
  };

  const handleToggleBotRule = (ruleId: string) => {
    const updated = botRules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r);
    setBotRules(updated);
    saveBotRules(updated);
  };

  const handleDeleteBotRule = (ruleId: string) => {
    const updated = botRules.filter(r => r.id !== ruleId);
    setBotRules(updated);
    saveBotRules(updated);
  };

  const saveBotRules = async (rulesToSave: BotRule[]) => {
    if (!selectedApp) return;
    setIsSavingRules(true);
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      await fetch('/api/v1/bot/rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rules: rulesToSave })
      });
      showToast('Bot automation rules saved!');
    } catch (err) {
      console.warn("Failed saving rules:", err);
    } finally {
      setIsSavingRules(false);
    }
  };


  // Broadcast Dispatcher
  const handleBroadcast = async () => {
    if (!selectedApp || !broadcastRecipients || !broadcastMessage) return;
    setIsBroadcasting(true);
    setBroadcastResult(null);
    try {
      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      const recipientsArray = broadcastRecipients.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/v1/bot/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients: recipientsArray,
          message: broadcastMessage.trim()
        })
      });
      const data = await res.json();
      setBroadcastResult(data);
      if (data.success) {
        showToast(`Broadcast delivered to ${data.total_sent} recipients!`);
        fetchAppData();
      }
    } catch (err: any) {
      setBroadcastResult({ success: false, error: err.message });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentClientId = selectedApp?.client_id || selectedApp?.api_key || 'zen_client_sandbox_882910';
  const currentClientSecret = selectedApp?.client_secret || 'zen_sec_prod_live_99218204910248201';
  const primaryRedirectUri = (selectedApp?.redirect_uris && selectedApp.redirect_uris[0]) || `${window.location.origin}/auth/sso`;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0f19] overflow-y-auto font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-800 p-2 rounded-xl border border-zinc-700">
              <Terminal className="h-4 w-4 text-zinc-200" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight leading-none">Developer Console</h1>
              <p className="text-xs text-zinc-400 mt-1">API Keys & Service Accounts</p>
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
        <div className="w-full md:w-64 border-r border-zinc-800/80 bg-zinc-950 p-4 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-3">Console Navigation</p>
          {[
            { id: 'apps', icon: Server, label: 'Service Account & Keys' },
            { id: 'otp', icon: Lock, label: 'OTP Automation' },
            { id: 'bot', icon: ShieldCheck, label: 'Auto-Responders' },
            { id: 'webhooks', icon: Webhook, label: 'Webhooks' },
            { id: 'broadcast', icon: Radio, label: 'Broadcasting' },
            { id: 'sso', icon: ShieldCheck, label: 'OAuth 2.0 / SSO' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'logs', icon: History, label: 'Activity Logs' },
            { id: 'docs', icon: FileText, label: 'API Specs' },
            { id: 'settings', icon: Sliders, label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
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
                {/* Active Service Account & Creation Card */}
                {apps.length === 0 ? (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-zinc-100">Create Service Account</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Enter your application details to generate API keys and credentials.
                      </p>
                    </div>

                    <form onSubmit={handleCreateApp} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Service Account Name *</label>
                          <input 
                            type="text" 
                            value={appName}
                            onChange={e => setAppName(e.target.value)}
                            placeholder="My Application" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Service Account Handle / Username</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-zinc-800 bg-zinc-800/50 text-zinc-400 text-xs font-mono">@</span>
                            <input 
                              type="text" 
                              value={botUsername}
                              onChange={e => setBotUsername(e.target.value)}
                              placeholder={`sa_${currentUser?.username || 'bot'}`}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-r-xl px-3.5 py-2.5 text-xs font-mono text-zinc-100 outline-none focus:border-zinc-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Website URL (Optional)</label>
                          <input 
                            type="url" 
                            value={websiteUrl}
                            onChange={e => setWebsiteUrl(e.target.value)}
                            placeholder="https://example.com" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">OAuth Redirect Callback URI (Optional)</label>
                          <input 
                            type="url" 
                            value={initialRedirectUri}
                            onChange={e => setInitialRedirectUri(e.target.value)}
                            placeholder="https://example.com/oauth/callback" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none text-zinc-100 focus:border-zinc-600"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreating || !appName.trim()}
                        className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {isCreating ? <div className="h-4 w-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span>Create Service Account</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-zinc-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-100">{selectedApp?.app_name}</h3>
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
                      <button onClick={fetchApps} className="text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Refresh
                      </button>
                    </div>

                    {apps.map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedAppId(app.id)}
                        className={`bg-zinc-900 border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm cursor-pointer transition-all ${
                          selectedAppId === app.id ? 'border-zinc-600 bg-zinc-800/40' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selectedAppId === app.id ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-zinc-100 text-sm">{app.app_name}</h4>
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
                        <h3 className="text-sm font-semibold text-zinc-100">
                          API Credentials
                        </h3>
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

                      {/* Client Secret */}
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-zinc-400" /> Client Secret
                          </span>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setShowSecret(!showSecret)}
                              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                            >
                              {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                            </button>
                            <button 
                              onClick={() => handleCopy(currentClientSecret, "Client Secret")}
                              className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === currentClientSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedKey === currentClientSecret ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                        <p className="font-mono text-xs font-medium text-zinc-200 break-all bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                          {showSecret ? currentClientSecret : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                        </p>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleRegenerateSecret}
                            disabled={isRegeneratingSecret}
                            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`h-3 w-3 ${isRegeneratingSecret ? 'animate-spin' : ''}`} />
                            <span>Regenerate Secret</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SDK Code Snippets */}
                    <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                            SDK & Integration Examples
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Code snippets pre-configured with your Client ID.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => downloadSdkFile('zenoa-sdk.ts', generateTsSdk(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>zenoa-sdk.ts</span>
                          </button>
                          <button
                            onClick={() => downloadSdkFile('zenoa_sdk.py', generatePythonSdk(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>zenoa_sdk.py</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Code Viewer Tabs */}
                      <div>
                        <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 mb-3 overflow-x-auto">
                          {[
                            { id: 'ts', label: 'TypeScript' },
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
                              {sdkTab === 'python' && 'zenoa_sdk.py'}
                              {sdkTab === 'env' && '.env'}
                              {sdkTab === 'html' && 'zenoa-sso-button.html'}
                              {sdkTab === 'curl' && 'curl_requests.sh'}
                            </span>
                            <button
                              onClick={() => {
                                const content = sdkTab === 'ts' ? generateTsSdk(selectedApp)
                                  : sdkTab === 'python' ? generatePythonSdk(selectedApp)
                                  : sdkTab === 'env' ? generateEnvConfig(selectedApp)
                                  : sdkTab === 'html' ? generateHtmlSnippet(selectedApp)
                                  : generateCurlSnippets(selectedApp);
                                handleCopy(content, "Code Snippet");
                              }}
                              className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </button>
                          </div>

                          <pre className="p-4 text-[11px] font-mono text-zinc-300 leading-relaxed overflow-x-auto max-h-80">
                            {sdkTab === 'ts' && generateTsSdk(selectedApp)}
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

            {/* TAB: AUTOMATED OTP STUDIO */}
            {activeTab === 'otp' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {/* Banner */}
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-zinc-100 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-6 w-6 text-zinc-300" />
                        <h3 className="text-xl font-bold">Automated OTP Service</h3>
                      </div>
                      <p className="text-zinc-400 text-xs max-w-xl leading-relaxed">
                        Generate and verify zero-trust authentication codes sent directly from your Service Account.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6">
                    <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-mono font-bold border border-zinc-700">POST /api/v1/otp/send</span>
                    <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-mono font-bold border border-zinc-700">POST /api/v1/otp/verify</span>
                    <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-mono font-bold border border-zinc-700">Service Account Delivery</span>
                  </div>
                </div>

                {/* Live Pending OTP Stream Inspector */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-500" />
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        Live Active OTP Stream ({activeOtps.length})
                      </h4>
                    </div>
                    <button 
                      onClick={fetchActiveOtps} 
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Refresh Stream
                    </button>
                  </div>

                  {activeOtps.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                      <Smartphone className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-slate-500 font-medium">No pending OTP requests at this moment.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Use the interactive trigger below or hit the 1-Click Auto-Simulate button.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeOtps.map((otp, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">@{otp.recipient}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${otp.status === 'verified' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50'}`}>
                              {otp.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Code:</span>
                            <span className="font-mono text-base font-black tracking-widest text-indigo-600 dark:text-indigo-400">{otp.code}</span>
                            <span className="text-[10px] font-mono text-slate-400">{otp.remaining_seconds}s left</span>
                          </div>
                          {otp.status !== 'verified' && (
                            <button
                              onClick={() => {
                                setOtpRecipient(otp.recipient);
                                setOtpCodeToVerify(otp.code);
                                handleVerifyOtp(otp.code);
                              }}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>1-Click Auto-Verify Code</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive OTP Trigger & Code Verifier Studio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Panel 1: Dispatch OTP */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 font-bold text-xs">1</div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">Send Verification Code</h4>
                        <p className="text-[11px] text-slate-500">POST /api/v1/otp/send</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Recipient @username or Phone</label>
                        <input 
                          type="text" 
                          value={otpRecipient}
                          onChange={e => setOtpRecipient(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono outline-none dark:text-white"
                          placeholder="username or +91XXXXXXXXXX"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">Verified Professional Template</label>
                          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded font-bold">🔒 Anti-Fraud</span>
                        </div>
                        <select
                          value={selectedTemplateType}
                          onChange={e => setSelectedTemplateType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none dark:text-white font-bold cursor-pointer"
                        >
                          <option value="standard_otp">🔒 Standard Secure OTP Notice</option>
                          <option value="2fa_auth">🛡️ Two-Factor Authentication (2FA)</option>
                          <option value="password_reset">🔑 Password Reset Authorization</option>
                          <option value="transaction_auth">💳 Transaction Security Verification</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Expiry Duration (Mins)</label>
                        <select
                          value={otpExpiryMins}
                          onChange={e => setOtpExpiryMins(Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none dark:text-white font-bold"
                        >
                          <option value={5}>5 Minutes</option>
                          <option value={10}>10 Minutes (Standard)</option>
                          <option value={15}>15 Minutes</option>
                          <option value={30}>30 Minutes</option>
                        </select>
                      </div>

                      <button
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !otpRecipient}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSendingOtp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Dispatch Real OTP via Bot DM</span>
                      </button>
                    </div>
                  </div>

                  {/* Panel 2: Verify Code */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 font-bold text-xs">2</div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">Verify One-Time Code</h4>
                        <p className="text-[11px] text-slate-500">POST /api/v1/otp/verify</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">6-Digit OTP Code</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          value={otpCodeToVerify}
                          onChange={e => setOtpCodeToVerify(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center tracking-[0.4em] font-mono text-lg font-bold outline-none dark:text-white"
                          placeholder="000000"
                        />
                      </div>

                      <button
                        onClick={() => handleVerifyOtp()}
                        disabled={isVerifyingOtp || !otpCodeToVerify || !otpRecipient}
                        className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isVerifyingOtp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        <span>Verify Code & Fire Webhook</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feedback Box */}
                {otpActionFeedback && (
                  <div className={`p-4 rounded-2xl border animate-in slide-in-from-top-2 ${otpActionFeedback.status === 200 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${otpActionFeedback.status === 200 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Server Response: {otpActionFeedback.status}
                      </span>
                      <span className="text-[10px] font-mono opacity-50">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-[11px] font-mono overflow-x-auto dark:text-white">{JSON.stringify(otpActionFeedback.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SERVICE ACCOUNT AUTOMATION & CHAT EMULATOR */}
            {activeTab === 'bot' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {/* Service Account Auto-Responder Rules Manager */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        Service Account Command Triggers & Auto-Responders
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure automated responses or triggers when users message @{selectedApp.bot_username || selectedApp.owner}.
                      </p>
                    </div>
                    <button
                      onClick={() => saveBotRules(botRules)}
                      disabled={isSavingRules}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
                    >
                      {isSavingRules ? 'Saving...' : 'Save Rules'}
                    </button>
                  </div>

                  {/* Add New Rule */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Add Automated Command Rule</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trigger Command / Text</label>
                        <input 
                          type="text" 
                          value={newRuleTrigger}
                          onChange={e => setNewRuleTrigger(e.target.value)}
                          placeholder="/pricing or hello" 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Action Type</label>
                        <select
                          value={newRuleAction}
                          onChange={e => setNewRuleAction(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none dark:text-white font-bold"
                        >
                          <option value="reply">Auto-Reply Text</option>
                          <option value="send_otp">Dispatch OTP Verification</option>
                          <option value="forward_webhook">Forward to Webhook</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Response Content</label>
                        <input 
                          type="text" 
                          value={newRuleResponse}
                          onChange={e => setNewRuleResponse(e.target.value)}
                          placeholder="Our plans start at $10/mo..." 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none dark:text-white font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddBotRule}
                        disabled={!newRuleTrigger.trim() || !newRuleResponse.trim()}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>

                  {/* Rules List */}
                  <div className="space-y-2">
                    {botRules.map(rule => (
                      <div key={rule.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={rule.enabled} 
                            onChange={() => handleToggleBotRule(rule.id)}
                            className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                                {rule.trigger}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">→ {rule.action}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{rule.response}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteBotRule(rule.id)}
                          className="text-rose-500 hover:text-rose-600 font-bold text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: WEBHOOK CONFIGURATION */}
            {activeTab === 'webhooks' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                      <Webhook className="h-5 w-5 text-zinc-400" />
                      Production Webhook Settings
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Configure your backend URL to receive HMAC-SHA256 signed event notifications.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Production Webhook Endpoint</label>
                      <input 
                        type="url" 
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://your-api.com/webhooks/zenoa" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-mono outline-none text-zinc-100 focus:border-zinc-700"
                      />
                    </div>

                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                      <p className="text-xs font-bold text-zinc-200">HMAC-SHA256 Verification</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Incoming requests include an <code className="text-zinc-200">X-Zenoa-Signature</code> header. Validate this signature using your Client Secret.
                      </p>
                    </div>

                    <button
                      onClick={handleUpdateSettings}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? 'Saving...' : 'Save Webhook Configuration'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MULTI-RECIPIENT BROADCAST */}
            {activeTab === 'broadcast' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Radio className="h-5 w-5 text-indigo-500" />
                      Multi-Recipient Broadcast Manager
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dispatch notifications or announcements to multiple recipients simultaneously.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recipients List (Comma-separated)</label>
                      <input 
                        type="text" 
                        value={broadcastRecipients}
                        onChange={e => setBroadcastRecipients(e.target.value)}
                        placeholder="user1, user2, +91XXXXXXXXXX" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono outline-none dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Broadcast Message</label>
                      <textarea 
                        rows={3}
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="Type notification text..." 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                      />
                    </div>

                    <button
                      onClick={handleBroadcast}
                      disabled={isBroadcasting || !broadcastRecipients || !broadcastMessage}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {isBroadcasting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>Execute Broadcast Message</span>
                    </button>
                  </div>

                  {broadcastResult && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-xs font-bold text-emerald-600">Sent: {broadcastResult.total_sent}</span>
                        <span className="text-xs font-bold text-rose-600">Failed: {broadcastResult.total_failed}</span>
                      </div>
                      <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto dark:text-white">
                        {JSON.stringify(broadcastResult.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: OAUTH 2.0 & SSO SDK SUITE */}
            {activeTab === 'sso' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 rounded-[2.5rem] text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-8 w-8 text-indigo-200" />
                    <h3 className="text-2xl font-black">Login with Zenoa (SSO 2.0)</h3>
                  </div>
                  <p className="text-indigo-100 text-sm max-w-xl mb-6 leading-relaxed">
                    Integrate instant Zenoa user authentication into your website, app, or backend in under 3 minutes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">HMAC-SHA256 SIGNED</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">OAUTH 2.0 AUTH CODE</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">ZERO PASSWORDS</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">ONE-TAP POPUP / REDIRECT</span>
                  </div>
                </div>

                {/* Ready to Copy Code Generator */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Code className="h-5 w-5 text-indigo-500" />
                      Live Integration Code Snippets
                    </h3>
                    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[
                        { id: 'node', label: 'Node.js' },
                        { id: 'python', label: 'Python' },
                        { id: 'php', label: 'PHP' },
                        { id: 'go', label: 'Go' },
                        { id: 'curl', label: 'cURL' },
                        { id: 'button', label: 'HTML Button' },
                      ].map(lang => (
                        <button
                          key={lang.id}
                          onClick={() => setCodeLang(lang.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            codeLang === lang.id 
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Viewer */}
                  <div className="relative">
                    <div className="bg-slate-950 rounded-2xl p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed border border-slate-800">
                      {codeLang === 'node' && (
                        <pre>{`// Node.js Express SSO & OTP Integration
import express from 'express';
import axios from 'axios';

const app = express();
const CLIENT_ID = '${currentClientId}';
const CLIENT_SECRET = '${currentClientSecret}';
const ZENOA_URL = '${window.location.origin}';

// 1. Send OTP
async function sendVerificationOtp(recipient) {
  const res = await axios.post(\`\${ZENOA_URL}/api/v1/otp/send\`, {
    recipient: recipient
  }, {
    headers: { 'Authorization': \`Bearer \${CLIENT_ID}\` }
  });
  return res.data;
}

// 2. Verify OTP
async function verifyOtpCode(recipient, code) {
  const res = await axios.post(\`\${ZENOA_URL}/api/v1/otp/verify\`, {
    recipient: recipient,
    code: code
  }, {
    headers: { 'Authorization': \`Bearer \${CLIENT_ID}\` }
  });
  return res.data;
}`}</pre>
                      )}

                      {codeLang === 'python' && (
                        <pre>{`# Python OTP & SSO Integration
import requests

CLIENT_ID = '${currentClientId}'
CLIENT_SECRET = '${currentClientSecret}'
ZENOA_URL = '${window.location.origin}'

def send_otp(recipient):
    res = requests.post(f"{ZENOA_URL}/api/v1/otp/send", json={"recipient": recipient}, headers={"Authorization": f"Bearer {CLIENT_ID}"})
    return res.json()

def verify_otp(recipient, code):
    res = requests.post(f"{ZENOA_URL}/api/v1/otp/verify", json={"recipient": recipient, "code": code}, headers={"Authorization": f"Bearer {CLIENT_ID}"})
    return res.json()`}</pre>
                      )}

                      {codeLang === 'php' && (
                        <pre>{`<?php
// PHP OTP Integration
$client_id = '${currentClientId}';
$zenoa_url = '${window.location.origin}';

function sendOtp($recipient) {
    global $client_id, $zenoa_url;
    $ch = curl_init("$zenoa_url/api/v1/otp/send");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['recipient' => $recipient]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', "Authorization: Bearer $client_id"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    return json_decode(curl_exec($ch), true);
}`}</pre>
                      )}

                      {codeLang === 'go' && (
                        <pre>{`package main

import (
	"bytes"
	"encoding/json"
	"net/http"
)

func sendOTP(recipient string) (*http.Response, error) {
	payload, _ := json.Marshal(map[string]string{"recipient": recipient})
	req, _ := http.NewRequest("POST", "${window.location.origin}/api/v1/otp/send", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer ${currentClientId}")
	req.Header.Set("Content-Type", "application/json")
	return http.DefaultClient.Do(req)
}`}</pre>
                      )}

                      {codeLang === 'curl' && (
                        <pre>{`# 1. Trigger OTP
curl -X POST ${window.location.origin}/api/v1/otp/send \\
  -H "Authorization: Bearer ${currentClientId}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "aman_azad"}'

# 2. Verify Code
curl -X POST ${window.location.origin}/api/v1/otp/verify \\
  -H "Authorization: Bearer ${currentClientId}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "aman_azad", "code": "123456"}'`}</pre>
                      )}

                      {codeLang === 'button' && (
                        <pre>{`<!-- Ready-to-use "Sign in with Zenoa" SVG Button -->
<a 
  href="${window.location.origin}/auth/sso?client_id=${currentClientId}&redirect_uri=${encodeURIComponent(primaryRedirectUri)}&state=custom_state"
  style="display: inline-flex; align-items: center; gap: 10px; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 12px; font-family: sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
  <span>Sign in with Zenoa</span>
</a>`}</pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total API Calls</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.messages_sent || 0}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Real-time active
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OTP Verified</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.otp_verified || 0}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-2">Active Authentications</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">99.9%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: '99.9%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACTIVITY LOGS */}
            {activeTab === 'logs' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                   <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="h-4 w-4 text-indigo-500" />
                        Live Activity & Authentication Logs
                      </h3>
                      <button onClick={fetchAppData} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-xs italic">No activity logs recorded yet.</div>
                      ) : (
                        logs.map(log => (
                          <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {log.action === 'sso_login' ? <ShieldCheck className="h-4 w-4" /> : (log.action === 'message_send' ? <Bot className="h-4 w-4" /> : <Lock className="h-4 w-4" />)}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-slate-900 dark:text-white">
                                     {log.action === 'sso_login' ? `SSO Authorization (@${log.recipient})` : (log.action === 'message_send' ? `Bot Message to @${log.recipient}` : `OTP Action to @${log.recipient}`)}
                                   </p>
                                   <p className="text-[10px] text-slate-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                             </div>
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      REST API Endpoints Specification
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Production reference for Zenoa Developer REST APIs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-mono font-bold">POST</span>
                        <code className="text-xs font-mono font-bold dark:text-white">/api/v1/otp/send</code>
                      </div>
                      <p className="text-xs text-slate-500">Generates and sends a 6-digit OTP to any user or mobile number via your bot.</p>
                      <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:text-slate-300">
{`Headers: Authorization: Bearer <CLIENT_ID>
Body: {
  "recipient": "username or +91XXXXXXXXXX",
  "expiry_mins": 10,
  "template_type": "standard_otp"
}`}
                      </pre>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-mono font-bold">POST</span>
                        <code className="text-xs font-mono font-bold dark:text-white">/api/v1/otp/verify</code>
                      </div>
                      <p className="text-xs text-slate-500">Verifies an OTP and automatically fires a webhook event.</p>
                      <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:text-slate-300">
{`Headers: Authorization: Bearer <CLIENT_ID>
Body: {
  "recipient": "username",
  "code": "123456"
}`}
                      </pre>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-mono font-bold">POST</span>
                        <code className="text-xs font-mono font-bold dark:text-white">/api/v1/messages/send</code>
                      </div>
                      <p className="text-xs text-slate-500">Sends transactional or support message from bot to user.</p>
                      <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:text-slate-300">
{`Headers: Authorization: Bearer <CLIENT_ID>
Body: {
  "recipient": "username",
  "message": "Your order #123 has shipped!"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-indigo-500" />
                      App & Webhook Settings
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure webhook destination and general metadata.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Webhook URL</label>
                      <input 
                        type="url" 
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://your-backend.com/webhook" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono outline-none dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                      <input 
                        type="url" 
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="https://acme.example.com" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Application Description</label>
                      <textarea 
                        rows={2}
                        value={appDescription}
                        onChange={e => setAppDescription(e.target.value)}
                        placeholder="Describe your application..." 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleUpdateSettings}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
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
    </div>
  );
};
