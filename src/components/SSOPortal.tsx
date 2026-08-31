import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Key, Lock, Copy, Check, ExternalLink, Plus, RefreshCw,
  Trash2, Edit3, ArrowRight, Code2, Globe, Smartphone, CheckCircle2,
  AlertCircle, Sparkles, Terminal, Play, Eye, EyeOff, Layers, UserCheck,
  FileCode, CheckSquare, X
} from 'lucide-react';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { apiFetch } from '../lib/fetchInterceptor';
import { getDoc, collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';

interface SSOApp {
  id: string;
  client_id: string;
  client_secret: string;
  app_name: string;
  app_description?: string;
  website_url?: string;
  logo_url?: string;
  redirect_uris: string[];
  scopes: string[];
  type?: string;
  created_at: number;
  owner?: string;
}

interface SSOPortalProps {
  themeMode: 'light' | 'dark';
  currentUser: UserData | null;
  onBack?: () => void;
  onOpenConsentPreview?: (clientId: string, redirectUri: string) => void;
}

const handleFetchResponse = async (res: Response, originalRequest?: () => Promise<Response>): Promise<any> => {
  const text = await res.text();
  if (res.status === 405 || text.includes('__cookie_check') || text.includes('<!DOCTYPE html') || text.includes('<html>')) {
    try {
      await apiFetch('/__cookie_check.html', { credentials: 'include' });
      await new Promise(r => setTimeout(r, 400));
      if (originalRequest) {
        const retryRes = await originalRequest();
        const retryText = await retryRes.text();
        try {
          return JSON.parse(retryText);
        } catch (e) {
          // Fall through
        }
      }
    } catch (e) {
      // fallback
    }
    // If it reaches here, the retry failed or couldn't be attempted
    return { success: false, error: 'Please open this application in a "New Tab" to allow secure cookies. Browsers block 3rd-party cookies in iframes.' };
  }
  if (!res.ok) {
    return { success: false, error: `Server returned status ${res.status}: ${text.substring(0, 100)}` };
  }
  try {
    return JSON.parse(text);
  } catch (parseErr) {
    throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
  }
};

export const SSOPortal: React.FC<SSOPortalProps> = ({
  themeMode,
  currentUser,
  onBack,
  onOpenConsentPreview
}) => {
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo || branding.oauth_logo;
  const [activeTab, setActiveTab] = useState<'apps' | 'create' | 'playground' | 'docs'>('apps');
  const [apps, setApps] = useState<SSOApp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // App Creation / Edit Form State
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('');
  const [appDescription, setAppDescription] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [redirectUrisInput, setRedirectUrisInput] = useState<string>('');
  const [redirectUrisList, setRedirectUrisList] = useState<string[]>(['http://localhost:3000/auth/callback']);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['profile', 'email', 'phone']);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Playground / Tester State
  const [selectedTesterAppId, setSelectedTesterAppId] = useState<string>('demo_app');
  const [testRedirectUri, setTestRedirectUri] = useState<string>('');
  const [playgroundStep, setPlaygroundStep] = useState<'idle' | 'authorized' | 'token_exchanged' | 'userinfo_fetched'>('idle');
  const [playgroundAuthCode, setPlaygroundAuthCode] = useState<string>('');
  const [playgroundSignedPayload, setPlaygroundSignedPayload] = useState<string>('');
  const [playgroundAccessToken, setPlaygroundAccessToken] = useState<string>('');
  const [playgroundUserResult, setPlaygroundUserResult] = useState<any>(null);
  const [isTesterRunning, setIsTesterRunning] = useState<boolean>(false);
  const [testerLog, setTesterLog] = useState<string[]>([]);

  // Docs language tab
  const [docsLanguage, setDocsLanguage] = useState<'html' | 'react' | 'nodejs' | 'python' | 'curl'>('react');

  // Load User's SSO Applications
  const fetchApps = async () => {
    const ownerName = currentUser?.username || 'developer_user';
    setIsLoading(true);
    try {
      let firestoreApps: SSOApp[] = [];
      const officialApp: SSOApp = {
        id: 'sso_official_default',
        client_id: 'zenoa_official_app',
        client_secret: 'zen_sec_official_9999',
        app_name: 'Zenoa Official OAuth Client',
        app_description: 'Pre-configured official Zenoa OAuth 2.0 client for production SSO login, token exchange, and user profile verification.',
        website_url: window.location.origin,
        logo_url: '',
        redirect_uris: [window.location.origin + '/auth/sso', 'http://localhost:3000/auth/sso'],
        scopes: ['profile', 'email', 'phone'],
        type: 'sso_oauth_client',
        created_at: Date.now(),
        owner: ownerName
      };

      if (db) {
        const ssoRef = collection(db, 'sso_applications');
        const q = query(ssoRef, where('owner', '==', ownerName));
        const snap = await getDocs(q);
        firestoreApps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SSOApp[];

        // Also check if official app exists in db, if not save it
        const officialRef = doc(db, 'sso_applications', 'sso_official_default');
        const officialSnap = await getDoc(officialRef);
        if (!officialSnap.exists()) {
          await setDoc(officialRef, officialApp).catch(() => {});
        }
      }

      if (!firestoreApps.some(a => a.client_id === 'zenoa_official_app')) {
        firestoreApps.unshift(officialApp);
      }

      setApps(firestoreApps);
    } catch (err: any) {
      console.warn('Failed to load SSO apps:', err);
      showNotification('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [currentUser?.username]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showNotification('success', `Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecretReveal = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Add redirect URI chip
  const handleAddRedirectUri = () => {
    const trimmed = redirectUrisInput.trim();
    if (!trimmed) return;
    if (!redirectUrisList.includes(trimmed)) {
      setRedirectUrisList([...redirectUrisList, trimmed]);
    }
    setRedirectUrisInput('');
  };

  const handleRemoveRedirectUri = (uri: string) => {
    setRedirectUrisList(redirectUrisList.filter(u => u !== uri));
  };

  // Toggle requested scopes
  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length > 1) {
        setSelectedScopes(selectedScopes.filter(s => s !== scope));
      }
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingAppId(null);
    setAppName('');
    setAppDescription('');
    setWebsiteUrl('');
    setLogoUrl('');
    setRedirectUrisInput('');
    setRedirectUrisList(['http://localhost:3000/auth/callback']);
    setSelectedScopes(['profile', 'email', 'phone']);
  };

  // Start editing app
  const startEditApp = (app: SSOApp) => {
    setEditingAppId(app.id);
    setAppName(app.app_name);
    setAppDescription(app.app_description || '');
    setWebsiteUrl(app.website_url || '');
    setLogoUrl(app.logo_url || '');
    setRedirectUrisList(app.redirect_uris || ['http://localhost:3000/auth/callback']);
    setSelectedScopes(app.scopes || ['profile', 'email', 'phone']);
    setActiveTab('create');
  };

  // Save / Update App
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      showNotification('error', 'Please enter an Application Name');
      return;
    }
    if (redirectUrisList.length === 0) {
      showNotification('error', 'Please add at least one allowed OAuth Redirect URI');
      return;
    }

    if (websiteUrl.trim()) {
      try {
        new URL(websiteUrl.trim());
      } catch {
        showNotification('error', 'Please enter a valid Website URL (e.g., https://example.com)');
        return;
      }
    }

    for (const uri of redirectUrisList) {
      try {
        new URL(uri);
      } catch {
        showNotification('error', `Invalid Redirect URI format: "${uri}". Must start with http:// or https://`);
        return;
      }
    }

    setIsSubmitting(true);
    const ownerName = currentUser?.username || 'developer_user';

    try {
      if (!db) throw new Error("Database not connected.");

      if (editingAppId) {
        // Update
        const docRef = doc(db, 'sso_applications', editingAppId);
        await updateDoc(docRef, {
          app_name: appName.trim(),
          app_description: appDescription.trim(),
          website_url: websiteUrl.trim(),
          logo_url: logoUrl.trim(),
          redirect_uris: redirectUrisList,
          scopes: selectedScopes
        });
        showNotification('success', 'OAuth application updated successfully!');
        resetForm();
        setActiveTab('apps');
        fetchApps();
      } else {
        // Create
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const randomSec = Array.from(window.crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
        const clientId = `zenoa_oauth_${randomId}`;
        const clientSecret = `zenoa_sec_${randomSec}`;
        
        const docId = `sso_${randomId}`;
        const newApp = {
          owner: ownerName,
          app_name: appName.trim(),
          app_description: appDescription.trim(),
          website_url: websiteUrl.trim(),
          logo_url: logoUrl.trim(),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uris: redirectUrisList,
          scopes: selectedScopes,
          type: 'sso_oauth_client',
          created_at: Date.now(),
          status: 'active'
        };

        const docRef = doc(collection(db, 'sso_applications'), docId);
        await setDoc(docRef, newApp);
        
        showNotification('success', 'OAuth 2.0 credentials generated successfully!');
        resetForm();
        setActiveTab('apps');
        fetchApps();
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regenerate Secret
  const handleRegenerateSecret = async (app: SSOApp) => {
    if (!window.confirm(`Are you sure you want to regenerate the Client Secret for "${app.app_name}"? Existing integrations using the old secret will need to be updated.`)) {
      return;
    }

    try {
      if (!db) throw new Error("Database not connected.");
      const randomSec = Array.from(window.crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      const newSecret = `zenoa_sec_${randomSec}`;
      
      await updateDoc(doc(db, 'sso_applications', app.id), {
        client_secret: newSecret
      });
      
      showNotification('success', 'New Client Secret generated successfully!');
      fetchApps();
    } catch (err: any) {
      showNotification('error', err?.message || 'Request failed');
    }
  };

  // Delete App
  const handleDeleteApp = async (app: SSOApp) => {
    if (!window.confirm(`Delete application "${app.app_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (!db) throw new Error("Database not connected.");
      await deleteDoc(doc(db, 'sso_applications', app.id));
      showNotification('success', 'Application deleted successfully');
      fetchApps();
    } catch (err: any) {
      showNotification('error', err?.message || 'Delete request failed');
    }
  };

  // ----------------------------------------------------
  // PLAYGROUND SIMULATOR FLOW
  // ----------------------------------------------------
  const getSelectedTesterApp = (): SSOApp | null => {
    if (selectedTesterAppId === 'demo_app') {
      return {
        id: 'demo_app',
        client_id: 'demo_app',
        client_secret: 'zenoa_sso_demo_secret_2026',
        app_name: 'Zenoa Production Application',
        website_url: 'https://zenoa.im',
        redirect_uris: ['http://localhost:3000/auth/callback', window.location.origin + '/auth/sso'],
        scopes: ['profile', 'email', 'phone'],
        created_at: Date.now()
      };
    }
    return apps.find(a => a.id === selectedTesterAppId || a.client_id === selectedTesterAppId) || null;
  };

  const runSimulatedAuthorize = async () => {
    const targetApp = getSelectedTesterApp();
    if (!targetApp || !currentUser) {
      showNotification('error', 'You must be logged in to test OAuth authorization');
      return;
    }

    setIsTesterRunning(true);
    setTesterLog(['[1/3] Initiating OAuth 2.0 Authorization request...', `Target Client ID: ${targetApp.client_id}`]);
    setPlaygroundStep('idle');
    setPlaygroundAuthCode('');
    setPlaygroundAccessToken('');
    setPlaygroundUserResult(null);

    const rUri = testRedirectUri || (targetApp.redirect_uris && targetApp.redirect_uris[0]) || (window.location.origin + '/auth/sso');

    try {
      const res = await apiFetch('/api/v1/sso/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: targetApp.client_id,
          user_data: {
            uid: currentUser.id,
            username: currentUser.username,
            display_name: currentUser.display_name,
            email: currentUser.email,
            mobile_number: currentUser.mobile_number,
            avatar_url: currentUser.avatar_url || currentUser.avatar_seed
          },
          redirect_uri: rUri,
          state: 'test_state_' + Math.random().toString(36).substring(2, 7)
        })
      });

      const data = await handleFetchResponse(res);
      if (data.success) {
        setPlaygroundAuthCode(data.code);
        setPlaygroundSignedPayload(data.payload);
        setPlaygroundStep('authorized');
        setTesterLog(prev => [
          ...prev,
          `✓ Authorization Approved!`,
          `Single-Use Code: ${data.code}`,
          `HMAC-SHA256 Signature: ${data.signature.substring(0, 24)}...`
        ]);
        showNotification('success', 'Authorization code issued successfully!');
      } else {
        setTesterLog(prev => [...prev, `✗ Error: ${data.error || 'Authorization failed'}`]);
        showNotification('error', data.error || 'Authorization failed');
      }
    } catch (err: any) {
      setTesterLog(prev => [...prev, `✗ Network Error: ${err?.message}`]);
      showNotification('error', err?.message || 'Network error');
    } finally {
      setIsTesterRunning(false);
    }
  };

  const runSimulatedTokenExchange = async () => {
    const targetApp = getSelectedTesterApp();
    if (!targetApp || !playgroundAuthCode) return;

    setIsTesterRunning(true);
    setTesterLog(prev => [
      ...prev,
      `[2/3] Calling POST /api/v1/sso/token...`,
      `Exchanging code "${playgroundAuthCode.substring(0, 16)}..." with client_secret`
    ]);

    try {
      const res = await apiFetch('/api/v1/sso/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: targetApp.client_id,
          client_secret: targetApp.client_secret,
          code: playgroundAuthCode,
          redirect_uri: testRedirectUri || (targetApp.redirect_uris && targetApp.redirect_uris[0]) || ''
        })
      });

      const data = await handleFetchResponse(res);
      if (data.access_token) {
        setPlaygroundAccessToken(data.access_token);
        setPlaygroundStep('token_exchanged');
        setTesterLog(prev => [
          ...prev,
          `✓ Token Exchange Success!`,
          `Bearer Access Token: ${data.access_token}`,
          `Token Type: ${data.token_type}, Expires In: ${data.expires_in}s`
        ]);
        showNotification('success', 'Bearer Access Token received!');
      } else {
        setTesterLog(prev => [...prev, `✗ Token Exchange Error: ${data.error}`]);
        showNotification('error', data.error || 'Token exchange failed');
      }
    } catch (err: any) {
      setTesterLog(prev => [...prev, `✗ Request Error: ${err?.message}`]);
      showNotification('error', err?.message || 'Token exchange error');
    } finally {
      setIsTesterRunning(false);
    }
  };

  const runSimulatedUserInfoFetch = async () => {
    if (!playgroundAccessToken) return;

    setIsTesterRunning(true);
    setTesterLog(prev => [
      ...prev,
      `[3/3] Calling GET /api/v1/sso/userinfo with Bearer token...`
    ]);

    try {
      const res = await apiFetch('/api/v1/sso/userinfo', {
        headers: { Authorization: `Bearer ${playgroundAccessToken}` }
      });

      const data = await handleFetchResponse(res);
      if (data.success && data.user) {
        setPlaygroundUserResult(data.user);
        setPlaygroundStep('userinfo_fetched');
        setTesterLog(prev => [
          ...prev,
          `✓ Identity Verified!`,
          `User: @${data.user.username} (${data.user.display_name})`,
          `Verified Mobile: ${data.user.mobile_number || 'N/A'}`,
          `Email: ${data.user.email || 'N/A'}`
        ]);
        showNotification('success', 'Verified User Profile retrieved!');
      } else {
        setTesterLog(prev => [...prev, `✗ UserInfo Error: ${data.error}`]);
        showNotification('error', data.error || 'Failed to fetch user info');
      }
    } catch (err: any) {
      setTesterLog(prev => [...prev, `✗ Network Error: ${err?.message}`]);
      showNotification('error', err?.message || 'Network error');
    } finally {
      setIsTesterRunning(false);
    }
  };

  // Sample App for Code Snippets
  const activeSnippetApp = apps[0] || {
    client_id: 'zenoa_oauth_your_client_id',
    client_secret: 'zenoa_sec_your_client_secret',
    redirect_uris: ['https://yourapp.com/api/auth/callback']
  };

  return (
    <div className={`w-full min-h-[100dvh] flex flex-col font-sans transition-colors ${
      themeMode === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      {/* Top Banner / Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 backdrop-blur-md'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 backdrop-blur-md'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-md ${
        themeMode === 'dark' ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white/80 border-neutral-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl border transition-colors ${
                  themeMode === 'dark'
                    ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                    : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                }`}
                title="Back to Messenger"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 dark:bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-black text-lg overflow-hidden p-1">
                {activeLogo ? (
                  <img src={activeLogo} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span>Z</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg leading-none">{branding.app_name || 'Zenoa'} SSO Platform</h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    OAuth 2.0 / OIDC
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  "Continue with {branding.app_name || 'Zenoa'}" Identity Provider for any third-party app
                </p>
              </div>
            </div>
          </div>

          {/* User Status pill */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                themeMode === 'dark' ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-100 border-neutral-200'
              }`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-neutral-500 dark:text-neutral-400">Developer:</span>
                <span className="font-semibold">@{currentUser.username}</span>
              </div>
            )}
            <button
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register App</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'apps'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My SSO Applications ({apps.length})</span>
          </button>

          <button
            onClick={() => {
              if (activeTab !== 'create') resetForm();
              setActiveTab('create');
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingAppId ? 'Edit Application' : 'Register New App'}</span>
          </button>



          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'docs'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Integration SDKs & Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'playground'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>OAuth 2.0 Tester</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {/* ========================================================================= */}
        {/* TAB 1: MY APPLICATIONS LIST                                              */}
        {/* ========================================================================= */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">OAuth 2.0 Applications</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Register your websites or mobile apps here to allow users to sign in with their Zenoa account.
                </p>
              </div>
              <button
                onClick={fetchApps}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium self-start transition-colors ${
                  themeMode === 'dark' ? 'border-neutral-800 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Application Cards */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
                <p className="text-sm">Loading registered SSO applications...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center gap-4 ${
                themeMode === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
              }`}>
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="max-w-md">
                  <h3 className="font-bold text-lg">No OAuth applications registered yet</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Create your first OAuth 2.0 client credentials to integrate the "Continue with Zenoa" login button into your website or mobile app.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('create');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-600/25 transition-all"
                >
                  Register Your First Application
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {apps.map(app => {
                  const isSecretVisible = !!revealedSecrets[app.id];
                  return (
                    <div
                      key={app.id}
                      className={`p-6 rounded-2xl border transition-all ${
                        themeMode === 'dark'
                          ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
                      }`}
                    >
                      {/* Top Row: Info & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-zinc-800/40 border border-zinc-700 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xl">
                            {app.logo_url ? (
                              <img src={app.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              app.app_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{app.app_name}</h3>
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Active OAuth Client
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {app.app_description || 'Single Sign-On client for Zenoa users'}
                            </p>
                            {app.website_url && (
                              <a
                                href={app.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline mt-1"
                              >
                                <Globe className="w-3 h-3" />
                                <span>{app.website_url}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-start">
                          <button
                            onClick={() => {
                              setSelectedTesterAppId(app.id);
                              setActiveTab('playground');
                              const targetUri = (app.redirect_uris && app.redirect_uris[0]) || `${window.location.origin}/auth/sso`;
                              if (onOpenConsentPreview) {
                                onOpenConsentPreview(app.client_id, targetUri);
                              } else {
                                window.open(`/auth/sso?client_id=${encodeURIComponent(app.client_id)}&redirect_uri=${encodeURIComponent(targetUri)}`, '_blank');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Test Login</span>
                          </button>
                          <button
                            onClick={() => startEditApp(app)}
                            className={`p-2 rounded-lg border transition-colors ${
                              themeMode === 'dark' ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300' : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                            }`}
                            title="Edit app"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteApp(app)}
                            className={`p-2 rounded-lg border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors`}
                            title="Delete app"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Credentials Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        {/* Client ID */}
                        <div className={`p-4 rounded-xl border ${
                          themeMode === 'dark' ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-sky-500" />
                              <span>Client ID (Public)</span>
                            </span>
                            <button
                              onClick={() => copyToClipboard(app.client_id, 'Client ID')}
                              className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                            >
                              {copiedKey === 'Client ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === 'Client ID' ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs font-bold break-all select-all">
                            {app.client_id}
                          </div>
                        </div>

                        {/* Client Secret */}
                        <div className={`p-4 rounded-xl border ${
                          themeMode === 'dark' ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Client Secret (Keep Private)</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleSecretReveal(app.id)}
                                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
                              >
                                {isSecretVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isSecretVisible ? 'Hide' : 'Reveal'}</span>
                              </button>
                              <button
                                onClick={() => copyToClipboard(app.client_secret, 'Client Secret')}
                                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                              >
                                {copiedKey === 'Client Secret' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === 'Client Secret' ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-mono text-xs font-bold break-all select-all">
                              {isSecretVisible ? app.client_secret : '••••••••••••••••••••••••••••••••••••••••'}
                            </div>
                            <button
                              onClick={() => handleRegenerateSecret(app)}
                              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                              title="Generate a new secret"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Roll</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Redirect URIs & Scopes */}
                      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-neutral-500">Allowed Callbacks:</span>
                          {(app.redirect_uris || []).map((uri, idx) => (
                            <span
                              key={idx}
                              className={`px-2.5 py-1 rounded-md font-mono text-[11px] border ${
                                themeMode === 'dark' ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {uri}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <span>Scopes:</span>
                          {(app.scopes || ['profile', 'email', 'phone']).map(sc => (
                            <span key={sc} className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[10px]">
                              {sc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTER / EDIT APPLICATION FORM                                   */}
        {/* ========================================================================= */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className={`p-6 sm:p-8 rounded-2xl border ${
              themeMode === 'dark' ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
            }`}>
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {editingAppId ? 'Update OAuth 2.0 Application' : 'Register New OAuth 2.0 Application'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Configure your application metadata and callback endpoints to receive secure "Continue with Zenoa" authorizations.
                </p>
              </div>

              <form onSubmit={handleSaveApp} className="space-y-5">
                {/* App Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Application Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    placeholder="e.g. Acme Marketplace, CloudDesk, FitPulse"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                      themeMode === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Displayed to users on the "Continue with Zenoa" consent screen.
                  </p>
                </div>

                {/* App Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={appDescription}
                    onChange={e => setAppDescription(e.target.value)}
                    placeholder="e.g. Next-generation collaboration tool"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                      themeMode === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                {/* Website URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                      themeMode === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    App Logo Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                      themeMode === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                {/* Redirect / Callback URIs */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Allowed OAuth 2.0 Redirect / Callback URIs *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={redirectUrisInput}
                      onChange={e => setRedirectUrisInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRedirectUri();
                        }
                      }}
                      placeholder="e.g. http://localhost:3000/auth/callback"
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                        themeMode === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddRedirectUri}
                      className="px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-bold transition-colors"
                    >
                      Add URI
                    </button>
                  </div>

                  {/* Chips List */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {redirectUrisList.map(uri => (
                      <div
                        key={uri}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs ${
                          themeMode === 'dark' ? 'bg-neutral-800/80 border-neutral-700 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
                        }`}
                      >
                        <span>{uri}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRedirectUri(uri)}
                          className="hover:text-rose-500 transition-colors ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    For strict OAuth 2.0 security, Zenoa enforces exact URI matching (Protocol + Domain + Port + Path). Domain-level matching is disabled — authorization requests must strictly and exactly match one of the registered URIs above.
                  </p>
                </div>

                {/* Scopes Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                    Requested User Profile Scopes
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'profile', label: 'Basic Profile', desc: 'Name, Username, Avatar' },
                      { id: 'email', label: 'Email Address', desc: 'Verified Email' },
                      { id: 'phone', label: 'Phone Number', desc: 'Verified Mobile' }
                    ].map(scope => {
                      const isSelected = selectedScopes.includes(scope.id);
                      return (
                        <div
                          key={scope.id}
                          onClick={() => toggleScope(scope.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400'
                              : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{scope.label}</span>
                            <CheckSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-500' : 'text-neutral-400'}`} />
                          </div>
                          <p className="text-[10px] text-neutral-500">{scope.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setActiveTab('apps');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/25 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingAppId ? 'Update Credentials' : 'Create OAuth 2.0 Client'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INTEGRATION SDKS & CODE SAMPLES                                    */}
        {/* ========================================================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h2 className="text-2xl font-bold">Zenoa SSO Developer SDK</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Standard OAuth 2.0 integration takes only a few lines of code in any framework.
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { id: 'react', label: 'React / Next.js' },
                { id: 'html', label: 'HTML / JS Widget' },
                { id: 'nodejs', label: 'Node.js Express' },
                { id: 'python', label: 'Python (Flask)' },
                { id: 'curl', label: 'cURL / REST API' }
              ].map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setDocsLanguage(lang.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    docsLanguage === lang.id
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Code Block Container */}
            <div className={`rounded-2xl border overflow-hidden ${
              themeMode === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-900 text-neutral-100 border-neutral-800'
            }`}>
              <div className="px-5 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                  {docsLanguage === 'react' && 'ZenoaLoginButton.tsx'}
                  {docsLanguage === 'html' && 'index.html'}
                  {docsLanguage === 'nodejs' && 'server.js'}
                  {docsLanguage === 'python' && 'app.py'}
                  {docsLanguage === 'curl' && 'bash / terminal'}
                </span>
                <button
                  onClick={() => {
                    let code = '';
                    if (docsLanguage === 'react') {
                      code = `// React / Next.js "Continue with Zenoa" Button Component
import React from 'react';

export function ZenoaLoginButton({ redirectUri = '${activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback'}' }) {
  const handleLogin = () => {
    const authUrl = new URL('${window.location.origin}/auth/sso');
    authUrl.searchParams.set('client_id', '${activeSnippetApp.client_id}');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', Math.random().toString(36).substring(7));
    
    // Redirect to Zenoa SSO Login
    window.location.href = authUrl.toString();
  };

  return (
    <button 
      onClick={handleLogin}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 20px',
        borderRadius: '12px',
        background: '#0284c7',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '14px',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <span style={{ background: '#fff', color: '#0284c7', borderRadius: '4px', padding: '1px 6px', fontWeight: '900' }}>Z</span>
      Continue with Zenoa
    </button>
  );
}`;
                    } else if (docsLanguage === 'nodejs') {
                      code = `// Node.js Express OAuth Callback Handler
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = '${activeSnippetApp.client_id}';
const CLIENT_SECRET = '${activeSnippetApp.client_secret}';
const ZENOA_SERVER = '${window.location.origin}';

// 1. OAuth Callback Route
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // 2. Exchange code for access token
    const tokenRes = await axios.post(\`\${ZENOA_SERVER}/api/v1/sso/token\`, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code
    });

    const accessToken = tokenRes.data.access_token;
    const userProfile = tokenRes.data.user;

    // 3. Authenticated User Data
    console.log('Logged in as:', userProfile.username, userProfile.email);
    
    // Create session in your app and redirect
    res.redirect('/dashboard');
  } catch (err) {
    res.status(500).send('Zenoa SSO login failed');
  }
});`;
                    }
                    copyToClipboard(code, 'Code snippet');
                  }}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </button>
              </div>

              <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto select-all">
                {docsLanguage === 'react' && (
                  <pre className="text-neutral-200">
{`// React / Next.js "Continue with Zenoa" Button Component
import React from 'react';

export function ZenoaLoginButton() {
  const handleLogin = () => {
    const authUrl = new URL('${window.location.origin}/auth/sso');
    authUrl.searchParams.set('client_id', '${activeSnippetApp.client_id}');
    authUrl.searchParams.set('redirect_uri', '${activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback'}');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', 'random_state_string');
    
    // Redirect to Zenoa Consent Screen
    window.location.href = authUrl.toString();
  };

  return (
    <button 
      onClick={handleLogin}
      className="zenoa-sso-button"
    >
      <span className="zenoa-icon">Z</span>
      <span>Continue with Zenoa</span>
    </button>
  );
}`}
                  </pre>
                )}

                {docsLanguage === 'html' && (
                  <pre className="text-neutral-200">
{`<!-- Standard "Continue with Zenoa" HTML Button -->
<a 
  href="${window.location.origin}/auth/sso?client_id=${activeSnippetApp.client_id}&redirect_uri=${encodeURIComponent(activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback')}&response_type=code"
  style="display:inline-flex;align-items:center;gap:10px;padding:12px 24px;border-radius:12px;background:#0284c7;color:#ffffff;font-family:sans-serif;font-weight:bold;text-decoration:none;font-size:14px;box-shadow:0 4px 14px rgba(2,132,199,0.3);"
>
  <span style="background:#fff;color:#0284c7;border-radius:4px;padding:2px 6px;font-weight:900;">Z</span>
  Continue with Zenoa
</a>`}
                  </pre>
                )}

                {docsLanguage === 'nodejs' && (
                  <pre className="text-neutral-200">
{`// Node.js & Express Callback & Token Exchange
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = '${activeSnippetApp.client_id}';
const CLIENT_SECRET = '${activeSnippetApp.client_secret}';
const ZENOA_SERVER = '${window.location.origin}';

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  // Exchange code for Access Token & User Profile
  const response = await axios.post(\`\${ZENOA_SERVER}/api/v1/sso/token\`, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: code
  });

  const { access_token, user } = response.data;
  console.log('Verified Zenoa User:', user);
  
  // Set auth cookie or JWT session for user
  res.redirect('/dashboard');
});`}
                  </pre>
                )}

                {docsLanguage === 'python' && (
                  <pre className="text-neutral-200">
{`# Python Flask OAuth 2.0 Handler
import requests
from flask import Flask, request, redirect, session

app = Flask(__name__)
CLIENT_ID = '${activeSnippetApp.client_id}'
CLIENT_SECRET = '${activeSnippetApp.client_secret}'
ZENOA_SERVER = '${window.location.origin}'

@app.route('/auth/callback')
def zenoa_callback():
    code = request.args.get('code')
    
    # Exchange code for Bearer Token
    token_resp = requests.post(f"{ZENOA_SERVER}/api/v1/sso/token", json={
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code
    }).json()
    
    user = token_resp.get("user")
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    
    return redirect("/dashboard")`}
                  </pre>
                )}

                {docsLanguage === 'curl' && (
                  <pre className="text-neutral-200">
{`# 1. Exchange Authorization Code for Token
curl -X POST ${window.location.origin}/api/v1/sso/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${activeSnippetApp.client_id}",
    "client_secret": "${activeSnippetApp.client_secret}",
    "code": "zenoa_code_received_in_callback"
  }'

# 2. Fetch User Profile using Access Token
curl -X GET ${window.location.origin}/api/v1/sso/userinfo \\
  -H "Authorization: Bearer zen_token_received_above"`}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OAUTH 2.0 INTERACTIVE TESTER & PLAYGROUND                          */}
        {/* ========================================================================= */}
        {activeTab === 'playground' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">OAuth 2.0 Live Authorization Tester</h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Live Session Active
                  </span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Test authorization code issuance, token exchange, and identity verification using your active Zenoa account.
                </p>
              </div>

              {currentUser && (
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                  themeMode === 'dark' ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
                }`}>
                  <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold border border-sky-500/30 overflow-hidden">
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.username} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.username.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">@{currentUser.username}</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{currentUser.display_name || currentUser.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Application Selector & Actions */}
            <div className={`p-6 rounded-2xl border ${
              themeMode === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                    Select SSO Application to Test
                  </label>
                  {apps.length > 0 ? (
                    <select
                      value={selectedTesterAppId || (apps[0]?.id || '')}
                      onChange={(e) => setSelectedTesterAppId(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        themeMode === 'dark' ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                      }`}
                    >
                      {apps.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.app_name} (Client ID: {app.client_id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-500 font-medium">No registered SSO applications available. Please register an app first.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      const targetApp = getSelectedTesterApp();
                      if (!targetApp) return;
                      const rUri = testRedirectUri || (targetApp.redirect_uris && targetApp.redirect_uris[0]) || `${window.location.origin}/auth/sso`;
                      if (onOpenConsentPreview) {
                        onOpenConsentPreview(targetApp.client_id, rUri);
                      } else {
                        window.open(`/auth/sso?client_id=${encodeURIComponent(targetApp.client_id)}&redirect_uri=${encodeURIComponent(rUri)}`, '_blank');
                      }
                    }}
                    disabled={apps.length === 0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Live Consent Screen</span>
                  </button>

                  <button
                    onClick={async () => {
                      await runSimulatedAuthorize();
                    }}
                    disabled={isTesterRunning || apps.length === 0}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {isTesterRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Run Full Flow API Test</span>
                  </button>
                </div>
              </div>

              {/* Step Pipeline Visualization */}
              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className={`p-4 rounded-xl border ${
                  playgroundStep !== 'idle' ? 'border-sky-500/40 bg-sky-500/5' : themeMode === 'dark' ? 'border-neutral-800 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-500">Step 1</span>
                    {playgroundAuthCode ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-500">
                        Code Issued
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-500/10 text-neutral-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">Authorization Code</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono break-all">
                    {playgroundAuthCode || 'Click "Run Full Flow API Test" to issue single-use auth code'}
                  </p>
                  {playgroundAuthCode && (
                    <button
                      onClick={runSimulatedTokenExchange}
                      disabled={isTesterRunning || playgroundStep === 'token_exchanged' || playgroundStep === 'userinfo_fetched'}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Exchange for Token</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Step 2 */}
                <div className={`p-4 rounded-xl border ${
                  playgroundAccessToken ? 'border-sky-500/40 bg-sky-500/5' : themeMode === 'dark' ? 'border-neutral-800 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-500">Step 2</span>
                    {playgroundAccessToken ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-500">
                        Token Issued
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-500/10 text-neutral-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">Bearer Access Token</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono break-all">
                    {playgroundAccessToken || 'Exchanged using client_secret + auth_code'}
                  </p>
                  {playgroundAccessToken && (
                    <button
                      onClick={runSimulatedUserInfoFetch}
                      disabled={isTesterRunning || playgroundStep === 'userinfo_fetched'}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Fetch UserInfo Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Step 3 */}
                <div className={`p-4 rounded-xl border ${
                  playgroundUserResult ? 'border-emerald-500/40 bg-emerald-500/5' : themeMode === 'dark' ? 'border-neutral-800 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Step 3</span>
                    {playgroundUserResult ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-500">
                        Identity Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-500/10 text-neutral-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">User Identity Verification</h4>
                  {playgroundUserResult ? (
                    <div className="space-y-1 mt-2 text-xs">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">✓ @{playgroundUserResult.username}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{playgroundUserResult.email || playgroundUserResult.display_name}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      UserInfo profile payload returned from /api/v1/sso/userinfo
                    </p>
                  )}
                </div>
              </div>

              {/* Terminal Logs & Output */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-sky-500" />
                    Live OAuth 2.0 Execution Console
                  </span>
                  {testerLog.length > 0 && (
                    <button
                      onClick={() => setTesterLog([])}
                      className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-300 border border-zinc-800 max-h-60 overflow-y-auto space-y-1 shadow-inner">
                  {testerLog.length === 0 ? (
                    <span className="text-zinc-600">// Console output will appear here when running tests...</span>
                  ) : (
                    testerLog.map((logLine, idx) => (
                      <div
                        key={idx}
                        className={
                          logLine.startsWith('✓') ? 'text-emerald-400 font-semibold' :
                          logLine.startsWith('✗') ? 'text-rose-400 font-semibold' :
                          logLine.startsWith('[') ? 'text-sky-400 font-bold' :
                          'text-zinc-400'
                        }
                      >
                        {logLine}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
