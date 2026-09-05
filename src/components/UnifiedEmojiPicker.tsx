import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Smile, User, Dog, Pizza, Trophy, Plane, Lightbulb, Heart, Flag,
  Image as ImageIcon, Sticker, Search, X
} from 'lucide-react';
import { AppleEmoji } from './AppleEmoji';
import { AppleEmojiText } from './AppleEmojiText';
import rawCategories from '../utils/appleCategorizedEmojis.json';

interface EmojiItem {
  e: string;
  n: string;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: EmojiItem[];
}

const CATEGORIES_DATA = rawCategories as EmojiCategory[];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  smileys: Smile,
  people: User,
  animals: Dog,
  food: Pizza,
  activities: Trophy,
  travel: Plane,
  objects: Lightbulb,
  symbols: Heart,
  flags: Flag,
};

const CATEGORY_SHORT_NAMES: Record<string, string> = {
  smileys: 'Smileys',
  people: 'People',
  animals: 'Animals',
  food: 'Food',
  activities: 'Activity',
  travel: 'Travel',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
};

const DEFAULT_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Zyd2szdzdzYjlpd2VqdmlzZnRpdHdrZnpsaDZndndkNTNidXFlbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cPfGsK82yZUMCE7Aps/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZ5NGl2NWYxeGpoNTJ0NHJ4cXB0Nm8wdWJ5andwMjE3M24zbXZvaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lq0h93752f6J9tijrh/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHBpYmpqand2OW9nOW4ybWd6bHAyOHZreHNxeTl4ODllYWQ3czI3YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTVoMnN3bHhscGFnaTZjOHIyeW9qOWJ6ODJhczd6amhpN2ptczBwZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xezQGU5xCDJuCPe/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG4xdjRmcThiaXFiZWVrcTF5enJqZ3RwMnlsb2EydWZvbHhsbjh6eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kFfAakfU4lHsm1iL8E/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWFqZHltb2JvZ2szaThoNHl5eGszeXdpN2NhdmlwdGpmdmh2amV5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufdipQqU2lhNA4g/giphy.gif'
];

const MEGA_APPLE_STICKERS = [
  '🔥', '❤️', '😂', '🚀', '✨', '🎉', '😍', '💯', 
  '👑', '🥺', '🥳', '👏', '🫡', '🍕', '☕', '🐶', 
  '⚡️', '🌸', '🏆', '💎', '🍿', '🎮', '🦄', '🌈',
  '😎', '🥰', '🤩', '😻', '😹', '🤯', '💪', '🙌'
];

const EXPRESSIVE_STICKERS = [
  { text: '🔥 Super Hot!', tag: 'Hot' },
  { text: '✨ Pure Magic', tag: 'Magic' },
  { text: '❤️ Lots of Love', tag: 'Love' },
  { text: '🎉 Party Time', tag: 'Celebration' },
  { text: '🚀 To the Moon', tag: 'Hype' },
  { text: '💯 100% True', tag: 'Agree' },
  { text: '🫠 Melting Away', tag: 'Mood' },
  { text: '😻 Love Eyes', tag: 'Cat' },
  { text: '😹 Laugh Attack', tag: 'Funny' },
  { text: '🙌 Big Respect', tag: 'Respect' },
  { text: '🍕 Pizza Break', tag: 'Food' },
  { text: '☕ Coffee Time', tag: 'Morning' },
  { text: '👑 Pure Royalty', tag: 'VIP' },
  { text: '🥺 Pleaseee', tag: 'Cute' },
  { text: '🤯 Mind Blown', tag: 'Shock' },
  { text: '🫡 Understood!', tag: 'Roger' },
  { text: '💪 Stay Strong', tag: 'Power' },
  { text: '🌸 Sending Vibes', tag: 'Peace' },
  { text: '🐱 Paw Hug', tag: 'Warmth' },
  { text: '🙀 Shocked Cat', tag: 'Gasp' },
  { text: '😿 Teary Kitten', tag: 'Sad' },
  { text: '😎 Zero Stress', tag: 'Chill' }
];

interface UnifiedEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onSelectSticker: (stickerText: string) => void;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}

export const UnifiedEmojiPicker: React.FC<UnifiedEmojiPickerProps> = ({
  onSelectEmoji,
  onSelectGif,
  onSelectSticker,
  onClose,
  themeMode = 'dark'
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
  const [activeCategory, setActiveCategory] = useState<string>('smileys');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentCategoryObj = useMemo(() => {
    return CATEGORIES_DATA.find(c => c.id === activeCategory) || CATEGORIES_DATA[0] || { id: 'smileys', name: 'Smileys', icon: 'Smile', emojis: [] };
  }, [activeCategory]);

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return currentCategoryObj?.emojis || [];
    }

    const results: EmojiItem[] = [];
    const seen = new Set<string>();

    for (const cat of CATEGORIES_DATA) {
      for (const item of cat.emojis) {
        if (!seen.has(item.e)) {
          if (item.n.toLowerCase().includes(q) || item.e.includes(q)) {
            seen.add(item.e);
            results.push(item);
            if (results.length >= 150) break;
          }
        }
      }
      if (results.length >= 150) break;
    }
    return results;
  }, [searchQuery, currentCategoryObj]);

  const filteredStickers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return EXPRESSIVE_STICKERS;
    return EXPRESSIVE_STICKERS.filter(s => 
      s.text.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`absolute bottom-16 left-2 sm:left-4 z-50 w-[350px] sm:w-[410px] max-w-[94vw] rounded-3xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl ${
        themeMode === 'dark'
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100'
          : 'bg-white/95 border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Search Header */}
      <div className="p-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus-within:border-indigo-500/50 transition-colors">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder={
              activeTab === 'emoji' 
                ? 'Search 1,890+ Apple emojis...' 
                : activeTab === 'gif' 
                  ? 'Search animated GIFs...' 
                  : 'Search stickers...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="text-neutral-400 hover:text-neutral-200 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="h-72 overflow-y-auto p-3">
        {/* EMOJIS TAB */}
        {activeTab === 'emoji' && (
          <div className="space-y-2.5">
            {/* Category Icons Bar (Visible when not actively searching) */}
            {!searchQuery.trim() && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 border-b border-neutral-100 dark:border-neutral-800/70">
                {CATEGORIES_DATA.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.id] || Smile;
                  const isActive = activeCategory === cat.id;
                  const shortName = CATEGORY_SHORT_NAMES[cat.id] || cat.name;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold shadow-xs'
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/70'
                      }`}
                      title={`${cat.name} (${cat.emojis.length})`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[11px] hidden sm:inline">{shortName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category Header Label / Search Results Label */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 px-1">
              <span>
                {searchQuery.trim() 
                  ? `Search: "${searchQuery}" (${filteredEmojis.length} results)` 
                  : `${currentCategoryObj?.name || 'Emojis'} (${filteredEmojis.length})`}
              </span>
              <span className="text-[10px] text-neutral-500 font-normal">Official Apple iOS</span>
            </div>

            {/* Emoji Grid */}
            {filteredEmojis.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                No Apple emojis found for "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                {filteredEmojis.map((item, idx) => (
                  <button
                    key={`${item.e}-${idx}`}
                    onClick={() => onSelectEmoji(item.e)}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-125 transition-transform flex items-center justify-center cursor-pointer select-none group/emojibtn"
                    title={`${item.n} (${item.e})`}
                  >
                    <AppleEmoji emoji={item.e} size={28} className="w-7 h-7 object-contain pointer-events-none group-hover/emojibtn:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GIFS TAB */}
        {activeTab === 'gif' && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-2">Trending Animated GIFs</p>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_GIFS.map((gif, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectGif(gif)}
                  className="relative rounded-2xl overflow-hidden h-24 bg-neutral-100 dark:bg-neutral-800 cursor-pointer group/gif border border-neutral-200/50 dark:border-neutral-700/50 shadow-xs hover:shadow-md transition-all"
                >
                  <img
                    src={gif}
                    alt="Animated GIF"
                    className="w-full h-full object-cover group-hover/gif:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/gif:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full opacity-0 group-hover/gif:opacity-100 transition-opacity">
                      Send GIF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STICKERS TAB */}
        {activeTab === 'sticker' && (
          <div className="space-y-4">
            {/* Apple Mega Emoji Stickers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  🔥 Apple Mega Stickers
                </span>
                <span className="text-[10px] text-neutral-400">Tap to Send</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {MEGA_APPLE_STICKERS.map((st, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSticker(st)}
                    className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-transform active:scale-95 cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50 hover:shadow-sm"
                    title={`Send ${st} Sticker`}
                  >
                    <AppleEmoji emoji={st} size={40} className="w-10 h-10 object-contain pointer-events-none drop-shadow-sm" />
                  </button>
                ))}
              </div>
            </div>

            {/* Expressive Apple Reaction Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  ✨ Expressive Reaction Badges
                </span>
                <span className="text-[10px] text-neutral-400">Full Text + Apple Emoji</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredStickers.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectSticker(s.text)}
                    className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-100 transition-all active:scale-95 text-center cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <AppleEmojiText text={s.text} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Main Tab Navigation Bar */}
      <div className="p-2 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-950/80 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'emoji'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Smile className="h-4 w-4 text-amber-500" />
          <span>Emojis</span>
        </button>

        <button
          onClick={() => setActiveTab('gif')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gif'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <ImageIcon className="h-4 w-4 text-sky-500" />
          <span>GIFs</span>
        </button>

        <button
          onClick={() => setActiveTab('sticker')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sticker'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Sticker className="h-4 w-4 text-emerald-500" />
          <span>Stickers</span>
        </button>
      </div>
    </motion.div>
  );
};
