import React from 'react';
import { ArrowRight, Terminal, Lock, ShieldCheck, Zap, Key, ArrowLeft } from 'lucide-react';
import { UserData } from '../../../types';
import { useBranding } from '../../../brandingUtils';

interface LandingViewProps {
  user: UserData | null;
  onOpenConsole: () => void;
  onShowAuth: () => void;
  onSwitchAccount: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ user, onOpenConsole, onShowAuth, onSwitchAccount }) => {
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-indigo-600 overflow-hidden">
              {activeLogo ? <img src={activeLogo} alt="Logo" className="h-full w-full object-contain" /> : <Terminal className="h-4 w-4" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight">{branding.app_name || 'Zenoa'}</span>
              <span className="text-[10px] uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold tracking-wider">Developers</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/docs" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
              Documentation
            </a>
            {user ? (
              <button onClick={onOpenConsole} className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-1.5">
                Go to Console <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={onShowAuth} className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-1.5">
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center py-20 px-6">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <ShieldCheck className="h-4 w-4" /> Secure Developer Ecosystem
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            Build communication APIs that scale.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create verified Service Accounts, manage production API tokens, and dispatch automated OTPs and webhooks globally.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <>
                <button onClick={onOpenConsole} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
                  Console for @{user.username} <ArrowRight className="h-4 w-4" />
                </button>
                <a href="/docs" className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  API Documentation
                </a>
                <button onClick={onSwitchAccount} className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold border border-slate-200 transition-colors">
                  Switch Account
                </button>
              </>
            ) : (
              <>
                <button onClick={onShowAuth} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </button>
                <a href="/docs" className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  Explore API Docs
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-left">
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-Time Webhooks</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Stream incoming bot interactions, message deliveries, and OAuth login events directly to your servers.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-left">
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Direct OTP Dispatch</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Deliver verified 6-digit authentication codes instantly with zero SMS latency and end-to-end encryption.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-left">
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
              <Key className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure API Keys</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Rotate credentials securely, restrict IP addresses, and integrate safely using HMAC signed tokens.</p>
          </div>
        </div>
      </main>
    </div>
  );
};
