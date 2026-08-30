import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Smartphone, ArrowRight, CheckCircle2, AlertCircle, Bot, LogOut, 
  Code, Copy, Check, ExternalLink, RefreshCw, Key, Lock, Globe, Sparkles 
} from 'lucide-react';
import { UserData } from '../types';
import { db } from '../firebaseClient';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';

interface SSOLoginProps {
  themeMode: 'light' | 'dark';
  currentUser: UserData | null;
  onLoginRequest: () => void;
  onLogout: () => void;
}

export const SSOLogin: React.FC<SSOLoginProps> = ({ 
  themeMode, 
  currentUser, 
  onLoginRequest,
  onLogout
}) => {
  const [clientId, setClientId] = useState<string>('demo_app');
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [state, setState] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  
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
  const [showDevDetails, setShowDevDetails] = useState(false);

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

    // Determine target client_id and redirect_uri
    const effectiveClientId = cid || 'demo_app';
    const effectiveRedirectUri = ruri || (window.location.origin + '/auth/sso');

    setClientId(effectiveClientId);
    setRedirectUri(effectiveRedirectUri);
    setState(st || 'state_' + Math.random().toString(36).substring(2, 8));

    // Fetch App Config from Live Firestore Backend
    const fetchConfig = async () => {
      try {
        if (!db) throw new Error("Database not initialized");
        
        const ssoRef = collection(db, 'sso_applications');
        const q = query(ssoRef, where('client_id', '==', effectiveClientId));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const appData = snap.docs[0].data();
          const fetchedConfig = {
            ...appData,
            client_secret: appData.client_secret
          };
          setAppConfig(fetchedConfig);

          // Strict URL and Redirect URI Security Validation
          if (fetchedConfig.redirect_uris && fetchedConfig.redirect_uris.length > 0) {
            const isAllowed = fetchedConfig.redirect_uris.some((allowed: string) => {
              try {
                const u1 = new URL(allowed);
                const u2 = new URL(effectiveRedirectUri);
                // Allow matching origin + pathname or exact prefix
                return u1.origin === u2.origin && u2.pathname.startsWith(u1.pathname);
              } catch {
                return allowed === effectiveRedirectUri;
              }
            });

            if (!isAllowed) {
              setError(`Security Mismatch: The requested redirect_uri ("${effectiveRedirectUri}") does not match the registered authorized redirect URIs for this application. Access blocked to prevent misuse.`);
            }
          }
        } else if (effectiveClientId === 'demo_app') {
          setAppConfig({
            app_name: 'Zenoa Developer Demo',
            bot_username: 'zenoabot',
            app_description: 'Interactive OAuth 2.0 & Single Sign-On testing application',
            website_url: window.location.origin,
            client_secret: 'demo_secret',
            redirect_uris: [window.location.origin + '/auth/sso']
          });
        } else {
          setError(`Application not found for client_id: "${effectiveClientId}". Please verify the link.`);
        }
      } catch (err: any) {
        console.error("Firestore config fetch error:", err);
        setError('Failed to load application configuration. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, []);

  const handleAuthorize = async () => {
    if (!currentUser || !clientId || !redirectUri || !appConfig) return;
    
    setIsAuthorizing(true);
    setError(null);

    try {
      if (!db) throw new Error("Database not connected");

      // 1. Generate Auth Code
      const authCode = 'zen_ac_' + Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const expiryDate = Date.now() + 10 * 60 * 1000; // 10 mins

      const authPayload = {
        code: authCode,
        client_id: clientId,
        user_id: currentUser.id,
        redirect_uri: redirectUri,
        scopes: appConfig.scopes || ['profile', 'email'],
        expires_at: expiryDate,
        created_at: Date.now()
      };

      // 2. Save Auth Code to Firestore
      await setDoc(doc(db, 'sso_authorizations', authCode), authPayload);

      // 3. Generate Signed SSO Payload
      const secret = appConfig.client_secret || 'zenoa_sso_secret';
      const ssoPayload = {
        uid: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
        email: currentUser.email,
        mobile_number: currentUser.mobile_number,
        avatar_url: currentUser.avatar_url || currentUser.avatar_seed,
        iss: 'zenoa_sso',
        client_id: clientId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const payloadStr = JSON.stringify(ssoPayload);
      
      // Properly base64 encode supporting unicode
      const base64Payload = btoa(encodeURIComponent(payloadStr).replace(/%([0-9A-F]{2})/g,
          function toSolidBytes(match, p1) {
              return String.fromCharCode(Number('0x' + p1));
      }));

      // Sign with HMAC SHA256 using Web Crypto API
      const encoder = new TextEncoder();
      const key = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await window.crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
      const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // 4. Redirect User
      try {
        const finalUrl = new URL(redirectUri, window.location.origin);
        finalUrl.searchParams.set('code', authCode);
        finalUrl.searchParams.set('payload', base64Payload);
        finalUrl.searchParams.set('signature', signature);
        if (state) finalUrl.searchParams.set('state', state);
        
        window.location.href = finalUrl.toString();
      } catch (urlErr) {
        const sep = redirectUri.includes('?') ? '&' : '?';
        window.location.href = `${redirectUri}${sep}code=${encodeURIComponent(authCode)}&payload=${encodeURIComponent(base64Payload)}&signature=${encodeURIComponent(signature)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
      }
    } catch (err: any) {
      setError(err?.message || 'Authorization service error');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleTestTokenExchange = async () => {
    if (!callbackData?.code) return;
    setIsExchangingToken(true);
    try {
      const secretToUse = prompt("Enter your Application's Client Secret (zen_sec_...) to test OAuth 2.0 Token Exchange:") || '';
      if (!secretToUse) {
        setIsExchangingToken(false);
        return;
      }

      const res = await fetch('/api/v1/sso/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: secretToUse.trim(),
          code: callbackData.code,
          redirect_uri: redirectUri
        })
      });

      const data = await res.json();
      setTokenExchangeResult(data);
    } catch (err: any) {
      setTokenExchangeResult({ error: err.message });
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Verifying OAuth Client...</p>
        </div>
      </div>
    );
  }

  // --- CALLBACK / TEST SUCCESS VIEW ---
  if (callbackData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full"
        >
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-neutral-800 relative overflow-hidden space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-neutral-900 dark:text-white">SSO Authorization Success</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Live Response
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">OAuth credentials & signed payload received at callback</p>
              </div>
            </div>

            {/* Authenticated User Preview */}
            <div className="p-4 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/60 dark:border-neutral-700/60 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center font-bold text-violet-700 dark:text-violet-300 text-lg">
                {callbackData.payload.display_name ? callbackData.payload.display_name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{callbackData.payload.display_name || 'Anonymous'}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  @{callbackData.payload.username} {callbackData.payload.email ? `• ${callbackData.payload.email}` : ''} {callbackData.payload.mobile_number ? `• ${callbackData.payload.mobile_number}` : ''}
                </p>
              </div>
            </div>

            {/* Authorization Code Section */}
            {callbackData.code && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-indigo-600" />
                    OAuth 2.0 Authorization Code (Single-Use, 10-Min Expiry)
                  </span>
                  <button
                    onClick={() => copyToClipboard(callbackData.code!, 'code')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copied === 'code' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copied === 'code' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  {callbackData.code}
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={handleTestTokenExchange}
                    disabled={isExchangingToken}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Test Token Exchange API (`/api/v1/sso/token`)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Token Exchange Result */}
            {tokenExchangeResult && (
              <div className="p-4 bg-neutral-900 text-white rounded-2xl border border-neutral-800 text-xs font-mono">
                <p className="text-emerald-400 font-bold mb-1">Token Exchange Response:</p>
                <pre className="overflow-x-auto">{JSON.stringify(tokenExchangeResult, null, 2)}</pre>
              </div>
            )}

            {/* Decoded JSON Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-violet-500" />
                  Decoded Token Payload
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(callbackData.payload, null, 2), 'payload')}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copied === 'payload' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copied === 'payload' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-neutral-900 text-neutral-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-40 border border-neutral-800 leading-relaxed">
                {JSON.stringify(callbackData.payload, null, 2)}
              </pre>
            </div>

            {/* Signature status */}
            <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-2xl border border-violet-200/60 dark:border-violet-800/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Key className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400 truncate">
                  HMAC-SHA256: {callbackData.signature}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(callbackData.signature, 'signature')}
                className="text-[10px] text-violet-600 dark:text-violet-400 font-bold shrink-0 hover:underline"
              >
                {copied === 'signature' ? 'Copied' : 'Copy Sig'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  window.location.href = '/developer';
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="h-3.5 w-3.5" />
                Open Developer Console
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 px-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-600/20"
              >
                Return to Zenoa App
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- MAIN SSO AUTHORIZATION SCREEN ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden relative">
          
          {/* Top Header */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">Zenoa</span>
            </div>
          </div>

          {/* Shield Icon / App Branding */}
          <div className="flex justify-center mb-6 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
              <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 p-4 rounded-3xl shadow-xl text-white">
                <Shield className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              Continue to {appConfig?.app_name || 'Application'}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-3">
              Use your Zenoa account to securely log into <span className="font-bold text-neutral-800 dark:text-neutral-200">{appConfig?.app_name || 'this application'}</span>.
            </p>
            {appConfig?.website_url && (
              <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1 hover:text-indigo-400">
                <Globe className="h-3 w-3" /> <a href={appConfig.website_url} target="_blank" rel="noreferrer" className="hover:underline">{appConfig.website_url}</a>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800/40 text-xs text-rose-600 dark:text-rose-400 mb-5 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!currentUser ? (
            <div className="space-y-4">
              <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
                  Sign in to your Zenoa account to authorize access for <span className="font-bold text-neutral-800 dark:text-neutral-200">{appConfig?.app_name || 'this application'}</span>.
                </p>
                <button 
                  onClick={onLoginRequest}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-98 cursor-pointer"
                >
                  Sign In to Zenoa
                </button>
              </div>
              <p className="text-[10px] text-center text-neutral-400 dark:text-neutral-500">
                You will be redirected back here immediately after login.
              </p>
            </div>
          ) : wizardStep === 1 ? (
            <div className="space-y-4">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-center">Select Account</p>
              
              <div 
                onClick={() => setWizardStep(2)}
                className="group p-4 bg-slate-50 dark:bg-neutral-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-700 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center overflow-hidden shrink-0">
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{currentUser.display_name || currentUser.username}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">@{currentUser.username}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              </div>
              
              <div className="flex justify-center mt-2">
                <button 
                  onClick={onLogout}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors font-medium flex items-center gap-1.5"
                >
                  <LogOut className="h-3 w-3" /> Use a different account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => setWizardStep(1)}
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  title="Back to accounts"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Permissions Requested</span>
              </div>
              
              {/* Scopes permissions */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-neutral-800/30 rounded-2xl border border-slate-100 dark:border-neutral-800">
                <div className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Verify Identity:</strong> Know who you are on Zenoa (@{currentUser.username})</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Basic Profile:</strong> View your name and profile picture</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Contact Info:</strong> View your email address and mobile number</span>
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

              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed text-center mt-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                By continuing, Zenoa will share your identity and profile data with <strong className="text-neutral-700 dark:text-neutral-200">{appConfig?.app_name || 'this application'}</strong> in accordance with their privacy policy and terms of service.
              </div>
            </div>
          )}

          {/* Footer Branding */}
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-center gap-2 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
            <Lock className="h-3 w-3 text-violet-500" />
            <span>256-Bit Encrypted OAuth Session</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
