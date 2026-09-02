import React, { useState, useEffect } from 'react';
import { 
  History, RefreshCw, Search, Filter, CheckCircle2, AlertCircle, 
  ChevronRight, Copy, Check, Play, Clock, ArrowUpRight, ArrowDownLeft,
  Terminal, Shield, Eye, X, CornerDownRight, Zap
} from 'lucide-react';

interface ApiLogsViewProps {
  app: any;
  showToast: (msg: string) => void;
}

export const ApiLogsView: React.FC<ApiLogsViewProps> = ({ app, showToast }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | '2xx' | '4xx' | '5xx'>('all');
  const [endpointFilter, setEndpointFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchLogs = async (silent = false) => {
    if (!app?.client_id && !app?.api_key) return;
    if (!silent) setLoading(true);
    try {
      const apiKey = app.client_id || app.api_key;
      const res = await fetch(`/api/v1/apps/logs`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setLogs(data.data);
          // If a log is selected, update its reference if it still exists
          if (selectedLog) {
            const updated = data.data.find((l: any) => l.id === selectedLog.id);
            if (updated) setSelectedLog(updated);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch logs:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [app?.id, app?.client_id]);

  // Auto polling every 4 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, app?.id, app?.client_id, selectedLog?.id]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLogs = logs.filter(log => {
    const code = Number(log.status_code) || 200;
    if (statusFilter === '2xx' && (code < 200 || code >= 300)) return false;
    if (statusFilter === '4xx' && (code < 400 || code >= 500)) return false;
    if (statusFilter === '5xx' && code < 500) return false;

    if (endpointFilter !== 'all') {
      const ep = log.endpoint || log.action || '';
      if (!ep.toLowerCase().includes(endpointFilter.toLowerCase())) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(log.id || '').toLowerCase().includes(q);
      const matchRec = String(log.recipient || '').toLowerCase().includes(q);
      const matchEp = String(log.endpoint || log.action || '').toLowerCase().includes(q);
      const matchStatus = String(log.status || '').toLowerCase().includes(q);
      if (!matchId && !matchRec && !matchEp && !matchStatus) return false;
    }

    return true;
  });

  const getStatusBadge = (statusCode: number, statusStr?: string) => {
    const code = Number(statusCode) || 200;
    if (code >= 200 && code < 300) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {code} OK
        </span>
      );
    }
    if (code >= 400 && code < 500) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="h-3 w-3 text-amber-600" />
          {code} {code === 401 ? 'Unauthorized' : code === 404 ? 'Not Found' : code === 429 ? 'Rate Limited' : 'Client Error'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="h-3 w-3 text-rose-600" />
        {code} Server Error
      </span>
    );
  };

  const generateCurlFromLog = (log: any) => {
    const origin = window.location.origin;
    const apiKey = app?.client_id || app?.api_key || '<API_KEY>';
    const ep = log.endpoint || '/api/v1/otp/send';
    const bodyStr = log.req_body ? JSON.stringify(log.req_body, null, 2) : `{"recipient": "${log.recipient || '+91XXXXXXXXXX'}"}`;
    return `curl -X ${log.method || 'POST'} "${origin}${ep}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyStr}'`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6 text-indigo-600" />
            Live Request & Error Logs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time HTTP request inspector, latency monitoring, and live payload debugger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Polling Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            {autoRefresh ? 'Live Stream Active' : 'Stream Paused'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh Logs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            {(['all', '2xx', '4xx', '5xx'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md transition-all uppercase tracking-wider text-[11px] ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all' ? 'All Codes' : tab}
              </button>
            ))}
          </div>

          {/* Endpoint Filter */}
          <select
            value={endpointFilter}
            onChange={e => setEndpointFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          >
            <option value="all">All Endpoints</option>
            <option value="otp/send">/api/v1/otp/send</option>
            <option value="otp/verify">/api/v1/otp/verify</option>
            <option value="bot/send">/api/v1/bot/send</option>
            <option value="bot/broadcast">/api/v1/bot/broadcast</option>
            <option value="sso">/api/v1/sso/*</option>
            <option value="webhook">Webhook Test</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, recipient, or action..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Logs Table & Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Logs List */}
        <div className={`transition-all ${selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Events Recorded</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  {filteredLogs.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Auto-synced with server</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Logs Matching Filter</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Trigger an OTP or message request via the simulator or curl snippet to see live inspection details here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
                {filteredLogs.map(log => {
                  const isSelected = selectedLog?.id === log.id;
                  const statusCode = Number(log.status_code) || 200;
                  const endpointStr = log.endpoint || (log.action ? `/api/v1/${log.action.replace('_', '/')}` : '/api/v1/request');
                  const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(isSelected ? null : log)}
                      className={`p-4 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isSelected 
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600 pl-3' 
                          : 'hover:bg-slate-50/80 border-l-4 border-transparent pl-3'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Method badge */}
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-[10px] rounded">
                          {log.method || 'POST'}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 truncate">
                              {endpointStr}
                            </span>
                            {getStatusBadge(statusCode, log.status)}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1">
                            {log.recipient && (
                              <span className="text-indigo-600 font-mono font-semibold truncate">
                                Recipient: @{log.recipient}
                              </span>
                            )}
                            <span>Latency: {log.latency_ms || 12}ms</span>
                            <span className="font-mono text-slate-400">ID: {String(log.id).substring(0, 14)}...</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-slate-500">{timeFormatted}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Log Inspector Drawer */}
        {selectedLog && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden sticky top-4 animate-in slide-in-from-right-4 duration-200">
            {/* Inspector Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] rounded border border-indigo-500/30">
                    {selectedLog.method || 'POST'}
                  </span>
                  <h3 className="text-sm font-bold font-mono text-white truncate">
                    {selectedLog.endpoint || `/api/v1/${selectedLog.action || 'request'}`}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-1">ID: {selectedLog.id}</p>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                <span className={`font-mono font-bold ${Number(selectedLog.status_code) >= 400 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedLog.status_code || 200}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Latency</span>
                <span className="font-mono font-bold text-slate-800">{selectedLog.latency_ms || 12}ms</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Client IP</span>
                <span className="font-mono font-bold text-slate-800 truncate block">{selectedLog.ip || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Inspector Body Details */}
            <div className="p-5 space-y-5 max-h-[500px] overflow-y-auto">
              {/* Request Payload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
                    Request Payload (Body)
                  </label>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.req_body || { recipient: selectedLog.recipient }, null, 2), "Request Payload")}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedKey === "Request Payload" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedLog.req_body || {
                    recipient: selectedLog.recipient,
                    action: selectedLog.action,
                    template_type: selectedLog.template_type || 'standard_otp'
                  }, null, 2)}
                </pre>
              </div>

              {/* Response Payload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                    Server Response (JSON)
                  </label>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.res_body || { success: selectedLog.status === 'success', status: selectedLog.status }, null, 2), "Response Payload")}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedKey === "Response Payload" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedLog.res_body || {
                    success: selectedLog.status === 'success',
                    status: selectedLog.status,
                    recipient: selectedLog.recipient,
                    event: selectedLog.action
                  }, null, 2)}
                </pre>
              </div>

              {/* Replay cURL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-slate-600" />
                    cURL Command (Replay Request)
                  </label>
                  <button
                    onClick={() => handleCopy(generateCurlFromLog(selectedLog), "cURL Replay")}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedKey === "cURL Replay" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy cURL
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                  {generateCurlFromLog(selectedLog)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
