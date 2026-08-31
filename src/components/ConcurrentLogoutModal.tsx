import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, LogOut, AlertTriangle, Lock } from 'lucide-react';

interface ConcurrentLogoutModalProps {
  isOpen: boolean;
  username: string;
  countdown: number;
  onLogoutNow: () => void;
  themeMode?: 'light' | 'dark';
}

export const ConcurrentLogoutModal: React.FC<ConcurrentLogoutModalProps> = ({
  isOpen,
  username,
  countdown,
  onLogoutNow,
  themeMode = 'dark'
}) => {
  if (!isOpen) return null;

  const isDark = themeMode === 'dark';

  return (
    <AnimatePresence>
      <div 
        id="concurrent-logout-overlay"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
      >
        <motion.div
          id="concurrent-logout-modal-card"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border text-center relative overflow-hidden ${
            isDark 
              ? 'bg-slate-900/95 border-rose-500/30 text-white' 
              : 'bg-white border-rose-200 text-slate-900 shadow-rose-900/10'
          }`}
        >
          {/* Subtle security accent gradient glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Alert Icon with Pulse */}
          <div className="mx-auto mb-5 relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-rose-500/20 animate-ping opacity-75" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>

          {/* Heading */}
          <h2 id="concurrent-logout-title" className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            Single Active Session Allowed
          </h2>

          {/* User badge */}
          {username && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 mb-4">
              <Lock className="w-3 h-3" />
              <span>@{username.replace(/^@/, '')}</span>
            </div>
          )}

          {/* Details / Explanation */}
          <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Your Zenoa account was logged in on another tab, browser, or device. For security and privacy, only one active session is permitted at a time.
          </p>

          {/* 5-Second Timer Countdown Display */}
          <div className={`p-4 rounded-2xl border mb-6 ${
            isDark 
              ? 'bg-slate-950/60 border-slate-800' 
              : 'bg-rose-50/50 border-rose-100'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md animate-pulse">
                {countdown}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                  Automatic Logout
                </p>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {countdown > 0 ? `Logging out in ${countdown} second${countdown !== 1 ? 's' : ''}...` : 'Logging out now...'}
                </p>
              </div>
            </div>

            {/* Countdown progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (countdown / 5) * 100))}%` }}
              />
            </div>
          </div>

          {/* Action Button: Logout Karen */}
          <div className="flex flex-col gap-2">
            <button
              id="concurrent-logout-action-btn"
              onClick={onLogoutNow}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Now</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
