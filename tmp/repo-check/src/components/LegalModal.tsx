import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Shield, FileText, Lock, Scale, Printer, Check, ChevronRight } from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'disclaimer' | 'cookies' | 'acceptable_use';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalDocType;
  onAccept?: () => void;
  themeMode?: 'light' | 'dark';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onAccept,
  themeMode = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const tabs: { id: LegalDocType; label: string; icon: React.ReactNode }[] = [
    { id: 'privacy', label: 'Privacy Policy', icon: <Lock className="h-3.5 w-3.5" /> },
    { id: 'terms', label: 'Terms & Conditions', icon: <Scale className="h-3.5 w-3.5" /> },
    { id: 'disclaimer', label: 'Risk & Legal Disclaimer', icon: <Shield className="h-3.5 w-3.5" /> },
    { id: 'acceptable_use', label: 'Acceptable Use Policy', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'cookies', label: 'Cookies & Retention', icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl shadow-xl border overflow-hidden font-sans transition-colors ${
            themeMode === 'dark'
              ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Top Bar / Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                Legal & Regulatory Disclosures
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-normal">
                Official documentation, privacy frameworks & operational terms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Minimal Segmented Tab Control */}
          <div className="px-6 py-2.5 bg-neutral-100/60 dark:bg-neutral-950/60 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-800/60 p-1 rounded-xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-400 shrink-0">
              <span>Effective Date: August 2026</span>
            </div>
          </div>

          {/* Quick Search inside document */}
          <div className="px-6 py-2 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-900/30 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search clause or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
              />
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Doc ID: LEG-2026-v3.4
            </div>
          </div>

          {/* Main Document Text Area */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans space-y-6 select-text">
            
            {/* PRIVACY POLICY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 max-w-3xl">
                <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Privacy Policy
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Last Modified: August 24, 2026 | Global Compliance (GDPR, CCPA, IT Act 2000, DPDP Act 2023)
                  </p>
                </header>

                <p className="text-neutral-600 dark:text-neutral-300">
                  This Privacy Policy outlines how our platform ("we", "our", "us") collects, utilizes, stores, and safeguards your information when you register, access, or utilize our application services. We are committed to protecting your personal data and ensuring full transparency.
                </p>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    1. Information Collection & Usage
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    We collect minimal personal data necessary for account provisioning and secure authentication:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-300 text-xs">
                    <li><strong>Account Credentials:</strong> Email address, unique username, and encrypted password hash credentials.</li>
                    <li><strong>Profile Metadata:</strong> Optional full name, avatar media, and user status preferences.</li>
                    <li><strong>Technical Logs:</strong> Anonymized IP address, user agent headers, and connection timestamps strictly used for DDoS prevention and authentication safety.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    2. Data Encryption & Message Privacy
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    All user communications, chat messages, and attachments are processed using industry-standard client-side encryption (AES-256-GCM / Web Crypto API). We do not store or inspect unencrypted plaintext payload data.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    3. No Third-Party Data Sharing
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    We enforce a strict policy against selling, renting, or leasing user data to third-party advertising brokers or data brokers. Your information is used exclusively to operate and secure your account.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    4. Data Retention & Account Erasure Right
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Under applicable data protection laws, you retain the right to request a complete export of your personal data or execute a permanent account erasure. Deleting your account purges all associated credentials and active session tokens instantly.
                  </p>
                </section>
              </div>
            )}

            {/* TERMS AND CONDITIONS TAB */}
            {activeTab === 'terms' && (
              <div className="space-y-6 max-w-3xl">
                <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Terms & Conditions of Service
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Effective Date: August 24, 2026 | Legally Binding User Agreement
                  </p>
                </header>

                <p className="text-neutral-600 dark:text-neutral-300">
                  By accessing, registering an account, or using our platform, you acknowledge that you have read, understood, and agree to be bound by the following Terms & Conditions. If you do not agree to these terms, you must refrain from creating an account or using the platform.
                </p>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    1. Account Registration & Eligibility
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to establish an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    2. Acceptable Use & Conduct Rules
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    You agree not to misuse the platform. Specifically, you agree not to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-300 text-xs">
                    <li>Transmit unlawful, abusive, harassing, defamatory, or fraudulent content.</li>
                    <li>Attempt unauthorized access to other accounts, server infrastructure, or network nodes.</li>
                    <li>Deploy automated bots, scraping scripts, or distributed denial-of-service (DDoS) tools.</li>
                    <li>Violate third-party intellectual property or privacy rights.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    3. Termination & Suspension Rights
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    We reserve the right to suspend or permanently terminate user accounts that breach these Terms, without prior notice, to protect network safety and platform integrity.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    4. Intellectual Property
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    All software code, user interface designs, trademarks, and brand assets are the exclusive intellectual property of the platform owner. Users retain ownership of their personal message content.
                  </p>
                </section>
              </div>
            )}

            {/* RISK & LEGAL DISCLAIMER TAB */}
            {activeTab === 'disclaimer' && (
              <div className="space-y-6 max-w-3xl">
                <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Risk & Legal Liability Disclaimer
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Limitation of Liability, Warranties & Indemnity Disclosures
                  </p>
                </header>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    1. "As-Is" Service Provision
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    The service is provided strictly on an "AS IS" and "AS AVAILABLE" basis. The platform owner, developers, and hosting infrastructure providers make no representations or warranties of any kind, express or implied, regarding uninterrupted operation, error-free execution, or fitness for a particular purpose.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    2. Exclusion of Consequential Damages
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    To the maximum extent permitted by applicable law, in no event shall the platform owner, software authors, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages — including lost profits, data loss, business interruption, or personal device breaches.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    3. Complete User Indemnification
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    You agree to indemnify, defend, and hold completely harmless the platform owner, developers, and infrastructure operators from any claims, liabilities, lawsuits, losses, penalties, or expenses (including legal fees) arising from your account usage, message content, or breach of these terms.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    4. Security Disclaimer
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    While we implement modern encryption and access controls, no digital platform is immune to hardware malware, keyloggers, or unauthorized access to endpoint devices. Users assume full responsibility for maintaining endpoint device security.
                  </p>
                </section>
              </div>
            )}

            {/* ACCEPTABLE USE POLICY */}
            {activeTab === 'acceptable_use' && (
              <div className="space-y-6 max-w-3xl">
                <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Acceptable Use Policy
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Community Standards & Operational Boundaries
                  </p>
                </header>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    1. Zero Tolerance Policy
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    We maintain a zero-tolerance policy against illegal content, harassment, exploitation, financial scams, or malicious network interference.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    2. User Reporting & System Safety
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Users can report violations through our reporting tools. Accounts identified in violations will be subject to immediate restriction or permanent removal.
                  </p>
                </section>
              </div>
            )}

            {/* COOKIES & RETENTION */}
            {activeTab === 'cookies' && (
              <div className="space-y-6 max-w-3xl">
                <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Cookies & Storage Policy
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Technical Storage & Session Identifiers
                  </p>
                </header>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    1. Functional Storage Technologies
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    We utilize browser HTML5 LocalStorage and essential session cookies solely required to maintain user authentication status, theme preferences, and offline message caching.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    2. No Tracking Cookies
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    We do not use persistent cross-site tracking cookies, third-party analytics cookies, or behavioral profiling trackers.
                  </p>
                </section>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-neutral-500">
              By using this service, you confirm compliance with all stated policies.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onAccept && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>I Read & Agree</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 font-medium text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
