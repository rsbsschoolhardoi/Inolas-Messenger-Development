import React from 'react';
import { 
  Activity, Key, Zap, FileText, Webhook, ShieldCheck, ArrowRight, 
  Layers, CheckCircle2, Lock, Radio, Server, ExternalLink, Users
} from 'lucide-react';
import { TabType } from '../views/PortalDashboard';

interface OverviewViewProps {
  app: any;
  environment: 'test' | 'live';
  onNavigate: (tab: TabType) => void;
  showToast: (msg: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  app,
  environment,
  onNavigate,
  showToast
}) => {
  const isSandbox = environment === 'test';

  return (
    <div className="space-y-8">
      {/* App Header & Status Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
              <Server className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {app.app_name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isSandbox 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isSandbox ? 'Sandbox Mode' : 'Production Live'}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-500 mt-1 flex items-center gap-2">
                <span>@{app.bot_username || app.owner}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">Created: {new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('apps')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
            >
              <Key className="h-4 w-4" /> View API Credentials
            </button>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Activity className="h-4 w-4 text-emerald-500" /> API Gateway
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">Operational</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">99.9% SLA Online</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Radio className="h-4 w-4 text-indigo-500" /> Active Channel
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{isSandbox ? 'Test Sandbox' : 'Live Gateway'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{isSandbox ? 'Free simulated traffic' : 'Real customer delivery'}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Zap className="h-4 w-4 text-amber-500" /> Daily API Limit
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">1,000 reqs/day</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Free Developer Tier</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Lock className="h-4 w-4 text-slate-500" /> Credentials Security
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">Protected</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Hidden by default</div>
          </div>
        </div>
      </div>

      {/* Primary Action Hub (Cards) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Developer Modules & Tools</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: API Keys */}
          <div 
            onClick={() => onNavigate('apps')}
            className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Key className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                API Credentials
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Access your Client ID, secret keys, and SDK installation snippets securely.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Manage Keys</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: OTP Testing */}
          <div 
            onClick={() => onNavigate('otp')}
            className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                OTP Simulator
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Interactively test passcode dispatch, live verification, and delivery latency in real-time.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Launch Simulator</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: API Docs */}
          <div 
            onClick={() => onNavigate('docs')}
            className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                API Reference
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Browse REST API endpoints, request payloads, and code snippets for cURL, Node.js, Python, & PHP.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Read Documentation</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Quickstart in 3 Steps */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Quickstart Integration Guide</h3>
          <p className="text-xs text-slate-400 mt-1">Get your backend connected to Zenoa APIs in under 2 minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Get Credentials</h4>
            <p className="text-slate-400 leading-relaxed">
              Navigate to the Credentials tab to reveal your Client ID and API secret key.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Test in Sandbox</h4>
            <p className="text-slate-400 leading-relaxed">
              Send your first test OTP using the cURL snippets or the built-in interactive simulator.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Switch to Live</h4>
            <p className="text-slate-400 leading-relaxed">
              Toggle to Live Mode from the top navigation bar to activate production message delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
