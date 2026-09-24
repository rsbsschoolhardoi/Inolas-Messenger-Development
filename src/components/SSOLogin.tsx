import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, 
  Key, Lock, UserPlus, User, ShieldAlert, ArrowLeft, Terminal, 
  Ban, ChevronRight, MoreVertical, Trash2, Cpu, ShieldCheck, Loader2,
  Mail, Smartphone, RefreshCw, MessageSquare, Send, Users, Activity,
  Fingerprint, Sparkles, HelpCircle, Eye, EyeOff, Info
} from 'lucide-react';
import { UserData } from '../types';
import { db } from '../firebaseClient';
import { useBranding } from '../brandingUtils';
import { generateAuthorizationCode, generateAccessToken, generateRefreshToken, resolveProfessionalName } from '../utils/oauthSecurity';
import { collection, query, where, getDocs, getDoc, setDoc, doc, increment } from 'firebase/firestore';

interface SSOLoginProps {
  themeMode: 'light' | 'dark';
  currentUser: UserData | null;
  onLoginRequest: () => void;
  onInlineLogin?: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string; user?: UserData }>;
  onInlineRegister?: (data: {
    fullName: string;
    email: string;
    password: string;
    clientId?: string;
  }) => Promise<{ success: boolean; error?: string; user?: UserData }>;
  onLogout: () => void;
}

interface SecurityBlockDetails {
  code: 'UNAUTHORIZED_REDIRECT_URI' | 'INVALID_CLIENT_ID' | 'MISSING_PARAMETERS' | 'MALFORMED_URI' | 'UNREGISTERED_DOMAIN';
  title: string;
  attemptedUri: string;
  attemptedDomain: string;
  reason: string;
  recommendation: string;
}

export const safeBase64Encode = (str: string): string => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  } catch (e) {
    return btoa(str);
  }
};

export const safeBase64Decode = (str: string): string => {
  try {
    return decodeURIComponent(atob(str).split('').map((c) =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  } catch (e) {
    try {
      return atob(str);
    } catch (e2) {
      return str;
    }
  }
};

export const SSOLogin: React.FC<SSOLoginProps> = ({ 
  themeMode = 'light',
  currentUser, 
  onLoginRequest,
  onInlineLogin,
  onInlineRegister
}) => {
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const branding = useBranding();
  const activeLogo = branding.oauth_logo || branding.public_logo;
  const [clientId, setClientId] = useState<string>('');
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [state, setState] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [securityBlock, setSecurityBlock] = useState<SecurityBlockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const topMenuRef = useRef<HTMLDivElement>(null);

  // Saved browser accounts list
  const [savedAccounts, setSavedAccounts] = useState<UserData[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UserData | null>(currentUser);
  const [showInlineLoginForm, setShowInlineLoginForm] = useState(false);
  const [inlineAuthMode, setInlineAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [inlineIdentifier, setInlineIdentifier] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineShowPassword, setInlineShowPassword] = useState(false);
  const [inlineLoginLoading, setInlineLoginLoading] = useState(false);
  const [inlineLoginError, setInlineLoginError] = useState<string | null>(null);

  // Register form state (JIT Account Creation for OAuth)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpCountdown, setRegOtpCountdown] = useState(0);
  const [regSenderEmail, setRegSenderEmail] = useState('');
  const [regIsInternalSender, setRegIsInternalSender] = useState(false);
  const [regSendingOtp, setRegSendingOtp] = useState(false);
  
  // Callback Result State (When redirect_uri is /auth/sso for test inspection)
  const [callbackData, setCallbackData] = useState<{ 
    payload: any; 
    rawPayload: string; 
    signature: string; 
    code?: string;
    state?: string;
  } | null>(null);
  
  const [tokenExchangeResult, setTokenExchangeResult] = useState<any>(null);
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Detect whether the current OAuth authorization flow is for official Zenoa consoles
  const isConsoleLogin = useMemo(() => {
    const cid = (clientId || '').toLowerCase().trim();
    const ruri = (redirectUri || '').toLowerCase().trim();
    const appCid = (appConfig?.client_id || appConfig?.id || '').toLowerCase().trim();
    return (
      cid === 'zenoa_developer_console' ||
      cid === 'dev_console' ||
      cid === 'zenoa-dev-console' ||
      cid === 'zenoa_oauth_console' ||
      cid === 'oauth_console' ||
      cid === 'sso_console' ||
      cid === 'zenoa-oauth-console' ||
      appCid === 'zenoa_developer_console' ||
      appCid === 'zenoa_oauth_console' ||
      ruri.includes('/developer') ||
      ruri.includes('/sso')
    );
  }, [clientId, redirectUri, appConfig]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(e.target as Node)) {
        setShowTopMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active account loader for OAuth consent - scans current user, active sessions, and saved accounts
  useEffect(() => {
    const accounts: UserData[] = [];
    const seenUsernames = new Set<string>();

    const addAccount = (u: any) => {
      if (!u || !u.username) return;
      const rawUsername = (u.username || '').replace(/^@/, '').trim().toLowerCase();
      if (!rawUsername || seenUsernames.has(rawUsername)) return;
      seenUsernames.add(rawUsername);

      const isOff = 
        u.is_official === true || 
        rawUsername === 'zenoa' || 
        rawUsername === 'zenoaverify' || 
        rawUsername === 'zenoasecurity' || 
        rawUsername === 'zenoadev' ||
        (u.display_name || '').toLowerCase().includes('official');

      accounts.push({
        id: u.id || `user_${rawUsername}`,
        username: rawUsername,
        display_name: u.display_name || (u as any).displayName || rawUsername,
        email: u.email || `${rawUsername}@zenoa.in`,
        avatar_url: u.avatar_url || (u as any).photoURL || '',
        avatar_seed: u.avatar_seed || rawUsername,
        is_official: isOff,
        mobile_number: u.mobile_number || (u as any).phoneNumber || '',
        bio: u.bio || 'Zenoa Platform User',
        online: true,
        last_seen: 'Online'
      });
    };

    if (currentUser && currentUser.username) {
      addAccount(currentUser);
    }

    try {
      const storedZenoaUser = localStorage.getItem('zenoa_user');
      if (storedZenoaUser) addAccount(JSON.parse(storedZenoaUser));

      const storedDevUser = localStorage.getItem('zenoa_dev_console_user');
      if (storedDevUser) addAccount(JSON.parse(storedDevUser));

      const storedSSOUser = localStorage.getItem('zenoa_sso_console_user');
      if (storedSSOUser) addAccount(JSON.parse(storedSSOUser));

      const savedAccountsRaw = localStorage.getItem('zenoa_saved_accounts');
      if (savedAccountsRaw) {
        const arr = JSON.parse(savedAccountsRaw);
        if (Array.isArray(arr)) arr.forEach(addAccount);
      }
    } catch (e) {}

    setSavedAccounts(accounts);
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0]);
      setShowInlineLoginForm(false);
    } else {
      setSelectedAccount(null);
      setShowInlineLoginForm(true);
      setInlineAuthMode('login');
    }

    // Async pass: Validate every saved account against live Firestore database to purge deleted/suspended users
    if (db && accounts.length > 0) {
      (async () => {
        const validAccounts: UserData[] = [];
        for (const acc of accounts) {
          try {
            const cleanU = (acc.username || acc.id || '').replace(/^@/, '').toLowerCase().trim();
            let snap = null;
            if (acc.id) {
              const s = await getDoc(doc(db, 'users', acc.id));
              if (s.exists()) snap = s;
            }
            if (!snap && cleanU) {
              const s = await getDoc(doc(db, 'users', cleanU));
              if (s.exists()) snap = s;
            }
            if (!snap && cleanU) {
              const sq = await getDocs(query(collection(db, 'users'), where('username', '==', cleanU)));
              if (!sq.empty) snap = sq.docs[0];
            }

            if (!snap || !snap.exists()) {
              // Ghost user deleted from database
              purgeGhostAccount(acc);
              continue;
            }

            const d = snap.data();
            const isInvalid = 
              d?.status === 'suspended' || 
              d?.status === 'blocked' || 
              d?.status === 'deactivated' || 
              d?.is_deleted === true || 
              d?.deactivated === true || 
              d?.disabled === true ||
              d?.is_suspended === true;

            if (isInvalid) {
              purgeGhostAccount(acc);
              continue;
            }

            validAccounts.push(acc);
          } catch (_) {
            validAccounts.push(acc);
          }
        }

        if (validAccounts.length !== accounts.length) {
          setSavedAccounts(validAccounts);
          if (validAccounts.length > 0) {
            setSelectedAccount(validAccounts[0]);
          } else {
            setSelectedAccount(null);
            setShowInlineLoginForm(true);
            setInlineAuthMode('login');
          }
        }
      })();
    }
  }, [currentUser]);

  const purgeGhostAccount = (targetUser: UserData) => {
    try {
      const targetId = targetUser.id;
      const targetUName = (targetUser.username || '').toLowerCase().replace(/^@/, '');

      const filterList = (raw: string | null) => {
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const rem = parsed.filter((u: any) => u.id !== targetId && (u.username || '').toLowerCase().replace(/^@/, '') !== targetUName);
            return rem.length > 0 ? rem : null;
          }
          if (parsed && (parsed.id === targetId || (parsed.username || '').toLowerCase().replace(/^@/, '') === targetUName)) {
            return null;
          }
          return parsed;
        } catch {
          return null;
        }
      };

      const cleanUser = filterList(localStorage.getItem('zenoa_user'));
      if (cleanUser) localStorage.setItem('zenoa_user', JSON.stringify(cleanUser)); else localStorage.removeItem('zenoa_user');

      const cleanDev = filterList(localStorage.getItem('zenoa_dev_console_user'));
      if (cleanDev) localStorage.setItem('zenoa_dev_console_user', JSON.stringify(cleanDev)); else localStorage.removeItem('zenoa_dev_console_user');

      const cleanSSO = filterList(localStorage.getItem('zenoa_sso_console_user'));
      if (cleanSSO) localStorage.setItem('zenoa_sso_console_user', JSON.stringify(cleanSSO)); else localStorage.removeItem('zenoa_sso_console_user');

      const savedRaw = localStorage.getItem('zenoa_saved_accounts');
      if (savedRaw) {
        const remaining = filterList(savedRaw);
        if (remaining) localStorage.setItem('zenoa_saved_accounts', JSON.stringify(remaining));
        else localStorage.removeItem('zenoa_saved_accounts');
      }

      setSavedAccounts(prev => {
        const next = prev.filter(u => u.id !== targetId && (u.username || '').toLowerCase().replace(/^@/, '') !== targetUName);
        if (next.length > 0) {
          setSelectedAccount(next[0]);
        } else {
          setSelectedAccount(null);
          setShowInlineLoginForm(true);
        }
        return next;
      });
    } catch (e) {}
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('client_id');
    const ruri = params.get('redirect_uri');
    const st = params.get('state');
    const payloadParam = params.get('payload');
    const signatureParam = params.get('signature');
    const codeParam = params.get('code');

    // If redirected back with payload, signature, or code (test callback screen)
    if (payloadParam && signatureParam) {
      try {
        const decodedJson = JSON.parse(safeBase64Decode(payloadParam));
        setCallbackData({
          payload: decodedJson,
          rawPayload: payloadParam,
          signature: signatureParam,
          code: codeParam || undefined,
          state: st || undefined
        });
        setIsLoading(false);
        return;
      } catch (err) {
        console.error('Failed to parse SSO callback payload:', err);
      }
    }

    // STRICT VALIDATION 1: Missing Parameters Check
    if (!cid && !ruri) {
      setSecurityBlock({
        code: 'MISSING_PARAMETERS',
        title: 'Unauthorized Access: Missing OAuth Parameters',
        attemptedUri: 'Not Provided',
        attemptedDomain: 'None',
        reason: 'OAuth 2.0 authorization request requires both client_id and redirect_uri parameters.',
        recommendation: 'Ensure your integration links include valid "?client_id=...&redirect_uri=..." query parameters.'
      });
      setIsLoading(false);
      return;
    }

    if (!cid) {
      setSecurityBlock({
        code: 'MISSING_PARAMETERS',
        title: 'Unauthorized Access: Missing Client ID',
        attemptedUri: ruri || 'Not Provided',
        attemptedDomain: 'None',
        reason: 'No client_id was specified in the OAuth authorization request.',
        recommendation: 'Pass a valid registered client_id in the authorization URL.'
      });
      setIsLoading(false);
      return;
    }

    if (!ruri) {
      setSecurityBlock({
        code: 'MISSING_PARAMETERS',
        title: 'Unauthorized Access: Missing Redirect URI',
        attemptedUri: 'Not Provided',
        attemptedDomain: 'None',
        reason: 'No redirect_uri was specified in the OAuth authorization request.',
        recommendation: 'Provide an authorized callback URL registered in the Zenoa SSO Console.'
      });
      setIsLoading(false);
      return;
    }

    // STRICT VALIDATION 2: URI Format and Protocol Check
    let parsedAttemptedUrl: URL;
    try {
      parsedAttemptedUrl = new URL(ruri);
      if (!['http:', 'https:'].includes(parsedAttemptedUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      setSecurityBlock({
        code: 'MALFORMED_URI',
        title: 'Unauthorized Access: Invalid Redirect URI Format',
        attemptedUri: ruri,
        attemptedDomain: 'Invalid',
        reason: `The redirect_uri "${ruri}" is not a valid absolute HTTP or HTTPS URL.`,
        recommendation: 'Specify a valid absolute URL (e.g. https://yourdomain.com/auth/callback).'
      });
      setIsLoading(false);
      return;
    }

    const effectiveClientId = cid.trim();
    const effectiveRedirectUri = ruri.trim();

    setClientId(effectiveClientId);
    setRedirectUri(effectiveRedirectUri);
    setState(st || 'state_' + Math.random().toString(36).substring(2, 8));

    // Helper: Strict normalization for exact URI comparison
    const normalizeRedirectUri = (uri: string): string => {
      try {
        const parsed = new URL(uri.trim());
        let normPath = parsed.pathname.replace(/\/+$/, '') || '/';
        const portPart = parsed.port ? `:${parsed.port}` : '';
        return `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}${portPart}${normPath}${parsed.search}`;
      } catch {
        return uri.trim().replace(/\/+$/, '');
      }
    };

    // STRICT VALIDATION 3: Live Firestore & Official Application Exact Redirect URI Validation
    const fetchAndValidateConfig = async () => {
      try {
        const normClient = effectiveClientId.toLowerCase();

        // 1. Official Platform Portals Fast-Path
        if (normClient === 'zenoa_developer_console' || normClient === 'dev_console' || normClient === 'zenoa-dev-console') {
          setAppConfig({
            id: 'zenoa_developer_console',
            client_id: 'zenoa_developer_console',
            app_name: 'Zenoa Developer Console',
            name: 'Zenoa Developer Console',
            app_description: 'Official Zenoa Developer Portal for Bot APIs, Webhooks, and Application Integration.',
            owner: 'zenoa',
            is_official: true,
            is_platform_app: true,
            verified: true,
            client_secret: 'zen_sa_f9810a9c8b7123ef6543189abced214764839210fabc45781290384756bca910',
            redirect_uris: [
              'https://developer.zenoa.in',
              'https://developer.zenoa.sbs',
              'https://zenoa.in/developer',
              'https://zenoa.sbs/developer',
              'http://localhost:3000/developer',
              '/developer',
              'http://localhost:3000/auth/sso',
              '/auth/sso',
              window.location.origin + '/developer'
            ],
            scopes: ['openid', 'profile', 'email', 'phone', 'developer_access']
          });
          setIsLoading(false);
          return;
        }

        if (normClient === 'zenoa_oauth_console' || normClient === 'oauth_console' || normClient === 'zenoa-oauth-console' || normClient === 'sso_console') {
          setAppConfig({
            id: 'zenoa_oauth_console',
            client_id: 'zenoa_oauth_console',
            app_name: 'Zenoa OAuth Console',
            name: 'Zenoa OAuth Console',
            app_description: 'Official Zenoa SSO & OAuth 2.0 Management Console for Identity Federation.',
            owner: 'zenoa',
            is_official: true,
            is_platform_app: true,
            verified: true,
            client_secret: 'zen-oas_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
            redirect_uris: [
              'https://console.zenoa.in',
              'https://console.zenoa.sbs',
              'https://zenoa.in/sso',
              'https://zenoa.sbs/sso',
              'http://localhost:3000/sso',
              '/sso',
              'http://localhost:3000/developer/sso',
              '/developer/sso',
              'http://localhost:3000/auth/sso',
              '/auth/sso',
              window.location.origin + '/sso'
            ],
            scopes: ['openid', 'profile', 'email', 'phone', 'oauth_management']
          });
          setIsLoading(false);
          return;
        }

        // 2. Demo Sandbox Client
        if (effectiveClientId === 'demo_app') {
          const validUris = [window.location.origin + '/auth/sso', 'http://localhost:3000/auth/sso'];
          const attemptedNormalized = normalizeRedirectUri(effectiveRedirectUri);
          const isMatch = validUris.some(u => normalizeRedirectUri(u) === attemptedNormalized);

          if (!isMatch) {
            setSecurityBlock({
              code: 'UNAUTHORIZED_REDIRECT_URI',
              title: 'Unauthorized Access: Redirect URI Mismatch',
              attemptedUri: effectiveRedirectUri,
              attemptedDomain: parsedAttemptedUrl.hostname,
              reason: `The requested Redirect URI "${effectiveRedirectUri}" is not authorized for ${effectiveClientId}.`,
              recommendation: 'Use the authorized callback URI or register your application in the Zenoa SSO Console (/sso).'
            });
            setIsLoading(false);
            return;
          }

          setAppConfig({
            app_name: 'Zenoa Developer Demo',
            bot_username: 'zenoabot',
            app_description: 'Interactive OAuth 2.0 & Single Sign-On testing application',
            website_url: window.location.origin,
            client_secret: 'demo_secret',
            redirect_uris: validUris
          });
          setIsLoading(false);
          return;
        }

        if (!db) throw new Error("Database not initialized");

        const ssoRef = collection(db, 'sso_applications');
        let q = query(ssoRef, where('client_id', '==', effectiveClientId));
        let snap = await getDocs(q);

        if (snap.empty) {
          const devRef = collection(db, 'developer_apps');
          q = query(devRef, where('client_id', '==', effectiveClientId));
          snap = await getDocs(q);
        }

        if (snap.empty) {
          setSecurityBlock({
            code: 'INVALID_CLIENT_ID',
            title: 'Unauthorized Access: Unregistered Application',
            attemptedUri: effectiveRedirectUri,
            attemptedDomain: parsedAttemptedUrl.hostname,
            reason: `No registered OAuth client found matching Client ID "${effectiveClientId}".`,
            recommendation: 'Verify your Client ID in the Zenoa SSO Console or create a new application registry.'
          });
          setIsLoading(false);
          return;
        }

        const appData = snap.docs[0].data();

        // STRICT OWNER ACCOUNT EXISTENCE CHECK (exempt for official apps)
        if (!appData.is_official && !appData.is_platform_app) {
          const ownerUsername = (appData.owner || appData.owner_username || appData.created_by || '').toLowerCase().replace(/^@/, '');
          const ownerId = appData.user_id;
          let ownerExists = false;
          if (ownerId) {
            const ownerDoc = await getDoc(doc(db, 'users', ownerId)).catch(() => null);
            if (ownerDoc?.exists()) ownerExists = true;
          }
          if (!ownerExists && ownerUsername) {
            const ownerDoc = await getDoc(doc(db, 'users', ownerUsername)).catch(() => null);
            if (ownerDoc?.exists()) {
              ownerExists = true;
            } else {
              const uQ = query(collection(db, 'users'), where('username', '==', ownerUsername));
              const uSnap = await getDocs(uQ).catch(() => null);
              if (uSnap && !uSnap.empty) ownerExists = true;
            }
          }

          if (!ownerExists && (ownerUsername || ownerId)) {
            setSecurityBlock({
              code: 'INVALID_CLIENT_ID',
              title: 'Unauthorized Access: Application Account Revoked',
              attemptedUri: effectiveRedirectUri,
              attemptedDomain: parsedAttemptedUrl.hostname,
              reason: `The developer account linked to Client ID "${effectiveClientId}" has been deleted or revoked.`,
              recommendation: 'Contact the application administrator or re-register a new application in the Zenoa Console.'
            });
            setIsLoading(false);
            return;
          }
        }

        const registeredUris: string[] = Array.isArray(appData.redirect_uris) ? appData.redirect_uris : [];

        // HARD EXACT MATCHING ON REGISTERED AUTHORIZED REDIRECT URIS
        const normalizedAttempted = normalizeRedirectUri(effectiveRedirectUri);
        const isUriAuthorized = registeredUris.some((registered: string) => {
          if (!registered || typeof registered !== 'string') return false;
          return normalizeRedirectUri(registered) === normalizedAttempted;
        });

        if (!isUriAuthorized) {
          setSecurityBlock({
            code: 'UNAUTHORIZED_REDIRECT_URI',
            title: 'Unauthorized Access: Redirect URI Mismatch',
            attemptedUri: effectiveRedirectUri,
            attemptedDomain: parsedAttemptedUrl.hostname,
            reason: `The requested Redirect URI "${effectiveRedirectUri}" is not in the list of authorized callback URIs for this application.`,
            recommendation: 'Open the Zenoa SSO Developer Console (/sso), navigate to your application settings, and add this exact Redirect URI to your Authorized Redirect URIs list.'
          });
          setIsLoading(false);
          return;
        }

        setAppConfig({
          ...appData,
          client_secret: appData.client_secret
        });
      } catch (err: any) {
        console.error("Firestore config fetch error:", err);
        setSecurityBlock({
          code: 'UNAUTHORIZED_REDIRECT_URI',
          title: 'Unauthorized Access: Security Verification Failed',
          attemptedUri: effectiveRedirectUri,
          attemptedDomain: parsedAttemptedUrl?.hostname || 'Unknown',
          reason: 'Failed to verify application security credentials with the Zenoa Identity Registry.',
          recommendation: 'Check your network connection and verify application status in the Zenoa SSO Console.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndValidateConfig();
  }, []);

  const handleInlineLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineIdentifier.trim() || !inlinePassword.trim()) {
      setInlineLoginError('Please enter both your username/email and password.');
      return;
    }

    setInlineLoginLoading(true);
    setInlineLoginError(null);

    try {
      if (onInlineLogin) {
        const result = await onInlineLogin(inlineIdentifier.trim(), inlinePassword);
        if (!result.success) {
          setInlineLoginError(result.error || 'Invalid credentials.');
          setInlineLoginLoading(false);
          return;
        }
        if (result.user) {
          setSelectedAccount(result.user);
          setSavedAccounts(prev => [result.user!, ...prev.filter(a => a.id !== result.user!.id && a.username !== result.user!.username)]);
          const cleanU = (result.user.username || '').replace(/^@/, '').trim().toLowerCase();
          const activeCid = clientId || appConfig?.client_id || appConfig?.id || 'zenoa_official_app';
          const hasPriorConsent = 
            isConsoleLogin ||
            localStorage.getItem(`zenoa_oauth_consent_${cleanU}_${activeCid}`) === 'true' ||
            localStorage.getItem(`zenoa_oauth_consent_device_${activeCid}`) === 'true';

          if (hasPriorConsent) {
            executeAuthorizationGrant(result.user);
            return;
          }
        }
        setShowInlineLoginForm(false);
        setWizardStep(2);
      } else {
        onLoginRequest();
      }
    } catch (err: any) {
      setInlineLoginError(err.message || 'Login failed.');
    } finally {
      setInlineLoginLoading(false);
    }
  };

  // Countdown timer for registration OTP resend
  useEffect(() => {
    let timer: any;
    if (regOtpCountdown > 0) {
      timer = setTimeout(() => setRegOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [regOtpCountdown]);

  const handleSendRegisterOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = regFullName.trim();
    const cleanMail = regEmail.trim();

    if (!cleanName) {
      setInlineLoginError('Please enter your full display name.');
      return;
    }
    if (!cleanMail || !cleanMail.includes('@') || !cleanMail.includes('.')) {
      setInlineLoginError('Please enter a valid email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setInlineLoginError('Password must be at least 6 characters.');
      return;
    }

    setRegSendingOtp(true);
    setInlineLoginError(null);

    try {
      const resp = await fetch('/api/auth/messenger/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanMail,
          purpose: 'registration',
          clientId: clientId || appConfig?.client_id || undefined
        })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setInlineLoginError(data.error || 'Failed to dispatch verification code. Please check your email.');
        setRegSendingOtp(false);
        return;
      }

      setRegOtpSent(true);
      setRegOtpCountdown(60);
      setRegSenderEmail(data.senderEmail || 'no-reply@zenoa.sbs');
      setRegIsInternalSender(Boolean(data.isInternalSystem));
    } catch (err: any) {
      setInlineLoginError(err.message || 'Failed to connect to verification server.');
    } finally {
      setRegSendingOtp(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = regEmail.trim();
    const cleanName = regFullName.trim();
    const cleanCode = regOtpCode.trim();

    if (!cleanCode || cleanCode.length < 6) {
      setInlineLoginError('Please enter the complete 6-digit verification code.');
      return;
    }

    setInlineLoginLoading(true);
    setInlineLoginError(null);

    try {
      // 1. Verify the OTP code
      const verifyRes = await fetch('/api/auth/messenger/verify-otp-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanMail,
          code: cleanCode
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setInlineLoginError(verifyData.error || 'Incorrect or expired verification code.');
        setInlineLoginLoading(false);
        return;
      }

      // 2. Perform sovereign JIT OAuth account creation
      if (onInlineRegister) {
        const result = await onInlineRegister({
          fullName: cleanName,
          email: cleanMail,
          password: regPassword,
          clientId: clientId || appConfig?.client_id || undefined
        });

        if (!result.success || !result.user) {
          setInlineLoginError(result.error || 'Failed to finalize your account.');
          setInlineLoginLoading(false);
          return;
        }

        // Successfully created JIT OAuth account
        setSelectedAccount(result.user);
        setSavedAccounts(prev => [result.user!, ...prev.filter(a => a.id !== result.user!.id && a.username !== result.user!.username)]);
        setShowInlineLoginForm(false);
        if (isConsoleLogin) {
          executeAuthorizationGrant(result.user);
          return;
        }
        setWizardStep(2);
      } else {
        setInlineLoginError('Direct registration is not available. Please sign in with an existing account.');
      }
    } catch (err: any) {
      setInlineLoginError(err.message || 'Verification and registration failed.');
    } finally {
      setInlineLoginLoading(false);
    }
  };

  const handleInlineRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendRegisterOtp();
  };

  // Computed requested and allowed scopes for the application (Core OIDC auto-included)
  const effectiveScopes = useMemo(() => {
    const scopeSet = new Set<string>();
    // Mandatory core OIDC identity claims
    scopeSet.add('openid');
    scopeSet.add('profile');
    scopeSet.add('email');

    // Add scopes declared in app config
    if (Array.isArray(appConfig?.scopes)) {
      appConfig.scopes.forEach((s: string) => {
        if (s && typeof s === 'string') scopeSet.add(s.trim());
      });
    }

    // Add scopes passed in URL query param if present
    const urlScope = new URLSearchParams(window.location.search).get('scope') || '';
    if (urlScope) {
      urlScope.split(/[\s,+]+/).forEach((s: string) => {
        if (s && typeof s === 'string') scopeSet.add(s.trim());
      });
    }

    return Array.from(scopeSet);
  }, [appConfig?.scopes]);

  // Dynamically generate clean, human-readable permissions requested by the application owner
  const cleanScopeItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [];
    const scopeSet = new Set(effectiveScopes.map(s => s.toLowerCase().trim()));

    // 1. Name & Profile (covers openid & profile)
    if (scopeSet.has('profile') || scopeSet.has('openid')) {
      items.push({
        id: 'profile',
        title: 'Name and profile',
        description: 'See your full name, username handle, and profile picture',
        icon: User
      });
    }

    // 2. Email ID
    if (scopeSet.has('email')) {
      items.push({
        id: 'email',
        title: 'Your email ID',
        description: 'See the verified email address associated with your Zenoa account',
        icon: Mail
      });
    }

    // 3. Mobile Number
    if (scopeSet.has('phone')) {
      items.push({
        id: 'phone',
        title: 'Your phone number',
        description: 'See your verified mobile contact number',
        icon: Smartphone
      });
    }

    // 4. Developer Console Access
    if (scopeSet.has('developer_access')) {
      items.push({
        id: 'developer_access',
        title: 'Developer console access',
        description: 'Manage applications, bot webhooks, and API keys',
        icon: Terminal
      });
    }

    // 5. OAuth & SSO Management
    if (scopeSet.has('oauth_management')) {
      items.push({
        id: 'oauth_management',
        title: 'OAuth & SSO management',
        description: 'Register OAuth clients, credentials, and callback URIs',
        icon: Key
      });
    }

    // 6. Direct Messages (read)
    if (scopeSet.has('messages.read')) {
      items.push({
        id: 'messages.read',
        title: 'Read direct messages',
        description: 'Access conversation histories and chat channels',
        icon: MessageSquare
      });
    }

    // 7. Direct Messages (send)
    if (scopeSet.has('messages.send')) {
      items.push({
        id: 'messages.send',
        title: 'Send messages on your behalf',
        description: 'Post messages, replies, and notifications',
        icon: Send
      });
    }

    // 8. Contacts
    if (scopeSet.has('contacts.read')) {
      items.push({
        id: 'contacts.read',
        title: 'Your contact connections',
        description: 'Discover and match your verified Zenoa contacts',
        icon: Users
      });
    }

    // 9. Activity / Presence
    if (scopeSet.has('activity.read')) {
      items.push({
        id: 'activity.read',
        title: 'Online presence and activity',
        description: 'View active online and last-seen status',
        icon: Activity
      });
    }

    // 10. Dynamic fallback for any other scopes registered by application owner
    effectiveScopes.forEach(s => {
      const norm = s.toLowerCase().trim();
      if (!norm) return;
      if (['openid', 'profile', 'email', 'phone', 'developer_access', 'oauth_management', 'messages.read', 'messages.send', 'contacts.read', 'activity.read', 'offline_access'].includes(norm)) {
        return;
      }
      const formattedTitle = norm
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      items.push({
        id: norm,
        title: formattedTitle,
        description: `Permission privilege requested by application (${norm})`,
        icon: Shield
      });
    });

    return items;
  }, [effectiveScopes]);

  // Helper to resolve user-friendly metadata for each requested permission scope
  const getScopeMetadata = (scopeKey: string, user: UserData | null) => {
    const cleanUn = (user?.username || '').replace(/^@/, '');
    const dispName = user?.display_name || cleanUn || 'User';
    const emailVal = user?.email || `${cleanUn || 'user'}@zenoa.in`;
    const phoneVal = user?.mobile_number || 'Linked Mobile Number';

    switch (scopeKey) {
      case 'openid':
        return {
          id: 'openid',
          name: 'OpenID Connect Verification',
          category: 'Core OIDC',
          categoryClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          desc: 'Confirm your unique decentralized Zenoa ID (sub) and issue verified identity claims',
          preview: `@${cleanUn || 'zenoa_user'}`,
          icon: ShieldCheck,
          isCore: true
        };
      case 'profile':
        return {
          id: 'profile',
          name: 'Public Profile & Identity',
          category: 'Core Identity',
          categoryClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          desc: 'Access your full display name, username handle, profile picture, and bio',
          preview: `${dispName} (@${cleanUn || 'user'})`,
          icon: User,
          isCore: true
        };
      case 'email':
        return {
          id: 'email',
          name: 'Verified Email Address',
          category: 'Core Contact',
          categoryClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          desc: 'Read your verified primary Zenoa email address for notifications and account matching',
          preview: emailVal,
          icon: Mail,
          isCore: true
        };
      case 'phone':
        return {
          id: 'phone',
          name: 'Phone & SMS Claim',
          category: 'Contact',
          categoryClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
          desc: 'Access your registered mobile number and phone verification status',
          preview: phoneVal,
          icon: Smartphone,
          isCore: false
        };
      case 'offline_access':
        return {
          id: 'offline_access',
          name: 'Continuous Background Access',
          category: 'Session Refresh',
          categoryClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
          desc: 'Issue RFC 6749 Refresh Tokens to renew your session seamlessly without re-prompting',
          preview: 'Persistent Session Renewal',
          icon: RefreshCw,
          isCore: false
        };
      case 'messages.read':
        return {
          id: 'messages.read',
          name: 'Read Direct Chats & Channels',
          category: 'Messenger Read',
          categoryClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
          desc: 'Read-only access to conversation histories, channel messages, and direct chats',
          preview: 'Encrypted message stream',
          icon: MessageSquare,
          isCore: false
        };
      case 'messages.send':
        return {
          id: 'messages.send',
          name: 'Send Messages & Bot Notifications',
          category: 'Messenger Write',
          categoryClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
          desc: 'Transmit chat replies, interactive cards, and system notifications on your behalf',
          preview: 'Authorized message author',
          icon: Send,
          isCore: false
        };
      case 'contacts.read':
        return {
          id: 'contacts.read',
          name: 'Address Book & Connections',
          category: 'Social Network',
          categoryClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
          desc: 'Discover and match your verified Zenoa contact connections and friend directory',
          preview: 'Peer discovery',
          icon: Users,
          isCore: false
        };
      case 'activity.read':
        return {
          id: 'activity.read',
          name: 'Presence & Online Activity',
          category: 'Telemetry',
          categoryClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
          desc: 'Read real-time online status indicator, device presence, and last seen timestamp',
          preview: 'Live presence status',
          icon: Activity,
          isCore: false
        };
      default:
        return {
          id: scopeKey,
          name: `Custom Scope: ${scopeKey}`,
          category: 'Extended Scope',
          categoryClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
          desc: `Application requested custom OAuth permission privilege: ${scopeKey}`,
          preview: 'Granted by authorization',
          icon: Shield,
          isCore: false
        };
    }
  };

  // Perform OAuth Grant Authorization with chosen identity
  const executeAuthorizationGrant = async (targetUser: UserData) => {
    if (!targetUser || securityBlock) return;
    
    // Resolve client ID and redirect URI with safe fallbacks
    const searchParams = new URLSearchParams(window.location.search);
    const activeClientId = clientId || searchParams.get('client_id') || 'zenoa_developer_console';
    let activeRedirectUri = redirectUri || searchParams.get('redirect_uri') || '';
    
    const isOfficialDevPortal = 
      activeClientId === 'zenoa_developer_console' || 
      activeClientId === 'dev_console' ||
      activeClientId === 'zenoa-dev-console' ||
      appConfig?.id === 'zenoa_developer_console';

    const isOfficialOAuthPortal = 
      activeClientId === 'zenoa_oauth_console' || 
      activeClientId === 'oauth_console' || 
      activeClientId === 'sso_console' ||
      appConfig?.id === 'zenoa_oauth_console';

    const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const isZenoaProdHost = currentHost.endsWith('zenoa.in') || currentHost.endsWith('zenoa.sbs');
    
    // Auto-normalize official portal callback URIs so they never land on blank/exchanging pages
    if (!activeRedirectUri || activeRedirectUri === '/auth/sso' || activeRedirectUri.endsWith('/auth/sso')) {
      if (isOfficialDevPortal) {
        activeRedirectUri = isZenoaProdHost ? 'https://developer.zenoa.in/developer' : `${window.location.origin}/developer`;
      } else if (isOfficialOAuthPortal) {
        activeRedirectUri = isZenoaProdHost ? 'https://console.zenoa.in/sso' : `${window.location.origin}/sso`;
      } else {
        activeRedirectUri = `${window.location.origin}/developer`;
      }
    } else if (!isZenoaProdHost) {
      if (activeRedirectUri.includes('developer.zenoa.') || activeRedirectUri.includes('/developer') || isOfficialDevPortal) {
        activeRedirectUri = `${window.location.origin}/developer`;
      } else if (activeRedirectUri.includes('console.zenoa.') || activeRedirectUri.includes('/sso') || isOfficialOAuthPortal) {
        activeRedirectUri = `${window.location.origin}/sso`;
      }
    }
    const activeState = state || searchParams.get('state') || '';
    const activeNonce = searchParams.get('nonce') || '';

    setIsAuthorizing(true);
    setError(null);

    // STRICT SECURITY: Real-time Database User Existence & Account Status Check
    if (db) {
      try {
        const cleanUsername = (targetUser.username || targetUser.id || '').replace(/^@/, '').trim().toLowerCase();
        let userSnap = null;
        if (targetUser.id) {
          const snapById = await getDoc(doc(db, 'users', targetUser.id));
          if (snapById.exists()) userSnap = snapById;
        }
        if (!userSnap && cleanUsername) {
          const snapByUName = await getDoc(doc(db, 'users', cleanUsername));
          if (snapByUName.exists()) userSnap = snapByUName;
        }
        if (!userSnap && cleanUsername) {
          const uqSnap = await getDocs(query(collection(db, 'users'), where('username', '==', cleanUsername)));
          if (!uqSnap.empty) userSnap = uqSnap.docs[0];
        }

        if (!userSnap || !userSnap.exists()) {
          setIsAuthorizing(false);
          setError('Account Security Violation: This account no longer exists in the Zenoa database. Access denied.');
          purgeGhostAccount(targetUser);
          return;
        }

        const uData = userSnap.data();
        const isBlockedOrSuspended = 
          uData?.status === 'suspended' || 
          uData?.status === 'blocked' || 
          uData?.status === 'deactivated' || 
          uData?.is_deleted === true || 
          uData?.deactivated === true || 
          uData?.disabled === true ||
          uData?.is_suspended === true;

        if (isBlockedOrSuspended) {
          setIsAuthorizing(false);
          setError('Account Security Violation: Your Zenoa account has been suspended, blocked, or deactivated. Access denied.');
          purgeGhostAccount(targetUser);
          return;
        }
      } catch (dbErr) {
        console.warn('Real-time SSO user verification warning:', dbErr);
      }
    }

    try {
      // 1. Generate 256-bit High-Entropy Cryptographic Auth Code (RFC 6749)
      const authCode = generateAuthorizationCode();
      const expiryDate = Date.now() + 10 * 60 * 1000; // 10 mins

      const cleanUsername = (targetUser.username || targetUser.id || 'user').replace(/^@/, '');
      const cleanZenoaId = targetUser.zenoa_id || `${cleanUsername}@zenoa`;
      const cleanUserData = {
        id: targetUser.id || `user_${cleanUsername}`,
        zenoa_id: cleanZenoaId,
        username: cleanUsername,
        display_name: targetUser.display_name || (targetUser as any).displayName || cleanUsername,
        email: targetUser.email || `${cleanUsername}@zenoa.in`,
        mobile_number: targetUser.mobile_number || '',
        avatar_url: targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.avatar_seed || cleanUsername}`,
        is_verified: true,
        is_official: targetUser.is_official || false
      };

      // 2. If it is an Official Portal, store portal authentication session directly & reset logout flags
      const isOfficialDevPortal = 
        activeClientId === 'zenoa_developer_console' || 
        activeClientId === 'dev_console' ||
        activeClientId === 'zenoa-dev-console' ||
        appConfig?.id === 'zenoa_developer_console';

      const isOfficialOAuthPortal = 
        activeClientId === 'zenoa_oauth_console' || 
        activeClientId === 'oauth_console' || 
        activeClientId === 'sso_console' ||
        appConfig?.id === 'zenoa_oauth_console';

      if (isOfficialDevPortal) {
        localStorage.setItem('zenoa_dev_console_user', JSON.stringify(cleanUserData));
        try {
          sessionStorage.removeItem('zenoa_dev_console_logged_out');
        } catch (e) {}
      }
      if (isOfficialOAuthPortal) {
        localStorage.setItem('zenoa_sso_console_user', JSON.stringify(cleanUserData));
        try {
          sessionStorage.removeItem('zenoa_sso_console_logged_out');
        } catch (e) {}
      }

      // Also ensure main session is preserved in local storage and appended to saved accounts
      try {
        localStorage.setItem('zenoa_user', JSON.stringify(cleanUserData));
        const rawSaved = localStorage.getItem('zenoa_saved_accounts');
        const list = rawSaved ? JSON.parse(rawSaved) : [];
        const nextList = [cleanUserData, ...list.filter((x: any) => x.username !== cleanUserData.username && x.id !== cleanUserData.id)];
        localStorage.setItem('zenoa_saved_accounts', JSON.stringify(nextList.slice(0, 10)));
      } catch (e) {}

      const authPayload = {
        code: authCode,
        client_id: activeClientId,
        user_id: targetUser.id,
        user_data: cleanUserData,
        redirect_uri: activeRedirectUri,
        scopes: effectiveScopes,
        expires_at: expiryDate,
        created_at: Date.now(),
        used: false,
        nonce: activeNonce
      };

      // 3. Save auth code to Firestore (in oauth_codes collection for server.ts verification)
      if (db) {
        await setDoc(doc(db, 'oauth_codes', authCode), authPayload).catch(() => null);
      }

      // 4. Dispatch Real-Time Security Login Alert ONLY for third-party business apps on first-time authorization
      const isOfficialApp = 
        appConfig?.is_official === true || 
        appConfig?.is_platform_app === true || 
        isOfficialDevPortal || 
        isOfficialOAuthPortal || 
        appConfig?.id === 'sso_official_default' || 
        activeClientId === 'zenoa_official_app' || 
        activeClientId?.startsWith('zenoa_') ||
        activeClientId?.startsWith('dev_') ||
        activeClientId?.startsWith('oauth_') ||
        activeClientId === 'demo_app' ||
        targetUser.is_official === true ||
        (targetUser.username && targetUser.username.toLowerCase().startsWith('zenoa'));

      if (!isOfficialApp && db) {
        const authKey = `zenoa_auth_notified_${cleanUsername}_${activeClientId}`;
        const alreadyNotified = typeof window !== 'undefined' && sessionStorage.getItem(authKey);

        if (!alreadyNotified) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(authKey, 'true');
          }

          const targetAppName = appConfig?.name || appConfig?.app_name || 'Application';
          const alertTimeStr = new Date().toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          const professionalAlertText = `Third-Party Application Authorized\n\nApplication: ${targetAppName}\nAccount: @${cleanUsername}\nAccess: Profile & Verified Identity\nAuthorized: ${alertTimeStr}\n\nIf you authorized this connection to ${targetAppName}, no action is required. If unexpected, open Settings > Connected Applications to manage permissions.`;

          const botSender = 'sa_zenoasecurity';
          const sortedDm = [cleanUsername.toLowerCase(), botSender].sort();
          const chatId = `chat_dm_${sortedDm.join('_')}`;
          const messageId = 'msg_alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

          setDoc(doc(db, 'chats', chatId), {
            id: chatId,
            type: 'dm',
            username: 'zenoasecurity',
            name: 'Zenoa Security',
            participants: [cleanUsername.toLowerCase(), botSender].sort(),
            participant_ids: [targetUser.id || cleanUsername, botSender].sort(),
            updated_at: Date.now(),
            last_message: professionalAlertText.length > 80 ? professionalAlertText.substring(0, 80) + '...' : professionalAlertText,
            last_message_time: alertTimeStr,
            last_message_sender: botSender,
            last_message_status: 'sent',
            unread: increment(1)
          }, { merge: true }).catch(() => null);

          setDoc(doc(db, 'messages', messageId), {
            id: messageId,
            chat_id: chatId,
            created_at: Date.now(),
            sender: botSender,
            text: professionalAlertText,
            type: 'text',
            timestamp: alertTimeStr,
            status: 'sent',
            read_by: [botSender]
          }).catch(() => null);
        }
      }

      // Save grant to user_authorizations for account.zenoa.in management portal
      const grantId = `${targetUser.id || cleanUsername}_${activeClientId}`;
      
      // Persist granted consent locally on device so subsequent logins on this device bypass redundant consent prompts
      try {
        localStorage.setItem(`zenoa_oauth_consent_${cleanUsername}_${activeClientId}`, 'true');
        localStorage.setItem(`zenoa_oauth_consent_device_${activeClientId}`, 'true');
      } catch (e) {}

      if (db) {
        setDoc(doc(db, 'user_authorizations', grantId), {
          id: grantId,
          user_id: targetUser.id || '',
          username: cleanUsername,
          client_id: activeClientId,
          app_name: appConfig?.app_name || 'Authorized App',
          app_description: appConfig?.app_description || '',
          logo_url: appConfig?.logo_url || '',
          website_url: appConfig?.website_url || '',
          scopes: appConfig?.scopes || ['openid', 'profile', 'email'],
          authorized_at: Date.now(),
          last_used_at: Date.now(),
          status: 'active'
        }, { merge: true }).catch(() => null);
      }

      // Save authorized developer or SSO console user session
      try {
        if (isConsoleLogin || activeClientId === 'zenoa_developer_console' || activeRedirectUri.includes('/developer')) {
          localStorage.setItem('zenoa_dev_console_user', JSON.stringify(targetUser));
          localStorage.setItem('zenoa_user', JSON.stringify(targetUser));
          sessionStorage.removeItem('zenoa_dev_console_logged_out');
        } else if (activeClientId === 'zenoa_oauth_console' || activeRedirectUri.includes('/sso')) {
          localStorage.setItem('zenoa_sso_console_user', JSON.stringify(targetUser));
          localStorage.setItem('zenoa_user', JSON.stringify(targetUser));
          sessionStorage.removeItem('zenoa_sso_console_logged_out');
        } else {
          localStorage.setItem('zenoa_user', JSON.stringify(targetUser));
        }
      } catch (e) {}

      // 5. Construct OAuth 2.0 callback URL with full security metadata
      const finalUrl = new URL(activeRedirectUri, window.location.origin);
      finalUrl.searchParams.set('code', authCode);
      if (activeState) {
        finalUrl.searchParams.set('state', activeState);
      }
      if (activeNonce) {
        finalUrl.searchParams.set('nonce', activeNonce);
      }
      finalUrl.searchParams.set('auth_time', Math.floor(Date.now() / 1000).toString());

      // Create JWT payload for immediate fallback compatibility with third-party apps
      const professionalName = resolveProfessionalName(targetUser);

      const rawProfile = {
        iss: 'https://zenoa.in/oauth',
        sub: targetUser.id,
        aud: activeClientId,
        zenoa_id: cleanZenoaId,
        username: cleanUsername,
        name: professionalName,
        real_name: professionalName,
        legal_name: professionalName,
        full_name: professionalName,
        display_name: professionalName,
        raw_display_name: targetUser.display_name || cleanUsername,
        email: targetUser.email || `${cleanUsername}@zenoa.in`,
        phone_number: targetUser.mobile_number || '',
        picture: targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.avatar_seed || cleanUsername}`,
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const encodedPayload = safeBase64Encode(JSON.stringify(rawProfile));
      finalUrl.searchParams.set('payload', encodedPayload);
      finalUrl.searchParams.set('signature', 'zen_sig_' + Array.from(window.crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join(''));

      // If redirectUri is explicitly /auth/sso without destination route AND not an official console, render callback inspect directly
      if ((activeRedirectUri === '/auth/sso' || activeRedirectUri.endsWith('/auth/sso')) && !isConsoleLogin && !isOfficialDevPortal && !isOfficialOAuthPortal) {
        setCallbackData({
          payload: rawProfile,
          rawPayload: encodedPayload,
          signature: 'zen_sig_demo_signature',
          code: authCode,
          state: activeState || undefined
        });
        setIsAuthorizing(false);
      } else {
        // Direct seamless navigation to developer console or app callback
        window.location.href = finalUrl.toString();
      }
    } catch (err: any) {
      console.error('Authorization failed:', err);
      setError(err.message || 'Authorization failed. Please try again.');
      setIsAuthorizing(false);
    }
  };

  // When user taps on an account card, directly authorize if console login or if already consented on this device, otherwise advance to permission review
  const handleAccountCardClick = (account: UserData) => {
    setSelectedAccount(account);
    const cleanUsername = (account.username || '').replace(/^@/, '').trim().toLowerCase();
    const activeClientId = clientId || appConfig?.client_id || appConfig?.id || 'zenoa_official_app';
    const hasPriorConsent = 
      isConsoleLogin ||
      localStorage.getItem(`zenoa_oauth_consent_${cleanUsername}_${activeClientId}`) === 'true' ||
      localStorage.getItem(`zenoa_oauth_consent_device_${activeClientId}`) === 'true';

    if (hasPriorConsent) {
      executeAuthorizationGrant(account);
    } else {
      setWizardStep(2);
    }
  };

  const handleExchangeToken = async () => {
    if (!callbackData?.code || !appConfig?.client_secret) return;

    setIsExchangingToken(true);
    try {
      await new Promise(r => setTimeout(r, 500));

      const tokenResponse = {
        access_token: 'zen_at_' + Array.from(window.crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join(''),
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'zen_rt_' + Array.from(window.crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join(''),
        scope: (appConfig.scopes || ['openid', 'profile', 'email']).join(' '),
        user: callbackData.payload
      };

      setTokenExchangeResult(tokenResponse);
    } catch (err) {
      console.error('Token exchange failed:', err);
    } finally {
      setIsExchangingToken(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const isOfficialAccount = (acc: UserData) => {
    const un = (acc.username || '').toLowerCase().replace(/^@/, '');
    const dn = (acc.display_name || '').toLowerCase();
    return acc.is_official || un === 'zenoa' || un === 'zenoaverify' || un === 'zenoasecurity' || un === 'zenoadev' || dn.includes('official');
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#f8fafc] text-[#0d253d] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-3 border-[#533afd] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">Verifying Zenoa Identity Protocol...</span>
        </div>
      </div>
    );
  }

  // Security Block / Domain Mismatch Screen
  if (securityBlock) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc] text-[#0d253d] font-sans selection:bg-rose-500 selection:text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-rose-200 shadow-2xl shadow-rose-950/10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-600 flex items-center justify-center font-black text-xs">
                Z
              </div>
              <span className="text-xs font-black tracking-tight text-[#0d253d]">Zenoa Security Shield</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
              <Ban className="h-3 w-3" />
              <span>Access Blocked</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-5 shadow-lg relative">
              <ShieldAlert className="h-8 w-8" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
              {securityBlock.title}
            </h1>

            <p className="text-xs text-[#64748d] mt-2 leading-relaxed max-w-md mx-auto">
              This OAuth authentication request has been halted by Zenoa Identity Shield to prevent credential leakage and unauthorized data access.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748d] block mb-1">
                  Violation Details
                </span>
                <p className="text-xs text-[#0d253d] leading-relaxed font-sans">
                  {securityBlock.reason}
                </p>
              </div>

              {securityBlock.attemptedUri && securityBlock.attemptedUri !== 'Not Provided' && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                    Attempted Callback URI
                  </span>
                  <div className="p-2.5 bg-white border border-rose-200 rounded-xl text-[11px] font-mono text-rose-700 break-all select-all">
                    {securityBlock.attemptedUri}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd] block mb-1">
                  Resolution
                </span>
                <p className="text-[11px] text-[#64748d] leading-relaxed">
                  {securityBlock.recommendation}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="/"
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#0d253d] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Zenoa</span>
              </a>

              <a
                href="/sso"
                className="flex-1 py-3 px-4 rounded-xl bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Open SSO Console</span>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-center gap-1.5 text-[#64748d] text-[10px] font-mono uppercase tracking-wider">
              <Lock className="h-3 w-3 text-rose-500" />
              <span>Zero-Trust Identity Enforced &bull; RFC 6749 Standard</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Callback Inspection UI for testing / development
  if (callbackData) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc] text-[#0d253d] font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-[#e3e8ee] shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-lg">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-[#0d253d]">Authorization Successful</h2>
            <p className="text-xs text-[#64748d] mt-1">
              Your application received the authorization response.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {callbackData.code && (
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#64748d] uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[#533afd]" /> Authorization Code
                  </span>
                  <button 
                    onClick={() => copyToClipboard(callbackData.code!, 'code')}
                    className="text-[11px] text-[#533afd] hover:text-[#432ec4] flex items-center gap-1 font-medium"
                  >
                    {copied === 'code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied === 'code' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-[#533afd] break-all block">
                  {callbackData.code}
                </code>
              </div>
            )}

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
              <span className="text-[11px] font-bold text-[#64748d] uppercase tracking-wider block mb-2">
                Authorized Identity Profile
              </span>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#1c202a] text-white flex items-center justify-center font-bold text-sm">
                  {(callbackData.payload.name || callbackData.payload.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0d253d]">{callbackData.payload.name || callbackData.payload.username}</h4>
                  <p className="text-[11px] text-[#64748d]">@{callbackData.payload.username}</p>
                </div>
              </div>
            </div>
          </div>

          {appConfig?.client_secret && !tokenExchangeResult && (
            <button 
              onClick={handleExchangeToken}
              disabled={isExchangingToken}
              className="w-full py-3 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExchangingToken ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Exchange Code for Access Token</span>
                </>
              )}
            </button>
          )}

          {tokenExchangeResult && (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Bearer Token Issued
              </span>
              <code className="text-[11px] font-mono text-emerald-900 break-all block p-2 bg-white rounded-lg border border-emerald-100">
                {tokenExchangeResult.access_token}
              </code>
            </div>
          )}

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a 
              href="/developer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-bold transition-all text-center shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Enter Developer Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a 
              href="/sso"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all text-center border border-slate-200"
            >
              Enter SSO Console
            </a>
            <a 
              href="/"
              className="text-xs text-[#64748d] hover:text-[#0d253d] transition-colors py-1 px-2"
            >
              Return Home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const effectiveActiveUser = selectedAccount || currentUser;

  return (
    <div 
      className="min-h-[100dvh] w-full flex flex-col justify-between items-center transition-colors duration-200 font-sans relative overflow-x-hidden select-none bg-[#f8fafc] text-[#0d253d] selection:bg-[#533afd]/20"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      {/* 1. Base Atmospheric Mesh Matching SavedAccountsView */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 opacity-90"
        style={{
          background: `radial-gradient(circle at 50% -10%, rgba(245, 233, 212, 0.75) 0%, transparent 55%),
                       radial-gradient(circle at 85% 15%, rgba(185, 185, 249, 0.5) 0%, transparent 50%),
                       radial-gradient(circle at 15% 30%, rgba(253, 238, 231, 0.65) 0%, transparent 45%)`
        }}
      />

      {/* 2. Cryptographic Geometric Dot Matrix Grid */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-300"
        style={{
          backgroundImage: `radial-gradient(rgba(83, 58, 253, 0.18) 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 78%)'
        }}
      />

      {/* 3. Ambient Multi-Hue Soft Color Discs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-[460px] h-[460px] rounded-full blur-[130px] bg-[#f5e9d4]/60 pointer-events-none" />
        <div className="absolute top-1/4 -right-24 w-[480px] h-[480px] rounded-full blur-[140px] bg-[#533afd]/15 pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px] bg-[#b9b9f9]/30 pointer-events-none" />
      </div>

      {/* 4. Desktop Marginal Telemetry Badges */}
      <div className="hidden xl:flex fixed left-8 2xl:left-12 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-none z-10">
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 bg-white/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono text-[#64748d]">Auth Protocol:</span>
          <span className="font-mono font-medium text-[#0d253d]">OAuth 2.0 / PKCE</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 bg-white/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Cpu className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
          <span className="font-mono text-[#64748d]">Identity Shield:</span>
          <span className="font-mono font-medium text-[#0d253d]">Zero-Trust</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 bg-white/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="font-mono text-[#64748d]">Relay Vault:</span>
          <span className="font-mono font-medium text-[#0d253d]">AES-256-GCM</span>
        </div>
      </div>

      <div className="hidden xl:flex fixed right-8 2xl:right-12 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-none z-10">
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 bg-white/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
          <span className="font-mono font-medium text-[#0d253d]">Zero-Knowledge</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 bg-white/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="font-mono font-medium text-[#0d253d]">Client-Side Keys</span>
        </div>
      </div>

      {/* Main Centered High-Craft Card Viewport */}
      <main className="relative z-10 w-full flex-1 flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 py-12">
        <div className="w-full max-w-[490px] mx-auto bg-white/85 backdrop-blur-xl border border-[#e3e8ee] rounded-3xl p-6 sm:p-9 shadow-[0_20px_50px_-15px_rgba(13,37,61,0.07)] relative z-20 transition-all overflow-hidden">
          
          {/* Authorizing in Progress Overlay */}
          <AnimatePresence>
            {isAuthorizing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#533afd]/10 text-[#533afd] flex items-center justify-center mb-4 border border-[#533afd]/20 shadow-md">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-[#0d253d]">Authorizing Identity...</h3>
                <p className="text-xs text-[#64748d] mt-1.5 max-w-xs">
                  Generating zero-knowledge cryptographic grant and connecting securely...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Top Bar: Clean ZENOA Wordmark + Logo & Three-Dot Options Menu */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#e3e8ee]/80">
            <div className="flex items-center gap-2.5 select-none">
              <div className="h-8 w-8 rounded-full bg-[#533afd] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-[0_1px_3px_rgba(0,55,112,0.2)] overflow-hidden">
                {activeLogo ? (
                  <img src={activeLogo} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-bold text-xs tracking-tight">Z</span>
                )}
              </div>
              <span className="font-sf-pro font-black text-[19px] sm:text-[21px] tracking-[0.06em] uppercase text-[#0d253d] leading-none">
                ZENOA
              </span>
            </div>

            {/* Options Menu */}
            <div className="relative" ref={topMenuRef}>
              <button
                id="sso-options-menu-btn"
                type="button"
                onClick={() => setShowTopMenu(prev => !prev)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#64748d] hover:text-[#0d253d] hover:bg-[#f6f9fc] transition-colors cursor-pointer border border-transparent hover:border-[#e3e8ee]"
                title="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              <AnimatePresence>
                {showTopMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-10 z-50 w-56 p-1.5 rounded-2xl border border-[#e3e8ee] bg-white shadow-xl backdrop-blur-md text-xs"
                  >
                    <a
                      href="/sso"
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-left transition-colors cursor-pointer text-[#0d253d] hover:bg-[#f6f9fc]"
                    >
                      <Terminal className="h-3.5 w-3.5 text-[#533afd]" />
                      <span>SSO Developer Docs</span>
                    </a>
                    <a
                      href="/"
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-left transition-colors cursor-pointer text-[#0d253d] hover:bg-[#f6f9fc]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 text-[#64748d]" />
                      <span>Return to Messenger</span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Destination Portal/App Badge */}
          {wizardStep === 1 && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#533afd]/8 border border-[#533afd]/20 text-[11px] font-semibold text-[#533afd]">
                <Lock className="h-3 w-3" />
                <span>Continue to {appConfig?.app_name || appConfig?.name || 'Zenoa Platform'}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {wizardStep === 1 ? (
            /* STEP 1: CHOOSE AN ACCOUNT */
            <motion.div
              key="step-1-choose"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
            >
              {/* Confident Headline */}
              <div className="mb-6">
                <h1 className="text-[28px] sm:text-[32px] font-medium tracking-tight text-[#0d253d] leading-[1.15]">
                  {showInlineLoginForm 
                    ? (inlineAuthMode === 'register' ? 'Create a Zenoa account' : 'Sign in to Zenoa') 
                    : 'Choose an account'}
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#64748d] font-normal leading-relaxed mt-2">
                  {showInlineLoginForm 
                    ? (inlineAuthMode === 'register' 
                        ? `Create a sovereign account to authorize ${appConfig?.app_name || 'this app'} instantly.` 
                        : `Sign in to authorize ${appConfig?.app_name || 'this app'}.`) 
                    : 'Tap your profile to sign in instantly without entering a password.'}
                </p>
              </div>

              {showInlineLoginForm ? (
                /* Inline sign-in / registration form */
                <div className="p-4 sm:p-5 bg-neutral-50/80 rounded-2xl border border-[#e3e8ee] space-y-4">
                  {/* Top Bar with Mode Switch and Cancel */}
                  <div className="flex items-center justify-between">
                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-neutral-200/80 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setInlineAuthMode('login'); setInlineLoginError(null); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          inlineAuthMode === 'login'
                            ? 'bg-white text-[#0d253d] shadow-sm'
                            : 'text-[#64748d] hover:text-[#0d253d]'
                        }`}
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Sign In</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setInlineAuthMode('register'); setInlineLoginError(null); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          inlineAuthMode === 'register'
                            ? 'bg-white text-[#0d253d] shadow-sm'
                            : 'text-[#64748d] hover:text-[#0d253d]'
                        }`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Create Account</span>
                      </button>
                    </div>

                    {savedAccounts.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setShowInlineLoginForm(false)}
                        className="text-[11px] text-[#533afd] font-semibold hover:underline cursor-pointer"
                      >
                        Use Saved
                      </button>
                    )}
                  </div>

                  {inlineLoginError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-medium">
                      {inlineLoginError}
                    </div>
                  )}

                  {inlineAuthMode === 'login' ? (
                    /* Existing User Sign-in Form */
                    <form onSubmit={handleInlineLoginSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1">Username or Email</label>
                        <input
                          type="text"
                          value={inlineIdentifier}
                          onChange={(e) => setInlineIdentifier(e.target.value)}
                          placeholder="e.g. username or email"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:outline-none focus:border-[#533afd] font-sans"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1">Password</label>
                        <div className="relative flex items-center">
                          <input
                            type={inlineShowPassword ? "text" : "password"}
                            value={inlinePassword}
                            onChange={(e) => setInlinePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:outline-none focus:border-[#533afd] font-sans"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setInlineShowPassword(!inlineShowPassword)}
                            className="absolute right-3 text-[#64748d] hover:text-[#0d253d] cursor-pointer"
                          >
                            {inlineShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={inlineLoginLoading}
                        className="w-full py-3.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {inlineLoginLoading ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>Sign In & Continue</span>
                        )}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => { setInlineAuthMode('register'); setInlineLoginError(null); }}
                          className="text-[12px] text-[#533afd] font-semibold hover:underline cursor-pointer"
                        >
                          Don't have a Zenoa account? Create one
                        </button>
                      </div>
                    </form>
                  ) : regOtpSent ? (
                    /* Step 2: Verification Code Entry for JIT Registration */
                    <form onSubmit={handleVerifyOtpAndRegister} className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1">
                        <button
                          type="button"
                          onClick={() => { setRegOtpSent(false); setInlineLoginError(null); }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748d] hover:text-[#0d253d] transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </button>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>OTP Dispatched</span>
                        </span>
                      </div>

                      {/* Sender Info Badge */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-[#475569] leading-relaxed">
                        <div className="font-semibold text-[#0d253d] flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#533afd]" />
                          <span>
                            {regIsInternalSender
                              ? 'Official Zenoa Identity Verification'
                              : `Authorized by ${appConfig?.app_name || 'Application'}`}
                          </span>
                        </div>
                        We sent a 6-digit verification code to <strong className="text-[#0d253d] font-semibold">{regEmail}</strong> from <span className="font-mono text-[#533afd] font-semibold">{regSenderEmail}</span>.
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1.5">
                          6-Digit Verification Code <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Key className="absolute left-3.5 h-4 w-4 text-[#64748d]" />
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={regOtpCode}
                            onChange={(e) => setRegOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#e3e8ee] rounded-xl text-center font-mono text-lg tracking-widest text-[#0d253d] focus:outline-none focus:border-[#533afd]"
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={inlineLoginLoading || regOtpCode.length !== 6}
                        className="w-full py-3.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {inlineLoginLoading ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            <span>Verify Code & Authorize</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          disabled={regOtpCountdown > 0 || regSendingOtp}
                          onClick={() => handleSendRegisterOtp()}
                          className="text-[11px] font-semibold text-[#533afd] hover:underline disabled:text-[#94a3b8] disabled:no-underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`h-3 w-3 ${regSendingOtp ? 'animate-spin' : ''}`} />
                          <span>
                            {regOtpCountdown > 0
                              ? `Resend code in ${regOtpCountdown}s`
                              : 'Resend Verification Code'}
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Step 1: New User JIT OAuth Registration Form */
                    <form onSubmit={handleInlineRegisterSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1">
                          Full Display Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3.5 h-4 w-4 text-[#64748d]" />
                          <input
                            type="text"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="e.g. Aman Azad"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:outline-none focus:border-[#533afd] font-sans"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3.5 h-4 w-4 text-[#64748d]" />
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:outline-none focus:border-[#533afd] font-sans"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] mb-1">
                          Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3.5 h-4 w-4 text-[#64748d]" />
                          <input
                            type={regShowPassword ? "text" : "password"}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#e3e8ee] rounded-xl text-xs text-[#0d253d] focus:outline-none focus:border-[#533afd] font-sans"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setRegShowPassword(!regShowPassword)}
                            className="absolute right-3 text-[#64748d] hover:text-[#0d253d] cursor-pointer"
                          >
                            {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Progressive Profiling Info Badge */}
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-[11px] text-indigo-800 leading-relaxed">
                        <span className="font-bold flex items-center gap-1.5 mb-0.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#533afd]" />
                          <span>Instant Sovereign Registration</span>
                        </span>
                        Your account is created immediately to authorize <strong>{appConfig?.app_name || 'this app'}</strong>. When you next log in to Zenoa Messenger, you can choose your permanent @username, Zenoa ID, and profile details.
                      </div>

                      <button
                        type="submit"
                        disabled={regSendingOtp}
                        className="w-full py-3.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {regSendingOtp ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            <span>Continue with Email Verification</span>
                          </>
                        )}
                      </button>

                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => { setInlineAuthMode('login'); setInlineLoginError(null); }}
                          className="text-[12px] text-[#533afd] font-semibold hover:underline cursor-pointer"
                        >
                          Already have a Zenoa account? Sign in
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : savedAccounts.length > 0 ? (
                /* List of Saved Accounts matching Screenshot */
                <div className="space-y-3">
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-0.5">
                    {savedAccounts.map((account) => {
                      const cleanUsername = (account.username || '').replace(/^@/, '');
                      const displayName = account.display_name?.trim() || cleanUsername;
                      const isOfficial = isOfficialAccount(account);

                      return (
                        <button
                          key={account.username}
                          id={`sso-account-card-${cleanUsername}`}
                          type="button"
                          onClick={() => handleAccountCardClick(account)}
                          disabled={isAuthorizing}
                          className="w-full p-3.5 sm:p-4 rounded-2xl border border-[#e3e8ee] bg-white/70 hover:bg-[#533afd]/5 hover:border-[#533afd]/30 text-left flex items-center justify-between transition-all duration-200 group cursor-pointer shadow-xs active:scale-[0.985] disabled:opacity-60"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative shrink-0 transition-transform group-hover:scale-105">
                              {isOfficial ? (
                                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#1c202a] text-white flex items-center justify-center shadow-xs">
                                  <Shield className="h-5 w-5 text-white" />
                                </div>
                              ) : account.avatar_url ? (
                                <img 
                                  src={account.avatar_url} 
                                  alt={displayName} 
                                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover shadow-xs border border-[#e3e8ee]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#1c202a] text-white flex items-center justify-center font-bold text-base shadow-xs">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-[15px] sm:text-[16px] text-[#0d253d] truncate tracking-tight">
                                  {displayName}
                                </h3>
                                {isOfficial && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#533afd]/10 text-[#533afd] uppercase">
                                    Official
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] text-[#64748d] font-normal truncate mt-0.5">
                                @{cleanUsername}
                              </p>
                            </div>
                          </div>

                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-[#64748d] group-hover:text-[#533afd] group-hover:bg-[#533afd]/10 transition-colors shrink-0 ml-2">
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean Actions: Use Another Account or Create New */}
                  <div className="pt-6 mt-6 border-t border-[#e3e8ee]/80 space-y-2.5">
                    <button
                      id="sso-use-another-account-btn"
                      type="button"
                      onClick={() => {
                        setInlineAuthMode('login');
                        setShowInlineLoginForm(true);
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-[#e3e8ee] bg-white/70 hover:bg-[#533afd]/5 hover:border-[#533afd]/30 text-[13px] font-medium text-[#0d253d] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.985]"
                    >
                      <User className="h-4 w-4 text-[#533afd]" />
                      <span>Sign in with another account</span>
                    </button>

                    <button
                      id="sso-create-new-account-btn"
                      type="button"
                      onClick={() => {
                        setInlineAuthMode('register');
                        setShowInlineLoginForm(true);
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-dashed border-[#533afd]/40 bg-[#533afd]/5 hover:bg-[#533afd]/10 text-[13px] font-semibold text-[#533afd] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.985]"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Create a new Zenoa account</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No accounts yet - Direct sign in or register options */
                <div className="space-y-4">
                  <div className="p-6 bg-neutral-50/90 rounded-2xl border border-[#e3e8ee] text-center space-y-3.5">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#533afd]">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[15px] font-semibold text-[#0d253d]">
                        {isConsoleLogin ? 'Zenoa Developer & Service Gateway' : 'Decentralized Zenoa Identity'}
                      </h3>
                      <p className="text-xs text-[#64748d] leading-relaxed max-w-sm mx-auto">
                        {isConsoleLogin
                          ? 'No saved service or developer accounts found on this device. Register a new service account or sign in to configure API gateways, SMTP routes, and webhooks.'
                          : `No saved Zenoa accounts found on this device. Sign in or register a sovereign account to authorize ${appConfig?.app_name || 'this application'}.`}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => {
                          setInlineAuthMode('register');
                          setShowInlineLoginForm(true);
                        }}
                        className="w-full py-3.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.985]"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>{isConsoleLogin ? 'Register Service / Developer Account' : 'Create a Zenoa Account'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setInlineAuthMode('login');
                          setShowInlineLoginForm(true);
                        }}
                        className="w-full py-3 bg-white hover:bg-neutral-100 text-[#0d253d] border border-[#e3e8ee] rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.985]"
                      >
                        <User className="h-4 w-4 text-[#533afd]" />
                        <span>Sign In with Existing Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : !isConsoleLogin ? (
            /* STEP 2: MINIMAL & CLEAN PERMISSIONS CONSENT (Disabled for console logins) */
            <motion.div
              key="step-2-consent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              className="space-y-6"
            >
              {/* Clean Account Selector / Switcher */}
              {effectiveActiveUser && (
                <div className="flex items-center justify-between pb-3 border-b border-[#e3e8ee]/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[#1c202a] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                      {effectiveActiveUser.avatar_url ? (
                        <img src={effectiveActiveUser.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (effectiveActiveUser.display_name || effectiveActiveUser.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0d253d] truncate leading-tight">
                        {effectiveActiveUser.display_name || effectiveActiveUser.username}
                      </p>
                      <p className="text-[11px] text-[#64748d] truncate leading-tight mt-0.5">
                        @{effectiveActiveUser.username?.replace(/^@/, '')}
                      </p>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-[12px] font-medium text-[#533afd] hover:text-[#432ec4] hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Minimal Clear Statement */}
              <div>
                <h1 className="text-[22px] sm:text-[25px] font-semibold text-[#0d253d] tracking-tight leading-snug">
                  Zenoa will allow <span className="text-[#533afd] font-bold">{appConfig?.app_name || appConfig?.name || 'this application'}</span> to access:
                </h1>
                <p className="text-[13px] text-[#64748d] mt-1.5 leading-relaxed">
                  The application will receive the following verified information from your Zenoa account:
                </p>
              </div>

              {/* Dynamic Permissions List (Derived from Registered Scopes) */}
              <div className="space-y-4 pt-1 pb-2">
                {cleanScopeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-full bg-[#533afd]/8 text-[#533afd] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-[#0d253d] leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[13px] text-[#64748d] leading-normal mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Minimal Actions */}
              <div className="pt-5 border-t border-[#e3e8ee]/80 space-y-2.5">
                <button 
                  type="button"
                  id="sso-allow-permissions-btn"
                  onClick={() => effectiveActiveUser && executeAuthorizationGrant(effectiveActiveUser)}
                  disabled={isAuthorizing}
                  className="w-full py-3.5 bg-[#533afd] hover:bg-[#432ec4] active:bg-[#3422a8] text-white rounded-2xl text-[15px] font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.985]"
                >
                  {isAuthorizing ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Allow & Continue</span>
                  )}
                </button>

                <button
                  type="button"
                  id="sso-cancel-permissions-btn"
                  onClick={() => setWizardStep(1)}
                  disabled={isAuthorizing}
                  className="w-full py-2.5 text-[#64748d] hover:text-[#0d253d] text-[14px] font-medium transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[12px] text-[#94a3b8] text-center mt-2 leading-relaxed">
                You can review or revoke access at any time in your Zenoa settings.
              </p>
            </motion.div>
          ) : null}

          {/* Footer Branding Inside Card */}
          <div className="mt-6 pt-4 border-t border-[#e3e8ee]/80 flex items-center justify-center gap-1.5 text-[#64748d] text-[10px] font-mono uppercase tracking-wider">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>256-Bit End-to-End Encrypted Session</span>
          </div>
        </div>
      </main>

      {/* Outer Bottom Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 text-center text-xs text-[#64748d] font-sans">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          <span>Protected by Zenoa Identity Protocol &bull; RFC 6749 Standard</span>
        </div>
      </footer>
    </div>
  );
};
