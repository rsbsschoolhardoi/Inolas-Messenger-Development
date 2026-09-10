import React from 'react';
import { 
  ZENOA_AESTHETIC_MICRO_PATTERN,
  PREMIUM_MINIMAL_LINEN,
  PROFESSIONAL_TECH_PATTERN,
  AURORA_STARRY_PATTERN,
  GALAXY_COSMOS_PATTERN,
  OBSIDIAN_HEARTH_PATTERN,
  TERRACOTTA_EARTH_PATTERN,
  LOVE_ROMANCE_PATTERN,
  SAKURA_BLOSSOM_PATTERN,
  COFFEE_LIFESTYLE_PATTERN
} from '../assets/wallpapers';

export interface ChatTheme {
  id: string;
  name: string;
  category: 'minimal' | 'night' | 'warm' | 'nature' | 'executive' | 'classic';
  description: string;
  bgClass: string;
  bgStyle?: React.CSSProperties;
  fontClass?: string;
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
  
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerSubtext: string;
  composerBg: string;
  composerBorder: string;
  innerInputBg: string;
  innerInputBorder: string;
  innerInputText: string;

  actionButtonText: string;
  actionButtonHoverBg: string;
  actionButtonActiveBg: string;
  accentBg: string;
  accentText: string;
}

export const THEMES_PART1: ChatTheme[] = [
  // ==================== 1. EDITORIAL & MINIMAL ====================
  {
    id: 'minimal_clean_slate',
    name: 'Clean Slate',
    category: 'minimal',
    description: 'Crisp editorial canvas with subtle stardust micro-motifs and matte obsidian sent bubbles.',
    bgClass: 'bg-[#f8f9fa] dark:bg-[#0e1015] text-neutral-900 dark:text-neutral-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#1b1e28] dark:bg-[#202533]',
      sentText: 'text-[#f8fafc] font-[460]',
      receivedBg: 'bg-white dark:bg-[#181a22]',
      receivedText: 'text-neutral-900 dark:text-neutral-100',
      borderStyle: 'border border-neutral-200/80 dark:border-neutral-800 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-neutral-300/80',
      subtextReceived: 'text-neutral-500 dark:text-neutral-400',
      linkSent: 'text-white underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-indigo-600 dark:text-indigo-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
    },
    previewGradient: 'from-[#f8f9fa] to-[#e5e7eb] dark:from-[#0e1015] to-[#1f242e]',
    badge: 'Editorial',
    headerBg: 'bg-white/95 dark:bg-[#0e1015]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-neutral-200/80 dark:border-neutral-800',
    headerText: 'text-neutral-900 dark:text-white',
    headerSubtext: 'text-neutral-500 dark:text-neutral-400',
    composerBg: 'bg-white/95 dark:bg-[#0e1015]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-neutral-200/80 dark:border-neutral-800',
    innerInputBg: 'bg-neutral-100/90 dark:bg-neutral-850',
    innerInputBorder: 'border border-neutral-300/80 dark:border-neutral-700/80 shadow-xs',
    innerInputText: 'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
    actionButtonText: 'text-neutral-600 dark:text-neutral-300',
    actionButtonHoverBg: 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80',
    actionButtonActiveBg: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950',
    accentBg: 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 shadow-xs',
    accentText: 'text-white dark:text-neutral-950'
  },
  {
    id: 'minimal_nordic_fog',
    name: 'Nordic Fog',
    category: 'minimal',
    description: 'Pale Scandinavian mist with gentle organic breeze ripples and deep slate-charcoal bubbles.',
    bgClass: 'bg-[#f4f6f8] dark:bg-[#111317] text-slate-900 dark:text-slate-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#232b36] dark:bg-[#1d242e]',
      sentText: 'text-[#f8fafc] font-[460]',
      receivedBg: 'bg-white dark:bg-[#191c22]',
      receivedText: 'text-slate-900 dark:text-slate-100',
      borderStyle: 'border border-slate-200/80 dark:border-slate-800 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-slate-300/80',
      subtextReceived: 'text-slate-500 dark:text-slate-400',
      linkSent: 'text-white underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-slate-700 dark:text-slate-300 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
    },
    previewGradient: 'from-[#f4f6f8] to-[#cbd5e1] dark:from-[#111317] to-[#1e2530]',
    badge: 'Nordic',
    headerBg: 'bg-white/95 dark:bg-[#111317]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-slate-200 dark:border-slate-800',
    headerText: 'text-slate-900 dark:text-white',
    headerSubtext: 'text-slate-500 dark:text-slate-400',
    composerBg: 'bg-white/95 dark:bg-[#111317]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-slate-200 dark:border-slate-800',
    innerInputBg: 'bg-slate-100/90 dark:bg-slate-800/90',
    innerInputBorder: 'border border-slate-300/80 dark:border-slate-700/80 shadow-xs',
    innerInputText: 'text-slate-900 dark:text-slate-100 placeholder:text-slate-400',
    actionButtonText: 'text-slate-600 dark:text-slate-300',
    actionButtonHoverBg: 'hover:bg-slate-200/80 dark:hover:bg-slate-700/80',
    actionButtonActiveBg: 'bg-[#232b36] text-white',
    accentBg: 'bg-[#232b36] hover:bg-[#181f28] dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs',
    accentText: 'text-white dark:text-slate-900'
  },
  {
    id: 'minimal_warm_parchment',
    name: 'Cashmere Linen',
    category: 'minimal',
    description: 'Warm unbleached oat linen with soft organic fiber curves and roasted espresso sent bubbles.',
    bgClass: 'bg-[#f7f5f1] dark:bg-[#141210] text-[#2e2620] dark:text-[#ede4dc]',
    bgStyle: {
      backgroundImage: PREMIUM_MINIMAL_LINEN,
      backgroundRepeat: 'repeat',
      backgroundSize: '360px 360px',
    },
    bubble: {
      sentBg: 'bg-[#3b2d22] dark:bg-[#2d221a]',
      sentText: 'text-[#fdfaf7] font-[460]',
      receivedBg: 'bg-white dark:bg-[#1e1a17]',
      receivedText: 'text-[#2e2620] dark:text-[#ede4dc]',
      borderStyle: 'border border-[#e7e1d8] dark:border-[#2d2621] shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-[#dfd5cc]/80',
      subtextReceived: 'text-[#8c7e72] dark:text-[#a8998d]',
      linkSent: 'text-white underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-[#785942] dark:text-[#d4b9a3] underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-[#fdfaf7]',
      cardBgReceived: 'bg-[#faf7f3] dark:bg-[#25201c] border-[#e7e1d8] dark:border-[#382f28] text-[#2e2620] dark:text-[#ede4dc]'
    },
    previewGradient: 'from-[#f7f5f1] to-[#e4ded5] dark:from-[#141210] to-[#25201b]',
    badge: 'Artisanal',
    headerBg: 'bg-white/95 dark:bg-[#141210]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#e7e1d8] dark:border-[#26201b]',
    headerText: 'text-[#2e2620] dark:text-[#faf6f2]',
    headerSubtext: 'text-[#8c7e72] dark:text-[#a8998d]',
    composerBg: 'bg-white/95 dark:bg-[#141210]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#e7e1d8] dark:border-[#26201b]',
    innerInputBg: 'bg-[#efeae3] dark:bg-[#1f1b17]',
    innerInputBorder: 'border border-[#ded6cc] dark:border-[#332b24] shadow-xs',
    innerInputText: 'text-[#2e2620] dark:text-[#ede4dc] placeholder:text-[#9e8f82]',
    actionButtonText: 'text-[#736457] dark:text-[#c4b5a7]',
    actionButtonHoverBg: 'hover:bg-[#e7e1d8] dark:hover:bg-[#2b241e]',
    actionButtonActiveBg: 'bg-[#3b2d22] text-white',
    accentBg: 'bg-[#3b2d22] hover:bg-[#2e231b] dark:bg-[#ede4dc] dark:hover:bg-white text-white dark:text-[#2e2620] shadow-xs',
    accentText: 'text-white dark:text-[#2e2620]'
  },
  {
    id: 'minimal_obsidian',
    name: 'Architect Mono',
    category: 'minimal',
    description: 'Modernist graphite studio canvas with scattered architectural coordinates and pure onyx bubbles.',
    bgClass: 'bg-[#f1f3f5] dark:bg-[#0f1012] text-neutral-900 dark:text-neutral-100',
    bgStyle: {
      backgroundImage: PROFESSIONAL_TECH_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#181a1d] dark:bg-[#212429]',
      sentText: 'text-white font-[460]',
      receivedBg: 'bg-white dark:bg-[#17191d]',
      receivedText: 'text-neutral-900 dark:text-neutral-100',
      borderStyle: 'border border-neutral-200 dark:border-neutral-800 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-neutral-400',
      subtextReceived: 'text-neutral-500 dark:text-neutral-400',
      linkSent: 'text-white underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-neutral-800 dark:text-neutral-200 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
    },
    previewGradient: 'from-[#f1f3f5] to-[#d1d5db] dark:from-[#0f1012] to-[#1c1f24]',
    badge: 'Modernist',
    headerBg: 'bg-white/95 dark:bg-[#0f1012]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-neutral-200 dark:border-neutral-800',
    headerText: 'text-neutral-900 dark:text-white',
    headerSubtext: 'text-neutral-500 dark:text-neutral-400',
    composerBg: 'bg-white/95 dark:bg-[#0f1012]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-neutral-200 dark:border-neutral-800',
    innerInputBg: 'bg-neutral-100 dark:bg-neutral-800',
    innerInputBorder: 'border border-neutral-300 dark:border-neutral-700 shadow-xs',
    innerInputText: 'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400',
    actionButtonText: 'text-neutral-600 dark:text-neutral-300',
    actionButtonHoverBg: 'hover:bg-neutral-200 dark:hover:bg-neutral-700',
    actionButtonActiveBg: 'bg-[#181a1d] text-white',
    accentBg: 'bg-[#181a1d] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs',
    accentText: 'text-white dark:text-neutral-900'
  },

  // ==================== 2. ATMOSPHERIC & NIGHT ====================
  {
    id: 'night_midnight_velvet',
    name: 'Midnight Velvet',
    category: 'night',
    description: 'Deep sapphire abyss with organic celestial constellations and muted starlight bubbles.',
    bgClass: 'bg-[#090d16] text-[#eff6ff]',
    bgStyle: {
      backgroundImage: AURORA_STARRY_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#152544]',
      sentText: 'text-[#eff6ff] font-[460]',
      receivedBg: 'bg-[#101726]',
      receivedText: 'text-[#eff6ff]',
      borderStyle: 'border border-[#1e345e] shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-blue-200/70',
      subtextReceived: 'text-blue-300/60',
      linkSent: 'text-sky-300 underline font-semibold',
      linkReceived: 'text-sky-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/15 text-white',
      cardBgReceived: 'bg-white/5 border-white/10 text-slate-100'
    },
    previewGradient: 'from-[#090d16] to-[#152544]',
    badge: 'Midnight',
    headerBg: 'bg-[#090d16]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#1e345e]',
    headerText: 'text-white',
    headerSubtext: 'text-blue-200/70',
    composerBg: 'bg-[#090d16]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#1e345e]',
    innerInputBg: 'bg-[#101726]',
    innerInputBorder: 'border border-[#1e345e] shadow-xs',
    innerInputText: 'text-blue-50 placeholder:text-blue-300/40',
    actionButtonText: 'text-blue-300/70',
    actionButtonHoverBg: 'hover:bg-[#152544]',
    actionButtonActiveBg: 'bg-blue-600 text-white',
    accentBg: 'bg-blue-500 hover:bg-blue-400 text-white shadow-xs',
    accentText: 'text-white'
  },
  {
    id: 'night_celestial_aurora',
    name: 'Nordic Aurora',
    category: 'night',
    description: 'Deep fjord twilight with organic faint auroral stardust and muted dark spruce bubbles.',
    bgClass: 'bg-[#071515] text-[#ecfdf5]',
    bgStyle: {
      backgroundImage: AURORA_STARRY_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#11403c]',
      sentText: 'text-[#e6fbf7] font-[460]',
      receivedBg: 'bg-[#0c2221]',
      receivedText: 'text-[#ecfdf5]',
      borderStyle: 'border border-[#19524d] shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-teal-200/70',
      subtextReceived: 'text-teal-300/60',
      linkSent: 'text-teal-300 underline font-semibold',
      linkReceived: 'text-teal-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/15 text-white',
      cardBgReceived: 'bg-white/5 border-white/10 text-teal-100'
    },
    previewGradient: 'from-[#071515] to-[#11403c]',
    badge: 'Aurora',
    headerBg: 'bg-[#071515]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#19524d]',
    headerText: 'text-white',
    headerSubtext: 'text-teal-300/70',
    composerBg: 'bg-[#071515]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#19524d]',
    innerInputBg: 'bg-[#0c2221]',
    innerInputBorder: 'border border-[#19524d] shadow-xs',
    innerInputText: 'text-teal-50 placeholder:text-teal-400/50',
    actionButtonText: 'text-teal-300/70',
    actionButtonHoverBg: 'hover:bg-[#11403c]',
    actionButtonActiveBg: 'bg-teal-500 text-white',
    accentBg: 'bg-teal-400 hover:bg-teal-300 text-teal-950 shadow-xs',
    accentText: 'text-teal-950'
  },
  {
    id: 'night_deep_cosmos',
    name: 'Deep Cosmos',
    category: 'night',
    description: 'Mysterious cosmic dark canvas with randomly scattered spiral dust and deep amethyst bubbles.',
    bgClass: 'bg-[#0b0618] text-[#f5f3ff]',
    bgStyle: {
      backgroundImage: GALAXY_COSMOS_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#33114d]',
      sentText: 'text-[#f6edff] font-[460]',
      receivedBg: 'bg-[#180a2b]',
      receivedText: 'text-[#f5f3ff]',
      borderStyle: 'border border-[#4c1e6e] shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-purple-200/70',
      subtextReceived: 'text-purple-300/60',
      linkSent: 'text-purple-300 underline font-semibold',
      linkReceived: 'text-purple-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/15 text-white',
      cardBgReceived: 'bg-white/5 border-white/10 text-purple-100'
    },
    previewGradient: 'from-[#0b0618] to-[#33114d]',
    badge: 'Cosmic',
    headerBg: 'bg-[#0b0618]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#4c1e6e]',
    headerText: 'text-white',
    headerSubtext: 'text-purple-300/70',
    composerBg: 'bg-[#0b0618]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#4c1e6e]',
    innerInputBg: 'bg-[#180a2b]',
    innerInputBorder: 'border border-[#4c1e6e] shadow-xs',
    innerInputText: 'text-purple-50 placeholder:text-purple-400/50',
    actionButtonText: 'text-purple-300/70',
    actionButtonHoverBg: 'hover:bg-[#33114d]',
    actionButtonActiveBg: 'bg-purple-600 text-white',
    accentBg: 'bg-purple-400 hover:bg-purple-300 text-purple-950 shadow-xs',
    accentText: 'text-purple-950'
  },
  {
    id: 'night_cyber_matrix',
    name: 'Obsidian Hearth',
    category: 'night',
    description: 'Dark roasted walnut canvas with gentle scattered warm embers and dark chestnut sent bubbles.',
    bgClass: 'bg-[#130d0a] text-[#faf5f0]',
    bgStyle: {
      backgroundImage: OBSIDIAN_HEARTH_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#3b1d12]',
      sentText: 'text-[#fdf5f0] font-[460]',
      receivedBg: 'bg-[#211510]',
      receivedText: 'text-[#faf5f0]',
      borderStyle: 'border border-[#542d1e] shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-amber-200/70',
      subtextReceived: 'text-amber-300/60',
      linkSent: 'text-amber-300 underline font-semibold',
      linkReceived: 'text-amber-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/15 text-white',
      cardBgReceived: 'bg-white/5 border-white/10 text-amber-100'
    },
    previewGradient: 'from-[#130d0a] to-[#3b1d12]',
    badge: 'Hearth',
    headerBg: 'bg-[#130d0a]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#542d1e]',
    headerText: 'text-white',
    headerSubtext: 'text-amber-200/70',
    composerBg: 'bg-[#130d0a]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#542d1e]',
    innerInputBg: 'bg-[#211510]',
    innerInputBorder: 'border border-[#542d1e] shadow-xs',
    innerInputText: 'text-amber-50 placeholder:text-amber-400/40',
    actionButtonText: 'text-amber-300/70',
    actionButtonHoverBg: 'hover:bg-[#3b1d12]',
    actionButtonActiveBg: 'bg-amber-600 text-white',
    accentBg: 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-xs',
    accentText: 'text-amber-950'
  },

  // ==================== 3. WARM & AESTHETIC ====================
  {
    id: 'warm_sunset_amber',
    name: 'Sienna Clay',
    category: 'warm',
    description: 'Tuscan sun-baked terracotta canvas with organic ceramic flecks and rich clay sent bubbles.',
    bgClass: 'bg-[#faf3ee] dark:bg-[#171310] text-[#36221c] dark:text-[#f8ede8]',
    bgStyle: {
      backgroundImage: TERRACOTTA_EARTH_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#82321b] dark:bg-[#6e2815]',
      sentText: 'text-[#fff7ed] font-[460]',
      receivedBg: 'bg-white dark:bg-[#221a16]',
      receivedText: 'text-[#36221c] dark:text-[#f8ede8]',
      borderStyle: 'border border-[#eeddd5] dark:border-[#382b25] shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-orange-200/75',
      subtextReceived: 'text-[#9c7164] dark:text-[#bda299]',
      linkSent: 'text-white underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-[#82321b] dark:text-[#ea580c] underline font-medium',
      cardBgSent: 'bg-white/12 border-white/20 text-white',
      cardBgReceived: 'bg-[#faf0e8] dark:bg-[#2b211c] border-[#eeddd5] dark:border-[#42342c] text-[#36221c] dark:text-[#f8ede8]'
    },
    previewGradient: 'from-[#faf3ee] to-[#f0d4c7] dark:from-[#171310] to-[#331911]',
    badge: 'Tuscan',
    headerBg: 'bg-white/95 dark:bg-[#171310]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#eeddd5] dark:border-[#2f231e]',
    headerText: 'text-[#36221c] dark:text-white',
    headerSubtext: 'text-[#9c7164] dark:text-[#bda299]',
    composerBg: 'bg-white/95 dark:bg-[#171310]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#eeddd5] dark:border-[#2f231e]',
    innerInputBg: 'bg-[#f5eae3] dark:bg-[#221a16]',
    innerInputBorder: 'border border-[#eeddd5] dark:border-[#382b25] shadow-xs',
    innerInputText: 'text-[#36221c] dark:text-[#f8ede8] placeholder:text-[#ab8376]',
    actionButtonText: 'text-[#82321b] dark:text-[#f97316]',
    actionButtonHoverBg: 'hover:bg-[#f0dfd6] dark:hover:bg-[#2b211c]',
    actionButtonActiveBg: 'bg-[#82321b] text-white',
    accentBg: 'bg-[#82321b] hover:bg-[#6c2815] text-white shadow-xs',
    accentText: 'text-white'
  },
  {
    id: 'warm_rose_velvet',
    name: 'Dusk Rosewood',
    category: 'warm',
    description: 'Antique dusty blush canvas with randomly scattered floating petals and deep rosewood burgundy bubbles.',
    bgClass: 'bg-[#fbf4f6] dark:bg-[#161114] text-[#3d2029] dark:text-[#faedf1]',
    bgStyle: {
      backgroundImage: LOVE_ROMANCE_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#661e38] dark:bg-[#52172c]',
      sentText: 'text-[#fef2f6] font-[460]',
      receivedBg: 'bg-white dark:bg-[#21161b]',
      receivedText: 'text-[#3d2029] dark:text-[#faedf1]',
      borderStyle: 'border border-[#eddbe1] dark:border-[#36252b] shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-rose-200/75',
      subtextReceived: 'text-[#966b77] dark:text-[#bfa1ab]',
      linkSent: 'text-rose-100 underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-[#661e38] dark:text-[#f472b6] underline font-medium',
      cardBgSent: 'bg-white/12 border-white/20 text-white',
      cardBgReceived: 'bg-[#f8edf1] dark:bg-[#2a1d23] border-[#eddbe1] dark:border-[#3e2b32] text-[#3d2029] dark:text-[#faedf1]'
    },
    previewGradient: 'from-[#fbf4f6] to-[#ebd2db] dark:from-[#161114] to-[#331521]',
    badge: 'Vintage',
    headerBg: 'bg-white/95 dark:bg-[#161114]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#eddbe1] dark:border-[#2b1c21]',
    headerText: 'text-[#3d2029] dark:text-white',
    headerSubtext: 'text-[#966b77] dark:text-[#bfa1ab]',
    composerBg: 'bg-white/95 dark:bg-[#161114]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#eddbe1] dark:border-[#2b1c21]',
    innerInputBg: 'bg-[#f4e8ec] dark:bg-[#21161b]',
    innerInputBorder: 'border border-[#eddbe1] dark:border-[#36252b] shadow-xs',
    innerInputText: 'text-[#3d2029] dark:text-[#faedf1] placeholder:text-[#a87d89]',
    actionButtonText: 'text-[#661e38] dark:text-[#f472b6]',
    actionButtonHoverBg: 'hover:bg-[#ebdbe0] dark:hover:bg-[#2b1f23]',
    actionButtonActiveBg: 'bg-[#661e38] text-white',
    accentBg: 'bg-[#661e38] hover:bg-[#50172b] text-white shadow-xs',
    accentText: 'text-white'
  },
  {
    id: 'warm_sakura_blossom',
    name: 'Sakura Breeze',
    category: 'warm',
    description: 'Soft Japanese spring blossom canvas with scattered drifting petals and muted plum-slate bubbles.',
    bgClass: 'bg-[#fcf5f7] dark:bg-[#161115] text-[#392128] dark:text-[#fbedf1]',
    bgStyle: {
      backgroundImage: SAKURA_BLOSSOM_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#56223b] dark:bg-[#45192e]',
      sentText: 'text-[#fdf2f6] font-[460]',
      receivedBg: 'bg-white dark:bg-[#21161d]',
      receivedText: 'text-[#392128] dark:text-[#fbedf1]',
      borderStyle: 'border border-[#eddfe3] dark:border-[#33242b] shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-pink-200/75',
      subtextReceived: 'text-[#916b77] dark:text-[#b89ca5]',
      linkSent: 'text-pink-200 underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-[#56223b] dark:text-[#f472b6] underline font-medium',
      cardBgSent: 'bg-white/12 border-white/20 text-white',
      cardBgReceived: 'bg-[#faf0f3] dark:bg-[#2b1d26] border-[#eddfe3] dark:border-[#3d2b34] text-[#392128] dark:text-[#fbedf1]'
    },
    previewGradient: 'from-[#fcf5f7] to-[#edd0dc] dark:from-[#161115] to-[#301623]',
    badge: 'Sakura',
    headerBg: 'bg-white/95 dark:bg-[#161115]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#eddfe3] dark:border-[#2b1c22]',
    headerText: 'text-[#392128] dark:text-white',
    headerSubtext: 'text-[#916b77] dark:text-[#b89ca5]',
    composerBg: 'bg-white/95 dark:bg-[#161115]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#eddfe3] dark:border-[#2b1c22]',
    innerInputBg: 'bg-[#f4e8ec] dark:bg-[#21161d]',
    innerInputBorder: 'border border-[#eddfe3] dark:border-[#33242b] shadow-xs',
    innerInputText: 'text-[#392128] dark:text-[#fbedf1] placeholder:text-[#9e7d88]',
    actionButtonText: 'text-[#56223b] dark:text-[#f472b6]',
    actionButtonHoverBg: 'hover:bg-[#ebdbe0] dark:hover:bg-[#2b1f26]',
    actionButtonActiveBg: 'bg-[#56223b] text-white',
    accentBg: 'bg-[#56223b] hover:bg-[#43192d] text-white shadow-xs',
    accentText: 'text-white'
  },
  {
    id: 'warm_terracotta',
    name: 'Caramel Crema',
    category: 'warm',
    description: 'Warm golden biscuit canvas with roasted coffee bean scatter and dark mocha espresso bubbles.',
    bgClass: 'bg-[#faf4ec] dark:bg-[#16120e] text-[#342419] dark:text-[#faefe6]',
    bgStyle: {
      backgroundImage: COFFEE_LIFESTYLE_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '380px 380px',
    },
    bubble: {
      sentBg: 'bg-[#482813] dark:bg-[#381e0d]',
      sentText: 'text-[#fdf9f5] font-[460]',
      receivedBg: 'bg-white dark:bg-[#221a14]',
      receivedText: 'text-[#342419] dark:text-[#faefe6]',
      borderStyle: 'border border-[#ebdfd3] dark:border-[#362b22] shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-[#e5d5c5]/80',
      subtextReceived: 'text-[#947a67] dark:text-[#bda797]',
      linkSent: 'text-amber-200 underline font-semibold decoration-white/50 hover:decoration-white',
      linkReceived: 'text-[#482813] dark:text-[#f59e0b] underline font-medium',
      cardBgSent: 'bg-white/12 border-white/20 text-white',
      cardBgReceived: 'bg-[#f8f0e5] dark:bg-[#2c2018] border-[#ebdfd3] dark:border-[#3f3227] text-[#342419] dark:text-[#faefe6]'
    },
    previewGradient: 'from-[#faf4ec] to-[#ebd3be] dark:from-[#16120e] to-[#301c10]',
    badge: 'Crema',
    headerBg: 'bg-white/95 dark:bg-[#16120e]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#ebdfd3] dark:border-[#2b2016]',
    headerText: 'text-[#342419] dark:text-white',
    headerSubtext: 'text-[#947a67] dark:text-[#bda797]',
    composerBg: 'bg-white/95 dark:bg-[#16120e]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#ebdfd3] dark:border-[#2b2016]',
    innerInputBg: 'bg-[#f4eae0] dark:bg-[#221a14]',
    innerInputBorder: 'border border-[#ebdfd3] dark:border-[#362b22] shadow-xs',
    innerInputText: 'text-[#342419] dark:text-[#faefe6] placeholder:text-[#9c8473]',
    actionButtonText: 'text-[#482813] dark:text-[#f59e0b]',
    actionButtonHoverBg: 'hover:bg-[#eddacf] dark:hover:bg-[#2c2018]',
    actionButtonActiveBg: 'bg-[#482813] text-white',
    accentBg: 'bg-[#482813] hover:bg-[#361c0b] text-white shadow-xs',
    accentText: 'text-white'
  }
];
