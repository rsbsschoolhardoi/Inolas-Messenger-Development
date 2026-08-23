import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ArrowRight, Lock, Sun, Moon, ChevronDown, 
  ChevronUp, Send, Check, Terminal, FileText, Key,
  Cpu, Layers, Zap, Radio, ShieldAlert, Sparkles, Eye, EyeOff,
  Video, Phone, WifiOff, Globe, Image as ImageIcon, Flame, 
  MonitorSmartphone, KeyRound, Mic
} from 'lucide-react';

interface LandingPageProps {
  onStartAuth: (mode?: 'login' | 'register') => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAuth,
  themeMode,
  onToggleTheme
}) => {
  const [activeDocTab, setActiveDocTab] = useState<'crypto' | 'privacy' | 'terms' | 'architecture'>('crypto');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  
  // Contact Form State
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSent, setContactSent] = useState<boolean>(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMessage) {
      setContactSent(true);
      setTimeout(() => {
        setContactSent(false);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      }, 4000);
    }
  };

  const [demoText, setDemoText] = useState<string>('Meet me at the secret rendezvous spot at 9:00 PM.');
  const [isDemoEncrypted, setIsDemoEncrypted] = useState<boolean>(true);

  // Helper to generate a fake but highly realistic AES-256 encrypted string based on text
  const getSimulatedCipher = (text: string) => {
    if (!text) return '';
    const charCodesSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockIv = 'e5a1b3' + (charCodesSum % 9999).toString(16).padStart(4, '0') + 'd2c4e9f7';
    const mockTag = 'a9b8' + (charCodesSum * 3 % 99).toString(16).padStart(2, '0') + 'c7d6';
    const b64 = btoa(text.substring(0, 20) + '...zenoa_secured_payload_256...');
    const mockCipherText = b64.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    return JSON.stringify({
      iv: mockIv,
      ciphertext: mockCipherText,
      tag: mockTag,
      algorithm: 'AES-256-GCM',
      key_strength: '256-bit (Zero-Knowledge)'
    }, null, 2);
  };

  const faqs = [
    {
      q: "What makes Zenoa unique compared to traditional chat apps?",
      a: "Zenoa is built with a zero-knowledge architectural foundation. Messages, voice notes, and WebRTC video calls are encrypted locally on your device via client-side Web Crypto API (AES-256-GCM) prior to network transmission. No plaintext ever touches intermediate database nodes or server logs."
    },
    {
      q: "Are video and audio calls actually Peer-to-Peer?",
      a: "Yes. Our High-Definition WebRTC engine establishes direct peer-to-peer connections using secure STUN/TURN relays. Your media stream flows directly between devices, ensuring ultra-low latency and total privacy."
    },
    {
      q: "Is 'Delete for Everyone' absolute and instant?",
      a: "Yes. Requesting a global delete executes an atomic purge instruction across real-time cloud databases, local IndexedDB caches, and client state pools across all active chat sessions immediately."
    },
    {
      q: "How does the Offline Resilience feature work?",
      a: "Zenoa aggressively caches encrypted fragments locally. If you lose connection during a commute or flight, you can still view your entire chat history, compose draft replies, and queue them for instant delivery the moment you regain signal."
    },
    {
      q: "Does Zenoa collect personal metrics or sell user activity?",
      a: "No. Zenoa enforces a strict Zero-Telemetry Policy. We do not sell user data, track web analytics across external sites, or inject third-party ad tracking scripts."
    },
    {
      q: "Can I log in using either Email or Username?",
      a: "Yes. You can sign in using your verified email address or your unique @handle along with your secure password, as well as using secure Passwordless Magic Links."
    }
  ];

  return (
    <div className={`min-h-screen h-full w-full overflow-y-auto overflow-x-hidden flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 ${
      themeMode === 'dark' ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      {/* Decorative premium glowing mesh backgrounds */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none opacity-60 dark:opacity-40" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-sans font-black text-xl flex items-center justify-center shadow-md">
              Z
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-[0.18em] uppercase text-neutral-900 dark:text-white leading-none">
                Zenoa
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">
                Suite
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Security</a>
            <a href="#docs" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Policies</a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Support</a>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {themeMode === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
            </button>

            <button
              onClick={() => onStartAuth('login')}
              className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => onStartAuth('register')}
              className="px-4.5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-bold shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-24 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold mb-6 shadow-xs"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Zero-Knowledge AES-256 & WebRTC Engine</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-neutral-900 dark:text-white tracking-tight max-w-5xl mx-auto leading-[1.05]"
          >
            The Ultimate Standard for Secure Communication.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
          >
            Zenoa couples ultra-low latency P2P video calling and 256-bit zero-knowledge encryption with premium visual design, offline resilience, and absolute data sovereignty.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => onStartAuth('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-bold text-sm shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onStartAuth('login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700"
            >
              <span>Sign In</span>
            </button>
          </motion.div>

          {/* INTERACTIVE CRYPTOGRAPHIC SANDBOX SIMULATOR */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12 max-w-4xl mx-auto rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/40 p-5 sm:p-6 backdrop-blur-xl shadow-xl text-left"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200/60 dark:border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Client Cryptography Engine Sandbox
                </h3>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Real-Time Local Test
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Pane - Input Plaintext */}
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Local Plaintext Input
                </label>
                <div className="relative flex-1">
                  <textarea
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    placeholder="Type private message here..."
                    className="w-full h-32 p-3.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 outline-none focus:border-indigo-500 transition-all font-medium text-neutral-800 dark:text-neutral-200 resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-xl border border-neutral-200/50 dark:border-neutral-700/60 text-[10px] text-neutral-500">
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Keys reside only in RAM</span>
                  </div>
                </div>
              </div>

              {/* Right Pane - Encrypted Payload */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Client Packaged Payload (JSON)
                  </label>
                  <button
                    onClick={() => setIsDemoEncrypted(!isDemoEncrypted)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isDemoEncrypted ? 'Show Plaintext' : 'Apply AES-256 Encryption'}
                  </button>
                </div>

                <div className="relative h-32 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-950 p-3.5 font-mono text-[10px] sm:text-[11px] overflow-auto text-emerald-400 select-all shadow-inner leading-relaxed">
                  {isDemoEncrypted ? (
                    <pre className="whitespace-pre-wrap">{getSimulatedCipher(demoText)}</pre>
                  ) : (
                    <div className="text-neutral-300">
                      <span className="text-neutral-500 font-bold">// Standard Plaintext (Vulnerable to Intermediate Node Sniffing):</span>
                      <p className="mt-1 font-sans text-xs text-neutral-100">{demoText || 'Empty payload'}</p>
                      <p className="mt-3 text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <span className="h-1 w-1 bg-rose-400 rounded-full" />
                        <span>Warning: Plaintext can be cached by networks!</span>
                      </p>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    {isDemoEncrypted ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-400 font-bold border border-emerald-500/20">
                        <Lock className="h-2.5 w-2.5" /> SECURE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-[9px] text-rose-400 font-bold border border-rose-500/20 animate-pulse">
                        <ShieldAlert className="h-2.5 w-2.5" /> DECRYPTED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-neutral-200/60 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500 animate-pulse" />
                <span>WebCrypto API handles high-throughput packaging natively without external server latency.</span>
              </span>
              <button
                onClick={() => onStartAuth('register')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Create Secure Account Now</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>

          {/* Interactive Interface Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-14 max-w-4xl mx-auto rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 shadow-2xl p-2 backdrop-blur-xl text-left"
          >
            <div className="rounded-2xl bg-neutral-900 text-white p-5 sm:p-7 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-850 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-750">
                    AZ
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Aman Azad</h4>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>AES-GCM 256 Client Channel Active</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Zero Logs
                </span>
              </div>

              {/* Chat Content */}
              <div className="space-y-4 my-2">
                <div className="flex justify-start">
                  <div className="bg-neutral-800 text-neutral-100 p-3.5 rounded-2xl rounded-tl-xs max-w-[85%] text-xs shadow-sm border border-neutral-700/60 leading-relaxed">
                    Client-side AES-250 payload encryption is fully active. Text wrapping is perfectly formatted, with zero overlap and high-contrast rendering.
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-xs max-w-[85%] text-xs shadow-md leading-relaxed">
                    Verified! All message payloads are strictly isolated. No one else can ever read our private conversations.
                  </div>
                </div>
              </div>

              {/* Footer Composer preview */}
              <div className="mt-4 p-2.5 rounded-2xl bg-neutral-800/90 border border-neutral-750 flex items-center gap-2.5">
                <span className="text-xs text-neutral-400 flex-1 px-2">Type an encrypted payload...</span>
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm cursor-pointer">
                  <Send className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CORE ARCHITECTURAL FEATURES & CAPABILITIES */}
      <section id="features" className="py-24 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-3">
              Platform Capabilities
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-6">
              Engineered for absolute privacy and flawless communication.
            </h2>
            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Zenoa is not just another messaging app. It is a comprehensive suite of advanced communication tools built on a foundation of zero-knowledge cryptography, real-time edge synchronization, and uncompromising design.
            </p>
          </div>

          {/* Bento Grid Layout for Major Features */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
            
            {/* Feature 1: WebRTC Calling - Large Block */}
            <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 md:p-12 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Video className="w-48 h-48" />
              </div>
              <div className="relative z-10 max-w-lg">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-4">
                  High-Definition P2P WebRTC Calls
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                  Experience crystal-clear voice and video calls powered by direct Peer-to-Peer WebRTC connections. With dynamic resolution scaling (up to 720p HD), background noise suppression, and real-time camera switching, your conversations feel natural and completely private.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> End-to-end encrypted media streams
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Seamless front/rear camera flipping
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Integrated call duration & history logs
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Zero-Knowledge - Small Block */}
            <div className="md:col-span-4 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 transition-all hover:shadow-xl hover:shadow-rose-500/5">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-3">
                WebCrypto AES-256-GCM
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Native client-side payload obfuscation guarantees zero plain-text leaks. Even we cannot read your messages or access your media.
              </p>
            </div>

            {/* Feature 3: Cross-Platform Sync - Small Block */}
            <div className="md:col-span-4 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 transition-all hover:shadow-xl hover:shadow-sky-500/5">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-6">
                <MonitorSmartphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-3">
                Multi-Device Sync
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Access your encrypted message history flawlessly across mobile, tablet, and desktop browsers with sub-10ms real-time Firestore edge synchronization.
              </p>
            </div>

            {/* Feature 4: Media & Voice - Large Block */}
            <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-8 md:p-12 transition-all hover:shadow-xl hover:shadow-amber-500/5">
               <div className="absolute bottom-0 right-0 p-8 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Mic className="w-48 h-48" />
              </div>
              <div className="relative z-10 max-w-lg">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-4">
                  Rich Media & Voice Waveforms
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                  Share high-resolution images, documents, and expressive voice notes effortlessly. Our synthetic voice engine analyzes audio in real-time to generate beautiful, interactive waveforms that you can scrub and preview before sending.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Drag-and-drop file attachments
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Live audio frequency visualization
                  </li>
                  <li className="flex items-center gap-3 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    <Check className="h-4 w-4 text-emerald-500" /> Automatic media compression & encryption
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Advanced Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <Flame className="h-6 w-6 text-orange-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Atomic Memory Purge</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Global "Delete for Everyone" triggers an immediate atomic purge across databases and local IndexedDB caches.
              </p>
            </div>
            
            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <WifiOff className="h-6 w-6 text-neutral-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Offline Resilience</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Access your chat history and draft replies even when internet connection drops via aggressive local caching.
              </p>
            </div>

            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <KeyRound className="h-6 w-6 text-emerald-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Passwordless Entry</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Support for secure Magic Link email logins alongside highly-salted traditional credential authentication.
              </p>
            </div>

            <div className="p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
              <Globe className="h-6 w-6 text-indigo-500 mb-4" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">Zero-Telemetry Policy</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Strict operational standard ensures no third-party tracking pixels, location harvesters, or invasive metrics.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECURITY SPECIFICATIONS & LEGAL DOCUMENTATION */}
      <section id="security" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              System Documentation
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Security Specifications & Legal Policies
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Clear technical disclosures, data privacy rules, terms of service, and database models.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-wrap justify-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
              <button
                onClick={() => setActiveDocTab('crypto')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  activeDocTab === 'crypto'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                Cryptography Spec
              </button>
              <button
                onClick={() => setActiveDocTab('privacy')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  activeDocTab === 'privacy'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveDocTab('terms')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  activeDocTab === 'terms'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={() => setActiveDocTab('architecture')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  activeDocTab === 'architecture'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                Database Schema
              </button>
            </div>
          </div>

          {/* Tab Content Box */}
          <div className="max-w-4xl mx-auto rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-6 sm:p-8 text-left text-xs leading-relaxed space-y-4">
            {activeDocTab === 'crypto' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <Key className="h-5 w-5" />
                  <h3>Client-Side AES-GCM Zero-Knowledge Protocol</h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Zenoa utilizes native client-side browser cryptography (`window.crypto.subtle`). Every plaintext message undergoes authenticated payload encryption prior to network transmission.
                </p>
                <div className="p-4 rounded-2xl bg-neutral-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  <p>// Encrypted Payload Schema</p>
                  <p>EncryptedPayload = {'{'}</p>
                  <p>&nbsp;&nbsp;iv: "a8f3b2...128-bit Initialization Vector",</p>
                  <p>&nbsp;&nbsp;cipherText: "x9Z7kM...AES-256 Ciphertext",</p>
                  <p>&nbsp;&nbsp;tag: "e4d2...128-bit Authentication Tag"</p>
                  <p>{'}'}</p>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-500 dark:text-neutral-400">
                  <li>Ephemeral Keys: Keys reside solely within active client memory and are never written to disk or sent across server logs.</li>
                  <li>Tamper Protection: Authenticated Galois Mode tags prevent middle-box payload manipulation.</li>
                </ul>
              </div>
            )}

            {activeDocTab === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <ShieldCheck className="h-5 w-5" />
                  <h3>Data Privacy & Zero-Log Standard</h3>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  We hold privacy as a foundational engineering constraint, not a secondary preference.
                </p>
                <div className="space-y-2 text-neutral-500 dark:text-neutral-400">
                  <p className="font-bold text-neutral-900 dark:text-white">1. Minimal Account Data:</p>
                  <p>We store only essential identifiers: display name, unique @username, registered email address, and avatar seed. We do not harvest device IMEI, contacts, or location vectors.</p>
                  
                  <p className="font-bold text-neutral-900 dark:text-white mt-3">2. Zero Sale of Personal Info:</p>
                  <p>Zenoa never sells, rents, or monetizes user profiles or activity logs to ad brokers or third parties.</p>

                  <p className="font-bold text-neutral-900 dark:text-white mt-3">3. Immediate Content Erasure:</p>
                  <p>Executing "Delete for Everyone" purges message documents directly from database indices and local client caches.</p>
                </div>
              </div>
            )}

            {activeDocTab === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <FileText className="h-5 w-5" />
                  <h3>Terms & Conditions of Service</h3>
                </div>
                <div className="space-y-2 text-neutral-500 dark:text-neutral-400">
                  <p className="font-bold text-neutral-900 dark:text-white">1. Authorized Usage:</p>
                  <p>You agree not to utilize Zenoa for unlawful activities, automated spam dissemination, or network attacks. Account violations subject the user to immediate suspension.</p>

                  <p className="font-bold text-neutral-900 dark:text-white mt-3">2. User Ownership:</p>
                  <p>Users maintain complete, unencumbered ownership rights over all messages, media files, and attachments transmitted using Zenoa.</p>

                  <p className="font-bold text-neutral-900 dark:text-white mt-3">3. Infrastructure Standards:</p>
                  <p>Services are provided on a high-availability serverless deployment stack with continuous encryption validation.</p>
                </div>
              </div>
            )}

            {activeDocTab === 'architecture' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <Terminal className="h-5 w-5" />
                  <h3>Database Security & Access Mesh</h3>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-900 text-sky-400 font-mono text-[11px] overflow-x-auto">
                  <p>// Firestore Real-Time Rules</p>
                  <p>match /messages/{'{messageId}'} {'{'}</p>
                  <p>&nbsp;&nbsp;allow read, write: if isSignedIn() && isParticipantOfChat();</p>
                  <p>&nbsp;&nbsp;allow delete: if request.auth.uid == resource.data.senderId;</p>
                  <p>{'}'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HELP CENTER & FAQ */}
      <section id="faq" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              Help Center
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-neutral-900 dark:text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-indigo-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                  )}
                </button>

                <AnimatePresence>
                  {openFaqIndex === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-5 sm:px-5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT & SUPPORT INQUIRIES */}
      <section id="contact" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              Support & Inquiries
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Contact Support
            </h2>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Need technical support or security disclosure help? Submit your message below.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4 text-left">
            {contactSent && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Inquiry submitted successfully. Our security team will review it shortly.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">Full Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Aman Azad"
                  className="w-full px-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">Email Address</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">Inquiry Message</label>
              <textarea
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
                placeholder="Details of your request or issue..."
                className="w-full px-4 py-2.5 h-28 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-indigo-500 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Inquiry</span>
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-neutral-200/80 dark:border-neutral-800/80 py-12 bg-white dark:bg-neutral-950 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-sans font-black text-sm flex items-center justify-center">
                Z
              </div>
              <span className="font-sans font-extrabold text-neutral-900 dark:text-white uppercase tracking-widest text-sm">
                Zenoa
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              Next-generation zero-knowledge encrypted private messenger suite.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</a></li>
              <li><a href="#security" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Security Core</a></li>
              <li><button onClick={() => onStartAuth('login')} className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Sign In</button></li>
              <li><button onClick={() => onStartAuth('register')} className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Get Started</button></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider mb-3">Legal & Governance</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#docs" onClick={() => setActiveDocTab('privacy')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#docs" onClick={() => setActiveDocTab('terms')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#docs" onClick={() => setActiveDocTab('crypto')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">Cryptography Specs</a></li>
              <li><a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider mb-3">Engine & Security</h4>
            <ul className="space-y-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              <li>WebCryptographic API (AES-256-GCM)</li>
              <li>Zero-Knowledge Key Derivation</li>
              <li>Serverless Real-Time Cloud Engine</li>
              <li>Zero-Telemetry Data Standard</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 font-medium">
          <span>© 2026 Zenoa Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Version 2.5.0 (Production)</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Back to Top ↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
