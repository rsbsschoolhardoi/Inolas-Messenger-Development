import React, { useState } from 'react';
import { 
  Zap, Send, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, 
  ArrowRight, ShieldCheck, Play, Sparkles, MessageSquare, Terminal
} from 'lucide-react';

interface OtpSimulatorViewProps {
  app: any;
  currentUser: any;
  showToast: (msg: string) => void;
  themeMode?: 'light' | 'dark';
}

export const OtpSimulatorView: React.FC<OtpSimulatorViewProps> = ({ 
  app, 
  currentUser, 
  showToast,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [recipient, setRecipient] = useState(currentUser?.mobile_number || currentUser?.username || '');
  const [templateType, setTemplateType] = useState('standard_otp');
  const [expiryMins, setExpiryMins] = useState(10);
  const [customCode, setCustomCode] = useState('');
  
  // Step-by-step state
  const [isSending, setIsSending] = useState(false);
  const [activeOtpResponse, setActiveOtpResponse] = useState<any | null>(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyOutcome, setVerifyOutcome] = useState<any | null>(null);

  // 1-Click Auto Pipeline State
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [autoPipelineTimeline, setAutoPipelineTimeline] = useState<any[] | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isSandbox = app?.environment === 'test' || !app?.is_live;
  const clientId = isSandbox ? (app?.test_client_id || app?.client_id || '') : (app?.client_id || app?.test_client_id || '');
  const clientSecret = isSandbox ? (app?.test_client_secret || app?.client_secret || '') : (app?.client_secret || app?.test_client_secret || '');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Send OTP (Step 1)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      showToast('Please enter a recipient username or phone number.');
      return;
    }

    setIsSending(true);
    setActiveOtpResponse(null);
    setVerifyOutcome(null);
    setAutoPipelineTimeline(null);

    try {
      const res = await fetch(`/api/v1/otp/send`, {
        method: 'POST',
        headers: {
          'X-Client-Id': clientId,
          'X-Client-Secret': clientSecret,
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          recipient: recipient.trim(),
          template_type: templateType,
          expiry_mins: expiryMins,
          custom_code: customCode.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveOtpResponse(data);
        showToast('OTP dispatched successfully to recipient DM!');
      } else {
        showToast(`Send Error: ${data.error || 'Failed to dispatch OTP'}`);
      }
    } catch (err: any) {
      showToast('Dispatch error: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 2. Verify OTP (Step 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) {
      showToast('Please enter the 6-digit code to verify.');
      return;
    }

    setIsVerifying(true);
    setVerifyOutcome(null);

    try {
      const res = await fetch(`/api/v1/otp/verify`, {
        method: 'POST',
        headers: {
          'X-Client-Id': clientId,
          'X-Client-Secret': clientSecret,
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          recipient: recipient.trim(),
          code: verifyCodeInput.trim()
        })
      });

      const data = await res.json();
      setVerifyOutcome(data);
      if (res.ok && data.verified) {
        showToast('OTP verified successfully!');
      } else {
        showToast(data.error || 'Verification code invalid.');
      }
    } catch (err: any) {
      showToast('Verification error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // 3. 1-Click Automated Pipeline
  const handleRunAutoPipeline = async () => {
    if (!recipient.trim()) {
      showToast('Please enter a target recipient username or mobile number.');
      return;
    }

    setIsAutoSimulating(true);
    setAutoPipelineTimeline(null);
    setActiveOtpResponse(null);
    setVerifyOutcome(null);

    try {
      const res = await fetch(`/api/v1/otp/auto-simulate`, {
        method: 'POST',
        headers: {
          'X-Client-Id': clientId,
          'X-Client-Secret': clientSecret,
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          recipient: recipient.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAutoPipelineTimeline(data.timeline || []);
        showToast('Automated verification pipeline completed successfully!');
      } else {
        showToast(`Simulation Error: ${data.error || 'Failed to simulate pipeline'}`);
      }
    } catch (err: any) {
      showToast('Simulation error: ' + err.message);
    } finally {
      setIsAutoSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#0d253d] dark:text-white">
            <Zap className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
            Interactive OTP Simulator & Sandbox
          </h2>
          <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
            Test real-time OTP dispatch, in-app DM delivery, auto-verification, and webhook triggers.
          </p>
        </div>

        <button
          onClick={handleRunAutoPipeline}
          disabled={isAutoSimulating}
          className="px-5 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isAutoSimulating ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
          {isAutoSimulating ? 'Simulating Pipeline...' : '1-Click Auto Pipeline'}
        </button>
      </div>

      {/* Main Form & Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Dispatch Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`rounded-2xl p-6 shadow-xs space-y-5 border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
                <span className="h-6 w-6 rounded-full bg-[#533afd]/15 text-[#533afd] dark:text-[#818cf8] text-xs font-bold flex items-center justify-center border border-[#533afd]/30">
                  1
                </span>
                Send One-Time Passcode
              </h3>
              <span className="text-xs font-mono font-medium text-[#64748d] dark:text-[#94a3b8]">POST /api/v1/otp/send</span>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#64748d] dark:text-[#94a3b8]">
                  Recipient (Zenoa @username or Mobile Number with country code)
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="@john_doe or +919876543210"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#64748d] dark:text-[#94a3b8]">
                    Template Format
                  </label>
                  <select
                    value={templateType}
                    onChange={e => setTemplateType(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
                    }`}
                  >
                    <option value="standard_otp">Standard OTP Verification</option>
                    <option value="2fa_auth">Two-Factor Auth (2FA)</option>
                    <option value="password_reset">Password Reset Code</option>
                    <option value="transaction_auth">Transaction Authorization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#64748d] dark:text-[#94a3b8]">
                    Validity (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={expiryMins}
                    onChange={e => setExpiryMins(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#64748d] dark:text-[#94a3b8]">
                  Custom Code (Optional - Leave blank for random 6 digits)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  placeholder="e.g. 584920"
                  className={`w-full px-4 py-2 rounded-xl border font-mono text-sm outline-none ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSending ? 'Dispatching OTP...' : 'Dispatch OTP to Recipient Inbox'}
              </button>
            </form>
          </div>

          {/* Step 2: Verification Form */}
          <div className={`rounded-2xl p-6 shadow-xs space-y-5 border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
                <span className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                  2
                </span>
                Verify Passcode
              </h3>
              <span className="text-xs font-mono font-medium text-[#64748d] dark:text-[#94a3b8]">POST /api/v1/otp/verify</span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#64748d] dark:text-[#94a3b8]">
                  6-Digit Passcode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    value={verifyCodeInput}
                    onChange={e => setVerifyCodeInput(e.target.value)}
                    placeholder="Enter received code"
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none text-base font-mono font-bold text-center tracking-widest ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-emerald-500' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Verify Code
                  </button>
                </div>
              </div>
            </form>

            {/* Verification Result Feedback */}
            {verifyOutcome && (
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                verifyOutcome.verified 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {verifyOutcome.verified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-rose-500" />}
                  <span>{verifyOutcome.verified ? 'Verification Succeeded (200 OK)' : 'Verification Failed'}</span>
                </div>
                <pre className={`p-2.5 rounded border text-[11px] overflow-x-auto ${
                  isDark ? 'bg-[#0c1024] border-[#273951] text-slate-200' : 'bg-white border-[#e3e8ee] text-slate-800'
                }`}>
                  {JSON.stringify(verifyOutcome, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Status & Simulation Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active OTP Payload Inspector */}
          {activeOtpResponse && (
            <div className={`rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in-50 border ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#64748d] dark:text-[#94a3b8]">Active OTP Dispatched</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">
                  Delivered to DM
                </span>
              </div>

              <div className={`p-3 border rounded-xl space-y-2 text-xs font-mono ${
                isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
              }`}>
                <p><span className="text-slate-400">Recipient:</span> <span className="font-bold text-[#0d253d] dark:text-white">@{activeOtpResponse.recipient}</span></p>
                <p><span className="text-slate-400">Chat ID:</span> <span className="text-[#533afd] dark:text-[#818cf8] font-semibold">{activeOtpResponse.chat_id}</span></p>
                <p><span className="text-slate-400">Expires in:</span> {activeOtpResponse.expiry_mins} minutes</p>
              </div>

              <pre className="p-3 bg-[#0c1024] text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto border border-[#273951]">
                {JSON.stringify(activeOtpResponse, null, 2)}
              </pre>
            </div>
          )}

          {/* 1-Click Auto Pipeline Timeline */}
          {autoPipelineTimeline && (
            <div className={`rounded-2xl p-5 shadow-xs space-y-4 animate-in slide-in-from-top-4 border ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
              }`}>
                <h4 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
                  <Sparkles className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
                  Auto-Simulation Execution
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] border border-emerald-500/30">
                  Completed
                </span>
              </div>

              <div className="space-y-3">
                {autoPipelineTimeline.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold capitalize font-mono text-[11px] text-[#0d253d] dark:text-white">
                        {step.action.replace(/_/g, ' ')}
                      </p>
                      {step.code && <p className="text-slate-400 font-mono">Passcode: <span className="font-bold text-[#0d253d] dark:text-white">{step.code}</span></p>}
                      {step.message_preview && <p className="text-slate-400 truncate">{step.message_preview}</p>}
                      {step.result && <p className="text-slate-400 font-mono">Webhook status: HTTP {step.result.status || 200}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Tip Box */}
          <div className={`border rounded-2xl p-5 text-xs space-y-2 ${
            isDark ? 'bg-[#533afd]/10 border-[#533afd]/30 text-slate-200' : 'bg-indigo-50/70 border-indigo-100 text-indigo-950'
          }`}>
            <h4 className="font-bold flex items-center gap-1.5 text-[#533afd] dark:text-[#818cf8]">
              <MessageSquare className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              Direct Service Account Delivery
            </h4>
            <p className="leading-relaxed">
              When an OTP is requested, Zenoa delivers it directly inside the target user's Zenoa chat box under your Service Account name <code className="font-mono font-bold bg-[#533afd]/20 px-1 py-0.5 rounded">@{app?.bot_username || app?.owner}</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
