import React from 'react';
import { 
  Activity, Key, Zap, FileText, Webhook, ShieldCheck, ArrowRight, 
  Layers, CheckCircle2, Lock, Radio, Server, ExternalLink, Users, Sparkles
} from 'lucide-react';
import { TabType } from '../views/PortalDashboard';
import { useBranding } from '../../../brandingUtils';

interface OverviewViewProps {
  app: any;
  environment: 'test' | 'live';
  onNavigate: (tab: TabType) => void;
  showToast: (msg: string) => void;
  themeMode?: 'light' | 'dark';
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  app,
  environment,
  onNavigate,
  showToast,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const branding = useBranding();
  const isSandbox = environment === 'test';

  return (
    <div className="space-y-8">
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {app.app_name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isSandbox 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}>
                  {isSandbox ? 'Sandbox Mode' : 'Production Live'}
                </span>
              </div>
              <p className="text-sm font-mono text-[#64748d] dark:text-[#94a3b8] mt-1 flex items-center gap-2">
                <span>@{app.bot_username || app.owner}</span>
                <span>•</span>
                <span>Created: {new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('apps')}
              className="px-4 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Key className="h-4 w-4" /> View API Credentials
            </button>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Activity className="h-4 w-4 text-emerald-500" /> API Gateway
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">Operational</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">99.9% SLA Online</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Radio className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" /> Active Channel
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">{isSandbox ? 'Test Sandbox' : 'Live Gateway'}</div>
            <div className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5">{isSandbox ? 'Free simulated traffic' : 'Real customer delivery'}</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Zap className="h-4 w-4 text-amber-500" /> Daily API Limit
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">1,000 reqs/day</div>
            <div className="text-[11px] text-[#533afd] dark:text-[#818cf8] font-semibold mt-0.5">Free Developer Tier</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-2 text-[#64748d] dark:text-[#94a3b8] text-xs font-medium">
              <Lock className="h-4 w-4 text-[#64748d] dark:text-[#94a3b8]" /> Credentials
            </div>
            <div className="text-lg font-bold mt-1 text-[#0d253d] dark:text-white">Protected</div>
            <div className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5">Hidden by default</div>
          </div>
        </div>
      </div>

      {/* Primary Action Hub (Cards) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#0d253d] dark:text-white">Developer Modules & Tools</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: API Keys */}
          <div 
            onClick={() => onNavigate('apps')}
            className={`group rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white shadow-black/20'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform ${
                isDark ? 'bg-[#533afd]/20 text-[#818cf8]' : 'bg-[#533afd]/10 text-[#533afd]'
              }`}>
                <Key className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                API Credentials
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Access your Client ID, secret keys, and SDK installation snippets securely.
              </p>
            </div>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-[#533afd] dark:text-[#818cf8] ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <span>Manage Keys</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: OTP Testing */}
          <div 
            onClick={() => onNavigate('otp')}
            className={`group rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white shadow-black/20'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                OTP Simulator
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Interactively test passcode dispatch, live verification, and delivery latency in real-time.
              </p>
            </div>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold text-[#533afd] dark:text-[#818cf8] ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <span>Launch Simulator</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: API Docs */}
          <div 
            onClick={() => onNavigate('docs')}
            className={`group rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 border ${
              isDark
                ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd] text-white shadow-black/20'
                : 'bg-white border-[#e3e8ee] hover:border-[#533afd]/50 hover:shadow-md text-[#0d253d]'
            }`}
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] transition-colors">
                API Reference
              </h4>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Browse REST API endpoints, request payloads, and code snippets for cURL, Node.js, Python, & PHP.
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
      <div className={`rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 border ${
        isDark 
          ? 'bg-[#0d1326] border-[#273951] text-white' 
          : 'bg-[#0c1024] border-[#273951] text-white'
      }`}>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Quickstart Integration Guide</h3>
          <p className="text-xs text-[#94a3b8] mt-1">Get your backend connected to Zenoa APIs in under 2 minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Get Credentials</h4>
            <p className="text-[#94a3b8] leading-relaxed">
              Navigate to the Credentials tab to reveal your Client ID and API secret key.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Test in Sandbox</h4>
            <p className="text-[#94a3b8] leading-relaxed">
              Send your first test OTP using the cURL snippets or the built-in interactive simulator.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/30 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Switch to Live</h4>
            <p className="text-[#94a3b8] leading-relaxed">
              Toggle to Live Mode from the top navigation bar to activate production message delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
