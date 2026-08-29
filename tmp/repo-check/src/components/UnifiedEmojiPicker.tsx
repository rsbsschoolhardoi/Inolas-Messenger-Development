import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smile, Image as ImageIcon, Sticker, Search, X, Heart, Dog, Pizza, Rocket, Flame, Sparkles } from 'lucide-react';

interface UnifiedEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onSelectSticker: (stickerText: string) => void;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}

// Zenoa Rich Categorized Emojis
const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: Sparkles,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🥹', '🙂', '🙃', '🫠', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🫣',
      '🤭', '🫢', '🫡', '🤫', '🫠', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒',
      '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
      '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯',
      '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞'
    ]
  },
  {
    id: 'love',
    name: 'Love & Hearts',
    icon: Heart,
    emojis: [
      '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🖤', '🩶', '🤍', '🤎', '💖', '💗', '💓',
      '💞', '💕', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '💋', '💌', '💘', '💝', '💑', '👩‍❤️‍💋‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '🫂'
    ]
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: Dog,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
      '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟',
      '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦪', '🦑', '🦐', '🦞', '🦀',
      '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅', '🐆', '🦓', '🫏', '🦍', '🦧'
    ]
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: Pizza,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍',
      '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅',
      '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟',
      '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗',
      '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤'
    ]
  },
  {
    id: 'activities',
    name: 'Activities & Objects',
    icon: Rocket,
    emojis: [
      '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑',
      '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♂️', '🤼‍♂️', '🤸‍♂️', '⛹️‍♂️', '🤺', '🤾‍♂️', '🏌️‍♂️', '🏇', '🧘‍♂️',
      '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪆', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄️'
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols & Flags',
    icon: Flame,
    emojis: [
      '🔥', '⚡️', '✨', '🌟', '💫', '💥', '💢', '💦', '💧', '💤', '🌈', '🎉', '🎊', '🎈', '💬',
      '💭', '💯', '⭕️', '❌', '🛑', '⛔️', '⚠️', '❇️', '🌐', '🏁', '🚩', '🎌', '🇮🇳', '🇺🇸', '🇬🇧',
      '🇯🇵', '🇨🇦', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇧🇷', '🇦🇺', '🇰🇷', '🇨🇳', '🇲🇽', '🇷🇺', '🇸🇦', '🇦🇪', '🇿🇦'
    ]
  }
];

const DEFAULT_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Zyd2szdzdzYjlpd2VqdmlzZnRpdHdrZnpsaDZndndkNTNidXFlbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cPfGsK82yZUMCE7Aps/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZ5NGl2NWYxeGpoNTJ0NHJ4cXB0Nm8wdWJ5andwMjE3M24zbXZvaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lq0h93752f6J9tijrh/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHBpYmpqand2OW9nOW4ybWd6bHAyOHZreHNxeTl4ODllYWQ3czI3YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTVoMnN3bHhscGFnaTZjOHIyeW9qOWJ6ODJhczd6amhpN2ptczBwZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xezQGU5xCDJuCPe/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG4xdjRmcThiaXFiZWVrcTF5enJqZ3RwMnlsb2EydWZvbHhsbjh6eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kFfAakfU4lHsm1iL8E/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWFqZHltb2JvZ2szaThoNHl5eGszeXdpN2NhdmlwdGpmdmh2amV5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26ufdipQqU2lhNA4g/giphy.gif'
];

const STICKER_PACKS = [
  { name: 'Cute Cat Reactions', items: ['🐱 Paw Hug', '😻 Love Eyes', '🙀 Shocked Cat', '😿 Teary Kitten', '😼 Cool Cat', '😴 Sleeping Kitty'] },
  { name: 'Zenoa Expressive', items: ['🔥 Super Hot!', '✨ Pure Magic', '❤️ Lots of Love', '🎉 Party Time', '🚀 To the Moon', '👏 Round of Applause'] },
  { name: 'Daily Moods', items: ['😎 Zero Stress', '☕ Coffee First', '🫠 Melting Away', '💯 100% True', '🤯 Mind Blown', '🙌 Respect!'] }
];

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

  const currentCategoryObj = EMOJI_CATEGORIES.find(c => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  const filteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(searchQuery.trim()))
    : currentCategoryObj.emojis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`absolute bottom-16 left-2 sm:left-4 z-50 w-[340px] sm:w-[380px] max-w-[92vw] rounded-3xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl ${
        themeMode === 'dark'
          ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100'
          : 'bg-white/95 border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Header Search & Close */}
      <div className="p-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus-within:border-indigo-500/50 transition-colors">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder={activeTab === 'emoji' ? 'Search emojis...' : activeTab === 'gif' ? 'Search animated GIFs...' : 'Search stickers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-200">
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
      <div className="h-64 overflow-y-auto p-3">
        {activeTab === 'emoji' && (
          <div className="space-y-3">
            {/* Category Selector Bar (If no active search) */}
            {!searchQuery && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                {EMOJI_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold shadow-xs'
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      title={cat.name}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[11px] hidden sm:inline">{cat.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Emoji Grid */}
            <div className="grid grid-cols-7 gap-1">
              {filteredEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectEmoji(emoji)}
                  className="text-xl p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-125 transition-transform flex items-center justify-center cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {activeTab === 'sticker' && (
          <div className="space-y-4">
            {STICKER_PACKS.map((pack, pIdx) => (
              <div key={pIdx} className="space-y-1.5">
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">{pack.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {pack.items.map((st, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => onSelectSticker(st)}
                      className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate transition-all active:scale-95 text-center cursor-pointer border border-neutral-200/50 dark:border-neutral-700/50"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Main Tab Navigation Bar */}
      <div className="p-2 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-950/80 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
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
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
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
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
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
