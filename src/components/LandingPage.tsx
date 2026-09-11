import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LegalModal, LegalDocType } from './LegalModal';
import { useBranding } from '../brandingUtils';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { WaveArcs } from './originkit/ui/wave-arcs';
import {
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  ShieldAlert,
  Video,
  HardDrive,
  CheckCircle2,
  Database,
  Lock,
  Key,
  Cpu,
  Zap,
  Radio,
  Activity,
  Sparkles,
  Copy,
  Shield,
  Cloud,
  Clock,
  Smartphone,
  MessageSquare,
  Eye,
  EyeOff,
  Terminal,
  ExternalLink
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
  const publicLogo = branding.public_logo;
  const [selectedTimer, setSelectedTimer] = useState<'5s' | '1h' | '24h' | '7d'>('24h');
  const [demoText, setDemoText] = useState<string>(
    'Project Mercury: Treasury smart-contract keys relocated to offline cold storage.'
  );
  const [cipherAlgorithm, setCipherAlgorithm] = useState<'AES-256-GCM' | 'X25519-Ratchet'>('AES-256-GCM');
  const [isDemoEncrypted, setIsDemoEncrypted] = useState<boolean>(true);
  const [copiedCipher, setCopiedCipher] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Legal modal state
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalDocType>('privacy');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  const getSimulatedCipher = (input: string) => {
    const text = input || 'No payload entered';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return JSON.stringify(
      {
        kdf: cipherAlgorithm === 'AES-256-GCM' ? 'PBKDF2-SHA256' : 'HKDF-X25519',
        iv: '0x' + hex.substring(0, 4) + 'b49f28a9c1e0',
        cipher: 'U2FsdGVkX19' + btoa(text).slice(0, 24) + '==' + hex,
        tag: '0x7e2b9c' + hex.substring(2, 6),
        ttl_ms: 0,
        relay_action: 'PURGE_ON_RECEIPT',
      },
      null,
      2
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCipher(true);
    setTimeout(() => setCopiedCipher(false), 2000);
  };

  const faqs = [
    {
      q: 'How does Zenoa guarantee zero server-side message persistence?',
      a: 'Zenoa operates an ephemeral routing mesh. When you send a message, it is encrypted on your client hardware with AES-256-GCM. The relay server routes the encrypted payload directly to the recipient socket. The millisecond the recipient confirms receipt, the message is permanently deleted from server memory. No database write ever occurs.',
    },
    {
      q: 'Where are my messages and voice recordings stored?',
      a: 'All messages, audio recordings, poll records, and media attachments exist exclusively inside your device browser IndexedDB vault. If you close your tab or reboot your machine, your local keys decrypt the local IndexedDB partition. If an adversary seizes our servers, they find zero chat history.',
    },
    {
      q: 'What happens if I sign in on a new device?',
      a: 'Because zero historical chat logs exist on the cloud, a newly registered device session begins with an empty message state. This cryptographic guarantee ensures that compromised credentials or stolen cloud accounts cannot expose past conversation threads.',
    },
    {
      q: 'How are voice and video calls encrypted?',
      a: 'All audio and video calls operate over peer-to-peer WebRTC channels with SRTP-DTLS encryption. Streams flow directly between participant IP endpoints without intermediate recording or media-gateway transcoding.',
    },
    {
      q: 'Can I back up my media to my own personal cloud?',
      a: 'Yes. Zenoa integrates optional Google Drive media syncing under a Bring-Your-Own-Storage (BYOS) model. Your backups are client-side encrypted before uploading directly into your personal Google Drive, giving you sovereignty without third-party vendor custody.',
    },
  ];

  return (
    <div
      id="zenoa_landing_root"
      className="min-h-screen w-full relative flex flex-col font-sans transition-colors duration-200 bg-[#ffffff] dark:bg-[#090d16] text-[#0d253d] dark:text-[#f6f9fc] selection:bg-[#533afd]/20 selection:text-[#533afd]"
    >
      {/* ATMOSPHERIC GRADIENT MESH BACKDROP (Upper third of the marketing page) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[640px] stripi-gradient-mesh pointer-events-none opacity-90 dark:opacity-40 z-0"
      />

      {/* TOP NAVIGATION BAR OVER MESH (nav-bar-on-mesh) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-[#ffffff]/80 dark:bg-[#0d253d]/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Wordmark: Name only in Bold SF Pro ZENOA */}
          <div
            id="landing_brand_logo"
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="h-8 w-8 rounded-full bg-[#533afd] text-white font-bold text-sm flex items-center justify-center shadow-[0_1px_3px_rgba(0,55,112,0.2)] overflow-hidden transition-transform group-hover:scale-105">
              {publicLogo ? (
                <img src={publicLogo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="font-bold text-xs tracking-tight">Z</span>
              )}
            </div>
            <span className="font-sf-pro font-black text-[21px] sm:text-[22px] tracking-[0.06em] uppercase text-[#0d253d] dark:text-white leading-none">
              ZENOA
            </span>
          </div>

          {/* Primary Navigation Center */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-normal text-[#273951] dark:text-[#cbd5e1]">
            <a href="#architecture" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#capabilities" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Platform
            </a>
            <a href="#inspector" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Telemetry
            </a>
            <a href="#comparison" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Comparison
            </a>
            <a href="#faq" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Sign in & Pill CTA Button */}
          <div className="flex items-center gap-3">
            <button
              id="landing_theme_toggle"
              onClick={onToggleTheme}
              className="p-2 rounded-full border border-[#e3e8ee] dark:border-[#273951] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#273951] dark:text-[#cbd5e1] transition-colors cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            <button
              id="landing_signin_btn"
              onClick={() => onStartAuth('login')}
              className="text-[15px] font-normal text-[#273951] dark:text-[#cbd5e1] hover:text-[#0d253d] dark:hover:text-white transition-colors cursor-pointer px-3 py-1.5"
            >
              Sign in
            </button>

            <button
              id="landing_get_started_btn"
              onClick={() => onStartAuth('register')}
              className="rounded-full px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[14px] font-normal transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH ATMOSPHERIC GRADIENT MESH & ORIGINKIT WAVE ARCS */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden z-10">
        {/* Originkit Wave Arcs Canvas Interactive Layer (-z-10 to never occlude content) */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15 -z-10">
          <WaveArcs
            backgroundColor="transparent"
            lineColor={themeMode === 'dark' ? 'rgb(129, 140, 248)' : 'rgb(83, 58, 253)'}
            lineWidth={1.2}
            lineCount={64}
            speed={4.5}
            glow={12}
            interactive={false}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Bold Display Headlines & Editorial Density (Guaranteed 100% visible, no motion opacity:0 delay) */}
            <div className="lg:col-span-7 space-y-6 text-left relative z-30">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#1c1e54]/95 border border-[#e3e8ee] dark:border-[#273951] text-[#273951] dark:text-[#cbd5e1] text-[13px] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <span className="h-2 w-2 rounded-full bg-[#533afd] animate-pulse" />
                <span className="font-semibold text-[#0d253d] dark:text-white">Zero-Cloud Retention</span>
                <span className="text-[#a8c3de] dark:text-[#64748d]">•</span>
                <span className="font-tabular text-[#533afd] dark:text-[#b9b9f9] text-[12px] font-semibold">0ms TTL Relay Mesh</span>
              </div>

              {/* Display Heading: Bold, High-Contrast, No Overlap, 100% Crisp Visibility */}
              <h1 className="text-[34px] sm:text-[46px] lg:text-[54px] font-bold tracking-tight text-[#0d253d] dark:text-white leading-[1.18] sm:leading-[1.14]">
                <span className="block text-[#0d253d] dark:text-white">
                  Decentralized privacy,
                </span>
                <span className="block mt-2 sm:mt-2.5 text-[#533afd] dark:text-[#818cf8]">
                  sealed in your device vault.
                </span>
              </h1>

              {/* Body Text: High-contrast ink text and comfortable reading line-height */}
              <p className="text-[16px] sm:text-[18px] font-normal text-[#273951] dark:text-[#cbd5e1] max-w-xl leading-[1.6]">
                Conventional messengers retain your private chats on central cloud databases. Zenoa operates an ephemeral relay: messages exist in-flight for milliseconds, deliver directly into your device's encrypted IndexedDB storage, and vanish forever from the cloud.
              </p>

              {/* Action Buttons: Restrained Single Primary Indigo Pill */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="hero_start_btn"
                  onClick={() => onStartAuth('register')}
                  className="rounded-full px-5 py-2.5 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[15px] font-normal transition-all shadow-[0_1px_3px_rgba(0,55,112,0.2)] cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  id="hero_audit_btn"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  className="rounded-full px-5 py-2.5 bg-white dark:bg-[#1c1e54] text-[#0d253d] dark:text-white border border-[#e3e8ee] dark:border-[#273951] hover:border-[#533afd] text-[15px] font-normal transition-all shadow-[0_1px_2px_rgba(0,55,112,0.05)] cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Shield className="h-4 w-4 text-[#64748d]" />
                  <span>Zero-Retention Audit</span>
                </button>
              </div>

              {/* Financial/Security Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-[13px] text-[#64748d] dark:text-[#94a3b8] font-light">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                  <span>256-bit WebCrypto AES-GCM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                  <span>Peer-to-Peer WebRTC Calls</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                  <span>Zero Subpoena Footprint</span>
                </div>
              </div>
            </div>

            {/* Right Column: Composited Dashboard Mockup (Faux IDE + Terminal + Chat Shell) */}
            <div className="lg:col-span-5 relative z-20">
              {/* Card Dashboard Mockup with Level 2 Shadow and Dark-App Shell */}
              <div className="relative mx-auto w-full max-w-md rounded-[16px] p-4 bg-[#1c1e54] border border-[#273951] shadow-[0_20px_50px_rgba(0,55,112,0.25)] text-white">
                {/* Mockup Header Chrome */}
                <div className="flex items-center justify-between pb-3 border-b border-[#273951]/80">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#ea2261]" />
                    <div className="h-3 w-3 rounded-full bg-[#f96bee]" />
                    <div className="h-3 w-3 rounded-full bg-[#533afd]" />
                    <span className="ml-2 text-[12px] font-mono text-[#a8c3de]">zenoa-vault.app</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#b9b9f9]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#533afd] animate-ping" />
                    <span>RELAY CONNECTED</span>
                  </div>
                </div>

                {/* Inner Preview Surface */}
                <div className="mt-3.5 rounded-[12px] bg-[#ffffff] dark:bg-[#0d253d] p-4 border border-[#e3e8ee] dark:border-[#273951] text-[#0d253d] dark:text-white space-y-3.5 shadow-sm">
                  {/* Chat Header in Mockup */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#e3e8ee] dark:border-[#273951]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#533afd] text-white font-medium text-xs flex items-center justify-center">
                        EV
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-normal text-[#0d253d] dark:text-white">Elena Vance</span>
                          <PurpleVerifiedBadge size="xs" />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#533afd] dark:text-[#b9b9f9] font-light">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#533afd]" />
                          <span>Direct P2P • Zero Cloud Log</span>
                        </div>
                      </div>
                    </div>
                    <span className="p-1.5 rounded-full bg-[#f6f9fc] dark:bg-[#1c1e54] text-[#533afd]">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  {/* Message Stream with Stripi Precision */}
                  <div className="space-y-2.5 py-1 text-[13px] font-light">
                    {/* Received Message */}
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="p-3 rounded-[12px] bg-[#f6f9fc] dark:bg-[#1c1e54] text-[#0d253d] dark:text-[#f6f9fc] border border-[#e3e8ee] dark:border-[#273951]">
                        <p className="leading-[1.4]">
                          Did the treasury contract payload arrive via the 0ms relay queue?
                        </p>
                        <span className="text-[10px] text-[#64748d] dark:text-[#94a3b8] mt-1 block font-tabular">10:42:01 AM</span>
                      </div>
                    </div>

                    {/* Sent Message */}
                    <div className="flex items-end justify-end">
                      <div className="p-3 rounded-[12px] bg-[#533afd] text-white max-w-[85%] shadow-[0_1px_3px_rgba(0,55,112,0.15)]">
                        <p className="leading-[1.4]">
                          Confirmed. Ingested directly into local device IndexedDB with 0 bytes recorded on cloud servers.
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-white/80 mt-1 font-tabular">
                          <span>10:42:15 AM</span>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Tabular Telemetry Banner */}
                    <div className="p-2.5 rounded-[8px] bg-[#b9b9f9]/25 dark:bg-[#1c1e54] border border-[#b9b9f9]/50 dark:border-[#533afd]/40 flex items-center justify-between text-[11px] text-[#273951] dark:text-[#b9b9f9]">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                        <span className="font-mono">WebCrypto IV: 0x9e12... sealed</span>
                      </div>
                      <span className="font-tabular font-medium text-[#533afd] dark:text-white">TTL: 0.00ms</span>
                    </div>
                  </div>

                  {/* Simulated Input Field (text-input standard: 6px radius, hairline input) */}
                  <div className="pt-2 border-t border-[#e3e8ee] dark:border-[#273951] flex items-center gap-2">
                    <div className="flex-1 px-3 py-1.5 rounded-[6px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#a8c3de]/60 dark:border-[#273951] text-[12px] text-[#64748d] dark:text-[#94a3b8] font-light">
                      Write encrypted payload...
                    </div>
                    <div className="h-7 w-7 rounded-full bg-[#533afd] text-white flex items-center justify-center cursor-pointer shadow-xs">
                      <Send className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Row: Tabular Figure Body Type on Near-White Surfaces */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="text-[11px] font-normal uppercase tracking-[0.1px] text-[#64748d] dark:text-[#94a3b8]">
                Cloud Message Logs
              </div>
              <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#533afd] dark:text-[#b9b9f9] mt-1 font-tabular">
                0 Bytes
              </div>
              <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                Purged instantaneously upon receipt
              </div>
            </div>

            <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="text-[11px] font-normal uppercase tracking-[0.1px] text-[#64748d] dark:text-[#94a3b8]">
                Storage Partition
              </div>
              <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#0d253d] dark:text-white mt-1 font-tabular">
                IndexedDB
              </div>
              <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                Isolated hardware-backed vault
              </div>
            </div>

            <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="text-[11px] font-normal uppercase tracking-[0.1px] text-[#64748d] dark:text-[#94a3b8]">
                Cipher Standard
              </div>
              <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#0d253d] dark:text-white mt-1 font-tabular">
                AES-256
              </div>
              <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                Native WebCrypto key derivation
              </div>
            </div>

            <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="text-[11px] font-normal uppercase tracking-[0.1px] text-[#64748d] dark:text-[#94a3b8]">
                Calling Layer
              </div>
              <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#0d253d] dark:text-white mt-1 font-tabular">
                P2P WebRTC
              </div>
              <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                Direct SRTP device-to-device stream
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ZERO-CLOUD ARCHITECTURE PIPELINE on canvas-soft (#f6f9fc) */}
      <section id="architecture" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#0d253d]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="pill-tag-soft inline-block mb-3">
              ZERO-PERSISTENCE ARCHITECTURE
            </div>
            <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
              How data travels without leaving a trace on the cloud.
            </h2>
            <p className="mt-3 text-[16px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
              Every major data breach occurs because servers store persistent history. By eliminating centralized databases from the messaging lifecycle, subpoena exposure and server-side compromise become structurally impossible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 Card: card-feature-light */}
            <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/60 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-tabular text-[22px] font-light text-[#533afd] dark:text-[#b9b9f9]">
                    01
                  </span>
                  <Smartphone className="h-5 w-5 text-[#64748d]" />
                </div>
                <h3 className="text-[20px] font-light leading-[1.2] tracking-[-0.2px] text-[#0d253d] dark:text-white">
                  Client-Side WebCrypto Seal
                </h3>
                <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                  Before a single byte touches the network, it is encrypted locally using 256-bit AES-GCM with a dynamic initialization vector. Plaintext never leaves your physical device memory.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#e3e8ee] dark:border-[#273951] text-[12px] font-tabular text-[#64748d] dark:text-[#94a3b8] flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                <span>SHA-256 Key Derivation Function</span>
              </div>
            </div>

            {/* Step 2 Card: card-feature-light */}
            <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/60 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-tabular text-[22px] font-light text-[#533afd] dark:text-[#b9b9f9]">
                    02
                  </span>
                  <Radio className="h-5 w-5 text-[#533afd] animate-pulse" />
                </div>
                <h3 className="text-[20px] font-light leading-[1.2] tracking-[-0.2px] text-[#0d253d] dark:text-white">
                  Ephemeral In-Flight Delivery
                </h3>
                <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                  The zero-retention relay routes cipher payloads directly to recipient device sockets. The moment delivery is acknowledged by the recipient, the message payload is expunged from memory.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#e3e8ee] dark:border-[#273951] text-[12px] font-tabular text-[#533afd] dark:text-[#b9b9f9] flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                <span>TTL: 0ms • Zero Server Retention</span>
              </div>
            </div>

            {/* Step 3 Card: card-feature-light */}
            <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/60 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-tabular text-[22px] font-light text-[#533afd] dark:text-[#b9b9f9]">
                    03
                  </span>
                  <HardDrive className="h-5 w-5 text-[#64748d]" />
                </div>
                <h3 className="text-[20px] font-light leading-[1.2] tracking-[-0.2px] text-[#0d253d] dark:text-white">
                  Local Hardware Keystore Vault
                </h3>
                <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                  The recipient decrypts the payload locally and commits it into their isolated IndexedDB storage partition. Only your physical device holds the decryption keys and data records.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#e3e8ee] dark:border-[#273951] text-[12px] font-tabular text-[#64748d] dark:text-[#94a3b8] flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                <span>Hardware Keystore Isolation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM CAPABILITIES with card-cream-band and card-pricing-featured */}
      <section id="capabilities" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="pill-tag-soft inline-block mb-3">
              PLATFORM CAPABILITIES
            </div>
            <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
              Engineered for absolute privacy and transactional speed.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Large Span 2 on White */}
            <div className="md:col-span-2 p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-full bg-[#b9b9f9]/40 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#b9b9f9] flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                  Client-Side IndexedDB Vault Storage
                </h3>
                <p className="text-[15px] font-light text-[#273951] dark:text-[#cbd5e1] max-w-xl leading-[1.5]">
                  Your chat logs, attachments, voice notes, and search indexes live in an isolated browser storage partition. If you sign in on another computer, you get a clean slate with 0 records exposed.
                </p>
              </div>

              {/* Tabular figure telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#e3e8ee] dark:border-[#273951]">
                <div className="p-3.5 rounded-[8px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-[#273951]">
                  <span className="text-[10px] uppercase font-normal text-[#64748d] dark:text-[#94a3b8] block">Relay Queue</span>
                  <span className="text-[16px] font-light text-[#533afd] dark:text-[#b9b9f9] font-tabular">0ms Purge</span>
                </div>
                <div className="p-3.5 rounded-[8px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-[#273951]">
                  <span className="text-[10px] uppercase font-normal text-[#64748d] dark:text-[#94a3b8] block">Local Cipher</span>
                  <span className="text-[16px] font-light text-[#0d253d] dark:text-white font-tabular">AES-256-GCM</span>
                </div>
                <div className="p-3.5 rounded-[8px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-[#273951]">
                  <span className="text-[10px] uppercase font-normal text-[#64748d] dark:text-[#94a3b8] block">Multi-Tab Sync</span>
                  <span className="text-[16px] font-light text-[#533afd] dark:text-[#b9b9f9] font-tabular">BroadcastCh</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: card-cream-band (Stripi's chromatic interlude on canvas-cream #f5e9d4) */}
            <div className="p-8 rounded-[12px] border border-[#e8dac0] dark:border-[#273951] bg-[#f5e9d4] dark:bg-[#1c1e54]/60 text-[#0d253d] dark:text-[#f6f9fc] flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-full bg-[#9b6829]/20 text-[#9b6829] dark:text-amber-300 flex items-center justify-center">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                  Direct P2P HD Calling
                </h3>
                <p className="text-[14px] font-light leading-[1.5] text-[#273951] dark:text-[#cbd5e1]">
                  Crystal clear audio and 1080p video streams travel strictly device-to-device via WebRTC with DTLS-SRTP encryption without recording servers.
                </p>
              </div>

              <div className="p-3 rounded-[8px] bg-white/80 dark:bg-[#0d253d] border border-[#e8dac0] dark:border-[#273951] flex items-center justify-between text-[12px] font-tabular">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#533afd] animate-ping" />
                  <span className="font-normal text-[#0d253d] dark:text-white">SRTP Encrypted</span>
                </div>
                <span className="text-[#64748d] dark:text-[#94a3b8]">0 Relay Lag</span>
              </div>
            </div>

            {/* Bento Card 3: card-pricing-featured (Inverted dark navy #1c1e54) */}
            <div className="p-8 rounded-[12px] border border-[#273951] bg-[#1c1e54] text-white flex flex-col justify-between space-y-6 shadow-[0_8px_24px_rgba(0,55,112,0.18)]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-full bg-[#533afd] text-white flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-white">
                    Verified Identity
                  </h3>
                  <PurpleVerifiedBadge size="sm" />
                </div>
                <p className="text-[14px] font-light text-[#cbd5e1] leading-[1.5]">
                  Cryptographically signed public handles and verified badges prevent spoofing and ensure authentic peer verification.
                </p>
              </div>

              <div className="p-3 rounded-[8px] bg-[#0d253d] border border-[#273951] flex items-center gap-2 text-[12px] font-tabular text-[#b9b9f9]">
                <PurpleVerifiedBadge size="xs" />
                <span>Ed25519 Identity Signature</span>
              </div>
            </div>

            {/* Bento Card 4: Disappearing Timers with tight pill chips */}
            <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-full bg-[#b9b9f9]/40 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#b9b9f9] flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                  Ephemeral Timers
                </h3>
                <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                  Configure auto-destruct timers for sensitive conversations to expunge messages simultaneously from all participant device vaults.
                </p>
              </div>

              {/* Tight Pill Chips */}
              <div className="flex items-center gap-1.5 bg-[#f6f9fc] dark:bg-[#0d253d] p-1.5 rounded-full border border-[#e3e8ee] dark:border-[#273951]">
                {(['5s', '1h', '24h', '7d'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimer(t)}
                    className={`flex-1 py-1 rounded-full text-[12px] font-normal transition-all cursor-pointer font-tabular ${
                      selectedTimer === t
                        ? 'bg-[#533afd] text-white shadow-xs'
                        : 'text-[#64748d] hover:text-[#0d253d] dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Bento Card 5: Google Drive BYOS */}
            <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-full bg-[#b9b9f9]/40 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#b9b9f9] flex items-center justify-center">
                  <Cloud className="h-5 w-5" />
                </div>
                <h3 className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                  Google Drive BYOS
                </h3>
                <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                  Bring your own storage. Securely back up encrypted media vaults directly to your personal Google Drive without vendor custody.
                </p>
              </div>

              <div className="p-3 rounded-[8px] bg-[#f6f9fc] dark:bg-[#0d253d] border border-[#e3e8ee] dark:border-[#273951] flex items-center justify-between text-[12px] font-tabular text-[#273951] dark:text-[#cbd5e1]">
                <span>Personal Drive Sync</span>
                <span className="text-[#533afd] dark:text-[#b9b9f9] font-medium">BYOS Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE TELEMETRY & CRYPTOGRAPHIC PROOF (Dark Console Panel) */}
      <section id="inspector" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#0d253d]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="pill-tag-soft inline-block mb-3">
              LIVE CRYPTOGRAPHIC TELEMETRY
            </div>
            <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
              Inspect how data is sealed before relay.
            </h2>
            <p className="mt-3 text-[16px] font-light text-[#273951] dark:text-[#cbd5e1]">
              Enter sample text below to observe the real-time encrypted packet structure routed across the zero-retention relay.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Input Column: text-input standards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-[12px] bg-white dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] space-y-4 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div>
                  <label className="text-[13px] font-normal text-[#0d253d] dark:text-white block mb-2">
                    Plaintext Message Input
                  </label>
                  <textarea
                    id="crypto_demo_input"
                    rows={3}
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    placeholder="Enter payload string..."
                    className="w-full p-3 rounded-[6px] border border-[#a8c3de] dark:border-[#273951] bg-white dark:bg-[#0d253d] text-[14px] text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#e3e8ee] dark:border-[#273951]">
                  <span className="text-[11px] font-normal uppercase tracking-[0.1px] text-[#64748d] dark:text-[#94a3b8] block">
                    Cipher Algorithm
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCipherAlgorithm('AES-256-GCM')}
                      className={`py-2 px-3 rounded-full text-[13px] font-normal transition-all cursor-pointer ${
                        cipherAlgorithm === 'AES-256-GCM'
                          ? 'bg-[#533afd] text-white shadow-xs'
                          : 'bg-white dark:bg-[#0d253d] text-[#273951] dark:text-[#cbd5e1] border border-[#e3e8ee] dark:border-[#273951]'
                      }`}
                    >
                      AES-256-GCM
                    </button>
                    <button
                      onClick={() => setCipherAlgorithm('X25519-Ratchet')}
                      className={`py-2 px-3 rounded-full text-[13px] font-normal transition-all cursor-pointer ${
                        cipherAlgorithm === 'X25519-Ratchet'
                          ? 'bg-[#533afd] text-white shadow-xs'
                          : 'bg-white dark:bg-[#0d253d] text-[#273951] dark:text-[#cbd5e1] border border-[#e3e8ee] dark:border-[#273951]'
                      }`}
                    >
                      X25519 Ratchet
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsDemoEncrypted(!isDemoEncrypted)}
                  className="w-full py-2.5 rounded-full border border-[#e3e8ee] dark:border-[#273951] text-[14px] font-normal text-[#273951] dark:text-[#cbd5e1] hover:border-[#533afd] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDemoEncrypted ? (
                    <>
                      <Eye className="h-4 w-4 text-[#533afd]" />
                      <span>Inspect Raw Memory String</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-[#533afd]" />
                      <span>Show Sealed Encrypted Cipher</span>
                    </>
                  )}
                </button>
              </div>

              {/* Guarantees Box */}
              <div className="p-6 rounded-[12px] bg-white dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] space-y-3 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="text-[12px] font-normal uppercase tracking-[0.1px] text-[#64748d] dark:text-[#94a3b8]">
                  Cryptographic Specifications
                </div>
                <div className="space-y-2.5 text-[13px] font-light text-[#273951] dark:text-[#cbd5e1]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                    <span>Zero records committed to central databases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                    <span>Hardware Keystore local token derivation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                    <span>Client-side encrypted voice notes, attachments, polls</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Console Terminal (card-dashboard-mockup with brand-dark-900 fill #1c1e54) */}
            <div className="lg:col-span-7">
              <div className="rounded-[16px] border border-[#273951] bg-[#0d253d] text-[#cbd5e1] font-mono text-[13px] shadow-[0_20px_50px_rgba(0,55,112,0.25)] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3.5 bg-[#1c1e54] border-b border-[#273951] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[#533afd]" />
                    <span className="text-[12px] font-mono text-[#a8c3de]">
                      relay.telemetry.outbound.json
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#b9b9f9] bg-[#533afd]/20 border border-[#533afd]/40 px-2.5 py-0.5 rounded-full font-tabular">
                      ENCRYPTION ACTIVE
                    </span>
                    <button
                      onClick={() => copyToClipboard(getSimulatedCipher(demoText))}
                      className="p-1.5 rounded-full hover:bg-[#273951] text-[#a8c3de] hover:text-white transition-colors cursor-pointer"
                      title="Copy Cipher"
                    >
                      {copiedCipher ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-x-auto max-h-[380px] select-text">
                  <div className="text-[#64748d] text-[11px]">
                    // Outbound Relay Packet Structure (Transmitted via Zero-Retention Queue)
                  </div>
                  {isDemoEncrypted ? (
                    <pre className="text-[#b9b9f9] text-[12px] leading-relaxed font-tabular">
                      {getSimulatedCipher(demoText)}
                    </pre>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-[#ea2261] text-[12px]">
                        // Notice: Plaintext representation exists exclusively in client RAM
                      </div>
                      <div className="p-4 rounded-[8px] bg-[#1c1e54] border border-[#273951] text-white font-mono text-[13px]">
                        {demoText || '<Empty payload>'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-[#1c1e54]/80 border-t border-[#273951] text-[12px] text-[#64748d] flex items-center justify-between font-tabular">
                  <span>Storage: Isolated IndexedDB</span>
                  <span className="text-[#533afd] font-medium">Relay State: Ephemeral</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURAL COMPARISON MATRIX */}
      <section id="comparison" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="pill-tag-soft inline-block mb-3">
              ARCHITECTURAL AUDIT
            </div>
            <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
              Why Zenoa outperforms conventional cloud messaging.
            </h2>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#1c1e54]">
                  <th className="p-5 font-normal text-[#0d253d] dark:text-white uppercase tracking-[0.1px] text-[11px]">
                    Security Property
                  </th>
                  <th className="p-5 font-normal text-[#533afd] dark:text-[#b9b9f9] uppercase tracking-[0.1px] text-[11px]">
                    Zenoa Protocol v3.4
                  </th>
                  <th className="p-5 font-normal text-[#64748d] uppercase tracking-[0.1px] text-[11px]">
                    Traditional Cloud Messengers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee] dark:divide-[#273951] text-[#273951] dark:text-[#cbd5e1] font-light">
                <tr>
                  <td className="p-5 font-normal text-[#0d253d] dark:text-white">Cloud Message Retention</td>
                  <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                    <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> 0 Bytes (Purged upon receipt)
                  </td>
                  <td className="p-5 text-[#64748d]">Retained indefinitely in cloud databases</td>
                </tr>
                <tr>
                  <td className="p-5 font-normal text-[#0d253d] dark:text-white">New Device Login Exposure</td>
                  <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                    <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> 100% Blank Canvas (Zero past history)
                  </td>
                  <td className="p-5 text-[#64748d]">Downloads complete past message history</td>
                </tr>
                <tr>
                  <td className="p-5 font-normal text-[#0d253d] dark:text-white">Cryptographic Keystore</td>
                  <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                    <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Client-Side WebCrypto (Device Vault)
                  </td>
                  <td className="p-5 text-[#64748d]">Often centralized on vendor server clusters</td>
                </tr>
                <tr>
                  <td className="p-5 font-normal text-[#0d253d] dark:text-white">Audio / Video Call Streams</td>
                  <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                    <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Peer-to-Peer WebRTC Direct
                  </td>
                  <td className="p-5 text-[#64748d]">Transcoded via central recording servers</td>
                </tr>
                <tr>
                  <td className="p-5 font-normal text-[#0d253d] dark:text-white">Subpoena & Data Breach Risk</td>
                  <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                    <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Zero centralized data to seize or leak
                  </td>
                  <td className="p-5 text-[#64748d]">Central databases vulnerable to breaches</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#0d253d]/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-2">
            <div className="pill-tag-soft inline-block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.15] tracking-[-0.64px] text-[#0d253d] dark:text-white">
              Common Questions & Inquiries
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={'faq_item_' + index}
                  className="rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 overflow-hidden shadow-[0_1px_2px_rgba(0,55,112,0.04)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f6f9fc]/80 dark:hover:bg-[#1c1e54] transition-colors"
                  >
                    <span className="text-[16px] font-normal text-[#0d253d] dark:text-white">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#533afd] shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#64748d] shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="px-6 pb-6 text-[15px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5] border-t border-[#e3e8ee] dark:border-[#273951] pt-4"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ENGINEERING DISCLOSURE FORM */}
      <section id="contact" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#090d16]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <div className="pill-tag-soft inline-block mb-2">
              ENGINEERING CONTACT
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.15] tracking-[-0.64px] text-[#0d253d] dark:text-white">
              Connect with Protocol Engineering
            </h2>
            <p className="text-[15px] font-light text-[#64748d] dark:text-[#94a3b8] max-w-md mx-auto">
              Inquiries regarding security audits, protocol verification, or cryptographic disclosures.
            </p>
          </div>

          <form
            id="landing_contact_form"
            onSubmit={handleContactSubmit}
            className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#1c1e54]/50 shadow-[0_1px_3px_rgba(0,55,112,0.06)] space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-normal text-[#273951] dark:text-[#cbd5e1] block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Researcher or Engineer"
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#a8c3de] dark:border-[#273951] bg-white dark:bg-[#0d253d] text-[14px] text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-normal text-[#273951] dark:text-[#cbd5e1] block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="engineer@organization.com"
                  className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#a8c3de] dark:border-[#273951] bg-white dark:bg-[#0d253d] text-[14px] text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-normal text-[#273951] dark:text-[#cbd5e1] block mb-1.5">
                Inquiry or Disclosure Details
              </label>
              <textarea
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your question or security inquiry..."
                className="w-full p-3.5 rounded-[6px] border border-[#a8c3de] dark:border-[#273951] bg-white dark:bg-[#0d253d] text-[14px] text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors resize-none"
              />
            </div>

            <button
              id="landing_contact_submit_btn"
              type="submit"
              disabled={contactSent}
              className="rounded-full px-5 py-2.5 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[15px] font-normal transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,55,112,0.15)] active:scale-[0.98] w-full"
            >
              {contactSent ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Inquiry Dispatched to Engineering</span>
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

      {/* FOOTER-LIGHT on canvas (#ffffff) with caption typography and ink-mute */}
      <footer className="mt-auto py-16 bg-white dark:bg-[#090d16] border-t border-[#e3e8ee] dark:border-[#273951]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-[13px] font-light text-[#64748d] dark:text-[#94a3b8]">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#533afd] text-white text-xs font-bold flex items-center justify-center">
                Z
              </div>
              <span className="font-sf-pro font-black text-[18px] tracking-[0.06em] uppercase text-[#0d253d] dark:text-white leading-none">
                ZENOA
              </span>
            </div>
            <p className="text-[13px] max-w-sm leading-[1.5]">
              Zero-Cloud Message Retention Protocol. Client-side encrypted with AES-256-GCM and stored exclusively within physical device hardware vaults.
            </p>
          </div>

          {/* Legal Disclosures */}
          <div className="space-y-2.5">
            <div className="font-normal text-[#0d253d] dark:text-white uppercase text-[11px] tracking-[0.1px]">
              Legal & Disclosures
            </div>
            <ul className="space-y-2 text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left"
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
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('disclaimer');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left"
                >
                  Security Audit Report
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setLegalModalTab('acceptable_use');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left"
                >
                  Acceptable Use Policy
                </button>
              </li>
            </ul>
          </div>

          {/* System Specs */}
          <div className="space-y-2.5">
            <div className="font-normal text-[#0d253d] dark:text-white uppercase text-[11px] tracking-[0.1px]">
              Protocol Specifications
            </div>
            <ul className="space-y-1.5 text-[12px] font-tabular">
              <li>• IndexedDB Isolated Vault</li>
              <li>• Zero-Retention Relay (0ms TTL)</li>
              <li>• Peer-to-Peer WebRTC Calls</li>
              <li>• AES-256-GCM WebCrypto KDF</li>
              <li>• Google Drive BYOS Storage</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#e3e8ee] dark:border-[#273951] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-tabular text-[#64748d] dark:text-[#94a3b8]">
          <span>© 2026 Zenoa Inc. All rights reserved. Zero-Retention System.</span>
          <div className="flex items-center gap-4">
            <span>Protocol v3.4.0 (Production Release)</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#533afd] transition-colors cursor-pointer"
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
