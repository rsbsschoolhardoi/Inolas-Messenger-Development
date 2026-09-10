import React, { useState } from 'react';
import { ShieldCheck, Lock, HardDrive, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { GoogleDriveLogo } from './GoogleDriveLogo';

interface GoogleDriveConnectConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const GoogleDriveConnectConsentModal: React.FC<GoogleDriveConnectConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
              <GoogleDriveLogo className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white tracking-tight">
                Connect Google Drive Vault
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Encrypted cloud backup storage configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          
          {/* Recommendation: Dedicated Account */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
              <HardDrive className="h-4 w-4 text-neutral-600 dark:text-neutral-300 shrink-0" />
              <span>Recommended Setup: Use a Dedicated Google Account</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              For optimal organization and privacy, we recommend connecting a <strong>dedicated secondary Google account</strong>. This grants you the full <strong>15 GB free storage quota</strong> solely for your messenger backups, preventing capacity conflicts with Gmail, Google Photos, or family drive storage.
            </p>
          </div>

          {/* Security & Cryptographic Notice */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
              <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero-Knowledge Security Architecture</span>
            </div>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Backups are encrypted on your local device before upload using <strong>Argon2id + AES-256-GCM</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Zenoa servers never see or hold your Master Password, plaintext messages, or Google tokens.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>1:1 Account Binding:</strong> Each Google Account links to only one vault to prevent unauthorized access.</span>
              </li>
            </ul>
          </div>

          {/* Permanent Loss Warning */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-neutral-900 dark:text-white">Account Responsibility</p>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Securely store your linked Google credentials and Master Password. If credentials are lost or forgotten, your encrypted backup is <strong>permanently irrecoverable</strong>. Zenoa cannot restore access under any circumstances.
              </p>
            </div>
          </div>

          {/* Expandable Terms & Privacy Policy */}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <button
              type="button"
              onClick={() => setShowPolicyDetails(!showPolicyDetails)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center justify-between w-full py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                View Zenoa Cloud Vault Terms & Policy
              </span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showPolicyDetails ? 'rotate-90' : ''}`} />
            </button>

            {showPolicyDetails && (
              <div className="mt-3 p-3.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/70 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-2 animate-fade-in border border-neutral-200/60 dark:border-neutral-700/60">
                <p><strong>1. Isolated Storage:</strong> Archives are stored strictly in the isolated <code>appDataFolder</code> of your authenticated Google Drive. This folder is completely hidden from other apps and only accessible by your authorized client.</p>
                <p><strong>2. Cryptographic Self-Sovereignty:</strong> All encryption keys derive from your Master Password. No master recovery keys or backdoors exist.</p>
                <p><strong>3. Zero Telemetry:</strong> No analytics, tracking tags, or usage telemetry are embedded into cloud backups.</p>
              </div>
            )}
          </div>

          {/* Mandatory Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 hover:bg-neutral-100/80 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreedToTerms}
                onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer accent-neutral-900 dark:accent-white"
              />
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
                I have securely documented my Google Account credentials and Master Password. I understand that losing either will result in permanent, irrecoverable loss of my cloud backup.
              </span>
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (hasAgreedToTerms) {
                onConfirm();
              }
            }}
            disabled={!hasAgreedToTerms}
            className="px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-40 disabled:hover:bg-neutral-900 dark:disabled:hover:bg-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm active:scale-98"
          >
            <GoogleDriveLogo className="h-4 w-4" />
            <span>Continue to Google Authentication</span>
          </button>
        </div>

      </div>
    </div>
  );
};

