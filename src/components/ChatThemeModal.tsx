import React, { useState } from 'react';
import { X, Check, Sparkles, Heart, Palette, MessageSquare, Briefcase, Trees, Moon, Lock, Send, Smile, Paperclip } from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState<'all' | 'minimal' | 'night' | 'warm' | 'nature' | 'executive' | 'classic'>('all');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentThemeId || 'minimal_clean_slate');
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Themes', icon: Palette },
    { id: 'minimal', label: 'Editorial & Minimal', icon: Sparkles },
    { id: 'night', label: 'Atmospheric & Night', icon: Moon },
    { id: 'warm', label: 'Warm & Romance', icon: Heart },
    { id: 'nature', label: 'Nature & Botany', icon: Trees },
    { id: 'executive', label: 'Executive & Studio', icon: Briefcase },
    { id: 'classic', label: 'Classic Messaging', icon: MessageSquare },
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <motion.div 
            key="chat-theme-modal-card"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/90 dark:bg-neutral-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>Chat Appearance & Wallpaper</span>
                    <span className="text-[11px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold px-2 py-0.5 rounded-md">
                      {CHAT_THEMES.length} Presets
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Select a theme for <span className="font-semibold text-neutral-800 dark:text-neutral-200">{activeChatName}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isOfficialChannel && (
              <div className="mx-4 mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-purple-700 dark:text-purple-300 font-medium">
                <Lock className="h-4 w-4 shrink-0 text-purple-500" />
                <span>System Channel Locked: Preset styling is locked for official broadcast channels.</span>
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 min-h-0">
              
              {/* Real-time Theme Live Preview Showcase (Bubbles + Message Composer Box) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Interactive Live Preview
                  </span>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    {previewTheme.name}
                  </span>
                </div>

                <div 
                  className={`rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-md flex flex-col justify-between min-h-[220px] overflow-hidden transition-all duration-300 ${previewTheme.bgClass}`}
                  style={previewTheme.bgStyle}
                >
                  {/* Preview Chat Header bar */}
                  <div className={`p-2.5 px-3.5 flex items-center justify-between border-b ${previewTheme.headerBorder} ${previewTheme.headerBg}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold">
                        Z
                      </div>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${previewTheme.headerText}`}>{previewTheme.name}</p>
                        <p className={`text-[9px] leading-tight ${previewTheme.headerSubtext}`}>Live Theme Synchronized</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900/10 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
                      {previewTheme.badge}
                    </span>
                  </div>

                  {/* Messages container */}
                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-center">
                    {/* Received Bubble */}
                    <div className="flex items-start max-w-[75%]">
                      <div className={`p-2.5 rounded-2xl rounded-tl-xs text-xs font-normal shadow-xs ${previewTheme.bubble.receivedBg} ${previewTheme.bubble.receivedText} ${previewTheme.bubble.borderStyle || ''}`}>
                        <p>How does the new theme appearance feel?</p>
                        <span className="block text-[9px] opacity-50 text-right mt-0.5">10:42 AM</span>
                      </div>
                    </div>

                    {/* Sent Bubble */}
                    <div className="flex items-end justify-end max-w-[80%] ml-auto">
                      <div className={`p-2.5 rounded-2xl rounded-tr-xs text-xs font-medium shadow-xs ${previewTheme.bubble.sentBg} ${previewTheme.bubble.sentText} ${previewTheme.bubble.borderStyle || ''}`}>
                        <p>Crisp typography and distinct message composer highlight! ✨</p>
                        <span className="block text-[9px] opacity-75 text-right mt-0.5">10:43 AM ✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Synchronized Live Message Box Preview */}
                  <div className={`p-2.5 border-t backdrop-blur-xl transition-all duration-300 ${previewTheme.composerBorder} ${previewTheme.composerBg}`}>
                    <div className={`flex items-center gap-2 p-1 pl-2.5 rounded-3xl transition-all duration-300 ${previewTheme.innerInputBg} ${previewTheme.innerInputBorder}`}>
                      <Smile className="h-4 w-4 text-neutral-400 shrink-0" />
                      <Paperclip className="h-4 w-4 text-neutral-400 shrink-0" />
                      <div className={`flex-1 text-xs select-none truncate py-1 ${previewTheme.innerInputText}`}>
                        Message box adapts dynamically...
                      </div>
                      <div className={`p-2 rounded-full shrink-0 shadow-xs flex items-center justify-center ${previewTheme.accentBg} ${previewTheme.accentText}`}>
                        <Send className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Themes Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Curated Presets ({filteredThemes.length})
                  </span>
                  <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">
                    Tap any preset to preview
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
                            ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-white dark:bg-neutral-800'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40'
                        }`}
                      >
                        {/* Background Thumbnail gradient */}
                        <div 
                          className={`absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity bg-gradient-to-br ${theme.previewGradient}`} 
                        />

                        {/* Top: Badge + Selection check */}
                        <div className="relative z-10 flex justify-between items-start">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs border border-white/20">
                            {theme.badge}
                          </span>

                          {isSelected && (
                            <div className="p-1 rounded-full bg-indigo-600 text-white shadow-xs">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        {/* Preview sent pill indicator */}
                        <div className="relative z-10 my-2 flex items-center gap-1.5">
                          <div className={`h-2.5 w-10 rounded-full shadow-xs ${theme.bubble.sentBg}`} />
                          <div className={`h-2.5 w-4 rounded-full shadow-xs ${theme.accentBg}`} />
                        </div>

                        {/* Title & Description */}
                        <div className="relative z-10 text-left">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {theme.name}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-snug">
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
            <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded border-neutral-300 dark:border-neutral-700 accent-indigo-600 cursor-pointer"
                />
                <span>Set as default theme for all chats</span>
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
