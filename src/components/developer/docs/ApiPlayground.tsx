import React, { useState } from 'react';
import { 
  Terminal, Play, Send, RefreshCw, Check, Copy, AlertCircle, 
  ArrowRight, Shield, Zap, Sparkles, Layers, ChevronDown, CheckCircle2
} from 'lucide-react';
import { DocEndpoint } from './docsData';

interface ApiPlaygroundProps {
  endpoint: DocEndpoint;
  app: any;
  showToast: (msg: string) => void;
  onClose?: () => void;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ endpoint, app, showToast, onClose }) => {
  const [params, setParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    endpoint.params.forEach(p => {
      if (p.name === 'recipient') initial[p.name] = '+919876543210';
      else if (p.name === 'code') initial[p.name] = '584920';
      else if (p.name === 'message') initial[p.name] = 'Hello from Zenoa interactive docs runner!';
      else if (p.name === 'template_type') initial[p.name] = 'standard_otp';
      else if (p.name === 'expiry_mins') initial[p.name] = '10';
      else if (p.default) initial[p.name] = p.default;
      else initial[p.name] = '';
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const apiKey = app?.active_client_id || app?.client_id || 'zen_test_app_sample_key';
  const baseUrl = window.location.origin;

  const handleParamChange = (name: string, value: string) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleExecute = async () => {
    if (endpoint.method === 'GUIDE') return;
    setLoading(true);
    setResponse(null);
    setStatusCode(null);
    setLatency(null);

    const startTime = Date.now();
    try {
      let targetUrl = `${baseUrl}${endpoint.path}`;
      let fetchOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      };

      if (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') {
        const bodyObj: Record<string, any> = {};
        endpoint.params.forEach(p => {
          const val = params[p.name];
          if (val !== undefined && val !== '') {
            if (p.type === 'number') bodyObj[p.name] = Number(val);
            else if (p.type === 'boolean') bodyObj[p.name] = val === 'true';
            else bodyObj[p.name] = val;
          }
        });
        fetchOptions.body = JSON.stringify(bodyObj);
      } else if (endpoint.method === 'GET') {
        const qParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v) qParams.append(k, v);
        });
        const qs = qParams.toString();
        if (qs) targetUrl += `?${qs}`;
      }

      const res = await fetch(targetUrl, fetchOptions);
      const elapsed = Date.now() - startTime;
      const json = await res.json().catch(() => ({ message: 'Non-JSON response received' }));

      setStatusCode(res.status);
      setLatency(elapsed);
      setResponse(json);

      if (res.ok) {
        showToast(`Request completed in ${elapsed}ms (HTTP ${res.status})`);
      } else {
        showToast(`API returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setStatusCode(500);
      setLatency(Date.now() - startTime);
      setResponse({ error: 'NETWORK_ERROR', message: err?.message || 'Failed to connect to local server' });
      showToast('Network error during execution');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-2xl space-y-0">
      {/* Playground Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>Interactive Request Runner</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 font-semibold">
                LIVE SANDBOX
              </span>
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                endpoint.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {endpoint.method}
              </span>
              <span className="text-[11px] font-mono text-slate-400">{endpoint.path}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleExecute}
          disabled={loading || endpoint.method === 'GUIDE'}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          <span>{loading ? 'Executing...' : 'Run Request'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Left Side: Parameters Input */}
        <div className="md:col-span-6 p-5 space-y-4 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Request Parameters
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Key: {apiKey.substring(0, 14)}...
            </span>
          </div>

          {endpoint.params.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No parameters required for this endpoint. Click "Run Request" to execute directly.
            </div>
          ) : (
            <div className="space-y-3">
              {endpoint.params.map(p => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-mono font-bold text-slate-300">
                      {p.name}
                      {p.required && <span className="text-rose-400 ml-1">*</span>}
                    </label>
                    <span className="text-[10px] text-slate-500">{p.type}</span>
                  </div>
                  <input
                    type="text"
                    value={params[p.name] || ''}
                    onChange={e => handleParamChange(p.name, e.target.value)}
                    placeholder={p.desc}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Quick Info Box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Zap className="h-3 w-3" />
              <span>Sandbox Simulation Active</span>
            </div>
            <p className="leading-relaxed">
              Requests execute against your local sandbox environment and simulate full real-time delivery without deductions.
            </p>
          </div>
        </div>

        {/* Right Side: Response Inspector */}
        <div className="md:col-span-6 p-5 space-y-4 bg-slate-950/90 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Response Output
                </span>
                {statusCode && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    statusCode >= 200 && statusCode < 300 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    HTTP {statusCode}
                  </span>
                )}
                {latency !== null && (
                  <span className="text-[10px] font-mono text-slate-500">
                    {latency}ms
                  </span>
                )}
              </div>

              {response && (
                <button
                  onClick={() => handleCopy(JSON.stringify(response, null, 2))}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                <span className="text-xs font-mono">Dispatched HTTP request...</span>
              </div>
            ) : response ? (
              <pre className="p-3.5 bg-slate-900 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-64 overflow-y-auto leading-relaxed">
                {JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                <Send className="h-6 w-6 text-slate-600" />
                <p className="text-xs">Click "Run Request" above to execute this endpoint live.</p>
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-900">
            <span>Auth: Bearer Token Verified</span>
            <span>Protocol: REST / JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
};
