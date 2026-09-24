import React, { useState, useEffect } from 'react';
import { resolveAndApplyMetadata } from '../seoUtils';
import { db } from '../firebaseClient';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { SSOPortal } from './SSOPortal';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { BrandLogo } from './common/BrandLogo';
import { ContinueWithZenoaButton } from './common/ContinueWithZenoaButton';
import { WaveArcs } from './originkit/ui/wave-arcs';
import { 
  Shield, ArrowRight, Lock, Key, Sparkles, RefreshCw, 
  User, Mail, Terminal, ArrowLeft, LogOut, Globe, CheckCircle2,
  Code2, Layers, ShieldCheck, Fingerprint, ExternalLink, Sun, Moon, Zap,
  AlertTriangle, X, Copy, Check, FileText, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SSOConsoleStandaloneProps {
  currentUser?: UserData | null;
}

const safeBase64Decode = (str: string): string => {
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

type OAuthCodeTab = 'react' | 'nodejs' | 'python' | 'curl';

const OAUTH_CODE_EXAMPLES: Record<OAuthCodeTab, { filename: string; language: string; code: string }> = {
  react: {
    filename: 'LoginButton.tsx',
    language: 'typescript',
    code: `import { ContinueWithZenoaButton } from '@zenoa/auth-react';

export const AuthScreen = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2>Sign in to Acme Cloud</h2>
      <ContinueWithZenoaButton
        clientId="app_89f3a1b4c7"
        redirectUri="https://app.acme.com/auth/callback"
        scope="openid profile email"
        onSuccess={(authPayload) => {
          console.log('Authenticated session:', authPayload);
        }}
      />
    </div>
  );
};`
  },
  nodejs: {
    filename: 'oauth_callback.ts',
    language: 'typescript',
    code: `import express from 'express';
import axios from 'axios';

const router = express.Router();

// Exchange temporary authorization code for verified tokens
router.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  const tokenResponse = await axios.post('https://api.zenoa.in/v1/oauth/token', {
    grant_type: 'authorization_code',
    client_id: process.env.ZENOA_CLIENT_ID,
    client_secret: process.env.ZENOA_CLIENT_SECRET,
    code: code,
    redirect_uri: 'https://app.acme.com/auth/callback'
  });

  const { access_token, id_token, user } = tokenResponse.data;
  req.session.user = user;
  res.redirect('/dashboard');
});`
  },
  python: {
    filename: 'auth_router.py',
    language: 'python',
    code: `import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/auth/callback")
async def oauth_callback(code: str, state: str = None):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.zenoa.in/v1/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": "app_89f3a1b4c7",
                "client_secret": "sec_live_948f93e2910a",
                "code": code,
                "redirect_uri": "https://app.acme.com/auth/callback"
            }
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="OAuth Exchange Failed")
        
        token_data = res.json()
        return {"status": "authenticated", "user": token_data.get("user")}`
  },
  curl: {
    filename: 'exchange_token.sh',
    language: 'bash',
    code: `# Server-side Token Exchange endpoint
curl -X POST https://api.zenoa.in/v1/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=app_89f3a1b4c7" \\
  -d "client_secret=sec_live_948f93e2910a" \\
  -d "code=auth_code_7d2f91a0" \\
  -d "redirect_uri=https://app.acme.com/auth/callback"`
  }
};

export const SSOConsoleStandalone: React.FC<SSOConsoleStandaloneProps> = ({ currentUser: propUser }) => {
  const branding = useBranding();
  const [user, setUser] = useState<UserData | null>(propUser || null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('zenoa_oauth_theme') || localStorage.getItem('zenoa_theme_mode');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch (e) {}
    return 'light';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<OAuthCodeTab>('react');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    resolveAndApplyMetadata();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(OAUTH_CODE_EXAMPLES[activeCodeTab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  const fetchFullUserProfile = async (searchIdent: string, uid?: string): Promise<UserData | null> => {
    if (!db) return null;
    try {
      if (uid) {
        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists() && uidSnap.data()?.username) {
          return { id: uidSnap.id, ...uidSnap.data() } as UserData;
        }
      }

      const clean = searchIdent.trim().toLowerCase().replace(/^@/, '');
      const userDoc = await getDoc(doc(db, 'users', clean));
      if (userDoc.exists() && userDoc.data()?.username) {
        return { id: userDoc.id, ...userDoc.data() } as UserData;
      }

      const usersRef = collection(db, 'users');
      const uq = query(usersRef, where('username', '==', clean));
      const uSnap = await getDocs(uq);
      if (!uSnap.empty) {
        return { id: uSnap.docs[0].id, ...uSnap.docs[0].data() } as UserData;
      }
    } catch (err) {
      console.warn('SSO user fetch error:', err);
    }
    return null;
  };

  useEffect(() => {
    // If propUser was provided, prioritize it
    if (propUser && propUser.username) {
      setUser(propUser);
      try {
        localStorage.setItem('zenoa_sso_console_user', JSON.stringify(propUser));
      } catch (e) {}
      setLoading(false);
      return;
    }

    // Check if returning from OAuth handshake with code / payload
    const searchParams = new URLSearchParams(window.location.search);
    const hasOAuthReturn = searchParams.has('code') || searchParams.has('payload');

    if (hasOAuthReturn) {
      try {
        sessionStorage.removeItem('zenoa_sso_console_logged_out');
      } catch (e) {}

      let resolvedOAuthUser: UserData | null = null;

      // If payload is present in query, parse it as instant fallback
      const rawPayload = searchParams.get('payload');
      if (rawPayload) {
        try {
          const decoded = JSON.parse(safeBase64Decode(rawPayload));
          if (decoded && (decoded.username || decoded.sub || decoded.uid)) {
            resolvedOAuthUser = {
              id: decoded.sub || decoded.uid || `user_${decoded.username}`,
              zenoa_id: decoded.zenoa_id || `${decoded.username}@zenoa`,
              username: (decoded.username || 'developer').replace(/^@/, ''),
              display_name: decoded.name || decoded.display_name || decoded.username,
              bio: decoded.bio || 'Zenoa Identity Admin',
              avatar_seed: decoded.avatar_seed || decoded.username || 'developer',
              online: true,
              last_seen: 'Just now',
              email: decoded.email || '',
              mobile_number: decoded.phone_number || decoded.mobile_number || '',
              avatar_url: decoded.picture || decoded.avatar_url || '',
              is_verified: true,
              is_official: false
            };
            localStorage.setItem('zenoa_sso_console_user', JSON.stringify(resolvedOAuthUser));
            localStorage.setItem('zenoa_user', JSON.stringify(resolvedOAuthUser));
          }
        } catch (e) {}
      }

      if (!resolvedOAuthUser) {
        try {
          const raw = localStorage.getItem('zenoa_sso_console_user') || localStorage.getItem('zenoa_user');
          if (raw) resolvedOAuthUser = JSON.parse(raw);
        } catch (e) {}
      }

      // Clean the query parameters from the address bar
      window.history.replaceState({}, document.title, window.location.pathname);

      if (resolvedOAuthUser) {
        setUser(resolvedOAuthUser);
        setLoading(false);
        fetchFullUserProfile(resolvedOAuthUser.username, resolvedOAuthUser.id).then(profile => {
          if (profile) setUser(profile);
        }).catch(() => {});
        return;
      }
    }

    // Mandatory login check: If user explicitly logged out in this session and NOT returning from fresh OAuth
    const isLoggedOut = !hasOAuthReturn && sessionStorage.getItem('zenoa_sso_console_logged_out') === 'true';

    // Check if there is an active SSO Console session or main Zenoa session stored
    if (!isLoggedOut) {
      try {
        const storedSSOUser = localStorage.getItem('zenoa_sso_console_user') || localStorage.getItem('zenoa_user');
        if (storedSSOUser) {
          const parsed = JSON.parse(storedSSOUser);
          if (parsed && (parsed.username || parsed.id)) {
            setUser(parsed);
            setLoading(false);

            fetchFullUserProfile(parsed.username || parsed.id, parsed.id).then(profile => {
              if (profile) setUser(profile);
            }).catch(() => {});
            return;
          }
        }
      } catch (e) {}
    }

    setLoading(false);
  }, [propUser]);

  const handleAuthenticatedWithZenoa = async (authenticatedUser: UserData) => {
    try {
      sessionStorage.removeItem('zenoa_sso_console_logged_out');
      const freshUser = await fetchFullUserProfile(authenticatedUser.username, authenticatedUser.id) || authenticatedUser;
      setUser(freshUser);
      localStorage.setItem('zenoa_sso_console_user', JSON.stringify(freshUser));
    } catch (err) {
      console.error('SSO session setup error:', err);
      sessionStorage.removeItem('zenoa_sso_console_logged_out');
      setUser(authenticatedUser);
      localStorage.setItem('zenoa_sso_console_user', JSON.stringify(authenticatedUser));
    }
  };

  const handleConfirmLogout = () => {
    try {
      localStorage.removeItem('zenoa_sso_console_user');
      sessionStorage.setItem('zenoa_sso_console_logged_out', 'true');
    } catch (e) {}
    setUser(null);
    setShowLogoutConfirm(false);
    window.history.pushState({}, '', '/sso');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d1d] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight">Initializing Identity Console...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to OAuth 2.0 & OIDC Provider</p>
      </div>
    );
  }

  // 1. MANDATORY ACCESS GATE & DEDICATED SSO LANDING PAGE (When not authenticated)
  if (!user) {
    const isDark = themeMode === 'dark';
    const appName = branding.app_name || 'Zenoa';
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-hidden ${
        isDark ? 'dark bg-[#0a0d1d] text-slate-100 selection:bg-[#533afd] selection:text-white' : 'bg-[#f8fafc] text-slate-900 selection:bg-[#533afd]/20 selection:text-[#533afd]'
      }`}>
        {/* Background Wave Arc Visual */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15 -z-10">
          <WaveArcs
            backgroundColor="transparent"
            lineColor={isDark ? 'rgb(129, 140, 248)' : 'rgb(83, 58, 253)'}
            lineWidth={1.2}
            lineCount={54}
            speed={4.0}
            glow={10}
            interactive={false}
          />
        </div>

        {/* Top Navigation */}
        <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#0a0d1d]/90' : 'border-slate-200/90 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo
                src={branding.oauth_logo || branding.dev_console_logo || branding.public_logo}
                name={appName}
                size="sm"
              />
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  {appName}
                </span>
                <span className="hidden sm:inline-block h-3.5 w-px bg-slate-300 dark:bg-slate-700" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/50">
                  OAuth 2.0 & OIDC Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <a
                href="/"
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors hidden md:flex px-2 py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Messenger</span>
              </a>

              <a
                href="/developer"
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline-block px-2 py-1"
              >
                Developer Platform
              </a>

              <a
                href="/docs"
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline-block px-2 py-1"
              >
                Integration Specs
              </a>

              <button
                id="sso_landing_theme_toggle"
                onClick={() => {
                  const nextTheme = themeMode === 'light' ? 'dark' : 'light';
                  setThemeMode(nextTheme);
                  try {
                    localStorage.setItem('zenoa_oauth_theme', nextTheme);
                  } catch (e) {}
                }}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>

              <ContinueWithZenoaButton
                portal="sso"
                size="sm"
                variant="primary"
                className="rounded-lg !py-2 !px-3.5 text-xs shadow-xs"
                showArrow={false}
              />
            </div>
          </div>
        </header>

        {/* Hero & Access Section */}
        <main className="flex-1 flex flex-col justify-center items-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto w-full">
          <div className="max-w-4xl w-full text-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Identity & Access Management</span>
              <span aria-hidden="true">·</span>
              <span>OpenID Connect Certified</span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-600 dark:text-indigo-400">RFC 6749 & PKCE S256</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Enterprise Identity &
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
                Single Sign-On Infrastructure.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Federate user authentication across web, mobile, and backend services with cryptographic zero-knowledge trust, granular consent scopes, and seamless 1-click login.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ContinueWithZenoaButton
                portal="sso"
                size="lg"
                variant="primary"
                className="w-full sm:w-auto shadow-md"
              />
              <a
                href="/docs"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                <span>OAuth Specifications</span>
              </a>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your verified developer account to register client applications, issue secrets, and test sandbox flows.
            </p>
          </div>

          {/* Interactive Protocol Integration Showcase */}
          <div className="mt-14 w-full max-w-4xl">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 shadow-xl overflow-hidden text-left">
              {/* Window Header */}
              <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
                    {(['react', 'nodejs', 'python', 'curl'] as OAuthCodeTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                          activeCodeTab === tab 
                            ? 'bg-indigo-600 text-white font-semibold' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab === 'react' ? 'React SDK' : tab === 'nodejs' ? 'Express' : tab === 'python' ? 'FastAPI' : 'cURL'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                    {OAUTH_CODE_EXAMPLES[activeCodeTab].filename}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors cursor-pointer"
                    title="Copy code snippet"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto selection:bg-indigo-500/30">
                <pre className="text-slate-200 whitespace-pre">
                  <code>{OAUTH_CODE_EXAMPLES[activeCodeTab].code}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Architecture Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full max-w-6xl">
            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-2">RFC 6749 Auth Code Flow</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Standard two-legged authorization exchange with high-entropy short-lived authorization codes, preventing credential exposure in client logs.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Mandatory PKCE S256</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Proof Key for Code Exchange (RFC 7636) with SHA-256 code verifier challenges, providing airtight security for public mobile and single-page apps.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Strict URI Whitelisting</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Deterministic matching on protocol, subdomain, port, and callback paths to safeguard against open-redirect and token interception vectors.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
                <Fingerprint className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Granular Scopes & Claims</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Fine-grained control over identity claims (`openid`, `profile`, `email`, `phone`) giving end-users clear transparency and consent control.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Interactive Sandbox Suite</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Simulate full authorization handshakes, test token exchanges, and preview decoded claims with live error handling before going live.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-2">Drop-in UI & SDK Components</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Prebuilt accessible login buttons, responsive consent dialogs, and official SDK helpers for React, Next.js, Express, and FastAPI.
              </p>
            </div>
          </div>

          {/* 3-Step Lifecycle Overview */}
          <div className="mt-20 max-w-5xl w-full text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Three Steps to Production Identity
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
              Integrate single sign-on into your architecture in minutes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">01</span>
                <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white">Register Client App</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Provide your application name, branding assets, and generate your production Client ID & Secret.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">02</span>
                <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white">Whitelist Callback URIs</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Register authorized redirect endpoints for local development and production environments.
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">03</span>
                <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white">Embed 1-Click Login</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Drop in our Continue with {appName} button component and verify incoming JWT tokens server-side.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`border-t py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-600 dark:text-slate-400 mt-auto transition-colors ${
          isDark ? 'border-slate-800/80 bg-[#080b18]' : 'border-slate-200 bg-white'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{appName}</span>
              <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-medium">
              <a href="/legal/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</a>
              <a href="/legal/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="/developer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Developer Platform</a>
              <a href="/docs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">OAuth 2.0 Specifications</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. ACTIVE SSO PORTAL VIEW (When authenticated)
  const isDark = themeMode === 'dark';
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SSOPortal
        themeMode={themeMode}
        currentUser={user}
        onBack={() => setShowLogoutConfirm(true)}
        onOpenConsentPreview={(clientId, redirectUri) => {
          window.open(`/auth/sso?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`, '_blank');
        }}
      />

      {/* Dedicated SSO Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${
                isDark ? 'bg-[#0d1326] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Sign Out of SSO Console?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">You will return to the SSO Console landing page.</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Signing out will safely terminate your active SSO administrative session. You will remain on this portal's landing page where you can reconnect anytime.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
