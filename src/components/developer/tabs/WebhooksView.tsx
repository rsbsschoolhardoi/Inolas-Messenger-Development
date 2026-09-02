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
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ app, showToast, onUpdateApp }) => {
  const [webhookUrl, setWebhookUrl] = useState(app?.webhook_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
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
  const secret = process.env.ZENOA_CLIENT_SECRET || "${signingSecret}";
  
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Webhook className="h-6 w-6 text-indigo-600" />
            Webhooks Manager & Event History
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Receive real-time HTTP POST notifications on your backend whenever OTP or messaging events trigger.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">Endpoint & Signature Security</h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Webhook URL (HTTPS Required in Prod)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://your-api.com/api/v1/zenoa-webhook"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono text-slate-800 transition-all bg-white"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Our server will send a POST request with headers <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">X-Zenoa-Signature</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">X-Zenoa-Event</code>.
              </p>
            </div>

            {/* Signing Secret */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Signing Secret</label>
                <button
                  onClick={() => handleCopy(signingSecret, "Signing Secret")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {copiedKey === "Signing Secret" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy Secret
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-800 flex items-center justify-between">
                  <span>{showSecret ? signingSecret : '••••••••••••••••••••••••••••••••••••••••'}</span>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Used to compute the HMAC-SHA256 signature to verify that webhook calls genuinely come from Zenoa.
              </p>
            </div>

            {/* Subscribed Events */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
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
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-indigo-50/60 border-indigo-300' 
                          : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-mono font-bold text-slate-900">{ev.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{ev.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Signature Verification Guide */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-600" />
                How to Verify Signatures (HMAC-SHA256)
              </h3>
              <button
                onClick={() => handleCopy(signatureVerificationSnippet, "Node.js Webhook Code")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedKey === "Node.js Webhook Code" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy Code
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
              {signatureVerificationSnippet}
            </pre>
          </div>
        </div>

        {/* Right Column: Live Webhook Dispatch Tester */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-600" />
                Live Webhook Tester
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Sandbox Simulator
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Send a test event payload directly to your configured URL to test your server's handler and response code in real time.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Event Type to Test
              </label>
              <select
                value={selectedTestEvent}
                onChange={e => setSelectedTestEvent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="otp.verified">otp.verified (Recipient Verified OTP)</option>
                <option value="otp.sent">otp.sent (OTP Dispatched to DM)</option>
                <option value="message.delivered">message.delivered (Bot Message Delivered)</option>
                <option value="test.ping">test.ping (Standard Heartbeat Ping)</option>
              </select>
            </div>

            {/* Test Payload Preview */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Simulated Payload (JSON)
              </label>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-40">
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
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDispatchingTest ? <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> : <Play className="h-4 w-4" />}
              {isDispatchingTest ? 'Dispatching Webhook...' : 'Send Test Webhook'}
            </button>

            {/* Test Result Inspector */}
            {testResult && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Execution Result:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                    testResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    HTTP {testResult.status_code || (testResult.success ? 200 : 500)}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  <p>Latency: <span className="font-bold text-slate-900">{testResult.latency_ms || 18}ms</span></p>
                  <p>Endpoint: <span className="text-indigo-600 truncate block">{testResult.url || webhookUrl}</span></p>
                </div>

                {testResult.response_data && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Server Response:</span>
                    <pre className="p-2 bg-white rounded border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto max-h-28">
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Recent Webhook Deliveries</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
              {deliveries.length}
            </span>
          </div>

          <button
            onClick={fetchDeliveries}
            disabled={loadingDeliveries}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDeliveries ? 'animate-spin' : ''}`} />
            Refresh Deliveries
          </button>
        </div>

        {deliveries.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Webhook Deliveries Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Whenever an event like an OTP verification happens or when you hit "Send Test Webhook", the dispatch attempt will be logged here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {deliveries.map(d => {
              const isDelivered = d.status === 'delivered' || (Number(d.status_code) >= 200 && Number(d.status_code) < 300);
              const timeFormatted = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${
                      isDelivered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {d.status_code || (isDelivered ? 200 : 500)}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{d.event}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({d.latency_ms || 14}ms)</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate max-w-md mt-0.5">
                        {d.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-mono text-slate-500">{timeFormatted}</span>
                    <button
                      onClick={() => handleRetryDelivery(d.id)}
                      disabled={retryingId === d.id}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className={`h-3 w-3 ${retryingId === d.id ? 'animate-spin text-indigo-600' : ''}`} />
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
