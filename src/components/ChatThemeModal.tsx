import React, { useState } from 'react';
import { X, Check, Sparkles, Heart, Cat, Palette, MessageSquare, Sun, Moon, Lock } from 'lucide-react';
import { CHAT_THEMES, ChatTheme, getThemeById } from '../chatThemes';
import { motion, AnimatePresence } from 'motion/react';

interface ChatThemeModalProps {
  isOpen: boolean;
  activeChatName: string;
  currentThemeId: string;
  isOfficialChannel?: boolean;
  onClose: () => void;
  onSelectTheme: (themeId: string, applyToAll?: boolean) => void;
}

export const ChatThemeModal: React.FC<ChatThemeModalProps> = ({
  isOpen,
  activeChatName,
  currentThemeId,
  isOfficialChannel = false,
  onClose,
  onSelectTheme
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'minimal' | 'love' | 'animals' | 'classic' | 'aesthetic'>('all');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentThemeId || 'minimal_clean_slate');
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Themes', icon: Palette },
    { id: 'minimal', label: 'Minimal & Zen', icon: Sparkles },
    { id: 'love', label: 'Love & Hearts', icon: Heart },
    { id: 'animals', label: 'Cute Animals', icon: Cat },
    { id: 'classic', label: 'WhatsApp Classic', icon: MessageSquare },
  ];

  const filteredThemes = activeCategory === 'all' 
    ? CHAT_THEMES 
    : CHAT_THEMES.filter(t => t.category === activeCategory);

  const previewTheme = getThemeById(selectedThemeId);

  const handleApply = () => {
    onSelectTheme(selectedThemeId, applyToAll);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fade-in">
          <motion.div 
            key="chat-theme-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/80 dark:bg-neutral-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Wallpapers & Chat Themes</span>
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                    HD Gallery
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Customizing wallpaper and chat bubble colors for <span className="font-bold text-neutral-800 dark:text-neutral-200">{activeChatName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isOfficialChannel && (
            <div className="mx-4 mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-purple-700 dark:text-purple-300 font-semibold shadow-xs">
              <Lock className="h-4 w-4 shrink-0 text-purple-500" />
              <span>Official Channel Theme Locked: Theme modification is disabled for official system broadcast channels.</span>
            </div>
          )}

          {/* Category Tabs */}
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-neutral-900">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-102'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body: Live Preview & Theme Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
            
            {/* Live Chat Preview Banner */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                Live Theme Preview
              </span>
              <div 
                className={`rounded-2xl p-4 transition-all duration-300 border border-black/10 dark:border-white/10 shadow-inner flex flex-col justify-end min-h-[140px] space-y-2.5 overflow-hidden ${previewTheme.bgClass}`}
                style={previewTheme.bgStyle}
              >
                {/* Received Bubble Preview */}
                <div className="flex items-start max-w-[75%]">
                  <div className={`p-2.5 rounded-2xl rounded-tl-xs text-xs font-medium shadow-xs ${previewTheme.bubble.receivedBg || 'bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white'}`}>
                    <span>Hey! Look at this gorgeous new chat wallpaper! ✨</span>
                    <span className="block text-[9px] opacity-60 text-right mt-1">10:42 AM</span>
                  </div>
                </div>

                {/* Sent Bubble Preview */}
                <div className="flex items-end justify-end max-w-[80%] ml-auto">
                  <div className={`p-2.5 rounded-2xl rounded-tr-xs text-xs font-medium ${previewTheme.bubble.sentBg} ${previewTheme.bubble.sentText} ${previewTheme.bubble.borderStyle || ''}`}>
                    <span>Wow, it automatically matches the chat bubble color! Beautiful! ❤️</span>
                    <span className="block text-[9px] opacity-80 text-right mt-1">10:43 AM ✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Themes Grid */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Select Wallpaper Preset ({filteredThemes.length})
                </span>
                <span className="text-[10px] text-indigo-500 font-semibold">
                  Tap to preview
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredThemes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`relative rounded-2xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[110px] group overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg scale-[1.02]'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40'
                      }`}
                    >
                      {/* Background Gradient Thumbnail */}
                      <div 
                        className={`absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-gradient-to-br ${theme.previewGradient}`} 
                      />

                      {/* Header with badge */}
                      <div className="relative z-10 flex justify-between items-start">
                        {theme.badge ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs border border-white/20">
                            {theme.badge}
                          </span>
                        ) : <span />}

                        {isSelected && (
                          <div className="p-1 rounded-full bg-indigo-600 text-white shadow-xs">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Preview bubble representation */}
                      <div className="relative z-10 my-2 space-y-1">
                        <div className={`h-2.5 w-12 rounded-full ${theme.bubble.sentBg}`} />
                      </div>

                      {/* Title & Description */}
                      <div className="relative z-10 text-left">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {theme.name}
                        </p>
                        <p className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-neutral-300 dark:border-neutral-700 accent-indigo-600 cursor-pointer"
              />
              <span>Set as default wallpaper for all chats</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleApply}
                disabled={isOfficialChannel}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isOfficialChannel
                    ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-600/20'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>{isOfficialChannel ? 'Theme Locked' : 'Apply Theme'}</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
