import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, ShieldCheck, ShieldAlert, Volume2, VolumeX, Ban, 
  X, ExternalLink, FileText, Lock, CheckCircle2,
  Shield, Info
} from 'lucide-react';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';

interface BusinessAccountInfoDropdownProps {
  businessUser: {
    display_name: string;
    username: string;
    avatar_seed?: string;
    avatar_url?: string;
    is_verified?: boolean;
    bio?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onOpenDocs?: (sectionId?: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isBlocked?: boolean;
  onToggleBlock?: () => void;
}

export const BusinessAccountInfoDropdown: React.FC<BusinessAccountInfoDropdownProps> = ({
  businessUser,
  isOpen,
  onClose,
  onOpenDocs,
  isMuted = false,
  onToggleMute,
  isBlocked = false,
  onToggleBlock
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 sm:top-16 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto text-neutral-900 dark:text-neutral-100"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 shadow-2xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                  {businessUser.display_name || businessUser.username}
                </h4>
                {businessUser.is_verified ? (
                  <PurpleVerifiedBadge size="xs" />
                ) : (
                  <span className="text-[10px] font-medium tracking-tight px-1.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                    Business Account
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                @{businessUser.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Main Description */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs sm:text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950 dark:text-blue-200 mb-1">
                  Secure Zenoa Business Infrastructure
                </p>
                <p className="text-blue-900/85 dark:text-neutral-300 leading-normal">
                  This business uses Zenoa's secure messaging infrastructure to deliver automated notifications, verification passcodes, and customer support.
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Account Capabilities & Security
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Transactional Updates</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Can deliver order confirmations, 2FA security alerts, and direct responses to your inquiries.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-neutral-900 dark:text-neutral-200">
                  <Lock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Zero Access to Private Chats</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Cannot read your personal chats, contacts, audio/video calls, or end-to-end encryption keys.
                </p>
              </div>
            </div>
          </div>

          {/* User Controls */}
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
                Your Privacy Controls
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                You are always in control
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                      : 'bg-neutral-200/70 dark:bg-neutral-700/70 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                  }`}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  <span>{isMuted ? 'Muted' : 'Mute Notifications'}</span>
                </button>
              )}

              {onToggleBlock && (
                <button
                  type="button"
                  onClick={onToggleBlock}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isBlocked
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                  }`}
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>{isBlocked ? 'Unblock Business' : 'Block Business'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Legal and Documentation Link */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="text-[11px] leading-relaxed">
              Want to learn more about how business accounts operate?
            </span>
            <button
              onClick={() => {
                if (onOpenDocs) {
                  onOpenDocs('business-vs-official-accounts');
                }
              }}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 shrink-0 cursor-pointer transition-colors"
            >
              <span>Terms & Documentation</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
