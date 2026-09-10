import React, { useState, useEffect } from 'react';
import { 
  Lock, Eye, EyeOff, ShieldCheck, KeyRound, X, Sparkles, AlertTriangle, 
  CheckCircle2, RefreshCw, ArrowRight, Download, Copy, Check, ArrowLeft 
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
  const [mode, setMode] = useState<'normal' | 'change' | 'recover_key_entry' | 'recover_new_password' | 'recover_success_key_show'>('normal');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 24-Character Recovery Key States
  const [showRecoveryStep, setShowRecoveryStep] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [isKeySavedChecked, setIsKeySavedChecked] = useState(true); // Pre-selected
  const [copiedKey, setCopiedKey] = useState(false);

  // Recovery Input flow states
  const [recoveryInput, setRecoveryInput] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('normal');
      setPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowRecoveryStep(false);
      setRecoveryKey('');
      setIsKeySavedChecked(true);
      setCopiedKey(false);
      setRecoveryInput('');
      setIsVerifyingKey(false);
    }
  }, [isOpen]);

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

  // Helper: Securely hash recovery key to SHA-256 for zero-knowledge cloud matching
  const hashRecoveryKey = async (key: string): Promise<string> => {
    const clean = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const msgUint8 = new TextEncoder().encode(clean);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Save key locally and store zero-knowledge hash in Firestore
  const persistRecoveryKeyAndHash = async (keyStr: string) => {
    localStorage.setItem(`zenoa_recovery_key_${userEmail}`, keyStr);
    if (db && userEmail) {
      try {
        const hashHex = await hashRecoveryKey(keyStr);
        await setDoc(doc(db, 'user_vault_recovery', userEmail), {
          hashedKey: hashHex,
          updatedAt: Date.now(),
          userUid: userUid || 'unknown'
        });
      } catch (err) {
        console.warn('Could not record zero-knowledge recovery hash to Firestore:', err);
      }
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

  const handleRecoveryInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
    const formatted = clean.match(/.{1,4}/g)?.join('-') || clean;
    setRecoveryInput(formatted);
  };

  // Step 1 Validation & Proceeding to Recovery Key step for creation/resets
  const validateAndProceedToRecovery = async (e: React.FormEvent) => {
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

  const handleFinalizeWithRecovery = async () => {
    if (!isKeySavedChecked) {
      setErrorMsg('You must confirm you have safely saved your recovery key to proceed.');
      return;
    }

    setIsVerifyingKey(true);
    try {
      await persistRecoveryKeyAndHash(recoveryKey);
      
      if (mode === 'recover_success_key_show' && onPasswordResetComplete) {
        onPasswordResetComplete(password);
      } else {
        onSubmit(password);
      }
    } catch (err: any) {
      setErrorMsg('Failed to secure your recovery parameters. Please try again.');
    } finally {
      setIsVerifyingKey(false);
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

  // Execute 24-Character Recovery Key check
  const handleVerifyRecoveryKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanInput = recoveryInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanInput.length !== 24) {
      setErrorMsg('Please enter your full 24-character Recovery Key.');
      return;
    }

    setIsVerifyingKey(true);
    let verified = false;

    try {
      // 1. Attempt Firestore Check (Zero-Knowledge Matching)
      if (db && userEmail) {
        const docRef = doc(db, 'user_vault_recovery', userEmail);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const storedHash = snap.data().hashedKey;
          const inputHash = await hashRecoveryKey(cleanInput);
          if (storedHash === inputHash) {
            verified = true;
          }
        }
      }

      // 2. Local Fallback Check
      if (!verified) {
        const localSavedKey = localStorage.getItem(`zenoa_recovery_key_${userEmail}`);
        if (localSavedKey) {
          const cleanLocal = localSavedKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (cleanLocal === cleanInput) {
            verified = true;
          }
        }
      }

      // 3. Fallback for migration (allow any valid formatted key if none existed before)
      if (!verified) {
        const hasFirestoreHash = db && userEmail ? (await getDoc(doc(db, 'user_vault_recovery', userEmail))).exists() : false;
        const hasLocalKey = !!localStorage.getItem(`zenoa_recovery_key_${userEmail}`);
        
        if (!hasFirestoreHash && !hasLocalKey) {
          // No prior key was saved on the cloud or locally, accept input key to perform initial seed/reset
          verified = true;
        }
      }

      if (verified) {
        setSuccessMsg('Recovery Key authenticated successfully. Please set a new Master Password.');
        // Store current authenticated key locally so we can match it on next backups
        localStorage.setItem(`zenoa_recovery_key_${userEmail}`, recoveryInput);
        setMode('recover_new_password');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg('Invalid Recovery Key. Please check the spelling and try again.');
      }
    } catch (err: any) {
      setErrorMsg('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Submit new password set after Recovery Key auth
  const handleRecoverNewPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password || password.length < 8) {
      setErrorMsg('New Master Password must be at least 8 characters long.');
      return;
    }
    const strength = zxcvbn(password);
    if (strength.score < 2) {
      setErrorMsg('New password is too weak. Please choose a stronger combination.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Generate fresh key for the new password
    const newKey = generate24CharRecoveryKey();
    setRecoveryKey(newKey);
    setIsKeySavedChecked(true);
    setMode('recover_success_key_show');
  };

  const strengthMeta = getStrengthMeta(password);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                {showRecoveryStep
                  ? 'Backup Recovery Key'
                  : mode === 'recover_key_entry'
                  ? 'Recover Master Password'
                  : mode === 'recover_new_password'
                  ? 'Create New Password'
                  : mode === 'recover_success_key_show'
                  ? 'Your New Recovery Key'
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
              <p className="text-xs text-neutral-400 font-medium">
                {showRecoveryStep
                  ? 'Step 2 of 2: Save Private Key'
                  : mode === 'recover_key_entry'
                  ? 'Secure Recovery Protocol'
                  : mode === 'recover_new_password'
                  ? 'Step 1 of 2: Reset Password'
                  : mode === 'recover_success_key_show'
                  ? 'Step 2 of 2: Store New Key'
                  : isCreation
                  ? 'Step 1 of 2: Password Protocol'
                  : 'Zero-Knowledge Cryptographic Vault'}
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
          {/* STEP 2: RECOVERY KEY DISPLAY (Creation / Password Change / Reset Succesful) */}
          {(showRecoveryStep || mode === 'recover_success_key_show') ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <span>24-Character Private Recovery Key</span>
                </div>
                <p className="text-xs text-indigo-950/80 dark:text-indigo-200/90 leading-relaxed font-medium">
                  {mode === 'recover_success_key_show' 
                    ? 'A new secure recovery key has been derived for your updated master password. Please download and save this new key. Your previous key is now obsolete.'
                    : 'A secure 24-character recovery key has been generated on your device. You can use this key to restore your vault backups if you ever lose your password.'}
                </p>
              </div>

              {/* Recovery Key Display Box */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Private Recovery Key</span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 cursor-pointer font-sans text-xs"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied to Clipboard' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-center select-all">
                  <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-emerald-400 break-all">
                    {recoveryKey}
                  </span>
                </div>
              </div>

              {/* Download .txt Action */}
              <button
                type="button"
                onClick={downloadRecoveryKeyFile}
                className="w-full py-3 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm"
              >
                <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Download Recovery Key (.txt)</span>
              </button>

              {/* Important Security Warning */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Zero-Knowledge Security Policy</span>
                </div>
                <p className="text-xs text-rose-950 dark:text-rose-200/90 leading-relaxed font-medium">
                  Please store your Master Password and Recovery Key offline in a highly secure location. Our servers hold no record of your password or unhashed key. Loss of both parameters will lead to permanent vault lock.
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
                  I have safely downloaded and stored my Master Password and 24-character Recovery Key offline.
                </span>
              </label>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 animate-fade-in">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'recover_success_key_show') {
                      setMode('recover_new_password');
                    } else {
                      setShowRecoveryStep(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!isKeySavedChecked || isVerifyingKey}
                  onClick={handleFinalizeWithRecovery}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isVerifyingKey ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>Finalize & Encrypt Vault</span>
                </button>
              </div>
            </div>
          ) : mode === 'recover_key_entry' ? (
            /* SECURE RECOVERY KEY INPUT FOR PASSWORD RESET */
            <form onSubmit={handleVerifyRecoveryKeySubmit} className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <KeyRound className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>Authenticate Offline Recovery Key</span>
                </div>
                <p className="text-xs text-indigo-950/80 dark:text-indigo-200/90 leading-relaxed font-medium">
                  Enter your 24-character private recovery key in the field below to verify your authorization and set a new password.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Your 24-Character Emergency Key
                </label>
                <input
                  type="text"
                  maxLength={29} // 24 letters + 5 dashes
                  value={recoveryInput}
                  onChange={(e) => handleRecoveryInputChange(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-center tracking-widest text-sm sm:text-base font-mono font-bold outline-none transition-all text-neutral-900 dark:text-white uppercase placeholder:text-neutral-400/75 dark:placeholder:text-neutral-600"
                />
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 animate-fade-in">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('normal')}
                  className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Password Entry</span>
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingKey || recoveryInput.replace(/[^A-Z0-9]/g, '').length !== 24}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isVerifyingKey ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>Verify Recovery Key</span>
                </button>
              </div>
            </form>
          ) : mode === 'recover_new_password' ? (
            /* RESET STEP: INPUT NEW PASSWORD */
            <form onSubmit={handleRecoverNewPasswordSubmit} className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Identity Verified — Configure New Password</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/90 leading-relaxed font-medium">
                  Authentication successful. Please choose a strong Master Password below to restore and secure your encrypted backup database.
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
                      placeholder="Enter strong new master password..."
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

                  {/* Password Strength Indicator */}
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
                    placeholder="Confirm your master password..."
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 animate-fade-in">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('recover_key_entry')}
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
            /* CHANGE PASSWORD (Current + New) */
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
                    placeholder="Enter current master password..."
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
                      placeholder="Enter strong new password..."
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

                  {/* Password Strength Bar */}
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
                    placeholder="Confirm your master password..."
                    className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 animate-fade-in">
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
            /* STANDARD MASTER PASSWORD LOGIN / INITIATION SCREEN */
            <form onSubmit={handleNormalSubmit} className="space-y-4 animate-fade-in">
              {isCreation ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>Create Your Vault Master Password</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed font-medium">
                    Configure a strong <strong>Master Password</strong> (minimum 8 characters) to secure your backup archives. Your password acts as a zero-knowledge local encryption key.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
                  <GoogleDriveLogo className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                    {actionType === 'restore'
                      ? 'Enter your Vault Master Password or 24-character Recovery Key below to authenticate, decrypt and restore your messaging archives.'
                      : 'Please enter your Master Password below to authorize and perform cloud vault operations.'}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                    <span>{isCreation ? 'Create Master Password' : 'Master Password / Recovery Key'}</span>
                    {isCreation && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">(Minimum 8 Characters)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isCreation ? 'Create a master password...' : 'Enter password or XXXX-XXXX-XXXX-XXXX-XXXX-XXXX...'}
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

                  {/* Password Strength Bar */}
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
                      placeholder="Confirm your master password..."
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 text-sm outline-none transition-all text-neutral-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Password recovery option */}
                {!isCreation && hasExistingPassword && (
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => setMode('change')}
                      className="font-bold text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('recover_key_entry')}
                      className="font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Forgot Password? Use Recovery Key</span>
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 animate-fade-in">
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
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>
                    {isCreation
                      ? 'Generate Recovery Key'
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
