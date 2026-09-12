import React, { useState, useEffect, useRef } from 'react';
import { 
  Laptop, 
  Smartphone, 
  QrCode, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Copy,
  Check,
  Globe,
  KeyRound,
  ShieldCheck,
  LogIn,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { getDeviceDetails, getDeviceLocation, getDeviceId } from '../utils/deviceIdentity';

interface WebLinkingPageProps {
  onSuccessfulLogin?: (userData: any) => void;
  onNavigateHome?: () => void;
  onSwitchToDirectLogin?: () => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const WebLinkingPage: React.FC<WebLinkingPageProps> = ({
  onSuccessfulLogin,
  onNavigateHome,
  onSwitchToDirectLogin,
  themeMode = 'light',
  onToggleTheme
}) => {
  // Session & QR state
  const [sessionId, setSessionId] = useState<string>('');
  const [authCode, setAuthCode] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [sessionStatus, setSessionStatus] = useState<
    'loading' | 'pending_scan' | 'scanned' | 'syncing' | 'authenticated' | 'expired' | 'error'
  >('loading');
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes TTL
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStatusText, setSyncStatusText] = useState<string>('Establishing zero-cloud encrypted handshake...');

  // Big screen desktop detection (>= 1024px)
  const [isBigScreenDesktop, setIsBigScreenDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsBigScreenDesktop(window.innerWidth >= 1024);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const pollTimerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render QR helper to canvas and data URL
  const renderQRCode = async (payload: string) => {
    try {
      // 1. High-resolution Data URL for <img>
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      setQrDataUrl(dataUrl);

      // 2. Direct Canvas Rendering as fail-safe
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, payload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        });
      }
    } catch (err) {
      console.error('QR rendering error:', err);
    }
  };

  // Initialize fresh QR Link Session immediately
  const initSession = async () => {
    setSessionStatus('loading');
    setSyncProgress(0);
    setAuthCode('');
    
    // Immediate optimistic client-side QR generation to guarantee instantaneous rendering
    const fallbackId = 'dlink_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const optimisticPayload = JSON.stringify({
      protocol: 'zenoa_link_v1',
      sessionId: fallbackId,
      createdAt: Date.now()
    });
    setSessionId(fallbackId);
    setCountdown(600);
    await renderQRCode(optimisticPayload);

    try {
      const devDetails = getDeviceDetails();
      const devLocation = getDeviceLocation();
      const devId = getDeviceId();

      const res = await fetch('/api/v1/link-device/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSessionId: fallbackId,
          browser: devDetails.browser,
          os: devDetails.os,
          deviceType: devDetails.deviceType,
          deviceName: devDetails.deviceName,
          location: devLocation,
          deviceId: devId
        })
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}

      if (data.success && data.sessionId && data.qrPayload) {
        setSessionId(data.sessionId);
        await renderQRCode(data.qrPayload);
        setSessionStatus('pending_scan');
      } else {
        // Optimistic session remains active
        setSessionStatus('pending_scan');
      }
    } catch (err: any) {
      console.warn('Session API notice (using fallback local session):', err);
      setSessionStatus('pending_scan');
    }
  };

  // Launch session on initial mount
  useEffect(() => {
    initSession();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll Session Status
  useEffect(() => {
    if (!sessionId || sessionStatus === 'authenticated' || sessionStatus === 'expired' || sessionStatus === 'error') {
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/link-device/session/${sessionId}`);
        const text = await res.text();
        let data: any = {};
        try { data = JSON.parse(text); } catch {}

        if (data.success && data.session) {
          const status = data.session.status;
          
          if (status === 'scanned') {
            if (sessionStatus !== 'scanned') {
              setSessionStatus('scanned');
            }
            if (data.session.authCode && !authCode) {
              setAuthCode(data.session.authCode);
            }
          } else if (status === 'authenticated') {
            setSessionStatus('syncing');
            if (data.session.authCode) {
              setAuthCode(data.session.authCode);
            }

            // Sync animation
            setSyncStatusText('Decrypting vault with sovereign key...');
            setSyncProgress(40);
            setTimeout(() => {
              setSyncStatusText('Syncing active messages, contacts & chats...');
              setSyncProgress(80);
            }, 600);

            setTimeout(() => {
              setSyncStatusText('Sync Complete! Launching Zenoa Web...');
              setSyncProgress(100);
              setSessionStatus('authenticated');
              clearInterval(pollTimerRef.current);

              if (onSuccessfulLogin && data.session.linkedUser) {
                onSuccessfulLogin({
                  ...data.session.linkedUser,
                  sessionId
                });
              }
            }, 1200);
          } else if (status === 'expired') {
            setSessionStatus('expired');
            clearInterval(pollTimerRef.current);
          }
        }
      } catch (err) {
        // Silent polling error handling
      }
    }, 1500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [sessionId, sessionStatus, authCode, onSuccessfulLogin]);

  // Countdown timer
  useEffect(() => {
    if (sessionStatus === 'authenticated' || sessionStatus === 'expired') return;
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
  }, [sessionStatus]);

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

  // On Mobile / Non-Big Desktop Screens (< 1024px), render Read-Only Zenoa Messenger Showcase
  if (!isBigScreenDesktop) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
        {/* Top Header */}
        <header className="w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-xl">
              Z
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block">
                Zenoa Messenger
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle theme"
              >
                {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </header>

        {/* Read-Only Mobile Showcase Body */}
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-4xl w-full mx-auto p-5 sm:p-8 flex flex-col justify-center space-y-8 focus:outline-none">
          
          {/* Hero Header */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sovereign Security Platform</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Privately Connect <br className="hidden sm:inline"/> Across The Globe
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Zenoa Messenger is built with zero-trust cryptographic architecture, delivering instant messages, HD audio/video calls, and secure cloud storage without tracking or ad monitoring.
            </p>
          </div>

          {/* Core Messenger Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">End-to-End Encryption</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your conversations are sealed with sovereign cryptographic keys. Nobody—not even Zenoa servers—can read your messages or access your media.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Ultra-Fast Realtime Messaging</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Engineered with high-throughput WebSocket sockets for zero-latency delivery, instant typing status, and real-time read receipts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Cross-Platform Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stay connected on mobile and desktop devices smoothly with real-time state synchronization and encrypted offline history.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Business Gateway APIs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrate automated service accounts and developer webhooks safely through Zenoa Gateway authentication protocols.
              </p>
            </div>

          </div>

          {/* Action Callout Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-extrabold text-white">Ready to start chatting?</h4>
              <p className="text-xs text-slate-300">
                Sign in or register directly to use Zenoa Messenger on mobile devices.
              </p>
            </div>

          </div>

        </main>

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
          <p>Zenoa Messenger • End-to-End Encrypted Communication Platform</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-white block">
              Zenoa Web
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* System Theme Toggle if available */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Container - WhatsApp Web Style Card */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 z-10 focus:outline-none">
        <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/90 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
          
          {/* Left Column: Instructions (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>End-to-End Encrypted Session</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                  Use Zenoa on your computer
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Follow these simple steps to link your phone account to this browser:
                </p>
              </div>

              {/* Numbered Steps */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Open Zenoa / Inolas on your phone
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Make sure your app is running on your primary device.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Tap Settings or Menu and choose Linked Devices
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Tap <strong>Link a Device</strong> to activate your camera scanner.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Point your phone to this screen to capture the code
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      The QR code verifies instantly and syncs your encrypted messages.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Live QR Code (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-950/40 text-center">
            
            {/* Syncing Overlay State */}
            {sessionStatus === 'syncing' ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 w-full">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">Connecting Web Session</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{syncStatusText}</p>
                </div>
                <div className="w-full max-w-xs h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-5 w-full">
                
                {/* QR Code Container - Always clean white box for maximum camera contrast */}
                <div className="relative p-3.5 bg-white rounded-2xl shadow-lg border-2 border-neutral-200 dark:border-neutral-700">
                  {/* Canvas Render */}
                  <canvas 
                    ref={canvasRef} 
                    className={`w-52 h-52 sm:w-60 sm:h-60 rounded-xl ${qrDataUrl ? 'hidden' : 'block'}`}
                  />

                  {/* Fallback Image Render */}
                  {qrDataUrl && (
                    <img 
                      src={qrDataUrl} 
                      alt="Zenoa Web Login QR Code"
                      className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl select-none"
                    />
                  )}

                  {/* Scanned Feedback Overlay */}
                  {sessionStatus === 'scanned' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                      <p className="text-sm font-bold">QR Code Scanned!</p>
                      <p className="text-xs text-neutral-300 mt-1 max-w-[200px]">
                        Enter the verification code shown below on your phone.
                      </p>
                    </motion.div>
                  )}

                  {/* Expired Feedback Overlay */}
                  {sessionStatus === 'expired' && (
                    <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white">
                      <p className="text-sm font-bold text-neutral-200">QR Code Expired</p>
                      <button
                        onClick={initSession}
                        className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Click to reload QR code</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Scanned 7-Digit Verification Code Reveal */}
                <AnimatePresence>
                  {sessionStatus === 'scanned' && authCode ? (
                    <motion.div
                      key="scanned-code-box"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="w-full max-w-xs bg-neutral-900 text-white border border-indigo-500/50 rounded-2xl p-3.5 flex flex-col items-center space-y-1.5 shadow-md"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <KeyRound className="h-3 w-3" />
                        <span>Confirmation Code</span>
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-400">
                          {authCode}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      <p className="text-[11px] text-neutral-400 text-center">
                        Type this code on your phone prompt to authorize.
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Expiry Countdown & Refresh */}
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <RefreshCw className={`h-3 w-3 text-neutral-400 ${sessionStatus === 'loading' ? 'animate-spin' : ''}`} />
                  <span>
                    Code expires in <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{formatTime(countdown)}</strong>
                  </span>
                  <button
                    onClick={initSession}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1 font-semibold"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-200/60 dark:border-neutral-800/60">
        <p>Inolas / Zenoa Web • Peer-to-Peer Encrypted Communication</p>
      </footer>
    </div>
  );
};
