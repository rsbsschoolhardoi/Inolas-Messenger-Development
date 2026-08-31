import { LEAVES_PATTERN, HEARTS_PATTERN, PAWS_PATTERN, PANDA_PATTERN, STARS_PATTERN, WHATSAPP_DOODLE, ZENOA_AESTHETIC_MICRO_PATTERN } from './assets/wallpapers';

export interface ChatTheme {
  id: string;
  name: string;
  category: 'minimal' | 'love' | 'animals' | 'aesthetic' | 'classic';
  description: string;
  bgClass: string;
  bgStyle?: React.CSSProperties;
  bubble: {
    sentBg: string;
    sentText: string;
    receivedBg: string;
    receivedText: string;
    borderStyle?: string;
    isSentDark?: boolean;
    isReceivedDark?: boolean;
    subtextSent?: string;
    subtextReceived?: string;
    linkSent?: string;
    linkReceived?: string;
    cardBgSent?: string;
    cardBgReceived?: string;
  };
  previewGradient: string;
  badge: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  // --- MINIMAL / CLEAN ---
  {
    id: 'minimal_clean_slate',
    name: 'Clean Slate',
    category: 'minimal',
    description: 'Crisp, eye-comforting neutral canvas with subtle aesthetic micro-motifs.',
    bgClass: 'bg-[#f8f9fa] dark:bg-[#0d1117] text-neutral-900 dark:text-neutral-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '72px 72px',
    },
    bubble: {
      sentBg: 'bg-black dark:bg-[#e4e4e7]',
      sentText: 'text-white dark:text-black',
      receivedBg: 'bg-white dark:bg-[#18181b]',
      receivedText: 'text-neutral-900 dark:text-neutral-200',
      borderStyle: 'border border-neutral-200/60 dark:border-neutral-800',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-white/60 dark:text-black/60',
      subtextReceived: 'text-neutral-400 dark:text-neutral-500',
      linkSent: 'text-neutral-300 dark:text-neutral-700 underline font-semibold hover:opacity-80',
      linkReceived: 'text-blue-500 underline hover:opacity-80',
      cardBgSent: 'bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20 text-white dark:text-black',
      cardBgReceived: 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
    },
    previewGradient: 'from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950',
    badge: '💎 Slate'
  },
  {
    id: 'minimal_sage_shadow',
    name: 'Sage Shadows',
    category: 'minimal',
    description: 'Deep, resting sage tones with soft leaf patterns.',
    bgClass: 'bg-[#0f1412] text-emerald-50',
    bgStyle: {
      backgroundColor: '#0f1412',
      backgroundImage: LEAVES_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#1b3b2d]',
      sentText: 'text-[#e2f0e9]',
      receivedBg: 'bg-[#18211e]',
      receivedText: 'text-[#d6e3dc]',
      borderStyle: 'border border-[#234536]/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#92b5a5]',
      subtextReceived: 'text-[#819e8f]',
      linkSent: 'text-[#6ee7b7] underline hover:opacity-80',
      linkReceived: 'text-[#34d399] underline hover:opacity-80',
      cardBgSent: 'bg-black/25 border border-emerald-400/20 text-[#e2f0e9]',
      cardBgReceived: 'bg-[#162d21] border border-emerald-800/60 text-[#d6e3dc]'
    },
    previewGradient: 'from-[#0f1412] to-[#18211e]',
    badge: '🌿 Sage'
  },
  
  // --- LOVE & ROMANCE ---
  {
    id: 'love_velvet_crimson',
    name: 'Velvet Crimson',
    category: 'love',
    description: 'Rich, muted crimson canvas with highly legible ivory text.',
    bgClass: 'bg-[#140b0e] text-[#fce8ed]',
    bgStyle: {
      backgroundColor: '#140b0e',
      backgroundImage: HEARTS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#6b1c31]',
      sentText: 'text-[#fce8ed]',
      receivedBg: 'bg-[#1f1115]',
      receivedText: 'text-[#f5d0da]',
      borderStyle: 'border border-[#80243d]/30',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#d194a5]',
      subtextReceived: 'text-[#b37a89]',
      linkSent: 'text-[#fca5a5] underline hover:opacity-80',
      linkReceived: 'text-[#f87171] underline hover:opacity-80',
      cardBgSent: 'bg-black/25 border border-[#80243d]/20 text-[#fce8ed]',
      cardBgReceived: 'bg-[#29171e] border border-[#382029] text-[#f5d0da]'
    },
    previewGradient: 'from-[#140b0e] to-[#29171e]',
    badge: '❤️ Velvet'
  },
  {
    id: 'love_pastel_blush',
    name: 'Blush Ivory',
    category: 'love',
    description: 'Gentle, warm ivory background with soft contrasting bubbles.',
    bgClass: 'bg-[#fcfafb] text-[#2d1b22]',
    bgStyle: {
      backgroundColor: '#fcfafb',
      backgroundImage: HEARTS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#3b232c]',
      sentText: 'text-[#fdfcfd]',
      receivedBg: 'bg-[#ffffff]',
      receivedText: 'text-[#2d1b22]',
      borderStyle: 'border border-[#e8dfe3]',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-[#a18c94]',
      subtextReceived: 'text-[#87787f]',
      linkSent: 'text-[#f9a8d4] underline hover:opacity-80',
      linkReceived: 'text-[#be185d] underline hover:opacity-80',
      cardBgSent: 'bg-black/25 border border-white/10 text-white',
      cardBgReceived: 'bg-[#faf7f8] border border-[#e8dfe3] text-[#2d1b22]'
    },
    previewGradient: 'from-[#fcfafb] to-[#f4ebef]',
    badge: '🌸 Blush'
  },

  // --- CUTE ANIMALS ---
  {
    id: 'animals_playful_paws',
    name: 'Mocha Paws',
    category: 'animals',
    description: 'Soothing mocha canvas with warm, high-contrast amber texts.',
    bgClass: 'bg-[#141210] text-[#fdf8f4]',
    bgStyle: {
      backgroundColor: '#141210',
      backgroundImage: PAWS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#783e19]',
      sentText: 'text-[#fefbf9]',
      receivedBg: 'bg-[#211d1a]',
      receivedText: 'text-[#f5ece5]',
      borderStyle: 'border border-[#944e23]/30',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#d4af96]',
      subtextReceived: 'text-[#a89689]',
      linkSent: 'text-[#fdba74] underline hover:opacity-80',
      linkReceived: 'text-[#fb923c] underline hover:opacity-80',
      cardBgSent: 'bg-black/25 border border-[#944e23]/20 text-white',
      cardBgReceived: 'bg-[#2c2622] border border-[#3a322c] text-[#f5ece5]'
    },
    previewGradient: 'from-[#141210] to-[#211d1a]',
    badge: '🐾 Mocha'
  },
  
  // --- CLASSIC WHATSAPP ---
  {
    id: 'whatsapp_dark_emerald',
    name: 'Classic Dark',
    category: 'classic',
    description: 'Authentic dark layout with signature doodle and precise legibility.',
    bgClass: 'bg-[#0b141a] text-[#e9edef]',
    bgStyle: {
      backgroundColor: '#0b141a',
      backgroundImage: WHATSAPP_DOODLE,
    },
    bubble: {
      sentBg: 'bg-[#005c4b]',
      sentText: 'text-[#e9edef]',
      receivedBg: 'bg-[#202c33]',
      receivedText: 'text-[#e9edef]',
      borderStyle: 'border border-[#007a64]/20',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#8696a0]',
      subtextReceived: 'text-[#8696a0]',
      linkSent: 'text-[#53bdeb] underline hover:opacity-80',
      linkReceived: 'text-[#53bdeb] underline hover:opacity-80',
      cardBgSent: 'bg-black/20 border border-[#007a64]/40 text-[#e9edef]',
      cardBgReceived: 'bg-[#182229] border border-[#2a3942] text-[#e9edef]'
    },
    previewGradient: 'from-[#0b141a] to-[#202c33]',
    badge: 'Chat Dark'
  },

  // --- AESTHETIC ATMOSPHERIC ---
  {
    id: 'aesthetic_starlight',
    name: 'Midnight Stars',
    category: 'aesthetic',
    description: 'Deep celestial tones with extremely high legibility on text.',
    bgClass: 'bg-[#06080e] text-[#f1f3fa]',
    bgStyle: {
      backgroundColor: '#06080e',
      backgroundImage: STARS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#1e3a8a]',
      sentText: 'text-[#fdfdff]',
      receivedBg: 'bg-[#131722]',
      receivedText: 'text-[#e2e8f0]',
      borderStyle: 'border border-[#2563eb]/20',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#93c5fd]',
      subtextReceived: 'text-[#94a3b8]',
      linkSent: 'text-[#60a5fa] underline hover:opacity-80',
      linkReceived: 'text-[#3b82f6] underline hover:opacity-80',
      cardBgSent: 'bg-black/30 border border-[#2563eb]/20 text-white',
      cardBgReceived: 'bg-[#1b2030] border border-[#242b40] text-[#e2e8f0]'
    },
    previewGradient: 'from-[#06080e] to-[#131722]',
    badge: '✨ Stars'
  }
];

export const DEFAULT_THEME_ID = 'minimal_clean_slate';

export function getThemeById(id?: string): ChatTheme {
  const found = CHAT_THEMES.find(t => t.id === id);
  return found || CHAT_THEMES[0];
}
