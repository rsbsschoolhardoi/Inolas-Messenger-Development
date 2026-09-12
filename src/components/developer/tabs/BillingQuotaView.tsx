import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Zap, ArrowUpRight, CheckCircle2, ShieldCheck, Download, 
  Sparkles, RefreshCw, Layers, TrendingUp, AlertCircle, Check, DollarSign
} from 'lucide-react';

interface BillingQuotaViewProps {
  app: any;
  showToast: (msg: string) => void;
  themeMode?: 'light' | 'dark';
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

export const BillingQuotaView: React.FC<BillingQuotaViewProps> = ({ 
  app, 
  showToast,
  themeMode = 'light' 
}) => {
  const isDark = themeMode === 'dark';
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
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#0d253d] dark:text-white">
            <CreditCard className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
            Billing & Usage Quotas
          </h2>
          <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
            Monitor API rate limits, active plan quotas, and developer credit balances.
          </p>
        </div>

        <button
          onClick={() => handleTriggerComingSoon('Credits Top-Up')}
          className="px-5 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Sparkles className="h-4 w-4" /> Top Up Credits
        </button>
      </div>

      {/* Gateway Notice Banner */}
      <div className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
        isDark 
          ? 'bg-[#121624] border-[#273951] text-white' 
          : 'bg-[#533afd]/5 border-[#533afd]/20 text-[#0d253d]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#533afd] text-white flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <span>Payment Gateway Integration</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5">
              Live automated payments and credit top-ups with real gateways will be enabled soon. Free credits are active for sandbox testing.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleTriggerComingSoon('Payment Gateway')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 border transition-colors cursor-pointer ${
            isDark 
              ? 'bg-[#1c1e54] border-[#273951] text-[#818cf8] hover:bg-[#533afd]/20' 
              : 'bg-white border-[#e3e8ee] text-[#533afd] hover:bg-[#f6f9fc]'
          }`}
        >
          Learn More
        </button>
      </div>

      {/* Top Bento Cards: Balance + Quotas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Balance Wallet */}
        <div className="bg-[#0c1024] text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 border border-[#273951]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#818cf8]">Available Balance</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#533afd]/20 text-[#818cf8] border border-[#533afd]/40">
              {currentPlan.toUpperCase()} TIER
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {creditsBalance.toLocaleString()} <span className="text-lg font-normal text-[#818cf8]">Credits</span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Included developer tier credits
            </p>
          </div>

          <div className="pt-2 border-t border-[#273951] flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Rate: 1 Credit / OTP</span>
            <button
              onClick={() => handleTriggerComingSoon('Add Funds')}
              className="text-xs font-bold text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Add Funds <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Daily Quota Meter */}
        <div className={`rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">Daily API Limit</span>
            <span className="text-xs font-bold text-[#0d253d] dark:text-white">{dailyUsage} / {dailyLimit.toLocaleString()}</span>
          </div>

          <div>
            <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? 'bg-[#121624]' : 'bg-slate-100'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyPercent > 80 ? 'bg-amber-500' : 'bg-[#533afd]'
                }`}
                style={{ width: `${Math.max(4, dailyPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#64748d] dark:text-[#94a3b8] mt-2">
              <span>{dailyPercent}% consumed today</span>
              <span>Resets daily at 00:00 UTC</span>
            </div>
          </div>

          <p className={`text-[11px] text-[#64748d] dark:text-[#94a3b8] border-t pt-2 ${
            isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
          }`}>
            Soft limit: Extra requests queue automatically.
          </p>
        </div>

        {/* Card 3: Monthly Volume */}
        <div className={`rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">Monthly Volume</span>
            <span className="text-xs font-bold text-[#0d253d] dark:text-white">{monthlyUsage.toLocaleString()} / {monthlyLimit.toLocaleString()}</span>
          </div>

          <div>
            <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? 'bg-[#121624]' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(4, monthlyPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#64748d] dark:text-[#94a3b8] mt-2">
              <span>{monthlyPercent}% of monthly limit</span>
              <span>Billing cycle: Monthly</span>
            </div>
          </div>

          <p className={`text-[11px] text-[#64748d] dark:text-[#94a3b8] border-t pt-2 ${
            isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
          }`}>
            High throughput limits available on enterprise plans.
          </p>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#0d253d] dark:text-white">Developer Plans</h3>
          <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">Tier plans will be directly purchasable once the payment gateway goes live.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Plan: Free Developer */}
          <div className={`rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-5 ${
            isDark 
              ? 'bg-[#0d1326] border-[#533afd] ring-2 ring-[#533afd]/20 shadow-lg text-white' 
              : 'bg-white border-[#533afd] ring-2 ring-[#533afd]/10 shadow-md text-[#0d253d]'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base">Developer Free</h4>
                {currentPlan === 'free' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] border border-[#533afd]/20">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-extrabold">$0 <span className="text-xs text-[#64748d] dark:text-[#94a3b8] font-normal">/ month</span></div>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                Default tier for all developers, testing & prototyping.
              </p>

              <ul className={`space-y-2 text-xs pt-3 border-t ${
                isDark ? 'border-[#273951] text-slate-300' : 'border-[#e3e8ee] text-slate-700'
              }`}>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> 1,000 API requests / day</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> 5,000 starter credits</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> Community support</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> Standard webhooks</li>
              </ul>
            </div>

            <button
              disabled
              className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-default ${
                isDark ? 'bg-[#121624] text-[#64748d]' : 'bg-[#f6f9fc] text-[#64748d]'
              }`}
            >
              Active Free Plan
            </button>
          </div>

          {/* Plan: Growth Pro */}
          <div className={`rounded-2xl p-6 border shadow-xs transition-all flex flex-col justify-between space-y-5 relative ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className="absolute -top-3 right-6 bg-[#533afd] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Coming Soon
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base">Growth Pro</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDark ? 'bg-[#121624] text-[#94a3b8]' : 'bg-slate-100 text-slate-600'
                }`}>
                  Tier 2
                </span>
              </div>
              <div className="text-3xl font-extrabold">$49 <span className="text-xs text-[#64748d] dark:text-[#94a3b8] font-normal">/ month</span></div>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                For customer applications with elevated rate limits.
              </p>

              <ul className={`space-y-2 text-xs pt-3 border-t ${
                isDark ? 'border-[#273951] text-slate-300' : 'border-[#e3e8ee] text-slate-700'
              }`}>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> <strong>50,000</strong> requests / day</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> <strong>25,000</strong> credits / mo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Priority webhook dispatcher</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> 99.9% Uptime SLA</li>
              </ul>
            </div>

            <button
              onClick={() => handleTriggerComingSoon('Growth Pro Plan Upgrade')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#121624] hover:bg-[#1c1e54] text-white border-[#273951]' 
                  : 'bg-white border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#0d253d]'
              }`}
            >
              Upgrade (Coming Soon)
            </button>
          </div>

          {/* Plan: Enterprise Scale */}
          <div className={`rounded-2xl p-6 border shadow-xs transition-all flex flex-col justify-between space-y-5 relative ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className="absolute -top-3 right-6 bg-[#0c1024] border border-[#273951] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Coming Soon
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base">Enterprise Scale</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDark ? 'bg-[#121624] text-[#94a3b8]' : 'bg-slate-100 text-slate-600'
                }`}>
                  Custom
                </span>
              </div>
              <div className="text-3xl font-extrabold">$199 <span className="text-xs text-[#64748d] dark:text-[#94a3b8] font-normal">/ month</span></div>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
                For high-throughput systems with dedicated support.
              </p>

              <ul className={`space-y-2 text-xs pt-3 border-t ${
                isDark ? 'border-[#273951] text-slate-300' : 'border-[#e3e8ee] text-slate-700'
              }`}>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> <strong>1,000,000+</strong> requests / day</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> <strong>100,000</strong> credits / mo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> Custom sender ID branding</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> Dedicated Account Support</li>
              </ul>
            </div>

            <button
              onClick={() => handleTriggerComingSoon('Enterprise Plan Upgrade')}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#121624] hover:bg-[#1c1e54] text-white border-[#273951]' 
                  : 'bg-white border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#0d253d]'
              }`}
            >
              Contact Sales (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* COMING SOON MODAL */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{comingSoonAction}</h3>
                  <p className="text-xs text-[#64748d] dark:text-[#94a3b8]">Feature Status: In Active Rollout</p>
                </div>
              </div>
              <button 
                onClick={() => setShowComingSoonModal(false)} 
                className="text-[#64748d] hover:text-[#0d253d] dark:hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 text-xs leading-relaxed ${
              isDark ? 'bg-[#121624] border-[#273951] text-[#94a3b8]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#64748d]'
            }`}>
              <div className="font-bold text-sm text-[#0d253d] dark:text-white">
                Payment Gateway Integration Coming Soon
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
                className="w-full py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
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
