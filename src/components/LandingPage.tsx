import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LegalModal, LegalDocType } from './LegalModal';
import { 
  ShieldCheck, ArrowRight, Lock, Sun, Moon, ChevronDown, 
  ChevronUp, Send, Check, Terminal, FileText, Key,
  ShieldAlert,
  Video, Globe, Trash2,
  HardDrive, ServerOff, Radio, CheckCircle2
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
  const [activeDocTab, setActiveDocTab] = useState<'crypto' | 'privacy' | 'relay' | 'architecture'>('relay');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalDocType>('privacy');
  
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

  const [demoText, setDemoText] = useState<string>('Confidential financial protocol details and private keys.');
  const [isDemoEncrypted, setIsDemoEncrypted] = useState<boolean>(true);

  // Helper to generate a realistic AES-256 encrypted string
  const getSimulatedCipher = (text: string) => {
    if (!text) return '';
    const charCodesSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockIv = 'f4a2c9' + (charCodesSum % 9999).toString(16).padStart(4, '0') + 'e1b3d7';
    const mockTag = 'c8b7' + (charCodesSum * 3 % 99).toString(16).padStart(2, '0') + 'a1d5';
    const b64 = btoa(text.substring(0, 20) + '...zenoa_vault_ephemeral_payload...');
    const mockCipherText = b64.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    return JSON.stringify({
      ephemeral_relay_id: 'rel_' + Math.random().toString(36).substring(2, 8),
      cloud_storage_bytes: 0,
      destination: 'IndexedDB (Local Vault Only)',
      iv: mockIv,
      ciphertext: mockCipherText,
      tag: mockTag,
      status: 'AUTO_PURGE_ON_RECEIPT'
    }, null, 2);
  };

  const faqs = [
    {
      q: "Does Zenoa store my chat messages or media on cloud servers?",
      a: "No. Cloud servers act purely as an ephemeral pass-through relay. The exact second a message or file reaches the recipient's device, it is permanently purged from the cloud database. Your chat history lives 100% inside your device's local IndexedDB vault."
    },
    {
      q: "How long do my messages remain on my device?",
      a: "Messages, voice notes, photos, documents, and polls stay on your local device forever until YOU choose to delete a message, clear a chat history, or wipe application storage."
    },
    {
      q: "What happens if someone accesses my account on a new device?",
      a: "They will see zero historical messages. Because no message history exists on our servers, logging into a new device starts with a completely blank canvas, protecting your past conversations from credential leaks."
    },
    {
      q: "Are video and audio calls routed through a central recording server?",
      a: "Never. Calls utilize high-performance WebRTC peer-to-peer technology. Media streams travel directly between the two calling devices without touching central media servers."
    },
    {
      q: "Can Zenoa or any third party decrypt my sent payloads?",
      a: "No. All payloads are encrypted locally on your client using browser-native WebCrypto AES-256-GCM keys prior to relay transmission."
    }
  ];

  return (
    <div className={`min-h-screen h-full w-full overflow-y-auto overflow-x-hidden flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300 ${
      themeMode === 'dark' ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      {/* Glow aura accent */}
      <div className="absolute top-0 inset-x-0 h-[700px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent pointer-events-none blur-3xl opacity-70" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-sans font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              Z
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-[0.18em] uppercase text-neutral-900 dark:text-white leading-none">
                  Zenoa
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Vault Architecture
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 mt-1">
                Zero-Cloud Storage Messenger
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <a href="#architecture" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Vault Architecture</a>
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Core Engine</a>
            <a href="#comparison" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Comparison</a>
            <a href="#docs" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Specs</a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">FAQ</a>
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
              className="px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-extrabold shadow-md transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Open Vault</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-6 shadow-xs"
          >
            <ServerOff className="h-4 w-4" />
            <span>Zero Cloud Message Storage • 100% Device-Local Vault</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-neutral-900 dark:text-white tracking-tight max-w-5xl mx-auto leading-[1.08]"
          >
            Messages live on your device. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
              Never on cloud servers.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Zenoa replaces vulnerable cloud databases with an <strong>ephemeral pass-through relay</strong>. When you send text, audio, photos, or documents, the cloud delivers them instantly and purges itself. Your data resides <strong>100% inside your local device vault</strong> forever.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => onStartAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-black text-sm shadow-xl transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onStartAuth('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-800"
            >
              <span>Sign In to Your Vault</span>
            </button>
          </motion.div>

          {/* ARCHITECTURE DIAGRAM / RELAY SIMULATOR */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-14 max-w-4xl mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-left relative"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-neutral-200/60 dark:border-neutral-800 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                  Live Ephemeral Relay Protocol Visualizer
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Cloud Record Count: 0 Bytes
              </span>
            </div>

            {/* Step Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-500">1. Sender Device</span>
                  <HardDrive className="h-4 w-4 text-indigo-500" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Encrypted & Stored Locally</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Message encrypted via AES-256 and saved directly to device IndexedDB.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-500">2. Ephemeral Relay</span>
                  <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Transient Signal Transfer</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Transits cloud network only until delivered. Zero long-term storage.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-500">3. Cloud Purge & Vault</span>
                  <Trash2 className="h-4 w-4 text-emerald-500" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Instant Server Self-Destruct</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Recipient receives payload. Server instantly wipes relay. Data lives on recipient device.
                </p>
              </div>

            </div>

            {/* Cryptographic Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Local Payload Generator
                </label>
                <textarea
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  placeholder="Type confidential payload..."
                  className="w-full h-28 p-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 font-medium text-neutral-800 dark:text-neutral-200 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Ephemeral Network Signal Payload
                  </label>
                  <button
                    onClick={() => setIsDemoEncrypted(!isDemoEncrypted)}
                    className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isDemoEncrypted ? 'View Raw Payload' : 'Encrypt with AES-256'}
                  </button>
                </div>

                <div className="h-28 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-3 font-mono text-[10px] text-emerald-400 overflow-auto shadow-inner leading-normal">
                  {isDemoEncrypted ? (
                    <pre className="whitespace-pre-wrap">{getSimulatedCipher(demoText)}</pre>
                  ) : (
                    <div className="text-neutral-300">
                      <p className="text-neutral-500 font-bold">// Raw Unprotected Content:</p>
                      <p className="mt-1 text-xs text-white">{demoText}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Zero server logging • End-to-end device isolation enforced.</span>
              </span>
              <button
                onClick={() => onStartAuth('register')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Your Personal Vault</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* CORE UNIQUE ARCHITECTURAL FEATURES (NO COMMON SaaS SLOP) */}
      <section id="architecture" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-100/40 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              Engineering Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-4">
              4 Technical Features That Define Zenoa
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We eliminated cloud dependencies to build a messenger where privacy isn't a setting—it's the underlying hardware structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Unique Feature 1 */}
            <div className="p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <HardDrive className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                1. Local IndexedDB Device Vault
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Your chats, audio notes, media, and attachments live strictly within high-capacity local IndexedDB browser storage. No server databases host your conversation history.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-indigo-500">
                <Check className="h-3.5 w-3.5" /> Data remains until you clear it
              </div>
            </div>

            {/* Unique Feature 2 */}
            <div className="p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                2. Instant Cloud Relay Purging
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                The cloud is strictly a signaling relay. Once recipient devices ingest incoming messages, intermediate relay documents are instantly and atomically deleted from server memory.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-500">
                <Check className="h-3.5 w-3.5" /> 0 Bytes left on cloud servers
              </div>
            </div>

            {/* Unique Feature 3 */}
            <div className="p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                3. Single-Device Data Isolation
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                If your credentials are ever compromised on an unauthorized device, the intruder gains access to <strong>zero past messages</strong>. Historical conversations do not exist on the server to sync.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-rose-500">
                <Check className="h-3.5 w-3.5" /> Past history can never be leaked via cloud
              </div>
            </div>

            {/* Unique Feature 4 */}
            <div className="p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                4. Pure Peer-to-Peer WebRTC Calls
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                High-Definition audio and video calls connect directly between devices via peer STUN/TURN channels. Audio/video streams never pass through central recording servers.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-bold text-amber-500">
                <Check className="h-3.5 w-3.5" /> Ultra-low latency P2P clarity
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* PRIVACY COMPARISON TABLE */}
      <section id="comparison" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              Architecture Matrix
            </span>
            <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Traditional Chat Apps vs. Zenoa Vault
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-lg bg-neutral-50/50 dark:bg-neutral-900/40">
            <div className="grid grid-cols-12 bg-neutral-100 dark:bg-neutral-900 p-4 border-b border-neutral-200 dark:border-neutral-800 text-xs font-black uppercase tracking-wider">
              <div className="col-span-5 text-neutral-500">Feature Vector</div>
              <div className="col-span-3 text-rose-500 text-center">Standard Messengers</div>
              <div className="col-span-4 text-emerald-500 text-center">Zenoa Vault Architecture</div>
            </div>

            <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-xs font-medium">
              
              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 text-neutral-900 dark:text-white font-bold">Cloud Server Message Storage</div>
                <div className="col-span-3 text-rose-500 text-center flex justify-center"><ShieldAlert className="h-4 w-4" /></div>
                <div className="col-span-4 text-emerald-500 text-center font-bold flex justify-center items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> 0 Bytes (Instant Purge)</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 text-neutral-900 dark:text-white font-bold">Local Device Storage Location</div>
                <div className="col-span-3 text-neutral-500 text-center">Temporary Cache</div>
                <div className="col-span-4 text-emerald-500 text-center font-bold flex justify-center items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Permanent IndexedDB Vault</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 text-neutral-900 dark:text-white font-bold">New Device Login Exposure</div>
                <div className="col-span-3 text-rose-500 text-center">Downloads All Past History</div>
                <div className="col-span-4 text-emerald-500 text-center font-bold flex justify-center items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> 0 Past History Shared</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 text-neutral-900 dark:text-white font-bold">Voice & Video Call Stream Routing</div>
                <div className="col-span-3 text-neutral-500 text-center">Central Media Servers</div>
                <div className="col-span-4 text-emerald-500 text-center font-bold flex justify-center items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Direct P2P WebRTC Stream</div>
              </div>

              <div className="grid grid-cols-12 p-4 items-center">
                <div className="col-span-5 text-neutral-900 dark:text-white font-bold">Payload Encryption Engine</div>
                <div className="col-span-3 text-neutral-500 text-center">Server-Key Encryption</div>
                <div className="col-span-4 text-emerald-500 text-center font-bold flex justify-center items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Client-Side AES-256-GCM</div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* TECHNICAL SPECIFICATIONS & FAQ */}
      <section id="docs" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              Help Center & Specifications
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

      {/* CONTACT SUPPORT */}
      <section id="contact" className="py-20 border-t border-neutral-200/50 dark:border-neutral-800/60 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-2">
              Direct Assistance
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Contact Security Support
            </h2>
          </div>

          <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4 text-left">
            {contactSent && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Inquiry submitted successfully. Our team will review your message shortly.</span>
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
                placeholder="Details of your request..."
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
              Sovereign local-vault messenger with zero cloud message persistence.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#architecture" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Vault Engine</a></li>
              <li><a href="#comparison" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Matrix</a></li>
              <li><button onClick={() => onStartAuth('login')} className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Sign In</button></li>
              <li><button onClick={() => onStartAuth('register')} className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Get Started</button></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider mb-3">Legal & Governance</h4>
            <ul className="space-y-2 text-[11px]">
              <li><button type="button" onClick={() => { setLegalModalTab('privacy'); setShowLegalModal(true); }} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              <li><button type="button" onClick={() => { setLegalModalTab('terms'); setShowLegalModal(true); }} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left">Terms & Conditions</button></li>
              <li><button type="button" onClick={() => { setLegalModalTab('disclaimer'); setShowLegalModal(true); }} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left">Risk & Legal Disclaimer</button></li>
              <li><a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider mb-3">Engine Standards</h4>
            <ul className="space-y-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              <li>IndexedDB Device Vault</li>
              <li>Ephemeral Firestore Relay</li>
              <li>Direct P2P WebRTC Calls</li>
              <li>AES-256-GCM WebCrypto</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 font-medium">
          <span>© 2026 Zenoa Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Version 3.0.0 (Local Vault Edition)</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">Back to Top ↑</button>
          </div>
        </div>
      </footer>

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
        themeMode={themeMode}
      />
    </div>
  );
};
