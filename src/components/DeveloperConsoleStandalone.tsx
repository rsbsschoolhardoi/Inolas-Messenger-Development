import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DeveloperPortal } from './DeveloperPortal';
import { ZenoaAuthGatewayModal } from './ZenoaAuthGatewayModal';
import { UserData } from '../types';
import { useBranding } from '../brandingUtils';
import { 
  Terminal, Lock, Phone, User, ArrowRight, ShieldCheck, Zap, 
  CheckCircle2, Key, Code2, Server, Globe, ExternalLink, RefreshCw, 
  ArrowLeft, Sparkles, Check, Mail, Shield, LogOut, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ConsoleView = 'landing' | 'mobile_setup' | '2fa_verification' | 'portal';

export const DeveloperConsoleStandalone: React.FC = () => {
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo || branding.oauth_logo;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ConsoleView>('landing');
  const [showZenoaAuthModal, setShowZenoaAuthModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserData | null>(null);

  // 2FA Verification State
  const [devOtpSent, setDevOtpSent] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [generatedDevOtp, setGeneratedDevOtp] = useState('');
  const [isVerifyingDevOtp, setIsVerifyingDevOtp] = useState(false);

  // Mobile / Phone Verification State (for Developer API compliance)
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOTP, setDemoOTP] = useState('');

  const fetchFullUserProfile = async (searchIdent: string, uid?: string): Promise<UserData | null> => {
    if (!db) return null;
    try {
      if (uid) {
        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists() && uidSnap.data()?.username) {
          return { id: uidSnap.id, ...uidSnap.data() } as UserData;
        }
      }

      const clean = searchIdent.trim().toLowerCase();
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

      if (clean.includes('@')) {
        const eq = query(usersRef, where('email', '==', clean));
        const eSnap = await getDocs(eq);
        if (!eSnap.empty) {
          return { id: eSnap.docs[0].id, ...eSnap.docs[0].data() } as UserData;
        }
      }
    } catch (err) {
      console.warn('Developer console user fetch error:', err);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Listen for active Firebase Auth session from Zenoa Messenger
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;
        if (fbUser) {
          const profile = await fetchFullUserProfile(fbUser.email || fbUser.uid, fbUser.uid);
          if (profile && isMounted) {
            setUser(profile);
            localStorage.setItem('zenoa_dev_console_user', JSON.stringify(profile));
            setView('portal');
            setLoading(false);
            return;
          }
        }
        
        // 2. If no active Firebase user, check cached session
        try {
          const storedDevUser = localStorage.getItem('zenoa_dev_console_user');
          if (storedDevUser) {
            const parsed = JSON.parse(storedDevUser);
            if (parsed && parsed.username && isMounted) {
              setUser(parsed);
              setView('portal');
              setLoading(false);
              return;
            }
          }

          const savedAccounts = localStorage.getItem('zenoa_saved_browser_accounts');
          if (savedAccounts) {
            const list = JSON.parse(savedAccounts);
            if (Array.isArray(list) && list.length > 0 && list[0]?.username && isMounted) {
              setUser(list[0]);
              setView('portal');
              setLoading(false);
              return;
            }
          }
        } catch (e) {}

        if (isMounted) setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
      const text = `SECURITY ALERT: DEVELOPER CONSOLE LOGIN\n\nYour Zenoa account is attempting to log into the Developer Console.\n\nYour Verification Code is: ${otp}\n\nTime: ${timeStr}\n\nIf this wasn't you, please secure your account immediately.`;

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
      localStorage.setItem('zenoa_dev_console_user', JSON.stringify(pendingUser));
      if (pendingUser.is_truecaller_verified || pendingUser.mobile_number) {
        setView('portal');
      } else {
        setView('mobile_setup');
      }
      setPendingUser(null);
    }
  };

  const handleAuthenticatedWithZenoa = async (authenticatedUser: UserData) => {
    try {
      const fresh = await fetchFullUserProfile(authenticatedUser.username, authenticatedUser.id);
      const userToUse = fresh || authenticatedUser;

      setPendingUser(userToUse);
      setView('2fa_verification');
      await sendZenoaDMOTP(userToUse);
    } catch (err) {
      console.error('Developer session setup error:', err);
      setPendingUser(authenticatedUser);
      setView('2fa_verification');
      await sendZenoaDMOTP(authenticatedUser);
    }
  };

  const handleLogoutDeveloperConsole = () => {
    try {
      localStorage.removeItem('zenoa_dev_console_user');
    } catch (e) {}
    setUser(null);
    setView('landing');
  };

  const handleSendVerificationOTP = async () => {
    setError('');
    const cleanDigits = mobileNumber.replace(/[^0-9]/g, '').trim();
    if (!cleanDigits || cleanDigits.length < 8 || cleanDigits.length > 15) {
      setError('Please enter a valid mobile number (at least 8 digits).');
      return;
    }
    setIsVerifying(true);
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoOTP(generatedCode);

    try {
      // Send real OTP dispatch if backend available
      const formattedMobile = `${countryCode}${cleanDigits}`;
      await fetch('/api/v1/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: formattedMobile,
          custom_code: generatedCode,
          template_type: 'security_code'
        })
      }).catch(() => {});
    } catch (e) {}

    setIsVerifying(false);
    setOtpSent(true);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otpCode !== demoOTP) {
      setError('Invalid verification code. Please check the OTP code sent.');
      return;
    }
    setIsVerifying(true);
    const formattedMobile = `${countryCode}${mobileNumber.replace(/[^0-9]/g, '').trim()}`;
    try {
      if (user && db) {
        const primaryZenoaId = user.id || (user as any).uid || user.username.toLowerCase();
        const phonePayload = {
          id: primaryZenoaId,
          zenoa_id: user.zenoa_id || primaryZenoaId,
          username: user.username.toLowerCase(),
          mobile_number: formattedMobile,
          phone_number: formattedMobile,
          is_business_verified: true,
          is_truecaller_verified: true,
          phone_verified_at: Date.now(),
          updated_at: Date.now()
        };

        if (primaryZenoaId) {
          await setDoc(doc(db, 'users', primaryZenoaId), phonePayload, { merge: true });
        }
      }

      const updatedUser: UserData = {
        ...user!,
        mobile_number: formattedMobile,
        is_business_verified: true,
        is_truecaller_verified: true
      };

      setUser(updatedUser);
      localStorage.setItem('zenoa_dev_console_user', JSON.stringify(updatedUser));

      // Sync browser saved accounts
      try {
        const savedAccounts = localStorage.getItem('zenoa_saved_browser_accounts');
        if (savedAccounts) {
          const list = JSON.parse(savedAccounts);
          const updatedList = list.map((acc: any) => {
            if (acc.username === user?.username || acc.id === user?.id) {
              return { ...acc, mobile_number: formattedMobile, phone_number: formattedMobile, is_truecaller_verified: true };
            }
            return acc;
          });
          localStorage.setItem('zenoa_saved_browser_accounts', JSON.stringify(updatedList));
        }
      } catch (e) {}

      setView('portal');
    } catch (err: any) {
      setError('Activation failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Loading Developer Console...</p>
        </div>
      </div>
    );
  }

  // 1. LANDING & ACCESS GATE VIEW
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
        {/* Top Navigation */}
        <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-violet-400 overflow-hidden p-1">
                {activeLogo ? (
                  <img src={activeLogo} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Terminal className="h-4 w-4" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">{branding.app_name || 'Zenoa'}</span>
                <span className="text-[10px] font-mono uppercase bg-neutral-900 text-violet-300 px-2.5 py-0.5 rounded-md border border-neutral-800 font-semibold">Developer Console</span>
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
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowZenoaAuthModal(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Continue with Zenoa</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col">
          <section className="max-w-4xl mx-auto px-6 pt-20 pb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-6">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>Independent Developer Ecosystem &bull; Mandatory Zenoa Identity</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Build Bots, APIs & Webhooks on Zenoa
            </h1>

            <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
              Create verified transactional Service Accounts, generate production API tokens, and receive real-time webhook event dispatches with your Zenoa account.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView('portal')}
                    className="px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-xl shadow-violet-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Enter Console as @{user.username}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleLogoutDeveloperConsole}
                    className="px-4 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-colors cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowZenoaAuthModal(true)}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Lock className="h-4 w-4" />
                  <span>Continue with Zenoa</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-500 mt-4">
              *A verified Zenoa Messenger account is mandatory to provision developer API tokens.
            </p>
          </section>

          {/* Architecture Feature Grid */}
          <section className="max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 text-left space-y-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-violet-400">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Direct OTP Dispatch API</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Deliver verified 6-digit authentication codes directly to Zenoa Messenger users with zero SMS latency and end-to-end security.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 text-left space-y-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-violet-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Real-Time Webhooks</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Stream incoming bot interactions, message deliveries, and OAuth login authorization events to your server endpoints.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 text-left space-y-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-violet-400">
                  <Key className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">HMAC Signed Tokens</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Rotate API keys, restrict authorized IP addresses, and secure your bot infrastructure with cryptographic signatures.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Unified "Continue with Zenoa" Modal */}
        <ZenoaAuthGatewayModal
          isOpen={showZenoaAuthModal}
          onClose={() => setShowZenoaAuthModal(false)}
          serviceTitle="Zenoa Developer Console"
          serviceDescription="Manage developer applications, bots, and API credentials."
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
          {/* Subtle glow effect */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-600/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h2 className="text-xl font-bold text-white">Security Verification</h2>
            <p className="text-xs text-neutral-400 mt-1 mb-6 leading-relaxed">
              To protect developer credentials, we've sent a 6-digit OTP to your Zenoa DM inbox (<strong>@{pendingUser.username}</strong>) from the official Zenoa Security account.
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
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-violet-500 rounded-xl px-3 py-3.5 text-lg text-white font-mono text-center tracking-[0.5em] transition-colors outline-none disabled:opacity-50"
                />
              </div>

              <button
                onClick={handleVerifyDevOtp}
                disabled={devOtpCode.length !== 6 || isVerifyingDevOtp || !devOtpSent}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingDevOtp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Verify Identity</span>}
              </button>
            </div>
            
            <p className="text-[10px] text-neutral-500 mt-6 flex justify-center items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Zero-Trust Developer Authentication</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. PHONE VERIFICATION COMPLIANCE STEP (If needed for developer credentials)
  if (view === 'mobile_setup' && user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center"
        >
          <div className="h-12 w-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto mb-4">
            <Phone className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-bold text-white">Developer Identity Verification</h2>
          <p className="text-xs text-neutral-400 mt-1 mb-6">
            Link a verified contact number to activate bot dispatch and webhook capabilities for <strong>@{user.username}</strong>.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {!otpSent ? (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Mobile Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-20 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white text-center font-mono"
                  />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="9876543210"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSendVerificationOTP}
                disabled={isVerifying}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Send Verification Code</span>}
              </button>

              <button
                onClick={() => setView('portal')}
                className="w-full py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Skip for now & Continue to Portal
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                <span className="text-[11px] text-neutral-400">Demo Verification Code:</span>
                <span className="text-sm font-mono font-bold text-violet-400 block mt-0.5">{demoOTP}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Enter 6-Digit Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono text-center tracking-widest text-base"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={isVerifying}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Verify & Access Portal</span>}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // 3. FULL DEVELOPER PORTAL VIEW
  if (view === 'portal' && user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
        {/* Portal Header with Independent Session Badge & Logout */}
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('landing')}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Console Home</span>
            </button>
            <div className="h-4 w-[1px] bg-neutral-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Developer Suite</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-950/60 text-violet-300 border border-violet-800/50">
                Live Environment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
              <div className="h-6 w-6 rounded-lg bg-violet-600/30 text-violet-400 flex items-center justify-center text-xs font-bold">
                {(user?.username || user?.display_name || 'DEV').slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-neutral-200 block leading-tight">{user?.display_name || user?.username || 'Developer'}</span>
                <span className="text-[9px] font-mono text-neutral-400">@{user?.username || 'developer'}</span>
              </div>
            </div>

            <button
              onClick={handleLogoutDeveloperConsole}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/40 border border-neutral-700 text-neutral-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Log out of Developer Console"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <DeveloperPortal
            currentUser={user}
            onBack={() => setView('landing')}
          />
        </div>
      </div>
    );
  }

  return null;
};
