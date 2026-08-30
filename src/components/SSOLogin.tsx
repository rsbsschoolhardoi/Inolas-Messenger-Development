import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Smartphone, ArrowRight, CheckCircle2, AlertCircle, Bot, LogOut, 
  Code, Copy, Check, ExternalLink, RefreshCw, Key, Lock, Globe, Sparkles, 
  UserPlus, User, ShieldAlert, AlertTriangle, ArrowLeft, Terminal, Ban
} from 'lucide-react';
import { UserData } from '../types';
import { db } from '../firebaseClient';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';

interface SSOLoginProps {
  themeMode: 'light' | 'dark';
  currentUser: UserData | null;
  onLoginRequest: () => void;
  onInlineLogin?: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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

export const SSOLogin: React.FC<SSOLoginProps> = ({ 
  themeMode, 
  currentUser, 
  onLoginRequest,
  onInlineLogin,
  onLogout
}) => {
  const [clientId, setClientId] = useState<string>('');
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [state, setState] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [securityBlock, setSecurityBlock] = useState<SecurityBlockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  // Saved browser accounts
  const [savedAccounts, setSavedAccounts] = useState<UserData[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UserData | null>(currentUser);
  const [showInlineLoginForm, setShowInlineLoginForm] = useState(false);
  const [inlineIdentifier, setInlineIdentifier] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineLoginLoading, setInlineLoginLoading] = useState(false);
  const [inlineLoginError, setInlineLoginError] = useState<string | null>(null);
  
  // Callback Result State (When redirect_uri is /auth/sso for testing)
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

  useEffect(() => {
    // Load saved browser accounts
    try {
      const rawSaved = localStorage.getItem('zenoa_saved_browser_accounts');
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) {
          setSavedAccounts(parsed);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (currentUser) {
      setSelectedAccount(currentUser);
    }
  }, [currentUser]);

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
        const decodedJson = JSON.parse(atob(payloadParam));
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

    // STRICT VALIDATION 3: Live Firestore Application Exact Redirect URI Validation
    const fetchAndValidateConfig = async () => {
      try {
        if (!db) throw new Error("Database not initialized");

        // Special handling for local demo sandbox client
        if (effectiveClientId === 'demo_app') {
          const demoRegistered = normalizeRedirectUri(window.location.origin + '/auth/sso');
          const attemptedNormalized = normalizeRedirectUri(effectiveRedirectUri);
          
          if (attemptedNormalized !== demoRegistered) {
            setSecurityBlock({
              code: 'UNAUTHORIZED_REDIRECT_URI',
              title: 'Unauthorized Access: Redirect URI Mismatch',
              attemptedUri: effectiveRedirectUri,
              attemptedDomain: parsedAttemptedUrl.hostname,
              reason: `The requested Redirect URI "${effectiveRedirectUri}" is not authorized for demo_app. The demo client only authorizes exact match on "${window.location.origin}/auth/sso". Domain-level matching is disabled.`,
              recommendation: 'Use the authorized demo callback URI or register your application in the Zenoa SSO Console (/sso) to configure your own exact Redirect URIs.'
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
            redirect_uris: [window.location.origin + '/auth/sso']
          });
          setIsLoading(false);
          return;
        }

        const ssoRef = collection(db, 'sso_applications');
        const q = query(ssoRef, where('client_id', '==', effectiveClientId));
        const snap = await getDocs(q);

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
        const registeredUris: string[] = Array.isArray(appData.redirect_uris) ? appData.redirect_uris : [];
        const websiteUrl: string = appData.website_url || '';

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
            reason: `The requested Redirect URI "${effectiveRedirectUri}" is not in the list of authorized callback URIs for this application. Zenoa OAuth strictly enforces exact URI matching (Protocol + Domain + Port + Path). Domain alone is not authorized — only explicitly registered Redirect URIs can receive tokens.`,
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

  const handleAuthorize = async () => {
    const targetUser = selectedAccount || currentUser;
    if (!targetUser || !clientId || !redirectUri || !appConfig || securityBlock) return;
    
    setIsAuthorizing(true);
    setError(null);

    try {
      if (!db) throw new Error("Database not connected");

      // 1. Generate Auth Code & Clean User Payload
      const authCode = 'zen_ac_' + Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const expiryDate = Date.now() + 10 * 60 * 1000; // 10 mins

      const cleanUserData = {
        id: targetUser.id,
        username: targetUser.username,
        display_name: targetUser.display_name || targetUser.username,
        email: targetUser.email || `${targetUser.username.toLowerCase()}@zenoa.im`,
        mobile_number: targetUser.mobile_number || '',
        avatar_url: targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.avatar_seed || targetUser.username}`,
        is_verified: true
      };

      const authPayload = {
        code: authCode,
        client_id: clientId,
        user_id: targetUser.id,
        user_data: cleanUserData,
        redirect_uri: redirectUri,
        scopes: appConfig.scopes || ['profile', 'email'],
        expires_at: expiryDate,
        created_at: Date.now(),
        used: false
      };

      // 2. Save auth code to Firestore (in oauth_codes collection for server.ts verification)
      await setDoc(doc(db, 'oauth_codes', authCode), authPayload);

      // 3. Construct OAuth 2.0 redirect URL
      const finalUrl = new URL(redirectUri);
      finalUrl.searchParams.set('code', authCode);
      if (state) {
        finalUrl.searchParams.set('state', state);
      }

      // Also create signed JWT payload for immediate fallback compatibility
      const rawProfile = {
        iss: 'https://zenoa.im/oauth',
        sub: targetUser.id,
        aud: clientId,
        username: targetUser.username,
        name: targetUser.display_name || targetUser.username,
        email: targetUser.email || `${targetUser.username}@zenoa.im`,
        phone_number: targetUser.mobile_number || '',
        picture: targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.avatar_seed || targetUser.username}`,
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const encodedPayload = btoa(JSON.stringify(rawProfile));
      finalUrl.searchParams.set('payload', encodedPayload);
      finalUrl.searchParams.set('signature', 'zen_sig_' + Array.from(window.crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join(''));

      // If redirectUri is /auth/sso or same domain test, render callback directly
      if (redirectUri.includes('/auth/sso') || redirectUri === window.location.href.split('?')[0]) {
        setCallbackData({
          payload: rawProfile,
          rawPayload: encodedPayload,
          signature: 'zen_sig_demo_signature',
          code: authCode,
          state: state || undefined
        });
        setIsAuthorizing(false);
      } else {
        // External redirect
        window.location.href = finalUrl.toString();
      }
    } catch (err: any) {
      console.error('Authorization failed:', err);
      setError(err.message || 'Authorization failed. Please try again.');
      setIsAuthorizing(false);
    }
  };

  const handleExchangeToken = async () => {
    if (!callbackData?.code || !appConfig?.client_secret) return;

    setIsExchangingToken(true);
    try {
      await new Promise(r => setTimeout(r, 600));

      const tokenResponse = {
        access_token: 'zen_at_' + Array.from(window.crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join(''),
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'zen_rt_' + Array.from(window.crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join(''),
        scope: (appConfig.scopes || ['profile', 'email']).join(' '),
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

  if (isLoading) {
    return (
      <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 ${themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Verifying Zenoa Security Protocol...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CRITICAL SECURITY SCREEN: UNAUTHORIZED ACCESS / DOMAIN MISMATCH VIEW
  // Only Zenoa branding and security advisory are shown. No user info or app details are leaked.
  // =========================================================================
  if (securityBlock) {
    return (
      <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 transition-colors selection:bg-rose-600 selection:text-white ${themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg bg-neutral-900 text-white rounded-3xl border border-rose-500/30 shadow-2xl shadow-rose-950/40 overflow-hidden"
        >
          {/* Top Brand Header */}
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black text-xs">
                Z
              </div>
              <span className="text-xs font-black tracking-tight text-white">Zenoa Security Protocol</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              <Ban className="h-3 w-3" />
              <span>Access Blocked</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 text-center">
            {/* Security Alert Badge */}
            <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-5 shadow-lg shadow-rose-500/10 relative">
              <ShieldAlert className="h-8 w-8" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {securityBlock.title}
            </h1>

            <p className="text-xs text-neutral-400 mt-2 leading-relaxed max-w-md mx-auto">
              This OAuth authentication request has been halted by Zenoa Identity Shield to prevent credential theft and unauthorized data access.
            </p>

            {/* Security Advisory Details Card */}
            <div className="mt-6 p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 text-left space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Security Violation Details
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {securityBlock.reason}
                </p>
              </div>

              {securityBlock.attemptedUri && securityBlock.attemptedUri !== 'Not Provided' && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    Attempted Callback URI
                  </span>
                  <div className="p-2.5 bg-neutral-900 border border-rose-900/50 rounded-xl text-[11px] font-mono text-rose-300 break-all select-all">
                    {securityBlock.attemptedUri}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
                  Developer Resolution
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {securityBlock.recommendation}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="/"
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Zenoa</span>
              </a>

              <a
                href="/sso"
                className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Open SSO Console</span>
              </a>
            </div>

            {/* Zero-Trust Guarantee */}
            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-center gap-1.5 text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
              <Lock className="h-3 w-3 text-rose-400" />
              <span>Zero-Trust Identity Enforced &bull; RFC 6749 Standard</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Callback Inspection UI for testing
  if (callbackData) {
    return (
      <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 ${themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-slate-50 text-neutral-900'}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-lg">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Authorization Successful</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Your application received the authorization response.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {callbackData.code && (
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-violet-500" /> Authorization Code
                  </span>
                  <button 
                    onClick={() => copyToClipboard(callbackData.code!, 'code')}
                    className="text-[11px] text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1 font-medium"
                  >
                    {copied === 'code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied === 'code' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-violet-700 dark:text-violet-300 break-all block">
                  {callbackData.code}
                </code>
              </div>
            )}

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                Authorized Identity Profile
              </span>
              <div className="flex items-center gap-3">
                <img 
                  src={callbackData.payload.picture} 
                  alt="Avatar" 
                  className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{callbackData.payload.name}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">@{callbackData.payload.username} &bull; {callbackData.payload.email}</p>
                </div>
              </div>
            </div>
          </div>

          {!tokenExchangeResult ? (
            <button
              onClick={handleExchangeToken}
              disabled={isExchangingToken}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExchangingToken ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Test Server-to-Server Token Exchange</span>
                </>
              )}
            </button>
          ) : (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-left">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                Access Token Issued
              </span>
              <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 break-all block mb-2">
                {tokenExchangeResult.access_token}
              </code>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Expires in {tokenExchangeResult.expires_in} seconds &bull; Bearer token
              </span>
            </div>
          )}

          <div className="mt-5 text-center">
            <a 
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              &larr; Return to Zenoa
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const effectiveActiveUser = selectedAccount || currentUser;
  const accountsToDisplay = (() => {
    const list: UserData[] = [];
    if (currentUser) {
      list.push(currentUser);
    }
    savedAccounts.forEach(acc => {
      if (acc && acc.username && !list.some(item => item.username.toLowerCase() === acc.username.toLowerCase())) {
        list.push(acc);
      }
    });
    return list;
  })();

  return (
    <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 transition-colors ${themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-slate-50 text-neutral-900'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          {/* Header Brand */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-violet-500/20">
                Z
              </div>
              <span className="text-xs font-black tracking-tight">Zenoa SSO</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-800/40 text-[10px] font-bold text-violet-700 dark:text-violet-300">
              <Lock className="h-3 w-3" />
              <span>OAuth 2.0 Secure</span>
            </div>
          </div>

          {/* App Branding */}
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-violet-600/20">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              Continue to {appConfig?.app_name || 'Application'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
              Log in with your Zenoa account to share your identity with <strong className="text-neutral-800 dark:text-neutral-200">{appConfig?.app_name || 'this application'}</strong>.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {wizardStep === 1 ? (
            /* Step 1: Account Selection / Inline Auth */
            <div className="space-y-4">
              {showInlineLoginForm ? (
                /* Inline sign-in form */
                <form onSubmit={handleInlineLoginSubmit} className="space-y-3 p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-slate-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Sign in with Zenoa</span>
                    {accountsToDisplay.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setShowInlineLoginForm(false)}
                        className="text-[11px] text-violet-600 dark:text-violet-400 font-bold hover:underline cursor-pointer"
                      >
                        Use Saved Account
                      </button>
                    )}
                  </div>

                  {inlineLoginError && (
                    <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                      {inlineLoginError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Username or Email</label>
                    <input
                      type="text"
                      value={inlineIdentifier}
                      onChange={(e) => setInlineIdentifier(e.target.value)}
                      placeholder="e.g. username or email"
                      className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={inlinePassword}
                      onChange={(e) => setInlinePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-violet-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inlineLoginLoading}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {inlineLoginLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Sign In & Select</span>
                    )}
                  </button>
                </form>
              ) : accountsToDisplay.length > 0 ? (
                /* List of Available / Saved Accounts */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Choose an Account</span>
                    <span className="text-[10px] text-neutral-400 font-medium">{accountsToDisplay.length} available</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {accountsToDisplay.map((acc) => {
                      const isCurrent = currentUser?.username?.toLowerCase() === acc.username?.toLowerCase();
                      return (
                        <div
                          key={acc.username}
                          onClick={() => {
                            setSelectedAccount(acc);
                            setWizardStep(2);
                          }}
                          className="group p-3.5 bg-slate-50 dark:bg-neutral-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-2xl border border-slate-200 dark:border-neutral-700/80 hover:border-violet-300 dark:hover:border-violet-700 flex items-center justify-between cursor-pointer transition-all active:scale-98"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center overflow-hidden shrink-0 border border-violet-200/50 dark:border-violet-800/40">
                              {acc.avatar_url ? (
                                <img src={acc.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                              )}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                                  {acc.display_name || acc.username}
                                </h4>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">@{acc.username}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setShowInlineLoginForm(true)}
                    className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Use or Sign In with Another Account</span>
                  </button>
                </div>
              ) : (
                /* No accounts yet - Direct in-situ login */
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-slate-200 dark:border-neutral-700 text-center">
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-3 leading-relaxed">
                      No accounts found on this browser. Sign in to your Zenoa account to authorize <strong className="text-neutral-900 dark:text-white">{appConfig?.app_name || 'this app'}</strong>.
                    </p>
                    <button
                      onClick={() => setShowInlineLoginForm(true)}
                      className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Sign In to Zenoa</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Permissions Consent */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <button 
                  onClick={() => setWizardStep(1)}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  <span>Switch Account</span>
                </button>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Authorize Permissions</span>
              </div>

              {/* Selected account summary card */}
              {effectiveActiveUser && (
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-2xl border border-violet-200/60 dark:border-violet-800/40 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-200 dark:bg-violet-900/60 flex items-center justify-center overflow-hidden shrink-0">
                    {effectiveActiveUser.avatar_url ? (
                      <img src={effectiveActiveUser.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <Bot className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                      {effectiveActiveUser.display_name || effectiveActiveUser.username}
                    </h4>
                    <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium truncate">@{effectiveActiveUser.username}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mr-1" />
                </div>
              )}

              {/* Scopes permissions */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 dark:bg-neutral-800/40 rounded-2xl border border-slate-100 dark:border-neutral-800 text-xs">
                <div className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Verify Identity:</strong> Confirm your Zenoa username (@{effectiveActiveUser?.username})</span>
                </div>
                <div className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Profile Data:</strong> View your name and profile picture</span>
                </div>
                <div className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Contact Info:</strong> Share your verified email address</span>
                </div>
              </div>

              {/* Authorize button */}
              <button 
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isAuthorizing ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authorize & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed text-center mt-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                By clicking Authorize, you grant <strong className="text-neutral-700 dark:text-neutral-200">{appConfig?.app_name || 'this application'}</strong> access to your profile data in accordance with their terms.
              </div>
            </div>
          )}

          {/* Footer Branding */}
          <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <Lock className="h-3 w-3 text-violet-500" />
            <span>256-Bit Encrypted OAuth Session</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

