import React from 'react';
import { Lock, ArrowRight, Check } from 'lucide-react';
import { DeveloperCategoryTier } from '../../../types';

interface FeatureLockedCardProps {
  featureName: string;
  requiredTier: DeveloperCategoryTier | 'business_or_hybrid';
  currentTier: DeveloperCategoryTier;
  description: string;
  benefits: string[];
  onUpgrade: () => void;
  themeMode?: 'light' | 'dark';
}

export const FeatureLockedCard: React.FC<FeatureLockedCardProps> = ({
  featureName,
  requiredTier,
  currentTier,
  description,
  benefits,
  onUpgrade,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';

  const requiredLabel = requiredTier === 'business_or_hybrid' 
    ? 'Business Suite or Hybrid' 
    : requiredTier === 'hybrid' 
      ? 'Hybrid Enterprise' 
      : 'Business Suite';

  const currentLabel = currentTier === 'messenger' 
    ? 'Messenger Plan' 
    : currentTier === 'business' 
      ? 'Business Suite' 
      : 'Hybrid Enterprise';

  return (
    <div className={`rounded-xl p-8 border transition-all ${
      isDark 
        ? 'bg-[#0d1326] border-[#273951] text-white' 
        : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xs'
    }`}>
      <div className="max-w-xl mx-auto text-center space-y-5 py-4">
        {/* Subtle Lock Icon */}
        <div className="inline-flex items-center justify-center">
          <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shadow-xs">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Current: {currentLabel}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8]">
              Requires: {requiredLabel}
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {featureName}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Benefits list */}
        <div className={`p-4 rounded-xl border text-left space-y-2.5 ${
          isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f8fafc] border-[#e2e8f0]'
        }`}>
          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Included with {requiredLabel}
          </h4>
          <ul className="space-y-1.5">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade Action Button */}
        <div className="pt-1 flex items-center justify-center">
          <button
            type="button"
            onClick={onUpgrade}
            className="px-5 py-2.5 rounded-lg bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Upgrade to {requiredLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
