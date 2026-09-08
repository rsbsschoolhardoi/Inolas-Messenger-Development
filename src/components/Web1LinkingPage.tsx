import React, { useState, useEffect, useRef } from 'react';
import { 
  Laptop, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Zap, 
  Copy,
  Check,
  Globe,
  AlertCircle,
  MessageSquare,
  Shield,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';

interface Web1LinkingPageProps {
  onSuccessfulLogin?: (userData: any) => void;
  onNavigateHome?: () => void;
}

export const Web1LinkingPage: React.FC<Web1LinkingPageProps> = ({
  onSuccessfulLogin,
  onNavigateHome
}) => {
  // Navigation View: 'landing' (beautiful initial welcome) or 'pairing' (QR & code scanner flow)
  const [viewMode, setViewMode] = useState<'landing' | 'pairing'>('landing');

  // Session state
  const [sessionId, setSessionId] = useState<string>('');
  const [authCode, setAuthCode] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [sessionStatus, setSessionStatus] = useState<
    'loading' | 'pending_scan' | 'scanned' | 'syncing' | 'authenticated' | 'expired' | 'error'
  >('loading');
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes TTL
  const [linkedUser, setLinkedUser] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStatusText, setSyncStatusText] = useState<string>('Establishing secure P2P pipeline...');
  const pollTimerRef = useRef<any>(null);

  // Initialize fresh QR Link Session
  const initSession = async () => {
    setSessionStatus('loading');
    setSyncProgress(0);
    setAuthCode('');
    try {
      const res = await fetch('/api/v1/link-device/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: navigator.userAgent || 'Web Browser',
          os: navigator.platform || 'Desktop'
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize session');
      }

      setSessionId(data.sessionId);
      setCountdown(600);

      // Generate visual high-resolution QR code
      const qrImage = await QRCode.toDataURL(data.qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setQrDataUrl(qrImage);
      setSessionStatus('pending_scan');
    } catch (err: any) {
      console.error('Session creation error:', err);
      setSessionStatus('error');
    }
  };

  const handleStartPairing = () => {
    setViewMode('pairing');
    initSession();
  };

  // Poll Session Status
  useEffect(() => {
    if (viewMode !== 'pairing' || !sessionId || sessionStatus === 'authenticated' || sessionStatus === 'expired' || sessionStatus === 'error') {
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/link-device/session/${sessionId}`);
        const data = await res.json();

        if (data.success && data.session) {
          const status = data.session.status;
          
          // When phone scans QR, server status transitions to 'scanned' and unlocks the authCode
          if (status === 'scanned') {
            if (sessionStatus !== 'scanned') {
              setSessionStatus('scanned');
            }
            if (data.session.authCode && !authCode) {
              setAuthCode(data.session.authCode);
            }
          } else if (status === 'authenticated') {
            setSessionStatus('syncing');
            setLinkedUser(data.session.linkedUser);
            if (data.session.authCode) {
              setAuthCode(data.session.authCode);
            }

            // High-fidelity P2P stream animation
            setSyncStatusText('Decrypting local vault & encryption keys...');
            setSyncProgress(35);
            setTimeout(() => {
              setSyncStatusText('Syncing local messages, chats & profile...');
              setSyncProgress(75);
            }, 500);

            setTimeout(() => {
              setSyncStatusText('Zero-Cloud Sync Complete! Launching...');
              setSyncProgress(100);
              setSessionStatus('authenticated');
              clearInterval(pollTimerRef.current);

              // Notify parent of authenticated user
              if (onSuccessfulLogin) {
                setTimeout(() => {
                  onSuccessfulLogin({
                    ...data.session.linkedUser,
                    sessionId: data.session.sessionId || sessionId
                  });
                }, 800);
              }
            }, 1200);
          } else if (status === 'expired') {
            setSessionStatus('expired');
            clearInterval(pollTimerRef.current);
          }
        }
      } catch (err) {
        console.warn('Session polling note:', err);
      }
    }, 1500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [viewMode, sessionId, sessionStatus, authCode, onSuccessfulLogin]);

  // TTL Countdown timer
  useEffect(() => {
    if (viewMode !== 'pairing' || sessionStatus === 'authenticated' || sessionStatus === 'expired') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setSessionStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [viewMode, sessionStatus]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyCode = () => {
    if (authCode) {
      navigator.clipboard.writeText(authCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">Zenoa Web</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-400 uppercase">
                Zero-Cloud Companion
              </span>
            </div>
            <p className="text-xs text-slate-400">Direct P2P Encrypted Device Synchronization</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>

          {onNavigateHome && (
            <button
              id="web1-back-home-btn"
              onClick={onNavigateHome}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Back to App
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <AnimatePresence mode="wait">
          {viewMode === 'landing' ? (
            /* 1. ELEGANT, BEAUTIFUL LANDING SCREEN */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 py-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Next-Gen Private Web Messenger</span>
              </div>

              {/* Central Hero Heading */}
              <div className="space-y-4 max-w-xl">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Seamlessly chat from any <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">computer screen</span>.
                </h1>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Link your web browser directly to your phone. No passwords to remember, no central servers storing your messages — just pure, private peer-to-peer communication.
                </p>
              </div>

              {/* Primary Call to Action Button in Exact Center */}
              <div className="pt-2 flex flex-col items-center space-y-3">
                <button
                  id="web1-get-started-btn"
                  onClick={handleStartPairing}
                  className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <QrCode className="h-5 w-5 text-indigo-200" />
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-xs text-slate-500">Scan QR code using Inolas / Zenoa on your phone</span>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4 text-left">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Zero Cloud Storage</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Direct P2P device synchronization. Your data stays locally encrypted on your devices.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Single-Use Security</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pairing codes burn immediately after single authentication. Zero reusable token leaks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Full Messenger Suite</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enjoy high-speed typing, media sharing, audio calls, and contacts seamlessly on web.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* 2. DYNAMIC PAIRING SCREEN (QR CODE & AFTER-SCAN ALPHANUMERIC CODE) */
            <motion.div
              key="pairing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Left Side: QR Code & Conditional Sliding Code */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950/70">
                
                {sessionStatus === 'loading' && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                        <RefreshCw className="h-7 w-7 text-indigo-400 animate-spin" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-300">Generating secure pairing handshake...</p>
                    <p className="text-xs text-slate-500">Creating temporary cryptographic tunnel</p>
                  </div>
                )}

                {(sessionStatus === 'pending_scan' || sessionStatus === 'scanned') && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center space-y-5 w-full"
                  >
                    {/* Minimal, Friendly Animated Guide: Shows phone approaching to scan */}
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
                      <motion.div
                        animate={{ x: [-3, 3, -3], rotate: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                        className="text-indigo-400"
                      >
                        <Smartphone className="h-4 w-4" />
                      </motion.div>
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <QrCode className="h-4 w-4 text-emerald-400" />
                      <span className="text-[11px] font-medium text-slate-400">
                        {sessionStatus === 'scanned' ? 'QR Code Verified' : 'Scan with your mobile camera'}
                      </span>
                    </div>

                    {/* High-Resolution QR Container */}
                    <div className="relative p-3 bg-white rounded-2xl shadow-2xl border-4 border-slate-800">
                      {qrDataUrl && (
                        <img 
                          src={qrDataUrl} 
                          alt="Zenoa Web Login QR Code" 
                          className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                        />
                      )}

                      {/* Scanned Feedback Overlay */}
                      {sessionStatus === 'scanned' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4 text-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                          </div>
                          <p className="text-sm font-bold text-white">QR Code Scanned!</p>
                          <p className="text-xs text-slate-300 mt-1 max-w-[200px]">
                            Enter the 7-character code shown below on your phone now.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* ALPHANUMERIC CODE SECTION */}
                    {/* CRITICAL: Never visible before scan. Only slides in smoothly from below after scan! */}
                    <AnimatePresence>
                      {sessionStatus === 'scanned' && authCode ? (
                        <motion.div
                          key="scanned-code-box"
                          initial={{ opacity: 0, y: 20, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: 15, height: 0 }}
                          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                          className="w-full max-w-xs bg-slate-950 border border-indigo-500/50 rounded-xl p-3.5 flex flex-col items-center space-y-1.5 shadow-lg shadow-indigo-500/10"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                            <KeyRound className="h-3 w-3" />
                            <span>Your Single-Use Verification Code</span>
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-400 drop-shadow-md">
                              {authCode}
                            </span>
                            <button
                              id="copy-auth-code-btn"
                              onClick={handleCopyCode}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400 text-center">
                            Type this code into your mobile prompt to authorize login.
                          </p>
                        </motion.div>
                      ) : (
                        <div className="w-full max-w-xs py-2 px-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                            <Lock className="h-3 w-3 text-slate-500" />
                            <span>Code will securely reveal after phone scan</span>
                          </p>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Expiry Countdown */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />
                      <span>Code expires in <strong className="text-indigo-400 font-mono">{formatTime(countdown)}</strong></span>
                      <button
                        onClick={initSession}
                        className="text-indigo-400 hover:underline cursor-pointer ml-1 font-medium"
                      >
                        Refresh
                      </button>
                    </div>
                  </motion.div>
                )}

                {sessionStatus === 'syncing' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 px-4 space-y-5 w-full text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-indigo-400 animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">Direct P2P Data Transfer</h3>
                      <p className="text-xs text-slate-400 mt-1">{syncStatusText}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-xs bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2.5 transition-all duration-500 rounded-full"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>

                    <span className="text-xs font-mono font-bold text-indigo-400">{syncProgress}%</span>
                  </motion.div>
                )}

                {sessionStatus === 'authenticated' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 px-4 space-y-4 w-full text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">Device Linked Successfully!</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Welcome back, <strong className="text-emerald-400">@{linkedUser?.username}</strong>
                      </p>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
                      Zenoa ID: {linkedUser?.zenoaId || `${linkedUser?.username}@zenoa`}
                    </div>

                    <p className="text-xs text-slate-400 animate-pulse">Launching Web Interface...</p>
                  </motion.div>
                )}

                {sessionStatus === 'expired' && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-400" />
                    <h3 className="text-base font-bold text-white">QR Code Expired</h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      For your privacy and security, QR codes expire every 10 minutes. Click below to generate a new key.
                    </p>
                    <button
                      onClick={initSession}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                    >
                      Generate New QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Step-by-Step Instructions & Security Info */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      Link in 3 Quick Steps
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Use Inolas / Zenoa on your phone to authorize this browser session securely.
                    </p>
                  </div>

                  {/* Numbered Steps */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Open Inolas on your phone</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tap your avatar / <strong>Settings</strong> &gt; Select <strong>Linked Devices</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Scan this QR Code</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tap <strong>"Link a Device"</strong> on mobile and point the camera at this screen.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">Enter the Single-Use Key</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Once scanned, your 7-character code will appear below the QR. Enter it into your phone to confirm.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Single-Use Security Guarantee */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Single-Use & Zero-Cloud Security</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Every code is unique and immediately consumed after login. It can never be reused. Messages and keys remain private to you.
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Back to Landing Option */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <button
                    onClick={() => setViewMode('landing')}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    &larr; Back to Welcome
                  </button>
                  <span>AES-256-GCM Handshake</span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
