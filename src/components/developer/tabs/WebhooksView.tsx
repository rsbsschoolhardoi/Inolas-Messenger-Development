import React, { useState, useEffect } from 'react';
import { 
  Webhook, ShieldCheck, Play, RefreshCw, CheckCircle2, AlertCircle, 
  Copy, Check, Send, Clock, Key, Eye, EyeOff, RotateCcw, HelpCircle,
  ExternalLink, ChevronRight, Terminal
} from 'lucide-react';

interface WebhooksViewProps {
  app: any;
  showToast: (msg: string) => void;
  onUpdateApp: (updates: any) => Promise<void>;
  themeMode?: 'light' | 'dark';
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ 
  app, 
  showToast, 
  onUpdateApp,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [webhookUrl, setWebhookUrl] = useState(app?.webhook_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Subscribed Events
  const [subscribedEvents, setSubscribedEvents] = useState<string[]>(
    Array.isArray(app?.webhook_events) ? app.webhook_events : ['otp.sent', 'otp.verified', 'message.delivered']
  );

  // Webhook Test Dispatcher State
  const [selectedTestEvent, setSelectedTestEvent] = useState<string>('otp.verified');
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Deliveries History
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const apiKey = app?.client_id || app?.api_key || '';
  const signingSecret = app?.client_secret || 'zen_sec_webhook_signing';

  const fetchDeliveries = async () => {
    if (!apiKey) return;
    setLoadingDeliveries(true);
    try {
      const res = await fetch(`/api/v1/webhooks/deliveries`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setDeliveries(data.data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch webhook deliveries:", e);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    setWebhookUrl(app?.webhook_url || '');
    if (Array.isArray(app?.webhook_events)) setSubscribedEvents(app.webhook_events);
    fetchDeliveries();
  }, [app?.id, app?.client_id]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateApp({
        webhook_url: webhookUrl.trim(),
        webhook_events: subscribedEvents
      });
      showToast('Webhook configuration saved successfully!');
    } catch (err: any) {
      showToast('Failed to save webhook settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEventSubscription = (eventName: string) => {
    setSubscribedEvents(prev => 
      prev.includes(eventName) ? prev.filter(e => e !== eventName) : [...prev, eventName]
    );
  };

  const handleSendTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      showToast('Please enter and save a Webhook URL first.');
      return;
    }
    setIsDispatchingTest(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/v1/bot/webhook/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_url: webhookUrl.trim(),
          event: selectedTestEvent,
          sample_data: {
            recipient: app?.owner || 'test_user',
            verified: true,
            timestamp: Date.now()
          }
        })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        showToast(`Webhook delivered with HTTP ${data.status_code || 200} OK!`);
      } else {
        showToast(`Webhook failed (HTTP ${data.status_code || 500})`);
      }
      fetchDeliveries();
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || 'Network error' });
      showToast('Webhook dispatch error: ' + err.message);
    } finally {
      setIsDispatchingTest(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      const res = await fetch(`/api/v1/webhooks/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ delivery_id: deliveryId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Webhook retried successfully (200 OK)');
      } else {
        showToast(`Retry responded with HTTP ${data.status_code || 500}`);
      }
      fetchDeliveries();
    } catch (err: any) {
      showToast('Retry error: ' + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const signatureVerificationSnippet = `// Node.js Express Webhook Signature Verification
const crypto = require('crypto');

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-zenoa-signature'];
  // Securely load webhook secret from backend environment variable
  const secret = process.env.ZENOA_SA_CLIENT_SECRET || process.env.ZENOA_SA_WEBHOOK_SECRET || process.env.ZENOA_CLIENT_SECRET;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body);
  console.log('Received Zenoa event:', payload.event, payload);
  res.status(200).json({ received: true });
});`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#0d253d] dark:text-white">
            <Webhook className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
            Webhooks Manager & Event History
          </h2>
          <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
            Receive real-time HTTP POST notifications on your backend whenever OTP or messaging events trigger.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Main Grid: Endpoint Configuration + Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & Security */}
        <div className="lg:col-span-7 space-y-6">
          {/* Endpoint URL Card */}
          <div className={`rounded-2xl p-6 shadow-xs space-y-5 border ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <h3 className="text-base font-bold text-[#0d253d] dark:text-white">Endpoint & Signature Security</h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                Target Webhook URL (HTTPS Required in Prod)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://your-api.com/api/v1/zenoa-webhook"
                  className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm outline-none transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5">
                Our server will send a POST request with headers <code className="bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] px-1 py-0.5 rounded font-mono font-bold">X-Zenoa-Signature</code> and <code className="bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] px-1 py-0.5 rounded font-mono font-bold">X-Zenoa-Event</code>.
              </p>
            </div>

            {/* Signing Secret */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">Signing Secret</label>
                <button
                  onClick={() => handleCopy(signingSecret, "Signing Secret")}
                  className="text-xs font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "Signing Secret" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === "Signing Secret" ? 'Copied' : 'Copy Secret'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-full rounded-xl px-4 py-2.5 text-xs font-mono select-all flex items-center justify-between tracking-widest border ${
                  isDark ? 'bg-[#121624] border-[#273951] text-[#94a3b8]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-400'
                }`}>
                  <span>zen_sec_••••••••••••••••••••••••••••••••</span>
                  <span className="text-[10px] uppercase font-sans font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded tracking-normal">Protected</span>
                </div>
              </div>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5">
                Used to compute the HMAC-SHA256 signature to verify that webhook calls genuinely come from Zenoa.
              </p>
            </div>

            {/* Subscribed Events */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-3">
                Subscribed Events
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'otp.sent', name: 'otp.sent', desc: 'Fires when an OTP is generated & sent' },
                  { id: 'otp.verified', name: 'otp.verified', desc: 'Fires when a recipient verifies the OTP' },
                  { id: 'message.delivered', name: 'message.delivered', desc: 'Fires when a bot message is delivered' },
                  { id: 'auth.authorized', name: 'auth.authorized', desc: 'Fires when a user logs in via SSO' },
                ].map(ev => {
                  const isChecked = subscribedEvents.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleEventSubscription(ev.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked 
                          ? isDark 
                            ? 'bg-[#533afd]/15 border-[#533afd]' 
                            : 'bg-indigo-50/70 border-indigo-300'
                          : isDark 
                            ? 'bg-[#121624] border-[#273951] opacity-70 hover:opacity-100' 
                            : 'bg-[#f6f9fc] border-[#e3e8ee] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 text-[#533afd] rounded border-slate-300"
                      />
                      <div>
                        <p className="text-xs font-mono font-bold text-[#0d253d] dark:text-white">{ev.name}</p>
                        <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5">{ev.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Signature Verification Guide */}
          <div className={`rounded-2xl shadow-xs overflow-hidden border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-[#273951] bg-[#121624]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]'
            }`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d253d] dark:text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
                How to Verify Signatures (HMAC-SHA256)
              </h3>
              <button
                onClick={() => handleCopy(signatureVerificationSnippet, "Node.js Webhook Code")}
                className="text-xs font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "Node.js Webhook Code" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy Code
              </button>
            </div>
            <pre className="p-4 bg-[#0c1024] text-slate-300 text-xs font-mono overflow-x-auto border-t border-[#273951]">
              {signatureVerificationSnippet}
            </pre>
          </div>
        </div>

        {/* Right Column: Live Webhook Dispatch Tester */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`rounded-2xl p-6 shadow-xs space-y-5 border ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
                <Send className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
                Live Webhook Tester
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">
                Sandbox Simulator
              </span>
            </div>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8]">
              Send a test event payload directly to your configured URL to test your server's handler and response code in real time.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                Event Type to Test
              </label>
              <select
                value={selectedTestEvent}
                onChange={e => setSelectedTestEvent(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                  isDark 
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                    : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                }`}
              >
                <option value="otp.verified">otp.verified (Recipient Verified OTP)</option>
                <option value="otp.sent">otp.sent (OTP Dispatched to DM)</option>
                <option value="message.delivered">message.delivered (Bot Message Delivered)</option>
                <option value="test.ping">test.ping (Standard Heartbeat Ping)</option>
              </select>
            </div>

            {/* Test Payload Preview */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                Simulated Payload (JSON)
              </label>
              <pre className="p-3.5 bg-[#0c1024] text-[#818cf8] rounded-xl text-xs font-mono overflow-x-auto max-h-40 border border-[#273951]">
                {JSON.stringify({
                  event: selectedTestEvent,
                  timestamp: Date.now(),
                  app_id: app?.client_id || 'zen_app_prod',
                  app_name: app?.app_name || 'My Application',
                  data: {
                    recipient: app?.owner || 'john_doe',
                    verified: true,
                    verified_at: Date.now()
                  }
                }, null, 2)}
              </pre>
            </div>

            <button
              onClick={handleSendTestWebhook}
              disabled={isDispatchingTest || !webhookUrl}
              className="w-full py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isDispatchingTest ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <Play className="h-4 w-4" />}
              {isDispatchingTest ? 'Dispatching Webhook...' : 'Send Test Webhook'}
            </button>

            {/* Test Result Inspector */}
            {testResult && (
              <div className={`p-4 rounded-xl border space-y-2 animate-in fade-in-50 ${
                isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0d253d] dark:text-white">Execution Result:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                    testResult.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  }`}>
                    HTTP {testResult.status_code || (testResult.success ? 200 : 500)}
                  </span>
                </div>

                <div className="text-xs text-[#64748d] dark:text-[#94a3b8] space-y-1 font-mono">
                  <p>Latency: <span className="font-bold text-[#0d253d] dark:text-white">{testResult.latency_ms || 18}ms</span></p>
                  <p>Endpoint: <span className="text-[#533afd] dark:text-[#818cf8] truncate block">{testResult.url || webhookUrl}</span></p>
                </div>

                {testResult.response_data && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#64748d] dark:text-[#94a3b8] block mb-1">Server Response:</span>
                    <pre className="p-2 bg-[#0c1024] text-slate-300 rounded border border-[#273951] text-[11px] font-mono overflow-x-auto max-h-28">
                      {typeof testResult.response_data === 'object' ? JSON.stringify(testResult.response_data, null, 2) : String(testResult.response_data)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Delivery History Table */}
      <div className={`rounded-2xl shadow-xs overflow-hidden border ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#273951] bg-[#121624]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]'
        }`}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0d253d] dark:text-white">Recent Webhook Deliveries</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] text-xs font-bold border border-[#533afd]/20">
              {deliveries.length}
            </span>
          </div>

          <button
            onClick={fetchDeliveries}
            disabled={loadingDeliveries}
            className="text-xs text-[#533afd] dark:text-[#818cf8] hover:underline font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDeliveries ? 'animate-spin' : ''}`} />
            Refresh Deliveries
          </button>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook className="h-10 w-10 text-[#64748d] dark:text-[#94a3b8] mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-bold text-[#0d253d] dark:text-white">No Webhook Deliveries Yet</h4>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1 max-w-sm mx-auto">
              Whenever an event like an OTP verification happens or when you hit "Send Test Webhook", the dispatch attempt will be logged here.
            </p>
          </div>
        ) : (
          <div className={`divide-y max-h-96 overflow-y-auto ${
            isDark ? 'divide-[#273951]' : 'divide-[#e3e8ee]'
          }`}>
            {deliveries.map(d => {
              const isDelivered = d.status === 'delivered' || (Number(d.status_code) >= 200 && Number(d.status_code) < 300);
              const timeFormatted = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={d.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isDark ? 'hover:bg-[#121624]' : 'hover:bg-[#f6f9fc]'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${
                      isDelivered ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                    }`}>
                      {d.status_code || (isDelivered ? 200 : 500)}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0d253d] dark:text-white">{d.event}</span>
                        <span className="text-[11px] text-[#64748d] dark:text-[#94a3b8] font-mono">({d.latency_ms || 14}ms)</span>
                      </div>
                      <p className="text-xs text-[#64748d] dark:text-[#94a3b8] font-mono truncate max-w-md mt-0.5">
                        {d.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-mono text-[#64748d] dark:text-[#94a3b8]">{timeFormatted}</span>
                    <button
                      onClick={() => handleRetryDelivery(d.id)}
                      disabled={retryingId === d.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer ${
                        isDark 
                          ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' 
                          : 'bg-white border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc]'
                      }`}
                    >
                      <RotateCcw className={`h-3 w-3 ${retryingId === d.id ? 'animate-spin text-[#533afd] dark:text-[#818cf8]' : ''}`} />
                      {retryingId === d.id ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
