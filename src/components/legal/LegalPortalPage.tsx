import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Lock,
  Scale,
  Search,
  ArrowLeft,
  ChevronRight,
  Database,
  Key,
  Server,
  AlertTriangle,
  Mail,
  Building2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { INolasLogo } from '../common/INolasLogo';

export type LegalDocType = 'terms' | 'privacy' | 'security' | 'acceptable_use' | 'cookies';

interface LegalPortalPageProps {
  initialDoc?: LegalDocType;
  themeMode?: 'light' | 'dark';
  onNavigateHome?: () => void;
}

export const LegalPortalPage: React.FC<LegalPortalPageProps> = ({
  initialDoc = 'terms',
  themeMode,
  onNavigateHome
}) => {
  // Automatic theme detection based on system preferences and document class
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) return true;
      if (themeMode) return themeMode === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Automatic system theme adaptation
      setIsDarkMode(e.matches || document.documentElement.classList.contains('dark'));
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      mediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }, []);

  const [activeDoc, setActiveDoc] = useState<LegalDocType>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('privacy')) return 'privacy';
      if (p.includes('security')) return 'security';
      if (p.includes('acceptable-use') || p.includes('acceptable_use')) return 'acceptable_use';
      if (p.includes('cookie')) return 'cookies';
      if (p.includes('term')) return 'terms';
    }
    return initialDoc;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle seamless document switching and URL synchronization
  const handleSelectDoc = (doc: LegalDocType) => {
    setActiveDoc(doc);
    setSearchQuery('');
    const path =
      doc === 'terms'
        ? '/terms'
        : doc === 'privacy'
        ? '/privacy'
        : doc === 'security'
        ? '/security'
        : doc === 'acceptable_use'
        ? '/acceptable-use'
        : '/cookies';
    try {
      window.history.pushState({}, '', path);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const docsConfig: Record<
    LegalDocType,
    {
      title: string;
      navTitle: string;
      subtitle: string;
      docId: string;
      effectiveDate: string;
      icon: React.ReactNode;
      path: string;
    }
  > = {
    terms: {
      title: 'Terms of Service & User Agreement',
      navTitle: 'Terms of Service',
      subtitle: 'Governing agreement between Inolas Nexus Private Limited and users accessing the Zenoa platform, developer APIs, and communication services.',
      docId: 'INPL-TOS-2026-V5',
      effectiveDate: 'September 23, 2026',
      icon: <Scale className="h-4 w-4" />,
      path: '/terms'
    },
    privacy: {
      title: 'Global Privacy Policy & Data Protection',
      navTitle: 'Privacy Policy',
      subtitle: 'Complete statutory disclosures on personal data collection, zero-retention transit, on-device encryption, and user rights under DPDP Act 2023 & GDPR.',
      docId: 'INPL-PRIV-2026-V5',
      effectiveDate: 'September 23, 2026',
      icon: <Lock className="h-4 w-4" />,
      path: '/privacy'
    },
    security: {
      title: 'Data Security Architecture & Subpoena Policy',
      navTitle: 'Data Security',
      subtitle: 'Technical specifications, cryptographic standards, key custody boundaries, peer-to-peer routing, and legal subpoena response mechanisms.',
      docId: 'INPL-SEC-2026-V5',
      effectiveDate: 'September 23, 2026',
      icon: <Shield className="h-4 w-4" />,
      path: '/security'
    },
    acceptable_use: {
      title: 'Acceptable Use Policy & Community Standards',
      navTitle: 'Acceptable Use',
      subtitle: 'Prohibited activities, statutory compliance under Information Technology Rules 2021, bot standards, and account termination procedures.',
      docId: 'INPL-AUP-2026-V5',
      effectiveDate: 'September 23, 2026',
      icon: <FileText className="h-4 w-4" />,
      path: '/acceptable-use'
    },
    cookies: {
      title: 'Cookies & On-Device Storage Policy',
      navTitle: 'Cookies & Storage',
      subtitle: 'Technical disclosures regarding tracking cookies absence, isolated client-side IndexedDB storage, and browser session persistence.',
      docId: 'INPL-COOK-2026-V5',
      effectiveDate: 'September 23, 2026',
      icon: <Database className="h-4 w-4" />,
      path: '/cookies'
    }
  };

  const currentDocInfo = docsConfig[activeDoc];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDarkMode ? 'dark bg-[#090d16] text-[#f6f9fc]' : 'bg-[#ffffff] text-[#0d253d]'
      }`}
    >
      {/* TOP HEADER: Clean brand without avatars or prompts */}
      <header className="sticky top-0 z-40 border-b border-[#e3e8ee] dark:border-[#273951] bg-white/95 dark:bg-[#0d253d]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark & Back Button (No avatar icon, pure typographic brand) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="p-2 rounded-xl border border-[#e3e8ee] dark:border-[#273951] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#273951] dark:text-[#cbd5e1] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Zenoa Platform"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <div
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="flex flex-col cursor-pointer select-none"
            >
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#0d253d] dark:text-white uppercase">
                ZENOA
              </span>
              <span className="text-[10px] font-medium text-[#64748d] dark:text-[#94a3b8] -mt-0.5 tracking-wide">
                Inolas Nexus Private Limited
              </span>
            </div>
          </div>

          {/* Document Switcher on desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#f6f9fc] dark:bg-[#1c1e54]/60 p-1 rounded-xl border border-[#e3e8ee] dark:border-[#273951]">
            {(Object.keys(docsConfig) as LegalDocType[]).map((key) => {
              const item = docsConfig[key];
              const isSelected = activeDoc === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectDoc(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white dark:bg-[#0d253d] text-[#533afd] dark:text-white shadow-xs font-semibold'
                      : 'text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white font-medium'
                  }`}
                >
                  {item.icon}
                  <span>{item.navTitle}</span>
                </button>
              );
            })}
          </nav>

          {/* Direct CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/app';
              }}
              className="px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Open Application</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DOCUMENT SWITCHER ROW */}
      <div className="lg:hidden px-4 py-2.5 bg-[#f6f9fc] dark:bg-[#1c1e54]/80 border-b border-[#e3e8ee] dark:border-[#273951] overflow-x-auto no-scrollbar flex items-center gap-2">
        {(Object.keys(docsConfig) as LegalDocType[]).map((key) => {
          const item = docsConfig[key];
          const isSelected = activeDoc === key;
          return (
            <button
              key={key}
              onClick={() => handleSelectDoc(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#533afd] text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-[#0d253d] text-[#273951] dark:text-[#cbd5e1] border border-[#e3e8ee] dark:border-[#273951] font-medium'
              }`}
            >
              {item.icon}
              <span>{item.navTitle}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* LEFT SIDEBAR: Table of Contents & Corporate Credentials */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="sticky top-24 space-y-5">
            {/* Quick Search in document */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748d]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clause or keyword..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#a8c3de] dark:border-[#273951] bg-white dark:bg-[#0d253d] text-[#0d253d] dark:text-white outline-none focus:border-[#533afd] transition-colors"
              />
            </div>

            {/* Document Navigation Card */}
            <div className="p-4 rounded-2xl bg-[#f6f9fc] dark:bg-[#1c1e54]/40 border border-[#e3e8ee] dark:border-[#273951] space-y-2">
              <div className="text-[11px] font-bold text-[#64748d] dark:text-[#94a3b8] tracking-wider uppercase px-1">
                Legal Documents
              </div>
              <nav className="space-y-1">
                {(Object.keys(docsConfig) as LegalDocType[]).map((key) => {
                  const item = docsConfig[key];
                  const isSelected = activeDoc === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectDoc(key)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#533afd] text-white font-semibold shadow-xs'
                          : 'text-[#273951] dark:text-[#cbd5e1] hover:bg-white dark:hover:bg-[#0d253d] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.icon}
                        <span className="truncate">{item.navTitle}</span>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-[#a8c3de]'}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Corporate Entity Verification Card */}
            <div className="p-4 rounded-2xl bg-[#f6f9fc] dark:bg-[#1c1e54]/40 border border-[#e3e8ee] dark:border-[#273951] space-y-3 text-xs">
              <div className="text-[11px] font-bold text-[#64748d] dark:text-[#94a3b8] tracking-wider uppercase flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#533afd]" />
                <span>Operating Entity Details</span>
              </div>
              <div className="space-y-2 text-[#273951] dark:text-[#cbd5e1]">
                <div>
                  <span className="text-[#64748d] dark:text-[#94a3b8] block text-[10px] uppercase font-semibold">Legal Company:</span>
                  <span className="font-bold text-[#0d253d] dark:text-white">Inolas Nexus Private Limited</span>
                </div>
                <div>
                  <span className="text-[#64748d] dark:text-[#94a3b8] block text-[10px] uppercase font-semibold">Corporate Status:</span>
                  <span>Private Limited Company (Registered in India)</span>
                </div>
                <div>
                  <span className="text-[#64748d] dark:text-[#94a3b8] block text-[10px] uppercase font-semibold">Document Reference:</span>
                  <span className="font-mono text-[11px] font-medium">{currentDocInfo.docId}</span>
                </div>
                <div>
                  <span className="text-[#64748d] dark:text-[#94a3b8] block text-[10px] uppercase font-semibold">Last Updated:</span>
                  <span className="font-medium">{currentDocInfo.effectiveDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e3e8ee] dark:border-[#273951] space-y-1.5 text-[11px]">
                <div className="text-[#64748d] dark:text-[#94a3b8] font-semibold">Grievance & Legal Officer:</div>
                <div className="font-mono text-[#533afd] dark:text-[#818cf8]">grievance@zenoa.in</div>
                <div className="font-mono text-[#64748d] dark:text-[#94a3b8]">legal@zenoa.in</div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT / MAIN CONTENT: Full, Professional Legal Framework */}
        <main className="lg:col-span-8 xl:col-span-9 max-w-4xl space-y-8">
          {/* Document Header Card */}
          <div className="pb-6 border-b border-[#e3e8ee] dark:border-[#273951] space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#533afd] dark:text-[#818cf8]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#533afd]/10 border border-[#533afd]/20">
                Inolas Nexus Private Limited
              </span>
              <span>•</span>
              <span className="font-mono">{currentDocInfo.docId}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0d253d] dark:text-white">
              {currentDocInfo.title}
            </h1>

            <p className="text-sm sm:text-base text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
              {currentDocInfo.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748d] dark:text-[#94a3b8] pt-1">
              <span>Effective: {currentDocInfo.effectiveDate}</span>
              <span>•</span>
              <span>Governing Jurisdiction: Republic of India</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active Legal Document
              </span>
            </div>
          </div>

          {/* Core Technical Transparency Callout */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-[#131b33] border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3.5 text-xs sm:text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
            <Shield className="h-5 w-5 text-[#533afd] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#0d253d] dark:text-white font-bold">How Zenoa Operates (Full Transparency): </strong>
              Zenoa is built upon a non-custodial communication architecture. Your text messages, audio recordings, voice calls, and media attachments are processed client-side and saved exclusively in your own device's isolated local storage (IndexedDB). Inolas Nexus Private Limited does not store, monitor, or retain your private chat logs on central database servers. If you delete your device application data without an exported backup, your records cannot be restored by us because we do not hold your private encryption keys.
            </div>
          </div>

          {/* 1. TERMS OF SERVICE */}
          {activeDoc === 'terms' && (
            <div className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  1. Corporate Identity & Binding Legal Contract
                </h2>
                <p>
                  These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and <strong>Inolas Nexus Private Limited</strong> ("Company", "we", "us", or "our"), a private limited company incorporated under the laws of the Republic of India, governing your access to and use of the Zenoa real-time messaging application, developer console, APIs, and associated online services (collectively, the "Platform").
                </p>
                <p>
                  By creating an account, authenticating via phone OTP or credentials, accessing our developer APIs, or using any feature of Zenoa, you acknowledge that you have read, understood, and irrevocably agree to comply with these Terms, our Privacy Policy, and our Acceptable Use Policy. If you do not agree with any provision of these Terms, you must discontinue your access and use immediately.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  2. Intermediary Status & Section 79 Safe Harbor
                </h2>
                <p>
                  <strong>2.1 Statutory Status:</strong> Inolas Nexus Private Limited operates as an "Intermediary" as defined under Section 2(1)(w) of the Information Technology Act, 2000 (India).
                </p>
                <p>
                  <strong>2.2 Intermediary Immunity:</strong> In accordance with Section 79 of the Information Technology Act, 2000, Inolas Nexus Private Limited is not liable for third-party information, data, communications, or text/media links transmitted or facilitated through the Platform. Inolas Nexus Private Limited does not initiate message transmissions, does not select the recipients of transmissions, and does not select or modify the information contained in any end-to-end encrypted or client-to-client transmission.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  3. Non-Custodial Architecture & User Responsibility
                </h2>
                <p>
                  <strong>3.1 Local Device Storage:</strong> Unlike traditional cloud messaging providers that keep duplicate copies of all user conversations on centralized cloud servers, Zenoa stores messages, voice notes, and media attachments locally on the user's physical client device (utilizing browser IndexedDB and device-level encrypted storage).
                </p>
                <p>
                  <strong>3.2 Critical Loss Warning:</strong> Because Inolas Nexus Private Limited does not retain copies of your chat logs, nor does it hold your device's private encryption keys, if you clear your browser cache, format your hardware, uninstall the application, or lose your physical device without having created an encrypted backup, your past chat history cannot be recovered. Inolas Nexus Private Limited engineers and support staff have zero technical capability to decrypt or reconstruct lost local databases.
                </p>
                <p>
                  <strong>3.3 Account Security:</strong> You are strictly responsible for maintaining custody of your registered phone number, authentication credentials, and developer API secrets. Any activity conducted through your authenticated credentials is legally presumed to have been authorized by you.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  4. Ephemeral Message Transit & Zero Server Retention
                </h2>
                <p>
                  <strong>4.1 Ephemeral Memory Relay:</strong> When you send a message to another user, your client device encrypts the payload before it leaves your device. The Inolas Nexus relay network functions solely as an ephemeral conduit. The message is transmitted in volatile server memory directly to the recipient's active socket.
                </p>
                <p>
                  <strong>4.2 Immediate Memory Shredding:</strong> The instant the recipient device acknowledges packet receipt, the transit packet is purged permanently from volatile server memory. No database write occurs. Offline messages awaiting recipient connection are retained in temporary queues for a maximum time-to-live (TTL) of 72 hours, after which they are permanently deleted from transit.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  5. Developer Console, Service Accounts & API Usage
                </h2>
                <p>
                  <strong>5.1 Developer Credentials:</strong> Developers and enterprise entities accessing the Zenoa Developer Portal receive unique Client IDs, Client Secrets, and Service Account identities. You agree not to distribute or expose your private secrets in public code repositories or client-side web bundles.
                </p>
                <p>
                  <strong>5.2 Service Account Immutability:</strong> To protect recipient users against impersonation and financial fraud, the registered display name and unique bot handle of a service account are strictly immutable once provisioned. Any abuse or unsolicited commercial messaging (spam) will result in immediate API credential revocation.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  6. Limitation of Liability & Warranty Disclaimer
                </h2>
                <p>
                  The Platform is provided strictly on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. Inolas Nexus Private Limited, its directors, officers, employees, and agents expressly disclaim any warranties of merchantability, fitness for a particular purpose, uninterrupted uptime, or zero data loss resulting from hardware failure.
                </p>
                <p>
                  To the maximum extent permitted by applicable law, Inolas Nexus Private Limited shall not be liable for any indirect, incidental, punitive, special, or consequential damages, loss of profits, loss of data, or operational disruptions arising out of or in connection with your use of the Platform.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  7. Governing Law & Dispute Resolution
                </h2>
                <p>
                  These Terms shall be governed by, construed, and enforced in accordance with the laws of the Republic of India, without regard to its conflict of law principles. Any dispute, controversy, or claim arising out of or relating to these Terms or the breach thereof shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi / Bengaluru, India.
                </p>
              </section>
            </div>
          )}

          {/* 2. PRIVACY POLICY */}
          {activeDoc === 'privacy' && (
            <div className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  1. Introduction & Statutory Commitment
                </h2>
                <p>
                  Inolas Nexus Private Limited ("Company", "we", "us") values your privacy. This Global Privacy Policy explains exactly what data is collected, how it is processed, and your rights under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>, the <strong>General Data Protection Regulation (GDPR, EU)</strong>, and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  2. What Data We Collect
                </h2>
                <p>
                  We adhere strictly to the principle of <em>Data Minimization</em>. We collect only what is required to provide the communication service:
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-[#533afd]/40">
                  <div>
                    <strong>A. Account Registration Information:</strong> Your mobile phone number (used solely for OTP authentication and identifying your account on the network), chosen unique username, display name, optional profile picture, and optional self-described bio.
                  </div>
                  <div>
                    <strong>B. Security & Authentication Credentials:</strong> Cryptographic password hashes (salted and hashed via bcrypt/argon2; we never receive or store plaintext passwords) and your public cryptographic identity keys.
                  </div>
                  <div>
                    <strong>C. Service Account & Developer Information:</strong> If you use developer APIs, we store your application name, service account handle, webhook target URLs, and whitelist IP rules.
                  </div>
                  <div>
                    <strong>D. Temporary Transit Metadata:</strong> Volatile socket session identifiers and transient IP addresses strictly during active connections to route packets between sender and recipient. These are purged immediately upon session disconnection.
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  3. What Data We Do NOT Collect or Store
                </h2>
                <p>
                  For complete legal and technical transparency, our systems are intentionally engineered so that we do not have access to:
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li><strong>No Chat Content on Servers:</strong> We do not log, read, or archive your text messages, media files, or voice notes on company servers.</li>
                  <li><strong>No Voice or Video Call Recordings:</strong> Calls are conducted directly peer-to-peer via WebRTC (DTLS-SRTP). Audio and video frames never pass through a recording server.</li>
                  <li><strong>No Address Book Scraping:</strong> We do not upload your complete phone address book to company servers.</li>
                  <li><strong>No Ad Trackers or Telemetry:</strong> We do not deploy third-party advertising SDKs, behavioral tracking cookies, or commercial user profiling scripts.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  4. Sub-processors & External Service Providers
                </h2>
                <p>
                  To deliver notifications and maintain high-availability connectivity, Inolas Nexus Private Limited engages specific third-party sub-processors under strict data protection agreements:
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li><strong>Telecom SMS Gateways:</strong> Used exclusively to deliver single-use authentication codes (OTPs) to verify ownership of mobile numbers.</li>
                  <li><strong>STUN / TURN Relay Infrastructure:</strong> Used exclusively to facilitate direct WebRTC peer connections between devices behind restrictive symmetric NATs or corporate firewalls. Relays do not record or retain media packets.</li>
                  <li><strong>Cloud Database Infrastructure:</strong> Used to maintain the account registry (unique usernames, phone numbers, and cryptographic public keys).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  5. User Rights Under DPDP Act 2023 & GDPR
                </h2>
                <p>
                  As a user ("Data Principal"), you possess comprehensive statutory rights:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624]">
                    <div className="font-bold text-[#0d253d] dark:text-white text-xs">Right to Access & Summary</div>
                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">Request a copy of your account registration record and active sessions.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624]">
                    <div className="font-bold text-[#0d253d] dark:text-white text-xs">Right to Correction</div>
                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">Update or correct your profile display name, avatar, or support emails at any time.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624]">
                    <div className="font-bold text-[#0d253d] dark:text-white text-xs">Right to Complete Erasure</div>
                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">Delete your account permanently. Your registration record is immediately erased from our user registry.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624]">
                    <div className="font-bold text-[#0d253d] dark:text-white text-xs">Right to Grievance Redressal</div>
                    <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">Submit inquiries or complaints directly to our designated Grievance Officer.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  6. Grievance Officer & Statutory Contact
                </h2>
                <p>
                  In compliance with the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the designated Grievance Officer for Inolas Nexus Private Limited is:
                </p>
                <div className="p-4 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624] space-y-1 font-mono text-xs">
                  <div className="font-sans font-bold text-[#0d253d] dark:text-white">Grievance Redressal Officer</div>
                  <div>Inolas Nexus Private Limited</div>
                  <div>Email: <a href="mailto:grievance@zenoa.in" className="text-[#533afd] underline">grievance@zenoa.in</a></div>
                  <div>Turnaround: Acknowledgment within 24 hours; resolution within 15 days.</div>
                </div>
              </section>
            </div>
          )}

          {/* 3. DATA SECURITY ARCHITECTURE & SUBPOENA POLICY */}
          {activeDoc === 'security' && (
            <div className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  1. Cryptographic Specifications & Key Custody
                </h2>
                <p>
                  Inolas Nexus Private Limited implements modern, industry-standard cryptographic primitives to guarantee confidentiality and integrity:
                </p>
                <div className="space-y-3 pl-4 border-l-2 border-[#533afd]/40">
                  <div>
                    <h3 className="font-bold text-[#0d253d] dark:text-white">A. Client-Side Encryption (AES-GCM 256-Bit):</h3>
                    <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                      All sensitive message payloads are encrypted locally on the sender's client device via the W3C Web Cryptography API before transmission. Decryption keys are maintained exclusively on the end-user devices.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0d253d] dark:text-white">B. Direct Peer-to-Peer Calling (WebRTC DTLS-SRTP):</h3>
                    <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                      Voice and video calls establish direct media pipelines between client browsers using Datagram Transport Layer Security (DTLS) and Secure Real-time Transport Protocol (SRTP). Voice and video frames never touch our database servers.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0d253d] dark:text-white">C. Ephemeral Transport Layer Security:</h3>
                    <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                      All transport communication between client devices and Inolas Nexus relays is enforced over TLS 1.3 with Perfect Forward Secrecy (PFS), preventing retrospective decryption in the event of upstream key compromise.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  2. Subpoena & Law Enforcement Request Policy
                </h2>
                <p>
                  <strong>2.1 Statutory Legal Compliance:</strong> Inolas Nexus Private Limited strictly complies with valid, legally binding court orders and statutory directives issued by competent judicial authorities or authorized law enforcement agencies under applicable Indian law (including Section 91 of the Code of Criminal Procedure, 1973 / Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023, and Rule 3(1)(j) of the Information Technology Intermediary Rules, 2021).
                </p>
                <p>
                  <strong>2.2 Technical Infeasibility of Chat Interception:</strong> Inolas Nexus Private Limited cannot disclose information that it does not possess. Because messages are stored locally on user devices and relay packets are shredded from volatile memory upon delivery, Inolas Nexus Private Limited has zero technical capacity to provide past message contents, chat transcripts, voice call recordings, or private encryption keys to any third party or governmental entity.
                </p>
                <p>
                  <strong>2.3 Disclosable Information:</strong> Under a valid legal order, Inolas Nexus Private Limited can only provide the specific metadata retained in its account registry, consisting solely of: (a) registered mobile number, (b) account registration timestamp, (c) user-configured display name and bio, and (d) developer service account configuration details.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  3. Vulnerability Disclosure & Bug Bounty Program
                </h2>
                <p>
                  Inolas Nexus Private Limited welcomes responsible security research. If you discover a security vulnerability or cryptographic flaw in our application or API infrastructure, please report it immediately to <a href="mailto:security@zenoa.in" className="text-[#533afd] underline font-mono">security@zenoa.in</a>. We commit to acknowledging receipt within 24 hours and do not take legal action against researchers acting in good faith.
                </p>
              </section>
            </div>
          )}

          {/* 4. ACCEPTABLE USE POLICY */}
          {activeDoc === 'acceptable_use' && (
            <div className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  1. Statutory Compliance under Rule 3(1)(b) of IT Rules, 2021
                </h2>
                <p>
                  Under Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, users are strictly prohibited from hosting, displaying, uploading, modifying, publishing, transmitting, storing, updating or sharing any information that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Belongs to another person and to which the user does not have any right.</li>
                  <li>Is obscene, pornographic, pedophilic, invasive of another's privacy, insulting or harassing on the basis of gender, racially or ethnically objectionable, relating or encouraging money laundering or gambling, or promoting enmity between different groups on grounds of religion or caste.</li>
                  <li>Harmful to child safety, including any form of Child Sexual Abuse Material (CSAM). Inolas Nexus Private Limited operates an absolute zero-tolerance policy regarding child exploitation.</li>
                  <li>Infringes any patent, trademark, copyright, or other proprietary rights.</li>
                  <li>Deceives or misleads the addressee about the origin of the message or intentionally communicates any misinformation or information which is patently false and untrue or misleading in nature.</li>
                  <li>Impersonates another person or entity.</li>
                  <li>Threatens the unity, integrity, defense, security or sovereignty of India, friendly relations with foreign States, or public order.</li>
                  <li>Contains software viruses, malware, trojan horses, or any other computer code designed to disrupt, destroy, or limit the functionality of computer resources.</li>
                  <li>Violates any law for the time being in force in India.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  2. Anti-Spam & Automated Messaging Restrictions
                </h2>
                <p>
                  Users and developers utilizing Zenoa Service Accounts agree that they shall not:
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Dispatch bulk unsolicited commercial messages (spam) or automated scam links to users who have not explicitly opted in.</li>
                  <li>Harvest phone numbers or usernames from user groups without consent.</li>
                  <li>Deploy automated scripts designed to evade network rate limits or carrier dispatch filters.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  3. Account Termination & Enforcement Actions
                </h2>
                <p>
                  Inolas Nexus Private Limited reserves the right, without prior notice and at its sole discretion, to immediately suspend or permanently terminate accounts, revoke API access, and block network access from any entity found to be in breach of this Acceptable Use Policy or applicable statutes.
                </p>
              </section>
            </div>
          )}

          {/* 5. COOKIES & ON-DEVICE STORAGE POLICY */}
          {activeDoc === 'cookies' && (
            <div className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  1. Zero Third-Party Advertising Cookies
                </h2>
                <p>
                  Inolas Nexus Private Limited takes an unequivocal stance on online privacy: <strong>Zenoa does not use third-party advertising cookies, marketing tracking pixels, or cross-site fingerprinting scripts.</strong>
                </p>
                <p>
                  We do not partner with commercial ad networks, data brokers, or behavioral analytics vendors.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  2. What Storage Technologies We Use & Why
                </h2>
                <p>
                  To make the web application function cleanly and securely, Zenoa utilizes strictly functional on-device browser storage mechanisms:
                </p>
                <div className="space-y-3 pl-4 border-l-2 border-[#533afd]/40">
                  <div>
                    <h3 className="font-bold text-[#0d253d] dark:text-white">A. IndexedDB (Client Message Vault):</h3>
                    <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                      Stores your encrypted conversation history, media files, and local cryptographic identity keys securely inside your browser's sandboxed storage. This data never leaves your device unless you initiate a communication dispatch.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0d253d] dark:text-white">B. LocalStorage (Preferences & Authentication):</h3>
                    <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                      Retains your active session token (to keep you logged in between browser refreshes) and user UI preferences (such as audio volume or layout state).
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0d253d] dark:text-white">C. SessionStorage (Temporary State):</h3>
                    <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                      Maintains ephemeral navigation state during an active browser tab session, cleared automatically when the tab is closed.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                  3. How to Clear or Export Your On-Device Data
                </h2>
                <p>
                  Because your data resides on your physical device, you maintain complete custody over it at all times:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8]">
                  <li>You can wipe all messages instantly by using the "Clear Local Data" or "Delete Account" button within the Zenoa Settings menu.</li>
                  <li>Alternatively, you can open your browser Developer Tools (F12) &gt; Storage &gt; IndexedDB and delete the Zenoa database manually.</li>
                </ul>
              </section>
            </div>
          )}

          {/* DOCUMENT FOOTER SIGNATURE */}
          <div className="pt-8 border-t border-[#e3e8ee] dark:border-[#273951] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748d] dark:text-[#94a3b8]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0d253d] dark:text-white">© 2026 Inolas Nexus Private Limited.</span>
              <span>All Rights Reserved.</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="mailto:legal@zenoa.in" className="hover:text-[#533afd] transition-colors font-medium">
                legal@zenoa.in
              </a>
              <span>•</span>
              <a href="mailto:grievance@zenoa.in" className="hover:text-[#533afd] transition-colors font-medium">
                grievance@zenoa.in
              </a>
            </div>
          </div>
        </main>
      </div>

      {/* BOTTOM BRAND FOOTER (Corporate Inolas Nexus Private Limited) */}
      <footer className="py-8 bg-[#f6f9fc] dark:bg-[#0d253d]/50 border-t border-[#e3e8ee] dark:border-[#273951] text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2.5">
          <INolasLogo height={32} theme={isDarkMode ? 'dark' : 'light'} />
          <div className="text-xs font-bold text-[#0d253d] dark:text-white tracking-wide">
            Inolas Nexus Private Limited
          </div>
          <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] max-w-md">
            Operating Zenoa Secure Communications. Registered in the Republic of India. Governed by the Information Technology Act, 2000 and Digital Personal Data Protection Act, 2023.
          </p>
        </div>
      </footer>
    </div>
  );
};
