import React from 'react';
import { 
  Activity, Key, Zap, FileText, ArrowRight, 
  Lock, Radio, Sparkles, Building2, Layers, BarChart3,
  Copy, Check, Code, ShieldCheck, Terminal, ExternalLink, Cpu
} from 'lucide-react';
import { TabType } from '../views/PortalDashboard';
import { DeveloperCategoryTier } from '../../../types';

interface OverviewViewProps {
  app: any;
  environment: 'test' | 'live';
  categoryTier?: DeveloperCategoryTier;
  onOpenCategoryUpgrade?: () => void;
  onNavigate: (tab: TabType) => void;
  showToast: (msg: string) => void;
  themeMode?: 'light' | 'dark';
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  app,
  environment,
  categoryTier = 'business',
  onOpenCategoryUpgrade,
  onNavigate,
  showToast,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const isSandbox = environment === 'test';
  const [copiedKey, setCopiedKey] = React.useState(false);

  const categoryLabel = categoryTier === 'messenger' 
    ? 'Messenger API' 
    : categoryTier === 'business' 
      ? 'Business Suite' 
      : 'Hybrid Enterprise';

  const handleCopyQuickApiKey = () => {
    const key = isSandbox 
      ? (app?.api_keys?.sandbox_key || 'sk_test_zenoa_' + (app?.id || 'sandbox_prod_7781'))
      : (app?.api_keys?.live_key || 'sk_live_zenoa_' + (app?.id || 'live_prod_9920'));
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    showToast('API Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-200">
      {/* Editorial Hero Banner: Quiet white canvas, crisp Haas/Satoshi display font, confident primary button */}
      <section className={`rounded-xl border p-8 sm:p-10 transition-colors ${
        isDark 
          ? 'bg-[#181d26] border-[#2d333f] text-white' 
          : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pb-8 border-b border-[#dddddd] dark:border-[#2d333f]">
          <div className="space-y-3 max-w-2xl">
            {/* Clean unboxed metadata separator */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#333840] dark:text-zinc-400 font-normal">
              <span className="font-medium text-[#181d26] dark:text-white">{app?.app_name || 'Project Console'}</span>
              <span aria-hidden="true" className="text-zinc-400">·</span>
              <span className="font-mono">@{app?.bot_username || app?.owner || 'zenoa_dev'}</span>
              <span aria-hidden="true" className="text-zinc-400">·</span>
              <span className={`inline-flex items-center gap-1 font-medium ${isSandbox ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isSandbox ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {isSandbox ? 'Sandbox Environment' : 'Production Live'}
              </span>
              <span aria-hidden="true" className="text-zinc-400">·</span>
              <span>Created {new Date(app?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#181d26] dark:text-white">
              {app?.app_name || 'Production Workspace'}
            </h1>
            
            <p className="text-sm font-normal text-[#333840] dark:text-zinc-300 leading-relaxed">
              Unified console for your conversational web widget, service accounts, backend endpoints, and customer triage automation.
            </p>
          </div>

          {/* Airtable Signature Button Pair: Near-black primary + Hairline secondary */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('apps')}
              className="px-5 py-2.5 rounded-xl bg-[#181d26] text-white hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26] dark:hover:bg-zinc-100 text-sm font-medium transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              <span>API Credentials</span>
            </button>

            <button
              onClick={handleCopyQuickApiKey}
              className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                isDark 
                  ? 'bg-transparent text-white border-[#2d333f] hover:bg-[#222834]' 
                  : 'bg-white text-[#181d26] border-[#dddddd] hover:bg-[#f8fafc]'
              }`}
            >
              {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-[#333840] dark:text-zinc-400" />}
              <span>{copiedKey ? 'Copied Key' : 'Copy API Key'}</span>
            </button>

            {onOpenCategoryUpgrade && (
              <button
                type="button"
                onClick={onOpenCategoryUpgrade}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isDark 
                    ? 'bg-[#1d1f25] text-zinc-300 border-[#2d333f] hover:text-white' 
                    : 'bg-[#f8fafc] text-[#333840] border-[#dddddd] hover:bg-[#e0e2e6]'
                }`}
                title="Change or upgrade operational category"
              >
                <span>Plan:</span>
                <span className="font-semibold text-[#181d26] dark:text-white">{categoryLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Strip: Quiet, unboxed, 1px dividers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
          <div className="space-y-1">
            <div className="text-xs text-[#333840] dark:text-zinc-400 font-medium">Gateway Protocol</div>
            <div className="text-xl font-normal text-[#181d26] dark:text-white">v2.4 Core</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-normal flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational (99.99%)
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[#333840] dark:text-zinc-400 font-medium">Active Runtime</div>
            <div className="text-xl font-normal text-[#181d26] dark:text-white">{isSandbox ? 'Test Sandbox' : 'Live Gateway'}</div>
            <div className="text-xs text-[#333840] dark:text-zinc-400 font-normal">
              {isSandbox ? 'Isolated test mock events' : 'Real customer delivery'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[#333840] dark:text-zinc-400 font-medium">Monthly Quota</div>
            <div className="text-xl font-normal text-[#181d26] dark:text-white">10,000 Events</div>
            <div className="text-xs text-[#333840] dark:text-zinc-400 font-normal">Developer Free Tier</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[#333840] dark:text-zinc-400 font-medium">Secret Security</div>
            <div className="text-xl font-normal text-[#181d26] dark:text-white">AES-256 Vault</div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-normal">Hardware Key Protected</div>
          </div>
        </div>
      </section>

      {/* Signature Coral Card: High-Voltage Brand Surface for Business API & Service Accounts */}
      <section className="rounded-xl p-8 sm:p-12 text-white bg-[#aa2d00] shadow-[0_2px_8px_rgba(170,45,0,0.2)] transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="text-xs uppercase tracking-wider font-medium text-white/80">
              Business API &amp; Service Accounts
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white leading-tight">
              Production apps in prototype speed with server-authoritative service accounts.
            </h2>
            <p className="text-sm font-normal text-white/90 leading-relaxed">
              Create and manage isolated bot service accounts with explicit OAuth scopes, HMAC webhook signatures, and native SDKs for Node.js, Python, TypeScript, and cURL.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Secondary on dark: Pure white button */}
            <button
              onClick={() => onNavigate('apps')}
              className="px-6 py-3 rounded-xl bg-white text-[#181d26] hover:bg-zinc-100 text-sm font-medium transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Key className="h-4 w-4" />
              <span>Configure Service Account</span>
            </button>
            <button
              onClick={() => onNavigate('docs')}
              className="px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>API Reference</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Demo-Card Grid on Warm Pastel & Soft Surfaces (Peach, Mint, Cream, Surface Soft) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-[#181d26] dark:text-white">
            Developer Core Capabilities
          </h2>
          <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 mt-1">
            Modular toolsets designed for engineering precision, bot integration, and live client embedding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Web Widget & Automation (Mint Pastel Surface) */}
          <div 
            onClick={() => onNavigate('automation')}
            className={`rounded-xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-6 border ${
              isDark 
                ? 'bg-[#181d26] border-[#2d333f] text-white hover:border-zinc-500' 
                : 'bg-[#a8d8c4]/30 border-[#a8d8c4] hover:bg-[#a8d8c4]/45 text-[#181d26]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[#181d26] dark:text-white">
                  Client Embed
                </span>
                <Sparkles className="h-4 w-4 text-[#181d26] dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-[#181d26] dark:text-white">
                Web Widget &amp; Automation
              </h3>
              <p className="text-sm font-normal text-[#333840] dark:text-zinc-300 leading-relaxed">
                Embed your conversational AI customer assistant with 1-line script or React component.
              </p>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-medium text-[#181d26] dark:text-white">
              <span>Open Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2: Business API & Service Accounts (Peach Pastel Surface) */}
          <div 
            onClick={() => onNavigate('apps')}
            className={`rounded-xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-6 border ${
              isDark 
                ? 'bg-[#181d26] border-[#2d333f] text-white hover:border-zinc-500' 
                : 'bg-[#fcab79]/30 border-[#fcab79] hover:bg-[#fcab79]/45 text-[#181d26]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[#181d26] dark:text-white">
                  Backend Auth
                </span>
                <Terminal className="h-4 w-4 text-[#181d26] dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-[#181d26] dark:text-white">
                Business API &amp; SDKs
              </h3>
              <p className="text-sm font-normal text-[#333840] dark:text-zinc-300 leading-relaxed">
                Generate scoped tokens, configure webhooks, and integrate with Node, Python, or Go SDKs.
              </p>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-medium text-[#181d26] dark:text-white">
              <span>Manage Service Accounts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3: Developer Analytics (Soft Surface) */}
          <div 
            onClick={() => onNavigate('analytics')}
            className={`rounded-xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-6 border ${
              isDark 
                ? 'bg-[#181d26] border-[#2d333f] text-white hover:border-zinc-500' 
                : 'bg-[#f8fafc] border-[#dddddd] hover:bg-[#f1f5f9] text-[#181d26]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[#333840] dark:text-zinc-400">
                  Telemetry
                </span>
                <BarChart3 className="h-4 w-4 text-[#181d26] dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-[#181d26] dark:text-white">
                Developer Analytics
              </h3>
              <p className="text-sm font-normal text-[#333840] dark:text-zinc-300 leading-relaxed">
                Track event delivery rates, latency percentiles (p50/p99), and live request logs.
              </p>
            </div>

            <div className="pt-4 border-t border-[#dddddd] dark:border-[#2d333f] flex items-center justify-between text-xs font-medium text-[#181d26] dark:text-white">
              <span>View Analytics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 4: API Docs (Yellow / Cream Surface) */}
          <div 
            onClick={() => onNavigate('docs')}
            className={`rounded-xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-6 border ${
              isDark 
                ? 'bg-[#181d26] border-[#2d333f] text-white hover:border-zinc-500' 
                : 'bg-[#f5e9d4] border-[#d9a441]/40 hover:bg-[#f0dfc2] text-[#181d26]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[#181d26] dark:text-white">
                  Reference
                </span>
                <FileText className="h-4 w-4 text-[#181d26] dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-[#181d26] dark:text-white">
                API Reference &amp; Specs
              </h3>
              <p className="text-sm font-normal text-[#333840] dark:text-zinc-300 leading-relaxed">
                Comprehensive schemas for messages, bots, contacts, webhook signatures, and errors.
              </p>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-medium text-[#181d26] dark:text-white">
              <span>Read Documentation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Signature Forest Card: Deep Green Editorial Band for Telemetry & Security */}
      <section className="rounded-xl p-8 sm:p-12 text-white bg-[#0a2e0e] shadow-[0_2px_8px_rgba(10,46,14,0.2)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs uppercase tracking-wider font-medium text-white/80">
              Enterprise Resilience &amp; SLA
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white">
              Zero-downtime webhook delivery with cryptographically verified payloads.
            </h2>
            <p className="text-sm font-normal text-white/90 leading-relaxed">
              Every webhook dispatched through the Inolas gateway includes an HMAC-SHA256 signature header, exponential backoff retries, and real-time delivery logs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('webhooks')}
              className="px-6 py-3 rounded-xl bg-white text-[#181d26] hover:bg-zinc-100 text-sm font-medium transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span>Configure Webhooks</span>
            </button>
            <button
              onClick={() => onNavigate('logs')}
              className="px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Live Inspector</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Signature Cream Callout Card: Three-Step Quickstart */}
      <section className={`rounded-xl p-8 sm:p-10 border transition-colors ${
        isDark 
          ? 'bg-[#181d26] border-[#2d333f] text-white' 
          : 'bg-[#f5e9d4] border-[#d9a441]/40 text-[#181d26]'
      }`}>
        <div className="space-y-2 mb-8">
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight">
            Developer Quickstart
          </h2>
          <p className="text-sm font-normal opacity-80">
            Connect your codebase to Zenoa Gateway in three deterministic steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2">
            <div className="text-xs font-mono font-medium opacity-60">STEP 01</div>
            <h3 className="text-base font-medium">Extract Vault Credentials</h3>
            <p className="font-normal opacity-80 leading-relaxed">
              Copy your unified API Key and service account handle from the Business API tab.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-medium opacity-60">STEP 02</div>
            <h3 className="text-base font-medium">Test in Sandbox Mode</h3>
            <p className="font-normal opacity-80 leading-relaxed">
              Verify authentication and dispatch test payloads without affecting live users.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono font-medium opacity-60">STEP 03</div>
            <h3 className="text-base font-medium">Activate Live Gateway</h3>
            <p className="font-normal opacity-80 leading-relaxed">
              Switch the environment toggle to Live Production to process real customer traffic.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Band Light: Pre-Footer Banner ("Start building with Zenoa") */}
      <section className={`rounded-xl p-8 sm:p-12 border flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${
        isDark 
          ? 'bg-[#1d1f25] border-[#2d333f] text-white' 
          : 'bg-[#e0e2e6] border-[#dddddd] text-[#181d26]'
      }`}>
        <div className="space-y-1 max-w-xl">
          <h2 className="text-2xl font-normal tracking-tight">
            Start building production apps with Zenoa
          </h2>
          <p className="text-sm font-normal opacity-80">
            Explore our open-source sample applications, SDK starters, and tutorials.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('docs')}
            className="px-6 py-3 rounded-xl bg-[#181d26] text-white hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26] dark:hover:bg-zinc-100 text-sm font-medium transition-colors cursor-pointer"
          >
            Explore Docs &amp; Guides
          </button>
        </div>
      </section>
    </div>
  );
};
