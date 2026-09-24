import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Key, Lock, Copy, Check, ExternalLink, Plus, RefreshCw,
  Trash2, Edit3, ArrowRight, Code2, Globe, Smartphone, CheckCircle2,
  AlertCircle, Sparkles, Terminal, Play, Eye, EyeOff, Layers, UserCheck,
  FileCode, CheckSquare, X, Activity, ShieldCheck, Cpu, ArrowUpRight,
  Sliders, Database, Fingerprint, HelpCircle, Flame, ShieldAlert,
  Server, Link2, CheckCircle, AlertTriangle, LayoutDashboard, Sun,
  Moon, ChevronRight, ChevronDown, ChevronUp, Search, Monitor, BookOpen, ShieldOff, ArrowLeft, Menu,
  LogOut, Hash, Sparkle, Laptop, CheckCheck, Mail, Zap, RotateCw, PlayCircle, ShieldX, Clock, ArrowDown,
  RotateCcw, SlidersHorizontal, CornerDownRight
} from 'lucide-react';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { BrandLogo } from './common/BrandLogo';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { generateOAuthConsoleSecret } from '../utils/oauthSecurity';
import { SSOSmtpManager } from './SSOSmtpManager';

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  provider_preset?: string;
  updated_at?: number;
  last_tested_at?: number;
  last_test_status?: 'success' | 'failed';
  last_test_error?: string;
  last_latency_ms?: number;
}

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
  smtp_config?: SmtpConfig;
  assigned_sbs_email?: string;
  sbs_domain?: string;
  is_sbs_email_locked?: boolean;
}

interface SSOPortalProps {
  themeMode?: 'light' | 'dark';
  currentUser: UserData | null;
  onBack?: () => void;
  onOpenConsentPreview?: (clientId: string, redirectUri: string) => void;
}

export type SSOTabType = 'overview' | 'apps' | 'create' | 'playground' | 'button' | 'smtp' | 'docs' | 'activity';

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
  const [oneTimeSecretReveal, setOneTimeSecretReveal] = useState<{
    appName: string;
    clientId: string;
    clientSecret: string;
    actionType: 'created' | 'rotated';
  } | null>(null);

  // Interactive Playground (Sandbox) State
  const [selectedTesterAppId, setSelectedTesterAppId] = useState<string>('');
  const [testRedirectUri, setTestRedirectUri] = useState<string>('');
  const [playgroundGrantType, setPlaygroundGrantType] = useState<'authorization_code' | 'pkce' | 'client_credentials' | 'refresh_token'>('authorization_code');
  const [playgroundScopes, setPlaygroundScopes] = useState<string[]>(['openid', 'profile', 'email']);
  const [playgroundStateParam, setPlaygroundStateParam] = useState<string>(() => 'zen_state_' + Math.random().toString(36).substring(2, 10));
  const [playgroundNonce, setPlaygroundNonce] = useState<string>(() => 'zen_nonce_' + Math.random().toString(36).substring(2, 10));
  const [pkceVerifier, setPkceVerifier] = useState<string>(() => 'zen_pkce_verifier_' + Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14));
  const [pkceChallenge, setPkceChallenge] = useState<string>(() => 'zen_s256_challenge_' + Math.random().toString(36).substring(2, 16));
  const [playgroundSimulatedError, setPlaygroundSimulatedError] = useState<'none' | 'invalid_client' | 'invalid_grant' | 'redirect_uri_mismatch' | 'invalid_scope' | 'expired_token'>('none');
  const [playgroundStep, setPlaygroundStep] = useState<'idle' | 'authorized' | 'token_exchanged' | 'userinfo_fetched'>('idle');
  const [playgroundAuthCode, setPlaygroundAuthCode] = useState<string>('');
  const [playgroundAccessToken, setPlaygroundAccessToken] = useState<string>('');
  const [playgroundIdToken, setPlaygroundIdToken] = useState<string>('');
  const [playgroundRefreshToken, setPlaygroundRefreshToken] = useState<string>('');
  const [playgroundTokenExpiresIn, setPlaygroundTokenExpiresIn] = useState<number>(3600);
  const [playgroundUserResult, setPlaygroundUserResult] = useState<any>(null);
  const [isTesterRunning, setIsTesterRunning] = useState<boolean>(false);
  const [autoRunInProgress, setAutoRunInProgress] = useState<boolean>(false);
  const [testerLog, setTesterLog] = useState<string[]>([]);
  const [playgroundInspectorTab, setPlaygroundInspectorTab] = useState<'claims' | 'tokens' | 'http' | 'terminal' | 'curl'>('claims');
  const [showAdvancedPlaygroundSettings, setShowAdvancedPlaygroundSettings] = useState<boolean>(false);
  const [playgroundLatencyMs, setPlaygroundLatencyMs] = useState<number>(0);
  const [playgroundRawHttp, setPlaygroundRawHttp] = useState<{ request: string; response: string; status: number; method: string; path: string } | null>(null);

  // Code Snippets Tab States
  const [docsLanguage, setDocsLanguage] = useState<'react' | 'nodejs' | 'python' | 'curl' | 'vanilla' | 'env'>('react');
  const [selectedSnippetAppId, setSelectedSnippetAppId] = useState<string>('');
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState<boolean>(false);
  const [appDropdownSearch, setAppDropdownSearch] = useState<string>('');
  const [snippetRedirectUri, setSnippetRedirectUri] = useState<string>('');
  const [showSnippetSecret, setShowSnippetSecret] = useState<boolean>(false);

  // Expandable Client Cards State (Collapsed by default)
  const [expandedAppIds, setExpandedAppIds] = useState<Record<string, boolean>>({});

  const toggleAppExpanded = (appId: string) => {
    setExpandedAppIds(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  // Real-time Redirect URI management states
  const [expandedUriManagerAppId, setExpandedUriManagerAppId] = useState<string | null>(null);
  const [quickUriInputByApp, setQuickUriInputByApp] = useState<{ [appId: string]: string }>({});
  const [uriSavingAppId, setUriSavingAppId] = useState<string | null>(null);
  const [uriSavedSuccessAppId, setUriSavedSuccessAppId] = useState<string | null>(null);

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

  // BYO-SMTP State & Management
  const [selectedSmtpAppId, setSelectedSmtpAppId] = useState<string>('');

  const handleUpdateAppSmtp = (appId: string, updatedConfig: SmtpConfig) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, smtp_config: updatedConfig } : a));
  };

  const customSmtpAppsCount = useMemo(() => {
    return apps.filter(a => a.smtp_config?.enabled).length;
  }, [apps]);

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
    if (hostname.includes('zenoa.in')) {
      return 'https://accounts.zenoa.in/auth/sso';
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
    if (hostname.includes('zenoa.in')) {
      return 'https://accounts.zenoa.in/api/oauth/token';
    }
    return `${window.location.origin}/api/oauth/token`;
  };

  const getApiUserInfoUrl = () => {
    if (typeof window === 'undefined') return '/api/oauth/userinfo';
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('zenoa.in')) {
      return 'https://accounts.zenoa.in/api/oauth/userinfo';
    }
    return `${window.location.origin}/api/oauth/userinfo`;
  };

  const getOidcDiscoveryUrl = () => {
    return `${window.location.origin}/.well-known/openid-configuration`;
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
        client_secret: 'zen-oas_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
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
        total_logins: 142,
        assigned_sbs_email: 'console@zenoa.in',
        sbs_domain: 'zenoa.in',
        is_sbs_email_locked: true
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
          if (!firestoreApps.some(a => a.id === 'sso_official_default' || a.client_id === 'zenoa_official_app')) {
            firestoreApps.unshift(officialApp);
          }
        } else {
          // If it exists in Firestore, load the official document directly!
          const officialDocData = { id: officialSnap.id, ...officialSnap.data() } as SSOApp;
          if (!firestoreApps.some(a => a.id === 'sso_official_default' || a.client_id === 'zenoa_official_app')) {
            firestoreApps.unshift(officialDocData);
          } else {
            // Replace queried official app with the exact firestore snapshot to make sure the latest redirect_uris are shown
            firestoreApps = firestoreApps.map(a => (a.id === 'sso_official_default' || a.client_id === 'zenoa_official_app') ? officialDocData : a);
          }
        }
      }

      if (!firestoreApps.some(a => a.client_id === 'zenoa_official_app' || a.id === 'sso_official_default')) {
        firestoreApps.unshift(officialApp);
      }

      // Guarantee each app has an immutable assigned_sbs_email address
      firestoreApps = firestoreApps.map(app => {
        if (app.client_id === 'zenoa_official_app' || app.id === 'sso_official_default') {
          return {
            ...app,
            assigned_sbs_email: 'console@zenoa.in',
            sbs_domain: 'zenoa.in',
            is_sbs_email_locked: true
          };
        }
        if (!app.assigned_sbs_email) {
          const cleanName = (app.app_name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'app';
          const seed = String(Math.abs((app.id || app.client_id || 'app').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9000 + 1000));
          const assigned = `${cleanName}-${seed}@zenoa.in`;
          if (db && app.id) {
            setDoc(doc(db, 'sso_applications', app.id), {
              assigned_sbs_email: assigned,
              sbs_domain: 'zenoa.in',
              is_sbs_email_locked: true
            }, { merge: true }).catch(() => {});
          }
          return {
            ...app,
            assigned_sbs_email: assigned,
            sbs_domain: 'zenoa.in',
            is_sbs_email_locked: true
          };
        }
        return app;
      });

      setApps(firestoreApps);
      if (!selectedTesterAppId && firestoreApps.length > 0) {
        setSelectedTesterAppId(firestoreApps[0].id);
        setTestRedirectUri(firestoreApps[0].redirect_uris[0] || 'http://localhost:3000/auth/callback');
      }
      if (!selectedSnippetAppId && firestoreApps.length > 0) {
        setSelectedSnippetAppId(firestoreApps[0].id);
        setSnippetRedirectUri(firestoreApps[0].redirect_uris[0] || 'http://localhost:3000/auth/callback');
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

    if (!db) return;
    try {
      const ssoRef = collection(db, 'sso_applications');
      const unsubscribe = onSnapshot(ssoRef, (snapshot) => {
        const ownerName = currentUser?.username || 'developer_user';
        const updatedDocs: SSOApp[] = [];

        snapshot.forEach(docSnap => {
          const data = { id: docSnap.id, ...docSnap.data() } as SSOApp;
          if (data.id === 'sso_official_default' || data.client_id === 'zenoa_official_app') {
            updatedDocs.unshift(data);
          } else if (data.owner === ownerName || !data.owner || data.owner === currentUser?.zenoa_id) {
            updatedDocs.push(data);
          }
        });

        if (updatedDocs.length > 0) {
          setApps(prev => {
            const idMap = new Map<string, SSOApp>();
            updatedDocs.forEach(a => idMap.set(a.id, a));
            prev.forEach(a => {
              if (!idMap.has(a.id)) {
                idMap.set(a.id, a);
              }
            });
            return Array.from(idMap.values());
          });
        }
      }, (err) => {
        console.warn('Real-time SSO listener notice:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not attach real-time SSO listener:', e);
    }
  }, [currentUser?.username, currentUser?.zenoa_id]);

  // Real-Time Redirect URI Updater for any App
  const handleUpdateAppRedirectUris = async (
    appId: string,
    updatedUris: string[],
    action: 'added' | 'removed'
  ) => {
    if (!updatedUris || updatedUris.length === 0) {
      showNotification('error', 'OAuth 2.0 clients require at least one allowed Redirect URI');
      return;
    }

    setUriSavingAppId(appId);

    // 1. Optimistic Real-Time UI State Update
    setApps(prev => prev.map(a => (a.id === appId ? { ...a, redirect_uris: updatedUris, updated_at: Date.now() } : a)));

    // 2. If this app is being edited in form, sync form state
    if (editingAppId === appId) {
      setRedirectUrisList(updatedUris);
    }

    // 3. If this app is active in tester or snippet, sync selected URI
    if (selectedTesterAppId === appId && !updatedUris.includes(testRedirectUri)) {
      setTestRedirectUri(updatedUris[0] || '');
    }
    if (selectedSnippetAppId === appId && !updatedUris.includes(snippetRedirectUri)) {
      setSnippetRedirectUri(updatedUris[0] || '');
    }

    // 4. Persist to Firestore with setDoc + merge: true
    try {
      if (db) {
        await setDoc(doc(db, 'sso_applications', appId), {
          redirect_uris: updatedUris,
          updated_at: Date.now()
        }, { merge: true });
      }

      // Update local storage backup cache
      try {
        const cachedStr = localStorage.getItem('zenoa_sso_apps_cache');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const nextCached = cached.map((c: any) => c.id === appId ? { ...c, redirect_uris: updatedUris } : c);
          localStorage.setItem('zenoa_sso_apps_cache', JSON.stringify(nextCached));
        }
      } catch (e) {}

      setUriSavedSuccessAppId(appId);
      setTimeout(() => {
        setUriSavedSuccessAppId(null);
      }, 2500);

      showNotification('success', action === 'added' ? 'Redirect URI added and saved in real time' : 'Redirect URI removed and saved in real time');
    } catch (err: any) {
      console.error('Failed to update redirect URIs:', err);
      showNotification('error', err.message || 'Failed to save Redirect URIs in real time');
    } finally {
      setUriSavingAppId(null);
    }
  };

  const handleQuickAddUri = (appId: string, uriToAdd?: string) => {
    const targetApp = apps.find(a => a.id === appId);
    if (!targetApp) return;

    const inputVal = uriToAdd !== undefined ? uriToAdd : (quickUriInputByApp[appId] || '');
    const cleanUri = inputVal.trim();
    if (!cleanUri) return;

    if (!cleanUri.startsWith('http://localhost') && !cleanUri.startsWith('https://') && !cleanUri.startsWith('http://127.0.0.1')) {
      showNotification('error', 'Redirect URI must start with https:// (or http://localhost for local testing)');
      return;
    }

    if (targetApp.redirect_uris.includes(cleanUri)) {
      showNotification('error', 'This Redirect URI is already registered for this client');
      return;
    }

    const nextUris = [...targetApp.redirect_uris, cleanUri];
    handleUpdateAppRedirectUris(appId, nextUris, 'added');
    setQuickUriInputByApp(prev => ({ ...prev, [appId]: '' }));
  };

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

    const nextList = [...redirectUrisList, raw];
    setRedirectUrisList(nextList);
    setRedirectUrisInput('');

    // If editing an existing app, sync directly to Firestore in real time!
    if (editingAppId) {
      handleUpdateAppRedirectUris(editingAppId, nextList, 'added');
    }
  };

  // Remove Redirect URI
  const handleRemoveRedirectUri = (index: number) => {
    if (redirectUrisList.length === 1) {
      showNotification('error', 'OAuth clients require at least one allowed Redirect URI');
      return;
    }
    const nextList = redirectUrisList.filter((_, i) => i !== index);
    setRedirectUrisList(nextList);

    // If editing an existing app, sync directly to Firestore in real time!
    if (editingAppId) {
      handleUpdateAppRedirectUris(editingAppId, nextList, 'removed');
    }
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
          await setDoc(doc(db, 'sso_applications', editingAppId), updatedData, { merge: true });
        }

        setApps(prev => prev.map(a => (a.id === editingAppId ? { ...a, ...updatedData } : a)));
        showNotification('success', 'OAuth configuration saved successfully in real time');
      } else {
        const randomId = Math.random().toString(36).substring(2, 10);
        const randomSecret = generateOAuthConsoleSecret();
        const clientId = `zenoa_oauth_${randomId}`;
        const newAppId = `sso_app_${Date.now()}`;

        // Automatic permanent zenoa.in email generation based on app name + 4-digit random code
        const cleanName = appName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'app';
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
        const assignedSbsEmail = `${cleanName}-${randomCode}@zenoa.in`;

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
          total_logins: 0,
          assigned_sbs_email: assignedSbsEmail,
          sbs_domain: 'zenoa.in',
          is_sbs_email_locked: true
        };

        if (db) {
          await setDoc(doc(db, 'sso_applications', newAppId), newApp);
        }

        setApps(prev => [newApp, ...prev]);
        showNotification('success', 'OAuth 2.0 client registered successfully');
        
        // Show one-time secret revelation modal
        setOneTimeSecretReveal({
          appName: newApp.app_name,
          clientId: newApp.client_id,
          clientSecret: newApp.client_secret,
          actionType: 'created'
        });
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
      const newSecret = generateOAuthConsoleSecret();
      if (db) {
        await updateDoc(doc(db, 'sso_applications', secretRotateModalApp.id), {
          client_secret: newSecret,
          updated_at: Date.now()
        });
      }
      setApps(prev => prev.map(a => a.id === secretRotateModalApp.id ? { ...a, client_secret: newSecret, updated_at: Date.now() } : a));
      showNotification('success', `Client Secret rotated for ${secretRotateModalApp.app_name}`);
      
      // Reveal new secret once
      setOneTimeSecretReveal({
        appName: secretRotateModalApp.app_name,
        clientId: secretRotateModalApp.client_id,
        clientSecret: newSecret,
        actionType: 'rotated'
      });
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

  // Helper to generate base64url string
  const toBase64Url = (str: string) => {
    try {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      return str;
    }
  };

  // Generate Mock OpenID Connect ID Token (RS256 JWT)
  const generateMockOidcIdToken = (claims: any, clientId: string, nonceVal: string) => {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: 'zenoa_inolas_key_2026'
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: typeof window !== 'undefined' && window.location.hostname.includes('zenoa.in') ? 'https://accounts.zenoa.in' : (typeof window !== 'undefined' ? window.location.origin : 'https://accounts.zenoa.in'),
      sub: claims.sub || 'usr_zenoa_9901',
      aud: clientId,
      exp: now + 3600,
      iat: now,
      auth_time: now,
      nonce: nonceVal || 'zen_nonce_' + Math.random().toString(36).substring(2, 10),
      name: claims.name || 'Alex Developer',
      preferred_username: claims.username || 'alex_dev',
      email: claims.email || 'developer@zenoa.in',
      email_verified: true,
      phone_number: claims.phone || '+1 (555) 019-2834',
      phone_number_verified: true,
      picture: claims.avatar_url || '',
      organization: 'Inolas Nexus Private Limited'
    };

    const headerB64 = toBase64Url(JSON.stringify(header));
    const payloadB64 = toBase64Url(JSON.stringify(payload));
    const mockSignature = toBase64Url('inolas_nexus_rs256_sig_' + Math.random().toString(36).substring(2));
    return `${headerB64}.${payloadB64}.${mockSignature}`;
  };

  // Active App for Playground
  const activeTesterApp = useMemo(() => {
    return apps.find(a => a.id === selectedTesterAppId) || apps[0] || {
      id: 'sso_official_default',
      client_id: 'zenoa_official_app',
      client_secret: 'zen-oas_live_sec_9900112233445566778899aabbccddeeff',
      app_name: branding.app_name || 'Zenoa Platform SSO',
      redirect_uris: ['http://localhost:3000/auth/callback'],
      scopes: ['openid', 'profile', 'email'],
      environment: 'production' as const,
      type: 'official_first_party',
      created_at: Date.now()
    };
  }, [apps, selectedTesterAppId, branding.app_name]);

  // Sync redirect uri when active app changes
  useEffect(() => {
    if (activeTesterApp && (!testRedirectUri || !activeTesterApp.redirect_uris?.includes(testRedirectUri))) {
      setTestRedirectUri(activeTesterApp.redirect_uris?.[0] || 'http://localhost:3000/auth/callback');
    }
  }, [activeTesterApp]);

  // Reset Playground State Handler
  const handleResetPlayground = () => {
    setPlaygroundStep('idle');
    setPlaygroundAuthCode('');
    setPlaygroundAccessToken('');
    setPlaygroundIdToken('');
    setPlaygroundRefreshToken('');
    setPlaygroundUserResult(null);
    setIsTesterRunning(false);
    setAutoRunInProgress(false);
    setTesterLog([]);
    setPlaygroundRawHttp(null);
    setPlaygroundLatencyMs(0);
    setPlaygroundStateParam('zen_state_' + Math.random().toString(36).substring(2, 10));
    setPlaygroundNonce('zen_nonce_' + Math.random().toString(36).substring(2, 10));
    setPkceVerifier('zen_pkce_verifier_' + Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14));
    setPkceChallenge('zen_s256_challenge_' + Math.random().toString(36).substring(2, 16));
    showNotification('success', 'Sandbox session reset with fresh state parameters');
  };

  // Playground Execution Handlers
  const handlePlaygroundAuthorize = () => {
    if (!activeTesterApp) return;
    setIsTesterRunning(true);
    const startTime = performance.now();
    const effectiveRedirect = testRedirectUri || activeTesterApp.redirect_uris?.[0] || 'http://localhost:3000/auth/callback';
    const effectiveHost = typeof window !== 'undefined' && window.location.hostname.includes('zenoa.in') ? 'accounts.zenoa.in' : (typeof window !== 'undefined' ? window.location.host : 'accounts.zenoa.in');

    // Check Simulated Errors
    if (playgroundSimulatedError === 'redirect_uri_mismatch') {
      setTimeout(() => {
        setIsTesterRunning(false);
        setAutoRunInProgress(false);
        const errLog = [
          `[1/3] POST /auth/sso`,
          `client_id: ${activeTesterApp.client_id}`,
          `redirect_uri: https://unauthorized-domain.com/hack`,
          `response_type: code`,
          `scope: ${playgroundScopes.join(' ')}`,
          `❌ 400 Bad Request — redirect_uri_mismatch`,
          `Error: The redirect_uri provided is not registered for this OAuth client.`
        ];
        setTesterLog(errLog);
        setPlaygroundRawHttp({
          method: 'POST',
          path: '/auth/sso',
          status: 400,
          request: JSON.stringify({ client_id: activeTesterApp.client_id, redirect_uri: 'https://unauthorized-domain.com/hack' }, null, 2),
          response: JSON.stringify({ error: 'redirect_uri_mismatch', error_description: 'The redirect_uri provided is not whitelisted by Inolas Nexus Security' }, null, 2)
        });
        showNotification('error', 'Simulation: redirect_uri_mismatch (400)');
      }, 200);
      return;
    }

    if (playgroundSimulatedError === 'invalid_scope') {
      setTimeout(() => {
        setIsTesterRunning(false);
        setAutoRunInProgress(false);
        const errLog = [
          `[1/3] POST /auth/sso`,
          `client_id: ${activeTesterApp.client_id}`,
          `scope: invalid_custom_restricted_scope`,
          `❌ 400 Bad Request — invalid_scope`,
          `Error: The requested scope is invalid, unknown, or malformed.`
        ];
        setTesterLog(errLog);
        setPlaygroundRawHttp({
          method: 'POST',
          path: '/auth/sso',
          status: 400,
          request: JSON.stringify({ client_id: activeTesterApp.client_id, scope: 'invalid_custom_restricted_scope' }, null, 2),
          response: JSON.stringify({ error: 'invalid_scope', error_description: 'The requested scope is unrecognized' }, null, 2)
        });
        showNotification('error', 'Simulation: invalid_scope (400)');
      }, 200);
      return;
    }

    const generatedCode = 'zen_ac_' + Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 8);
    const requestPayload = {
      client_id: activeTesterApp.client_id,
      redirect_uri: effectiveRedirect,
      response_type: 'code',
      scope: playgroundScopes.join(' '),
      state: playgroundStateParam,
      nonce: playgroundNonce,
      ...(playgroundGrantType === 'pkce' ? {
        code_challenge: pkceChallenge,
        code_challenge_method: 'S256'
      } : {})
    };

    setTesterLog([
      `[1/3] POST /auth/sso (Authorization Code Request)`,
      `Host: ${effectiveHost}`,
      `Client ID: ${activeTesterApp.client_id} (${activeTesterApp.app_name})`,
      `Grant Mode: ${playgroundGrantType === 'pkce' ? 'Authorization Code + PKCE (S256)' : 'Standard Auth Code'}`,
      `Redirect URI: ${effectiveRedirect}`,
      `Scope: ${playgroundScopes.join(' ')}`,
      `State: ${playgroundStateParam}`,
      `Nonce: ${playgroundNonce}`,
      playgroundGrantType === 'pkce' ? `Code Challenge (S256): ${pkceChallenge}` : `Client Auth: Confidential Server Secret`
    ]);

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime) || 10;
      setPlaygroundLatencyMs(elapsed);
      setPlaygroundAuthCode(generatedCode);
      setPlaygroundStep('authorized');
      setIsTesterRunning(false);

      const responsePayload = {
        code: generatedCode,
        state: playgroundStateParam,
        expires_in: 60,
        callback_url: `${effectiveRedirect}?code=${generatedCode}&state=${playgroundStateParam}`
      };

      setPlaygroundRawHttp({
        method: 'POST',
        path: '/auth/sso',
        status: 200,
        request: JSON.stringify(requestPayload, null, 2),
        response: JSON.stringify(responsePayload, null, 2)
      });

      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — Authorization Code Issued (${elapsed}ms)`,
        `code: ${generatedCode} (TTL: 60s single-use)`,
        `callback: ${effectiveRedirect}?code=${generatedCode}&state=${playgroundStateParam}`
      ]);
      showNotification('success', 'Authorization Code issued successfully');
    }, 250);
  };

  const handlePlaygroundExchangeToken = (explicitCode?: string) => {
    if (!activeTesterApp) return;
    setIsTesterRunning(true);
    const startTime = performance.now();
    const effectiveRedirect = testRedirectUri || activeTesterApp.redirect_uris?.[0] || 'http://localhost:3000/auth/callback';
    const effectiveHost = typeof window !== 'undefined' && window.location.hostname.includes('zenoa.in') ? 'accounts.zenoa.in' : (typeof window !== 'undefined' ? window.location.host : 'accounts.zenoa.in');
    const codeToUse = explicitCode || playgroundAuthCode || ('zen_ac_' + Math.random().toString(36).substring(2, 14));

    // Simulated Errors
    if (playgroundSimulatedError === 'invalid_client') {
      setTimeout(() => {
        setIsTesterRunning(false);
        setAutoRunInProgress(false);
        const errLog = [
          ...testerLog,
          `-----------------------------------------`,
          `[2/3] POST /api/oauth/token`,
          `❌ 401 Unauthorized — invalid_client`,
          `Error: Client authentication failed (invalid client credentials).`
        ];
        setTesterLog(errLog);
        setPlaygroundRawHttp({
          method: 'POST',
          path: '/api/oauth/token',
          status: 401,
          request: JSON.stringify({ grant_type: 'authorization_code', client_id: activeTesterApp.client_id, client_secret: 'invalid_secret' }, null, 2),
          response: JSON.stringify({ error: 'invalid_client', error_description: 'Invalid client authentication secret' }, null, 2)
        });
        showNotification('error', 'Simulation: invalid_client (401)');
      }, 200);
      return;
    }

    if (playgroundSimulatedError === 'invalid_grant') {
      setTimeout(() => {
        setIsTesterRunning(false);
        setAutoRunInProgress(false);
        const errLog = [
          ...testerLog,
          `-----------------------------------------`,
          `[2/3] POST /api/oauth/token`,
          `code: ${codeToUse}`,
          `❌ 400 Bad Request — invalid_grant`,
          `Error: The authorization code is invalid or has already expired.`
        ];
        setTesterLog(errLog);
        setPlaygroundRawHttp({
          method: 'POST',
          path: '/api/oauth/token',
          status: 400,
          request: JSON.stringify({ grant_type: 'authorization_code', code: 'expired_or_used_code' }, null, 2),
          response: JSON.stringify({ error: 'invalid_grant', error_description: 'Authorization code has already been consumed' }, null, 2)
        });
        showNotification('error', 'Simulation: invalid_grant (400)');
      }, 200);
      return;
    }

    const tokenRequestPayload = {
      grant_type: playgroundGrantType === 'client_credentials' ? 'client_credentials' : 'authorization_code',
      client_id: activeTesterApp.client_id,
      ...(playgroundGrantType === 'pkce'
        ? { code_verifier: pkceVerifier }
        : { client_secret: activeTesterApp.client_secret }),
      code: codeToUse,
      redirect_uri: effectiveRedirect
    };

    setTesterLog(prev => [
      ...prev,
      `-----------------------------------------`,
      `[2/3] POST /api/oauth/token (Bearer & ID Token Exchange)`,
      `Host: ${effectiveHost}`,
      `grant_type: ${tokenRequestPayload.grant_type}`,
      `client_id: ${activeTesterApp.client_id}`,
      playgroundGrantType === 'pkce' ? `code_verifier: ${pkceVerifier}` : `client_secret: ${activeTesterApp.client_secret.substring(0, 10)}... [Secured]`,
      `code: ${codeToUse}`,
      `redirect_uri: ${effectiveRedirect}`
    ]);

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime) || 12;
      setPlaygroundLatencyMs(elapsed);
      const generatedAccessToken = 'zen_at_' + Math.random().toString(36).substring(2, 18) + '.' + Math.random().toString(36).substring(2, 18);
      const generatedRefreshToken = 'zen_rt_' + Math.random().toString(36).substring(2, 22);
      
      const mockClaims = {
        sub: currentUser?.zenoa_id || currentUser?.id || 'usr_zenoa_9901',
        zenoa_id: currentUser?.zenoa_id || `${currentUser?.username || 'developer'}@zenoa.in`,
        username: currentUser?.username || 'alex_dev',
        name: currentUser?.display_name || 'Alex Developer',
        email: currentUser?.email || `${currentUser?.username || 'developer'}@zenoa.in`,
        phone: currentUser?.phone_number || currentUser?.mobile_number || '+1 (555) 019-2834',
        avatar_url: currentUser?.avatar_url || ''
      };

      const generatedIdToken = generateMockOidcIdToken(mockClaims, activeTesterApp.client_id, playgroundNonce);

      setPlaygroundAuthCode(codeToUse);
      setPlaygroundAccessToken(generatedAccessToken);
      setPlaygroundIdToken(generatedIdToken);
      setPlaygroundRefreshToken(generatedRefreshToken);
      setPlaygroundTokenExpiresIn(3600);
      setPlaygroundStep('token_exchanged');
      setIsTesterRunning(false);

      const tokenResponse = {
        token_type: 'Bearer',
        access_token: generatedAccessToken,
        id_token: generatedIdToken,
        refresh_token: generatedRefreshToken,
        expires_in: 3600,
        scope: playgroundScopes.join(' ')
      };

      setPlaygroundRawHttp({
        method: 'POST',
        path: '/api/oauth/token',
        status: 200,
        request: JSON.stringify(tokenRequestPayload, null, 2),
        response: JSON.stringify(tokenResponse, null, 2)
      });

      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — Bearer Access Token & ID Token Issued (${elapsed}ms)`,
        `token_type: Bearer`,
        `expires_in: 3600 (1 hour)`,
        `access_token: ${generatedAccessToken}`,
        `id_token (JWT RS256): ${generatedIdToken.substring(0, 32)}... [OIDC Valid]`,
        `refresh_token: ${generatedRefreshToken}`
      ]);
      showNotification('success', 'Bearer Access Token and ID Token exchanged');
    }, 250);
  };

  const handlePlaygroundFetchUserInfo = (explicitToken?: string) => {
    if (!activeTesterApp) return;
    setIsTesterRunning(true);
    const startTime = performance.now();
    const effectiveHost = typeof window !== 'undefined' && window.location.hostname.includes('zenoa.in') ? 'accounts.zenoa.in' : (typeof window !== 'undefined' ? window.location.host : 'accounts.zenoa.in');
    const tokenToUse = explicitToken || playgroundAccessToken || ('zen_at_' + Math.random().toString(36).substring(2, 16) + '.' + Math.random().toString(36).substring(2, 16));

    if (playgroundSimulatedError === 'expired_token') {
      setTimeout(() => {
        setIsTesterRunning(false);
        setAutoRunInProgress(false);
        const errLog = [
          ...testerLog,
          `-----------------------------------------`,
          `[3/3] GET /api/oauth/userinfo`,
          `Authorization: Bearer ${tokenToUse}`,
          `❌ 401 Unauthorized — invalid_token`,
          `Error: The access token provided is expired or revoked.`
        ];
        setTesterLog(errLog);
        setPlaygroundRawHttp({
          method: 'GET',
          path: '/api/oauth/userinfo',
          status: 401,
          request: `GET /api/oauth/userinfo HTTP/1.1\nHost: ${effectiveHost}\nAuthorization: Bearer ${tokenToUse}`,
          response: JSON.stringify({ error: 'invalid_token', error_description: 'Access token expired or revoked' }, null, 2)
        });
        showNotification('error', 'Simulation: expired_token (401 Unauthorized)');
      }, 200);
      return;
    }

    setTesterLog(prev => [
      ...prev,
      `-----------------------------------------`,
      `[3/3] GET /api/oauth/userinfo (OIDC User Identity Claims)`,
      `Host: ${effectiveHost}`,
      `Authorization: Bearer ${tokenToUse.substring(0, 18)}...`,
      `Accept: application/json`
    ]);

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime) || 12;
      setPlaygroundLatencyMs(elapsed);
      const userInfoResult = {
        sub: currentUser?.zenoa_id || currentUser?.id || 'usr_zenoa_9901',
        zenoa_id: currentUser?.zenoa_id || `${currentUser?.username || 'developer'}@zenoa.in`,
        username: currentUser?.username || 'alex_dev',
        name: currentUser?.display_name || 'Alex Developer',
        email: currentUser?.email || `${currentUser?.username || 'developer'}@zenoa.in`,
        email_verified: Boolean(currentUser?.email || true),
        phone: currentUser?.phone_number || currentUser?.mobile_number || '+1 (555) 019-2834',
        phone_verified: true,
        avatar_url: currentUser?.avatar_url || '',
        avatar_seed: currentUser?.avatar_seed || 'felix',
        organization: 'Inolas Nexus Private Limited',
        locale: 'en-US',
        auth_time: Math.floor(Date.now() / 1000) - 120,
        updated_at: Math.floor(Date.now() / 1000)
      };

      setPlaygroundAccessToken(tokenToUse);
      setPlaygroundUserResult(userInfoResult);
      setPlaygroundStep('userinfo_fetched');
      setIsTesterRunning(false);
      setAutoRunInProgress(false);
      setPlaygroundInspectorTab('claims');

      setPlaygroundRawHttp({
        method: 'GET',
        path: '/api/oauth/userinfo',
        status: 200,
        request: `GET /api/oauth/userinfo HTTP/1.1\nHost: ${effectiveHost}\nAuthorization: Bearer ${tokenToUse}\nAccept: application/json`,
        response: JSON.stringify(userInfoResult, null, 2)
      });

      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — User Identity Claims Verified (${elapsed}ms)`,
        JSON.stringify(userInfoResult, null, 2)
      ]);
      showNotification('success', 'User Identity Claims retrieved and verified');
    }, 250);
  };

  const handlePlaygroundRefreshToken = () => {
    if (!activeTesterApp) return;
    setIsTesterRunning(true);
    const startTime = performance.now();
    const effectiveHost = typeof window !== 'undefined' && window.location.hostname.includes('zenoa.in') ? 'accounts.zenoa.in' : (typeof window !== 'undefined' ? window.location.host : 'accounts.zenoa.in');
    const tokenToRefresh = playgroundRefreshToken || ('zen_rt_' + Math.random().toString(36).substring(2, 22));

    setTesterLog(prev => [
      ...prev,
      `-----------------------------------------`,
      `[Refresh] POST /api/oauth/token (Rotating Token Grant)`,
      `Host: ${effectiveHost}`,
      `grant_type: refresh_token`,
      `client_id: ${activeTesterApp.client_id}`,
      `refresh_token: ${tokenToRefresh}`
    ]);

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime) || 10;
      setPlaygroundLatencyMs(elapsed);
      const newAccessToken = 'zen_at_rot_' + Math.random().toString(36).substring(2, 18) + '.' + Math.random().toString(36).substring(2, 18);
      const newRefreshToken = 'zen_rt_rot_' + Math.random().toString(36).substring(2, 22);

      setPlaygroundAccessToken(newAccessToken);
      setPlaygroundRefreshToken(newRefreshToken);
      setIsTesterRunning(false);

      setTesterLog(prev => [
        ...prev,
        `✓ 200 OK — Access Token successfully refreshed (${elapsed}ms)`,
        `new_access_token: ${newAccessToken}`,
        `new_refresh_token: ${newRefreshToken}`
      ]);
      showNotification('success', 'Access token refreshed');
    }, 250);
  };

  // Run End-to-End Flow Automatically
  const handleRunFullPipeline = () => {
    if (!activeTesterApp) return;
    setAutoRunInProgress(true);
    setIsTesterRunning(true);
    setPlaygroundSimulatedError('none');
    setPlaygroundInspectorTab('claims');

    const effectiveHost = typeof window !== 'undefined' && window.location.hostname.includes('zenoa.in')
      ? 'accounts.zenoa.in'
      : (typeof window !== 'undefined' ? window.location.host : 'accounts.zenoa.in');

    const startTime = performance.now();
    const effectiveRedirect = testRedirectUri || activeTesterApp.redirect_uris?.[0] || 'http://localhost:3000/auth/callback';
    const code = 'zen_ac_' + Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 8);
    const accessToken = 'zen_at_' + Math.random().toString(36).substring(2, 16) + '.' + Math.random().toString(36).substring(2, 24);
    const refreshToken = 'zen_rt_' + Math.random().toString(36).substring(2, 24);

    const mockClaims = {
      sub: currentUser?.zenoa_id || currentUser?.id || 'usr_zenoa_9901',
      zenoa_id: currentUser?.zenoa_id || `${currentUser?.username || 'developer'}@zenoa.in`,
      username: currentUser?.username || 'alex_dev',
      name: currentUser?.display_name || 'Alex Developer',
      email: currentUser?.email || `${currentUser?.username || 'developer'}@zenoa.in`,
      email_verified: true,
      phone_number: currentUser?.phone_number || currentUser?.mobile_number || '+1 (555) 019-2834',
      phone_number_verified: true,
      avatar_url: currentUser?.avatar_url || '',
      avatar_seed: currentUser?.avatar_seed || 'felix',
      organization: 'Inolas Nexus Private Limited',
      locale: 'en-US',
      auth_time: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    };

    const idToken = generateMockOidcIdToken(mockClaims, activeTesterApp.client_id, playgroundNonce);

    // Update all states synchronously
    setPlaygroundAuthCode(code);
    setPlaygroundAccessToken(accessToken);
    setPlaygroundIdToken(idToken);
    setPlaygroundRefreshToken(refreshToken);
    setPlaygroundTokenExpiresIn(3600);
    setPlaygroundUserResult(mockClaims);
    setPlaygroundStep('userinfo_fetched');

    const elapsed = Math.round(performance.now() - startTime) || 15;
    setPlaygroundLatencyMs(elapsed);
    setIsTesterRunning(false);
    setAutoRunInProgress(false);

    setPlaygroundRawHttp({
      method: 'GET',
      path: '/api/oauth/userinfo',
      status: 200,
      request: `GET /api/oauth/userinfo HTTP/1.1\nHost: ${effectiveHost}\nAuthorization: Bearer ${accessToken}\nAccept: application/json`,
      response: JSON.stringify(mockClaims, null, 2)
    });

    setTesterLog([
      `[1/3] POST /auth/sso (Authorization Code Request)`,
      `Host: ${effectiveHost}`,
      `Client ID: ${activeTesterApp.client_id} (${activeTesterApp.app_name})`,
      `Grant Mode: ${playgroundGrantType === 'pkce' ? 'Authorization Code + PKCE (S256)' : 'Standard Auth Code'}`,
      `Redirect URI: ${effectiveRedirect}`,
      `Scope: ${playgroundScopes.join(' ')}`,
      `✓ 200 OK — Authorization Code Issued: ${code}`,
      `-----------------------------------------`,
      `[2/3] POST /api/oauth/token (Bearer & ID Token Exchange)`,
      `✓ 200 OK — Bearer Access Token & ID Token Issued`,
      `token_type: Bearer (expires_in: 3600s)`,
      `access_token: ${accessToken}`,
      `id_token (JWT RS256): ${idToken.substring(0, 36)}... [Verified]`,
      `refresh_token: ${refreshToken}`,
      `-----------------------------------------`,
      `[3/3] GET /api/oauth/userinfo (OIDC User Identity Claims)`,
      `✓ 200 OK — User Identity Claims Verified (${elapsed}ms)`,
      JSON.stringify(mockClaims, null, 2)
    ]);

    showNotification('success', 'Full OAuth 2.0 & OIDC flow completed successfully!');
  };

  const activeSnippetApp = useMemo(() => {
    return apps.find(a => a.id === selectedSnippetAppId) || apps[0] || {
      id: 'mock_app',
      client_id: 'zenoa_oauth_your_client_id',
      client_secret: 'zen-oas_your_client_secret_7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c',
      app_name: `${branding.app_name || 'Zenoa'} Client`,
      redirect_uris: ['http://localhost:3000/auth/callback'],
      scopes: ['openid', 'profile', 'email'],
      environment: 'production' as const,
      created_at: Date.now()
    };
  }, [apps, selectedSnippetAppId, branding.app_name]);

  const activeSnippetRedirectUri = useMemo(() => {
    if (snippetRedirectUri && activeSnippetApp.redirect_uris?.includes(snippetRedirectUri)) {
      return snippetRedirectUri;
    }
    return activeSnippetApp.redirect_uris?.[0] || 'http://localhost:3000/auth/callback';
  }, [snippetRedirectUri, activeSnippetApp]);

  const filteredSnippetApps = useMemo(() => {
    if (!appDropdownSearch.trim()) return apps;
    const q = appDropdownSearch.toLowerCase();
    return apps.filter(a =>
      a.app_name.toLowerCase().includes(q) ||
      a.client_id.toLowerCase().includes(q) ||
      (a.environment && a.environment.toLowerCase().includes(q))
    );
  }, [apps, appDropdownSearch]);

  const currentSnippet = useMemo(() => {
    const app = activeSnippetApp;
    const defaultExampleUri = app.redirect_uris?.[0] || 'http://localhost:3000/auth/callback';
    const clientId = app.client_id;
    const clientSecretVal = showSnippetSecret ? `"${app.client_secret}"` : 'process.env.ZENOA_CLIENT_SECRET';
    const tokenUrl = getApiTokenUrl();
    const userinfoUrl = getApiUserInfoUrl();
    const discoveryUrl = getOidcDiscoveryUrl();
    const brandName = branding.app_name || 'Zenoa';

    switch (docsLanguage) {
      case 'react':
        return `// ==============================================================================
// Target Application: ${app.app_name}
// Client ID: ${clientId}
// Authorized Callback URIs:
${app.redirect_uris.map(uri => `//   - ${uri}`).join('\n')}
// NOTE: All authorized callback URIs share the exact same Client ID and Secret!
// ==============================================================================

// 1. Client-Side "Continue with ${brandName}" Button Component
export const ZenoaLoginButton = () => {
  const handleLogin = () => {
    const authEndpoint = "${getAccountsAuthUrl()}";
    const clientId = "${clientId}";
    
    // Read whichever authorized redirect URI is active in your current environment (e.g., localhost, staging, production)
    const redirectUri = encodeURIComponent(process.env.REACT_APP_ZENOA_REDIRECT_URI || "${defaultExampleUri}");
    const scope = encodeURIComponent("openid profile email");
    
    // Redirect to Zenoa Consent Screen
    window.location.href = \`\${authEndpoint}?client_id=\${clientId}&redirect_uri=\${redirectUri}&response_type=code&scope=\${scope}\`;
  };

  return (
    <button
      onClick={handleLogin}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
    >
      Continue with ${brandName}
    </button>
  );
};

// 2. Next.js App Router Server Handler (app/api/auth/callback/route.ts)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  // Load active authorized redirect_uri for current environment
  const redirectUri = process.env.ZENOA_REDIRECT_URI || "${defaultExampleUri}";

  // Server-to-Server Token Exchange
  const tokenRes = await fetch('${tokenUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: '${clientId}',
      client_secret: ${clientSecretVal},
      code,
      redirect_uri: redirectUri
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: tokenRes.status });
  }

  // Retrieve Verified Identity Claims
  const userRes = await fetch('${userinfoUrl}', {
    headers: { Authorization: \`Bearer \${tokenData.access_token}\` }
  });
  const user = await userRes.json();

  // Create your session cookie or JWT here
  return NextResponse.json({ success: true, user });
}`;

      case 'nodejs':
        return `// ==============================================================================
// Target Application: ${app.app_name}
// Client ID: ${clientId}
// Authorized Callback URIs:
${app.redirect_uris.map(uri => `//   - ${uri}`).join('\n')}
// NOTE: All authorized callback URIs share the exact same Client ID and Secret!
// ==============================================================================
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Load active authorized redirect_uri for current environment
const REDIRECT_URI = process.env.ZENOA_REDIRECT_URI || "${defaultExampleUri}";

// Step 1: Redirect user to Zenoa Consent Screen
app.get('/auth/login', (req, res) => {
  const authUrl = \`${getAccountsAuthUrl()}?client_id=${clientId}&redirect_uri=\${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid%20profile%20email\`;
  res.redirect(authUrl);
});

// Step 2: Callback route to exchange authorization code for Bearer Access Token
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Authorization code missing');

  try {
    const tokenResponse = await fetch('${tokenUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: '${clientId}',
        client_secret: ${clientSecretVal},
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    // Step 3: Fetch verified user identity claims
    const userProfileResponse = await fetch('${userinfoUrl}', {
      headers: { Authorization: \`Bearer \${tokenData.access_token}\` }
    });
    const user = await userProfileResponse.json();

    // User session successfully established!
    res.json({ status: 'authenticated', user });
  } catch (err) {
    res.status(500).json({ error: 'OAuth exchange failed', details: String(err) });
  }
});

app.listen(PORT, () => console.log(\`OAuth App listening on port \${PORT}\`));`;

      case 'python':
        return `# ==============================================================================
# Target Application: ${app.app_name}
# Client ID: ${clientId}
# Authorized Callback URIs:
${app.redirect_uris.map(uri => `#   - ${uri}`).join('\n')}
# NOTE: All authorized callback URIs share the exact same Client ID and Secret!
# ==============================================================================
import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse

app = FastAPI()

CLIENT_ID = "${clientId}"
CLIENT_SECRET = ${showSnippetSecret ? `"${app.client_secret}"` : 'os.getenv("ZENOA_CLIENT_SECRET", "")'}
# Load active authorized redirect_uri for current environment
REDIRECT_URI = os.getenv("ZENOA_REDIRECT_URI", "${defaultExampleUri}")
TOKEN_ENDPOINT = "${tokenUrl}"
USERINFO_ENDPOINT = "${userinfoUrl}"

@app.get("/auth/login")
def login():
    auth_url = f"${getAccountsAuthUrl()}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=openid%20profile%20email"
    return RedirectResponse(auth_url)

@app.get("/auth/callback")
async def auth_callback(code: str):
    async with httpx.AsyncClient() as client:
        # Step 1: Exchange code for Bearer Token
        token_res = await client.post(TOKEN_ENDPOINT, json={
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI
        })
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Token exchange failed")
        token_data = token_res.json()

        # Step 2: Query user identity claims
        user_res = await client.get(USERINFO_ENDPOINT, headers={
            "Authorization": f"Bearer {token_data['access_token']}"
        })
        return user_res.json()`;

      case 'curl':
        return `# ==============================================================================
# Zenoa RFC 6749 cURL Protocol (${app.app_name})
# NOTE: All authorized callback URIs share the exact same Client ID and Secret!
# ==============================================================================

# 1. Browser Authorization Request (Open in browser)
# ${getAccountsAuthUrl()}?client_id=${clientId}&redirect_uri=${encodeURIComponent(defaultExampleUri)}&response_type=code&scope=openid%20profile%20email

# 2. Server-to-Server Token Exchange (POST authorization_code)
curl -X POST "${tokenUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "${clientId}",
    "client_secret": "${showSnippetSecret ? app.client_secret : '$ZENOA_CLIENT_SECRET'}",
    "code": "zen_code_YOUR_CODE",
    "redirect_uri": "'"$ZENOA_REDIRECT_URI"'"
  }'

# 3. Fetch User Identity Claims (GET userinfo)
curl -X GET "${userinfoUrl}" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. OpenID Connect Discovery Document
curl -X GET "${discoveryUrl}"`;

      case 'env':
      default:
        return `# ==============================================================================
# Zenoa OAuth 2.0 Client Credentials (${app.app_name})
# Environment: ${app.environment || 'production'}
# NOTE: All authorized callback URIs share the exact same Client ID and Secret!
# ==============================================================================
ZENOA_CLIENT_ID="${clientId}"
ZENOA_CLIENT_SECRET="${showSnippetSecret ? app.client_secret : 'YOUR_COPIED_CLIENT_SECRET_HERE'}"

# Whitelist any authorized callback URI registered for this app (e.g., localhost or production)
ZENOA_REDIRECT_URI="${defaultExampleUri}"

# Zenoa OpenID Connect & OAuth 2.0 Discovery Endpoints
ZENOA_AUTH_URL="${getAccountsAuthUrl()}"
ZENOA_TOKEN_URL="${tokenUrl}"
ZENOA_USERINFO_URL="${userinfoUrl}"
ZENOA_DISCOVERY_URL="${discoveryUrl}"`;
    }
  }, [activeSnippetApp, showSnippetSecret, docsLanguage, branding.app_name]);

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
              ? 'bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 shadow-xs'
              : 'bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 shadow-xs'
            : isDark
            ? 'text-[#94a3b8] hover:bg-[#1c1e54] hover:text-white'
            : 'text-[#64748d] hover:bg-[#f6f9fc] hover:text-[#0d253d]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? (isDark ? 'text-[#818cf8]' : 'text-[#533afd]') : 'text-[#64748d] dark:text-[#94a3b8]'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
            isActive
              ? isDark ? 'bg-[#533afd]/30 text-[#b9b9f9]' : 'bg-[#533afd]/15 text-[#533afd]'
              : isDark ? 'bg-[#121624] text-[#94a3b8] border border-[#273951]' : 'bg-[#f6f9fc] text-[#64748d] border border-[#e3e8ee]'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors ${
      isDark ? 'dark bg-[#0c1024] text-white selection:bg-[#533afd] selection:text-white' : 'bg-[#f6f9fc] text-[#0d253d] selection:bg-[#533afd]/20 selection:text-[#533afd]'
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
      <aside className={`hidden md:flex flex-col w-64 border-r shrink-0 select-none transition-colors ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
      }`}>
        {/* Brand Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo
              src={activeLogo}
              name={branding.app_name || 'Zenoa'}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight truncate text-[#0d253d] dark:text-white">
                  {branding.app_name || 'Zenoa'} OAuth
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#533afd]/10 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#818cf8] border border-[#533afd]/20">
                  OIDC
                </span>
              </div>
              <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] truncate">
                Identity & Single Sign-On
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 p-3.5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Section: Main & Registry */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-[#64748d] dark:text-[#94a3b8]">
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
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-[#64748d] dark:text-[#94a3b8]">
              Sandbox & Simulator
            </div>
            <div className="space-y-1">
              {renderNavItem('playground', 'OAuth 2.0 Sandbox', Play, 'Live')}
              {renderNavItem('button', 'SSO Button Kit', Sparkles)}
            </div>
          </div>

          {/* Section: Email & Deliverability */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-[#64748d] dark:text-[#94a3b8]">
              Deliverability & Branding
            </div>
            <div className="space-y-1">
              {renderNavItem('smtp', 'Emails & SMTP', Mail, customSmtpAppsCount > 0 ? `${customSmtpAppsCount} Active` : undefined)}
            </div>
          </div>

          {/* Section: Integration & Audit */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-[#64748d] dark:text-[#94a3b8]">
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
          isDark ? 'border-[#273951] bg-[#0c1024]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]/80'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-[#533afd]/10 dark:bg-[#533afd]/20 flex items-center justify-center font-bold text-xs text-[#533afd] dark:text-[#818cf8] overflow-hidden shrink-0 border border-[#533afd]/20">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="User" className="h-full w-full object-cover" />
                ) : (
                  <span>{(currentUser?.username || 'D').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-[#0d253d] dark:text-white">{currentUser?.display_name || currentUser?.username || 'Developer'}</p>
                <p className="text-[10px] text-[#64748d] dark:text-[#94a3b8] truncate">@{currentUser?.username || 'dev'}</p>
              </div>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl border transition-colors cursor-pointer text-[#64748d] hover:text-[#0d253d] dark:hover:text-white shrink-0 ${
                  isDark ? 'border-[#273951] hover:bg-[#1c1e54]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc]'
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
                isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
              }`}
            >
              <div className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <BrandLogo
                    src={activeLogo}
                    name={branding.app_name || 'Zenoa'}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold truncate text-[#0d253d] dark:text-white">{branding.app_name || 'Zenoa'} OAuth</h2>
                    <p className="text-[10px] text-[#64748d] dark:text-[#94a3b8]">Developer Identity</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#64748d] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] cursor-pointer"
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
                  {renderNavItem('smtp', 'Emails & SMTP', Mail, customSmtpAppsCount > 0 ? `${customSmtpAppsCount} Active` : undefined)}
                  {renderNavItem('docs', 'SDKs & Reference', Code2)}
                  {renderNavItem('activity', 'Security & Audit', Activity)}
                </div>
              </div>

              <div className={`p-4 border-t flex items-center justify-between ${
                isDark ? 'border-[#273951] bg-[#0c1024]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]/80'
              }`}>
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
        <header className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 backdrop-blur-md z-10 transition-colors ${
          isDark ? 'bg-[#0c1024]/90 border-[#273951]' : 'bg-white/90 border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.04)]'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-xl border md:hidden transition-colors cursor-pointer shrink-0 ${
                isDark ? 'border-[#273951] text-[#cbd5e1] hover:bg-[#1c1e54]' : 'border-[#e3e8ee] text-[#273951] hover:bg-[#f6f9fc]'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold tracking-tight truncate text-[#0d253d] dark:text-white">
                {activeTab === 'overview' && 'Console Overview'}
                {activeTab === 'apps' && 'OAuth 2.0 Client Registry'}
                {activeTab === 'create' && (editingAppId ? 'Update Client Configuration' : 'Register Application')}
                {activeTab === 'playground' && 'Interactive OAuth 2.0 Sandbox'}
                {activeTab === 'button' && 'Single Sign-On (SSO) Button Kit'}
                {activeTab === 'smtp' && 'Emails & Custom SMTP Delivery'}
                {activeTab === 'docs' && 'SDKs & API Reference'}
                {activeTab === 'activity' && 'Security & Audit Logs'}
              </h2>
              <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] hidden sm:block truncate">
                {activeTab === 'overview' && 'System status, identity protocol metrics, and OAuth endpoints.'}
                {activeTab === 'apps' && 'Manage your registered client applications, credentials, and callback URIs.'}
                {activeTab === 'create' && 'Configure application details, allowed redirect URIs, and scopes.'}
                {activeTab === 'playground' && 'Test live authorization code generation, token exchange, and claims.'}
                {activeTab === 'button' && 'Generate copy-ready "Continue with Zenoa" button components.'}
                {activeTab === 'smtp' && 'Route OTP codes, verification alerts, and system emails via your official business mail server.'}
                {activeTab === 'docs' && 'Production integration examples for React, Node, Python, and cURL.'}
                {activeTab === 'activity' && 'Live event stream of authorization grants and token authentications.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#273951]" />}
            </button>

            {/* Quick Register CTA */}
            {activeTab !== 'create' && (
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('create');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[13px] font-medium shadow-[0_1px_3px_rgba(0,55,112,0.15)] transition-all cursor-pointer shrink-0 active:scale-[0.98]"
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
              <div className="space-y-6 animate-fade-in">
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search applications by name or Client ID..."
                      className={`w-full px-4 py-2.5 pl-10 text-xs rounded-xl border outline-none font-medium transition-all ${
                        isDark
                          ? 'bg-[#0d1326] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                          : 'bg-white border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                      }`}
                    />
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748d] dark:text-[#94a3b8]" />
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {filteredApps.length > 0 && (
                      <button
                        onClick={() => {
                          const allExpanded = filteredApps.every(a => expandedAppIds[a.id]);
                          const nextState: Record<string, boolean> = {};
                          filteredApps.forEach(a => {
                            nextState[a.id] = !allExpanded;
                          });
                          setExpandedAppIds(nextState);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
                        }`}
                        title="Expand or collapse all application cards"
                      >
                        {filteredApps.every(a => expandedAppIds[a.id]) ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Collapse All</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Expand All</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={fetchApps}
                      className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                        isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
                      }`}
                      title="Refresh client registry list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    <button
                      onClick={() => { resetForm(); setActiveTab('create'); }}
                      className="px-4 py-2.5 rounded-xl bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Client</span>
                    </button>
                  </div>
                </div>

                {/* Application Cards List */}
                {isLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#64748d] dark:text-[#94a3b8]">
                    <RefreshCw className="w-7 h-7 animate-spin text-[#533afd]" />
                    <p className="text-xs font-medium">Loading client registry...</p>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className={`p-12 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${
                    isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee] shadow-xs'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-[#533afd]/10 dark:bg-[#533afd]/20 flex items-center justify-center text-[#533afd] dark:text-[#818cf8]">
                      <Key className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h3 className="font-bold text-base text-[#0d253d] dark:text-white">No Client Applications Found</h3>
                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] max-w-sm leading-relaxed">
                      {searchQuery ? 'No registered applications match your search query.' : 'Register your first OAuth 2.0 client to start using Single Sign-On.'}
                    </p>
                    <button
                      onClick={() => { resetForm(); setActiveTab('create'); }}
                      className="mt-2 px-5 py-2.5 bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Register New Client
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApps.map(app => {
                      const isOfficial = app.id === 'sso_official_default';
                      const isExpanded = !!expandedAppIds[app.id];

                      return (
                        <div
                          key={app.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isDark
                              ? isExpanded ? 'bg-[#0d1326] border-[#384c68] shadow-md' : 'bg-[#0d1326] border-[#273951] hover:border-[#384c68]'
                              : isExpanded ? 'bg-white border-[#cbd5e1] shadow-md' : 'bg-white border-[#e3e8ee] hover:border-[#cbd5e1] shadow-xs'
                          }`}
                        >
                          {/* Top Row: Clean Compact Header */}
                          <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div
                              onClick={() => toggleAppExpanded(app.id)}
                              className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer select-none group"
                            >
                              <BrandLogo
                                src={app.logo_url}
                                name={app.app_name}
                                size="md"
                              />

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm sm:text-base tracking-tight truncate text-[#0d253d] dark:text-white group-hover:text-[#533afd] transition-colors">
                                    {app.app_name}
                                  </h3>
                                  {isOfficial && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 border border-[#533afd]/20">
                                      System
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                    app.environment === 'sandbox'
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                                  }`}>
                                    {app.environment || 'Production'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f1f5f9] dark:bg-[#1c2438] text-[#64748d] dark:text-[#94a3b8] border border-transparent">
                                    {app.redirect_uris?.length || 0} {app.redirect_uris?.length === 1 ? 'Callback URI' : 'Callback URIs'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#64748d] dark:text-[#94a3b8]">
                                  <span className="font-mono text-[11px] font-medium truncate max-w-[200px] sm:max-w-xs">
                                    {app.client_id}
                                  </span>
                                  <span className="text-[#cbd5e1] dark:text-[#334155]">&bull;</span>
                                  <span className="text-[11px] text-[#533afd] dark:text-[#818cf8] font-semibold flex items-center gap-0.5 group-hover:underline">
                                    {isExpanded ? 'Hide Details' : 'Click to View Credentials'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap pt-2 sm:pt-0 border-t lg:border-t-0 border-[#e3e8ee] dark:border-[#273951] w-full lg:w-auto justify-between sm:justify-end">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTesterAppId(app.id);
                                    setTestRedirectUri(app.redirect_uris[0] || '');
                                    setActiveTab('playground');
                                  }}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
                                  }`}
                                  title="Test in OAuth Sandbox"
                                >
                                  <Play className="w-3.5 h-3.5 text-[#533afd]" />
                                  <span>Sandbox</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSnippetAppId(app.id);
                                    setSnippetRedirectUri(app.redirect_uris?.[0] || '');
                                    setActiveTab('docs');
                                  }}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
                                  }`}
                                  title="View SDK Code Snippets"
                                >
                                  <Code2 className="w-3.5 h-3.5 text-[#533afd]" />
                                  <span>SDK</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditApp(app);
                                  }}
                                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                    isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#94a3b8] hover:text-white' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#64748d] hover:text-[#0d253d]'
                                  }`}
                                  title="Edit Configuration"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {!isOfficial && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmApp(app);
                                    }}
                                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors cursor-pointer"
                                    title="Delete Client"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Expand/Collapse Toggle Button */}
                              <button
                                type="button"
                                onClick={() => toggleAppExpanded(app.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isExpanded
                                    ? 'bg-[#533afd] text-white'
                                    : isDark
                                      ? 'bg-[#1c1e54] text-[#cbd5e1] hover:bg-[#273951]'
                                      : 'bg-[#f1f5f9] text-[#273951] hover:bg-[#e2e8f0]'
                                }`}
                              >
                                <span>{isExpanded ? 'Close' : 'Details'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Details Body (Animated) */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden border-t border-[#e3e8ee] dark:border-[#273951] bg-[#f8fafc]/50 dark:bg-[#090d1a]/50"
                              >
                                <div className="p-5 sm:p-6 space-y-5">
                                  {/* Description & Metadata if present */}
                                  {app.app_description && (
                                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                                      {app.app_description}
                                    </p>
                                  )}

                                  {/* Credentials Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Client ID */}
                                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'}`}>
                                      <div className="flex items-center justify-between text-[11px] font-bold text-[#64748d] dark:text-[#94a3b8] mb-2">
                                        <span>Client ID</span>
                                        <span className="text-[10px] text-emerald-500 font-mono font-bold">Public</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3">
                                        <code className="text-xs font-mono font-bold text-[#0d253d] dark:text-slate-100 break-all select-all">
                                          {app.client_id}
                                        </code>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(app.client_id, `cid_${app.id}`, 'Client ID copied to clipboard')}
                                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1c1e54] text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                                          title="Copy Client ID"
                                        >
                                          {copiedKey === `cid_${app.id}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Client Secret */}
                                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'}`}>
                                      <div className="flex items-center justify-between text-[11px] font-bold text-[#64748d] dark:text-[#94a3b8] mb-2">
                                        <span className="text-rose-500 font-bold">Client Secret</span>
                                        <button
                                          type="button"
                                          onClick={() => setSecretRotateModalApp(app)}
                                          className="text-[10px] text-[#533afd] dark:text-[#818cf8] hover:underline font-bold cursor-pointer"
                                        >
                                          Rotate Secret
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-between gap-3">
                                        <code className="text-xs font-mono font-bold text-[#94a3b8] tracking-widest break-all select-all">
                                          ••••••••••••••••••••••••••••••••
                                        </code>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(app.client_secret, `sec_${app.id}`, 'Client Secret copied to clipboard')}
                                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1c1e54] text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                                          title="Copy Client Secret"
                                        >
                                          {copiedKey === `sec_${app.id}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Authorized Redirect URIs Management */}
                                  <div className="space-y-3 pt-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-[#533afd]" />
                                        <span className="text-xs font-bold text-[#0d253d] dark:text-white">Authorized Callback URIs</span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#f1f5f9] dark:bg-[#1c2438] text-[#64748d] dark:text-[#94a3b8]">
                                          {app.redirect_uris?.length || 0}
                                        </span>
                                      </div>

                                      {uriSavingAppId === app.id && (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-500">
                                          <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                                        </span>
                                      )}
                                      {uriSavedSuccessAppId === app.id && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                                          <CheckCheck className="w-3.5 h-3.5" /> Saved
                                        </span>
                                      )}
                                    </div>

                                    {/* URIs List */}
                                    <div className="space-y-2">
                                      <AnimatePresence initial={false}>
                                        {(app.redirect_uris || []).map((uri, idx) => (
                                          <motion.div
                                            key={uri}
                                            layout
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-colors ${
                                              isDark
                                                ? 'bg-[#0d1326] border-[#273951] text-slate-200'
                                                : 'bg-white border-[#e3e8ee] text-[#0d253d]'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                              <span className="truncate font-medium">{uri}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => handleCopy(uri, `uri_${app.id}_${idx}`, 'Redirect URI copied')}
                                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#1c1e54] text-[#64748d] dark:text-[#94a3b8] transition-colors cursor-pointer"
                                                title="Copy URI"
                                              >
                                                {copiedKey === `uri_${app.id}_${idx}` ? (
                                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                ) : (
                                                  <Copy className="w-3.5 h-3.5" />
                                                )}
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if ((app.redirect_uris?.length || 0) <= 1) {
                                                    showNotification('error', 'OAuth clients require at least one allowed Redirect URI');
                                                    return;
                                                  }
                                                  const next = app.redirect_uris.filter((_, i) => i !== idx);
                                                  handleUpdateAppRedirectUris(app.id, next, 'removed');
                                                }}
                                                disabled={uriSavingAppId === app.id || (app.redirect_uris?.length || 0) <= 1}
                                                className={`p-1 transition-colors cursor-pointer ${
                                                  (app.redirect_uris?.length || 0) <= 1
                                                    ? 'text-[#cbd5e1] dark:text-[#475569] cursor-not-allowed'
                                                    : 'text-[#64748d] hover:text-rose-500'
                                                }`}
                                                title={(app.redirect_uris?.length || 0) <= 1 ? 'At least one Redirect URI is required' : 'Remove URI'}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </AnimatePresence>
                                    </div>

                                    {/* Add URI Field */}
                                    <div className="flex gap-2 pt-1">
                                      <input
                                        type="text"
                                        value={quickUriInputByApp[app.id] || ''}
                                        onChange={e => setQuickUriInputByApp(prev => ({ ...prev, [app.id]: e.target.value }))}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleQuickAddUri(app.id);
                                          }
                                        }}
                                        placeholder="Add callback URL (e.g. https://example.com/auth/callback)"
                                        className={`flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border outline-none transition-all ${
                                          isDark
                                            ? 'bg-[#0d1326] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                                            : 'bg-white border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleQuickAddUri(app.id)}
                                        disabled={uriSavingAppId === app.id || !(quickUriInputByApp[app.id] || '').trim()}
                                        className="px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
                                      >
                                        {uriSavingAppId === app.id ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Plus className="w-3.5 h-3.5" />
                                        )}
                                        <span>Add</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
              <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee] shadow-xs'} animate-fade-in`}>
                <div className="flex items-center justify-between pb-5 border-b border-[#e3e8ee] dark:border-[#273951] mb-6">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg tracking-tight text-[#0d253d] dark:text-white">
                      {editingAppId ? 'Edit Application Configuration' : 'Register New Application'}
                    </h3>
                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">
                      Provide your application name and authorized callback URIs for OAuth 2.0 authentication.
                    </p>
                  </div>
                  {editingAppId && (
                    <button
                      onClick={() => { resetForm(); setActiveTab('apps'); }}
                      className="text-xs font-semibold text-[#64748d] hover:text-[#0d253d] dark:hover:text-white cursor-pointer px-3 py-1.5 rounded-lg border border-[#e3e8ee] dark:border-[#273951]"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitApp} className="space-y-6">
                  {/* Basic Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                        Application Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={appName}
                        onChange={e => setAppName(e.target.value)}
                        placeholder="e.g. Acme Dashboard"
                        className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                          isDark
                            ? 'bg-[#090d1a] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                            : 'bg-[#f8fafc] border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                        Environment Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEnvironment('production')}
                          className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            environment === 'production'
                              ? 'border-[#533afd] bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8]'
                              : isDark ? 'border-[#273951] bg-[#090d1a] text-[#94a3b8]' : 'border-[#e3e8ee] bg-[#f8fafc] text-[#64748d]'
                          }`}
                        >
                          Production
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnvironment('sandbox')}
                          className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            environment === 'sandbox'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : isDark ? 'border-[#273951] bg-[#090d1a] text-[#94a3b8]' : 'border-[#e3e8ee] bg-[#f8fafc] text-[#64748d]'
                          }`}
                        >
                          Sandbox
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Redirect URIs Manager */}
                  <div className="space-y-2.5 pt-2 border-t border-[#e3e8ee] dark:border-[#273951]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200 flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-[#533afd] shrink-0" />
                        <span>Authorized Redirect URIs (OAuth Callbacks) <span className="text-rose-500">*</span></span>
                      </label>

                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#64748d] dark:text-[#94a3b8]">
                        <button
                          type="button"
                          onClick={() => handleAddRedirectUri('http://localhost:3000/auth/callback')}
                          className="text-[#533afd] dark:text-[#818cf8] hover:underline font-semibold cursor-pointer"
                        >
                          + Localhost:3000
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => handleAddRedirectUri(window.location.origin + '/auth/callback')}
                          className="text-[#533afd] dark:text-[#818cf8] hover:underline font-semibold cursor-pointer"
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
                        placeholder="https://example.com/auth/callback"
                        className={`flex-1 px-4 py-2.5 text-xs rounded-xl border outline-none font-mono transition-all ${
                          isDark
                            ? 'bg-[#090d1a] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                            : 'bg-[#f8fafc] border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddRedirectUri()}
                        className="px-4 py-2.5 bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add URI</span>
                      </button>
                    </div>

                    {/* Animated URIs List */}
                    <div className="space-y-2 mt-2">
                      <AnimatePresence initial={false}>
                        {redirectUrisList.map((uri, idx) => (
                          <motion.div
                            key={uri}
                            layout
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all ${
                              isDark ? 'bg-[#090d1a] border-[#273951] text-slate-300' : 'bg-[#f8fafc] border-[#e3e8ee] text-[#0d253d]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{uri}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(uri, `form_uri_${idx}`, 'URI copied')}
                                className="text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white p-1 cursor-pointer transition-colors"
                                title="Copy URI"
                              >
                                {copiedKey === `form_uri_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRedirectUri(idx)}
                                disabled={redirectUrisList.length === 1}
                                className={`p-1 transition-colors ${
                                  redirectUrisList.length === 1
                                    ? 'text-[#cbd5e1] dark:text-[#475569] cursor-not-allowed'
                                    : 'text-[#64748d] hover:text-rose-500 cursor-pointer'
                                }`}
                                title={redirectUrisList.length === 1 ? 'At least one Redirect URI is required' : 'Remove URI'}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Optional App Metadata */}
                  <div className="space-y-4 pt-2 border-t border-[#e3e8ee] dark:border-[#273951]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                          Homepage Website URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={e => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                            isDark
                              ? 'bg-[#090d1a] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                              : 'bg-[#f8fafc] border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                          }`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                          Application Logo URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={e => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                            isDark
                              ? 'bg-[#090d1a] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                              : 'bg-[#f8fafc] border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                        Application Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={appDescription}
                        onChange={e => setAppDescription(e.target.value)}
                        placeholder="Brief summary of your application..."
                        className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                          isDark
                            ? 'bg-[#090d1a] border-[#273951] focus:border-[#533afd] text-white placeholder:text-[#64748d]'
                            : 'bg-[#f8fafc] border-[#e3e8ee] focus:border-[#533afd] text-[#0d253d] placeholder:text-[#94a3b8]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-[#e3e8ee] dark:border-[#273951] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { resetForm(); setActiveTab('apps'); }}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingAppId ? 'Save Changes' : 'Register Application'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: CLEAN & PROFESSIONAL OAUTH 2.0 / OIDC SANDBOX                     */}
            {/* ========================================================================= */}
            {activeTab === 'playground' && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. Header & Primary Controls */}
                <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee] shadow-xs'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#e3e8ee] dark:border-[#273951]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg sm:text-xl tracking-tight text-[#0d253d] dark:text-white">
                          OAuth 2.0 & OIDC Sandbox
                        </h3>
                        {playgroundLatencyMs > 0 && (
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            ⚡ {playgroundLatencyMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                        Test authorization flows, token issuance, and OpenID Connect identity claims in real time.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetPlayground}
                        disabled={isTesterRunning || autoRunInProgress}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
                          isDark ? 'border-[#273951] hover:bg-[#151c33] text-slate-300' : 'border-[#e3e8ee] hover:bg-[#f8fafc] text-[#475569]'
                        }`}
                        title="Reset Sandbox"
                      >
                        <RotateCcw className="w-4 h-4 text-[#64748d]" />
                        <span>Reset</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRunFullPipeline}
                        disabled={isTesterRunning || autoRunInProgress}
                        className="px-5 py-2.5 bg-[#533afd] hover:bg-[#4434d4] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        {autoRunInProgress ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        )}
                        <span>{autoRunInProgress ? 'Running Flow...' : 'Run Full Flow'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Configuration Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
                    {/* Target Application */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                        Client Application
                      </label>
                      <select
                        value={selectedTesterAppId || activeTesterApp.id}
                        onChange={e => {
                          setSelectedTesterAppId(e.target.value);
                          const app = apps.find(a => a.id === e.target.value);
                          if (app && app.redirect_uris?.length > 0) {
                            setTestRedirectUri(app.redirect_uris[0]);
                          }
                          setPlaygroundStep('idle');
                          setPlaygroundAuthCode('');
                          setPlaygroundAccessToken('');
                          setPlaygroundIdToken('');
                          setPlaygroundUserResult(null);
                          setTesterLog([]);
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium truncate transition-colors ${
                          isDark ? 'bg-[#090d1a] border-[#273951] text-white focus:border-[#533afd]' : 'bg-[#f8fafc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                        }`}
                      >
                        {apps.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.app_name} ({a.environment === 'sandbox' ? 'Sandbox' : 'Prod'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Flow Mode */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                        Grant Flow Mode
                      </label>
                      <select
                        value={playgroundGrantType}
                        onChange={(e: any) => {
                          setPlaygroundGrantType(e.target.value);
                          setPlaygroundStep('idle');
                        }}
                        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-colors ${
                          isDark ? 'bg-[#090d1a] border-[#273951] text-white focus:border-[#533afd]' : 'bg-[#f8fafc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                        }`}
                      >
                        <option value="authorization_code">Authorization Code (Confidential Web Server)</option>
                        <option value="pkce">Auth Code + PKCE S256 (SPA / Mobile App)</option>
                        <option value="client_credentials">Client Credentials (Machine-to-Machine)</option>
                        <option value="refresh_token">Refresh Token Rotation</option>
                      </select>
                    </div>

                    {/* Callback Redirect URI */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                        Authorized Callback URI
                      </label>
                      <select
                        value={testRedirectUri}
                        onChange={e => setTestRedirectUri(e.target.value)}
                        className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none truncate transition-colors ${
                          isDark ? 'bg-[#090d1a] border-[#273951] text-slate-200 focus:border-[#533afd]' : 'bg-[#f8fafc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                        }`}
                      >
                        {(activeTesterApp.redirect_uris || ['http://localhost:3000/auth/callback']).map((u, i) => (
                          <option key={i} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advanced Settings Toggle */}
                  <div className="pt-5 mt-5 border-t border-[#e3e8ee] dark:border-[#273951]">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedPlaygroundSettings(prev => !prev)}
                      className="text-xs font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showAdvancedPlaygroundSettings ? 'Hide Advanced Options & Simulator' : 'Show Advanced Options & Simulator'}</span>
                      {showAdvancedPlaygroundSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Expandable Advanced Options */}
                    <AnimatePresence>
                      {showAdvancedPlaygroundSettings && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-5 pt-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl border bg-[#f8fafc] dark:bg-[#090d1a] border-[#e3e8ee] dark:border-[#273951]">
                            {/* Scopes */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-[#0d253d] dark:text-slate-200">
                                Requested OAuth Scopes
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {['openid', 'profile', 'email', 'phone', 'offline_access'].map(sc => {
                                  const isSelected = playgroundScopes.includes(sc);
                                  return (
                                    <button
                                      key={sc}
                                      type="button"
                                      onClick={() => {
                                        if (sc === 'openid') return;
                                        setPlaygroundScopes(prev =>
                                          prev.includes(sc) ? prev.filter(s => s !== sc) : [...prev, sc]
                                        );
                                      }}
                                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#533afd] text-white border-[#533afd]'
                                          : isDark ? 'bg-[#0d1326] text-[#94a3b8] border-[#273951] hover:border-slate-500' : 'bg-white text-[#64748d] border-[#e3e8ee] hover:border-slate-300'
                                      }`}
                                    >
                                      {sc} {sc === 'openid' ? '(required)' : ''}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Error Simulator */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-[#0d253d] dark:text-slate-200 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                <span>Simulate RFC 6749 Errors</span>
                              </span>
                              <select
                                value={playgroundSimulatedError}
                                onChange={(e: any) => {
                                  setPlaygroundSimulatedError(e.target.value);
                                  if (e.target.value !== 'none') {
                                    showNotification('success', `Simulator mode: ${e.target.value}`);
                                  }
                                }}
                                className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium transition-colors ${
                                  playgroundSimulatedError !== 'none'
                                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                                    : isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
                                }`}
                              >
                                <option value="none">Normal (Standard 200 OK Flow)</option>
                                <option value="invalid_client">Simulate 401 Unauthorized (invalid_client)</option>
                                <option value="invalid_grant">Simulate 400 Bad Request (invalid_grant / expired code)</option>
                                <option value="redirect_uri_mismatch">Simulate 400 Bad Request (redirect_uri_mismatch)</option>
                                <option value="invalid_scope">Simulate 400 Bad Request (invalid_scope)</option>
                                <option value="expired_token">Simulate 401 UserInfo (expired_token)</option>
                              </select>
                            </div>
                          </div>

                          {/* Cryptographic Parameters */}
                          <div className="flex items-center justify-between gap-4 text-xs font-mono text-[#64748d] dark:text-[#94a3b8] flex-wrap px-1">
                            <div>State: <strong className="text-indigo-500">{playgroundStateParam.substring(0, 14)}...</strong></div>
                            <div>Nonce: <strong className="text-indigo-500">{playgroundNonce.substring(0, 14)}...</strong></div>
                            {playgroundGrantType === 'pkce' && (
                              <div>PKCE Challenge: <strong className="text-emerald-500">{pkceChallenge.substring(0, 16)}...</strong></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 3. Interactive 3-Step Execution Pipeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Step 1: Authorization Code */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    playgroundStep === 'idle'
                      ? isDark ? 'bg-[#0d1326] border-[#533afd] ring-1 ring-[#533afd]/30' : 'bg-white border-[#533afd] ring-1 ring-[#533afd]/20 shadow-sm'
                      : playgroundAuthCode
                      ? isDark ? 'bg-[#0d1326] border-emerald-500/40' : 'bg-white border-emerald-500/30'
                      : isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] font-bold text-xs flex items-center justify-center">
                            1
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">
                            Authorization
                          </span>
                        </div>
                        {playgroundAuthCode ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Issued
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#94a3b8]">POST /auth/sso</span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-[#0d253d] dark:text-white">
                        Issue Authorization Code
                      </h4>
                      <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                        Request a secure, single-use authorization code with state and nonce verification.
                      </p>

                      {playgroundAuthCode ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate flex items-center justify-between gap-2">
                          <span className="truncate">{playgroundAuthCode}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(playgroundAuthCode, 'sb_code', 'Auth Code copied')}
                            className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer shrink-0"
                            title="Copy Code"
                          >
                            {copiedKey === 'sb_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#090d1a] border border-dashed border-slate-300 dark:border-[#273951] text-[11px] text-[#94a3b8] text-center">
                          Awaiting authorization trigger
                        </div>
                      )}
                    </div>

                    <div className="pt-5 mt-4 border-t border-[#e3e8ee] dark:border-[#273951]">
                      <button
                        type="button"
                        onClick={handlePlaygroundAuthorize}
                        disabled={isTesterRunning || autoRunInProgress}
                        className="w-full py-2.5 px-4 bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{playgroundAuthCode ? 'Re-Issue Code' : 'Issue Auth Code'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Token Exchange */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    playgroundStep === 'authorized'
                      ? isDark ? 'bg-[#0d1326] border-[#533afd] ring-1 ring-[#533afd]/30' : 'bg-white border-[#533afd] ring-1 ring-[#533afd]/20 shadow-sm'
                      : playgroundAccessToken
                      ? isDark ? 'bg-[#0d1326] border-emerald-500/40' : 'bg-white border-emerald-500/30'
                      : isDark ? 'bg-[#0d1326] border-[#273951] opacity-75' : 'bg-white border-[#e3e8ee] opacity-75'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] font-bold text-xs flex items-center justify-center">
                            2
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">
                            Token Exchange
                          </span>
                        </div>
                        {playgroundAccessToken ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Exchanged
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#94a3b8]">POST /oauth/token</span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-[#0d253d] dark:text-white">
                        Exchange for Bearer & ID Token
                      </h4>
                      <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                        Exchanges the single-use code for Bearer token, refresh token, and signed OIDC JWT.
                      </p>

                      {playgroundAccessToken ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate flex items-center justify-between gap-2">
                          <span className="truncate">Bearer: {playgroundAccessToken.substring(0, 16)}...</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(playgroundAccessToken, 'sb_at', 'Access Token copied')}
                            className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer shrink-0"
                            title="Copy Token"
                          >
                            {copiedKey === 'sb_at' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#090d1a] border border-dashed border-slate-300 dark:border-[#273951] text-[11px] text-[#94a3b8] text-center">
                          Awaiting authorization code
                        </div>
                      )}
                    </div>

                    <div className="pt-5 mt-4 border-t border-[#e3e8ee] dark:border-[#273951]">
                      <button
                        type="button"
                        onClick={() => handlePlaygroundExchangeToken()}
                        disabled={!playgroundAuthCode || isTesterRunning || autoRunInProgress}
                        className="w-full py-2.5 px-4 bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Exchange Tokens</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 3: User Identity Claims */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    playgroundStep === 'token_exchanged'
                      ? isDark ? 'bg-[#0d1326] border-[#533afd] ring-1 ring-[#533afd]/30' : 'bg-white border-[#533afd] ring-1 ring-[#533afd]/20 shadow-sm'
                      : playgroundUserResult
                      ? isDark ? 'bg-[#0d1326] border-emerald-500/40' : 'bg-white border-emerald-500/30'
                      : isDark ? 'bg-[#0d1326] border-[#273951] opacity-75' : 'bg-white border-[#e3e8ee] opacity-75'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] font-bold text-xs flex items-center justify-center">
                            3
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">
                            User Claims
                          </span>
                        </div>
                        {playgroundUserResult ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#94a3b8]">GET /oauth/userinfo</span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-[#0d253d] dark:text-white">
                        Fetch OpenID Profile Claims
                      </h4>
                      <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                        Authorize with Bearer header to retrieve user identity claims and verified emails.
                      </p>

                      {playgroundUserResult ? (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate flex items-center justify-between gap-2">
                          <span className="truncate">{playgroundUserResult.email || playgroundUserResult.sub}</span>
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#090d1a] border border-dashed border-slate-300 dark:border-[#273951] text-[11px] text-[#94a3b8] text-center">
                          Awaiting access token
                        </div>
                      )}
                    </div>

                    <div className="pt-5 mt-4 border-t border-[#e3e8ee] dark:border-[#273951]">
                      <button
                        type="button"
                        onClick={() => handlePlaygroundFetchUserInfo()}
                        disabled={!playgroundAccessToken || isTesterRunning || autoRunInProgress}
                        className="w-full py-2.5 px-4 bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Fetch User Claims</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Live Developer Console & Inspector */}
                <div className="rounded-2xl bg-[#090d1a] border border-[#273951] text-slate-200 overflow-hidden shadow-xl">
                  {/* Console Tab Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 bg-[#050814] border-b border-[#273951] gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => setPlaygroundInspectorTab('claims')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                          playgroundInspectorTab === 'claims'
                            ? 'bg-[#533afd] text-white'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#121624]'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>User Profile & Claims</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlaygroundInspectorTab('tokens')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                          playgroundInspectorTab === 'tokens'
                            ? 'bg-[#533afd] text-white'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#121624]'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tokens & Decoded JWT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlaygroundInspectorTab('http')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                          playgroundInspectorTab === 'http'
                            ? 'bg-[#533afd] text-white'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#121624]'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>HTTP Inspector</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlaygroundInspectorTab('terminal')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                          playgroundInspectorTab === 'terminal'
                            ? 'bg-[#533afd] text-white'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#121624]'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Trace Logs</span>
                        {testerLog.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlaygroundInspectorTab('curl')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                          playgroundInspectorTab === 'curl'
                            ? 'bg-[#533afd] text-white'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#121624]'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>cURL</span>
                      </button>
                    </div>

                    {/* Console Actions */}
                    {testerLog.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTesterLog([]);
                          setPlaygroundRawHttp(null);
                        }}
                        className="text-xs text-[#94a3b8] hover:text-white px-3 py-1 rounded-lg hover:bg-[#121624] transition-colors cursor-pointer shrink-0"
                      >
                        Clear Console
                      </button>
                    )}
                  </div>

                  {/* Console Body */}
                  <div className="p-6">
                    {/* TAB 1: USER PROFILE & CLAIMS */}
                    {playgroundInspectorTab === 'claims' && (
                      <div>
                        {playgroundUserResult ? (
                          <div className="space-y-6">
                            {/* Profile Card */}
                            <div className="p-5 rounded-xl bg-[#050814] border border-[#273951] flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#533afd] to-indigo-500 text-white font-bold text-lg flex items-center justify-center shrink-0">
                                  {(playgroundUserResult.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-white">
                                      {playgroundUserResult.name}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      Verified OpenID User
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                                    {playgroundUserResult.email} &bull; @{playgroundUserResult.username}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right text-xs text-[#94a3b8] font-mono shrink-0">
                                <div>Sub: <strong className="text-slate-300">{playgroundUserResult.sub}</strong></div>
                                <div>Org: <strong className="text-indigo-400">Inolas Nexus Private Limited</strong></div>
                              </div>
                            </div>

                            {/* Claims JSON */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
                                  Raw OpenID Connect Claims Payload
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(JSON.stringify(playgroundUserResult, null, 2), 'copy_claims', 'Claims JSON copied')}
                                  className="text-xs font-mono text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === 'copy_claims' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>Copy JSON</span>
                                </button>
                              </div>
                              <pre className="p-4 rounded-xl bg-[#050814] border border-[#273951] text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed">
                                {JSON.stringify(playgroundUserResult, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 text-center space-y-3">
                            <UserCheck className="w-10 h-10 text-[#475569] mx-auto" />
                            <h5 className="font-bold text-sm text-slate-300">No User Claims Retrieved Yet</h5>
                            <p className="text-xs text-[#64748d] max-w-md mx-auto leading-relaxed">
                              Click <strong>"Run Full Flow"</strong> at the top or execute Step 3 to fetch and inspect verified identity claims.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: TOKENS & DECODED JWT */}
                    {playgroundInspectorTab === 'tokens' && (
                      <div>
                        {playgroundAccessToken ? (
                          <div className="space-y-6">
                            {/* Access Token */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Bearer Access Token (RFC 6750)</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(playgroundAccessToken, 'cp_at_raw', 'Access Token copied')}
                                  className="text-xs font-mono text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === 'cp_at_raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>Copy Token</span>
                                </button>
                              </div>
                              <div className="p-3.5 rounded-xl bg-[#050814] border border-[#273951] text-xs font-mono text-emerald-300 break-all select-all">
                                {playgroundAccessToken}
                              </div>
                            </div>

                            {/* Decoded OIDC ID-Token (JWT) */}
                            {playgroundIdToken && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Decoded ID-Token JWT (RS256 Verified by Inolas Nexus Private Limited)</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(playgroundIdToken, 'cp_id_raw', 'ID-Token copied')}
                                    className="text-xs font-mono text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === 'cp_id_raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>Copy Raw JWT</span>
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 rounded-xl bg-[#050814] border border-rose-500/30 space-y-1.5">
                                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                                      Header (Algorithm & Key ID)
                                    </div>
                                    <pre className="text-rose-300 text-xs font-mono overflow-x-auto">
{JSON.stringify({ alg: "RS256", typ: "JWT", kid: "zenoa_inolas_key_2026" }, null, 2)}
                                    </pre>
                                  </div>

                                  <div className="p-4 rounded-xl bg-[#050814] border border-purple-500/30 space-y-1.5">
                                    <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                                      Payload (OIDC Identity Claims)
                                    </div>
                                    <pre className="text-purple-300 text-xs font-mono overflow-x-auto">
{JSON.stringify({
  iss: "https://accounts.zenoa.in",
  sub: currentUser?.zenoa_id || "usr_zenoa_9901",
  aud: activeTesterApp.client_id,
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  name: currentUser?.display_name || "Alex Developer",
  preferred_username: currentUser?.username || "alex_dev",
  email: currentUser?.email || "developer@zenoa.in",
  organization: "Inolas Nexus Private Limited"
}, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Refresh Token */}
                            {playgroundRefreshToken && (
                              <div className="p-4 rounded-xl bg-[#050814] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                    <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Refresh Token (Rotation Ready)</span>
                                  </span>
                                  <div className="text-xs font-mono text-purple-200 truncate max-w-sm">
                                    {playgroundRefreshToken}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handlePlaygroundRefreshToken}
                                  disabled={isTesterRunning || autoRunInProgress}
                                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                                >
                                  Rotate Access Token
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-12 text-center space-y-3">
                            <Lock className="w-10 h-10 text-[#475569] mx-auto" />
                            <h5 className="font-bold text-sm text-slate-300">No Tokens Issued Yet</h5>
                            <p className="text-xs text-[#64748d] max-w-md mx-auto leading-relaxed">
                              Execute Step 2 or run the full pipeline to generate Bearer tokens and decode RS256 JWTs.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: HTTP INSPECTOR */}
                    {playgroundInspectorTab === 'http' && (
                      <div>
                        {playgroundRawHttp ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                                <span>HTTP Request ({playgroundRawHttp.method} {playgroundRawHttp.path})</span>
                              </div>
                              <pre className="p-4 rounded-xl bg-[#050814] border border-[#273951] text-indigo-300 text-xs font-mono overflow-x-auto leading-relaxed">
                                {playgroundRawHttp.request}
                              </pre>
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                                <span>HTTP Response ({playgroundRawHttp.status} {playgroundRawHttp.status === 200 ? 'OK' : 'Error'})</span>
                              </div>
                              <pre className={`p-4 rounded-xl bg-[#050814] border text-xs font-mono overflow-x-auto leading-relaxed ${
                                playgroundRawHttp.status === 200 ? 'border-emerald-500/30 text-emerald-300' : 'border-rose-500/30 text-rose-300'
                              }`}>
                                {playgroundRawHttp.response}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="py-12 text-center space-y-3">
                            <Globe className="w-10 h-10 text-[#475569] mx-auto" />
                            <h5 className="font-bold text-sm text-slate-300">No Network Activity Recorded</h5>
                            <p className="text-xs text-[#64748d] max-w-md mx-auto leading-relaxed">
                              Trigger any sandbox endpoint above to view structured raw HTTP requests and responses.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: TRACE LOGS */}
                    {playgroundInspectorTab === 'terminal' && (
                      <div className="space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed">
                        {testerLog.length === 0 ? (
                          <div className="py-12 text-center space-y-3">
                            <Terminal className="w-10 h-10 text-[#475569] mx-auto" />
                            <h5 className="font-bold text-sm text-slate-300">Trace Log Idle</h5>
                            <p className="text-xs text-[#64748d] max-w-md mx-auto leading-relaxed">
                              Click "Run Full Flow" or trigger any step above to record real-time cryptographic logs.
                            </p>
                          </div>
                        ) : (
                          testerLog.map((line, idx) => (
                            <div
                              key={idx}
                              className={
                                line.startsWith('✓')
                                  ? 'text-emerald-400 font-bold'
                                  : line.startsWith('❌')
                                  ? 'text-rose-400 font-bold'
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
                    )}

                    {/* TAB 5: cURL GENERATOR */}
                    {playgroundInspectorTab === 'curl' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">Executable cURL Snippet</span>
                          <button
                            type="button"
                            onClick={() => {
                              const curlStr = `curl -X POST "https://accounts.zenoa.in/api/oauth/token" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "grant_type": "authorization_code",\n    "client_id": "${activeTesterApp.client_id}",\n    "client_secret": "${activeTesterApp.client_secret}",\n    "code": "${playgroundAuthCode || 'YOUR_AUTH_CODE'}",\n    "redirect_uri": "${testRedirectUri || 'http://localhost:3000/auth/callback'}"\n  }'`;
                              handleCopy(curlStr, 'cp_curl', 'cURL command copied');
                            }}
                            className="text-xs font-mono text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'cp_curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy Command</span>
                          </button>
                        </div>

                        <pre className="p-4 rounded-xl bg-[#050814] border border-[#273951] text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed">
{`# 1. Authorize User in Browser
# https://accounts.zenoa.in/auth/sso?client_id=${activeTesterApp.client_id}&redirect_uri=${encodeURIComponent(testRedirectUri || 'http://localhost:3000/auth/callback')}&response_type=code&scope=${encodeURIComponent(playgroundScopes.join(' '))}&state=${playgroundStateParam}

# 2. Exchange Code for Access Token & ID Token
curl -X POST "https://accounts.zenoa.in/api/oauth/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "${activeTesterApp.client_id}",
    "client_secret": "${activeTesterApp.client_secret}",
    "code": "${playgroundAuthCode || 'zen_ac_SAMPLE_CODE'}",
    "redirect_uri": "${testRedirectUri || 'http://localhost:3000/auth/callback'}"
  }'

# 3. Fetch User Identity Claims
curl -X GET "https://accounts.zenoa.in/api/oauth/userinfo" \\
  -H "Authorization: Bearer ${playgroundAccessToken || 'YOUR_ACCESS_TOKEN'}"`}
                        </pre>
                      </div>
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
            {/* TAB: BYO-SMTP & EMAIL INFRASTRUCTURE                                      */}
            {/* ========================================================================= */}
            {activeTab === 'smtp' && (
              <SSOSmtpManager
                apps={apps}
                selectedAppId={selectedSmtpAppId || (apps.length > 0 ? apps[0].id : undefined)}
                onSelectApp={setSelectedSmtpAppId}
                onUpdateAppSmtp={handleUpdateAppSmtp}
                isDark={isDark}
                currentUser={currentUser}
                showToast={(msg) => showNotification('success', msg)}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 6: MULTI-LANGUAGE SDK CODE SNIPPETS & CLIENT SELECTOR                 */}
            {/* ========================================================================= */}
            {activeTab === 'docs' && (
              <div className="space-y-6 animate-fade-in">
                <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  {/* Top Bar: Title & Target App Selector */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                          OAuth 2.0 & SSO SDK Snippets
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Select a registered client to generate tailored, copy-pasteable authentication flows and token exchange code.
                      </p>
                    </div>

                    {/* App Selector Dropdown */}
                    <div className="relative z-30">
                      <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Active Client Application</span>
                        <span className="text-indigo-500 font-normal">({apps.length} registered)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAppDropdownOpen(!isAppDropdownOpen)}
                        className={`w-full sm:w-80 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 hover:border-indigo-500/60 text-white'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-500/60 text-slate-900 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {activeSnippetApp.app_name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold truncate leading-tight">{activeSnippetApp.app_name}</p>
                            <p className="text-[10px] font-mono text-slate-400 truncate">{activeSnippetApp.client_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            activeSnippetApp.environment === 'production'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {activeSnippetApp.environment || 'prod'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAppDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                        </div>
                      </button>

                      {/* Dropdown Menu Popup */}
                      <AnimatePresence>
                        {isAppDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute right-0 mt-2 w-full sm:w-88 rounded-2xl border shadow-2xl p-2 z-50 ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
                            }`}
                          >
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Switch Application</p>
                              {apps.length > 2 && (
                                <input
                                  type="text"
                                  value={appDropdownSearch}
                                  onChange={e => setAppDropdownSearch(e.target.value)}
                                  placeholder="Search registered apps..."
                                  className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                                    isDark ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
                                  }`}
                                  autoFocus
                                />
                              )}
                            </div>

                            <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                              {filteredSnippetApps.map(app => {
                                const isSelected = app.id === activeSnippetApp.id;
                                return (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSnippetAppId(app.id);
                                      setSnippetRedirectUri(app.redirect_uris?.[0] || '');
                                      setIsAppDropdownOpen(false);
                                      setAppDropdownSearch('');
                                      showNotification('success', `Switched SDK Snippet context to "${app.app_name}"`);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      }`}>
                                        {app.app_name?.charAt(0)?.toUpperCase() || 'A'}
                                      </div>
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-xs font-bold truncate">{app.app_name}</p>
                                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                                            {app.redirect_uris?.length || 0} URIs
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-400 truncate">{app.client_id}</p>
                                      </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  resetForm();
                                  setActiveTab('create');
                                  setIsAppDropdownOpen(false);
                                }}
                                className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Register New Application</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Context Injections Toolbar: Redirect URI + Secret Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-2">
                    {/* Redirect URIs Info (No specific URI snippet exists as all share the same Client ID & Secret) */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-indigo-500" />
                        Authorized Redirect URIs:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {(activeSnippetApp.redirect_uris || []).map((uri, idx) => (
                          <span key={idx} className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                            {uri}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Secret Reveal Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowSnippetSecret(!showSnippetSecret)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer self-start sm:self-auto"
                    >
                      {showSnippetSecret ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSnippetSecret ? 'Hide Secret (Safe View)' : 'Reveal Secret in Snippets'}</span>
                    </button>
                  </div>

                  {/* Language Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap mt-3">
                    {[
                      { id: 'react', label: 'React / Next.js' },
                      { id: 'nodejs', label: 'Node.js Express' },
                      { id: 'python', label: 'Python FastAPI' },
                      { id: 'curl', label: 'cURL / RFC 6749' },
                      { id: 'env', label: '.env Config' }
                    ].map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => setDocsLanguage(lang.id as any)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          docsLanguage === lang.id
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Code Container */}
                  <div className="mt-4 relative rounded-2xl bg-[#090d16] border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(currentSnippet, 'code_snippet', 'Code snippet copied to clipboard')}
                      className="absolute top-4 right-4 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans font-semibold flex items-center gap-1.5 cursor-pointer z-10 transition-colors"
                    >
                      {copiedKey === 'code_snippet' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Snippet</span>
                    </button>

                    <pre className="text-[11px] leading-relaxed pt-2">
                      {currentSnippet}
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

      {/* ========================================================================= */}
      {/* MODAL: ONE-TIME CLIENT SECRET DISPLAY (FIRST REVEAL ONLY)                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {oneTimeSecretReveal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-lg w-full p-6 sm:p-7 rounded-2xl border shadow-2xl space-y-5 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {oneTimeSecretReveal.actionType === 'created' ? 'OAuth 2.0 Credentials Created' : 'New Client Secret Generated'}
                  </h3>
                  <p className="text-xs text-slate-400">{oneTimeSecretReveal.appName}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Security Notice:</strong> This is the only time your full Client Secret is visible. Store it safely in your backend environment variables (`.env`). It cannot be retrieved again later.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client ID (Public)</label>
                  <div className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <span className="truncate">{oneTimeSecretReveal.clientId}</span>
                    <button
                      onClick={() => handleCopy(oneTimeSecretReveal.clientId, 'modal_cid', 'Client ID copied')}
                      className="text-indigo-500 hover:text-indigo-400 font-sans font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                    >
                      {copiedKey === 'modal_cid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Client Secret (Confidential)</label>
                  <div className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between border-rose-300/40 ${
                    isDark ? 'bg-slate-950 text-emerald-400' : 'bg-slate-50 text-emerald-700'
                  }`}>
                    <span className="break-all font-bold select-all">{oneTimeSecretReveal.clientSecret}</span>
                    <button
                      onClick={() => handleCopy(oneTimeSecretReveal.clientSecret, 'modal_sec', 'Client Secret copied to clipboard')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer shrink-0 ml-2 shadow-xs"
                    >
                      {copiedKey === 'modal_sec' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Secret</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setOneTimeSecretReveal(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  I Have Stored My Secret Securely
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
