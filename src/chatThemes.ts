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
  badge?: string;
}

// Subtle, eye-comfort SVG background patterns
const HEARTS_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23f43f5e'><path transform='translate(20,18) rotate(-15) scale(0.7)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.12'/><path transform='translate(115,25) rotate(22) scale(0.9)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.08'/><path transform='translate(65,85) rotate(-8) scale(1.1)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.1'/><path transform='translate(135,115) rotate(18) scale(0.6)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.12'/><path transform='translate(18,125) rotate(12) scale(0.8)' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill-opacity='0.08'/></g></svg>")`;

const PAWS_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23fb923c' fill-opacity='0.1'><g transform='translate(25,20) rotate(-22)'><circle cx='12' cy='15' r='6'/><circle cx='5' cy='6' r='2.5'/><circle cx='11' cy='3' r='2.5'/><circle cx='17' cy='3' r='2.5'/><circle cx='22' cy='6' r='2.5'/></g><g transform='translate(115,35) rotate(35)'><circle cx='12' cy='15' r='5'/><circle cx='5' cy='6' r='2'/><circle cx='11' cy='3' r='2'/><circle cx='17' cy='3' r='2'/><circle cx='22' cy='6' r='2'/></g><g transform='translate(65,95) rotate(-10)'><circle cx='12' cy='15' r='7'/><circle cx='5' cy='6' r='2.8'/><circle cx='11' cy='3' r='2.8'/><circle cx='17' cy='3' r='2.8'/><circle cx='22' cy='6' r='2.8'/></g><g transform='translate(130,120) rotate(15)'><circle cx='12' cy='15' r='5.5'/><circle cx='5' cy='6' r='2.2'/><circle cx='11' cy='3' r='2.2'/><circle cx='17' cy='3' r='2.2'/><circle cx='22' cy='6' r='2.2'/></g><g transform='translate(15,110) rotate(42)'><circle cx='12' cy='15' r='5'/><circle cx='5' cy='6' r='2'/><circle cx='11' cy='3' r='2'/><circle cx='17' cy='3' r='2'/><circle cx='22' cy='6' r='2'/></g></g></svg>")`;

const PANDA_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%2310b981'><g transform='translate(30,25) rotate(-12)'><circle cx='12' cy='12' r='8' fill-opacity='0.07'/><circle cx='6' cy='5' r='3' fill-opacity='0.1'/><circle cx='18' cy='5' r='3' fill-opacity='0.1'/></g><g transform='translate(120,40) rotate(28)'><circle cx='12' cy='12' r='9' fill-opacity='0.07'/><circle cx='6' cy='5' r='3.2' fill-opacity='0.1'/><circle cx='18' cy='5' r='3.2' fill-opacity='0.1'/></g><g transform='translate(70,100) rotate(-18)'><circle cx='12' cy='12' r='10' fill-opacity='0.07'/><circle cx='6' cy='5' r='3.5' fill-opacity='0.1'/><circle cx='18' cy='5' r='3.5' fill-opacity='0.1'/></g><path transform='translate(10,110) rotate(45)' d='M0 0 h30 v2 h-30 z' fill-opacity='0.08'/><path transform='translate(125,120) rotate(-25)' d='M0 0 h25 v2 h-25 z' fill-opacity='0.08'/></g></svg>")`;

const WHATSAPP_DOODLE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g stroke='%2325D366' stroke-opacity='0.1' stroke-width='1.6' fill='none'><rect transform='translate(20,20) rotate(-15)' x='0' y='0' width='14' height='10' rx='2'/><circle transform='translate(110,30) rotate(20)' cx='8' cy='8' r='7'/><path transform='translate(60,85) rotate(-8)' d='M0 0 l12 12 M12 0 l-12 12'/><path transform='translate(130,110) rotate(30)' d='M0 5 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'/><path transform='translate(25,120) rotate(-25)' d='M0 0 h16 M8 -8 v16'/></g></svg>")`;

const STARS_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%23a5b4fc'><polygon transform='translate(30,20) rotate(15) scale(0.8)' points='10,0 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7' fill-opacity='0.12'/><polygon transform='translate(120,35) rotate(-22) scale(1.1)' points='10,0 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7' fill-opacity='0.1'/><polygon transform='translate(70,95) rotate(32) scale(0.9)' points='10,0 12,7 19,7 13,11 15,18 10,13 5,18 7,11 1,7 8,7' fill-opacity='0.12'/><circle cx='20' cy='130' r='1.8' fill-opacity='0.2'/><circle cx='140' cy='120' r='1.5' fill-opacity='0.2'/><circle cx='85' cy='25' r='1.6' fill-opacity='0.18'/></g></svg>")`;

const LEAVES_PATTERN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='%2334d399' fill-opacity='0.09'><path transform='translate(20,15) rotate(-35) scale(0.8)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/><path transform='translate(110,30) rotate(45) scale(1)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/><path transform='translate(65,90) rotate(-15) scale(1.2)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/><path transform='translate(130,125) rotate(25) scale(0.7)' d='M20 0 C30 0 35 15 35 25 C20 25 15 15 20 0 Z'/></g></svg>")`;

export const CHAT_THEMES: ChatTheme[] = [
  // --- MINIMAL & AESTHETIC (DEFAULT) ---
  {
    id: 'minimal_clean_slate',
    name: 'Minimal Obsidian',
    category: 'minimal',
    description: 'Smooth dark obsidian with crystal-clear legibility and soft indigo sent bubbles',
    bgClass: 'bg-[#0b0f17] text-neutral-100',
    bgStyle: {
      backgroundColor: '#0b0f17',
    },
    bubble: {
      sentBg: 'bg-indigo-600',
      sentText: 'text-white',
      receivedBg: 'bg-[#161c28]',
      receivedText: 'text-neutral-100',
      borderStyle: 'border border-indigo-500/30',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-indigo-200',
      subtextReceived: 'text-neutral-400',
      linkSent: 'text-white underline hover:opacity-100',
      linkReceived: 'text-indigo-400 underline hover:text-indigo-300',
      cardBgSent: 'bg-black/25 border border-white/15 text-white',
      cardBgReceived: 'bg-neutral-800/80 border border-neutral-700/80 text-neutral-100'
    },
    previewGradient: 'from-neutral-900 to-indigo-950',
    badge: 'Default'
  },
  {
    id: 'minimal_warm_linen',
    name: 'Warm Linen Paper',
    category: 'minimal',
    description: 'Soft warm linen paper with high contrast dark slate bubbles that are easy on the eyes',
    bgClass: 'bg-[#f5f3ee] text-neutral-900',
    bgStyle: {
      backgroundColor: '#f5f3ee',
    },
    bubble: {
      sentBg: 'bg-[#1e293b]',
      sentText: 'text-white',
      receivedBg: 'bg-white',
      receivedText: 'text-slate-900',
      borderStyle: 'border border-slate-700/30',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-slate-300',
      subtextReceived: 'text-slate-500',
      linkSent: 'text-sky-300 underline hover:text-white',
      linkReceived: 'text-indigo-600 underline hover:text-indigo-800',
      cardBgSent: 'bg-black/30 border border-white/15 text-white',
      cardBgReceived: 'bg-stone-50 border border-stone-200 text-stone-900'
    },
    previewGradient: 'from-stone-200 to-amber-100',
    badge: 'Clean Light'
  },
  {
    id: 'minimal_zen_sage',
    name: 'Botanical Sage Green',
    category: 'minimal',
    description: 'Soothing dark emerald with subtle leaf silhouettes and restful contrast',
    bgClass: 'bg-[#09150f] text-emerald-50',
    bgStyle: {
      backgroundColor: '#09150f',
      backgroundImage: LEAVES_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#047857]',
      sentText: 'text-white',
      receivedBg: 'bg-[#11241a]',
      receivedText: 'text-emerald-50',
      borderStyle: 'border border-emerald-600/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-emerald-200',
      subtextReceived: 'text-emerald-300/70',
      linkSent: 'text-emerald-100 underline hover:text-white',
      linkReceived: 'text-emerald-400 underline hover:text-emerald-300',
      cardBgSent: 'bg-black/25 border border-emerald-400/20 text-white',
      cardBgReceived: 'bg-[#162d21] border border-emerald-800/60 text-emerald-50'
    },
    previewGradient: 'from-emerald-950 to-teal-950',
    badge: '🌿 Sage'
  },

  // --- LOVE & ROMANCE ---
  {
    id: 'love_rose_romance',
    name: 'Velvet Rose Hearts',
    category: 'love',
    description: 'Deep velvet crimson night with soft hearts and vibrant readable text',
    bgClass: 'bg-[#170a10] text-rose-50',
    bgStyle: {
      backgroundColor: '#170a10',
      backgroundImage: HEARTS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#be123c]',
      sentText: 'text-white',
      receivedBg: 'bg-[#26101c]',
      receivedText: 'text-rose-50',
      borderStyle: 'border border-rose-500/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-rose-200',
      subtextReceived: 'text-rose-300/70',
      linkSent: 'text-rose-100 underline hover:text-white',
      linkReceived: 'text-rose-400 underline hover:text-rose-300',
      cardBgSent: 'bg-black/25 border border-rose-400/20 text-white',
      cardBgReceived: 'bg-[#331525] border border-rose-900/60 text-rose-50'
    },
    previewGradient: 'from-rose-950 to-pink-950',
    badge: '❤️ Hearts'
  },
  {
    id: 'love_pastel_blush',
    name: 'Pastel Blush Hearts',
    category: 'love',
    description: 'Gentle pastel blush warmth with high-contrast crimson sent bubbles',
    bgClass: 'bg-[#fff0f3] text-rose-950',
    bgStyle: {
      backgroundColor: '#fff0f3',
      backgroundImage: HEARTS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#e11d48]',
      sentText: 'text-white',
      receivedBg: 'bg-white',
      receivedText: 'text-rose-950',
      borderStyle: 'border border-rose-400/40',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-rose-100',
      subtextReceived: 'text-rose-600/80',
      linkSent: 'text-rose-100 underline hover:text-white',
      linkReceived: 'text-rose-700 underline hover:text-rose-900',
      cardBgSent: 'bg-black/25 border border-white/20 text-white',
      cardBgReceived: 'bg-rose-50/80 border border-rose-200 text-rose-950'
    },
    previewGradient: 'from-rose-200 to-pink-100',
    badge: '🌸 Blush'
  },

  // --- CUTE ANIMALS ---
  {
    id: 'animals_playful_paws',
    name: 'Playful Kitten Paws',
    category: 'animals',
    description: 'Warm dark mocha canvas with cute paw prints and terracotta amber accents',
    bgClass: 'bg-[#18110b] text-amber-50',
    bgStyle: {
      backgroundColor: '#18110b',
      backgroundImage: PAWS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#c2410c]',
      sentText: 'text-white',
      receivedBg: 'bg-[#291c13]',
      receivedText: 'text-amber-50',
      borderStyle: 'border border-amber-600/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-amber-200',
      subtextReceived: 'text-amber-300/70',
      linkSent: 'text-amber-100 underline hover:text-white',
      linkReceived: 'text-amber-400 underline hover:text-amber-300',
      cardBgSent: 'bg-black/25 border border-amber-400/20 text-white',
      cardBgReceived: 'bg-[#332216] border border-amber-900/60 text-amber-50'
    },
    previewGradient: 'from-amber-950 to-orange-950',
    badge: '🐾 Paws'
  },
  {
    id: 'animals_panda_bamboo',
    name: 'Panda Paradise',
    category: 'animals',
    description: 'Smooth pine & teal with adorable panda silhouettes and clear readable fonts',
    bgClass: 'bg-[#081813] text-teal-50',
    bgStyle: {
      backgroundColor: '#081813',
      backgroundImage: PANDA_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#0f766e]',
      sentText: 'text-white',
      receivedBg: 'bg-[#112a20]',
      receivedText: 'text-teal-50',
      borderStyle: 'border border-teal-500/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-teal-200',
      subtextReceived: 'text-teal-300/70',
      linkSent: 'text-teal-100 underline hover:text-white',
      linkReceived: 'text-teal-400 underline hover:text-teal-300',
      cardBgSent: 'bg-black/25 border border-teal-400/20 text-white',
      cardBgReceived: 'bg-[#17382c] border border-teal-800/60 text-teal-50'
    },
    previewGradient: 'from-emerald-950 to-teal-950',
    badge: '🐼 Panda'
  },

  // --- CLASSIC WHATSAPP ---
  {
    id: 'whatsapp_dark_emerald',
    name: 'WhatsApp Dark Emerald',
    category: 'classic',
    description: 'Authentic WhatsApp Dark UI with deep emerald accents and official doodle wallpaper',
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
      borderStyle: 'border border-[#007a64]/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#8696a0]',
      subtextReceived: 'text-[#8696a0]',
      linkSent: 'text-[#53bdeb] underline hover:text-white',
      linkReceived: 'text-[#53bdeb] underline hover:text-white',
      cardBgSent: 'bg-black/25 border border-[#007a64]/40 text-[#e9edef]',
      cardBgReceived: 'bg-[#182229] border border-[#2a3942] text-[#e9edef]'
    },
    previewGradient: 'from-[#0b141a] via-[#128c7e] to-[#005c4b]',
    badge: 'WhatsApp Dark'
  },
  {
    id: 'whatsapp_light_doodle',
    name: 'WhatsApp Light Classic',
    category: 'classic',
    description: 'Signature WhatsApp beige doodle with soft mint sent bubbles & crisp dark text',
    bgClass: 'bg-[#efeae2] text-[#111b21]',
    bgStyle: {
      backgroundColor: '#efeae2',
      backgroundImage: WHATSAPP_DOODLE,
    },
    bubble: {
      sentBg: 'bg-[#d9fdd3]',
      sentText: 'text-[#111b21]',
      receivedBg: 'bg-white',
      receivedText: 'text-[#111b21]',
      borderStyle: 'border border-[#b5e7ad]',
      isSentDark: false,
      isReceivedDark: false,
      subtextSent: 'text-[#667781]',
      subtextReceived: 'text-[#667781]',
      linkSent: 'text-[#027eb5] underline font-semibold',
      linkReceived: 'text-[#027eb5] underline font-semibold',
      cardBgSent: 'bg-[#c5f7bd]/60 border border-[#a2df99] text-[#111b21]',
      cardBgReceived: 'bg-[#f7f6f4] border border-[#e2dcd5] text-[#111b21]'
    },
    previewGradient: 'from-[#efeae2] via-[#25d366] to-[#d9fdd3]',
    badge: 'WhatsApp Light'
  },

  // --- AESTHETIC ATMOSPHERIC ---
  {
    id: 'aesthetic_starlight',
    name: 'Starlight Constellations',
    category: 'aesthetic',
    description: 'Deep midnight blue with subtle starfield sparkles and crystal indigo bubbles',
    bgClass: 'bg-[#090d1c] text-indigo-50',
    bgStyle: {
      backgroundColor: '#090d1c',
      backgroundImage: STARS_PATTERN,
    },
    bubble: {
      sentBg: 'bg-[#4338ca]',
      sentText: 'text-white',
      receivedBg: 'bg-[#141930]',
      receivedText: 'text-indigo-50',
      borderStyle: 'border border-indigo-500/40',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-indigo-200',
      subtextReceived: 'text-indigo-300/70',
      linkSent: 'text-indigo-100 underline hover:text-white',
      linkReceived: 'text-indigo-400 underline hover:text-indigo-300',
      cardBgSent: 'bg-black/25 border border-indigo-400/20 text-white',
      cardBgReceived: 'bg-[#1b2242] border border-indigo-900/60 text-indigo-50'
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

