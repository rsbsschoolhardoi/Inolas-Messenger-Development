import React from 'react';
import { 
  ZENOA_AESTHETIC_MICRO_PATTERN,
  PREMIUM_MINIMAL_LINEN,
  AURORA_STARRY_PATTERN,
  GALAXY_COSMOS_PATTERN,
  CYBERPUNK_GRID_PATTERN,
  LOVE_ROMANCE_PATTERN,
  SAKURA_BLOSSOM_PATTERN,
  SWEET_CANDY_PATTERN
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
    description: 'Crisp neutral canvas with subtle aesthetic micro-motifs and obsidian sent bubbles.',
    bgClass: 'bg-[#f8f9fa] dark:bg-[#0f1117] text-neutral-900 dark:text-neutral-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '260px 260px',
    },
    bubble: {
      sentBg: 'bg-neutral-900 dark:bg-white',
      sentText: 'text-white dark:text-neutral-950 font-medium',
      receivedBg: 'bg-white dark:bg-neutral-850',
      receivedText: 'text-neutral-900 dark:text-neutral-100',
      borderStyle: 'border border-neutral-200/80 dark:border-neutral-800 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-neutral-300 dark:text-neutral-600',
      subtextReceived: 'text-neutral-400 dark:text-neutral-500',
      linkSent: 'text-indigo-300 dark:text-indigo-700 underline font-semibold',
      linkReceived: 'text-indigo-600 dark:text-indigo-400 underline font-medium',
      cardBgSent: 'bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20 text-white dark:text-neutral-950',
      cardBgReceived: 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
    },
    previewGradient: 'from-[#f8f9fa] to-[#e9ecef] dark:from-[#0f1117] to-[#1e2330]',
    badge: 'Editorial',
    headerBg: 'bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-neutral-200/80 dark:border-neutral-800',
    headerText: 'text-neutral-900 dark:text-white',
    headerSubtext: 'text-neutral-500 dark:text-neutral-400',
    composerBg: 'bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-neutral-200/80 dark:border-neutral-800',
    innerInputBg: 'bg-neutral-100/90 dark:bg-neutral-800/90',
    innerInputBorder: 'border border-neutral-300/80 dark:border-neutral-700/80 shadow-xs',
    innerInputText: 'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
    actionButtonText: 'text-neutral-600 dark:text-neutral-300',
    actionButtonHoverBg: 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80',
    actionButtonActiveBg: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950',
    accentBg: 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 shadow-md',
    accentText: 'text-white dark:text-neutral-950'
  },
  {
    id: 'minimal_obsidian',
    name: 'Obsidian Matte',
    category: 'minimal',
    description: 'Ultra-refined monochrome aesthetic with deep charcoal canvas and high-contrast accents.',
    bgClass: 'bg-[#121316] text-neutral-100',
    bgStyle: {
      backgroundImage: PREMIUM_MINIMAL_LINEN,
      backgroundRepeat: 'repeat',
      backgroundSize: '24px 24px',
    },
    bubble: {
      sentBg: 'bg-indigo-600 dark:bg-indigo-500',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-[#1e2025]',
      receivedText: 'text-neutral-100',
      borderStyle: 'border border-neutral-700/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-indigo-200',
      subtextReceived: 'text-neutral-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-indigo-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-neutral-800/80 border-neutral-700 text-neutral-100'
    },
    previewGradient: 'from-[#121316] to-[#252830]',
    badge: 'Monochrome',
    headerBg: 'bg-[#121316]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-neutral-800',
    headerText: 'text-white',
    headerSubtext: 'text-neutral-400',
    composerBg: 'bg-[#121316]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-neutral-800',
    innerInputBg: 'bg-[#1e2025]',
    innerInputBorder: 'border border-neutral-700 shadow-xs',
    innerInputText: 'text-white placeholder:text-neutral-500',
    actionButtonText: 'text-neutral-400',
    actionButtonHoverBg: 'hover:bg-neutral-800',
    actionButtonActiveBg: 'bg-indigo-600 text-white',
    accentBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30',
    accentText: 'text-white'
  },
  {
    id: 'minimal_nordic_fog',
    name: 'Nordic Fog',
    category: 'minimal',
    description: 'Calm Scandinavian mist palette with cool slate undertones and glacier blue send accents.',
    bgClass: 'bg-[#edf2f7] dark:bg-[#151a23] text-slate-900 dark:text-slate-100',
    bgStyle: {
      backgroundImage: PREMIUM_MINIMAL_LINEN,
      backgroundRepeat: 'repeat',
      backgroundSize: '30px 30px',
    },
    bubble: {
      sentBg: 'bg-sky-600 dark:bg-sky-500',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-white dark:bg-[#1e2633]',
      receivedText: 'text-slate-900 dark:text-slate-100',
      borderStyle: 'border border-slate-200/80 dark:border-slate-700/70 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-sky-100',
      subtextReceived: 'text-slate-400 dark:text-slate-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-sky-600 dark:text-sky-400 underline font-medium',
      cardBgSent: 'bg-white/15 border-white/25 text-white',
      cardBgReceived: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
    },
    previewGradient: 'from-[#edf2f7] to-[#cbd5e1] dark:from-[#151a23] to-[#243042]',
    badge: 'Nordic',
    headerBg: 'bg-white/95 dark:bg-[#151a23]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-slate-200 dark:border-slate-800',
    headerText: 'text-slate-900 dark:text-white',
    headerSubtext: 'text-slate-500 dark:text-slate-400',
    composerBg: 'bg-white/95 dark:bg-[#151a23]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-slate-200 dark:border-slate-800',
    innerInputBg: 'bg-slate-100 dark:bg-[#1e2633]',
    innerInputBorder: 'border border-slate-300/80 dark:border-slate-700 shadow-xs',
    innerInputText: 'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
    actionButtonText: 'text-slate-600 dark:text-slate-300',
    actionButtonHoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    actionButtonActiveBg: 'bg-sky-600 text-white',
    accentBg: 'bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/25',
    accentText: 'text-white'
  },
  {
    id: 'minimal_warm_parchment',
    name: 'Warm Parchment',
    category: 'minimal',
    description: 'Tactile editorial cream paper aesthetic with espresso typography and bronze accents.',
    bgClass: 'bg-[#fbf9f5] dark:bg-[#1c1917] text-[#292524] dark:text-[#f5f5f4]',
    bgStyle: {
      backgroundImage: PREMIUM_MINIMAL_LINEN,
      backgroundRepeat: 'repeat',
      backgroundSize: '28px 28px',
    },
    bubble: {
      sentBg: 'bg-[#44403c] dark:bg-[#d6d3d1]',
      sentText: 'text-white dark:text-[#1c1917] font-medium',
      receivedBg: 'bg-[#ffffff] dark:bg-[#292524]',
      receivedText: 'text-[#292524] dark:text-[#f5f5f4]',
      borderStyle: 'border border-[#e7e5e4] dark:border-[#44403c] shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-stone-300 dark:text-stone-600',
      subtextReceived: 'text-stone-400 dark:text-stone-500',
      linkSent: 'text-amber-200 dark:text-amber-800 underline font-semibold',
      linkReceived: 'text-amber-700 dark:text-amber-400 underline font-medium',
      cardBgSent: 'bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20 text-white dark:text-[#1c1917]',
      cardBgReceived: 'bg-[#f5f5f4] dark:bg-[#1c1917] border-[#e7e5e4] dark:border-[#44403c] text-[#292524] dark:text-[#f5f5f4]'
    },
    previewGradient: 'from-[#fbf9f5] to-[#e7e5e4] dark:from-[#1c1917] to-[#292524]',
    badge: 'Parchment',
    headerBg: 'bg-[#fbf9f5]/95 dark:bg-[#1c1917]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-[#e7e5e4] dark:border-[#44403c]',
    headerText: 'text-[#292524] dark:text-white',
    headerSubtext: 'text-stone-500 dark:text-stone-400',
    composerBg: 'bg-[#fbf9f5]/95 dark:bg-[#1c1917]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-[#e7e5e4] dark:border-[#44403c]',
    innerInputBg: 'bg-[#f5f5f4] dark:bg-[#292524]',
    innerInputBorder: 'border border-[#d6d3d1] dark:border-[#44403c] shadow-xs',
    innerInputText: 'text-[#292524] dark:text-[#f5f5f4] placeholder:text-stone-400',
    actionButtonText: 'text-stone-600 dark:text-stone-300',
    actionButtonHoverBg: 'hover:bg-stone-200 dark:hover:bg-stone-800',
    actionButtonActiveBg: 'bg-[#44403c] text-white',
    accentBg: 'bg-[#44403c] hover:bg-[#292524] dark:bg-[#d6d3d1] dark:hover:bg-[#f5f5f4] shadow-md',
    accentText: 'text-white dark:text-[#1c1917]'
  },

  // ==================== 2. ATMOSPHERIC & NIGHT ====================
  {
    id: 'night_midnight_velvet',
    name: 'Midnight Velvet',
    category: 'night',
    description: 'Deep royal sapphire canvas with vibrant electric indigo send controls.',
    bgClass: 'bg-[#080d1a] text-slate-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '240px 240px',
    },
    bubble: {
      sentBg: 'bg-indigo-600',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-[#11192e]',
      receivedText: 'text-slate-100',
      borderStyle: 'border border-indigo-900/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-indigo-200',
      subtextReceived: 'text-slate-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-indigo-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-[#18233f] border-indigo-900/60 text-slate-100'
    },
    previewGradient: 'from-[#080d1a] to-[#18233f]',
    badge: 'Sapphire',
    headerBg: 'bg-[#080d1a]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-indigo-950',
    headerText: 'text-white',
    headerSubtext: 'text-indigo-300',
    composerBg: 'bg-[#080d1a]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-indigo-950',
    innerInputBg: 'bg-[#11192e]',
    innerInputBorder: 'border border-indigo-900/80 shadow-xs',
    innerInputText: 'text-white placeholder:text-slate-500',
    actionButtonText: 'text-indigo-300',
    actionButtonHoverBg: 'hover:bg-[#18233f]',
    actionButtonActiveBg: 'bg-indigo-600 text-white',
    accentBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30',
    accentText: 'text-white'
  },
  {
    id: 'night_celestial_aurora',
    name: 'Celestial Aurora',
    category: 'night',
    description: 'Enchanting purple twilight atmosphere with illuminated amethyst send bubbles.',
    bgClass: 'bg-[#0e0720] text-purple-100',
    bgStyle: {
      backgroundImage: AURORA_STARRY_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '200px 200px',
    },
    bubble: {
      sentBg: 'bg-purple-600',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-[#1a1033]',
      receivedText: 'text-purple-100',
      borderStyle: 'border border-purple-900/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-purple-200',
      subtextReceived: 'text-purple-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-purple-300 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-[#251847] border-purple-900/60 text-purple-100'
    },
    previewGradient: 'from-[#0e0720] to-[#251847]',
    badge: 'Aurora',
    headerBg: 'bg-[#0e0720]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-purple-950',
    headerText: 'text-white',
    headerSubtext: 'text-purple-300',
    composerBg: 'bg-[#0e0720]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-purple-950',
    innerInputBg: 'bg-[#1a1033]',
    innerInputBorder: 'border border-purple-900/80 shadow-xs',
    innerInputText: 'text-white placeholder:text-purple-400',
    actionButtonText: 'text-purple-300',
    actionButtonHoverBg: 'hover:bg-[#251847]',
    actionButtonActiveBg: 'bg-purple-600 text-white',
    accentBg: 'bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30',
    accentText: 'text-white'
  },
  {
    id: 'night_deep_cosmos',
    name: 'Deep Cosmos',
    category: 'night',
    description: 'Star-studded cosmic vista with luminous violet gradients and frosted glass elements.',
    bgClass: 'bg-[#060814] text-indigo-100',
    bgStyle: {
      backgroundImage: GALAXY_COSMOS_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '240px 240px',
    },
    bubble: {
      sentBg: 'bg-violet-600',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-[#101428]',
      receivedText: 'text-indigo-100',
      borderStyle: 'border border-indigo-900/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-violet-200',
      subtextReceived: 'text-indigo-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-violet-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-[#181f3b] border-indigo-900/60 text-indigo-100'
    },
    previewGradient: 'from-[#060814] to-[#181f3b]',
    badge: 'Cosmos',
    headerBg: 'bg-[#060814]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-indigo-950',
    headerText: 'text-white',
    headerSubtext: 'text-indigo-400',
    composerBg: 'bg-[#060814]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-indigo-950',
    innerInputBg: 'bg-[#101428]',
    innerInputBorder: 'border border-indigo-900/80 shadow-xs',
    innerInputText: 'text-white placeholder:text-indigo-400',
    actionButtonText: 'text-indigo-300',
    actionButtonHoverBg: 'hover:bg-[#181f3b]',
    actionButtonActiveBg: 'bg-violet-600 text-white',
    accentBg: 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/30',
    accentText: 'text-white'
  },
  {
    id: 'night_cyber_matrix',
    name: 'Cyberpunk Grid',
    category: 'night',
    description: 'Sleek dark tech grid with neon magenta send controls and high-contrast styling.',
    bgClass: 'bg-[#090a0f] text-rose-100',
    bgStyle: {
      backgroundImage: CYBERPUNK_GRID_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '60px 60px',
    },
    bubble: {
      sentBg: 'bg-rose-600',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-[#151722]',
      receivedText: 'text-rose-100',
      borderStyle: 'border border-rose-900/50 shadow-xs',
      isSentDark: true,
      isReceivedDark: true,
      subtextSent: 'text-rose-200',
      subtextReceived: 'text-rose-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-cyan-400 underline font-medium',
      cardBgSent: 'bg-white/10 border-white/20 text-white',
      cardBgReceived: 'bg-[#1f2233] border-rose-900/50 text-rose-100'
    },
    previewGradient: 'from-[#090a0f] to-[#1f2233]',
    badge: 'Matrix',
    headerBg: 'bg-[#090a0f]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-rose-950',
    headerText: 'text-white',
    headerSubtext: 'text-rose-400',
    composerBg: 'bg-[#090a0f]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-rose-950',
    innerInputBg: 'bg-[#151722]',
    innerInputBorder: 'border border-rose-900/80 shadow-xs',
    innerInputText: 'text-white placeholder:text-rose-400',
    actionButtonText: 'text-rose-300',
    actionButtonHoverBg: 'hover:bg-[#1f2233]',
    actionButtonActiveBg: 'bg-rose-600 text-white',
    accentBg: 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30',
    accentText: 'text-white'
  },

  // ==================== 3. WARM & ROMANCE ====================
  {
    id: 'warm_rose_velvet',
    name: 'Rose Velvet',
    category: 'warm',
    description: 'Romantic dusky rose canvas with rich crimson velvet bubbles and golden warmth.',
    bgClass: 'bg-[#fdf2f4] dark:bg-[#1c0d12] text-rose-950 dark:text-rose-100',
    bgStyle: {
      backgroundImage: LOVE_ROMANCE_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '260px 260px',
    },
    bubble: {
      sentBg: 'bg-rose-600 dark:bg-rose-500',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-white dark:bg-[#2b141d]',
      receivedText: 'text-rose-950 dark:text-rose-100',
      borderStyle: 'border border-rose-200/80 dark:border-rose-900/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-rose-200',
      subtextReceived: 'text-rose-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-rose-600 dark:text-rose-400 underline font-medium',
      cardBgSent: 'bg-white/15 border-white/25 text-white',
      cardBgReceived: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-100'
    },
    previewGradient: 'from-[#fdf2f4] to-[#fecdd3] dark:from-[#1c0d12] to-[#3f1624]',
    badge: 'Romance',
    headerBg: 'bg-white/95 dark:bg-[#1c0d12]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-rose-200 dark:border-rose-950',
    headerText: 'text-rose-950 dark:text-white',
    headerSubtext: 'text-rose-600 dark:text-rose-400',
    composerBg: 'bg-white/95 dark:bg-[#1c0d12]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-rose-200 dark:border-rose-950',
    innerInputBg: 'bg-rose-50/80 dark:bg-[#2b141d]',
    innerInputBorder: 'border border-rose-200 dark:border-rose-900 shadow-xs',
    innerInputText: 'text-rose-950 dark:text-rose-100 placeholder:text-rose-400',
    actionButtonText: 'text-rose-600 dark:text-rose-300',
    actionButtonHoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-900/50',
    actionButtonActiveBg: 'bg-rose-600 text-white',
    accentBg: 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/25',
    accentText: 'text-white'
  },
  {
    id: 'warm_sunset_amber',
    name: 'Sunset Amber',
    category: 'warm',
    description: 'Golden hour warmth with honey amber undertones and vibrant coral send buttons.',
    bgClass: 'bg-[#fffbeb] dark:bg-[#1c150c] text-amber-950 dark:text-amber-100',
    bgStyle: {
      backgroundImage: ZENOA_AESTHETIC_MICRO_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '240px 240px',
    },
    bubble: {
      sentBg: 'bg-amber-600 dark:bg-amber-500',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-white dark:bg-[#2b2012]',
      receivedText: 'text-amber-950 dark:text-amber-100',
      borderStyle: 'border border-amber-200/80 dark:border-amber-900/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-amber-100',
      subtextReceived: 'text-amber-500',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-amber-700 dark:text-amber-400 underline font-medium',
      cardBgSent: 'bg-white/15 border-white/25 text-white',
      cardBgReceived: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-100'
    },
    previewGradient: 'from-[#fffbeb] to-[#fde68a] dark:from-[#1c150c] to-[#382714]',
    badge: 'Amber',
    headerBg: 'bg-white/95 dark:bg-[#1c150c]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-amber-200 dark:border-amber-950',
    headerText: 'text-amber-950 dark:text-white',
    headerSubtext: 'text-amber-600 dark:text-amber-400',
    composerBg: 'bg-white/95 dark:bg-[#1c150c]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-amber-200 dark:border-amber-950',
    innerInputBg: 'bg-amber-50/80 dark:bg-[#2b2012]',
    innerInputBorder: 'border border-amber-200 dark:border-amber-900 shadow-xs',
    innerInputText: 'text-amber-950 dark:text-amber-100 placeholder:text-amber-400',
    actionButtonText: 'text-amber-700 dark:text-amber-300',
    actionButtonHoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/50',
    actionButtonActiveBg: 'bg-amber-600 text-white',
    accentBg: 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/25',
    accentText: 'text-white'
  },
  {
    id: 'warm_sakura_blossom',
    name: 'Sakura Blossom',
    category: 'warm',
    description: 'Gentle cherry petal micro-pattern with soft pastel cards and radiant fuchsia send controls.',
    bgClass: 'bg-[#fdf4f8] dark:bg-[#1a0f16] text-pink-950 dark:text-pink-100',
    bgStyle: {
      backgroundImage: SAKURA_BLOSSOM_PATTERN,
      backgroundRepeat: 'repeat',
      backgroundSize: '200px 200px',
    },
    bubble: {
      sentBg: 'bg-pink-600 dark:bg-pink-500',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-white dark:bg-[#291724]',
      receivedText: 'text-pink-950 dark:text-pink-100',
      borderStyle: 'border border-pink-200/80 dark:border-pink-900/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-pink-200',
      subtextReceived: 'text-pink-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-pink-600 dark:text-pink-400 underline font-medium',
      cardBgSent: 'bg-white/15 border-white/25 text-white',
      cardBgReceived: 'bg-pink-50 dark:bg-pink-950/50 border-pink-200 dark:border-pink-900 text-pink-950 dark:text-pink-100'
    },
    previewGradient: 'from-[#fdf4f8] to-[#fbcfe8] dark:from-[#1a0f16] to-[#3b1c31]',
    badge: 'Blossom',
    headerBg: 'bg-white/95 dark:bg-[#1a0f16]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-pink-200 dark:border-pink-950',
    headerText: 'text-pink-950 dark:text-white',
    headerSubtext: 'text-pink-600 dark:text-pink-400',
    composerBg: 'bg-white/95 dark:bg-[#1a0f16]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-pink-200 dark:border-pink-950',
    innerInputBg: 'bg-pink-50/80 dark:bg-[#291724]',
    innerInputBorder: 'border border-pink-200 dark:border-pink-900 shadow-xs',
    innerInputText: 'text-pink-950 dark:text-pink-100 placeholder:text-pink-400',
    actionButtonText: 'text-pink-600 dark:text-pink-300',
    actionButtonHoverBg: 'hover:bg-pink-100 dark:hover:bg-pink-900/50',
    actionButtonActiveBg: 'bg-pink-600 text-white',
    accentBg: 'bg-pink-600 hover:bg-pink-500 shadow-md shadow-pink-600/25',
    accentText: 'text-white'
  },
  {
    id: 'warm_terracotta',
    name: 'Terracotta Hearth',
    category: 'warm',
    description: 'Earthy Mediterranean terracotta clay tones with rich rust-orange send buttons.',
    bgClass: 'bg-[#faf4f0] dark:bg-[#1c130e] text-[#431407] dark:text-[#ffedd5]',
    bgStyle: {
      backgroundImage: PREMIUM_MINIMAL_LINEN,
      backgroundRepeat: 'repeat',
      backgroundSize: '26px 26px',
    },
    bubble: {
      sentBg: 'bg-[#ea580c] dark:bg-[#f97316]',
      sentText: 'text-white font-medium',
      receivedBg: 'bg-white dark:bg-[#2b1d15]',
      receivedText: 'text-[#431407] dark:text-[#ffedd5]',
      borderStyle: 'border border-orange-200/80 dark:border-orange-950/60 shadow-xs',
      isSentDark: true,
      isReceivedDark: false,
      subtextSent: 'text-orange-100',
      subtextReceived: 'text-orange-400',
      linkSent: 'text-white underline font-semibold',
      linkReceived: 'text-orange-600 dark:text-orange-400 underline font-medium',
      cardBgSent: 'bg-white/15 border-white/25 text-white',
      cardBgReceived: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900 text-orange-950 dark:text-orange-100'
    },
    previewGradient: 'from-[#faf4f0] to-[#fed7aa] dark:from-[#1c130e] to-[#3a2216]',
    badge: 'Terracotta',
    headerBg: 'bg-white/95 dark:bg-[#1c130e]/95 backdrop-blur-xl',
    headerBorder: 'border-b border-orange-200 dark:border-orange-950',
    headerText: 'text-[#431407] dark:text-white',
    headerSubtext: 'text-orange-600 dark:text-orange-400',
    composerBg: 'bg-white/95 dark:bg-[#1c130e]/95 backdrop-blur-xl',
    composerBorder: 'border-t border-orange-200 dark:border-orange-950',
    innerInputBg: 'bg-orange-50/80 dark:bg-[#2b1d15]',
    innerInputBorder: 'border border-orange-200 dark:border-orange-900 shadow-xs',
    innerInputText: 'text-[#431407] dark:text-[#ffedd5] placeholder:text-orange-400',
    actionButtonText: 'text-orange-700 dark:text-orange-300',
    actionButtonHoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/50',
    actionButtonActiveBg: 'bg-orange-600 text-white',
    accentBg: 'bg-[#ea580c] hover:bg-[#c2410c] shadow-md shadow-orange-600/25',
    accentText: 'text-white'
  }
];
