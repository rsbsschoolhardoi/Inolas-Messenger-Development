import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Key, Sun, Moon, ArrowLeft, Terminal, Lock, Code2, Webhook, Cpu } from 'lucide-react';
import { UserData } from '../../../types';
import { useBranding } from '../../../brandingUtils';
import { BrandLogo } from '../../common/BrandLogo';
import { WaveArcs } from '../../originkit/ui/wave-arcs';

interface LandingViewProps {
  user: UserData | null;
  onOpenConsole: () => void;
  onShowAuth: () => void;
  onSwitchAccount: () => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ 
  user, 
  onOpenConsole, 
  onShowAuth, 
  onSwitchAccount,
  themeMode = 'light',
  onToggleTheme
}) => {
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo;
  const isDark = themeMode === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors relative overflow-hidden ${
      isDark ? 'dark bg-[#0c1024] text-white selection:bg-[#533afd] selection:text-white' : 'bg-[#f6f9fc] text-[#0d253d] selection:bg-[#533afd]/20 selection:text-[#533afd]'
    }`}>
      {/* Background Interactive Wave Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15 -z-10">
        <WaveArcs
          backgroundColor="transparent"
          lineColor={isDark ? 'rgb(129, 140, 248)' : 'rgb(83, 58, 253)'}
          lineWidth={1.2}
          lineCount={64}
          speed={4.5}
          glow={12}
          interactive={false}
        />
      </div>

      {/* Top Navigation */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
        isDark ? 'border-[#273951]/80 bg-[#0c1024]/90' : 'border-[#e3e8ee]/90 bg-white/90 shadow-[0_1px_3px_rgba(0,55,112,0.04)]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo
              src={activeLogo}
              name={branding.app_name || 'Zenoa'}
              size="sm"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#0d253d] dark:text-white">
                {branding.app_name || 'Zenoa'}
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 px-2.5 py-0.5 rounded-full font-bold tracking-wider border border-[#533afd]/20">
                Developer Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                id="dev_landing_theme_toggle"
                onClick={onToggleTheme}
                className="p-2 rounded-full border border-[#e3e8ee] dark:border-[#273951] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#273951] dark:text-[#cbd5e1] transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#273951]" />}
              </button>
            )}

            <a 
              href="/" 
              className="text-xs font-semibold text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white transition-colors hidden sm:flex items-center gap-1.5 px-2 py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Messenger</span>
            </a>

            <a 
              href="/docs" 
              className="text-xs font-semibold text-[#64748d] dark:text-[#94a3b8] hover:text-[#533afd] dark:hover:text-white transition-colors hidden sm:inline-block px-2 py-1"
            >
              API Docs
            </a>

            {user ? (
              <button 
                onClick={onOpenConsole} 
                className="rounded-full px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[13px] font-medium transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button 
                onClick={onShowAuth} 
                className="rounded-full px-4 py-2 bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[13px] font-medium transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Viewport */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 md:py-24 px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#1c1e54]/95 border border-[#e3e8ee] dark:border-[#273951] text-[#273951] dark:text-[#cbd5e1] text-[13px] shadow-[0_1px_3px_rgba(0,55,112,0.06)] mx-auto flex-wrap">
            <span className="h-2 w-2 rounded-full bg-[#533afd] animate-pulse" />
            <span className="font-semibold text-[#0d253d] dark:text-white">Inolas Nexus</span>
            <span className="text-[#a8c3de] dark:text-[#64748d]">•</span>
            <span className="text-[#533afd] dark:text-[#b9b9f9] font-medium">Developer Platform</span>
            <span className="text-[#a8c3de] dark:text-[#64748d]">•</span>
            <span className="font-tabular text-[#273951] dark:text-[#cbd5e1] text-[12px]">Service Accounts & Real-Time APIs</span>
          </div>

          <h1 className="text-[34px] sm:text-[46px] lg:text-[54px] font-bold tracking-tight text-[#0d253d] dark:text-white leading-[1.18] sm:leading-[1.14]">
            Build communication APIs
            <span className="block mt-2 text-[#533afd] dark:text-[#818cf8]">
              that scale with sovereign privacy.
            </span>
          </h1>

          <p className="text-[16px] sm:text-[18px] font-normal text-[#273951] dark:text-[#cbd5e1] max-w-2xl mx-auto leading-[1.6]">
            Create verified Service Accounts, manage production API credentials, stream bot interactions via Webhooks, and dispatch automated OTPs with 0ms cloud retention.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <>
                <button 
                  onClick={onOpenConsole} 
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[14px] font-medium transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Open Console (@{user.username})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a 
                  href="/docs" 
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-white dark:bg-[#121624] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#0d253d] dark:text-white border border-[#e3e8ee] dark:border-[#273951] text-[14px] font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  API Reference
                </a>
                <button 
                  onClick={onSwitchAccount} 
                  className="w-full sm:w-auto px-4 py-3 rounded-full text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Switch Account
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onShowAuth} 
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[14px] font-medium transition-all shadow-[0_1px_3px_rgba(0,55,112,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a 
                  href="/docs" 
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-white dark:bg-[#121624] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] text-[#0d253d] dark:text-white border border-[#e3e8ee] dark:border-[#273951] text-[14px] font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  Explore API Docs
                </a>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards in Landing Page Design Language */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left">
          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121624]/90 border-[#273951] text-white' : 'bg-white border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] text-[#0d253d]'
          }`}>
            <div className="h-11 w-11 rounded-xl bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 flex items-center justify-center mb-4 border border-[#533afd]/20">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-1.5">Real-Time Webhooks</h3>
            <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
              Stream incoming bot interactions, message deliveries, and authentication events directly to your backend servers with HMAC signatures.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121624]/90 border-[#273951] text-white' : 'bg-white border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] text-[#0d253d]'
          }`}>
            <div className="h-11 w-11 rounded-xl bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 flex items-center justify-center mb-4 border border-[#533afd]/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-1.5">Direct OTP Dispatch</h3>
            <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
              Deliver verified 6-digit authentication codes instantly to global users with zero SMS latency and end-to-end device delivery.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121624]/90 border-[#273951] text-white' : 'bg-white border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] text-[#0d253d]'
          }`}>
            <div className="h-11 w-11 rounded-xl bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 flex items-center justify-center mb-4 border border-[#533afd]/20">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold mb-1.5">Verified Service Accounts</h3>
            <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
              Provision certified bot accounts with Purple Verified trust badges, API key rotation, granular scope permissions, and rate-limiting safeguards.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 px-4 sm:px-6 text-center text-xs text-[#64748d] dark:text-[#94a3b8] ${
        isDark ? 'border-[#273951]/80 bg-[#0c1024]' : 'border-[#e3e8ee] bg-white'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {branding.app_name || 'Zenoa'} &bull; Inolas Nexus. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[12px]">
            <a href="/legal/terms" className="hover:text-[#533afd] transition-colors">Terms of Service</a>
            <a href="/legal/privacy" className="hover:text-[#533afd] transition-colors">Privacy Policy</a>
            <a href="/docs" className="hover:text-[#533afd] transition-colors">Developer Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
