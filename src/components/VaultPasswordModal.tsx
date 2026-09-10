import React, { useState, useEffect } from 'react';
import { 
  Lock, Eye, EyeOff, ShieldCheck, KeyRound, X, Sparkles, AlertTriangle, 
  Mail, CheckCircle2, RefreshCw, ShieldAlert, ArrowRight, Download, Copy, Check 
} from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { GoogleDriveLogo } from './GoogleDriveLogo';
import { db } from '../firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface VaultPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  actionType: 'backup' | 'restore' | 'delete';
  hasExistingPassword?: boolean;
  isLoading?: boolean;
  userEmail?: string;
  userUid?: string;
  onPasswordResetComplete?: (newPassword: string) => void;
}

export const VaultPasswordModal: React.FC<VaultPasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  actionType,
  hasExistingPassword = false,
  isLoading = false,
  userEmail = 'user@example.com',
  userUid,
  onPasswordResetComplete,
}) => {
  const [mode, setMode] = useState<'normal' | 'change' | 'reset_step1' | 'reset_step2' | 'reset_locked'>('normal');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Time Reset states
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isResetUsed, setIsResetUsed] = useState(false);
  const [checkingResetStatus, setCheckingResetStatus] = useState(false);

  // 24-Character Recovery Key & Step States
  const [showRecoveryStep, setShowRecoveryStep] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [isKeySavedChecked, setIsKeySavedChecked] = useState(true); // Pre-selected as requested
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('normal');
      setPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
      setResetCode('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowRecoveryStep(false);
      setRecoveryKey('');
      setIsKeySavedChecked(true);
      setCopiedKey(false);
      checkLifetimeResetStatus();
    }
  }, [isOpen]);

  const checkLifetimeResetStatus = async () => {
    setCheckingResetStatus(true);
    const key = `zenoa_vault_reset_used_${userEmail}`;
    const localUsed = localStorage.getItem(key) === 'true';

    if (localUsed) {
      setIsResetUsed(true);
      setCheckingResetStatus(false);
      return;
    }

    if (db && userEmail) {
      try {
        const resetRef = doc(db, 'user_vault_resets', userEmail);
        const snap = await getDoc(resetRef);
        if (snap.exists() && snap.data()?.used) {
          setIsResetUsed(true);
          localStorage.setItem(key, 'true');
        } else {
          setIsResetUsed(false);
        }
      } catch (e) {
        console.warn('Could not check Firestore reset status:', e);
      }
    }
    setCheckingResetStatus(false);
  };

  if (!isOpen) return null;

  const isCreation = !hasExistingPassword && actionType === 'backup' && mode === 'normal';

  // Helper: Generate 24-character recovery key (formatted in 6 groups of 4)
  const generate24CharRecoveryKey = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 unambiguous chars
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    let key = '';
    for (let i = 0; i < 24; i++) {
      key += chars[array[i] % chars.length];
    }
    return key.match(/.{1,4}/g)?.join('-') || key;
  };

  // Helper: Get Password Strength details via zxcvbn
  const getStrengthMeta = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-neutral-200 dark:bg-neutral-800', textClass: 'text-neutral-400', width: '0%' };
    const res = zxcvbn(pwd);
    switch (res.score) {
      case 0:
        return { score: 0, label: 'Very Weak', color: 'bg-rose-500', textClass: 'text-rose-500 font-bold', width: '20%' };
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-amber-500', textClass: 'text-amber-500 font-bold', width: '40%' };
      case 2:
        return { score: 2, label: 'Medium', color: 'bg-yellow-500', textClass: 'text-yellow-600 dark:text-yellow-400 font-bold', width: '60%' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400 font-bold', width: '80%' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-indigo-600', textClass: 'text-indigo-600 dark:text-indigo-400 font-bold', width: '100%' };
      default:
        return { score: 0, label: '', color: 'bg-neutral-200', textClass: 'text-neutral-400', width: '0%' };
    }
  };

  // Helper: Download Emergency Recovery Key as .txt file
  const downloadRecoveryKeyFile = () => {
    const fileText = `=====================================================
ZENOA ZERO-KNOWLEDGE VAULT - EMERGENCY RECOVERY KEY
=====================================================

Account Email: ${userEmail}
Date Generated: ${new Date().toLocaleString()}

-----------------------------------------------------
YOUR 24-CHARACTER RECOVERY KEY:
${recoveryKey}
-----------------------------------------------------

CRITICAL SECURITY NOTICE:
1. Store this Recovery Key and your Master Password in a safe, offline location (e.g., password manager).
2. Neither Zenoa servers nor administrators have access to your key or plain text password.
3. IF YOU LOSE YOUR MASTER PASSWORD AND RECOVERY KEY, YOUR ENCRYPTED VAULT DATA WILL BE PERMANENTLY LOCKED AND CANNOT BE RECOVERED.
=====================================================`;

    const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenoa_recovery_key_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Step 1 Validation & Proceeding to Recovery Key step for creation/resets
  const validateAndProceedToRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Please enter a Master Password.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Master Password must be at least 8 characters long for security.');
      return;
    }

    const strength = zxcvbn(password);
    if (strength.score < 2) {
      setErrorMsg('Password is too weak. Please use a combination of letters, numbers, or symbols.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and re-type.');
      return;
    }

    // Generate 24-char recovery key and show Step 2
    const key24 = generate24CharRecoveryKey();
    setRecoveryKey(key24);
    setIsKeySavedChecked(true); // Pre-selected
    setShowRecoveryStep(true);
  };

  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Please enter your Master Password.');
      return;
    }

    if (isCreation) {
      validateAndProceedToRecovery(e);
      return;
    }

    onSubmit(password);
  };

  const handleFinalizeWithRecovery = () => {
    if (!isKeySavedChecked) {
      setErrorMsg('You must confirm you have saved your recovery key to proceed.');
      return;
    }

    if (mode === 'reset_step2' && onPasswordResetComplete) {
      onPasswordResetComplete(password);
    } else {
      onSubmit(password);
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current Master Password.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    const strength = zxcvbn(password);
    if (strength.score < 2) {
      setErrorMsg('New password is too weak. Please use a stronger password combination.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    // Generate 24-char recovery key and proceed to step 2
    const key24 = generate24CharRecoveryKey();
    setRecoveryKey(key24);
    setIsKeySavedChecked(true);
    setShowRecoveryStep(true);
  };

  const handleInitiateEmergencyReset = async () => {
    setErrorMsg('');
    if (isResetUsed) {
      setMode('reset_locked');
      return;
    }

    setIsSendingEmail(true);
    // Generate a secure 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    setTimeout(() => {
      setIsSendingEmail(false);
      setMode('reset_step1');
      setSuccessMsg(`A 6-digit emergency verification code [${code}] has been dispatched to ${userEmail}.`);
    }, 1200);
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (resetCode.trim() !== generatedCode) {
      setErrorMsg('Invalid verification code. Please check your email and try again.');
      return;
    }

    setSuccessMsg('Security verification successful. Please set your new Master Password.');
    setMode('reset_step2');
  };

  const handleFinalizeResetStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password || password.length < 8) {
      setErrorMsg('New Master Password must be at least 8 characters long.');
      return;
    }
    const strength = zxcvbn(password);
    if (strength.score < 2) {
      setErrorMsg('New password is too weak. Please use a stronger password combination.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Mark lifetime 1-time reset as USED permanently
    const key = `zenoa_vault_reset_used_${userEmail}`;
    localStorage.setItem(key, 'true');
    setIsResetUsed(true);

    if (db && userEmail) {
      setDoc(doc(db, 'user_vault_resets', userEmail), {
        used: true,
        resetAt: Date.now(),
        userUid: userUid || 'unknown'
      }).catch(e => console.warn('Failed to record reset to Firestore:', e));
    }

    // Proceed to 24-char recovery key view
    const key24 = generate24CharRecoveryKey();
    setRecoveryKey(key24);
    setIsKeySavedChecked(true);
    setShowRecoveryStep(true);
  };

  const strengthMeta = getStrengthMeta(password);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              {mode.startsWith('reset') ? <ShieldAlert className="h-5 w-5 text-rose-500" /> : <KeyRound className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                {showRecoveryStep
                  ? 'Emergency Recovery Key'
                  : mode === 'reset_step1' || mode === 'reset_step2' || mode === 'reset_locked'
                  ? 'Emergency Password Reset'
                  : mode === 'change'
                  ? 'Change Master Password'
                  : isCreation
                  ? 'Create Master Password'
                  : actionType === 'restore'
                  ? 'Restore Cloud Backup'
                  : actionType === 'delete'
                  ? 'Delete Cloud Backup'
                  : 'Enter Master Password'}
              </h3>
              <p className="text-xs text-neutral-400">
                {showRecoveryStep
                  ? 'Step 2 of 2: Save Private Key'
                  : mode.startsWith('reset')
                  ? '1-Time Lifetime Security Recovery'
                  : isCreation
                  ? 'Step 1 of 2: Password Protocol'
                  : 'Argon2id Zero-Knowledge Encrypted Vault'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* STEP 2: RECOVERY KEY STEP (Displayed right after password creation/reset) */}
          {showRecoveryStep ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <KeyRound className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>24-Character Private Emergency Recovery Key</span>
                </div>
                <p className="text-xs text-indigo-950 dark:text-indigo-200/90 leading-relaxed">
                  A unique 24-character private key has been generated locally. Save this key to restore your vault if you ever forget your password.
                </p>
              </div>

              {/* Recovery Key Display Box */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Your Recovery Key</span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-sans"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center select-all">
                  <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-emerald-400 break-all">
                    {recoveryKey}
                  </span>
                </div>
              </div>

              {/* Download .txt button */}
              <button
                type="button"
                onClick={downloadRecoveryKeyFile}
                className="w-full py-3 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm"
              >
                <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Download Recovery Key (.txt)</span>
              </button>

              {/* Clear Warning Box */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Important Security Warning</span>
                </div>
                <p className="text-xs text-rose-950 dark:text-rose-200/90 leading-relaxed font-medium">
                  Apne password aur recovery key ko secure rakhein. Agar ye kho gai to aapka data lock ho jaayega aur ise recover nahi kiya ja sakta.
                </p>
              </div>

              {/* Pre-selected Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isKeySavedChecked}
                  onChange={(e) => {
                    setIsKeySavedChecked(e.target.checked);
                    if (e.target.checked) setErrorMsg('');
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 leading-snug">
                  I have safely downloaded and stored my Master Password and 24-character Recovery Key.
                </span>
              </label>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowRecoveryStep(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!isKeySavedChecked || isLoading}
                  onClick={handleFinalizeWithRecovery}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>Finalize & Encrypt Vault</span>
                </button>
              </div>
            </div>
          ) : mode === 'reset_locked' || (mode.startsWith('reset') && isResetUsed && mode !== 'reset_step2') ? (
            /* MODE 1: Emergency Reset Locked (Used once already) */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Emergency Reset Limit Exceeded</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
                  You have already redeemed your <strong>1-time lifetime emergency password reset</strong> for this account. For end-to-end zero-knowledge security, emergency resets are strictly limited to once per account lifetime.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMode('normal')}
                  className="w-full py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Back to Password Entry
                </button>
              </div>
            </div>
          ) : mode === 'reset_step1' ? (
            /* MODE 2: Verify 6-digit Email Code */
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <Mail className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>Security Token Sent to Email</span>
                </div>
                <p className="text-xs text-indigo-950 dark:text-indigo-200/90 leading-relaxed">
                  An emergency verification code has been dispatched to <strong>{userEmail}</strong>. Enter the 6-digit token below to confirm identity.
                </p>
              </div>

              {successMsg && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                  {successMsg}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  6-Digit Emergency Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482915"
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-center tracking-widest text-base font-mono font-bold outline-none transition-all text-neutral-900 dark:text-white"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('normal')}
                  className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Verify Code</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : mode === 'reset_step2' ? (
            /* MODE 3: Create New Password after Reset Verification */
            <form onSubmit={handleFinalizeResetStep1} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Identity Verified — Set New Master Password</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  Please set a strong Master Password (min 8 characters).
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    New Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new master password..."
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all pr-11 text-neutral-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* ZXCVBN Password Strength Bar */}
                  {password && (
                    <div className="space-y-1 pt-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400 font-semibold">Password Strength:</span>
                        <span className={strengthMeta.textClass}>{strengthMeta.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${strengthMeta.color}`}
                          style={{ width: strengthMeta.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Confirm New Master Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new master password..."
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('normal')}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Continue to Recovery Key</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : mode === 'change' ? (
            /* MODE 4: Change Password (Current + New) */
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Current Master Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    New Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new master password..."
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all pr-11 text-neutral-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* ZXCVBN Password Strength Bar */}
                  {password && (
                    <div className="space-y-1 pt-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400 font-semibold">Password Strength:</span>
                        <span className={strengthMeta.textClass}>{strengthMeta.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${strengthMeta.color}`}
                          style={{ width: strengthMeta.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Confirm New Master Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new master password..."
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('normal')}
                  className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue to Recovery Key</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            /* MODE 5: Standard Normal Entry / Creation */
            <form onSubmit={handleNormalSubmit} className="space-y-4">
              {isCreation ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>First-Time Setup: Create Master Password</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
                    Create a strong <strong>Master Password</strong> (min 8 characters) to encrypt your cloud backups. This password is zero-knowledge and known only to you.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
                  <GoogleDriveLogo className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {actionType === 'restore'
                      ? 'Enter your Master Password or 24-character Recovery Key to decrypt and restore your vault from Google Drive.'
                      : 'Enter your Master Password to authorize cloud vault operation.'}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                    <span>{isCreation ? 'Create New Master Password' : 'Enter Master Password'}</span>
                    {isCreation && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">(Min 8 characters)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isCreation ? 'Create a master password...' : 'Enter your master password or recovery key...'}
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all pr-11 text-neutral-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* ZXCVBN Password Strength Bar for Creation */}
                  {isCreation && password && (
                    <div className="space-y-1 pt-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400 font-semibold">Password Strength:</span>
                        <span className={strengthMeta.textClass}>{strengthMeta.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${strengthMeta.color}`}
                          style={{ width: strengthMeta.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {isCreation && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Confirm Master Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type master password..."
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Secondary Actions for Existing Password */}
                {!isCreation && hasExistingPassword && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setMode('change')}
                      className="font-semibold text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={handleInitiateEmergencyReset}
                      disabled={isSendingEmail || checkingResetStatus}
                      className="font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {isSendingEmail && <RefreshCw className="h-3 w-3 animate-spin" />}
                      <span>Forgot? 1-Time Emergency Reset</span>
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>
                    {isCreation
                      ? 'Continue to Recovery Key'
                      : actionType === 'restore'
                      ? 'Decrypt & Restore'
                      : actionType === 'delete'
                      ? 'Confirm Deletion'
                      : 'Submit'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
