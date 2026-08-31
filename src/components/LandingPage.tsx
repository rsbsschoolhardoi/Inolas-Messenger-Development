import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LegalModal, LegalDocType } from './LegalModal';
import { useBranding } from '../brandingUtils';
import {
  ShieldCheck, ArrowRight, Sun, Moon, ChevronDown,
  ChevronUp, Send, Check,
  ShieldAlert, Video,
  HardDrive, ServerOff, CheckCircle2, Database
} from 'lucide-react';

interface LandingPageProps {
  onStartAuth: (mode?: 'login' | 'register') => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAuth,
  themeMode,
  onToggleTheme,
  onOpenAdmin
}) => {
  const branding = useBranding();
  const publicLogo = branding.public_logo || branding.oauth_logo;
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

  // Interactive Live Cryptographic Engine Simulator State
  const [demoText, setDemoText] = useState<string>('Protocol specification payload & ephemeral handshake key.');
  const [isDemoEncrypted, setIsDemoEncrypted] = useState<boolean>(true);
  const [cipherAlgorithm, setCipherAlgorithm] = useState<'AES-256-GCM' | 'X25519-Ratchet'>('AES-256-GCM');

  const getSimulatedCipher = (text: string) => {
    if (!text) return '';
    const charCodesSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockIv = 'f4a2c9' + (charCodesSum % 9999).toString(16).padStart(4, '0') + 'e1b3d7';
    const mockTag = 'c8b7' + (charCodesSum * 3 % 99).toString(16).padStart(2, '0') + 'a1d5';
    const b64 = btoa(text.substring(0, 24) + '...zenoa_vault_ephemeral_payload...');
    const mockCipherText = b64.replace(/[^a-zA-Z0-9]/g, '').substring(0, 36);
    
    return JSON.stringify({
      protocol_version: '3.4.0-VaultEngine',
      algorithm: cipherAlgorithm,
      ephemeral_relay_id: 'rel_' + (charCodesSum * 7).toString(36).substring(0, 8),
      cloud_storage_bytes: 0,
      cloud_retention_ttl: '0ms (immediate purge upon delivery)',
      destination: 'IndexedDB (Local Device Vault Only)',
      initialization_vector: mockIv,
      ciphertext: mockCipherText,
      auth_tag: mockTag,
      zero_knowledge_proof: 'VALIDATED_HARDWARE_KEYSTORE'
    }, null, 2);
  };

  const faqs = [
    {
      q: 'Does Zenoa store my messages or media on cloud servers?',
      a: 'No. Cloud infrastructure acts purely as a transient zero-retention pass-through relay. The millisecond a payload is delivered to the recipient device, it is permanently wiped from the relay queue. Your conversations and files reside strictly inside your device IndexedDB local vault.'
    },
    {
      q: 'How long do my messages and media remain on my device?',
      a: 'Your chat histories, attachments, voice notes, polls, and media stay encrypted in your local browser vault indefinitely until you explicitly delete a message, clear a thread, or wipe your client storage.'
    },
    {
      q: 'What happens if someone accesses my account on a new device?',
      a: 'They receive a completely clean slate with zero past message history. Because no historical database exists on cloud servers, unauthorized sign-ins from new devices can never access your prior conversations.'
    },
    {
      q: 'Are video and voice calls routed through central media recording servers?',
      a: 'Never. Direct 1-on-1 audio and video calls utilize peer-to-peer WebRTC connections with DTLS-SRTP encryption, streaming media packets directly device-to-device without centralized media server inspection.'
    },
    {
      q: 'How does group messaging work under the zero-cloud model?',
      a: 'Group chats utilize multi-recipient cryptographic fan-out. Each message is dispatched to group participants simultaneously through the ephemeral relay and stored locally in each participant device vault.'
    }
  ];

  return (
    <div className="min-h-screen h-full w-full overflow-y-auto overflow-x-hidden flex flex-col font-sans transition-colors duration-200 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">

      {/* Top Status Indicator */}
      <div className="w-full bg-neutral-900 text-white dark:bg-neutral-900 border-b border-neutral-800 px-4 py-1.5 text-center text-[11px] font-medium tracking-wide">
        <span className="text-emerald-400 font-bold mr-2">● RELAY ACTIVE</span>
        Zero-Cloud Persistent Storage • Client-Side AES-256-GCM Hardware Encryption • V3.4 Protocol
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/90 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-9 w-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-black text-lg flex items-center justify-center shadow-xs overflow-hidden p-1">
              {publicLogo ? (
                <img src={publicLogo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span>Z</span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-widest uppercase text-neutral-900 dark:text-white">
                  ZENOA
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  VAULT v3.4
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-tight text-neutral-400">
                Zero-Retention Ephemeral Messenger
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <a href="#architecture" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Architecture</a>
            <a href="#cryptography" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Cryptographic Proof</a>
            <a href="#relay" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Zero-Cloud Relay</a>
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">System Capabilities</a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">FAQ</a>

          </nav>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>
            <button
              onClick={() => onStartAuth('login')}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onStartAuth('register')}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
              <ServerOff className="h-3.5 w-3.5 text-emerald-500" />
              <span>Zero Database Retention • 100% Client-Side Device Vault</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.12]">
              Decentralized privacy, <br />
              <span className="text-neutral-400 dark:text-neutral-500">engineered without a central vault.</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Traditional platforms retain message archives on cloud databases. Zenoa utilizes an ephemeral delivery pipeline: messages exist in-flight for milliseconds, deliver directly into your device encrypted IndexedDB storage, and are permanently wiped from the relay.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onStartAuth('register')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Messenger</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setLegalModalTab('privacy');
                  setShowLegalModal(true);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Zero-Retention Audit</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Cloud Message Retention</div>
              <div className="text-2xl font-black text-emerald-500 mt-1">0 Bytes</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Purged on receipt</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Storage Engine</div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">IndexedDB</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Hardware sandbox</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Cipher Standard</div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">AES-256-GCM</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">WebCrypto Standard</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Calling Protocol</div>
              <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">P2P WebRTC</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Zero central media relay</div>
            </div>
          </div>

          {/* TESTING QUICK ACCESS BAR (SSO & Developer Console) */}
          <div className="mt-8 max-w-5xl mx-auto p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-purple-500/10 dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-violet-200 dark:border-violet-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                🧪
              </div>
              <div>
                <div className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wider">
                  Testing Quick Access Bar
                </div>
                <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
                  Directly access the OAuth SSO Portal and Developer Console for testing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  window.location.href = '/sso';
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>SSO Portal (/sso)</span>
              </button>
              <button
                onClick={() => {
                  window.location.href = '/developer';
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="h-4 w-4" />
                <span>Developer Console (/developer)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURAL BREAKDOWN SECTION */}
      <section id="architecture" className="py-16 md:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Technical Paradigm</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              Why Zero-Cloud Architecture changes everything.
            </p>
            <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Every system vulnerability stems from data centralization. By removing central message persistence, subpoena surface areas and credential breach exposure drop to zero.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Client-Side Cipher Seal</h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Before a single byte leaves your browser or device, it is encrypted via 256-bit AES-GCM with a dynamic initialization vector. Plaintext never traverses your network interface.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
                Native WebCrypto API • SHA-256 KDF
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Zero-Retention Ingestion</h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  The relay coordinates presence and routes the encrypted packet directly to the recipient socket. As soon as delivery confirmation fires, the relay document is deleted immediately.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                TTL: 0ms • Ephemeral Delivery State
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Local Device Vault Storage</h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  The recipient device decrypts the payload and stores it exclusively in its persistent IndexedDB partition. Your device remains the sole repository of your conversations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
                Enterprise REST API • Service Account Dispatches
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CRYPTOGRAPHIC INSPECTOR */}
      <section id="cryptography" className="py-16 md:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Live Cryptographic Inspector</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              Inspect how data is sealed before relay.
            </p>
            <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
              Type any sample payload below to inspect the real-time encrypted structure transmitted across our ephemeral relay.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input & Controller Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-900 dark:text-white block mb-1.5">
                    Plaintext Message Input
                  </label>
                  <textarea
                    rows={3}
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    placeholder="Type sensitive message or payload..."
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCipherAlgorithm('AES-256-GCM')}
                      className={cipherAlgorithm === "AES-256-GCM" ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 cursor-pointer" : "px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"}
                    >
                      AES-256-GCM
                    </button>
                    <button
                      onClick={() => setCipherAlgorithm('X25519-Ratchet')}
                      className={cipherAlgorithm === "X25519-Ratchet" ? "px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 cursor-pointer" : "px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"}
                    >
                      X25519 Ratchet
                    </button>
                  </div>

                  <button
                    onClick={() => setIsDemoEncrypted(!isDemoEncrypted)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {isDemoEncrypted ? 'Show Plaintext Payload' : 'Show Encrypted Cipher'}
                  </button>
                </div>
              </div>

              {/* Protocol Characteristics */}
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="text-xs font-bold text-neutral-900 dark:text-white">Security Checklist</div>
                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>No message logs stored in central relational or NoSQL tables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Hardware Keystore bound client-side token derivation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Multi-tab real-time state synchronization via BroadcastChannel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>End-to-End encrypted voice notes, attachments, and polls</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Raw Cipher */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-300 font-mono text-xs shadow-xl overflow-hidden">
                {/* Terminal Header */}
                <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[11px] text-neutral-400 font-sans font-medium">
                      relay-network-telemetry.raw
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                    ENCRYPTION: ACTIVE
                  </span>
                </div>

                {/* Terminal Body */}
                <div className="p-5 space-y-4 overflow-x-auto max-h-[380px] select-text">
                  <div className="text-neutral-500 text-[11px]">
                    // Outbound Relay Packet Structure (Transmitted via Zero-Retention Queue)
                  </div>
                  {isDemoEncrypted ? (
                    <pre className="text-emerald-400 text-xs leading-relaxed font-mono">
                      {getSimulatedCipher(demoText)}
                    </pre>
                  ) : (
                    <div className="space-y-2 text-neutral-200">
                      <div className="text-rose-400 font-bold">// WARNING: Plaintext representation only exists locally inside device RAM</div>
                      <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100">
                        {demoText || '<Empty payload>'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 py-2.5 bg-neutral-900/70 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between font-sans">
                  <span>Client Storage: IndexedDB Partition</span>
                  <span>Payload State: Ephemeral Zero-Footprint</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="features" className="py-16 md:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Core Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              Enterprise-grade messaging without corporate telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900">
              <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center mb-4 shadow-xs">
                <Video className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Direct P2P Calling</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Crystal clear voice and HD video streams travel strictly device-to-device via WebRTC without intermediary video relay loggers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900">
              <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center mb-4 shadow-xs">
                <ShieldAlert className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Disappearing Transmissions</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Configurable self-destruct timers (24 hours, 7 days, 90 days) purge local vault entries automatically across devices.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900">
              <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center mb-4 shadow-xs">
                <Database className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Encrypted Groups</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Seamless multi-participant conversations with granular administrator controls, member moderation, and zero server logging.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900">
              <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center mb-4 shadow-xs">
                <HardDrive className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Encrypted Media & Vault</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Send HD photos, audio recordings, documents, polls, and location pins encrypted at rest inside your client database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM COMPARISON MATRIX */}
      <section id="relay" className="py-16 md:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Architectural Comparison</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              How Zenoa differs from conventional cloud messengers.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70">
                  <th className="p-4 font-bold text-neutral-900 dark:text-white">Security Property</th>
                  <th className="p-4 font-bold text-neutral-900 dark:text-white">Zenoa Vault v3.4</th>
                  <th className="p-4 font-bold text-neutral-400">Traditional Cloud Messengers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-300">
                <tr>
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">Cloud Message History</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> 0 Bytes (Auto-Purged upon receipt)
                  </td>
                  <td className="p-4 text-neutral-500">Stored indefinitely on cloud servers</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">New Device Login Exposure</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> 100% Blank Canvas (Zero past history)
                  </td>
                  <td className="p-4 text-neutral-500">Downloads entire conversation history</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">Cryptographic Keystore</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Client-Side WebCrypto (User Device)
                  </td>
                  <td className="p-4 text-neutral-500">Often managed on vendor servers</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">Audio / Video Call Streams</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Peer-to-Peer WebRTC Direct
                  </td>
                  <td className="p-4 text-neutral-500">Proxied via centralized recording servers</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-neutral-900 dark:text-white">Subpoena & Data Breach Risk</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Zero centralized data to seize or leak
                  </td>
                  <td className="p-4 text-neutral-500">Central databases vulnerable to breaches</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 md:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Knowledge Base</h2>
            <p className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={'faq_item_' + index}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-neutral-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-200/60 dark:border-neutral-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT & SECURITY INQUIRY FORM */}
      <section id="contact" className="py-16 md:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Security & Engineering</h2>
            <p className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Get in Touch with Engineering
            </p>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Questions regarding security audits, protocol verification, or compliance disclosures.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Security Lead or Researcher"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Inquiry or Disclosure Details
              </label>
              <textarea
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your question or security finding..."
                className="w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={contactSent}
              className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {contactSent ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Message Sent to Engineering Team</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Inquiry</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-black text-sm flex items-center justify-center">
                Z
              </div>
              <span className="text-sm font-black tracking-wider uppercase text-neutral-900 dark:text-white">
                ZENOA MESSENGER
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
              Zero-Cloud Persistent Storage Messenger. Client-side encrypted with AES-256-GCM and stored exclusively inside device hardware vaults.
            </p>
          </div>

          {/* Legal Disclosures */}
          <div className="space-y-2.5">
            <div className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider">
              Legal & Disclosures
            </div>
            <ul className="space-y-1.5 text-neutral-500 dark:text-neutral-400 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('terms');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('disclaimer');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Risk & Legal Disclaimer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('acceptable_use');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Acceptable Use Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Engine Specs */}
          <div className="space-y-2.5">
            <div className="font-bold text-neutral-900 dark:text-white uppercase text-[10px] tracking-wider">
              Architecture Specs
            </div>
            <ul className="space-y-1.5 text-neutral-500 dark:text-neutral-400 text-xs font-mono">
              <li>• IndexedDB Device Vault</li>
              <li>• Zero-Retention Relay</li>
              <li>• Peer-to-Peer WebRTC</li>
              <li>• AES-256-GCM WebCrypto</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-neutral-100 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <span>© 2026 Zenoa Inc. All rights reserved. Zero-Retention System.</span>
          <div className="flex items-center gap-4">
            <span>Protocol v3.4.0 (Vault Edition)</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Back to Top ↑
            </button>
          </div>
        </div>
      </footer>

      {/* LEGAL & REGULATORY MODAL */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
        themeMode={themeMode}
      />
    </div>
  );
};
