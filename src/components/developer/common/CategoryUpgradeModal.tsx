import React, { useState } from 'react';
import { X, Check, Zap, Building2, Layers } from 'lucide-react';
import { DeveloperCategoryTier } from '../../../types';

interface CategoryUpgradeModalProps {
  currentTier: DeveloperCategoryTier;
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (newTier: DeveloperCategoryTier) => Promise<void>;
  themeMode?: 'light' | 'dark';
}

export const CategoryUpgradeModal: React.FC<CategoryUpgradeModalProps> = ({
  currentTier,
  isOpen,
  onClose,
  onSelectCategory,
  themeMode = 'light'
}) => {
  const [selectedTier, setSelectedTier] = useState<DeveloperCategoryTier>(currentTier);
  const [isUpdating, setIsUpdating] = useState(false);
  const isDark = themeMode === 'dark';

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await onSelectCategory(selectedTier);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const categories = [
    {
      id: 'messenger' as DeveloperCategoryTier,
      icon: Zap,
      name: 'Messenger',
      tagline: 'Messaging and Bot API',
      description: 'Ideal for automated chatbots, direct messaging, user authentication, and webhooks.',
      features: [
        'Interactive Messenger Bots',
        'Carrier OTP Simulator',
        'Event Webhooks',
        'Multi-Language SDKs'
      ]
    },
    {
      id: 'business' as DeveloperCategoryTier,
      icon: Building2,
      name: 'Business',
      tagline: 'Business Suite and AI Copilot',
      popular: true,
      description: 'Designed for commerce operations with AI triage, support inbox, and spam protection.',
      features: [
        'AI Customer Copilot with BYOK',
        'Support Inbox and Shortcuts',
        'Bubble Rate Limits and Spam Shield',
        'Team Member Roles'
      ]
    },
    {
      id: 'hybrid' as DeveloperCategoryTier,
      icon: Layers,
      name: 'Hybrid',
      tagline: 'Omnichannel Enterprise Gateway',
      description: 'Unified architecture combining high-throughput bot messaging with business tools.',
      features: [
        'All Messenger Features',
        'All Business Suite Tools',
        'Unified Omnichannel Sync',
        'Unrestricted Quotas'
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full max-w-3xl rounded-2xl border p-6 space-y-5 animate-in zoom-in-95 duration-150 my-6 ${
        isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xl'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Change Operational Category
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select your plan to unlock matching features across the developer console.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categories Grid - Compact & Clean */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {categories.map((cat) => {
            const isSelected = selectedTier === cat.id;
            const isCurrent = currentTier === cat.id;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedTier(cat.id)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? isDark
                      ? 'border-[#533afd] bg-[#533afd]/10 ring-1 ring-[#533afd]'
                      : 'border-[#533afd] bg-[#533afd]/5 ring-1 ring-[#533afd]'
                    : isDark
                      ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-[#533afd] text-white' 
                        : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          Active
                        </span>
                      )}
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected 
                          ? 'border-[#533afd] bg-[#533afd] text-white' 
                          : isDark ? 'border-zinc-700' : 'border-zinc-300'
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {cat.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {cat.description}
                  </p>

                  <ul className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    {cat.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Selected: <strong className="capitalize text-zinc-900 dark:text-zinc-100">{selectedTier} Plan</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleConfirm}
              className="px-4 py-2 bg-[#533afd] hover:bg-[#432ec4] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isUpdating ? 'Updating...' : `Confirm ${selectedTier === currentTier ? 'Plan' : 'Switch'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
