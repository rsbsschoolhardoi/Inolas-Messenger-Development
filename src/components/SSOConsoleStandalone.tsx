import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { SSOPortal } from './SSOPortal';
import { ZenoaAuthGatewayModal } from './ZenoaAuthGatewayModal';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { 
  Shield, ArrowRight, Lock, Key, Sparkles, RefreshCw, 
  User, Mail, Terminal, ArrowLeft, LogOut, Globe, CheckCircle2,
  Code2, Layers, ShieldCheck, Fingerprint, ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

interface SSOConsoleStandaloneProps {
  currentUser?: UserData | null;
}

export const SSOConsoleStandalone: React.FC<SSOConsoleStandaloneProps> = ({ currentUser: propUser }) => {
  const branding = useBranding();
  const [user, setUser] = useState<UserData | null>(propUser || null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [showZenoaAuthModal, setShowZenoaAuthModal] = useState(false);

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

    // Check saved theme
    try {
      const savedTheme = localStorage.getItem('zenoa_oauth_theme') || localStorage.getItem('zenoa_theme_mode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme);
      }
    } catch (e) {}

    // Check if there is an active SSO Console session or main Zenoa session stored
    try {
      const storedSSOUser = localStorage.getItem('zenoa_sso_console_user') || localStorage.getItem('zenoa_user');
      if (storedSSOUser) {
        const parsed = JSON.parse(storedSSOUser);
        if (parsed && parsed.username) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setLoading(false);
  }, [propUser]);

  const handleAuthenticatedWithZenoa = async (authenticatedUser: UserData) => {
    try {
      let freshUser = authenticatedUser;
      if (db && authenticatedUser.username) {
        const snap = await getDoc(doc(db, 'users', authenticatedUser.username.toLowerCase()));
        if (snap.exists()) {
          freshUser = { id: snap.id, ...snap.data() } as UserData;
        }
      }

      setUser(freshUser);
      localStorage.setItem('zenoa_sso_console_user', JSON.stringify(freshUser));
    } catch (err) {
      console.error('SSO session setup error:', err);
      setUser(authenticatedUser);
      localStorage.setItem('zenoa_sso_console_user', JSON.stringify(authenticatedUser));
    }
  };

  const handleLogoutSSOConsole = () => {
    try {
      localStorage.removeItem('zenoa_sso_console_user');
    } catch (e) {}
    setUser(null);
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

  // 1. MANDATORY ACCESS GATE (When not authenticated)
  if (!user) {
    const isDark = themeMode === 'dark';
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#0b0f19] text-white selection:bg-indigo-600 selection:text-white' : 'bg-[#f8fafc] text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-600'
      }`}>
        {/* Top Navigation */}
        <header className={`border-b sticky top-0 z-50 backdrop-blur-md ${
          isDark ? 'border-slate-800/80 bg-[#0b0f19]/90' : 'border-slate-200/80 bg-white/90'
        }`}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {(branding.app_name || 'Z').charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight">{branding.app_name || 'Zenoa'}</span>
                <span className="text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60 font-bold">
                  OAuth 2.0 & OIDC
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Messenger</span>
              </a>

              <button
                onClick={() => setShowZenoaAuthModal(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Sign In to Console</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero & Access Gate */}
        <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-6 py-16 text-center w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6 mx-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Single Sign-On (SSO) &bull; Developer Identity Infrastructure</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            OAuth 2.0 & OpenID Connect Console
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            Register third-party client applications, issue Client IDs & Secrets, whitelist authorized callback URIs, and integrate "Continue with {branding.app_name || 'Zenoa'}" authentication into your services.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowZenoaAuthModal(true)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="h-4 w-4" />
              <span>Authenticate with {branding.app_name || 'Zenoa'}</span>
              <ArrowRight className="h-4 w-4 ml-0.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mt-3">
            Authenticate with your active {branding.app_name || 'Zenoa'} developer identity to access the management portal.
          </p>

          {/* Architecture Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Key className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold">RFC 6749 Auth Codes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Standard authorization code flow with secure short-lived auth codes and server-to-server token exchange.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="h-9 w-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold">Strict Redirect Whitelisting</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Prevent token interception with exact protocol, domain, port, and path matching for web & mobile apps.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Code2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold">Interactive Sandbox & SDKs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Step-by-step simulator, embeddable button generator, and multi-language handlers for React, Node, and Python.
              </p>
            </div>
          </div>
        </main>

        {/* Unified "Continue with Zenoa" Modal */}
        <ZenoaAuthGatewayModal
          isOpen={showZenoaAuthModal}
          onClose={() => setShowZenoaAuthModal(false)}
          serviceTitle={`${branding.app_name || 'Zenoa'} OAuth & Identity Console`}
          serviceDescription="Manage OAuth 2.0 client applications, credentials, and allowed callback URIs."
          onAuthenticated={handleAuthenticatedWithZenoa}
          themeMode="light"
        />
      </div>
    );
  }

  // 2. ACTIVE SSO PORTAL VIEW (When authenticated)
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SSOPortal
        themeMode={themeMode}
        currentUser={user}
        onBack={() => {
          handleLogoutSSOConsole();
          window.location.href = '/';
        }}
        onOpenConsentPreview={(clientId, redirectUri) => {
          window.open(`/auth/sso?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`, '_blank');
        }}
      />
    </div>
  );
};
