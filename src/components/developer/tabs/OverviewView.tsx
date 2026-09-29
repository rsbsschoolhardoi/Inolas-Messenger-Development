import React from 'react';
import { 
  Activity, Key, Zap, FileText, ArrowRight, 
  Lock, Radio, Sparkles, Building2, Layers, BarChart3
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

  const categoryLabel = categoryTier === 'messenger' 
    ? 'Messenger Plan' 
    : categoryTier === 'business' 
      ? 'Business Suite' 
      : 'Hybrid Enterprise';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* App Header & Status Summary */}
      <div className={`rounded-2xl p-6 sm:p-8 shadow-xs border transition-colors ${
        isDark 
          ? 'bg-[#0d1326] border-[#273951] text-white' 
          : 'bg-white border-[#e3e8ee] text-[#0d253d]'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
          isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-xs shrink-0 overflow-hidden border ${
              isDark ? 'bg-[#121624] border-[#273951] text-[#818cf8]' : 'bg-[#533afd]/10 border-[#533afd]/20 text-[#533afd]'
            }`}>
              {app?.avatar_url ? (
                <img src={app.avatar_url} alt={app.app_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl font-black">
                  {app?.app_name ? app.app_name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {app.app_name}
                </h2>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isSandbox 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}>
                  {isSandbox ? 'Sandbox Mode' : 'Production Live'}
                </span>

                <button
                  type="button"
                  onClick={onOpenCategoryUpgrade}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] border border-[#533afd]/20 hover:bg-[#533afd]/20 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Click to switch or upgrade category"
                >
                  {categoryTier === 'messenger' ? (
                    <Zap className="h-3 w-3" />
                  ) : categoryTier === 'business' ? (
                    <Building2 className="h-3 w-3" />
                  ) : (
                    <Layers className="h-3 w-3" />
                  )}
                  <span>{categoryLabel}</span>
                  <span className="text-[10px] opacity-70 underline ml-0.5">Change</span>
                </button>
              </div>

              <p className="text-xs font-mono text-[#64748d] dark:text-[#94a3b8] mt-1 flex items-center gap-2">
                <span>@{app.bot_username || app.owner}</span>
                <span>&bull;</span>
                <span>Created {new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('apps')}
              className="px-4 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Key className="h-4 w-4" />
              <span>View API Credentials</span>
            </button>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>API Gateway</span>
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">Operational</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Online</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Radio className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>Active Channel</span>
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">{isSandbox ? 'Test Sandbox' : 'Live Gateway'}</div>
            <div className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5">{isSandbox ? 'Free simulated traffic' : 'Real customer delivery'}</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Category Suite</span>
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white capitalize">{categoryTier}</div>
            <div className="text-[11px] text-[#533afd] dark:text-[#818cf8] font-semibold mt-0.5">Configured Tier</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Lock className="h-4 w-4 text-[#64748d] dark:text-[#94a3b8]" />
              <span>Credentials</span>
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">Protected</div>
            <div className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5">Encrypted in vault</div>
          </div>
        </div>
      </div>

      {/* Primary Action Hub Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#0d253d] dark:text-white">Developer Modules and Tools</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: API Keys */}
          <div 
            onClick={() => onNavigate('apps')}
            className={`group rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform ${
                isDark ? 'bg-[#533afd]/20 text-[#818cf8]' : 'bg-[#533afd]/10 text-[#533afd]'
              }`}>
                <Key className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                API Credentials
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Access your API Key, HTTP headers, and multi-language SDK integration code.
              </p>
            </div>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-[#533afd] dark:text-[#818cf8] ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <span>Manage Keys</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Business Automation & AI Suite */}
          <div 
            onClick={() => onNavigate('automation')}
            className={`group rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                AI and Automation
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Configure models, triage rules, anti-spam shields, and chat widgets.
              </p>
            </div>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-[#533afd] dark:text-[#818cf8] ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <span>Open AI Studio</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Analytics & Telemetry */}
          <div 
            onClick={() => onNavigate('analytics')}
            className={`group rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                Developer Analytics
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Inspect throughput, latency distribution, SLA uptime, and live tickers.
              </p>
            </div>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-[#533afd] dark:text-[#818cf8] ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <span>View Analytics</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: API Docs */}
          <div 
            onClick={() => onNavigate('docs')}
            className={`group rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                API Reference
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Browse REST API endpoints, request schemas, and code snippets.
              </p>
            </div>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-[#533afd] dark:text-[#818cf8] ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <span>Read Documentation</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Quickstart in 3 Steps */}
      <div className={`rounded-2xl p-6 sm:p-8 space-y-6 border ${
        isDark 
          ? 'bg-[#0d1326] border-[#273951] text-white' 
          : 'bg-[#0c1024] border-[#273951] text-white'
      }`}>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Quickstart Integration Guide</h3>
          <p className="text-xs text-[#94a3b8] mt-1">Get your application connected to Zenoa APIs in under two minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Obtain Credentials</h4>
            <p className="text-[#94a3b8] leading-relaxed">
              Navigate to the Credentials tab to copy your unified API Key and HTTP headers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Test in Sandbox</h4>
            <p className="text-[#94a3b8] leading-relaxed">
              Send your first test verification using the cURL snippets or the built-in simulator.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Activate Production</h4>
            <p className="text-[#94a3b8] leading-relaxed">
              Toggle to Live Production mode from the top navigation to route real customer dispatches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
