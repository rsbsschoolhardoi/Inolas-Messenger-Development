import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { SSOPortal } from './SSOPortal';
import { ZenoaAuthGatewayModal } from './ZenoaAuthGatewayModal';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { BrandLogo } from './common/BrandLogo';
import { WaveArcs } from './originkit/ui/wave-arcs';
import { 
  Shield, ArrowRight, Lock, Key, Sparkles, RefreshCw, 
  User, Mail, Terminal, ArrowLeft, LogOut, Globe, CheckCircle2,
  Code2, Layers, ShieldCheck, Fingerprint, ExternalLink, Sun, Moon, Zap
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

              <button
                onClick={() => setShowZenoaAuthModal(true)}
                className="rounded-full px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[13px] font-medium transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Sign In to Console</span>
              </button>
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
            <button
              onClick={() => setShowZenoaAuthModal(true)}
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[14px] font-medium transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" />
              <span>Authenticate with {branding.app_name || 'Zenoa'}</span>
              <ArrowRight className="h-4 w-4 ml-0.5" />
            </button>
            <a
              href="/docs"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white dark:bg-[#121624] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#0d253d] dark:text-white border border-[#e3e8ee] dark:border-[#273951] text-[14px] font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
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
                Standard authorization code flow with secure short-lived auth codes and server-to-server token exchange with PKCE support.
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

        {/* Unified "Continue with Zenoa" Modal */}
        <ZenoaAuthGatewayModal
          isOpen={showZenoaAuthModal}
          onClose={() => setShowZenoaAuthModal(false)}
          serviceTitle={`${branding.app_name || 'Zenoa'} OAuth & Identity Console`}
          serviceDescription="Manage OAuth 2.0 client applications, credentials, and allowed callback URIs."
          onAuthenticated={handleAuthenticatedWithZenoa}
          themeMode={themeMode}
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
