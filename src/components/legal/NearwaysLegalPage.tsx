import React, { useState, useEffect } from 'react';
import { Shield, FileText, Lock, ArrowLeft, ChevronRight, Mail, Smartphone, Wifi, Radio } from 'lucide-react';
import { INolasLogo } from '../common/INolasLogo';

export type NearwaysDocType = 'privacypolicy' | 'termsofservice';

interface NearwaysLegalPageProps {
  initialDoc?: NearwaysDocType;
  themeMode?: 'light' | 'dark';
  onNavigateHome?: () => void;
}

export const NearwaysLegalPage: React.FC<NearwaysLegalPageProps> = ({
  initialDoc = 'privacypolicy',
  themeMode,
  onNavigateHome
}) => {
  // Automatic system theme detection
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

  const [activeDoc, setActiveDoc] = useState<NearwaysDocType>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('term')) return 'termsofservice';
      if (p.includes('privacy')) return 'privacypolicy';
    }
    return initialDoc;
  });

  const handleSelectDoc = (doc: NearwaysDocType) => {
    setActiveDoc(doc);
    const path = doc === 'termsofservice' ? '/Nearways/legal/termsofservice' : '/Nearways/legal/privacypolicy';
    try {
      window.history.pushState({}, '', path);
    } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDarkMode ? 'dark bg-[#090d16] text-[#f6f9fc]' : 'bg-[#ffffff] text-[#0d253d]'
      }`}
    >
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#e3e8ee] dark:border-[#273951] bg-white/95 dark:bg-[#0d253d]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="p-2 rounded-xl border border-[#e3e8ee] dark:border-[#273951] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#273951] dark:text-[#cbd5e1] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Home"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <div
              onClick={() => handleSelectDoc('privacypolicy')}
              className="flex flex-col cursor-pointer select-none"
            >
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#0d253d] dark:text-white uppercase flex items-center gap-2">
                <span>Nearways</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Offline P2P
                </span>
              </span>
              <span className="text-[10px] font-medium text-[#64748d] dark:text-[#94a3b8] -mt-0.5 tracking-wide">
                From INOLAS
              </span>
            </div>
          </div>

          {/* Document Switcher Tab */}
          <nav className="flex items-center gap-1.5 bg-[#f6f9fc] dark:bg-[#1c1e54]/60 p-1 rounded-xl border border-[#e3e8ee] dark:border-[#273951]">
            <button
              onClick={() => handleSelectDoc('privacypolicy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeDoc === 'privacypolicy'
                  ? 'bg-white dark:bg-[#0d253d] text-[#533afd] dark:text-white shadow-xs font-semibold'
                  : 'text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white font-medium'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => handleSelectDoc('termsofservice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                activeDoc === 'termsofservice'
                  ? 'bg-white dark:bg-[#0d253d] text-[#533afd] dark:text-white shadow-xs font-semibold'
                  : 'text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white font-medium'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Terms of Service</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        {/* Document Header Metadata */}
        <div className="pb-6 border-b border-[#e3e8ee] dark:border-[#273951] space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#533afd] dark:text-[#818cf8]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#533afd]/10 border border-[#533afd]/20">
              Publisher: INOLAS
            </span>
            <span>•</span>
            <span>Application: Nearways: Offline Share & Chat (Android)</span>
            <span>•</span>
            <span>Effective Date: September 24, 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0d253d] dark:text-white">
            {activeDoc === 'privacypolicy' ? 'Privacy Policy for Nearways' : 'Terms of Service for Nearways'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748d] dark:text-[#94a3b8] pt-1">
            <span>Contact Email: azadtechnologies19@gmail.com</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Official Documentation
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRIVACY POLICY FOR NEARWAYS (Exact user text - Bina kuch change kiye)       */}
        {/* ========================================================================= */}
        {activeDoc === 'privacypolicy' && (
          <article className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>Nearways</strong>, engineered and published by <strong>INOLAS</strong> ("we", "our", or "us"). We believe privacy is a fundamental human right. Nearways was designed from the ground up with a <strong>Privacy-by-Design and Privacy-by-Default</strong> architecture.
              </p>
              <p>
                This Privacy Policy explains how Nearways operates, why we do not collect your personal data, how device permissions are utilized strictly on-device, and how your privacy is protected during local offline peer-to-peer (P2P) communication and file transfers.
              </p>
              <p>
                By downloading, installing, or using Nearways, you acknowledge and agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                2. Zero-Cloud & Zero-Data-Collection Principle
              </h2>
              <p>
                Nearways operates as a <strong>100% decentralized, local offline utility</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>No Remote Servers:</strong> We do not operate external web servers, cloud databases, user tracking systems, or telemetry backends for Nearways.
                </li>
                <li>
                  <strong>No User Accounts:</strong> You are never required to provide your legal name, email address, phone number, passwords, or social media credentials to use Nearways.
                </li>
                <li>
                  <strong>No Cloud Message Storage:</strong> Chat messages, voice notes, transfer logs, and media files are transmitted directly between physical devices over local Wi-Fi Direct, Local Area Networks (LAN), or local Bluetooth sockets. They never touch an intermediary cloud server.
                </li>
                <li>
                  <strong>No Analytics or Trackers:</strong> Nearways contains zero third-party advertising SDKs, zero user tracking libraries (such as Google Firebase Analytics, Facebook Pixel, or Adjust), and zero automated crash-harvesting tools that collect personal device data.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                3. Operating System Permissions and Purpose
              </h2>
              <p>
                To facilitate offline discovery and local high-speed file transfer, Android requires applications to request specific hardware permissions. Nearways uses these permissions strictly for real-time local functionality:
              </p>

              <div className="space-y-4 pl-3 border-l-2 border-[#533afd]/30">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">
                    A. Bluetooth & Nearby Devices (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">BLUETOOTH_SCAN</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">BLUETOOTH_ADVERTISE</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">BLUETOOTH_CONNECT</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">NEARBY_WIFI_DEVICES</code>)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Purpose:</strong> Used solely to power the local radar discovery feature. Bluetooth Low Energy (BLE) advertisements allow nearby peers to announce presence and detect other active Nearways nodes without internet access.</li>
                    <li><strong>Privacy Guarantee:</strong> Bluetooth identifiers are used solely for local device handshakes. No Bluetooth MAC addresses or hardware signatures are cataloged, tracked, or sent anywhere.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">
                    B. Location Access (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ACCESS_FINE_LOCATION</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ACCESS_COARSE_LOCATION</code>)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Technical Context:</strong> On Android operating systems (particularly Android 9 through Android 12), the Android OS requires location permission to allow apps to perform Bluetooth Low Energy scans and Wi-Fi Direct network discovery, as nearby radio signals could theoretically be correlated to a location.</li>
                    <li><strong>Privacy Guarantee:</strong> <strong>Nearways does NOT collect, inspect, record, log, or transmit your physical GPS location.</strong> Location data is completely ignored by our application and is never accessed beyond fulfilling Android’s underlying hardware scanning requirement.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">
                    C. Wi-Fi State & Networking (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ACCESS_WIFI_STATE</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">CHANGE_WIFI_STATE</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ACCESS_NETWORK_STATE</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">INTERNET</code>)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Purpose:</strong> Enables creation of local Wi-Fi Direct peer groups, detection of local subnet IP addresses, and direct TCP/UDP socket communication between sender and receiver devices.</li>
                    <li><strong>Privacy Guarantee:</strong> Sockets are opened strictly on local non-routable subnets (e.g., <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">192.168.49.x</code> or local subnet IP ranges). Sockets communicate directly device-to-device with no external routing.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">
                    D. Camera Access (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">CAMERA</code>)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Purpose:</strong> Used exclusively when opening the in-app "Scan QR Code" dialog to scan a peer's dynamic connection QR code for instant pairing.</li>
                    <li><strong>Privacy Guarantee:</strong> The camera feed is processed in real-time in device memory (RAM) solely by an offline QR barcode decoding algorithm. No photos, snapshots, or video streams are ever captured, saved to disk, or transmitted over any network.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">
                    E. Storage & Media Access (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">READ_MEDIA_IMAGES</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">READ_MEDIA_VIDEO</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">READ_MEDIA_AUDIO</code>, <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">MANAGE_EXTERNAL_STORAGE</code>)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Purpose:</strong> Allows you to browse and select your own files (documents, APKs, videos, photos) to share with a connected peer, and allows Nearways to write files you receive into your device's local storage (such as the standard <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Downloads/Nearways</code> directory).</li>
                    <li><strong>Privacy Guarantee:</strong> Nearways only accesses files that you explicitly choose to send or receive. We never crawl, index, read, or upload your private photo libraries or documents.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">
                    F. Notifications (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">POST_NOTIFICATIONS</code>)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li><strong>Purpose:</strong> Displays foreground transfer progress bars, file completion alerts, and incoming connection requests while the app is active or in background transfer mode.</li>
                    <li><strong>Privacy Guarantee:</strong> Notifications are generated 100% locally by Android's <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">NotificationManager</code>. No remote push notification services (such as FCM) are used.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                4. Local Data Storage & Control
              </h2>
              <p>
                All information generated within Nearways resides exclusively on your physical device:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Local Profile:</strong> Your custom display name and avatar (if configured) are saved locally in the app's encrypted local SQLite Room database on your device.</li>
                <li><strong>Conversation History:</strong> Chat messages are stored locally on your device.</li>
                <li><strong>User Control:</strong> You retain full ownership and control over your data. You can delete individual chats, clear transfer records, or wipe all app data at any moment through Nearways Settings or Android System Settings (<code>Settings &gt; Apps &gt; Nearways &gt; Clear Storage</code>).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                5. Security & Encryption
              </h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Direct Socket Transport:</strong> File transfers and chat packets are sent over direct local TCP/UDP sockets between sender and receiver.</li>
                <li><strong>Connection Approval:</strong> Nearways provides interactive connection approval prompts and QR code cryptographic handshakes, ensuring you only receive files or chat messages from peers you explicitly approve.</li>
                <li><strong>No Third-Party Access:</strong> Because data does not travel across the public internet or through cloud relays, third-party interception, man-in-the-cloud attacks, or unauthorized data harvesting are prevented by design.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                6. Children's Privacy (COPPA Compliance)
              </h2>
              <p>
                Nearways does not collect any personal information from any user, including children under the age of 13 (or under 16 in applicable jurisdictions). The application contains no advertising, no user behavioral profiling, and no in-app data harvesting. It is completely safe for general audiences.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                7. Compliance with International Privacy Laws (GDPR & CCPA/CPRA)
              </h2>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong>GDPR (General Data Protection Regulation):</strong> Under GDPR, INOLAS operates under the principles of <strong>Data Minimization</strong> and <strong>Privacy by Design</strong>. Because no personal data is collected, processed, or transferred to third-party processors, user identity and privacy rights are inherently preserved.
                </li>
                <li>
                  <strong>CCPA / CPRA (California Consumer Privacy Act):</strong> We do not sell, share, or monetize personal information. We do not maintain personal user databases.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                8. Changes to this Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in legal requirements or system features. Any updates will be included in newly compiled versions of the application and documented with an updated "Effective Date."
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                9. Contact Us
              </h2>
              <p>
                If you have questions, feedback, or concerns regarding this Privacy Policy or the security of Nearways, please contact us:
              </p>
              <div className="p-4 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624] space-y-1 text-xs">
                <div><strong>Entity:</strong> INOLAS</div>
                <div><strong>Email:</strong> <a href="mailto:azadtechnologies19@gmail.com" className="text-[#533afd] underline">azadtechnologies19@gmail.com</a></div>
                <div><strong>Developer Support:</strong> <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-[#533afd] underline">https://github.com/</a></div>
              </div>
            </section>
          </article>
        )}

        {/* ========================================================================= */}
        {/* TERMS OF SERVICE FOR NEARWAYS (Exact user text - Bina kuch change kiye)     */}
        {/* ========================================================================= */}
        {activeDoc === 'termsofservice' && (
          <article className="space-y-8 text-sm leading-relaxed text-[#273951] dark:text-[#cbd5e1]">
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                1. Agreement to Terms
              </h2>
              <p>
                By downloading, installing, accessing, or using <strong>Nearways</strong> (the "Application"), provided by <strong>INOLAS</strong> ("we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not install or use the Application.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                2. Description of the Service
              </h2>
              <p>
                Nearways is an offline, peer-to-peer (P2P) utility application engineered to facilitate high-speed local file sharing and decentralized communication between compatible Android devices using local Wi-Fi, Wi-Fi Direct, and Bluetooth protocols without requiring an active internet connection or third-party servers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                3. License Grant and Intellectual Property
              </h2>

              <div className="space-y-3 pl-3 border-l-2 border-[#533afd]/30">
                <div>
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">A. Limited License</h3>
                  <p className="text-xs sm:text-sm mt-1">
                    INOLAS grants you a personal, revocable, non-exclusive, non-transferable, and royalty-free license to download, install, and use Nearways on your Android devices strictly in accordance with these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">B. Ownership & Intellectual Property</h3>
                  <p className="text-xs sm:text-sm mt-1">
                    All rights, title, and interest in and to the Application—including software code, user interface designs, visual motifs, graphics, and the "From INOLAS" branding—are the exclusive intellectual property of INOLAS and are protected by applicable copyright, trademark, and intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0d253d] dark:text-white">C. Restrictions</h3>
                  <p className="text-xs sm:text-sm mt-1">You agree not to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mt-1">
                    <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the binary releases of the Application, except to the extent permitted by applicable law.</li>
                    <li>Modify, adapt, translate, or create derivative works based upon the Application without prior written consent from INOLAS.</li>
                    <li>Remove, alter, or obscure any copyright, trademark, or proprietary rights notices displayed in or on the Application.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                4. User Conduct and Responsibilities
              </h2>
              <p>
                Nearways enables direct, decentralized, device-to-device transfers. Because no cloud intermediaries exist, you acknowledge and agree that:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Lawful Use Only:</strong> You must use the Application strictly in compliance with all applicable local, national, and international laws and regulations.
                </li>
                <li>
                  <strong>Content Responsibility:</strong> You are solely responsible for all content, files, media, and communications transmitted or received by your device using the Application.
                </li>
                <li>
                  <strong>Prohibited Content:</strong> You agree not to use the Application to distribute, share, or transmit:
                  <ul className="list-disc pl-5 space-y-1 mt-1 text-xs sm:text-sm">
                    <li>Malicious software, viruses, trojans, worms, spyware, or harmful executable code.</li>
                    <li>Content that infringes upon the intellectual property, copyright, patent, trademark, or privacy rights of any third party.</li>
                    <li>Unlawful, abusive, defamatory, threatening, obscene, or harmful materials.</li>
                  </ul>
                </li>
                <li>
                  <strong>Peer Connection Discretion:</strong> You have sole discretion over approving connection requests and pairing with nearby peers via radar discovery or QR code scanning. You are responsible for verifying the identity and trustworthiness of peers prior to accepting file transfers.
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                5. Privacy and Permissions
              </h2>
              <p>
                Your privacy is paramount. Nearways operates with a Zero-Cloud architecture and does not collect, sell, or store your personal data. The Application requests specific hardware permissions (such as Bluetooth, Wi-Fi, and Camera for QR code scanning) strictly to perform local peer discovery and file transfer. For full details on our data protection practices, please consult our <strong>Privacy Policy</strong>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                6. Disclaimer of Warranties
              </h2>
              <p>
                THE APPLICATION IS PROVIDED ON AN <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE"</strong> BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INOLAS EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
                <li>WARRANTIES THAT THE APPLICATION WILL MEET YOUR SPECIFIC REQUIREMENTS OR THAT OPERATION WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</li>
                <li>WARRANTIES REGARDING THE SPEED, RANGE, OR RELIABILITY OF WIRELESS SIGNALS (BLUETOOTH, WI-FI DIRECT), WHICH ARE SUBJECT TO PHYSICAL DEVICE HARDWARE AND ENVIRONMENTAL INTERFERENCE.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                7. Limitation of Liability
              </h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL INOLAS, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES WHATSOEVER (INCLUDING LOSS OF DATA, DEVICE CORRUPTION, LOSS OF REVENUE, BUSINESS INTERRUPTION, OR HARDWARE MALFUNCTION) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE THE APPLICATION, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                YOUR SOLE REMEDY FOR DISSATISFACTION WITH THE APPLICATION IS TO DISCONTINUE USE AND UNINSTALL THE APPLICATION FROM YOUR DEVICE.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                8. Termination
              </h2>
              <p>
                You may terminate these Terms at any time by deleting and uninstalling Nearways from all your devices. INOLAS reserves the right to terminate or suspend your license to use the Application at any time without notice if you breach any provision of these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                9. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws applicable to software services, without giving effect to any principles of conflicts of law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                10. Modifications to Terms
              </h2>
              <p>
                We reserve the right to revise or modify these Terms at our discretion. Any updated version will be packaged with new releases of the Application. Your continued use of the Application after revisions become effective constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#0d253d] dark:text-white">
                11. Contact Information
              </h2>
              <p>
                If you have any questions or inquiries regarding these Terms of Service, please contact:
              </p>
              <div className="p-4 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-[#f6f9fc] dark:bg-[#121624] space-y-1 text-xs">
                <div><strong>Entity:</strong> INOLAS</div>
                <div><strong>Email:</strong> <a href="mailto:azadtechnologies19@gmail.com" className="text-[#533afd] underline">azadtechnologies19@gmail.com</a></div>
              </div>
            </section>
          </article>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-8 bg-[#f6f9fc] dark:bg-[#0d253d]/50 border-t border-[#e3e8ee] dark:border-[#273951] text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2.5">
          <INolasLogo height={30} theme={isDarkMode ? 'dark' : 'light'} />
          <div className="text-xs font-bold text-[#0d253d] dark:text-white tracking-wide">
            INOLAS
          </div>
          <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] max-w-md">
            Nearways: Offline Share & Chat (Android) • Effective September 24, 2026 • Contact: azadtechnologies19@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
};
