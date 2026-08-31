import { 
  LEAVES_PATTERN, 
  STARS_PATTERN, 
  WHATSAPP_DOODLE, 
  ZENOA_AESTHETIC_MICRO_PATTERN,
  LOVE_ROMANCE_PATTERN,
  CUTE_ANIMALS_PATTERN,
  KIDS_WORLD_PATTERN,
  PREMIUM_MINIMAL_LINEN,
  PROFESSIONAL_TECH_PATTERN,
  DINO_ADVENTURE_PATTERN
} from './assets/wallpapers';

export interface ChatTheme {
  id: string;
  name: string;
  category: 'minimal' | 'love' | 'animals' | 'professional' | 'kids' | 'aesthetic' | 'classic';
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
  
  // Theme Adaptive Layout Properties (Header & Composer Adopt-to-Theme Elements)
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerSubtext: string;
  composerBg: string;
  composerBorder: string;
  innerInputBg: string;
  innerInputBorder: string;
  innerInputText: string;

  // Adaptive Action Buttons Theme Highlighting Properties
  actionButtonText: string;
  actionButtonHoverBg: string;
  actionButtonActiveBg: string;
  accentBg: string;
  accentText: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  // ==================== 1. MINIMAL & LUXURY COZY ====================
  {
    id: 'minimal_clean_slate',
    name: 'Clean Slate',
    category: 'minimal',
    description: 'Crisp, eye-comforting neutral canvas with subtle aesthetic micro-motifs.',
    bgClass: 'bg-[#f8f9fa] dark:bg-[#0d1117] text-neutral-900 dark:text-neutral-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '260px 260px',
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
    badge: '💎 Slate',
    headerBg: 'bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-md',
    headerBorder: 'border-b border-neutral-200/80 dark:border-neutral-800/80',
    headerText: 'text-neutral-900 dark:text-neutral-50',
    headerSubtext: 'text-neutral-500 dark:text-neutral-400',
    composerBg: 'bg-[#f8f9fa] dark:bg-[#0d1117]',
    composerBorder: 'border-t border-neutral-200/80 dark:border-neutral-800/80',
    innerInputBg: 'bg-white dark:bg-[#1c1c1e]',
    innerInputBorder: 'border-neutral-200 dark:border-neutral-800',
    innerInputText: 'text-neutral-900 dark:text-neutral-100',
    actionButtonText: 'text-indigo-600 dark:text-indigo-400',
    actionButtonHoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
    actionButtonActiveBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
    accentBg: 'bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-600',
    accentText: 'text-white'
  },
  {
    id: 'minimal_warm_linen',
    name: 'Warm Linen',
    category: 'minimal',
    description: 'Cozy, organic oatmeal backdrop with warm textile crosshatch pattern.',
    bgClass: 'bg-[#f7f4ee] dark:bg-[#151311] text-amber-950 dark:text-amber-50',
    bgStyle: {
      backgroundImage: PREMIUM_MINIMAL_LINEN,
      backgroundRepeat: 'repeat',
      backgroundSize: '30px 30px',
    },
    bubble: {
      sentBg: 'bg-[#4a3b32] dark:bg-[#d9c4b1]',
      sentText: 'text-[#fdfcfb] dark:text-[#1c120a]',
      receivedBg: 'bg-white dark:bg-[#201c18]',
      receivedText: 'text-neutral-800 dark:text-neutral-200',
      borderStyle: 'border border-[#e6decb] dark:border-[#382f25]',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-[#c2b0a3] dark:text-[#4d3826]',
      subtextReceived: 'text-neutral-400 dark:text-neutral-500',
      linkSent: 'text-[#f3e8ff] dark:text-[#6366f1] underline',
      linkReceived: 'text-[#854d0e] underline',
      cardBgSent: 'bg-black/15 dark:bg-white/10 text-white dark:text-black',
      cardBgReceived: 'bg-[#faf7f2] dark:bg-[#1a1714] text-neutral-900'
    },
    previewGradient: 'from-[#f7f4ee] to-[#e8decb] dark:from-[#151311] to-[#25201b]',
    badge: '🌾 Linen',
    headerBg: 'bg-[#fcfbf9]/90 dark:bg-[#151311]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#e6decb] dark:border-[#2a221a]',
    headerText: 'text-amber-950 dark:text-amber-100',
    headerSubtext: 'text-[#7a6a5e] dark:text-[#a09080]',
    composerBg: 'bg-[#faf8f5] dark:bg-[#1a1714]',
    composerBorder: 'border-t border-[#e6decb] dark:border-[#2a221a]',
    innerInputBg: 'bg-white dark:bg-[#201d1a]',
    innerInputBorder: 'border-[#dfd3bc] dark:border-[#382f25]',
    innerInputText: 'text-[#4a3b32] dark:text-[#e4d3c1]',
    actionButtonText: 'text-amber-800 dark:text-amber-300',
    actionButtonHoverBg: 'hover:bg-amber-100/80 dark:hover:bg-amber-950/40',
    actionButtonActiveBg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300',
    accentBg: 'bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-700',
    accentText: 'text-[#fdfcfb] dark:text-[#1c120a]'
  },
  {
    id: 'minimal_sage_shadow',
    name: 'Sage Shadows',
    category: 'minimal',
    description: 'Deep resting sage tones with soft organic leaves pattern.',
    bgClass: 'bg-[#0f1412] text-emerald-50',
    bgStyle: {
      backgroundColor: '#0f1412',
      backgroundImage: LEAVES_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '120px 120px',
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
    badge: '🌿 Sage',
    headerBg: 'bg-[#131b17]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#23352c]/50',
    headerText: 'text-[#e2f0e9]',
    headerSubtext: 'text-[#92b5a5]',
    composerBg: 'bg-[#0f1412]',
    composerBorder: 'border-t border-[#23352c]/50',
    innerInputBg: 'bg-[#18211e]',
    innerInputBorder: 'border-[#2d473b]',
    innerInputText: 'text-[#d6e3dc]',
    actionButtonText: 'text-emerald-400',
    actionButtonHoverBg: 'hover:bg-emerald-900/30',
    actionButtonActiveBg: 'bg-emerald-900/50 text-emerald-300',
    accentBg: 'bg-emerald-700 hover:bg-emerald-800',
    accentText: 'text-emerald-50'
  },

  // ==================== 2. LOVE & SWEET ROMANCE ====================
  {
    id: 'love_velvet_crimson',
    name: 'Velvet Crimson',
    category: 'love',
    description: 'Rich velvet crimson canvas decorated with beautiful hearts & sparks.',
    bgClass: 'bg-[#180a0e] text-[#fce8ed]',
    bgStyle: {
      backgroundColor: '#180a0e',
      backgroundImage: LOVE_ROMANCE_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '260px 260px',
    },
    bubble: {
      sentBg: 'bg-[#821c33]',
      sentText: 'text-[#fce8ed]',
      receivedBg: 'bg-[#291319]',
      receivedText: 'text-[#f5d0da]',
      borderStyle: 'border border-[#992942]/30',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#e8a3b5]',
      subtextReceived: 'text-[#bd8494]',
      linkSent: 'text-[#fca5a5] underline hover:opacity-80',
      linkReceived: 'text-[#f87171] underline hover:opacity-80',
      cardBgSent: 'bg-black/25 border border-[#80243d]/20 text-[#fce8ed]',
      cardBgReceived: 'bg-[#29171e] border border-[#382029] text-[#f5d0da]'
    },
    previewGradient: 'from-[#180a0e] to-[#291319]',
    badge: '❤️ Velvet',
    headerBg: 'bg-[#210e13]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#451b24]/60',
    headerText: 'text-[#fce8ed]',
    headerSubtext: 'text-[#bd8494]',
    composerBg: 'bg-[#180a0e]',
    composerBorder: 'border-t border-[#451b24]/60',
    innerInputBg: 'bg-[#2d151c]',
    innerInputBorder: 'border-[#5e2230]',
    innerInputText: 'text-[#fcd3de]',
    actionButtonText: 'text-rose-400',
    actionButtonHoverBg: 'hover:bg-[#821c33]/30',
    actionButtonActiveBg: 'bg-[#821c33] text-rose-100',
    accentBg: 'bg-[#821c33] hover:bg-rose-800',
    accentText: 'text-white'
  },
  {
    id: 'love_pastel_blush',
    name: 'Blush Sweetheart',
    category: 'love',
    description: 'Sweet pastel pink backdrop with hand-drawn cupid hearts.',
    bgClass: 'bg-[#fff5f6] dark:bg-[#1e1416] text-[#6d2837] dark:text-[#ffd6e0]',
    bgStyle: {
      backgroundImage: LOVE_ROMANCE_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '260px 260px',
    },
    bubble: {
      sentBg: 'bg-[#db2777] dark:bg-[#f472b6]',
      sentText: 'text-white dark:text-[#4c0519]',
      receivedBg: 'bg-white dark:bg-[#2e1d21]',
      receivedText: 'text-[#5c1d2b] dark:text-[#fbcfe8]',
      borderStyle: 'border border-[#ffd1d9] dark:border-[#4c1620]',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-pink-100 dark:text-[#4c0519]/70',
      subtextReceived: 'text-neutral-400 dark:text-neutral-500',
      linkSent: 'text-white font-bold underline',
      linkReceived: 'text-pink-600 dark:text-pink-400 underline',
      cardBgSent: 'bg-pink-900/20 text-white',
      cardBgReceived: 'bg-[#fff8f9] dark:bg-[#251518] text-[#5c1d2b]'
    },
    previewGradient: 'from-[#fff5f6] to-[#ffd1d9] dark:from-[#1e1416] to-[#3a1d24]',
    badge: '🌸 Sweetheart',
    headerBg: 'bg-[#fff8f9]/90 dark:bg-[#211719]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#ffd1d9] dark:border-[#4c1620]',
    headerText: 'text-[#6d2837] dark:text-[#ffd6e0]',
    headerSubtext: 'text-[#9e5d6d] dark:text-[#c48e9c]',
    composerBg: 'bg-[#fffdfd] dark:bg-[#1e1416]',
    composerBorder: 'border-t border-[#ffd1d9] dark:border-[#4c1620]',
    innerInputBg: 'bg-white dark:bg-[#29191c]',
    innerInputBorder: 'border-[#ffccd5] dark:border-[#5c1c28]',
    innerInputText: 'text-[#6d2837] dark:text-[#ffd6e0]',
    actionButtonText: 'text-pink-600 dark:text-pink-400',
    actionButtonHoverBg: 'hover:bg-pink-100/80 dark:hover:bg-pink-950/30',
    actionButtonActiveBg: 'bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400',
    accentBg: 'bg-[#db2777] hover:bg-pink-700 dark:bg-[#f472b6] dark:hover:bg-pink-500',
    accentText: 'text-white dark:text-[#4c0519]'
  },

  // ==================== 3. CUTE ANIMALS ====================
  {
    id: 'animals_mocha_paws',
    name: 'Mocha Paws',
    category: 'animals',
    description: 'Cozy chocolate-mocha aesthetic canvas with adorable kitty and puppy motifs.',
    bgClass: 'bg-[#1a1412] text-[#fdf8f4]',
    bgStyle: {
      backgroundColor: '#1a1412',
      backgroundImage: CUTE_ANIMALS_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '280px 280px',
    },
    bubble: {
      sentBg: 'bg-[#8c4f2b]',
      sentText: 'text-[#fefbf9]',
      receivedBg: 'bg-[#29221e]',
      receivedText: 'text-[#f5ece5]',
      borderStyle: 'border border-[#ab683f]/30',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#e9c7b1]',
      subtextReceived: 'text-[#b8a291]',
      linkSent: 'text-[#fdba74] underline hover:opacity-80',
      linkReceived: 'text-[#fb923c] underline hover:opacity-80',
      cardBgSent: 'bg-black/25 border border-[#ab683f]/20 text-white',
      cardBgReceived: 'bg-[#2c2622] border border-[#3a322c] text-[#f5ece5]'
    },
    previewGradient: 'from-[#1a1412] to-[#2c221e]',
    badge: '🐾 Paws',
    headerBg: 'bg-[#241c19]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#473832]/60',
    headerText: 'text-[#fdf8f4]',
    headerSubtext: 'text-[#b8a291]',
    composerBg: 'bg-[#1a1412]',
    composerBorder: 'border-t border-[#473832]/60',
    innerInputBg: 'bg-[#29221e]',
    innerInputBorder: 'border-[#52443d]',
    innerInputText: 'text-[#f5ece5]',
    actionButtonText: 'text-[#ab683f]',
    actionButtonHoverBg: 'hover:bg-[#8c4f2b]/20',
    actionButtonActiveBg: 'bg-[#8c4f2b] text-[#fefbf9]',
    accentBg: 'bg-[#8c4f2b] hover:bg-[#733e20]',
    accentText: 'text-white'
  },
  {
    id: 'animals_panda_paradise',
    name: 'Panda Forest',
    category: 'animals',
    description: 'Lively mint-green background featuring playful bamboo pandas.',
    bgClass: 'bg-[#eefcf5] dark:bg-[#101915] text-[#14532d] dark:text-[#dbfdec]',
    bgStyle: {
      backgroundImage: CUTE_ANIMALS_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '280px 280px',
    },
    bubble: {
      sentBg: 'bg-[#15803d] dark:bg-[#4ade80]',
      sentText: 'text-white dark:text-[#14532d]',
      receivedBg: 'bg-white dark:bg-[#1c2e25]',
      receivedText: 'text-[#14532d] dark:text-[#a7f3d0]',
      borderStyle: 'border border-[#c6f6d5] dark:border-[#274436]',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-[#bbf7d0] dark:text-[#14532d]/70',
      subtextReceived: 'text-emerald-500 dark:text-emerald-400',
      linkSent: 'text-white underline',
      linkReceived: 'text-emerald-700 dark:text-emerald-300 underline',
    },
    previewGradient: 'from-[#eefcf5] to-[#c6f6d5] dark:from-[#101915] to-[#1e3328]',
    badge: '🐼 Panda',
    headerBg: 'bg-[#f4fdf8]/90 dark:bg-[#121f1a]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#c6f6d5] dark:border-[#274436]',
    headerText: 'text-[#14532d] dark:text-[#dbfdec]',
    headerSubtext: 'text-[#22c55e] dark:text-[#4ade80]',
    composerBg: 'bg-[#f9fefe] dark:bg-[#101915]',
    composerBorder: 'border-t border-[#c6f6d5] dark:border-[#274436]',
    innerInputBg: 'bg-white dark:bg-[#182920]',
    innerInputBorder: 'border-[#a3f3be] dark:border-[#2a4d3a]',
    innerInputText: 'text-[#14532d] dark:text-[#dbfdec]',
    actionButtonText: 'text-emerald-600 dark:text-emerald-400',
    actionButtonHoverBg: 'hover:bg-emerald-100/80 dark:hover:bg-[#1c2e25]',
    actionButtonActiveBg: 'bg-[#15803d] text-white dark:bg-[#4ade80] dark:text-[#14532d]',
    accentBg: 'bg-[#15803d] hover:bg-emerald-700 dark:bg-[#4ade80] dark:hover:bg-emerald-400',
    accentText: 'text-white dark:text-[#14532d]'
  },

  // ==================== 4. HIGH PROFESSIONAL ====================
  {
    id: 'professional_graphite',
    name: 'Corporate Slate',
    category: 'professional',
    description: 'Clean isometric structural blueprints designed for managers and professionals.',
    bgClass: 'bg-[#f1f5f9] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f8fafc]',
    bgStyle: {
      backgroundImage: PROFESSIONAL_TECH_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '64px 64px',
    },
    bubble: {
      sentBg: 'bg-[#2563eb] dark:bg-[#3b82f6]',
      sentText: 'text-white',
      receivedBg: 'bg-white dark:bg-[#1e293b]',
      receivedText: 'text-[#1e293b] dark:text-[#f1f5f9]',
      borderStyle: 'border border-slate-200 dark:border-slate-800',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-blue-200',
      subtextReceived: 'text-slate-400 dark:text-slate-500',
      linkSent: 'text-blue-100 underline',
      linkReceived: 'text-blue-600 dark:text-blue-400 underline',
    },
    previewGradient: 'from-[#f1f5f9] to-[#cbd5e1] dark:from-[#0f172a] to-[#1e293b]',
    badge: '💼 Graphite',
    headerBg: 'bg-white/90 dark:bg-[#131d31]/90 backdrop-blur-md',
    headerBorder: 'border-b border-slate-200 dark:border-slate-800',
    headerText: 'text-[#1e293b] dark:text-[#f8fafc]',
    headerSubtext: 'text-slate-500 dark:text-slate-400',
    composerBg: 'bg-[#f8fafc] dark:bg-[#0f172a]',
    composerBorder: 'border-t border-slate-200 dark:border-slate-800',
    innerInputBg: 'bg-white dark:bg-[#1e293b]',
    innerInputBorder: 'border-slate-200 dark:border-slate-700',
    innerInputText: 'text-[#1e293b] dark:text-[#f8fafc]',
    actionButtonText: 'text-blue-600 dark:text-blue-400',
    actionButtonHoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/40',
    actionButtonActiveBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    accentBg: 'bg-[#2563eb] hover:bg-blue-700 dark:bg-[#3b82f6] dark:hover:bg-blue-500',
    accentText: 'text-white'
  },
  {
    id: 'professional_carbon',
    name: 'Carbon Tech',
    category: 'professional',
    description: 'Minimalist industrial carbon structure for focused developer/engineering setups.',
    bgClass: 'bg-[#090d16] text-[#e2e8f0]',
    bgStyle: {
      backgroundColor: '#090d16',
      backgroundImage: PROFESSIONAL_TECH_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '64px 64px',
    },
    bubble: {
      sentBg: 'bg-[#1e293b]',
      sentText: 'text-[#f8fafc]',
      receivedBg: 'bg-[#101726]',
      receivedText: 'text-[#cbd5e1]',
      borderStyle: 'border border-slate-800',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-[#94a3b8]',
      subtextReceived: 'text-[#64748b]',
      linkSent: 'text-[#38bdf8] underline',
      linkReceived: 'text-[#0ea5e9] underline',
    },
    previewGradient: 'from-[#090d16] to-[#1e293b]',
    badge: '💻 Carbon',
    headerBg: 'bg-[#0e1422]/90 backdrop-blur-md',
    headerBorder: 'border-b border-slate-800/60',
    headerText: 'text-[#e2e8f0]',
    headerSubtext: 'text-[#64748b]',
    composerBg: 'bg-[#090d16]',
    composerBorder: 'border-t border-slate-800/60',
    innerInputBg: 'bg-[#101726]',
    innerInputBorder: 'border-slate-800',
    innerInputText: 'text-[#cbd5e1]',
    actionButtonText: 'text-sky-400',
    actionButtonHoverBg: 'hover:bg-slate-800/60',
    actionButtonActiveBg: 'bg-slate-800 text-sky-400',
    accentBg: 'bg-slate-700 hover:bg-slate-600',
    accentText: 'text-[#e2e8f0]'
  },

  // ==================== 5. KIDS & DREAMY PLAYGROUND ====================
  {
    id: 'kids_toy_town',
    name: 'Toy Town',
    category: 'kids',
    description: 'Playful balloons, sky clouds, and teddy bears for an immersive adorable feel.',
    bgClass: 'bg-[#f0f9ff] dark:bg-[#0c1e28] text-sky-950 dark:text-sky-50',
    bgStyle: {
      backgroundImage: KIDS_WORLD_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '300px 300px',
    },
    bubble: {
      sentBg: 'bg-[#0284c7] dark:bg-[#38bdf8]',
      sentText: 'text-white dark:text-[#0369a1]',
      receivedBg: 'bg-white dark:bg-[#142e3b]',
      receivedText: 'text-[#0c4a6e] dark:text-[#bae6fd]',
      borderStyle: 'border border-[#bae6fd] dark:border-[#224c60]',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-sky-100 dark:text-[#0369a1]/70',
      subtextReceived: 'text-sky-400 dark:text-sky-500',
      linkSent: 'text-white underline font-bold',
      linkReceived: 'text-sky-600 dark:text-sky-300 underline'
    },
    previewGradient: 'from-[#f0f9ff] to-[#bae6fd] dark:from-[#0c1e28] to-[#183e52]',
    badge: '🧸 Toy',
    headerBg: 'bg-[#f5fbff]/90 dark:bg-[#0e2430]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#bae6fd] dark:border-[#224c60]',
    headerText: 'text-[#0c4a6e] dark:text-[#bae6fd]',
    headerSubtext: 'text-sky-500 dark:text-sky-400',
    composerBg: 'bg-[#f7fcff] dark:bg-[#0c1e28]',
    composerBorder: 'border-t border-[#bae6fd] dark:border-[#224c60]',
    innerInputBg: 'bg-white dark:bg-[#142e3b]',
    innerInputBorder: 'border-[#a5f3fc] dark:border-[#295b73]',
    innerInputText: 'text-[#0c4a6e] dark:text-[#bae6fd]',
    actionButtonText: 'text-sky-600 dark:text-sky-400',
    actionButtonHoverBg: 'hover:bg-sky-100 dark:hover:bg-sky-950/40',
    actionButtonActiveBg: 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
    accentBg: 'bg-[#0284c7] hover:bg-sky-700 dark:bg-[#38bdf8] dark:hover:bg-[#0284c7]',
    accentText: 'text-white'
  },
  {
    id: 'kids_dino_land',
    name: 'Dino Park',
    category: 'kids',
    description: 'Cartoon dinosaurs, palm trees, and volcanoes that children and parents love.',
    bgClass: 'bg-[#f0fdf4] dark:bg-[#081f14] text-emerald-950 dark:text-emerald-50',
    bgStyle: {
      backgroundImage: DINO_ADVENTURE_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '320px 320px',
    },
    bubble: {
      sentBg: 'bg-[#16a34a] dark:bg-[#4ade80]',
      sentText: 'text-white dark:text-[#064e3b]',
      receivedBg: 'bg-white dark:bg-[#113120]',
      receivedText: 'text-[#064e3b] dark:text-[#a7f3d0]',
      borderStyle: 'border border-[#bbf7d0] dark:border-[#1a4a31]',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-emerald-100 dark:text-[#064e3b]/70',
      subtextReceived: 'text-emerald-400 dark:text-emerald-500',
      linkSent: 'text-white underline',
      linkReceived: 'text-emerald-600 dark:text-emerald-300 underline'
    },
    previewGradient: 'from-[#f0fdf4] to-[#bbf7d0] dark:from-[#081f14] to-[#14422b]',
    badge: '🦖 Dino',
    headerBg: 'bg-[#f4fdf6]/90 dark:bg-[#0c261a]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#bbf7d0] dark:border-[#1a4a31]',
    headerText: 'text-[#064e3b] dark:text-[#a7f3d0]',
    headerSubtext: 'text-emerald-500 dark:text-emerald-400',
    composerBg: 'bg-[#f7fef9] dark:bg-[#081f14]',
    composerBorder: 'border-t border-[#bbf7d0] dark:border-[#1a4a31]',
    innerInputBg: 'bg-white dark:bg-[#113120]',
    innerInputBorder: 'border-[#a3f3be] dark:border-[#256341]',
    innerInputText: 'text-[#064e3b] dark:text-[#a7f3d0]',
    actionButtonText: 'text-emerald-600 dark:text-emerald-400',
    actionButtonHoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-950/40',
    actionButtonActiveBg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-[#16a34a] hover:bg-emerald-700 dark:bg-[#4ade80] dark:hover:bg-emerald-500',
    accentText: 'text-white'
  },

  // ==================== 6. AESTHETIC & COSMIC ====================
  {
    id: 'aesthetic_starlight',
    name: 'Midnight Stars',
    category: 'aesthetic',
    description: 'Deep celestial dark theme with sparkling starry pathways.',
    bgClass: 'bg-[#05070c] text-[#f1f3fa]',
    bgStyle: {
      backgroundColor: '#05070c',
      backgroundImage: STARS_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '160px 160px',
    },
    bubble: {
      sentBg: 'bg-[#1d4ed8]',
      sentText: 'text-[#ffffff]',
      receivedBg: 'bg-[#111625]',
      receivedText: 'text-[#e2e8f0]',
      borderStyle: 'border border-[#2563eb]/20',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-blue-200',
      subtextReceived: 'text-[#94a3b8]',
      linkSent: 'text-blue-100 underline',
      linkReceived: 'text-blue-400 underline',
    },
    previewGradient: 'from-[#05070c] to-[#111625]',
    badge: '✨ Stars',
    headerBg: 'bg-[#0a0d16]/90 backdrop-blur-md',
    headerBorder: 'border-b border-blue-950/80',
    headerText: 'text-[#f1f3fa]',
    headerSubtext: 'text-[#94a3b8]',
    composerBg: 'bg-[#05070c]',
    composerBorder: 'border-t border-blue-950/80',
    innerInputBg: 'bg-[#111625]',
    innerInputBorder: 'border-[#1d4ed8]/40',
    innerInputText: 'text-[#e2e8f0]',
    actionButtonText: 'text-blue-400',
    actionButtonHoverBg: 'hover:bg-blue-950/40',
    actionButtonActiveBg: 'bg-blue-900/40 text-blue-300',
    accentBg: 'bg-blue-600 hover:bg-blue-700',
    accentText: 'text-white'
  },

  // ==================== 7. CLASSIC WHATSAPP ====================
  {
    id: 'whatsapp_dark_emerald',
    name: 'Classic Dark',
    category: 'classic',
    description: 'Authentic chat experience with the signature green-dark doodle scheme.',
    bgClass: 'bg-[#0b141a] text-[#e9edef]',
    bgStyle: {
      backgroundColor: '#0b141a',
      backgroundImage: WHATSAPP_DOODLE,
      backgroundRepeat: 'repeat',
      backgroundSize: '160px 160px',
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
      linkSent: 'text-[#53bdeb] underline',
      linkReceived: 'text-[#53bdeb] underline',
    },
    previewGradient: 'from-[#0b141a] to-[#202c33]',
    badge: '💬 Classic',
    headerBg: 'bg-[#121b22]/90 backdrop-blur-md',
    headerBorder: 'border-b border-[#222d34]',
    headerText: 'text-[#e9edef]',
    headerSubtext: 'text-[#8696a0]',
    composerBg: 'bg-[#0b141a]',
    composerBorder: 'border-t border-[#222d34]',
    innerInputBg: 'bg-[#2a3942]',
    innerInputBorder: 'border-[#202c33]',
    innerInputText: 'text-[#e9edef]',
    actionButtonText: 'text-[#00a884]',
    actionButtonHoverBg: 'hover:bg-[#005c4b]/20',
    actionButtonActiveBg: 'bg-[#005c4b] text-white',
    accentBg: 'bg-[#005c4b] hover:bg-[#007a64]',
    accentText: 'text-white'
  }
];

export const DEFAULT_THEME_ID = 'minimal_clean_slate';

export function getThemeById(id?: string): ChatTheme {
  const found = CHAT_THEMES.find(t => t.id === id);
  return found || CHAT_THEMES[0];
}
