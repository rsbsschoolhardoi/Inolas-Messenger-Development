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
  AlertTriangle, X
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

  useEffect(() => {
    resolveAndApplyMetadata();
  }, []);

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
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <h2 className="text-sm font-bold tracking-tight">Initializing Identity Console...</h2>
        <p className="text-[11px] text-slate-400 mt-1">Connecting to OAuth 2.0 & OIDC Provider</p>
      </div>
    );
  }

  // 1. MANDATORY ACCESS GATE & DEDICATED SSO LANDING PAGE (When not authenticated)
  if (!user) {
    const isDark = themeMode === 'dark';
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-hidden ${
        isDark ? 'dark bg-[#0c1024] text-white selection:bg-[#533afd] selection:text-white' : 'bg-[#f6f9fc] text-[#0d253d] selection:bg-[#533afd]/20 selection:text-[#533afd]'
      }`}>
        {/* Background Wave Arc Visual */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15 -z-10">
          <WaveArcs
            backgroundColor="transparent"
            lineColor={isDark ? 'rgb(129, 140, 248)' : 'rgb(83, 58, 253)'}
            lineWidth={1.2}
            lineCount={64}
            speed={4.5}
            glow={12}
            interactive={false}
          />
        </div>

        {/* Top Navigation */}
        <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
          isDark ? 'border-[#273951]/80 bg-[#0c1024]/90' : 'border-[#e3e8ee]/90 bg-white/90 shadow-[0_1px_3px_rgba(0,55,112,0.04)]'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo
                src={branding.oauth_logo || branding.dev_console_logo || branding.public_logo}
                name={branding.app_name || 'Zenoa'}
                size="sm"
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#0d253d] dark:text-white">{branding.app_name || 'Zenoa'}</span>
                <span className="text-[10px] font-mono uppercase bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 px-2.5 py-0.5 rounded-full font-bold tracking-wider border border-[#533afd]/20">
                  SSO & OAuth 2.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="sso_landing_theme_toggle"
                onClick={() => {
                  const nextTheme = themeMode === 'light' ? 'dark' : 'light';
                  setThemeMode(nextTheme);
                  try {
                    localStorage.setItem('zenoa_oauth_theme', nextTheme);
                  } catch (e) {}
                }}
                className="p-2 rounded-full border border-[#e3e8ee] dark:border-[#273951] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#273951] dark:text-[#cbd5e1] transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#273951]" />}
              </button>

              <a
                href="/"
                className="text-xs font-semibold text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white flex items-center gap-1.5 transition-colors hidden sm:flex px-2 py-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Messenger</span>
              </a>

              <a
                href="/developer"
                className="text-xs font-semibold text-[#64748d] dark:text-[#94a3b8] hover:text-[#533afd] dark:hover:text-white transition-colors hidden sm:inline-block px-2 py-1"
              >
                Dev Console
              </a>

              <ContinueWithZenoaButton
                portal="sso"
                size="sm"
                variant="primary"
                className="rounded-full !py-2 !px-3.5 text-xs shadow-xs"
                showArrow={false}
              />
            </div>
          </div>
        </header>

        {/* Hero & Access Gate */}
        <main className="flex-1 flex flex-col justify-center items-center py-16 md:py-24 px-4 sm:px-6 relative z-10 max-w-5xl mx-auto w-full text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#1c1e54]/95 border border-[#e3e8ee] dark:border-[#273951] text-[#273951] dark:text-[#cbd5e1] text-[13px] shadow-[0_1px_3px_rgba(0,55,112,0.06)] mx-auto flex-wrap mb-6">
            <span className="h-2 w-2 rounded-full bg-[#533afd] animate-pulse" />
            <span className="font-semibold text-[#0d253d] dark:text-white">Inolas Nexus Identity</span>
            <span className="text-[#a8c3de] dark:text-[#64748d]">•</span>
            <span className="text-[#533afd] dark:text-[#b9b9f9] font-medium">OAuth 2.0 & OIDC</span>
            <span className="text-[#a8c3de] dark:text-[#64748d]">•</span>
            <span className="font-tabular text-[#273951] dark:text-[#cbd5e1] text-[12px]">RFC 6749 Compliant</span>
          </div>

          <h1 className="text-[34px] sm:text-[46px] lg:text-[54px] font-bold tracking-tight text-[#0d253d] dark:text-white leading-[1.18] sm:leading-[1.14]">
            OAuth 2.0 & OpenID Connect Console
            <span className="block mt-2 text-[#533afd] dark:text-[#818cf8]">
              Decentralized Identity Infrastructure.
            </span>
          </h1>

          <p className="text-[16px] sm:text-[18px] font-normal text-[#273951] dark:text-[#cbd5e1] max-w-2xl mx-auto mt-4 leading-[1.6]">
            Register third-party client applications, issue Client IDs & Secrets, whitelist authorized callback URIs, and integrate "Continue with {branding.app_name || 'Zenoa'}" authentication with cryptographic zero-knowledge security.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ContinueWithZenoaButton
              portal="sso"
              size="lg"
              variant="primary"
              className="w-full sm:w-auto shadow-lg"
            />
            <a
              href="/docs"
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-[#121624] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#0d253d] dark:text-white border border-[#e3e8ee] dark:border-[#273951] text-[15px] font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              OAuth Documentation
            </a>
          </div>

          <p className="text-[12px] text-[#64748d] dark:text-[#94a3b8] mt-3">
            Authenticate with your active {branding.app_name || 'Zenoa'} developer identity to access the management portal.
          </p>

          {/* Architecture Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121624]/90 border-[#273951] text-white' : 'bg-white border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] text-[#0d253d]'
            }`}>
              <div className="h-11 w-11 rounded-xl bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 flex items-center justify-center mb-4 border border-[#533afd]/20">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">RFC 6749 Auth Codes</h3>
              <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                Standard authorization code flow with high-entropy 256-bit secure auth codes, PKCE S256 verification, and server-to-server token exchange.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121624]/90 border-[#273951] text-white' : 'bg-white border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] text-[#0d253d]'
            }`}>
              <div className="h-11 w-11 rounded-xl bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 flex items-center justify-center mb-4 border border-[#533afd]/20">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">Strict Redirect Whitelisting</h3>
              <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                Prevent token interception with exact protocol, domain, port, and path matching for web, desktop, and mobile callback URIs.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-[#121624]/90 border-[#273951] text-white' : 'bg-white border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] text-[#0d253d]'
            }`}>
              <div className="h-11 w-11 rounded-xl bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 flex items-center justify-center mb-4 border border-[#533afd]/20">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">Interactive Sandbox & SDKs</h3>
              <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                Step-by-step simulator, embeddable button generator, and multi-language handlers for React, Node, Python, and Go.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`border-t py-6 px-4 sm:px-6 text-center text-xs text-[#64748d] dark:text-[#94a3b8] mt-auto ${
          isDark ? 'border-[#273951]/80 bg-[#0c1024]' : 'border-[#e3e8ee] bg-white'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} {branding.app_name || 'Zenoa'} &bull; Inolas Nexus SSO. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[12px]">
              <a href="/legal/terms" className="hover:text-[#533afd] transition-colors">Terms of Service</a>
              <a href="/legal/privacy" className="hover:text-[#533afd] transition-colors">Privacy Policy</a>
              <a href="/docs" className="hover:text-[#533afd] transition-colors">OAuth Specifications</a>
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
                isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
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
                  <p className="text-xs text-[#64748d] dark:text-[#94a3b8]">You will return to the SSO Console landing page.</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] mb-6 leading-relaxed">
                Signing out will safely terminate your active SSO administrative session. You will remain on this portal's landing page where you can reconnect anytime.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark ? 'border-[#273951] hover:bg-[#1c1e54] text-[#cbd5e1]' : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#273951]'
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
