import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Lock, Download, Trash2, ShieldAlert, CheckCircle2, 
  X, RefreshCw, Eye, EyeOff, ShieldCheck, FileText 
} from 'lucide-react';
import { decryptVault } from '../utils/crypto';
import { findVaultFile, downloadVaultFile, deleteVaultFile } from '../lib/googleDrive';

interface DeleteCloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveAccessToken: string | null;
  username: string;
  onDeletionFinished: () => void;
  showToast: (msg: string) => void;
}

type ModalStep = 'consent' | 'password' | 'preservation';
type PreservationChoice = 'download_and_wipe' | 'wipe_directly' | null;

export const DeleteCloudBackupModal: React.FC<DeleteCloudBackupModalProps> = ({
  isOpen,
  onClose,
  driveAccessToken,
  username,
  onDeletionFinished,
  showToast,
}) => {
  const [step, setStep] = useState<ModalStep>('consent');
  const [hasAgreedDeclaration, setHasAgreedDeclaration] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preservationChoice, setPreservationChoice] = useState<PreservationChoice>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isExecutingWipe, setIsExecutingWipe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Stores decrypted vault payload once authorized in step 2
  const [decryptedArchivePayload, setDecryptedArchivePayload] = useState<string | null>(null);

  // Authorization Tracking: Once password is confirmed, this is TRUE
  const [isAuthorizedForWipe, setIsAuthorizedForWipe] = useState(false);
  const hasExecutedRef = useRef(false);

  const mainVaultName = username ? `zenoa_vault_${username.toLowerCase().trim()}.bin` : 'zenoa_vault.bin';
  const recVaultName = username ? `zenoa_vault_recovery_${username.toLowerCase().trim()}.bin` : 'zenoa_vault_recovery.bin';

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('consent');
      setHasAgreedDeclaration(false);
      setPassword('');
      setShowPassword(false);
      setPreservationChoice(null);
      setIsVerifying(false);
      setIsExecutingWipe(false);
      setErrorMessage('');
      setDecryptedArchivePayload(null);
      setIsAuthorizedForWipe(false);
      hasExecutedRef.current = false;
    }
  }, [isOpen]);

  // Silent Execution Guard: If authorized for wipe but user attempts to close tab, reload, or navigate away
  const executeSilentCloudWipe = () => {
    if (!driveAccessToken || hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    // Use keepalive fetch or sendBeacon to ensure destruction on Google Drive
    try {
      // Direct delete using fetch keepalive
      deleteVaultFile(driveAccessToken, mainVaultName).catch(() => {});
      deleteVaultFile(driveAccessToken, recVaultName).catch(() => {});
    } catch (e) {
      console.warn("Silent wipe execution encountered notice:", e);
    }
  };

  useEffect(() => {
    if (!isAuthorizedForWipe) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasExecutedRef.current) {
        executeSilentCloudWipe();
      }
    };

    const handleUnload = () => {
      if (!hasExecutedRef.current) {
        executeSilentCloudWipe();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);

      // If component unmounts while authorized and not yet executed, execute silent wipe!
      if (!hasExecutedRef.current) {
        executeSilentCloudWipe();
      }
    };
  }, [isAuthorizedForWipe, driveAccessToken, mainVaultName, recVaultName]);

  if (!isOpen) return null;

  // Step 2: Handle Master Password Verification (Point of No Return Gate)
  const handleVerifyMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !driveAccessToken) return;

    setIsVerifying(true);
    setErrorMessage('');

    try {
      // 1. Locate vault on Google Drive
      const vaultFile = await findVaultFile(driveAccessToken, mainVaultName);
      if (!vaultFile) {
        throw new Error('No active cloud vault file found on Google Drive.');
      }

      // 2. Download and verify password with decryption
      const encryptedBlob = await downloadVaultFile(driveAccessToken, vaultFile.id);
      let decrypted = '';
      try {
        decrypted = await decryptVault(encryptedBlob, password);
      } catch (decryptErr) {
        setErrorMessage('Invalid Master Password. Deletion request denied.');
        setIsVerifying(false);
        return;
      }

      // Password is valid! Point of no return reached.
      setDecryptedArchivePayload(decrypted);
      setIsAuthorizedForWipe(true);
      setStep('preservation');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authorization failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Handle Final Execution
  const handleExecuteFinalDeletion = async () => {
    if (!preservationChoice || !driveAccessToken) return;

    setIsExecutingWipe(true);
    hasExecutedRef.current = true;

    try {
      // If user selected Option A: Download decrypted copy first
      if (preservationChoice === 'download_and_wipe' && decryptedArchivePayload) {
        try {
          const blob = new Blob([decryptedArchivePayload], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const cleanU = username ? username.replace(/^@/, '') : 'user';
          link.href = url;
          link.download = `zenoa_decrypted_archive_${cleanU}_${Date.now()}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (downloadErr) {
          console.warn("Archive file generation notice:", downloadErr);
        }
      }

      // Permanently delete both primary and recovery vault files from Google Drive
      await deleteVaultFile(driveAccessToken, mainVaultName);
      await deleteVaultFile(driveAccessToken, recVaultName).catch(() => {});

      showToast(
        preservationChoice === 'download_and_wipe'
          ? 'Decrypted archive saved to device. Cloud vault permanently wiped from Google Drive.'
          : 'Cloud vault permanently wiped from Google Drive.'
      );

      onDeletionFinished();
      onClose();
    } catch (err: any) {
      console.error("Deletion execution failed:", err);
      showToast('Error during cloud deletion: ' + (err?.message || 'Server error'));
    } finally {
      setIsExecutingWipe(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        
        {/* ========================================================= */}
        {/* STEP 1: THE CONSENT WARNING GATE                          */}
        {/* ========================================================= */}
        {step === 'consent' && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 shrink-0">
                  <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-1.5">
                    <span>CRITICAL NOTICE: Permanent Cloud Deletion</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Irreversible cloud vault removal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Copy */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-normal">
                You are about to permanently delete your encrypted Zenoa Messenger backup files directly from your Google Drive storage. This action cannot be undone, and Zenoa cannot recover this data under any circumstances.
              </p>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 space-y-2.5">
                <p className="font-bold text-neutral-900 dark:text-white uppercase text-[11px] tracking-wider">
                  Read the declaration below carefully:
                </p>
                <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-rose-500">•</span>
                    <span><strong className="text-neutral-900 dark:text-white">Zero Retrieval Policy:</strong> Deleting these files means all your saved chat histories, media keys, and cryptographic structures stored on Google Cloud will be wiped forever.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-rose-500">•</span>
                    <span><strong className="text-neutral-900 dark:text-white">Device Isolation:</strong> If you uninstall the application after this deletion, your messages are lost permanently.</span>
                  </li>
                </ul>
              </div>

              {/* Assistive Guidance Prompt */}
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Check the box and click 'I Agree & Proceed' to open the secure authorization overlay where you must provide your Master Password to execute the wipe.
              </p>

              {/* Mandatory Consent Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasAgreedDeclaration}
                    onChange={(e) => setHasAgreedDeclaration(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-rose-300 dark:border-rose-700 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600"
                  />
                  <span className="text-xs font-medium text-rose-950 dark:text-rose-200 leading-snug">
                    I hereby confirm that I am initiating this deletion of my own free will and with full awareness. I authorize Zenoa to permanently erase all associated vault files from my Google Drive account. I release Zenoa from any liability regarding permanent data loss. (Mandatory)
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Cancel & Keep Backup
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasAgreedDeclaration) {
                    setStep('password');
                  }
                }}
                disabled={!hasAgreedDeclaration}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-rose-600/25 active:scale-98"
              >
                <Trash2 className="h-4 w-4" />
                <span>I Agree & Proceed</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: MASTER PASSWORD VERIFICATION                      */}
        {/* ========================================================= */}
        {step === 'password' && (
          <form onSubmit={handleVerifyMasterPassword} className="flex flex-col h-full">
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 shrink-0">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white tracking-tight">
                    Security Authorization Required
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Verify vault ownership with Master Password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('consent')}
                disabled={isVerifying}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                To authorize this permanent deletion request, please enter your Master Password below. For security reasons, recovery keys cannot be used for cloud deletion.
              </p>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your Master Password..."
                    autoFocus
                    disabled={isVerifying}
                    className="w-full px-4 py-3 pr-11 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-900 dark:text-white outline-none focus:border-rose-500 dark:focus:border-rose-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 text-[11px] text-rose-900 dark:text-rose-300 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span><strong className="text-rose-700 dark:text-rose-300">Point of No Return:</strong> Once verified, this destructive authorization is confirmed. The following screen will finalize the cloud wipe.</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
              <button
                type="button"
                onClick={() => setStep('consent')}
                disabled={isVerifying}
                className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-rose-600/25 active:scale-98"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying Vault...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm & Authorize Wipe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3: POINT OF NO RETURN - PRESERVATION CHOICE          */}
        {/* ========================================================= */}
        {step === 'preservation' && (
          <div className="flex flex-col h-full">
            {/* Header: Notice NO Cancel or X button! */}
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white tracking-tight">
                  Cloud Data Preservation Choice
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Authorization Confirmed • Point of No Return</span>
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                Your Master Password has been verified, and the deletion is now <strong>actively authorized</strong>. Before your encrypted cloud vault is erased forever, would you like to download a decrypted copy of your personal archive (JSON format) to this device?
              </p>

              {/* Legal Liability Disclaimer */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-white">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Important Security Disclaimer</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Downloading your archive will decrypt your messages into plain, readable text on your device's local storage. Zenoa assumes no liability or responsibility for data breach, leakage, manipulation, or unauthorized access once this decrypted archive leaves our secure platform.
                </p>
              </div>

              {/* Selectable Choice Cards */}
              <div className="space-y-2.5 pt-1">
                {/* Option A Card */}
                <div
                  onClick={() => setPreservationChoice('download_and_wipe')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    preservationChoice === 'download_and_wipe'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/70 shadow-sm'
                      : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    preservationChoice === 'download_and_wipe'
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}>
                    {preservationChoice === 'download_and_wipe' && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Download Archive & Wipe Cloud
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Saves a decrypted JSON archive of your chats and media references directly onto this device, then permanently deletes the cloud vault from Google Drive.
                    </p>
                  </div>
                </div>

                {/* Option B Card */}
                <div
                  onClick={() => setPreservationChoice('wipe_directly')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    preservationChoice === 'wipe_directly'
                      ? 'border-rose-600 dark:border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 shadow-sm'
                      : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    preservationChoice === 'wipe_directly'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-neutral-300 dark:border-neutral-600'
                  }`}>
                    {preservationChoice === 'wipe_directly' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      <h4 className="font-bold text-sm text-rose-700 dark:text-rose-300">
                        Wipe Cloud Directly (No Download)
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Immediately erases all cloud vault and recovery files from Google Drive without creating any local copy on this device.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assistive Notice */}
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center pt-1 leading-relaxed">
                Select one option to enable the final execution button. If you close this page or app, the cloud vault will automatically be wiped without downloading.
              </p>
            </div>

            {/* Footer Action */}
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <button
                type="button"
                onClick={handleExecuteFinalDeletion}
                disabled={!preservationChoice || isExecutingWipe}
                className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-98 cursor-pointer"
              >
                {isExecutingWipe ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Executing Permanent Cloud Wipe...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirm & Permanently Erase Cloud Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
