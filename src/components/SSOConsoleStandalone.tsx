import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { SSOPortal } from './SSOPortal';
import { ZenoaAuthGatewayModal } from './ZenoaAuthGatewayModal';
import { UserData } from '../types';
import { 
  Shield, ArrowRight, Lock, Key, Sparkles, RefreshCw, 
  User, Mail, Terminal, ArrowLeft, LogOut, Globe, CheckCircle2,
  Code2, Layers
} from 'lucide-react';
import { motion } from 'motion/react';

interface SSOConsoleStandaloneProps {
  currentUser?: UserData | null;
}

export const SSOConsoleStandalone: React.FC<SSOConsoleStandaloneProps> = ({ currentUser: propUser }) => {
  const [user, setUser] = useState<UserData | null>(propUser || null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [showZenoaAuthModal, setShowZenoaAuthModal] = useState(false);

  // 2FA Verification State
  const [pendingUser, setPendingUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'landing' | '2fa_verification' | 'portal'>('landing');
  const [devOtpSent, setDevOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [generatedDevOtp, setGeneratedDevOtp] = useState('');
  const [isVerifyingDevOtp, setIsVerifyingDevOtp] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (propUser && propUser.username) {
      setUser(propUser);
      setView('portal');
      try {
        localStorage.setItem('zenoa_sso_console_user', JSON.stringify(propUser));
      } catch (e) {}
      setLoading(false);
      return;
    }

    try {
      const savedTheme = localStorage.getItem('zenoa_theme_mode');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme);
      }
    } catch (e) {}

    try {
      const storedSSOUser = localStorage.getItem('zenoa_sso_console_user');
      if (storedSSOUser) {
        const parsed = JSON.parse(storedSSOUser);
        if (parsed && parsed.username) {
          setUser(parsed);
          setView('portal');
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setLoading(false);
  }, [propUser]);

  const sendZenoaDMOTP = async (targetUser: UserData) => {
    try {
      if (!db) return;
      setIsVerifyingDevOtp(true);
      setError('');
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedDevOtp(otp);

      const botSender = 'sa_zenoa';
      const userIdent = (targetUser.username || targetUser.id || '').toLowerCase().replace(/^@/, '');
      const sortedDm = [userIdent, botSender].sort();
      const chatId = `chat_dm_${sortedDm.join('_')}`;
      const messageId = 'msg_otp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const text = `SECURITY ALERT: SSO CONSOLE LOGIN\n\nYour Zenoa account is attempting to log into the SSO Console.\n\nYour Verification Code is: ${otp}\n\nTime: ${timeStr}\n\nIf this wasn't you, please secure your account immediately.`;

      await doc; // To avoid unused imports if any
      const { setDoc, doc } = require('firebase/firestore');

      // Create/update chat
      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        type: 'dm',
        participants: [userIdent, botSender],
        updatedAt: Date.now(),
        lastMessage: {
          text: `Verification Code: ${otp}`,
          timestamp: Date.now(),
          senderId: botSender
        }
      }, { merge: true });

      // Add message
      await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        id: messageId,
        text: text,
        senderId: botSender,
        timestamp: Date.now(),
        type: 'text'
      });

      setDevOtpSent(true);
      setIsVerifyingDevOtp(false);
    } catch (e) {
      console.error("Failed to send Zenoa DM OTP", e);
      setIsVerifyingDevOtp(false);
      setError("Failed to dispatch Zenoa OTP. Try again.");
    }
  };

  const handleVerifyDevOtp = () => {
    setError('');
    if (devOtpCode !== generatedDevOtp) {
      setError("Invalid 6-digit verification code. Please check your Zenoa DM.");
      return;
    }
    
    // Success
    if (pendingUser) {
      setUser(pendingUser);
      localStorage.setItem('zenoa_sso_console_user', JSON.stringify(pendingUser));
      setView('portal');
      setPendingUser(null);
    }
  };

  const handleAuthenticatedWithZenoa = async (authenticatedUser: UserData) => {
    try {
      let freshUser = authenticatedUser;
      if (db && authenticatedUser.username) {
        const { getDoc, doc } = require('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', authenticatedUser.username.toLowerCase()));
        if (snap.exists()) {
          freshUser = { id: snap.id, ...snap.data() } as UserData;
        }
      }

      setPendingUser(freshUser);
      setView('2fa_verification');
      await sendZenoaDMOTP(freshUser);
    } catch (err) {
      console.error('SSO session setup error:', err);
      setPendingUser(authenticatedUser);
      setView('2fa_verification');
      await sendZenoaDMOTP(authenticatedUser);
    }
  };

  const handleLogoutSSOConsole = () => {
    try {
      localStorage.removeItem('zenoa_sso_console_user');
    } catch (e) {}
    setUser(null);
    setView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-base font-bold">Initializing Zenoa SSO Console...</h2>
        <p className="text-xs text-neutral-400 mt-1">Connecting to OAuth 2.0 Registry</p>
      </div>
    );
  }

  // 1. MANDATORY ACCESS GATE (When not authenticated to SSO Console)
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-sky-600 selection:text-white">
        {/* Top Navigation */}
        <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Zenoa</span>
                <span className="text-[10px] font-mono uppercase bg-neutral-900 text-sky-400 px-2.5 py-0.5 rounded-md border border-neutral-800 font-semibold">SSO Platform</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Zenoa Messenger</span>
              </a>

              {user ? (
                <button
                  onClick={() => setView('portal')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowZenoaAuthModal(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Continue with Zenoa</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Hero & Access Gate */}
        <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-6 py-16 text-center w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-medium mb-6 mx-auto">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            <span>OAuth 2.0 & Identity Management &bull; Mandatory Zenoa Identity</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Single Sign-On & OAuth 2.0 Console
          </h1>

          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
            Create client applications, generate Client IDs and Secrets, configure authorized redirect URIs, and enable "Log in with Zenoa" for third-party web apps.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('portal')}
                  className="px-8 py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-xl shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Enter Console as @{user.username}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLogoutSSOConsole}
                  className="px-4 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-colors cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowZenoaAuthModal(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Lock className="h-4 w-4" />
                <span>Continue with Zenoa</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>

          <p className="text-xs text-neutral-500 mt-4">
            *You must authenticate with your Zenoa Messenger account to manage SSO applications.
          </p>

          {/* Architecture Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-sky-400">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">OAuth 2.0 Authorization Codes</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Standard RFC 6749 authorization code flow with secure short-lived auth codes and server-to-server token exchange.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-sky-400">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Strict Redirect Whitelisting</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Prevent token interception with exact origin matching and granular callback validation for web and mobile apps.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-sky-400">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Interactive SDK & Previews</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Test OAuth consent screens in real-time, generate ready-to-use HTML login buttons, and inspect JWT payload claims.
              </p>
            </div>
          </div>
        </main>

        {/* Unified "Continue with Zenoa" Modal */}
        <ZenoaAuthGatewayModal
          isOpen={showZenoaAuthModal}
          onClose={() => setShowZenoaAuthModal(false)}
          serviceTitle="Zenoa SSO & Identity Console"
          serviceDescription="Register client applications, manage OAuth credentials, and configure permissions."
          onAuthenticated={handleAuthenticatedWithZenoa}
          themeMode="dark"
        />
      </div>
    );
  }

  // 1B. 2FA VERIFICATION STEP
  if (view === '2fa_verification' && pendingUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-600/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6" />
            </div>

            <h2 className="text-xl font-bold text-white">Security Verification</h2>
            <p className="text-xs text-neutral-400 mt-1 mb-6 leading-relaxed">
              To protect the SSO registry, we've sent a 6-digit OTP to your Zenoa DM inbox (<strong>@{pendingUser.username}</strong>) from the official Zenoa Security account.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Enter Verification Code</label>
                <input
                  type="text"
                  value={devOtpCode}
                  onChange={(e) => setDevOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={!devOtpSent || isVerifyingDevOtp}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-sky-500 rounded-xl px-3 py-3.5 text-lg text-white font-mono text-center tracking-[0.5em] transition-colors outline-none disabled:opacity-50"
                />
              </div>

              <button
                onClick={handleVerifyDevOtp}
                disabled={devOtpCode.length !== 6 || isVerifyingDevOtp || !devOtpSent}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingDevOtp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Verify Identity</span>}
              </button>
            </div>
            
            <p className="text-[10px] text-neutral-500 mt-6 flex justify-center items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Zero-Trust Admin Authentication</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. ACTIVE SSO PORTAL VIEW (When authenticated to SSO Console)
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
      {/* Portal Header with Independent Session Badge & Logout */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Zenoa Messenger</span>
          </a>
          <div className="h-4 w-[1px] bg-neutral-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">SSO Management</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/60 text-sky-300 border border-sky-800/50">
              OAuth 2.0 Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <div className="h-6 w-6 rounded-lg bg-sky-500/30 text-sky-400 flex items-center justify-center text-xs font-bold">
              {(user?.username || user?.display_name || 'SSO').slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-neutral-200 block leading-tight">{user?.display_name || user?.username || 'SSO User'}</span>
              <span className="text-[9px] font-mono text-neutral-400">@{user?.username || 'user'}</span>
            </div>
          </div>

          <button
            onClick={handleLogoutSSOConsole}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/40 border border-neutral-700 text-neutral-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Log out of SSO Console"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1">
        <SSOPortal
          themeMode={themeMode}
          currentUser={user}
          onBack={handleLogoutSSOConsole}
          onOpenConsentPreview={(clientId, redirectUri) => {
            window.open(`/auth/sso?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`, '_blank');
          }}
        />
      </div>
    </div>
  );
};
