export interface ChatTheme {
  id: string;
  name: string;
  category: 'minimal' | 'love' | 'animals' | 'classic' | 'aesthetic';
  description: string;
  bgClass: string;
  bgStyle?: React.CSSProperties;
  bubble: {
    sentBg: string;
    sentText: string;
    receivedBg?: string;
    receivedText?: string;
    borderStyle?: string;
  };
  previewGradient: string;
  badge?: string;
}

// Subtle, organic SVG background patterns with randomly scattered elements
const HEARTS_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23f43f5e'><path transform='translate(20,18) rotate(-15) scale(0.7)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.14'/><path transform='translate(115,25) rotate(22) scale(0.9)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.1'/><path transform='translate(65,85) rotate(-8) scale(1.1)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.12'/><path transform='translate(135,115) rotate(18) scale(0.6)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.15'/><path transform='translate(18,125) rotate(12) scale(0.8)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.1'/></g></svg>")`;

const PAWS_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23f97316' fill-opacity='0.12'><g transform='translate(25,20) rotate(-22)'><circle cx='12' cy='15' r='6'/><circle cx='5' cy='6' r='2.5'/><circle cx='11' cy='3' r='2.5'/><circle cx='17' cy='3' r='2.5'/><circle cx='22' cy='6' r='2.5'/></g><g transform='translate(115,35) rotate(35)'><circle cx='12' cy='15' r='5'/><circle cx='5' cy='6' r='2'/><circle cx='11' cy='3' r='2'/><circle cx='17' cy='3' r='2'/><circle cx='22' cy='6' r='2'/></g><g transform='translate(65,95) rotate(-10)'><circle cx='12' cy='15' r='7'/><circle cx='5' cy='6' r='2.8'/><circle cx='11' cy='3' r='2.8'/><circle cx='17' cy='3' r='2.8'/><circle cx='22' cy='6' r='2.8'/></g><g transform='translate(130,120) rotate(15)'><circle cx='12' cy='15' r='5.5'/><circle cx='5' cy='6' r='2.2'/><circle cx='11' cy='3' r='2.2'/><circle cx='17' cy='3' r='2.2'/><circle cx='22' cy='6' r='2.2'/></g><g transform='translate(15,110) rotate(42)'><circle cx='12' cy='15' r='5'/><circle cx='5' cy='6' r='2'/><circle cx='11' cy='3' r='2'/><circle cx='17' cy='3' r='2'/><circle cx='22' cy='6' r='2'/></g></g></svg>")`;

const PANDA_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%2310b981'><g transform='translate(30,25) rotate(-12)'><circle cx='12' cy='12' r='8' fill-opacity='0.08'/><circle cx='6' cy='5' r='3' fill-opacity='0.12'/><circle cx='18' cy='5' r='3' fill-opacity='0.12'/></g><g transform='translate(120,40) rotate(28)'><circle cx='12' cy='12' r='9' fill-opacity='0.08'/><circle cx='6' cy='5' r='3.2' fill-opacity='0.12'/><circle cx='18' cy='5' r='3.2' fill-opacity='0.12'/></g><g transform='translate(70,100) rotate(-18)'><circle cx='12' cy='12' r='10' fill-opacity='0.08'/><circle cx='6' cy='5' r='3.5' fill-opacity='0.12'/><circle cx='18' cy='5' r='3.5' fill-opacity='0.12'/></g><path transform='translate(10,110) rotate(45)' d='M0 0 h30 v2 h-30 z' fill-opacity='0.1'/><path transform='translate(125,120) rotate(-25)' d='M0 0 h25 v2 h-25 z' fill-opacity='0.1'/></g></svg>")`;

const WHATSAPP_DOODLE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g stroke='%2325D366' stroke-opacity='0.12' stroke-width='1.8' fill='none'><rect transform='translate(20,20) rotate(-15)' x='0' y='0' width='14' height='10' rx='2'/><circle transform='translate(110,30) rotate(20)' cx='8' cy='8' r='7'/><path transform='translate(60,85) rotate(-8)' d='M0 0 l12 12 M12 0 l-12 12'/><path transform='translate(130,110) rotate(30)' d='M0 5 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'/><path transform='translate(25,120) rotate(-25)' d='M0 0 h16 M8 -8 v16'/></g></svg>")`;

const STARS_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23818cf8'><polygon transform='translate(30,20) rotate(15) scale(0.8)' points='10,0 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7' fill-opacity='0.15'/><polygon transform='translate(120,35) rotate(-22) scale(1.1)' points='10,0 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7' fill-opacity='0.12'/><polygon transform='translate(70,95) rotate(32) scale(0.9)' points='10,0 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7' fill-opacity='0.14'/><circle cx='20' cy='130' r='2' fill-opacity='0.25'/><circle cx='140' cy='120' r='1.5' fill-opacity='0.25'/><circle cx='85' cy='25' r='1.8' fill-opacity='0.2'/></g></svg>")`;

const LEAVES_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23059669' fill-opacity='0.1'><path transform='translate(20,15) rotate(-35) scale(0.8)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/><path transform='translate(110,30) rotate(45) scale(1)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/><path transform='translate(65,90) rotate(-15) scale(1.2)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/><path transform='translate(130,125) rotate(25) scale(0.7)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/></g></svg>")`;

export const CHAT_THEMES: ChatTheme[] = [
  // --- MINIMAL & AESTHETIC (DEFAULT) ---
  {
    id: 'minimal_clean_slate',
    name: 'Minimal Obsidian',
    category: 'minimal',
    description: 'Sleek dark obsidian with refined indigo accents',
    bgClass: 'bg-neutral-950 text-neutral-100',
    bgStyle: {
      backgroundColor: '#0a0a0b',
    },
    bubble: {
      sentBg: 'bg-indigo-600 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-neutral-900 text-neutral-100',
      borderStyle: 'border border-neutral-800',
    },
    previewGradient: 'from-neutral-900 to-black',
    badge: 'Minimal'
  },
  {
    id: 'minimal_warm_linen',
    name: 'Warm Linen',
    category: 'minimal',
    description: 'Soft off-white canvas with dark slate chat bubbles',
    bgClass: 'bg-[#f8f7f4] text-neutral-900',
    bgStyle: {
      backgroundColor: '#f8f7f4',
    },
    bubble: {
      sentBg: 'bg-neutral-900 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-white text-neutral-900',
      borderStyle: 'border border-neutral-200',
    },
    previewGradient: 'from-stone-200 to-amber-50',
    badge: 'Clean'
  },
  {
    id: 'minimal_zen_sage',
    name: 'Botanical Sage',
    category: 'minimal',
    description: 'Muted sage green canvas with organic leaf outlines',
    bgClass: 'bg-[#0e1713] text-emerald-50',
    bgStyle: {
      backgroundColor: '#0e1713',
      backgroundImage: LEAVES_PATTERN,
    },
    bubble: {
      sentBg: 'bg-emerald-700 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-[#15241d] text-emerald-100',
      borderStyle: 'border border-emerald-900/60',
    },
    previewGradient: 'from-emerald-950 to-teal-950',
    badge: 'Organic'
  },

  // --- LOVE & ROMANCE (Subtle Floating Hearts) ---
  {
    id: 'love_rose_romance',
    name: 'Soft Rose Hearts',
    category: 'love',
    description: 'Subtle crimson floating hearts on dark twilight velvet',
    bgClass: 'bg-[#1a080d] text-rose-50',
    bgStyle: {
      backgroundColor: '#1a080d',
      backgroundImage: HEARTS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-rose-700 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-[#2a1017] text-rose-100',
      borderStyle: 'border border-rose-900/50',
    },
    previewGradient: 'from-rose-950 to-pink-950',
    badge: '❤️ Hearts'
  },
  {
    id: 'love_pastel_blush',
    name: 'Pastel Blush Hearts',
    category: 'love',
    description: 'Delicate pastel blush warmth with soft floating hearts',
    bgClass: 'bg-[#fff0f3] text-rose-950',
    bgStyle: {
      backgroundColor: '#fff0f3',
      backgroundImage: HEARTS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-rose-600 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-white text-rose-950',
      borderStyle: 'border border-rose-200',
    },
    previewGradient: 'from-rose-200 to-pink-100',
    badge: 'Pastel'
  },

  // --- CUTE ANIMALS (Cute Paws & Pandas) ---
  {
    id: 'animals_playful_paws',
    name: 'Playful Kitten Paws',
    category: 'animals',
    description: 'Cute paw print pattern on warm Mocha canvas',
    bgClass: 'bg-[#19120c] text-amber-50',
    bgStyle: {
      backgroundColor: '#19120c',
      backgroundImage: PAWS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-amber-700 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-[#291e15] text-amber-100',
      borderStyle: 'border border-amber-900/50',
    },
    previewGradient: 'from-amber-950 to-orange-950',
    badge: '🐾 Paws'
  },
  {
    id: 'animals_panda_bamboo',
    name: 'Panda Paradise',
    category: 'animals',
    description: 'Cute panda & bamboo pattern with soothing mint bubbles',
    bgClass: 'bg-[#091a14] text-emerald-50',
    bgStyle: {
      backgroundColor: '#091a14',
      backgroundImage: PANDA_PATTERN,
    },
    bubble: {
      sentBg: 'bg-teal-700 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-[#132c23] text-teal-100',
      borderStyle: 'border border-teal-900/50',
    },
    previewGradient: 'from-emerald-950 to-teal-950',
    badge: '🐼 Panda'
  },

  // --- CLASSIC WHATSAPP ---
  {
    id: 'whatsapp_dark_emerald',
    name: 'WhatsApp Dark Emerald',
    category: 'classic',
    description: 'Authentic WhatsApp Dark theme with signature Doodle pattern',
    bgClass: 'bg-[#0B141A] text-slate-100',
    bgStyle: {
      backgroundColor: '#0B141A',
      backgroundImage: WHATSAPP_DOODLE,
    },
    bubble: {
      sentBg: 'bg-[#005C4B] text-slate-100',
      sentText: 'text-white',
      receivedBg: 'bg-[#202C33] text-slate-100',
      borderStyle: 'border border-[#007a64]/30',
    },
    previewGradient: 'from-[#0B141A] via-[#128C7E] to-[#005C4B]',
    badge: 'WhatsApp'
  },
  {
    id: 'whatsapp_light_doodle',
    name: 'WhatsApp Light Doodle',
    category: 'classic',
    description: 'Classic WhatsApp cream doodle background with soft green bubbles',
    bgClass: 'bg-[#E5DDD5] text-slate-900',
    bgStyle: {
      backgroundColor: '#E5DDD5',
      backgroundImage: WHATSAPP_DOODLE,
    },
    bubble: {
      sentBg: 'bg-[#D9FDD3] dark:bg-[#005C4B] text-[#111827] dark:text-white',
      sentText: 'text-slate-900 dark:text-white',
      receivedBg: 'bg-white dark:bg-[#202C33] text-slate-900 dark:text-slate-100',
      borderStyle: 'border border-[#25D366]/30',
    },
    previewGradient: 'from-[#E5DDD5] via-[#25D366] to-[#D9FDD3]',
    badge: 'Classic'
  },

  // --- AESTHETIC ATMOSPHERIC ---
  {
    id: 'aesthetic_starlight',
    name: 'Starlight Constellations',
    category: 'aesthetic',
    description: 'Subtle starfield constellation pattern on deep midnight',
    bgClass: 'bg-[#090b17] text-indigo-50',
    bgStyle: {
      backgroundColor: '#090b17',
      backgroundImage: STARS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-indigo-700 text-white',
      sentText: 'text-white',
      receivedBg: 'bg-[#13172e] text-indigo-100',
      borderStyle: 'border border-indigo-900/50',
    },
    previewGradient: 'from-indigo-950 to-slate-950',
    badge: '✨ Stars'
  }
];

export const DEFAULT_THEME_ID = 'minimal_clean_slate';

export function getThemeById(id?: string): ChatTheme {
  const found = CHAT_THEMES.find(t => t.id === id);
  return found || CHAT_THEMES[0];
}
