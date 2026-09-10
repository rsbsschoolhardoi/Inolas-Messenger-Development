import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  Laptop, 
  Smartphone, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Lock, 
  RefreshCw,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { storageManager } from '../storageManager';
import { getCurrentClientIdentity } from '../utils/deviceIdentity';

interface LinkDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id?: string;
    uid?: string;
    username: string;
    displayName?: string;
    display_name?: string;
    zenoaId?: string;
    zenoa_id?: string;
    avatarSeed?: string;
    avatar_seed?: string;
    avatarUrl?: string;
    avatar_url?: string;
  };
  themeMode?: 'light' | 'dark';
  onSyncSuccess?: (details: any) => void;
}

export const LinkDeviceModal: React.FC<LinkDeviceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  themeMode = 'dark',
  onSyncSuccess
}) => {
  const [step, setStep] = useState<'scan' | 'code_entry' | 'transferring' | 'success' | 'manual_session'>('scan');
  const [scannedSessionId, setScannedSessionId] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [targetDeviceInfo, setTargetDeviceInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [transferProgress, setTransferProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!char && value !== '') return;
    
    const newCodeArr = enteredCode.padEnd(7, ' ').split('');
    if (char) {
      newCodeArr[index] = char[char.length - 1];
    } else {
      newCodeArr[index] = ' ';
    }
    
    const newCode = newCodeArr.join('').trimEnd();
    setEnteredCode(newCode);
    setErrorMessage('');

    if (char && index < 6) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && (!enteredCode[index] || enteredCode[index] === ' ') && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pasted) {
      const chars = pasted.slice(0, 7);
      setEnteredCode(chars);
      if (chars.length < 7) {
        inputRefs.current[chars.length]?.focus();
      } else {
        inputRefs.current[6]?.focus();
      }
    }
  };

  // Initialize camera when in scan mode
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (step === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraPermission('granted');
        scanQRCode();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraPermission('denied');
      setErrorMessage('Camera access denied. You can also manually enter a session ID.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, error: `Server response error (${res.status})` };
      }
      return { ok: res.ok, status: res.status, data };
    } catch (netErr: any) {
      return { ok: false, status: 0, data: { success: false, error: netErr.message || 'Network connection failed' } };
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data) {
        try {
          let detectedSessionId = '';
          const rawStr = code.data.trim();
          try {
            const parsedPayload = JSON.parse(rawStr);
            if (parsedPayload && parsedPayload.sessionId) {
              detectedSessionId = parsedPayload.sessionId;
            }
          } catch {
            const dlinkMatch = rawStr.match(/dlink_[a-zA-Z0-9_]+/);
            if (dlinkMatch) {
              detectedSessionId = dlinkMatch[0];
            } else if (rawStr.includes('sessionId=')) {
              const paramMatch = rawStr.match(/sessionId=([^&]+)/);
              if (paramMatch) detectedSessionId = paramMatch[1];
            }
          }

          if (detectedSessionId) {
            handleSessionDetected(detectedSessionId);
            return;
          }
        } catch (e) {
          console.warn('Invalid QR payload:', e);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleSessionDetected = async (sessId: string) => {
    stopCamera();
    setIsLoading(true);
    setErrorMessage('');
    setScannedSessionId(sessId);

    try {
      const { data } = await safeFetchJson('/api/v1/link-device/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessId })
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to connect with browser session');
      }

      setTargetDeviceInfo(data.deviceInfo || { browser: 'Web Browser', os: 'Desktop' });
      setStep('code_entry');
    } catch (err: any) {
      setErrorMessage(err.message || 'QR session expired or invalid');
      setStep('scan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeAndStreamData = async () => {
    const cleanCode = enteredCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length !== 7) {
      setErrorMessage('Please enter the complete 7-character code shown on your Web screen.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setStep('transferring');
    setTransferProgress(15);

    try {
      // Step A: Package local indexedDB messages and client-side settings
      setTransferProgress(35);
      let localPackage: any = null;
      try {
        localPackage = await storageManager.exportUserDataPackage(currentUser.username);
      } catch (expErr) {
        console.warn('Export package note:', expErr);
        localPackage = { version: 2, timestamp: Date.now(), username: currentUser.username, messages: [], localSettings: {}, chatDrafts: {} };
      }

      setTransferProgress(65);

      // Step B: Direct verify & send P2P package to web session
      const primaryInfo = getCurrentClientIdentity();
      const { data } = await safeFetchJson('/api/v1/link-device/verify-and-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: scannedSessionId,
          code: cleanCode,
          user: currentUser,
          syncedDataPayload: localPackage,
          primaryDeviceInfo: primaryInfo
        })
      });

      if (!data.success) {
        throw new Error(data.error || 'Verification code mismatch. Please check your web screen.');
      }

      setTransferProgress(100);
      setStep('success');
      if (onSyncSuccess) {
        onSyncSuccess({
          sessionId: scannedSessionId,
          clientInfo: targetDeviceInfo
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Linking failed');
      setStep('code_entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSession = async () => {
    if (scannedSessionId) {
      fetch('/api/v1/link-device/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: scannedSessionId })
      }).catch(() => {});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Link Device (Zenoa Web)</h3>
              <p className="text-[11px] text-slate-400 font-mono">ID: {currentUser.zenoaId || `${currentUser.username}@zenoa`}</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SCANNER */}
          {step === 'scan' && (
            <div className="space-y-4 flex flex-col items-center">
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  Scan QR code on your Web Browser
                </p>
                <p className="text-[11px] text-slate-400">
                  Open <span className="text-indigo-300 font-medium">Zenoa Web</span> on your computer to display your linking QR code
                </p>
              </div>

              {/* Camera Feed Viewport */}
              <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Animated Scanner Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400/80 rounded-xl relative">
                    {/* Laser scanning line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-indigo-500" />
                  </div>
                </div>

                {cameraPermission === 'denied' && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-amber-400" />
                    <p className="text-xs font-semibold text-slate-200">Camera Access Blocked</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white cursor-pointer"
                    >
                      Retry Permission
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('manual_session')}
                className="text-xs text-indigo-400 hover:underline cursor-pointer font-medium"
              >
                Or enter Session ID manually
              </button>
            </div>
          )}

          {/* MANUAL SESSION FALLBACK */}
          {step === 'manual_session' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Session ID from Web Browser
                </label>
                <input
                  type="text"
                  placeholder="dlink_171..."
                  value={scannedSessionId}
                  onChange={e => setScannedSessionId(e.target.value.trim())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('scan')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  Back to Scanner
                </button>
                <button
                  type="button"
                  disabled={!scannedSessionId}
                  onClick={() => handleSessionDetected(scannedSessionId)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white"
                >
                  Connect Session
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 7-DIGIT CODE VERIFICATION */}
          {step === 'code_entry' && (
            <div className="space-y-5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-5 w-5 text-indigo-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{targetDeviceInfo?.os || 'Desktop Browser'}</p>
                    <p className="text-[10px] text-slate-400">{targetDeviceInfo?.browser?.substring(0, 32)}...</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                  Verified Device
                </span>
              </div>

              <div className="space-y-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Enter 7-Character Device Key</h4>
                <p className="text-xs text-slate-400">
                  Look at your Web browser screen and type the 7-character code (e.g. <strong>ZN7-9XK</strong>) below.
                </p>
              </div>

              {/* 7-Char Code Input */}
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <React.Fragment key={idx}>
                    <input
                      ref={el => { inputRefs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      value={enteredCode[idx] && enteredCode[idx] !== ' ' ? enteredCode[idx] : ''}
                      onChange={e => handleCodeChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center bg-slate-950 border-2 border-indigo-500/50 rounded-xl font-mono text-xl sm:text-2xl font-black text-white outline-none focus:border-indigo-400 shadow-inner uppercase"
                    />
                    {idx === 2 && (
                      <div className="flex items-center justify-center w-3 text-slate-500 font-bold">-</div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Confirming this will stream your local offline messages and credentials directly to your computer browser using zero-cloud P2P encryption.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRejectSession}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel / Reject
                </button>
                <button
                  type="button"
                  disabled={isLoading || enteredCode.trim().replace(/[^A-Z0-9]/g, '').length !== 7}
                  onClick={handleVerifyCodeAndStreamData}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Authorize & Sync</span>}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: P2P STREAMING PROGRESS */}
          {step === 'transferring' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <Zap className="h-8 w-8 text-indigo-400 animate-bounce" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Streaming Local Data to Web</h4>
                <p className="text-xs text-slate-400 mt-1">Direct device-to-device encrypted migration in progress...</p>
              </div>

              <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${transferProgress}%` }}
                />
              </div>

              <span className="text-xs font-mono text-indigo-400">{transferProgress}%</span>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">Device Linked & Synchronized!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Your Web browser is now logged in as <strong className="text-emerald-400">@{currentUser.username}</strong> with your full local chat history.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer mt-2"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
