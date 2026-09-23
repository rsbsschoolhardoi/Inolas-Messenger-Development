import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from '../brandingUtils';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { WaveArcs } from './originkit/ui/wave-arcs';
import { INolasLogo } from './common/INolasLogo';
import {
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  Video,
  HardDrive,
  CheckCircle2,
  Database,
  Lock,
  Key,
  Zap,
  Radio,
  Copy,
  Shield,
  Cloud,
  Clock,
  Smartphone,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react';

interface LandingPageProps {
  onStartAuth: (mode?: 'login' | 'register') => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAdmin?: () => void;
  onNavigate?: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAuth,
  themeMode,
  onToggleTheme,
  onNavigate
}) => {
  const branding = useBranding();
  const publicLogo = branding.public_logo;
  const [selectedTimer, setSelectedTimer] = useState<'5s' | '1h' | '24h' | '7d'>('24h');
  const [demoText, setDemoText] = useState<string>(
    'Project Mercury: Treasury smart-contract keys relocated to offline cold storage.'
  );
  const [envelopeMode, setEnvelopeMode] = useState<'standard' | 'extended'>('standard');
  const [isDemoEncrypted, setIsDemoEncrypted] = useState<boolean>(true);
  const [copiedCipher, setCopiedCipher] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      try {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (_) {
        window.location.href = path;
      }
    }
  };

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

    if (envelopeMode === 'standard') {
      return JSON.stringify(
        {
          algorithm: 'AES-256-GCM',
          kdf: 'PBKDF2-SHA256',
          iv: '0x' + hex.substring(0, 4) + 'b49f28a9c1e0',
          ciphertext: 'U2FsdGVkX19' + btoa(text).slice(0, 24) + '==' + hex,
          auth_tag: '0x7e2b9c' + hex.substring(2, 6),
          server_action: 'PURGE_IMMEDIATELY_UPON_RECEIPT',
        },
        null,
        2
      );
    }

    return JSON.stringify(
      {
        algorithm: 'AES-256-GCM',
        envelope_version: '1.0',
        kdf: 'PBKDF2-SHA256',
        salt_rounds: 100000,
        iv: '0x' + hex.substring(0, 4) + 'b49f28a9c1e0',
        ciphertext: 'U2FsdGVkX19' + btoa(text).slice(0, 24) + '==' + hex,
        auth_tag: '0x7e2b9c' + hex.substring(2, 6),
        ttl_policy: 'ephemeral_transit',
        storage_destination: 'recipient_local_device_vault',
        server_retention_bytes: 0,
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
      a: 'Zenoa operates an ephemeral transit mesh. When you send a message, it is encrypted directly on your device with 256-bit encryption before leaving your hardware. The relay server routes the encrypted envelope directly to the recipient device socket. The millisecond the recipient acknowledges receipt, the message payload is permanently expunged from server memory. No database write ever occurs on our servers.',
    },
    {
      q: 'Where are my messages, voice recordings, and files stored?',
      a: 'All messages, audio recordings, poll records, and media attachments exist exclusively inside an encrypted local database partition on your physical device. Your personal device holds the decryption keys. If someone were to inspect or seize our servers, they would find zero conversation logs because no chat history is ever stored in the cloud.',
    },
    {
      q: 'What happens if I sign in on a new device?',
      a: 'Because zero historical chat logs exist on the cloud, a newly registered device session begins with a clean slate. This structural privacy guarantee ensures that even if credentials or cloud accounts were compromised elsewhere, your past conversation archives cannot be accessed from a new location.',
    },
    {
      q: 'How are voice and video calls protected?',
      a: 'All audio and video calls operate as direct peer-to-peer streams between participant devices with end-to-end media encryption. Calls travel directly between devices without passing through intermediate recording servers, transcoding bridges, or central storage gateways.',
    },
    {
      q: 'Can I back up my media to my own personal cloud?',
      a: 'Yes. Zenoa includes an optional Bring-Your-Own-Storage (BYOS) feature that connects directly with your personal Google Drive. Your backups are client-side encrypted on your device before uploading directly into your personal drive, giving you complete sovereign custody without third-party vendor access.',
    },
  ];

  return (
    <div
      id="zenoa_landing_root"
      className="min-h-screen w-full relative flex flex-col font-sans transition-colors duration-200 bg-[#ffffff] dark:bg-[#090d16] text-[#0d253d] dark:text-[#f6f9fc] selection:bg-[#533afd]/20 selection:text-[#533afd]"
    >
      {/* ATMOSPHERIC GRADIENT MESH BACKDROP */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[640px] stripi-gradient-mesh pointer-events-none opacity-90 dark:opacity-40 z-0"
      />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-[#ffffff]/80 dark:bg-[#0d253d]/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
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

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-normal text-[#273951] dark:text-[#cbd5e1]">
            <a href="#architecture" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#capabilities" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#inspector" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Inspector
            </a>
            <a href="#comparison" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              Comparison
            </a>
            <a href="#faq" className="hover:text-[#533afd] dark:hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Zone 3: Primary Actions */}
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
              Sign In
            </button>

            <button
              id="landing_get_started_btn"
              onClick={() => onStartAuth('login')}
              className="rounded-full px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[14px] font-normal transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] cursor-pointer flex items-center gap-1.5 active:scale-[0.98] whitespace-nowrap"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT LANDMARK */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden z-10">
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
              {/* Left Column: Headlines & Editorial Copy */}
              <div className="lg:col-span-7 space-y-6 text-left relative z-30">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#533afd] dark:text-[#b9b9f9] tracking-wide">
                  <span className="h-2 w-2 rounded-full bg-[#533afd] animate-pulse" />
                  <span>Inolas Nexus</span>
                  <span aria-hidden="true" className="text-[#a8c3de] dark:text-[#64748d]">·</span>
                  <span>Sovereign Privacy</span>
                  <span aria-hidden="true" className="text-[#a8c3de] dark:text-[#64748d]">·</span>
                  <span className="text-[#273951] dark:text-[#cbd5e1]">Zero Server Message Storage</span>
                </div>

                <h1 className="text-[34px] sm:text-[46px] lg:text-[54px] font-bold tracking-tight text-[#0d253d] dark:text-white leading-[1.18] sm:leading-[1.14]">
                  <span className="block text-[#0d253d] dark:text-white">
                    Sovereign private messaging,
                  </span>
                  <span className="block mt-2 sm:mt-2.5 text-[#533afd] dark:text-[#818cf8]">
                    sealed directly on your device.
                  </span>
                </h1>

                <p className="text-[16px] sm:text-[18px] font-normal text-[#273951] dark:text-[#cbd5e1] max-w-xl leading-[1.6]">
                  Engineered by <strong>Inolas Nexus</strong>, Zenoa ensures your messages, attachments, and call streams live exclusively inside your physical device's secure local sandbox—never archived in central cloud databases.
                </p>

                {/* Primary & Secondary Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    id="hero_start_btn"
                    onClick={() => onStartAuth('login')}
                    className="rounded-full px-5 py-2.5 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[15px] font-normal transition-all shadow-[0_1px_3px_rgba(0,55,112,0.2)] cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    id="hero_audit_btn"
                    onClick={() => handleNavigate('/security')}
                    className="rounded-full px-5 py-2.5 bg-white dark:bg-[#1c1e54] text-[#0d253d] dark:text-white border border-[#e3e8ee] dark:border-[#273951] hover:border-[#533afd] text-[15px] font-normal transition-all shadow-[0_1px_2px_rgba(0,55,112,0.05)] cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap"
                  >
                    <Shield className="h-4 w-4 text-[#64748d]" />
                    <span>Security & Privacy Transparency</span>
                  </button>
                </div>

                {/* Security Trust Features */}
                <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-[13px] text-[#64748d] dark:text-[#94a3b8] font-normal">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                    <span>Hardware-Isolated 256-Bit Encryption</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                    <span>Direct Peer-to-Peer Calling</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                    <span>Zero Central Conversation History</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Composited Dashboard Mockup */}
              <div className="lg:col-span-5 relative z-20">
                <div className="relative mx-auto w-full max-w-md rounded-[16px] p-4 bg-[#1c1e54] border border-[#273951] shadow-[0_20px_50px_rgba(0,55,112,0.25)] text-white">
                  {/* Mockup Header Chrome */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#273951]/80">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#ea2261]" />
                      <div className="h-3 w-3 rounded-full bg-[#f96bee]" />
                      <div className="h-3 w-3 rounded-full bg-[#533afd]" />
                      <span className="ml-2 text-[12px] font-mono text-[#a8c3de]">zenoa.in</span>
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
                            <span>Direct Connection · Zero Cloud Storage</span>
                          </div>
                        </div>
                      </div>
                      <span className="p-1.5 rounded-full bg-[#f6f9fc] dark:bg-[#1c1e54] text-[#533afd]">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* Message Stream */}
                    <div className="space-y-2.5 py-1 text-[13px] font-light">
                      {/* Received Message */}
                      <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="p-3 rounded-[12px] bg-[#f6f9fc] dark:bg-[#1c1e54] text-[#0d253d] dark:text-[#f6f9fc] border border-[#e3e8ee] dark:border-[#273951]">
                          <p className="leading-[1.4]">
                            Did the treasury contract payload arrive through the ephemeral relay queue?
                          </p>
                          <span className="text-[10px] text-[#64748d] dark:text-[#94a3b8] mt-1 block font-tabular">10:42:01 AM</span>
                        </div>
                      </div>

                      {/* Sent Message */}
                      <div className="flex items-end justify-end">
                        <div className="p-3 rounded-[12px] bg-[#533afd] text-white max-w-[85%] shadow-[0_1px_3px_rgba(0,55,112,0.15)]">
                          <p className="leading-[1.4]">
                            Confirmed. Decrypted directly into local device storage with zero bytes retained on servers.
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
                          <span className="font-mono">Sealed On-Device · Encrypted Envelope</span>
                        </div>
                        <span className="font-tabular font-medium text-[#533afd] dark:text-white">Relay: Purged</span>
                      </div>
                    </div>

                    {/* Simulated Input Field */}
                    <div className="pt-2 border-t border-[#e3e8ee] dark:border-[#273951] flex items-center gap-2">
                      <div className="flex-1 px-3 py-1.5 rounded-[6px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#a8c3de]/60 dark:border-[#273951] text-[12px] text-[#64748d] dark:text-[#94a3b8] font-light">
                        Write private message...
                      </div>
                      <div className="h-7 w-7 rounded-full bg-[#533afd] text-white flex items-center justify-center cursor-pointer shadow-xs">
                        <Send className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="text-[12px] font-medium text-[#64748d] dark:text-[#94a3b8]">
                  Server Message History
                </div>
                <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#533afd] dark:text-[#b9b9f9] mt-1 font-tabular">
                  0 Bytes
                </div>
                <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                  Purged immediately upon recipient delivery
                </div>
              </div>

              <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="text-[12px] font-medium text-[#64748d] dark:text-[#94a3b8]">
                  Storage Architecture
                </div>
                <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#0d253d] dark:text-white mt-1 font-tabular">
                  On-Device
                </div>
                <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                  Kept in your isolated, device-level database
                </div>
              </div>

              <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="text-[12px] font-medium text-[#64748d] dark:text-[#94a3b8]">
                  Encryption Standard
                </div>
                <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#0d253d] dark:text-white mt-1 font-tabular">
                  AES-256
                </div>
                <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                  Client-side keys created on your hardware
                </div>
              </div>

              <div className="p-6 rounded-[12px] bg-[#ffffff] dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="text-[12px] font-medium text-[#64748d] dark:text-[#94a3b8]">
                  Voice & Video Calls
                </div>
                <div className="text-[32px] font-light leading-[1.1] tracking-[-0.64px] text-[#0d253d] dark:text-white mt-1 font-tabular">
                  Direct P2P
                </div>
                <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] mt-1 font-light">
                  Direct device-to-device audio & video streams
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE PIPELINE */}
        <section id="architecture" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#0d253d]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <span className="text-xs font-semibold tracking-wider text-[#533afd] dark:text-[#818cf8] uppercase block mb-2">
                Zero-Retention Architecture
              </span>
              <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
                How conversations travel without leaving a trace on our servers.
              </h2>
              <p className="mt-3 text-[16px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                Traditional messaging platforms store years of your conversation history on corporate database clusters. Zenoa replaces centralized persistence with an ephemeral routing mesh where data exists only on your device.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 Card */}
              <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/60 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-tabular text-[22px] font-light text-[#533afd] dark:text-[#b9b9f9]">
                      01
                    </span>
                    <Smartphone className="h-5 w-5 text-[#64748d]" />
                  </div>
                  <h3 className="text-[20px] font-normal leading-[1.2] tracking-[-0.2px] text-[#0d253d] dark:text-white">
                    Client-Side Cryptographic Sealing
                  </h3>
                  <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                    Before any message or file leaves your keyboard, it is encrypted directly inside your device's secure browser sandbox using 256-bit AES encryption. Unencrypted plaintext never touches the network or any server.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e3e8ee] dark:border-[#273951] text-[12px] text-[#64748d] dark:text-[#94a3b8] flex items-center gap-1.5 font-normal">
                  <Key className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                  <span>On-Device Dynamic Key Generation</span>
                </div>
              </div>

              {/* Step 2 Card */}
              <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/60 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-tabular text-[22px] font-light text-[#533afd] dark:text-[#b9b9f9]">
                      02
                    </span>
                    <Radio className="h-5 w-5 text-[#533afd] animate-pulse" />
                  </div>
                  <h3 className="text-[20px] font-normal leading-[1.2] tracking-[-0.2px] text-[#0d253d] dark:text-white">
                    Instant Ephemeral Routing
                  </h3>
                  <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                    Our relay servers route encrypted packets straight to the recipient's active device. The moment the receiving device signals successful receipt, the in-flight packet is permanently erased from memory.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e3e8ee] dark:border-[#273951] text-[12px] text-[#533afd] dark:text-[#b9b9f9] flex items-center gap-1.5 font-normal">
                  <Zap className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                  <span>Zero Server Storage · Immediate Purge</span>
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/50 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/60 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-tabular text-[22px] font-light text-[#533afd] dark:text-[#b9b9f9]">
                      03
                    </span>
                    <HardDrive className="h-5 w-5 text-[#64748d]" />
                  </div>
                  <h3 className="text-[20px] font-normal leading-[1.2] tracking-[-0.2px] text-[#0d253d] dark:text-white">
                    Sandboxed Local Device Vault
                  </h3>
                  <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                    The recipient's device decrypts the payload locally on their own hardware and saves it inside an isolated, sandboxed local database on their physical machine. Only your device holds the decryption keys.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e3e8ee] dark:border-[#273951] text-[12px] text-[#64748d] dark:text-[#94a3b8] flex items-center gap-1.5 font-normal">
                  <Lock className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                  <span>Isolated Hardware-Level Sandbox</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM CAPABILITIES */}
        <section id="capabilities" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#090d16]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <span className="text-xs font-semibold tracking-wider text-[#533afd] dark:text-[#818cf8] uppercase block mb-2">
                Core Capabilities
              </span>
              <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
                Engineered for absolute privacy and real-time speed.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Card 1: Large Span 2 */}
              <div className="md:col-span-2 p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#b9b9f9]/40 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#b9b9f9] flex items-center justify-center">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="text-[22px] font-normal leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                    Sandboxed On-Device Database
                  </h3>
                  <p className="text-[15px] font-light text-[#273951] dark:text-[#cbd5e1] max-w-xl leading-[1.5]">
                    Your chat logs, attachments, voice notes, and search indexes live exclusively inside your browser's private local database sandbox. Because nothing is retained in cloud databases, logging in on another computer starts fresh with zero exposed records.
                  </p>
                </div>

                {/* Tabular details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#e3e8ee] dark:border-[#273951]">
                  <div className="p-3.5 rounded-[8px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-[#273951]">
                    <span className="text-[11px] font-medium text-[#64748d] dark:text-[#94a3b8] block">Message Relay</span>
                    <span className="text-[15px] font-medium text-[#533afd] dark:text-[#b9b9f9] mt-0.5 block">0ms Cloud Log</span>
                  </div>
                  <div className="p-3.5 rounded-[8px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-[#273951]">
                    <span className="text-[11px] font-medium text-[#64748d] dark:text-[#94a3b8] block">Local Protection</span>
                    <span className="text-[15px] font-medium text-[#0d253d] dark:text-white mt-0.5 block">Client AES-256</span>
                  </div>
                  <div className="p-3.5 rounded-[8px] bg-[#f6f9fc] dark:bg-[#1c1e54] border border-[#e3e8ee] dark:border-[#273951]">
                    <span className="text-[11px] font-medium text-[#64748d] dark:text-[#94a3b8] block">Session Sync</span>
                    <span className="text-[15px] font-medium text-[#533afd] dark:text-[#b9b9f9] mt-0.5 block">Instant Local Sync</span>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Direct HD Calling */}
              <div className="p-8 rounded-[12px] border border-[#e8dac0] dark:border-[#273951] bg-[#f5e9d4] dark:bg-[#1c1e54]/60 text-[#0d253d] dark:text-[#f6f9fc] flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#9b6829]/20 text-[#9b6829] dark:text-amber-300 flex items-center justify-center">
                    <Video className="h-5 w-5" />
                  </div>
                  <h3 className="text-[22px] font-normal leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                    Direct Device-to-Device Calling
                  </h3>
                  <p className="text-[14px] font-light leading-[1.5] text-[#273951] dark:text-[#cbd5e1]">
                    Crystal clear audio and 1080p video connect directly between participants as an encrypted peer-to-peer stream without passing through recording servers.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-white/80 dark:bg-[#0d253d] border border-[#e8dac0] dark:border-[#273951] flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#533afd] animate-ping" />
                    <span className="font-normal text-[#0d253d] dark:text-white">Encrypted Direct Stream</span>
                  </div>
                  <span className="text-[#64748d] dark:text-[#94a3b8]">No Relay Recording</span>
                </div>
              </div>

              {/* Bento Card 3: Cryptographic Identity */}
              <div className="p-8 rounded-[12px] border border-[#273951] bg-[#1c1e54] text-white flex flex-col justify-between space-y-6 shadow-[0_8px_24px_rgba(0,55,112,0.18)]">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#533afd] text-white flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[22px] font-normal leading-[1.1] tracking-[-0.22px] text-white">
                      Verified Identity
                    </h3>
                    <PurpleVerifiedBadge size="sm" />
                  </div>
                  <p className="text-[14px] font-light text-[#cbd5e1] leading-[1.5]">
                    Cryptographically signed public handles and verified badges prevent spoofing and ensure authentic peer verification.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#0d253d] border border-[#273951] flex items-center gap-2 text-[12px] text-[#b9b9f9]">
                  <PurpleVerifiedBadge size="xs" />
                  <span>Public Key Digital Signature</span>
                </div>
              </div>

              {/* Bento Card 4: Disappearing Timers */}
              <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#b9b9f9]/40 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#b9b9f9] flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="text-[22px] font-normal leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                    Disappearing Ephemeral Timers
                  </h3>
                  <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                    Configure auto-destruct timers for sensitive conversations to expunge messages simultaneously from all participant device vaults.
                  </p>
                </div>

                {/* Tight Timer Controls */}
                <div className="flex items-center gap-1.5 bg-[#f6f9fc] dark:bg-[#0d253d] p-1.5 rounded-lg border border-[#e3e8ee] dark:border-[#273951]">
                  {(['5s', '1h', '24h', '7d'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTimer(t)}
                      className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
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

              {/* Bento Card 5: Optional Cloud Backup */}
              <div className="p-8 rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 flex flex-col justify-between space-y-6 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-full bg-[#b9b9f9]/40 dark:bg-[#533afd]/20 text-[#533afd] dark:text-[#b9b9f9] flex items-center justify-center">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <h3 className="text-[22px] font-normal leading-[1.1] tracking-[-0.22px] text-[#0d253d] dark:text-white">
                    Personal Cloud Backup
                  </h3>
                  <p className="text-[14px] font-light text-[#273951] dark:text-[#cbd5e1] leading-[1.5]">
                    Bring your own storage. Securely back up encrypted media vaults directly to your personal Google Drive without third-party vendor custody.
                  </p>
                </div>

                <div className="p-3 rounded-[8px] bg-[#f6f9fc] dark:bg-[#0d253d] border border-[#e3e8ee] dark:border-[#273951] flex items-center justify-between text-[12px] text-[#273951] dark:text-[#cbd5e1]">
                  <span>Personal Drive Sync</span>
                  <span className="text-[#533afd] dark:text-[#b9b9f9] font-medium">User Controlled</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CRYPTOGRAPHIC INSPECTOR */}
        <section id="inspector" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#0d253d]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-semibold tracking-wider text-[#533afd] dark:text-[#818cf8] uppercase block mb-2">
                Cryptographic Transparency
              </span>
              <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
                Inspect how data is sealed before leaving your device.
              </h2>
              <p className="mt-3 text-[16px] font-light text-[#273951] dark:text-[#cbd5e1]">
                Enter sample text below to observe the encrypted envelope structure routed across our zero-retention ephemeral relay.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Input Column */}
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
                      placeholder="Enter sample message..."
                      className="w-full p-3 rounded-[6px] border border-[#a8c3de] dark:border-[#273951] bg-white dark:bg-[#0d253d] text-[14px] text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#e3e8ee] dark:border-[#273951]">
                    <span className="text-[11px] font-medium text-[#64748d] dark:text-[#94a3b8] block">
                      Envelope Structure
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setEnvelopeMode('standard')}
                        className={`py-2 px-3 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                          envelopeMode === 'standard'
                            ? 'bg-[#533afd] text-white shadow-xs'
                            : 'bg-white dark:bg-[#0d253d] text-[#273951] dark:text-[#cbd5e1] border border-[#e3e8ee] dark:border-[#273951]'
                        }`}
                      >
                        Standard Packet
                      </button>
                      <button
                        onClick={() => setEnvelopeMode('extended')}
                        className={`py-2 px-3 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                          envelopeMode === 'extended'
                            ? 'bg-[#533afd] text-white shadow-xs'
                            : 'bg-white dark:bg-[#0d253d] text-[#273951] dark:text-[#cbd5e1] border border-[#e3e8ee] dark:border-[#273951]'
                        }`}
                      >
                        Detailed Telemetry
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDemoEncrypted(!isDemoEncrypted)}
                    className="w-full py-2.5 rounded-lg border border-[#e3e8ee] dark:border-[#273951] text-[14px] font-normal text-[#273951] dark:text-[#cbd5e1] hover:border-[#533afd] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isDemoEncrypted ? (
                      <>
                        <Eye className="h-4 w-4 text-[#533afd]" />
                        <span>Inspect Raw Memory String</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 text-[#533afd]" />
                        <span>Show Sealed Encrypted Envelope</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Guarantees Box */}
                <div className="p-6 rounded-[12px] bg-white dark:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] space-y-3 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
                  <div className="text-[12px] font-medium text-[#64748d] dark:text-[#94a3b8]">
                    Cryptographic Guarantees
                  </div>
                  <div className="space-y-2.5 text-[13px] font-light text-[#273951] dark:text-[#cbd5e1]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                      <span>Zero message records committed to central databases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                      <span>On-device key derivation; keys never travel over the wire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#533afd] shrink-0" />
                      <span>Client-side encryption for voice notes, attachments, and polls</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Console Terminal */}
              <div className="lg:col-span-7">
                <div className="rounded-[16px] border border-[#273951] bg-[#0d253d] text-[#cbd5e1] font-mono text-[13px] shadow-[0_20px_50px_rgba(0,55,112,0.25)] overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3.5 bg-[#1c1e54] border-b border-[#273951] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-[#533afd]" />
                      <span className="text-[12px] font-mono text-[#a8c3de]">
                        packet.telemetry.outbound.json
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#b9b9f9] bg-[#533afd]/20 border border-[#533afd]/40 px-2.5 py-0.5 rounded-full font-tabular">
                        ENCRYPTION ACTIVE
                      </span>
                      <button
                        onClick={() => copyToClipboard(getSimulatedCipher(demoText))}
                        className="p-1.5 rounded-full hover:bg-[#273951] text-[#a8c3de] hover:text-white transition-colors cursor-pointer"
                        title="Copy Payload"
                      >
                        {copiedCipher ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4 overflow-x-auto max-h-[380px] select-text">
                    <div className="text-[#64748d] text-[11px]">
                      // Outbound Relay Packet Structure (Transmitted via Zero-Retention Relay)
                    </div>
                    {isDemoEncrypted ? (
                      <pre className="text-[#b9b9f9] text-[12px] leading-relaxed font-tabular">
                        {getSimulatedCipher(demoText)}
                      </pre>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-[#ea2261] text-[12px]">
                          // Plaintext payload exists strictly in your local device RAM:
                        </div>
                        <div className="p-4 rounded-[8px] bg-[#1c1e54] border border-[#273951] text-white font-mono text-[13px]">
                          {demoText || '<Empty payload>'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-[#1c1e54]/80 border-t border-[#273951] text-[12px] text-[#64748d] flex items-center justify-between font-tabular">
                    <span>Storage: Sandboxed Local Device Database</span>
                    <span className="text-[#533afd] font-medium">Relay State: Ephemeral In-Memory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON MATRIX */}
        <section id="comparison" className="py-20 md:py-28 border-b border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#090d16]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <span className="text-xs font-semibold tracking-wider text-[#533afd] dark:text-[#818cf8] uppercase block mb-2">
                Architectural Comparison
              </span>
              <h2 className="text-[32px] sm:text-[48px] font-light leading-[1.15] tracking-[-0.96px] text-[#0d253d] dark:text-white">
                How sovereign messaging compares to traditional cloud apps.
              </h2>
            </div>

            <div className="overflow-x-auto rounded-[12px] border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#1c1e54]/40 shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#1c1e54]">
                    <th className="p-5 font-medium text-[#0d253d] dark:text-white text-[12px]">
                      Security & Privacy Property
                    </th>
                    <th className="p-5 font-semibold text-[#533afd] dark:text-[#b9b9f9] text-[12px]">
                      Zenoa Sovereign Architecture
                    </th>
                    <th className="p-5 font-medium text-[#64748d] text-[12px]">
                      Traditional Cloud Messengers
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee] dark:divide-[#273951] text-[#273951] dark:text-[#cbd5e1] font-light">
                  <tr>
                    <td className="p-5 font-normal text-[#0d253d] dark:text-white">Cloud Message Storage</td>
                    <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                      <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> 0 Bytes (Purged upon recipient delivery)
                    </td>
                    <td className="p-5 text-[#64748d]">Retained indefinitely on central database servers</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-normal text-[#0d253d] dark:text-white">New Device Login Exposure</td>
                    <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                      <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Clean Slate (Zero historical chats exposed)
                    </td>
                    <td className="p-5 text-[#64748d]">Downloads complete past message history</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-normal text-[#0d253d] dark:text-white">Decryption Key Custody</td>
                    <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                      <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Held exclusively on your physical hardware
                    </td>
                    <td className="p-5 text-[#64748d]">Often accessible or managed on vendor servers</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-normal text-[#0d253d] dark:text-white">Voice & Video Call Routing</td>
                    <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                      <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Direct Peer-to-Peer without server recording
                    </td>
                    <td className="p-5 text-[#64748d]">Transcoded or routed through central media servers</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-normal text-[#0d253d] dark:text-white">Central Server Breach Risk</td>
                    <td className="p-5 text-[#533afd] dark:text-[#b9b9f9] font-normal flex items-center gap-1.5 font-tabular">
                      <Check className="h-4 w-4 shrink-0 text-[#533afd]" /> Zero centralized data to seize or leak
                    </td>
                    <td className="p-5 text-[#64748d]">Central databases remain attractive breach targets</td>
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
              <span className="text-xs font-semibold tracking-wider text-[#533afd] dark:text-[#818cf8] uppercase block mb-1">
                Frequently Asked Questions
              </span>
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
              <span className="text-xs font-semibold tracking-wider text-[#533afd] dark:text-[#818cf8] uppercase block mb-1">
                Engineering & Security Inquiries
              </span>
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
      </main>

      {/* FOOTER */}
      <footer className="mt-auto py-16 bg-white dark:bg-[#090d16] border-t border-[#e3e8ee] dark:border-[#273951]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-[13px] font-light text-[#64748d] dark:text-[#94a3b8]">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="font-sf-pro font-black text-[18px] tracking-[0.06em] uppercase text-[#0d253d] dark:text-white leading-none">
                ZENOA
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#f0f4ff] dark:bg-[#1e2238] text-[#533afd] dark:text-[#b9b9f9] font-medium">
                By Inolas Nexus
              </span>
            </div>
            <p className="text-[13px] max-w-sm leading-[1.5]">
              Sovereign private messenger with zero-cloud message retention. Engineered for sovereign communication, private accounts, and real-time bots.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[12px] text-[#533afd] dark:text-[#818cf8]">
              <a href="/developer" className="hover:underline">Developer Console</a>
              <span>•</span>
              <a href="/sso" className="hover:underline">Zenoa OAuth SSO</a>
              <span>•</span>
              <a href="/docs" className="hover:underline">API Docs</a>
              <span>•</span>
              <a href="/llms.txt" className="hover:underline">llms.txt</a>
            </div>
          </div>

          {/* Legal Disclosures */}
          <div className="space-y-2.5">
            <div className="font-medium text-[#0d253d] dark:text-white text-[12px]">
              Legal & Disclosures
            </div>
            <ul className="space-y-2 text-[13px]">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/privacy');
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/terms');
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left block"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/security"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/security');
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left block"
                >
                  Data Security Architecture
                </a>
              </li>
              <li>
                <a
                  href="/acceptable-use"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/acceptable-use');
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left block"
                >
                  Acceptable Use Policy
                </a>
              </li>
              <li>
                <a
                  href="/cookies"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/cookies');
                  }}
                  className="hover:text-[#533afd] transition-colors cursor-pointer text-left block"
                >
                  Cookies & Storage Policy
                </a>
              </li>
            </ul>
          </div>

          {/* System Architecture */}
          <div className="space-y-2.5">
            <div className="font-medium text-[#0d253d] dark:text-white text-[12px]">
              Security & Architecture
            </div>
            <ul className="space-y-1.5 text-[12px] font-normal text-[#64748d] dark:text-[#94a3b8]">
              <li>• Encrypted On-Device Database</li>
              <li>• Ephemeral In-Memory Relay</li>
              <li>• Direct Peer-to-Peer Calling</li>
              <li>• Client-Side 256-Bit Encryption</li>
              <li>• Optional Personal Cloud Backup</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#e3e8ee] dark:border-[#273951] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#64748d] dark:text-[#94a3b8]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#0d253d] dark:text-white">© 2026 Zenoa.</span>
            <span>All Rights Reserved.</span>
            <span className="text-[#cbd5e1] dark:text-[#475569]">•</span>
            <span className="font-medium text-[#533afd] dark:text-[#818cf8]">A Product of Inolas Nexus Private Limited.</span>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero-Retention Mesh</span>
            </span>
            <span className="text-[#cbd5e1] dark:text-[#475569]">•</span>
            <span>Client-Side Encrypted</span>
          </div>
        </div>

        {/* Inolas Brand Signature */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-6 border-t border-[#e3e8ee]/60 dark:border-[#273951]/60 flex flex-col items-center justify-center text-center pb-2">
          <div className="flex flex-col items-center justify-center gap-2.5 group cursor-default">
            <INolasLogo height={42} theme={themeMode} />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#64748d] dark:text-[#94a3b8]">
              Inolas Nexus Private Limited
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
