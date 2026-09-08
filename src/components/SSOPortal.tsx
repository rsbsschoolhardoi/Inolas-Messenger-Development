import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Key, Lock, Copy, Check, ExternalLink, Plus, RefreshCw,
  Trash2, Edit3, ArrowRight, Code2, Globe, Smartphone, CheckCircle2,
  AlertCircle, Sparkles, Terminal, Play, Eye, EyeOff, Layers, UserCheck,
  FileCode, CheckSquare, X, Activity, ShieldCheck, Cpu, ArrowUpRight,
  Sliders, Database, Fingerprint, HelpCircle, Flame, ShieldAlert,
  Server, Link2, CheckCircle, AlertTriangle, LayoutDashboard, Sun,
  Moon, ChevronRight, Monitor, BookOpen, ShieldOff, ArrowLeft, Menu,
  LogOut, Hash, Sparkle, Laptop, CheckCheck
} from 'lucide-react';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { BrandLogo } from './common/BrandLogo';
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

export type SSOTabType = 'overview' | 'apps' | 'create' | 'playground' | 'button' | 'docs' | 'activity';

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

  // Navigation State
  const [activeTab, setActiveTab] = useState<SSOTabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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

  const getAccountsAuthUrl = () => {
    if (typeof window === 'undefined') return '/auth/sso';
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('zenoa.sbs')) {
      return 'https://accounts.zenoa.sbs/auth/sso';
    }
    const parts = hostname.split('.');
    if (parts.length >= 2 && !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('run.app')) {
      return `https://accounts.${parts.slice(-2).join('.')}/auth/sso`;
    }
    return `${window.location.origin}/auth/sso`;
  };

  const getApiTokenUrl = () => {
    if (typeof window === 'undefined') return '/api/oauth/token';
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('zenoa.sbs')) {
      return 'https://accounts.zenoa.sbs/api/oauth/token';
    }
    return `${window.location.origin}/api/oauth/token`;
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
    setMobileMenuOpen(false);
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
      `[1/3] POST /auth/sso`,
      `client_id: ${activeTesterApp.client_id}`,
      `redirect_uri: ${testRedirectUri || activeTesterApp.redirect_uris[0]}`,
      `response_type: code`,
      `scope: ${activeTesterApp.scopes.join(' ')}`,
      `timestamp: ${new Date().toISOString()}`
    ]);

    setTimeout(() => {
      const generatedCode = 'zen_code_' + Math.random().toString(36).substring(2, 12);
      setPlaygroundAuthCode(generatedCode);
      setPlaygroundStep('authorized');
      setIsTesterRunning(false);
      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — Authorization Code issued!`,
        `code: ${generatedCode}`,
        `callback: ${testRedirectUri || activeTesterApp.redirect_uris[0]}?code=${generatedCode}`
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
        `✓ 200 OK — Bearer Access Token issued!`,
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
        zenoa_id: currentUser?.zenoa_id || `${currentUser?.username || 'developer'}@zenoa`,
        username: currentUser?.username || 'alex_dev',
        name: currentUser?.display_name || 'Alex Developer',
        email: currentUser?.email || currentUser?.zenoa_id || `${currentUser?.username || 'developer'}@zenoa`,
        email_verified: Boolean(currentUser?.email),
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
        `✓ 200 OK — User Identity Claims payload verified!`,
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

  // Nav item component helper
  const renderNavItem = (id: SSOTabType, label: string, Icon: any, badge?: string) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => {
          if (id === 'create' && activeTab !== 'create') resetForm();
          setActiveTab(id);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
          isActive
            ? isDark
              ? 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/80 shadow-xs'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs'
            : isDark
            ? 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : 'text-slate-400'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
            isActive
              ? isDark ? 'bg-indigo-900/80 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
              : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors ${
      isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Toast Alert */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-md ${
              notification.type === 'success'
                ? isDark ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300' : 'bg-white border-emerald-200 text-emerald-800 shadow-emerald-500/5'
                : isDark ? 'bg-rose-950/90 border-rose-800 text-rose-300' : 'bg-white border-rose-200 text-rose-800 shadow-rose-500/5'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <span className="truncate max-w-xs">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION (Matching Developer Console)                    */}
      {/* ========================================================================= */}
      <aside className={`hidden md:flex flex-col w-64 border-r shrink-0 select-none ${
        isDark ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200'
      }`}>
        {/* Brand Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo
              src={activeLogo}
              name={branding.app_name || 'Zenoa'}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight truncate text-slate-900 dark:text-white">
                  {branding.app_name || 'Zenoa'} OAuth
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  OIDC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Identity & Single Sign-On
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 p-3.5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Section: Main & Registry */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Identity & SSO
            </div>
            <div className="space-y-1">
              {renderNavItem('overview', 'Console Overview', LayoutDashboard)}
              {renderNavItem('apps', 'Client Registry', Key, `${apps.length}`)}
              {renderNavItem('create', editingAppId ? 'Edit Configuration' : 'Register New Client', Sliders)}
            </div>
          </div>

          {/* Section: Tools & Testing */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Sandbox & Simulator
            </div>
            <div className="space-y-1">
              {renderNavItem('playground', 'OAuth 2.0 Sandbox', Play, 'Live')}
              {renderNavItem('button', 'SSO Button Kit', Sparkles)}
            </div>
          </div>

          {/* Section: Integration & Audit */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Integration & Security
            </div>
            <div className="space-y-1">
              {renderNavItem('docs', 'SDKs & Reference', Code2, 'v1.0')}
              {renderNavItem('activity', 'Security & Audit', Activity)}
            </div>
          </div>
        </div>

        {/* User Account & Footer in Sidebar */}
        <div className={`p-3.5 border-t ${
          isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="User" className="h-full w-full object-cover" />
                ) : (
                  <span>{(currentUser?.username || 'D').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{currentUser?.display_name || currentUser?.username || 'Developer'}</p>
                <p className="text-[10px] text-slate-400 truncate">@{currentUser?.username || 'dev'}</p>
              </div>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl border transition-colors cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 ${
                  isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                }`}
                title="Return to Messenger"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER OVERLAY                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r shadow-2xl md:hidden ${
                isDark ? 'bg-[#0f1422] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <BrandLogo
                    src={activeLogo}
                    name={branding.app_name || 'Zenoa'}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold truncate">{branding.app_name || 'Zenoa'} OAuth</h2>
                    <p className="text-[10px] text-slate-400">Developer Identity</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  {renderNavItem('overview', 'Console Overview', LayoutDashboard)}
                  {renderNavItem('apps', 'Client Registry', Key, `${apps.length}`)}
                  {renderNavItem('create', editingAppId ? 'Edit Configuration' : 'Register New Client', Sliders)}
                  {renderNavItem('playground', 'OAuth 2.0 Sandbox', Play)}
                  {renderNavItem('button', 'SSO Button Kit', Sparkles)}
                  {renderNavItem('docs', 'SDKs & Reference', Code2)}
                  {renderNavItem('activity', 'Security & Audit', Activity)}
                </div>
              </div>

              <div className="p-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold truncate">@{currentUser?.username || 'dev'}</span>
                </div>
                {onBack && (
                  <button
                    onClick={onBack}
                    className="text-xs font-semibold text-rose-500 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE VIEWPORT                                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 backdrop-blur-md z-10 ${
          isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-xl border md:hidden transition-colors cursor-pointer shrink-0 ${
                isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold tracking-tight truncate text-slate-900 dark:text-white">
                {activeTab === 'overview' && 'Console Overview'}
                {activeTab === 'apps' && 'OAuth 2.0 Client Registry'}
                {activeTab === 'create' && (editingAppId ? 'Update Client Configuration' : 'Register Application')}
                {activeTab === 'playground' && 'Interactive OAuth 2.0 Sandbox'}
                {activeTab === 'button' && 'Single Sign-On (SSO) Button Kit'}
                {activeTab === 'docs' && 'SDKs & API Reference'}
                {activeTab === 'activity' && 'Security & Audit Logs'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                {activeTab === 'overview' && 'System status, identity protocol metrics, and OAuth endpoints.'}
                {activeTab === 'apps' && 'Manage your registered client applications, credentials, and callback URIs.'}
                {activeTab === 'create' && 'Configure application details, allowed redirect URIs, and scopes.'}
                {activeTab === 'playground' && 'Test live authorization code generation, token exchange, and claims.'}
                {activeTab === 'button' && 'Generate copy-ready "Continue with Zenoa" button components.'}
                {activeTab === 'docs' && 'Production integration examples for React, Node, Python, and cURL.'}
                {activeTab === 'activity' && 'Live event stream of authorization grants and token authentications.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Quick Register CTA */}
            {activeTab !== 'create' && (
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('create');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register Client</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ========================================================================= */}
            {/* TAB 1: CONSOLE OVERVIEW                                                  */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Metric Summary Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Clients</span>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Key className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{apps.length}</span>
                      <span className="text-[11px] font-bold text-emerald-500">Live Active</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Authorized URIs</span>
                      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                        <Link2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {apps.reduce((acc, a) => acc + (a.redirect_uris?.length || 0), 0)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">Whitelisted</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
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

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Token Verification</span>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">HMAC-SHA256</span>
                    </div>
                  </div>
                </div>

                {/* Banner Card */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                          Single Sign-On Engine
                        </span>
                        <span className="text-xs font-semibold text-slate-400">&bull; Production Ready</span>
                      </div>
                      <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                        Integrate "Continue with {branding.app_name || 'Zenoa'}" Identity
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Allow your web and mobile applications to authenticate users securely. Issue identity tokens, verify user claims, and manage callback redirects with standard OAuth 2.0 and OpenID Connect flows.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setActiveTab('playground')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                        <span>Button Kit</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Standard OIDC Endpoints Reference */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-500" />
                      <span>Standard OAuth 2.0 & OIDC Endpoints</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                        <span>Authorization Endpoint</span>
                        <span className="text-[10px] text-indigo-500 font-mono font-bold">GET</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold truncate text-slate-800 dark:text-slate-200">/auth/sso</code>
                        <button
                          onClick={() => handleCopy(`${window.location.origin}/auth/sso`, 'auth_ep', 'Authorization endpoint copied')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                        >
                          {copiedKey === 'auth_ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                        <span>Token Exchange Endpoint</span>
                        <span className="text-[10px] text-emerald-500 font-mono font-bold">POST</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold truncate text-slate-800 dark:text-slate-200">/api/oauth/token</code>
                        <button
                          onClick={() => handleCopy(`${window.location.origin}/api/oauth/token`, 'token_ep', 'Token endpoint copied')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                        >
                          {copiedKey === 'token_ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                        <span>UserInfo Endpoint</span>
                        <span className="text-[10px] text-sky-500 font-mono font-bold">GET</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold truncate text-slate-800 dark:text-slate-200">/api/oauth/userinfo</code>
                        <button
                          onClick={() => handleCopy(`${window.location.origin}/api/oauth/userinfo`, 'user_ep', 'UserInfo endpoint copied')}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
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
                          ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                          : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                    />
                    <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchApps}
                      className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Sync Registry</span>
                    </button>
                  </div>
                </div>

                {/* Application Cards List */}
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                    <p className="text-xs font-medium">Loading client registry...</p>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className={`p-10 rounded-2xl border text-center flex flex-col items-center justify-center gap-2.5 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <Key className="w-10 h-10 text-slate-400 stroke-1" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">No Client Applications Found</h3>
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
                          className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-start gap-3.5 min-w-0">
                              <BrandLogo
                                src={app.logo_url}
                                name={app.app_name}
                                size="md"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm sm:text-base tracking-tight truncate text-slate-900 dark:text-white">{app.app_name}</h3>
                                  {isOfficial && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                                      Official System Client
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
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  {app.app_description || 'OAuth 2.0 Single Sign-On Identity Client'}
                                </p>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <button
                                onClick={() => {
                                  if (onOpenConsentPreview) {
                                    onOpenConsentPreview(app.client_id, app.redirect_uris[0] || window.location.origin);
                                  } else {
                                    window.open(`/auth/sso?client_id=${app.client_id}&redirect_uri=${encodeURIComponent(app.redirect_uris[0] || window.location.origin)}`, '_blank');
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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

                          {/* Credentials Matrix */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                            {/* Client ID */}
                            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                                <span>Client ID (Public Identifier)</span>
                                <span className="text-[10px] text-emerald-500 font-mono font-bold">Public</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                                  {app.client_id}
                                </code>
                                <button
                                  onClick={() => handleCopy(app.client_id, `cid_${app.id}`, 'Client ID copied')}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                                  title="Copy Client ID"
                                >
                                  {copiedKey === `cid_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Client Secret */}
                            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                                <span className="text-rose-500">Client Secret (HMAC-SHA256)</span>
                                <button
                                  onClick={() => setSecretRotateModalApp(app)}
                                  className="text-[10px] text-indigo-500 hover:underline font-bold cursor-pointer"
                                >
                                  Rotate Secret
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                                  {isSecretVisible ? app.client_secret : '••••••••••••••••••••••••••••••••'}
                                </code>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setRevealedSecrets(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                    title={isSecretVisible ? "Hide Secret" : "Reveal Secret"}
                                  >
                                    {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopy(app.client_secret, `sec_${app.id}`, 'Client Secret copied')}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                    title="Copy Secret"
                                  >
                                    {copiedKey === `sec_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Callback URIs & Scopes Summary */}
                          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-400">Redirect URIs ({app.redirect_uris?.length || 0}):</span>
                              {app.redirect_uris?.slice(0, 2).map((uri, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                                  {uri}
                                </span>
                              ))}
                              {(app.redirect_uris?.length || 0) > 2 && (
                                <span className="text-[10px] text-slate-400 font-bold">
                                  +{app.redirect_uris.length - 2} more
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-400">Scopes:</span>
                              {(app.scopes || ['openid', 'profile']).map(s => (
                                <span key={s} className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 font-semibold">
                                  {s}
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
            {/* TAB 3: APP REGISTRATION & CONFIGURATION FORM                             */}
            {/* ========================================================================= */}
            {activeTab === 'create' && (
              <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} animate-fade-in`}>
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                      {editingAppId ? 'Edit OAuth 2.0 Configuration' : 'Register New Application'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure application metadata, authorized callback URIs, and granted OpenID scopes.
                    </p>
                  </div>
                  {editingAppId && (
                    <button
                      onClick={() => { resetForm(); setActiveTab('apps'); }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitApp} className="space-y-6">
                  {/* Basic Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Application Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={appName}
                        onChange={e => setAppName(e.target.value)}
                        placeholder="e.g. Acme Cloud Dashboard"
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Environment Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEnvironment('production')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            environment === 'production'
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                              : isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          Production (Live)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnvironment('sandbox')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            environment === 'sandbox'
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                              : isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          Sandbox (Testing)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Application Description
                    </label>
                    <textarea
                      rows={2}
                      value={appDescription}
                      onChange={e => setAppDescription(e.target.value)}
                      placeholder="Briefly explain what your app does to users on the consent screen..."
                      className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium transition-all ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                          : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Application Logo URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Homepage Website URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Authorized Redirect URIs Manager */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Authorized Redirect URIs (Whitelisted Callbacks) <span className="text-rose-500">*</span></span>
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAddRedirectUri('http://localhost:3000/auth/callback')}
                          className="text-[11px] text-indigo-500 hover:underline font-semibold cursor-pointer"
                        >
                          + Localhost:3000
                        </button>
                        <span className="text-slate-400">&bull;</span>
                        <button
                          type="button"
                          onClick={() => handleAddRedirectUri(window.location.origin + '/auth/callback')}
                          className="text-[11px] text-indigo-500 hover:underline font-semibold cursor-pointer"
                        >
                          + Current Origin
                        </button>
                      </div>
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
                        className={`flex-1 px-3.5 py-2 text-xs rounded-xl border outline-none font-mono transition-all ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 focus:border-indigo-500 text-white'
                            : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddRedirectUri()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer shrink-0"
                      >
                        Add URI
                      </button>
                    </div>

                    {/* URIs List */}
                    <div className="space-y-1.5 mt-2">
                      {redirectUrisList.map((uri, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono ${
                            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{uri}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRedirectUri(idx)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer shrink-0"
                            title="Remove URI"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scopes Selection Matrix */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Requested OpenID Connect Scopes
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'openid', name: 'openid (Mandatory)', desc: 'User Unique Subject ID (sub) and OIDC verification', required: true },
                        { id: 'profile', name: 'profile', desc: 'Display name, username, avatar photo, bio and status' },
                        { id: 'email', name: 'email', desc: 'Verified user email address and email verification flag' },
                        { id: 'phone', name: 'phone', desc: 'Phone number and mobile verification status' },
                        { id: 'offline_access', name: 'offline_access', desc: 'Issue refresh tokens for persistent background API access' }
                      ].map(sc => {
                        const isChecked = selectedScopes.includes(sc.id);
                        return (
                          <div
                            key={sc.id}
                            onClick={() => !sc.required && toggleScope(sc.id)}
                            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                              isChecked
                                ? isDark ? 'border-indigo-700 bg-indigo-950/30' : 'border-indigo-300 bg-indigo-50/50'
                                : isDark ? 'border-slate-800 bg-slate-900/40 opacity-70' : 'border-slate-200 bg-slate-50/50 opacity-70'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-400 bg-transparent'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">{sc.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sc.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setActiveTab('apps'); }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingAppId ? 'Save OAuth Configuration' : 'Register Application'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: INTERACTIVE OAUTH 2.0 SANDBOX                                     */}
            {/* ========================================================================= */}
            {activeTab === 'playground' && (
              <div className="space-y-6 animate-fade-in">
                {/* Simulator Config Card */}
                <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">Interactive OAuth 2.0 Pipeline</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Simulate the end-to-end Authorization Code Grant flow without writing a single line of backend code.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTesterAppId}
                        onChange={e => {
                          setSelectedTesterAppId(e.target.value);
                          const app = apps.find(a => a.id === e.target.value);
                          if (app && app.redirect_uris.length > 0) {
                            setTestRedirectUri(app.redirect_uris[0]);
                          }
                          setPlaygroundStep('idle');
                          setPlaygroundAuthCode('');
                          setPlaygroundAccessToken('');
                          setPlaygroundUserResult(null);
                          setTesterLog([]);
                        }}
                        className={`px-3.5 py-2 text-xs rounded-xl border outline-none font-semibold ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        {apps.map(a => (
                          <option key={a.id} value={a.id}>{a.app_name} ({a.client_id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3 Step Interactive Workflow Pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                    {/* Step 1: Authorization Code */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      playgroundStep === 'idle'
                        ? isDark ? 'border-indigo-700 bg-indigo-950/20' : 'border-indigo-300 bg-indigo-50/40'
                        : isDark ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/30'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</span>
                          {playgroundAuthCode ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">Code Issued</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500 text-white">Authorize</span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">POST /auth/sso</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Requests user approval and generates a one-time cryptographic code.
                        </p>
                      </div>
                      <button
                        onClick={handlePlaygroundAuthorize}
                        disabled={isTesterRunning}
                        className="mt-4 w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Issue Auth Code</span>
                      </button>
                    </div>

                    {/* Step 2: Token Exchange */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      playgroundStep === 'authorized'
                        ? isDark ? 'border-indigo-700 bg-indigo-950/20' : 'border-indigo-300 bg-indigo-50/40'
                        : playgroundAccessToken
                        ? isDark ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/30'
                        : isDark ? 'border-slate-800 bg-slate-900/30 opacity-60' : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</span>
                          {playgroundAccessToken ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">Token Exchanged</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-500 text-white">Token API</span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">POST /api/oauth/token</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Exchange authorization code + Client Secret for Bearer Access Token.
                        </p>
                      </div>
                      <button
                        onClick={handlePlaygroundExchangeToken}
                        disabled={!playgroundAuthCode || isTesterRunning}
                        className="mt-4 w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Exchange Bearer Token</span>
                      </button>
                    </div>

                    {/* Step 3: User Profile Claims */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      playgroundStep === 'token_exchanged'
                        ? isDark ? 'border-indigo-700 bg-indigo-950/20' : 'border-indigo-300 bg-indigo-50/40'
                        : playgroundUserResult
                        ? isDark ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/30'
                        : isDark ? 'border-slate-800 bg-slate-900/30 opacity-60' : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</span>
                          {playgroundUserResult ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">Claims Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-500 text-white">UserInfo</span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">GET /api/oauth/userinfo</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Retrieve verified claims, email, display name, and avatar.
                        </p>
                      </div>
                      <button
                        onClick={handlePlaygroundFetchUserInfo}
                        disabled={!playgroundAccessToken || isTesterRunning}
                        className="mt-4 w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Fetch User Claims</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Console Output Terminal */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#090d16] border border-slate-800 text-slate-200 font-mono text-xs shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-300">Live Request / Response Inspector</span>
                    </div>
                    {testerLog.length > 0 && (
                      <button
                        onClick={() => {
                          setTesterLog([]);
                          setPlaygroundStep('idle');
                          setPlaygroundAuthCode('');
                          setPlaygroundAccessToken('');
                          setPlaygroundUserResult(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Clear Terminal
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed">
                    {testerLog.length === 0 ? (
                      <p className="text-slate-500 italic">Click "Issue Auth Code" in Step 1 to begin the simulation trace...</p>
                    ) : (
                      testerLog.map((line, idx) => (
                        <div
                          key={idx}
                          className={
                            line.startsWith('✓')
                              ? 'text-emerald-400 font-bold'
                              : line.startsWith('[')
                              ? 'text-indigo-400 font-bold mt-2'
                              : line.startsWith('{')
                              ? 'text-amber-300'
                              : 'text-slate-300'
                          }
                        >
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: SSO BUTTON KIT GENERATOR                                          */}
            {/* ========================================================================= */}
            {activeTab === 'button' && (
              <div className="space-y-6 animate-fade-in">
                <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">"Continue with {branding.app_name || 'Zenoa'}" Button Kit</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize and export embeddable Single Sign-On button components for your website and apps.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                    {/* Live Preview Canvas */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</span>
                      <div className={`h-48 rounded-2xl border flex flex-col items-center justify-center p-6 ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <button
                          className={`flex items-center justify-center gap-2.5 font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                            buttonConfig.shape
                          } ${
                            buttonConfig.size === 'sm' ? 'px-4 py-2 text-xs' : buttonConfig.size === 'lg' ? 'px-7 py-3.5 text-base' : 'px-5 py-2.5 text-sm'
                          } ${
                            buttonConfig.variant === 'dark'
                              ? 'bg-black hover:bg-slate-900 text-white'
                              : buttonConfig.variant === 'indigo'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : buttonConfig.variant === 'light'
                              ? 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
                              : 'bg-transparent border border-slate-400 hover:bg-slate-100/20 text-current'
                          }`}
                        >
                          {buttonConfig.showIcon && (
                            <BrandLogo
                              src={activeLogo}
                              name={branding.app_name || 'Zenoa'}
                              size="xs"
                            />
                          )}
                          <span className="whitespace-nowrap">{buttonConfig.label}</span>
                        </button>
                      </div>
                    </div>

                    {/* Customizer Controls */}
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Design Controls</span>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">Color Theme</label>
                          <select
                            value={buttonConfig.variant}
                            onChange={(e: any) => setButtonConfig(prev => ({ ...prev, variant: e.target.value }))}
                            className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-semibold ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          >
                            <option value="dark">Dark Solid (Onyx)</option>
                            <option value="indigo">Brand Indigo</option>
                            <option value="light">Light Crisp</option>
                            <option value="outline">Outlined Minimal</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">Corner Radius</label>
                          <select
                            value={buttonConfig.shape}
                            onChange={(e: any) => setButtonConfig(prev => ({ ...prev, shape: e.target.value }))}
                            className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-semibold ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          >
                            <option value="rounded-xl">Rounded Card (12px)</option>
                            <option value="rounded-full">Pill Shape (Full)</option>
                            <option value="rounded-lg">Subtle (8px)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Button Label</label>
                        <input
                          type="text"
                          value={buttonConfig.label}
                          onChange={e => setButtonConfig(prev => ({ ...prev, label: e.target.value }))}
                          className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium ${
                            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        />
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
              <div className="space-y-6 animate-fade-in">
                <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">OAuth 2.0 Integration Handlers</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Production-ready authentication routes and token exchange snippets.
                      </p>
                    </div>

                    {/* Language Switcher Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap">
                      {[
                        { id: 'react', label: 'React / Next.js' },
                        { id: 'nodejs', label: 'Node.js Express' },
                        { id: 'python', label: 'Python FastAPI' },
                        { id: 'curl', label: 'cURL / RFC 6749' }
                      ].map(lang => (
                        <button
                          key={lang.id}
                          onClick={() => setDocsLanguage(lang.id as any)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            docsLanguage === lang.id
                              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Container */}
                  <div className="mt-4 relative rounded-2xl bg-[#090d16] border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                    <button
                      onClick={() => handleCopy(
                        docsLanguage === 'react' ? `// React Login Handler\nconst handleZenoaLogin = () => {\n  const authUrl = "${getAccountsAuthUrl()}?client_id=${activeSnippetApp.client_id}&redirect_uri=" + encodeURIComponent(window.location.origin + "/auth/callback");\n  window.location.href = authUrl;\n};`
                        : docsLanguage === 'nodejs' ? `// Node.js Express Token Exchange\napp.get('/auth/callback', async (req, res) => {\n  const { code } = req.query;\n  const response = await fetch('${getApiTokenUrl()}', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      grant_type: 'authorization_code',\n      client_id: '${activeSnippetApp.client_id}',\n      client_secret: '${activeSnippetApp.client_secret}',\n      code,\n      redirect_uri: '${activeSnippetApp.redirect_uris[0]}'\n    })\n  });\n  const tokenData = await response.json();\n  res.json(tokenData);\n});`
                        : docsLanguage === 'python' ? `# Python FastAPI OAuth Handler\nimport httpx\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/auth/callback")\nasync def auth_callback(code: str):\n    async with httpx.AsyncClient() as client:\n        resp = await client.post("${getApiTokenUrl()}", json={\n            "grant_type": "authorization_code",\n            "client_id": "${activeSnippetApp.client_id}",\n            "client_secret": "${activeSnippetApp.client_secret}",\n            "code": code,\n            "redirect_uri": "${activeSnippetApp.redirect_uris[0]}"\n        })\n        return resp.json()`
                        : `curl -X POST ${getApiTokenUrl()} \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "grant_type": "authorization_code",\n    "client_id": "${activeSnippetApp.client_id}",\n    "client_secret": "${activeSnippetApp.client_secret}",\n    "code": "zen_code_YOUR_CODE",\n    "redirect_uri": "${activeSnippetApp.redirect_uris[0]}"\n  }'`,
                        'code_snippet',
                        'Code snippet copied'
                      )}
                      className="absolute top-4 right-4 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'code_snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Snippet</span>
                    </button>

                    <pre className="text-[11px] leading-relaxed pt-2">
                      {docsLanguage === 'react' && `// React / Next.js "Continue with Zenoa" Handler
export const ZenoaLoginButton = () => {
  const handleLogin = () => {
    const clientId = "${activeSnippetApp.client_id}";
    const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
    const authUrl = \`${getAccountsAuthUrl()}?client_id=\${clientId}&redirect_uri=\${redirectUri}&response_type=code&scope=openid profile email\`;
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleLogin} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">
      Continue with Zenoa
    </button>
  );
};`}

                      {docsLanguage === 'nodejs' && `// Node.js Express Server-to-Server Token Exchange
import express from 'express';
const app = express();

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  // 1. Exchange auth code for Bearer Access Token
  const tokenRes = await fetch('${getApiTokenUrl()}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: '${activeSnippetApp.client_id}',
      client_secret: process.env.ZENOA_CLIENT_SECRET || '${activeSnippetApp.client_secret}',
      code,
      redirect_uri: '${activeSnippetApp.redirect_uris[0]}'
    })
  });

  const { access_token } = await tokenRes.json();

  // 2. Fetch User Claims from /api/oauth/userinfo
  const userRes = await fetch('${window.location.origin}/api/oauth/userinfo', {
    headers: { Authorization: \`Bearer \${access_token}\` }
  });

  const userProfile = await userRes.json();
  res.json({ success: true, user: userProfile });
});`}

                      {docsLanguage === 'python' && `# Python FastAPI OAuth Route
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/auth/callback")
async def oauth_callback(code: str):
    async with httpx.AsyncClient() as client:
        # Step 1: Exchange code for access token
        token_response = await client.post(
            "${window.location.origin}/api/oauth/token",
            json={
                "grant_type": "authorization_code",
                "client_id": "${activeSnippetApp.client_id}",
                "client_secret": "${activeSnippetApp.client_secret}",
                "code": code,
                "redirect_uri": "${activeSnippetApp.redirect_uris[0]}"
            }
        )
        token_data = token_response.json()
        
        # Step 2: Fetch user profile
        user_response = await client.get(
            "${window.location.origin}/api/oauth/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        return user_response.json()`}

                      {docsLanguage === 'curl' && `# 1. POST Code for Token
curl -X POST ${window.location.origin}/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "${activeSnippetApp.client_id}",
    "client_secret": "${activeSnippetApp.client_secret}",
    "code": "zen_code_sample_12345",
    "redirect_uri": "${activeSnippetApp.redirect_uris[0]}"
  }'

# 2. GET User Identity Claims
curl -X GET ${window.location.origin}/api/oauth/userinfo \\
  -H "Authorization: Bearer zen_at_sample_token_xyz"`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: SECURITY & AUDIT TIMELINE                                         */}
            {/* ========================================================================= */}
            {activeTab === 'activity' && (
              <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'} animate-fade-in`}>
                <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">Security & OAuth Audit Stream</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time security logs for authorization grants, token generation, and credential rotations.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    { event: 'Token Exchanged', status: '200 OK', client: 'Official Client', ip: '127.0.0.1', time: '2 minutes ago' },
                    { event: 'Authorization Code Issued', status: '200 OK', client: 'Official Client', ip: '127.0.0.1', time: '2 minutes ago' },
                    { event: 'Client Secret Rotated', status: 'Security Audit', client: 'Zenoa Developer Console', ip: 'Secure Admin', time: '1 hour ago' }
                  ].map((log, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{log.event}</p>
                          <p className="text-[11px] text-slate-400">Client: {log.client} &bull; Origin: {log.ip}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          {log.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CLIENT SECRET ROTATION CONFIRMATION                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {secretRotateModalApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Rotate Client Secret?</h3>
                  <p className="text-xs text-slate-400">{secretRotateModalApp.app_name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Rotating this secret will immediately invalidate the existing secret. Any production services or backend APIs utilizing the old secret will fail to exchange tokens until updated.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSecretRotateModalApp(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotateSecret}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Confirm & Rotate Secret
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: DELETE CLIENT CONFIRMATION                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteConfirmApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Delete Client Application?</h3>
                  <p className="text-xs text-slate-400">{deleteConfirmApp.app_name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Are you sure you want to delete <span className="font-bold">{deleteConfirmApp.app_name}</span>? All Client IDs, secrets, and authorized redirect configurations will be permanently revoked.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmApp(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApp}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
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
