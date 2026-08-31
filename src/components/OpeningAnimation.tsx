import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useBranding } from '../brandingUtils';

interface OpeningAnimationProps {
  displayName?: string;
  provider?: string;
  onComplete?: () => void;
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({
  displayName = 'User',
  provider = 'Google',
  onComplete
}) => {
  const branding = useBranding();
  const activeLogo = branding.messenger_logo || branding.public_logo || branding.oauth_logo;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      if (onComplete) {
        onComplete();
      }
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-neutral-950 text-white font-['SF_Pro_Display',-apple-system,sans-serif] selection:bg-white/20"
    >
      {/* Dynamic Background Mesh Radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Emblem Ring */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative mb-8"
        >
          {/* Spinning Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="w-24 h-24 rounded-full border border-dashed border-white/20 p-1 flex items-center justify-center"
          />

          {/* Center Logo */}
          <div className="absolute inset-0 m-auto w-16 h-16 rounded-2xl bg-white text-neutral-950 font-black text-2xl flex items-center justify-center shadow-2xl shadow-white/20 border border-white/40 overflow-hidden p-1.5">
            {activeLogo ? (
              <img src={activeLogo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span>Z</span>
            )}
          </div>

          {/* Google Icon Badge if Google */}
          {provider === 'google' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neutral-900 border border-white/20 flex items-center justify-center shadow-lg"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </motion.div>
          )}
        </motion.div>

        {/* Text Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated via {provider === 'google' ? 'Google Workspace' : provider}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            Welcome back, {displayName}
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            Decrypting workspace keys & establishing secure peer connection...
          </p>
        </motion.div>

        {/* Smooth Progress Bar */}
        <div className="w-full mt-8 bg-neutral-900 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-neutral-200 to-white rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        {/* Footer Tag */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-500 font-mono tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>E2E Encrypted • Zenoa OS</span>
        </div>
      </div>
    </motion.div>
  );
};
