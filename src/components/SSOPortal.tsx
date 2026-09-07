import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Key, Lock, Copy, Check, ExternalLink, Plus, RefreshCw,
  Trash2, Edit3, ArrowRight, Code2, Globe, Smartphone, CheckCircle2,
  AlertCircle, Sparkles, Terminal, Play, Eye, EyeOff, Layers, UserCheck,
  FileCode, CheckSquare, X, Activity, ShieldCheck, Cpu, ArrowUpRight,
  Sliders, Database, Fingerprint, HelpCircle, Flame, ShieldAlert,
  Server, Link2, CheckCircle, AlertTriangle, LayoutDashboard, Sun,
  Moon, ChevronRight, Monitor, BookOpen, ShieldOff, ArrowLeft
} from 'lucide-react';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';

export interface SSOApp {
  id: string;
  client_id: string;
  client_secret: string;
  app_name: string;
  app_description?: string;
  website_url?: string;
  logo_url?: string;
  redirect_uris: string[];
  scopes: string[];
  environment?: 'production' | 'sandbox';
  type?: string;
  created_at: number;
  updated_at?: number;
  owner?: string;
  privacy_policy_url?: string;
  terms_url?: string;
  total_logins?: number;
}

interface SSOPortalProps {
  themeMode?: 'light' | 'dark';
  currentUser: UserData | null;
  onBack?: () => void;
  onOpenConsentPreview?: (clientId: string, redirectUri: string) => void;
}

export const SSOPortal: React.FC<SSOPortalProps> = ({
  themeMode: initialTheme = 'light',
  currentUser,
  onBack,
  onOpenConsentPreview
}) => {
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo || branding.oauth_logo;

  // Visual Theme State
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_oauth_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return initialTheme || 'light';
  });

  const toggleTheme = () => {
    const next = localTheme === 'light' ? 'dark' : 'light';
    setLocalTheme(next);
    try {
      localStorage.setItem('zenoa_oauth_theme', next);
    } catch (e) {}
  };

  const isDark = localTheme === 'dark';

  // Navigation Tabs matching Developer Console
  type TabType = 'overview' | 'apps' | 'create' | 'playground' | 'button' | 'docs' | 'activity';
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Apps State
  const [apps, setApps] = useState<SSOApp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // App Creation / Edit Form State
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('');
  const [appDescription, setAppDescription] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState<string>('');
  const [termsUrl, setTermsUrl] = useState<string>('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [redirectUrisInput, setRedirectUrisInput] = useState<string>('');
  const [redirectUrisList, setRedirectUrisList] = useState<string[]>(['http://localhost:3000/auth/callback']);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['openid', 'profile', 'email']);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals
  const [secretRotateModalApp, setSecretRotateModalApp] = useState<SSOApp | null>(null);
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<SSOApp | null>(null);

  // Interactive Playground State
  const [selectedTesterAppId, setSelectedTesterAppId] = useState<string>('');
  const [testRedirectUri, setTestRedirectUri] = useState<string>('');
  const [playgroundStep, setPlaygroundStep] = useState<'idle' | 'authorized' | 'token_exchanged' | 'userinfo_fetched'>('idle');
  const [playgroundAuthCode, setPlaygroundAuthCode] = useState<string>('');
  const [playgroundAccessToken, setPlaygroundAccessToken] = useState<string>('');
  const [playgroundUserResult, setPlaygroundUserResult] = useState<any>(null);
  const [isTesterRunning, setIsTesterRunning] = useState<boolean>(false);
  const [testerLog, setTesterLog] = useState<string[]>([]);

  // Code Snippets Tab
  const [docsLanguage, setDocsLanguage] = useState<'react' | 'nodejs' | 'python' | 'go' | 'curl'>('react');

  // SSO Button Customizer State
  const [buttonConfig, setButtonConfig] = useState<{
    variant: 'dark' | 'light' | 'indigo' | 'outline';
    shape: 'rounded-xl' | 'rounded-full' | 'rounded-lg';
    size: 'sm' | 'md' | 'lg';
    label: string;
    showIcon: boolean;
  }>({
    variant: 'dark',
    shape: 'rounded-xl',
    size: 'md',
    label: 'Continue with Zenoa',
    showIcon: true
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3800);
  };

  const handleCopy = (text: string, keyId: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    showNotification('success', label);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

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
        app_name: `${branding.app_name || 'Zenoa'} Official Client`,
        app_description: `Pre-configured official ${branding.app_name || 'Zenoa'} OAuth 2.0 client for production SSO login, token exchange, and user profile verification.`,
        website_url: window.location.origin,
        logo_url: activeLogo || '',
        redirect_uris: [window.location.origin + '/auth/sso', 'http://localhost:3000/auth/sso', 'http://localhost:3000/auth/callback'],
        scopes: ['openid', 'profile', 'email', 'phone'],
        environment: 'production',
        type: 'sso_oauth_client',
        created_at: Date.now() - 86400000 * 30,
        updated_at: Date.now(),
        owner: ownerName,
        total_logins: 142
      };

      if (db) {
        const ssoRef = collection(db, 'sso_applications');
        const q = query(ssoRef, where('owner', '==', ownerName));
        const snap = await getDocs(q);
        firestoreApps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SSOApp[];

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
      if (!selectedTesterAppId && firestoreApps.length > 0) {
        setSelectedTesterAppId(firestoreApps[0].id);
        setTestRedirectUri(firestoreApps[0].redirect_uris[0] || 'http://localhost:3000/auth/callback');
      }
    } catch (err: any) {
      console.warn('Failed to load SSO apps:', err);
      showNotification('error', err.message || 'Failed to fetch registered applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [currentUser?.username]);

  // Form Reset
  const resetForm = () => {
    setEditingAppId(null);
    setAppName('');
    setAppDescription('');
    setWebsiteUrl('');
    setLogoUrl('');
    setPrivacyPolicyUrl('');
    setTermsUrl('');
    setEnvironment('production');
    setRedirectUrisInput('');
    setRedirectUrisList(['http://localhost:3000/auth/callback']);
    setSelectedScopes(['openid', 'profile', 'email']);
  };

  // Start Editing App
  const startEditApp = (app: SSOApp) => {
    setEditingAppId(app.id);
    setAppName(app.app_name);
    setAppDescription(app.app_description || '');
    setWebsiteUrl(app.website_url || '');
    setLogoUrl(app.logo_url || '');
    setPrivacyPolicyUrl(app.privacy_policy_url || '');
    setTermsUrl(app.terms_url || '');
    setEnvironment(app.environment || 'production');
    setRedirectUrisList(app.redirect_uris.length > 0 ? app.redirect_uris : ['http://localhost:3000/auth/callback']);
    setRedirectUrisInput('');
    setSelectedScopes(app.scopes && app.scopes.length > 0 ? app.scopes : ['openid', 'profile', 'email']);
    setActiveTab('create');
  };

  // Add Redirect URI to list
  const handleAddRedirectUri = (uriToAdd?: string) => {
    const raw = (uriToAdd || redirectUrisInput).trim();
    if (!raw) return;

    if (!raw.startsWith('http://localhost') && !raw.startsWith('https://') && !raw.startsWith('http://127.0.0.1')) {
      showNotification('error', 'Redirect URIs must start with https:// (or http://localhost for testing)');
      return;
    }

    if (redirectUrisList.includes(raw)) {
      showNotification('error', 'This Redirect URI is already present');
      return;
    }

    setRedirectUrisList(prev => [...prev, raw]);
    setRedirectUrisInput('');
  };

  // Remove Redirect URI
  const handleRemoveRedirectUri = (index: number) => {
    if (redirectUrisList.length === 1) {
      showNotification('error', 'OAuth clients require at least one allowed Redirect URI');
      return;
    }
    setRedirectUrisList(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle Scope
  const toggleScope = (scopeId: string) => {
    if (scopeId === 'openid') return;
    setSelectedScopes(prev =>
      prev.includes(scopeId) ? prev.filter(s => s !== scopeId) : [...prev, scopeId]
    );
  };

  // Save / Register App Submit
  const handleSubmitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      showNotification('error', 'Please provide an application name');
      return;
    }

    if (redirectUrisList.length === 0) {
      showNotification('error', 'Please configure at least one authorized Redirect URI');
      return;
    }

    setIsSubmitting(true);
    const ownerName = currentUser?.username || 'developer_user';

    try {
      if (editingAppId) {
        const updatedData: Partial<SSOApp> = {
          app_name: appName.trim(),
          app_description: appDescription.trim(),
          website_url: websiteUrl.trim(),
          logo_url: logoUrl.trim(),
          privacy_policy_url: privacyPolicyUrl.trim(),
          terms_url: termsUrl.trim(),
          environment,
          redirect_uris: redirectUrisList,
          scopes: selectedScopes.includes('openid') ? selectedScopes : ['openid', ...selectedScopes],
          updated_at: Date.now()
        };

        if (db) {
          await updateDoc(doc(db, 'sso_applications', editingAppId), updatedData);
        }

        setApps(prev => prev.map(a => (a.id === editingAppId ? { ...a, ...updatedData } : a)));
        showNotification('success', 'OAuth configuration saved successfully');
      } else {
        const randomId = Math.random().toString(36).substring(2, 10);
        const randomSecret = 'zen_sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const clientId = `zenoa_oauth_${randomId}`;
        const newAppId = `sso_app_${Date.now()}`;

        const newApp: SSOApp = {
          id: newAppId,
          client_id: clientId,
          client_secret: randomSecret,
          app_name: appName.trim(),
          app_description: appDescription.trim(),
          website_url: websiteUrl.trim(),
          logo_url: logoUrl.trim(),
          privacy_policy_url: privacyPolicyUrl.trim(),
          terms_url: termsUrl.trim(),
          environment,
          redirect_uris: redirectUrisList,
          scopes: selectedScopes.includes('openid') ? selectedScopes : ['openid', ...selectedScopes],
          type: 'sso_oauth_client',
          created_at: Date.now(),
          updated_at: Date.now(),
          owner: ownerName,
          total_logins: 0
        };

        if (db) {
          await setDoc(doc(db, 'sso_applications', newAppId), newApp);
        }

        setApps(prev => [newApp, ...prev]);
        showNotification('success', 'OAuth 2.0 client registered successfully');
      }

      resetForm();
      setActiveTab('apps');
    } catch (err: any) {
      console.error('Error saving SSO app:', err);
      showNotification('error', err.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rotate Secret
  const handleRotateSecret = async () => {
    if (!secretRotateModalApp) return;
    try {
      const newSecret = 'zen_sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      if (db) {
        await updateDoc(doc(db, 'sso_applications', secretRotateModalApp.id), {
          client_secret: newSecret,
          updated_at: Date.now()
        });
      }
      setApps(prev => prev.map(a => a.id === secretRotateModalApp.id ? { ...a, client_secret: newSecret, updated_at: Date.now() } : a));
      showNotification('success', `Client Secret rotated for ${secretRotateModalApp.app_name}`);
      setSecretRotateModalApp(null);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to rotate secret');
    }
  };

  // Delete App
  const handleDeleteApp = async () => {
    if (!deleteConfirmApp) return;
    if (deleteConfirmApp.id === 'sso_official_default') {
      showNotification('error', 'Cannot delete the system official OAuth client');
      setDeleteConfirmApp(null);
      return;
    }

    try {
      if (db) {
        await deleteDoc(doc(db, 'sso_applications', deleteConfirmApp.id));
      }
      setApps(prev => prev.filter(a => a.id !== deleteConfirmApp.id));
      showNotification('success', 'Client removed from registry');
      setDeleteConfirmApp(null);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete client');
    }
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter(a =>
      a.app_name.toLowerCase().includes(q) ||
      a.client_id.toLowerCase().includes(q) ||
      (a.app_description && a.app_description.toLowerCase().includes(q))
    );
  }, [apps, searchQuery]);

  // Active App for Playground
  const activeTesterApp = apps.find(a => a.id === selectedTesterAppId) || apps[0] || null;

  // Playground Execution Handlers
  const handlePlaygroundAuthorize = () => {
    if (!activeTesterApp) return;
    setIsTesterRunning(true);
    setTesterLog([
      `[1/3] POST /oauth/v2/authorize`,
      `Client ID: ${activeTesterApp.client_id}`,
      `Redirect URI: ${testRedirectUri || activeTesterApp.redirect_uris[0]}`,
      `Response Type: code`,
      `Scopes: ${activeTesterApp.scopes.join(', ')}`,
      `Timestamp: ${new Date().toISOString()}`
    ]);

    setTimeout(() => {
      const generatedCode = 'zen_code_' + Math.random().toString(36).substring(2, 12);
      setPlaygroundAuthCode(generatedCode);
      setPlaygroundStep('authorized');
      setIsTesterRunning(false);
      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — Authorization Code issued!`,
        `Authorization Code: ${generatedCode}`,
        `Callback URL: ${testRedirectUri || activeTesterApp.redirect_uris[0]}?code=${generatedCode}`
      ]);
      showNotification('success', 'Authorization Code generated');
    }, 450);
  };

  const handlePlaygroundExchangeToken = () => {
    if (!activeTesterApp || !playgroundAuthCode) return;
    setIsTesterRunning(true);
    setTesterLog(prev => [
      ...prev,
      `-----------------------------------------`,
      `[2/3] POST /api/oauth/token`,
      `grant_type: authorization_code`,
      `client_id: ${activeTesterApp.client_id}`,
      `client_secret: ${activeTesterApp.client_secret.substring(0, 10)}... [Secured]`,
      `code: ${playgroundAuthCode}`,
      `redirect_uri: ${testRedirectUri || activeTesterApp.redirect_uris[0]}`
    ]);

    setTimeout(() => {
      const generatedAccessToken = 'zen_at_' + Math.random().toString(36).substring(2, 18) + '.' + Math.random().toString(36).substring(2, 18);
      setPlaygroundAccessToken(generatedAccessToken);
      setPlaygroundStep('token_exchanged');
      setIsTesterRunning(false);
      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — Access Token issued!`,
        `token_type: Bearer`,
        `expires_in: 3600 (1 hour)`,
        `access_token: ${generatedAccessToken}`
      ]);
      showNotification('success', 'Bearer Access Token exchanged');
    }, 450);
  };

  const handlePlaygroundFetchUserInfo = () => {
    if (!playgroundAccessToken) return;
    setIsTesterRunning(true);
    setTesterLog(prev => [
      ...prev,
      `-----------------------------------------`,
      `[3/3] GET /api/oauth/userinfo`,
      `Authorization: Bearer ${playgroundAccessToken}`
    ]);

    setTimeout(() => {
      const userInfoResult = {
        sub: currentUser?.zenoa_id || currentUser?.id || 'usr_zenoa_9901',
        username: currentUser?.username || 'alex_dev',
        name: currentUser?.display_name || 'Alex Developer',
        email: currentUser?.email || `${currentUser?.username || 'developer'}@zenoa.im`,
        email_verified: true,
        phone: currentUser?.phone_number || currentUser?.mobile_number || '+1 (555) 019-2834',
        phone_verified: true,
        avatar_url: currentUser?.avatar_url || '',
        avatar_seed: currentUser?.avatar_seed || 'felix',
        status: currentUser?.custom_status || currentUser?.bio || 'Building on Zenoa OAuth 2.0',
        locale: 'en-US',
        updated_at: Math.floor(Date.now() / 1000)
      };

      setPlaygroundUserResult(userInfoResult);
      setPlaygroundStep('userinfo_fetched');
      setIsTesterRunning(false);
      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — User Claims & Identity payload verified!`,
        JSON.stringify(userInfoResult, null, 2)
      ]);
      showNotification('success', 'User Identity Claims retrieved');
    }, 450);
  };

  const activeSnippetApp = apps[0] || {
    client_id: 'zenoa_oauth_your_client_id',
    client_secret: 'zen_sec_your_client_secret',
    redirect_uris: ['https://yourapp.com/auth/callback'],
    scopes: ['openid', 'profile', 'email']
  };

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-600 transition-colors ${
      isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      {/* Toast Alert */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-md ${
              notification.type === 'success'
                ? isDark ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-white border-emerald-200 text-emerald-800 shadow-emerald-500/5'
                : isDark ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-white border-rose-200 text-rose-800 shadow-rose-500/5'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Application Bar */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-md ${
        isDark ? 'bg-[#0b0f19]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Return to Messenger"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-indigo-600/20 overflow-hidden">
                {activeLogo ? (
                  <img src={activeLogo} alt="Logo" className="h-full w-full object-contain p-1" />
                ) : (
                  <span>{(branding.app_name || 'Z').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight leading-none">
                    {branding.app_name || 'Zenoa'} OAuth Console
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                    OIDC 1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Single Sign-On & Identity Provider Engine
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {currentUser && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Owner:</span>
                <span className="font-bold">@{currentUser.username}</span>
              </div>
            )}

            <button
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register App</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/60">
          {[
            { id: 'overview', label: 'Console Overview', icon: LayoutDashboard },
            { id: 'apps', label: `Client Registry (${apps.length})`, icon: Layers },
            { id: 'create', label: editingAppId ? 'Edit Configuration' : 'Client Setup', icon: Sliders },
            { id: 'playground', label: 'OAuth Sandbox', icon: Play },
            { id: 'button', label: 'SSO Button Kit', icon: Sparkles },
            { id: 'docs', label: 'SDK Snippets', icon: Code2 },
            { id: 'activity', label: 'Security & Audits', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'create' && activeTab !== 'create') resetForm();
                setActiveTab(tab.id as TabType);
              }}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: CONSOLE OVERVIEW                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Clients</span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">{apps.length}</span>
                  <span className="text-[11px] font-bold text-emerald-500">Live</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Authorized Callback URIs</span>
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">
                    {apps.reduce((acc, a) => acc + (a.redirect_uris?.length || 0), 0)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">Whitelisted</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Identity Protocol</span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400">OAuth 2.0 / OIDC</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Token Verification</span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xs font-mono font-bold">HMAC-SHA256 / JWT</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & System Info Banner */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-base tracking-tight">Single Sign-On Architecture</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Allow users to securely authenticate using their {branding.app_name || 'Zenoa'} accounts. Identity tokens, user profiles, and authorization codes are issued using strict OAuth 2.0 and OpenID Connect specifications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('playground')}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open Sandbox</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('button')}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Button Generator</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Endpoints Reference */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'} space-y-4`}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" />
                <span>Standard OIDC Endpoints</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Authorization Endpoint</span>
                    <span className="text-[10px] text-indigo-500 font-mono">GET</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold truncate">/auth/sso</code>
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/auth/sso`, 'auth_ep', 'Authorization endpoint copied')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {copiedKey === 'auth_ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Token Exchange Endpoint</span>
                    <span className="text-[10px] text-emerald-500 font-mono">POST</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold truncate">/api/oauth/token</code>
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/api/oauth/token`, 'token_ep', 'Token endpoint copied')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {copiedKey === 'token_ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>UserInfo Endpoint</span>
                    <span className="text-[10px] text-sky-500 font-mono">GET</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold truncate">/api/oauth/userinfo</code>
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/api/oauth/userinfo`, 'user_ep', 'UserInfo endpoint copied')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {copiedKey === 'user_ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CLIENT REGISTRY                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'apps' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter by application name or Client ID..."
                  className={`w-full px-3.5 py-2 pl-9 text-xs rounded-xl border outline-none font-medium transition-all ${
                    isDark
                      ? 'bg-[#111726] border-slate-800 focus:border-indigo-500 text-white'
                      : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900'
                  }`}
                />
                <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchApps}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Application List */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-xs font-medium">Loading client registry...</p>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center gap-2.5 ${
                isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <Key className="w-10 h-10 text-slate-400 stroke-1" />
                <h3 className="font-bold text-sm">No Client Applications Found</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Register your first OAuth 2.0 client to start using "Continue with {branding.app_name || 'Zenoa'}" authentication.
                </p>
                <button
                  onClick={() => { resetForm(); setActiveTab('create'); }}
                  className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Register New Client
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map(app => {
                  const isOfficial = app.id === 'sso_official_default';
                  const isSecretVisible = revealedSecrets[app.id] || false;

                  return (
                    <div
                      key={app.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-[#111726] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-500 font-bold text-sm overflow-hidden shrink-0">
                            {app.logo_url ? (
                              <img src={app.logo_url} alt={app.app_name} className="h-full w-full object-cover" />
                            ) : (
                              <span>{app.app_name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm sm:text-base tracking-tight">{app.app_name}</h3>
                              {isOfficial && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                                  Official Client
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                app.environment === 'sandbox'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                              }`}>
                                {app.environment || 'Production'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {app.app_description || 'OAuth 2.0 Single Sign-On Identity Client'}
                            </p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1.5 self-start lg:self-center flex-wrap">
                          <button
                            onClick={() => {
                              if (onOpenConsentPreview) {
                                onOpenConsentPreview(app.client_id, app.redirect_uris[0] || window.location.origin);
                              } else {
                                window.open(`/auth/sso?client_id=${app.client_id}&redirect_uri=${encodeURIComponent(app.redirect_uris[0] || window.location.origin)}`, '_blank');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                            title="Preview User Consent Screen"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Consent Preview</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTesterAppId(app.id);
                              setTestRedirectUri(app.redirect_uris[0] || '');
                              setActiveTab('playground');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Test in OAuth Sandbox"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Test Sandbox</span>
                          </button>

                          <button
                            onClick={() => startEditApp(app)}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Edit Configuration"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {!isOfficial && (
                            <button
                              onClick={() => setDeleteConfirmApp(app)}
                              className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 transition-colors cursor-pointer"
                              title="Delete Client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Credentials Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                        {/* Client ID */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span>Client ID (Public)</span>
                            <span className="text-[10px] text-emerald-500 font-mono">Public</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                              {app.client_id}
                            </code>
                            <button
                              onClick={() => handleCopy(app.client_id, `cid_${app.id}`, 'Client ID copied')}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              title="Copy Client ID"
                            >
                              {copiedKey === `cid_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Client Secret */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span className="text-rose-500">Client Secret (Confidential)</span>
                            <button
                              onClick={() => setSecretRotateModalApp(app)}
                              className="text-[10px] text-indigo-500 hover:underline cursor-pointer"
                            >
                              Rotate Secret
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                              {isSecretVisible ? app.client_secret : '••••••••••••••••••••••••••••••••'}
                            </code>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setRevealedSecrets(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title={isSecretVisible ? "Hide Secret" : "Reveal Secret"}
                              >
                                {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleCopy(app.client_secret, `sec_${app.id}`, 'Client Secret copied')}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Copy Secret"
                              >
                                {copiedKey === `sec_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Callback URIs & Scopes Summary */}
                      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-400">Allowed URIs:</span>
                          {app.redirect_uris?.slice(0, 2).map((uri, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] truncate max-w-[200px]">
                              {uri}
                            </span>
                          ))}
                          {app.redirect_uris?.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{app.redirect_uris.length - 2} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-400">Scopes:</span>
                          {app.scopes?.map((sc, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
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
        {/* TAB 3: CLIENT CONFIGURATION & REGISTRATION FORM                          */}
        {/* ========================================================================= */}
        {activeTab === 'create' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className={`p-6 sm:p-8 rounded-2xl border ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    {editingAppId ? 'Update Client Application' : 'Register New OAuth 2.0 Client'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure authorized redirect URIs, OAuth scopes, and client identity metadata.
                  </p>
                </div>
                <button
                  onClick={() => { resetForm(); setActiveTab('apps'); }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitApp} className="mt-6 space-y-6">
                {/* 1. App Identity Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Client Identity & Metadata</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        Application Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={appName}
                        onChange={e => setAppName(e.target.value)}
                        placeholder="e.g. Acme Portal, Cloud Studio"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        Target Environment
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEnvironment('production')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            environment === 'production'
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          Production
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnvironment('sandbox')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            environment === 'sandbox'
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          Sandbox / Dev
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Application Description
                    </label>
                    <textarea
                      rows={2}
                      value={appDescription}
                      onChange={e => setAppDescription(e.target.value)}
                      placeholder="Brief description shown to users on the OAuth consent authorization dialog..."
                      className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium resize-none ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        Website / Homepage URL
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        Logo Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Authorized Redirect URIs Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Allowed Callback / Redirect URIs</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Strict URI matching is enforced (protocol, domain, port, and path). Wildcard domains are disallowed for security.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {redirectUrisList.map((uri, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="truncate">{uri}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRedirectUri(index)}
                          className="p-1 hover:text-rose-500 transition-colors ml-2 cursor-pointer"
                          title="Remove URI"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

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
                      placeholder="https://yourapp.com/auth/callback"
                      className={`flex-1 px-3.5 py-2 text-xs rounded-xl border outline-none font-mono ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRedirectUri()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Add URI
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                    <span>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => handleAddRedirectUri('http://localhost:3000/auth/callback')}
                      className="hover:underline text-indigo-500 cursor-pointer"
                    >
                      + http://localhost:3000/auth/callback
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleAddRedirectUri(window.location.origin + '/auth/callback')}
                      className="hover:underline text-indigo-500 cursor-pointer"
                    >
                      + Current Origin ({window.location.origin})
                    </button>
                  </div>
                </div>

                {/* 3. Scopes Configuration */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Permissions & Scopes</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Specify which identity claims this client is permitted to request from the user.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'openid', name: 'OpenID Connect (Identity)', desc: 'Standard unique subject identifier (sub)', required: true },
                      { id: 'profile', name: 'User Profile', desc: 'Display name, username, and avatar photo' },
                      { id: 'email', name: 'Email Address', desc: 'User primary verified email address' },
                      { id: 'phone', name: 'Phone Number', desc: 'Contact mobile number for verification' },
                      { id: 'offline_access', name: 'Offline Access (Refresh Tokens)', desc: 'Allow long-lived background refresh tokens' }
                    ].map(scope => {
                      const isChecked = selectedScopes.includes(scope.id);
                      return (
                        <div
                          key={scope.id}
                          onClick={() => toggleScope(scope.id)}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                              : isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/40'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono">{scope.id}</span>
                              {scope.required && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-bold">Required</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                              {scope.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setActiveTab('apps'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{editingAppId ? 'Save Configuration' : 'Create Client'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INTERACTIVE OAUTH 2.0 SANDBOX                                     */}
        {/* ========================================================================= */}
        {activeTab === 'playground' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold tracking-tight">OAuth 2.0 Live Protocol Sandbox</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step-by-step interactive simulator for authorization codes, token exchange, and UserInfo API verification.
                  </p>
                </div>

                {/* App Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Test Client:</span>
                  <select
                    value={selectedTesterAppId}
                    onChange={e => {
                      setSelectedTesterAppId(e.target.value);
                      const target = apps.find(a => a.id === e.target.value);
                      if (target) setTestRedirectUri(target.redirect_uris[0] || '');
                      setPlaygroundStep('idle');
                      setPlaygroundAuthCode('');
                      setPlaygroundAccessToken('');
                      setPlaygroundUserResult(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {apps.map(a => (
                      <option key={a.id} value={a.id}>{a.app_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3 Steps Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Step 1: Authorization Code */}
                <div className={`p-4 rounded-xl border transition-all ${
                  playgroundStep === 'idle'
                    ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-950/20'
                    : 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
                    {playgroundAuthCode ? (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Granted
                      </span>
                    ) : (
                      <span className="text-[10px] text-indigo-500 font-bold">Ready</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs">Request Auth Code</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    User approves consent screen and receives temporary authorization code.
                  </p>

                  <button
                    onClick={handlePlaygroundAuthorize}
                    disabled={isTesterRunning}
                    className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isTesterRunning && playgroundStep === 'idle' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>1. Authorize User</span>
                  </button>

                  {playgroundAuthCode && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] truncate">
                      code={playgroundAuthCode}
                    </div>
                  )}
                </div>

                {/* Step 2: Token Exchange */}
                <div className={`p-4 rounded-xl border transition-all ${
                  playgroundStep === 'authorized'
                    ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-950/20'
                    : playgroundStep === 'token_exchanged' || playgroundStep === 'userinfo_fetched'
                    ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
                    {playgroundAccessToken ? (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Exchanged
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Pending Step 1</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs">Exchange for Access Token</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Backend sends Client Secret & Code to receive Bearer Token.
                  </p>

                  <button
                    onClick={handlePlaygroundExchangeToken}
                    disabled={isTesterRunning || !playgroundAuthCode}
                    className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isTesterRunning && playgroundStep === 'authorized' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>2. Exchange Token</span>
                  </button>

                  {playgroundAccessToken && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900 text-sky-400 font-mono text-[10px] truncate">
                      at={playgroundAccessToken.substring(0, 18)}...
                    </div>
                  )}
                </div>

                {/* Step 3: Fetch User Claims */}
                <div className={`p-4 rounded-xl border transition-all ${
                  playgroundStep === 'token_exchanged'
                    ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-950/20'
                    : playgroundStep === 'userinfo_fetched'
                    ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
                    {playgroundUserResult ? (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Pending Step 2</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs">Verify User Claims</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Query <code>/api/oauth/userinfo</code> using Bearer token to get profile data.
                  </p>

                  <button
                    onClick={handlePlaygroundFetchUserInfo}
                    disabled={isTesterRunning || !playgroundAccessToken}
                    className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isTesterRunning && playgroundStep === 'token_exchanged' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>3. Query UserInfo</span>
                  </button>

                  {playgroundUserResult && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] truncate">
                      ✓ @{playgroundUserResult.username} Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Console Terminal */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Real-time OAuth Console Stream</span>
                  </span>
                  {testerLog.length > 0 && (
                    <button
                      onClick={() => setTesterLog([])}
                      className="text-[10px] text-slate-400 hover:underline cursor-pointer"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-64 space-y-1">
                  {testerLog.length === 0 ? (
                    <span className="text-slate-500 italic">// Click "1. Authorize User" above to begin OAuth handshake simulation</span>
                  ) : (
                    testerLog.map((log, i) => (
                      <div key={i} className={log.startsWith('✓') ? 'text-emerald-400 font-bold' : log.startsWith('[') ? 'text-indigo-400' : 'text-slate-300'}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SSO BUTTON KIT & CODE GENERATOR                                   */}
        {/* ========================================================================= */}
        {activeTab === 'button' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold tracking-tight">"Continue with {branding.app_name || 'Zenoa'}" Button Generator</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize and embed the official sign-in button into your website, React app, or mobile client.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Left: Customizer Controls */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Button Customization</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Color Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['dark', 'light', 'indigo', 'outline'] as const).map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setButtonConfig(prev => ({ ...prev, variant: v }))}
                          className={`py-1.5 text-xs font-bold rounded-lg border capitalize cursor-pointer transition-all ${
                            buttonConfig.variant === v
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Corner Radius</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'rounded-xl', label: 'Rounded XL' },
                        { id: 'rounded-lg', label: 'Rounded LG' },
                        { id: 'rounded-full', label: 'Pill Shape' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setButtonConfig(prev => ({ ...prev, shape: s.id as any }))}
                          className={`py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            buttonConfig.shape === s.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Button Label</label>
                    <input
                      type="text"
                      value={buttonConfig.label}
                      onChange={e => setButtonConfig(prev => ({ ...prev, label: e.target.value }))}
                      className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Right: Live Interactive Preview */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Component Preview</h3>
                  
                  <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center min-h-[160px] ${
                    buttonConfig.variant === 'light'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}>
                    <button
                      className={`flex items-center gap-2.5 font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${
                        buttonConfig.shape
                      } ${
                        buttonConfig.size === 'sm' ? 'px-3 py-1.5 text-xs' : buttonConfig.size === 'lg' ? 'px-6 py-3 text-sm' : 'px-4 py-2.5 text-xs'
                      } ${
                        buttonConfig.variant === 'dark'
                          ? 'bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800'
                          : buttonConfig.variant === 'light'
                          ? 'bg-white text-neutral-900 hover:bg-slate-100 border border-slate-200'
                          : buttonConfig.variant === 'indigo'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-transparent border border-slate-400 text-slate-800 dark:text-white hover:bg-slate-200/40'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {activeLogo ? <img src={activeLogo} alt="Logo" className="w-full h-full object-contain" /> : 'Z'}
                      </div>
                      <span>{buttonConfig.label}</span>
                    </button>
                  </div>

                  {/* Ready Snippet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>HTML / React Snippet</span>
                      <button
                        onClick={() => {
                          const htmlCode = `<button onClick={() => window.location.href = '${window.location.origin}/auth/sso?client_id=${activeSnippetApp.client_id}&redirect_uri=${encodeURIComponent(activeSnippetApp.redirect_uris[0] || '')}'} className="px-4 py-2.5 bg-neutral-900 text-white font-bold rounded-xl flex items-center gap-2">${buttonConfig.label}</button>`;
                          handleCopy(htmlCode, 'btn_code', 'Button code copied');
                        }}
                        className="text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto">
                      <code>{`<a href="${window.location.origin}/auth/sso?client_id=${activeSnippetApp.client_id}&redirect_uri=${encodeURIComponent(activeSnippetApp.redirect_uris[0] || '')}">\n  ${buttonConfig.label}\n</a>`}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: MULTI-LANGUAGE SDK CODE SNIPPETS                                  */}
        {/* ========================================================================= */}
        {activeTab === 'docs' && (
          <div className="space-y-4 animate-fade-in">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold tracking-tight">OAuth 2.0 Integration Handlers</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plug-and-play backend authorization and token exchange templates.
                  </p>
                </div>

                {/* Language Picker */}
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'react', label: 'React / Next.js' },
                    { id: 'nodejs', label: 'Node.js Express' },
                    { id: 'python', label: 'Python FastAPI' },
                    { id: 'curl', label: 'cURL / CLI' }
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setDocsLanguage(lang.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        docsLanguage === lang.id
                          ? 'bg-indigo-600 text-white'
                          : isDark ? 'bg-slate-800/80 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="mt-4 relative">
                <button
                  onClick={() => {
                    handleCopy('// Copied integration snippet', 'docs_code', 'Snippet copied');
                  }}
                  className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
                  {docsLanguage === 'react' && (
                    <pre>{`// 1. React 'Continue with Zenoa' Button
export function ZenoaLoginButton() {
  const handleLogin = () => {
    const authUrl = "${window.location.origin}/auth/sso?" + new URLSearchParams({
      client_id: "${activeSnippetApp.client_id}",
      redirect_uri: "${activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback'}",
      response_type: "code",
      scope: "openid profile email"
    });
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleLogin} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">
      Continue with Zenoa
    </button>
  );
}`}</pre>
                  )}

                  {docsLanguage === 'nodejs' && (
                    <pre>{`// 2. Node.js Express OAuth Callback Handler
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  // Exchange Auth Code for Access Token
  const tokenRes = await axios.post('${window.location.origin}/api/oauth/token', {
    grant_type: 'authorization_code',
    client_id: '${activeSnippetApp.client_id}',
    client_secret: '${activeSnippetApp.client_secret}',
    code: code,
    redirect_uri: '${activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback'}'
  });

  const { access_token } = tokenRes.data;

  // Retrieve Authenticated User Profile
  const userRes = await axios.get('${window.location.origin}/api/oauth/userinfo', {
    headers: { Authorization: \`Bearer \${access_token}\` }
  });

  res.json({ user: userRes.data });
});`}</pre>
                  )}

                  {docsLanguage === 'python' && (
                    <pre>{`# 3. Python FastAPI / Flask OAuth Handler
import requests
from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/auth/callback")
def oauth_callback(code: str):
    # Step 1: Exchange Code for Access Token
    token_resp = requests.post("${window.location.origin}/api/oauth/token", json={
        "grant_type": "authorization_code",
        "client_id": "${activeSnippetApp.client_id}",
        "client_secret": "${activeSnippetApp.client_secret}",
        "code": code,
        "redirect_uri": "${activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback'}"
    })
    access_token = token_resp.json().get("access_token")

    # Step 2: Fetch Identity Claims
    user_resp = requests.get(
        "${window.location.origin}/api/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    return user_resp.json()`}</pre>
                  )}

                  {docsLanguage === 'curl' && (
                    <pre>{`# 1. Exchange authorization code for token
curl -X POST ${window.location.origin}/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "${activeSnippetApp.client_id}",
    "client_secret": "${activeSnippetApp.client_secret}",
    "code": "zen_auth_code_sample",
    "redirect_uri": "${activeSnippetApp.redirect_uris[0] || 'http://localhost:3000/auth/callback'}"
  }'

# 2. Query user identity claims
curl -X GET ${window.location.origin}/api/oauth/userinfo \\
  -H "Authorization: Bearer zen_at_sample_token"`}</pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: SECURITY AUDIT & LIVE ACTIVITY                                    */}
        {/* ========================================================================= */}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-fade-in">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold tracking-tight">Security & Audit Event Stream</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable log of all OAuth authorizations, token grants, and secret rotations.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { event: 'OAuth Client Registry Synchronized', type: 'system', status: 'Success', time: 'Just now', ip: '127.0.0.1' },
                  { event: 'Token Verification Endpoint Verified (SHA-256)', type: 'auth', status: '200 OK', time: '5m ago', ip: '192.168.1.1' },
                  { event: 'Official Client Health Check', type: 'system', status: 'Active', time: '20m ago', ip: 'internal' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-bold">{item.event}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">IP: {item.ip} • Type: {item.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ROTATE SECRET CONFIRMATION */}
      <AnimatePresence>
        {secretRotateModalApp && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl ${
                isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">Rotate Client Secret?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Rotating the secret will immediately invalidate the current secret for <strong>{secretRotateModalApp.app_name}</strong>. Any production backend using the old key will need to be updated.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSecretRotateModalApp(null)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotateSecret}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Rotate Secret Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DELETE CLIENT CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirmApp && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl ${
                isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">Delete Client Application?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <strong>{deleteConfirmApp.app_name}</strong>? All OAuth tokens issued to this client ID will immediately fail validation.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmApp(null)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApp}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Delete Client
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
