import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Zap, ArrowUpRight, CheckCircle2, ShieldCheck, Download, 
  Sparkles, RefreshCw, Layers, TrendingUp, AlertCircle, Check, DollarSign
} from 'lucide-react';

interface BillingQuotaViewProps {
  app: any;
  showToast: (msg: string) => void;
}

interface BillingSummary {
  app_id: string;
  plan: 'free' | 'growth' | 'enterprise';
  credits_balance: number;
  daily_limit: number;
  daily_usage: number;
  monthly_limit: number;
  monthly_usage: number;
  transactions: Array<{
    id: string;
    date: number;
    description: string;
    amount: string;
    credits: number;
    status: string;
  }>;
}

export const BillingQuotaView: React.FC<BillingQuotaViewProps> = ({ app, showToast }) => {
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Coming Soon Modal for Payment Gateway
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonAction, setComingSoonAction] = useState<string>('Credits Top-Up');

  const appId = app?.client_id || app?.id || 'default_app';
  const apiKey = app?.api_key || app?.client_secret || appId;

  useEffect(() => {
    fetchBillingSummary();
  }, [app]);

  const fetchBillingSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/billing/summary', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (data.billing) {
        setBilling(data.billing);
      }
    } catch (err) {
      console.warn('Fetch billing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerComingSoon = (actionName: string) => {
    setComingSoonAction(actionName);
    setShowComingSoonModal(true);
  };

  const currentPlan = billing?.plan || 'free';
  const creditsBalance = billing?.credits_balance ?? 5000;
  const dailyLimit = billing?.daily_limit ?? 1000;
  const dailyUsage = billing?.daily_usage ?? 128;
  const dailyPercent = Math.min(100, Math.round((dailyUsage / dailyLimit) * 100));

  const monthlyLimit = billing?.monthly_limit ?? 30000;
  const monthlyUsage = billing?.monthly_usage ?? 3840;
  const monthlyPercent = Math.min(100, Math.round((monthlyUsage / monthlyLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-indigo-600" />
            Billing & Usage Quotas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor API rate limits, active plan quotas, and developer credit balances.
          </p>
        </div>

        <button
          onClick={() => handleTriggerComingSoon('Credits Top-Up')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" /> Top Up Credits
        </button>
      </div>

      {/* Gateway Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-2">
              <span>Payment Gateway Integration</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Live automated payments and credit top-ups with real gateways will be enabled soon. Free credits are active for sandbox testing.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleTriggerComingSoon('Payment Gateway')}
          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shrink-0 shadow-2xs"
        >
          Learn More
        </button>
      </div>

      {/* Top Bento Cards: Balance + Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Balance Wallet */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Available Balance</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              {currentPlan.toUpperCase()} TIER
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {creditsBalance.toLocaleString()} <span className="text-lg font-normal text-indigo-300">Credits</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Included developer tier credits
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>Rate: 1 Credit / OTP</span>
            <button
              onClick={() => handleTriggerComingSoon('Add Funds')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Add Funds <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Daily Quota Meter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily API Limit</span>
            <span className="text-xs font-bold text-slate-900">{dailyUsage} / {dailyLimit.toLocaleString()}</span>
          </div>

          <div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyPercent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.max(4, dailyPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>{dailyPercent}% consumed today</span>
              <span>Resets daily at 00:00 UTC</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Soft limit: Extra requests queue automatically.
          </p>
        </div>

        {/* Card 3: Monthly Volume */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Volume</span>
            <span className="text-xs font-bold text-slate-900">{monthlyUsage.toLocaleString()} / {monthlyLimit.toLocaleString()}</span>
          </div>

          <div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(4, monthlyPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>{monthlyPercent}% of monthly limit</span>
              <span>Billing cycle: Monthly</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            High throughput limits available on enterprise plans.
          </p>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Developer Plans</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tier plans will be directly purchasable once the payment gateway goes live.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Plan: Free Developer */}
          <div className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-5 ${
            currentPlan === 'free' ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-md' : 'border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-base">Developer Free</h4>
                {currentPlan === 'free' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold text-slate-900">$0 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Default tier for all developers, testing & prototyping.
              </p>

              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> 1,000 API requests / day</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> 5,000 starter credits</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Community support</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Standard webhooks</li>
              </ul>
            </div>

            <button
              disabled
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 cursor-default"
            >
              Active Free Plan
            </button>
          </div>

          {/* Plan: Growth Pro */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs transition-all flex flex-col justify-between space-y-5 relative">
            <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Coming Soon
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-base">Growth Pro</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Tier 2
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">$49 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
              <p className="text-xs text-slate-500 leading-relaxed">
                For customer applications with elevated rate limits.
              </p>

              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> <strong>50,000</strong> requests / day</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> <strong>25,000</strong> credits / mo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Priority webhook dispatcher</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> 99.9% Uptime SLA</li>
              </ul>
            </div>

            <button
              onClick={() => handleTriggerComingSoon('Growth Pro Plan Upgrade')}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs transition-all"
            >
              Upgrade (Coming Soon)
            </button>
          </div>

          {/* Plan: Enterprise Scale */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs transition-all flex flex-col justify-between space-y-5 relative">
            <div className="absolute -top-3 right-6 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Coming Soon
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-base">Enterprise Scale</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Custom
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">$199 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
              <p className="text-xs text-slate-500 leading-relaxed">
                For high-throughput systems with dedicated support.
              </p>

              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> <strong>1,000,000+</strong> requests / day</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> <strong>100,000</strong> credits / mo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Custom sender ID branding</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Dedicated Account Support</li>
              </ul>
            </div>

            <button
              onClick={() => handleTriggerComingSoon('Enterprise Plan Upgrade')}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs transition-all"
            >
              Contact Sales (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* COMING SOON MODAL */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{comingSoonAction}</h3>
                  <p className="text-xs text-slate-500">Feature Status: In Active Rollout</p>
                </div>
              </div>
              <button 
                onClick={() => setShowComingSoonModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Payment Gateway Integration Coming Soon</span>
              </div>
              <p>
                Real payment gateway integration (Stripe, UPI & Credit Cards) is currently being connected. 
              </p>
              <p>
                During this phase, test API traffic is completely free in <strong>Sandbox Mode</strong> with unlimited test message simulations.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
