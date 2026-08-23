import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Sparkles, Check } from 'lucide-react';

interface AccountSetupProps {
  onComplete: (data: { bio: string; avatarSeed: string }) => void;
  themeMode: 'light' | 'dark';
}

export const AccountSetup: React.FC<AccountSetupProps> = ({ onComplete, themeMode }) => {
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('zenoa');

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-6 ${themeMode === 'dark' ? 'bg-neutral-950' : 'bg-neutral-50'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
      >
        <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-6">
          {step === 1 ? 'Personalize your profile' : 'Almost there'}
        </h2>

        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-neutral-500 uppercase">Tell us about yourself</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-0 text-sm"
              placeholder="What do you want friends to know?"
              rows={3}
            />
            <button onClick={() => setStep(2)} className="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold text-sm">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-neutral-500 uppercase">Choose your icon</label>
            <div className="grid grid-cols-4 gap-2">
              {['zenoa', 'sky', 'ocean', 'forest'].map((s) => (
                <button key={s} onClick={() => setAvatarSeed(s)} className={`p-4 rounded-2xl ${avatarSeed === s ? 'bg-indigo-100' : 'bg-neutral-100'}`}>
                  <User className="w-6 h-6" />
                </button>
              ))}
            </div>
            <button onClick={() => onComplete({ bio, avatarSeed })} className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Complete Setup
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
