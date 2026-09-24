import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Zap, Key, Sun, Moon, ArrowLeft, Terminal, 
  Lock, Code2, Webhook, Cpu, Copy, Check, Server, Activity, Shield,
  Layers, ExternalLink, ChevronRight, FileText
} from 'lucide-react';
import { UserData } from '../../../types';
import { useBranding } from '../../../brandingUtils';
import { BrandLogo } from '../../common/BrandLogo';
import { ContinueWithZenoaButton } from '../../common/ContinueWithZenoaButton';
import { WaveArcs } from '../../originkit/ui/wave-arcs';

interface LandingViewProps {
  user: UserData | null;
  onOpenConsole: () => void;
  onShowAuth: () => void;
  onSwitchAccount: () => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

type CodeTab = 'curl' | 'nodejs' | 'python' | 'go';

const CODE_EXAMPLES: Record<CodeTab, { filename: string; language: string; code: string }> = {
  curl: {
    filename: 'terminal.sh',
    language: 'bash',
    code: `# 1. Dispatch a verified bot message via Service Account
curl -X POST https://api.zenoa.in/v1/bot/messages \\
  -H "Authorization: Bearer zsa_live_9f83a2e18d7b4c6e9a0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "@engineering_team",
    "content": "Deployment pipeline #1402 completed successfully.",
    "priority": "high",
    "metadata": { "env": "production", "status": "healthy" }
  }'`
  },
  nodejs: {
    filename: 'client.ts',
    language: 'typescript',
    code: `import { ZenoaClient } from '@zenoa/sdk';

const zenoa = new ZenoaClient({
  apiKey: process.env.ZENOA_SERVICE_KEY!,
  webhookSecret: process.env.ZENOA_WEBHOOK_SECRET!
});

// Dispatch high-priority transactional notification
await zenoa.messages.send({
  recipient: '@alex',
  content: 'Your 6-digit verification code is: 849201',
  tag: 'AUTHENTICATION_OTP'
});

// Listen for signed incoming bot events
zenoa.on('message:received', async (event) => {
  console.log('Verified payload from:', event.sender, event.text);
});`
  },
  python: {
    filename: 'bot_service.py',
    language: 'python',
    code: `import os
from zenoa import ZenoaClient, WebhookVerifier

client = ZenoaClient(api_key=os.getenv("ZENOA_SERVICE_KEY"))

# Send structured bot message with interactive metadata
response = client.messages.dispatch(
    recipient="@security_ops",
    content="Alert: Anomaly detected in cluster us-east-1.",
    priority="urgent"
)

print(f"Message dispatched with ID: {response.message_id}")`
  },
  go: {
    filename: 'main.go',
    language: 'go',
    code: `package main

import (
	"context"
	"log"
	"os"
	"github.com/zenoa/zenoa-go"
)

func main() {
	client := zenoa.NewClient(os.Getenv("ZENOA_SERVICE_KEY"))

	msg, err := client.Messages.Send(context.Background(), &zenoa.MessageParams{
		Recipient: "@devops_leads",
		Content:   "Automated cluster health check: All services nominal.",
	})
	if err != nil {
		log.Fatalf("Failed to dispatch: %v", err)
	}
	log.Printf("Dispatched message: %s", msg.ID)
}`
  }
};

export const LandingView: React.FC<LandingViewProps> = ({ 
  user, 
  onOpenConsole, 
  onShowAuth, 
  onSwitchAccount,
  themeMode = 'light',
  onToggleTheme
}) => {
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo;
  const isDark = themeMode === 'dark';
  const appName = branding.app_name || 'Zenoa';

  const [activeTab, setActiveTab] = useState<CodeTab>('curl');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE_EXAMPLES[activeTab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-hidden ${
      isDark ? 'dark bg-[#0a0d1d] text-slate-100 selection:bg-[#533afd] selection:text-white' : 'bg-[#f8fafc] text-slate-900 selection:bg-[#533afd]/20 selection:text-[#533afd]'
    }`}>
      {/* Dynamic Background Arcs */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15 -z-10">
        <WaveArcs
          backgroundColor="transparent"
          lineColor={isDark ? 'rgb(129, 140, 248)' : 'rgb(83, 58, 253)'}
          lineWidth={1.2}
          lineCount={54}
          speed={4.0}
          glow={10}
          interactive={false}
        />
      </div>

      {/* Enterprise Header */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#0a0d1d]/90' : 'border-slate-200/90 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo
              src={activeLogo}
              name={appName}
              size="sm"
            />
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                {appName}
              </span>
              <span className="hidden sm:inline-block h-3.5 w-px bg-slate-300 dark:bg-slate-700" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/50">
                Developer Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a 
              href="/" 
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden md:flex items-center gap-1.5 px-2 py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Messenger</span>
            </a>

            <a 
              href="/sso" 
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline-block px-2 py-1"
            >
              OAuth 2.0 Console
            </a>

            <a 
              href="/docs" 
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline-block px-2 py-1"
            >
              API Reference
            </a>

            {onToggleTheme && (
              <button
                id="dev_landing_theme_toggle"
                onClick={onToggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>
            )}

            {user ? (
              <button 
                onClick={onOpenConsole} 
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <ContinueWithZenoaButton
                portal="developer"
                size="sm"
                variant="primary"
                className="rounded-lg !py-2 !px-3.5 text-xs shadow-xs"
                showArrow={false}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto w-full">
        {/* Editorial Pill & Headline */}
        <div className="max-w-4xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{appName} Core Engine</span>
            <span aria-hidden="true">·</span>
            <span>REST & WebSocket APIs</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-600 dark:text-indigo-400">v2.4 Production Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Build, automate, and scale with
            <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              sovereign messaging APIs.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The enterprise platform for programmatic messaging, real-time webhook streaming, transactional OTP delivery, and verified bot infrastructure.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <>
                <button 
                  onClick={onOpenConsole} 
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Open Console (@{user.username})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a 
                  href="/docs" 
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>API Reference</span>
                </a>
                <button 
                  onClick={onSwitchAccount} 
                  className="w-full sm:w-auto px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Switch Account
                </button>
              </>
            ) : (
              <>
                <ContinueWithZenoaButton
                  portal="developer"
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto shadow-md"
                />
                <a 
                  href="/docs" 
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>Explore Documentation</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Interactive Code Preview Terminal */}
        <div className="mt-14 w-full max-w-4xl">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 shadow-xl overflow-hidden text-left">
            {/* Terminal Window Bar */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
                  {(['curl', 'nodejs', 'python', 'go'] as CodeTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                        activeTab === tab 
                          ? 'bg-indigo-600 text-white font-semibold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'nodejs' ? 'TypeScript' : tab === 'python' ? 'Python' : 'Go'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
                  {CODE_EXAMPLES[activeTab].filename}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors cursor-pointer"
                  title="Copy code snippet"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto selection:bg-indigo-500/30">
              <pre className="text-slate-200 whitespace-pre">
                <code>{CODE_EXAMPLES[activeTab].code}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Enterprise Architecture Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left">
          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
              <Webhook className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-2">High-Frequency Webhooks</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Stream incoming bot interactions, delivery receipts, and authentication events with HMAC-SHA256 signature verification and automatic retry backoff.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-2">Transactional Delivery & OTP</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Dispatch high-priority 6-digit authentication codes and mission-critical system alerts with sub-millisecond routing and zero telecom intermediary latency.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-2">Verified Service Accounts</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Provision certified bot accounts with Purple Verified trust badges, granular permission scopes, 1-click secret rotation, and strict IP allowlisting.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-2">Bidirectional Bot Gateway</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Handle structured command triggers, conversational AI flows, and rich interactive message cards with live state synchronization.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-2">Cryptographic Zero-Trust</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              End-to-end envelope encryption, AES-256-GCM message security, deterministic token hashing, and tamper-evident payload verification.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800/60">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-2">Observability & Audit Logs</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Inspect live request logs, track dispatch latencies, analyze delivery status rates, and review comprehensive administrative audit trails.
            </p>
          </div>
        </div>

        {/* 3-Step Lifecycle Overview */}
        <div className="mt-20 max-w-5xl w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Engineered for Developer Velocity
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
            Integrate verified machine automation in three straightforward steps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">01</span>
              <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white">Create Service Account</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Define bot identity, configure access permissions, and generate a scoped 256-bit API credential.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">02</span>
              <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white">Configure Webhook Route</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Register your HTTPS callback URL to receive signed incoming events in real time.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">03</span>
              <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white">Dispatch & Scale</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Send messages, deliver transactional alerts, and monitor telemetry directly in the console.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className={`border-t py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-600 dark:text-slate-400 mt-auto transition-colors ${
        isDark ? 'border-slate-800/80 bg-[#080b18]' : 'border-slate-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{appName}</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium">
            <a href="/legal/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</a>
            <a href="/legal/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="/sso" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">OAuth 2.0 Console</a>
            <a href="/docs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">API Reference</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
