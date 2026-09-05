import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Smile, User, Dog, Pizza, Trophy, Plane, Lightbulb, Heart, Flag,
  Search, X
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

// Category icons for the sleek bottom navigation bar
const CATEGORY_ITEMS: { id: string; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'smileys', name: 'Smileys', icon: Smile },
  { id: 'people', name: 'People', icon: User },
  { id: 'animals', name: 'Animals', icon: Dog },
  { id: 'food', name: 'Food', icon: Pizza },
  { id: 'activities', name: 'Activities', icon: Trophy },
  { id: 'travel', name: 'Travel', icon: Plane },
  { id: 'objects', name: 'Objects', icon: Lightbulb },
  { id: 'symbols', name: 'Symbols', icon: Heart },
  { id: 'flags', name: 'Flags', icon: Flag },
];

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
  onClose?: () => void;
  themeMode?: 'light' | 'dark';
  isDocked?: boolean;
}

export const UnifiedEmojiPicker: React.FC<UnifiedEmojiPickerProps> = ({
  onSelectEmoji,
  onSelectGif,
  onSelectSticker,
  onClose,
  themeMode = 'dark',
  isDocked = true
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
  const [activeCategory, setActiveCategory] = useState<string>('smileys');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const manualScrollTimerRef = useRef<any>(null);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Search filtered results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const results: EmojiItem[] = [];
    const seen = new Set<string>();

    for (const cat of CATEGORIES_DATA) {
      for (const item of cat.emojis) {
        if (!seen.has(item.e)) {
          if (item.n.toLowerCase().includes(q) || item.e.includes(q)) {
            seen.add(item.e);
            results.push(item);
            if (results.length >= 100) break;
          }
        }
      }
      if (results.length >= 100) break;
    }
    return results;
  }, [searchQuery]);

  const filteredStickers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return EXPRESSIVE_STICKERS;
    return EXPRESSIVE_STICKERS.filter(s => 
      s.text.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Real-time scroll listener for continuous category switching
  const handleScroll = useCallback(() => {
    if (isUserScrollingRef.current || !scrollContainerRef.current || searchQuery) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;

    let currentActive = CATEGORIES_DATA[0].id;
    for (const cat of CATEGORIES_DATA) {
      const el = document.getElementById(`cat-section-${cat.id}`);
      if (el) {
        if (el.offsetTop - container.offsetTop <= scrollTop + 60) {
          currentActive = cat.id;
        }
      }
    }
    setActiveCategory(prev => (prev !== currentActive ? currentActive : prev));
  }, [searchQuery]);

  // Scroll to category smoothly
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    if (!scrollContainerRef.current) return;

    isUserScrollingRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);

    const el = document.getElementById(`cat-section-${catId}`);
    if (el && scrollContainerRef.current) {
      const topPos = el.offsetTop - scrollContainerRef.current.offsetTop;
      scrollContainerRef.current.scrollTo({
        top: topPos,
        behavior: 'smooth'
      });
    }

    manualScrollTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 450);
  };

  return (
    <div
      className={`w-full flex flex-col overflow-hidden transition-all select-none ${
        isDocked 
          ? 'h-[300px] sm:h-[320px] border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg' 
          : 'absolute bottom-16 left-2 sm:left-4 z-50 w-[350px] sm:w-[410px] max-w-[94vw] h-[330px] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white dark:bg-neutral-900'
      } ${
        themeMode === 'dark' ? 'text-neutral-100' : 'text-neutral-900'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Sleek, Compact Top Navigation Bar */}
      <div className="px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-950/40 flex items-center justify-between shrink-0 min-h-[40px]">
        {isSearchOpen ? (
          /* Expandable sleek search input */
          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 text-xs transition-all">
            <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                activeTab === 'emoji' 
                  ? 'Search emojis...' 
                  : activeTab === 'gif' 
                    ? 'Search GIFs...' 
                    : 'Search stickers...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-neutral-400 text-xs py-0.5"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="text-neutral-400 hover:text-neutral-200 p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 text-[11px] font-medium ml-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Sleek compact parts: Search icon followed by Emojis, GIFs, Stickers */
          <div className="flex items-center gap-1.5 flex-1">
            {/* Search Trigger Button at the very front */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Compact Emojis Tab */}
            <button
              onClick={() => setActiveTab('emoji')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'emoji'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
              }`}
            >
              Emojis
            </button>

            {/* Compact GIFs Tab */}
            <button
              onClick={() => setActiveTab('gif')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'gif'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
              }`}
            >
              GIFs
            </button>

            {/* Compact Stickers Tab */}
            <button
              onClick={() => setActiveTab('sticker')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'sticker'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
              }`}
            >
              Stickers
            </button>
          </div>
        )}

        {/* Optional Close Button */}
        {onClose && !isSearchOpen && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0 ml-1 cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-1.5 overscroll-contain relative scroll-smooth"
      >
        {/* EMOJIS VIEW */}
        {activeTab === 'emoji' && (
          <>
            {searchResults !== null ? (
              /* Search Results Grid */
              searchResults.length > 0 ? (
                <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1 pt-1">
                  {searchResults.map((item, idx) => (
                    <button
                      key={`s-${item.e}-${idx}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelectEmoji(item.e)}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-110 transition-transform flex items-center justify-center cursor-pointer select-none"
                      title={item.n}
                    >
                      <AppleEmoji emoji={item.e} size={28} className="w-7 h-7 object-contain pointer-events-none" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No emojis found.
                </div>
              )
            ) : (
              /* Continuous Scroll: All Categories in One Seamless Flow */
              <div className="space-y-3 pb-2">
                {CATEGORIES_DATA.map((cat) => (
                  <div key={cat.id} id={`cat-section-${cat.id}`} className="scroll-mt-1">
                    {/* Minimalist, clean category section divider */}
                    <div className="pt-1 pb-1 px-1 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        {cat.name}
                      </span>
                      <div className="flex-1 h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
                    </div>

                    {/* Category Emojis Grid - Clean, pure default emojis with NO dots */}
                    <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1">
                      {cat.emojis.map((item, idx) => (
                        <button
                          key={`${cat.id}-${item.e}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onSelectEmoji(item.e)}
                          className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-110 transition-transform flex items-center justify-center cursor-pointer select-none"
                          title={item.n}
                        >
                          <AppleEmoji emoji={item.e} size={28} className="w-7 h-7 object-contain pointer-events-none" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* GIFS VIEW */}
        {activeTab === 'gif' && (
          <div className="p-1">
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_GIFS.map((gif, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectGif(gif)}
                  className="relative rounded-xl overflow-hidden h-24 bg-neutral-100 dark:bg-neutral-800 cursor-pointer group/gif border border-neutral-200/50 dark:border-neutral-700/50 shadow-xs hover:shadow-md transition-all"
                >
                  <img
                    src={gif}
                    alt="Animated GIF"
                    className="w-full h-full object-cover group-hover/gif:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/gif:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full">Send</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STICKERS VIEW */}
        {activeTab === 'sticker' && (
          <div className="space-y-3 p-1">
            {/* Mega Apple Stickers */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MEGA_APPLE_STICKERS.map((st, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectEmoji(st)}
                  className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-110 transition-transform flex items-center justify-center cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50"
                >
                  <AppleEmoji emoji={st} size={36} className="w-9 h-9 object-contain pointer-events-none drop-shadow-sm" />
                </button>
              ))}
            </div>

            {/* Expressive Reaction Badges */}
            <div className="grid grid-cols-2 gap-2">
              {filteredStickers.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectSticker(s.text)}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-100 transition-all active:scale-95 text-center cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <AppleEmojiText text={s.text} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sleek, Compact Category Navigation Bar AT THE BOTTOM */}
      {activeTab === 'emoji' && !searchQuery.trim() && (
        <div className="flex items-center justify-between px-2 py-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-950/60 shrink-0 min-h-[36px]">
          {CATEGORY_ITEMS.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => scrollToCategory(cat.id)}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs scale-105'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
                title={cat.name}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
