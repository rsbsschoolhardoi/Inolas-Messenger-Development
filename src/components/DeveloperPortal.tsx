import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { 
  Terminal, Plus, Key, Copy, Check, ArrowLeft, Shield, Code, Server, 
  BarChart3, History, Lock, FileText, RefreshCw, Eye, EyeOff, Globe,
  ShieldCheck, Webhook, Radio, Sliders, Zap, Download
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
    showToast(`Downloaded ${filename}!`);
  };

  const generateTsSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `/**
 * Auto-Generated Zenoa Production SDK for ${app.app_name}
 * Client ID: ${cid}
 * Base URL: ${origin}
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
}

export default ZenoaSDK;
`;
  };

  const generatePythonSdk = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `# Auto-Generated Zenoa SDK for ${app.app_name}
import requests

class ZenoaSDK:
    def __init__(self, client_id="${cid}", client_secret="${sec}", base_url="${origin}"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url

    def send_otp(self, recipient: str, template_type: str = "standard_otp", expiry_mins: int = 10):
        url = f"{self.base_url}/api/v1/otp/send"
        headers = { "Authorization": f"Bearer {self.client_id}", "Content-Type": "application/json" }
        res = requests.post(url, json={"recipient": recipient, "template_type": template_type, "expiry_mins": expiry_mins}, headers=headers)
        return res.json()

    def verify_otp(self, recipient: str, code: str):
        url = f"{self.base_url}/api/v1/otp/verify"
        headers = { "Authorization": f"Bearer {self.client_id}", "Content-Type": "application/json" }
        res = requests.post(url, json={"recipient": recipient, "code": code}, headers=headers)
        return res.json()
`;
  };

  const generateEnvConfig = (app: any) => {
    if (!app) return '';
    const cid = app.client_id || app.api_key || 'zen_client_prod';
    const sec = app.client_secret || 'zen_sec_secret';
    const origin = window.location.origin;
    return `# Production Environment Variables for ${app.app_name}
ZENOA_CLIENT_ID="${cid}"
ZENOA_CLIENT_SECRET="${sec}"
ZENOA_SERVICE_ACCOUNT="@${app.bot_username || app.owner}"
ZENOA_BASE_URL="${origin}"
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
    const origin = window.location.origin;
    return `# 1. Send OTP
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+91XXXXXXXXXX", "template_type": "standard_otp"}'

# 2. Verify OTP
curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+91XXXXXXXXXX", "code": "123456"}'`;
  };

  useEffect(() => {
    fetchApps();
  }, []);

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
        : [window.location.origin + '/auth/sso'];

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
                          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            SDK & Integration Examples
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Production code pre-configured with your Client ID.
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
                            onClick={() => downloadSdkFile('zenoa_sdk.py', generatePythonSdk(selectedApp))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs transition-all border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
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

            {/* TAB: AUTOMATED OTP SPECIFICATIONS */}
            {activeTab === 'otp' && selectedApp && (
              <div className="space-y-6 animate-in fade-in">
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
    </div>
  );
};
