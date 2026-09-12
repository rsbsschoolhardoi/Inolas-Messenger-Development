import React, { useState, useEffect } from 'react';
import { 
  History, RefreshCw, Search, Filter, CheckCircle2, AlertCircle, 
  ChevronRight, Copy, Check, Play, Clock, ArrowUpRight, ArrowDownLeft,
  Terminal, Shield, Eye, X, CornerDownRight, Zap
} from 'lucide-react';

interface ApiLogsViewProps {
  app: any;
  showToast: (msg: string) => void;
  themeMode?: 'light' | 'dark';
}

export const ApiLogsView: React.FC<ApiLogsViewProps> = ({ 
  app, 
  showToast,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {code} OK
        </span>
      );
    }
    if (code >= 400 && code < 500) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
          <AlertCircle className="h-3 w-3" />
          {code} {code === 401 ? 'Unauthorized' : code === 404 ? 'Not Found' : code === 429 ? 'Rate Limited' : 'Client Error'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
        <AlertCircle className="h-3 w-3" />
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
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#0d253d] dark:text-white">
            <Terminal className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
            Live Request & Error Logs
          </h2>
          <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
            Real-time HTTP request inspector, latency monitoring, and live payload debugger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Polling Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-xs' 
                : isDark 
                  ? 'bg-[#121624] text-[#94a3b8] border-[#273951] hover:bg-[#1c1e54]' 
                  : 'bg-[#f6f9fc] text-[#64748d] border-[#e3e8ee] hover:bg-slate-100'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
            {autoRefresh ? 'Live Stream Active' : 'Stream Paused'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' 
                : 'bg-white border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc]'
            }`}
            title="Refresh Logs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#533afd] dark:text-[#818cf8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className={`rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className={`inline-flex p-0.5 rounded-xl border text-xs font-semibold ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['all', '2xx', '4xx', '5xx'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider text-[11px] cursor-pointer ${
                  statusFilter === tab
                    ? isDark 
                      ? 'bg-[#533afd] text-white shadow-xs font-bold' 
                      : 'bg-white text-[#0d253d] shadow-xs font-bold'
                    : isDark 
                      ? 'text-[#94a3b8] hover:text-white' 
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
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
            }`}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d] dark:text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, recipient, or action..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs outline-none border transition-all ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-white placeholder-[#64748d] focus:border-[#533afd]' 
                : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] placeholder-slate-400 focus:border-[#533afd]'
            }`}
          />
        </div>
      </div>

      {/* Logs Table & Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Logs List */}
        <div className={`transition-all ${selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className={`rounded-2xl shadow-xs overflow-hidden border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-[#273951] bg-[#121624]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]/80'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8]">Events Recorded</span>
                <span className="px-2 py-0.5 rounded-full bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] text-xs font-bold border border-[#533afd]/20">
                  {filteredLogs.length}
                </span>
              </div>
              <span className="text-[11px] text-[#64748d] dark:text-[#94a3b8] font-medium">Auto-synced with server</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <History className="h-10 w-10 text-[#64748d] dark:text-[#94a3b8] mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-[#0d253d] dark:text-white">No Logs Matching Filter</h3>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1 max-w-sm mx-auto">
                  Trigger an OTP or message request via the simulator or curl snippet to see live inspection details here.
                </p>
              </div>
            ) : (
              <div className={`divide-y max-h-[620px] overflow-y-auto ${
                isDark ? 'divide-[#273951]' : 'divide-[#e3e8ee]'
              }`}>
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
                          ? isDark 
                            ? 'bg-[#533afd]/20 border-l-4 border-[#533afd] pl-3' 
                            : 'bg-indigo-50/70 border-l-4 border-[#533afd] pl-3'
                          : isDark 
                            ? 'hover:bg-[#121624] border-l-4 border-transparent pl-3' 
                            : 'hover:bg-slate-50/80 border-l-4 border-transparent pl-3'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Method badge */}
                        <span className={`px-2 py-1 border font-mono font-bold text-[10px] rounded ${
                          isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}>
                          {log.method || 'POST'}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold truncate text-[#0d253d] dark:text-white">
                              {endpointStr}
                            </span>
                            {getStatusBadge(statusCode, log.status)}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[#64748d] dark:text-[#94a3b8] font-medium mt-1">
                            {log.recipient && (
                              <span className="text-[#533afd] dark:text-[#818cf8] font-mono font-semibold truncate">
                                Recipient: @{log.recipient}
                              </span>
                            )}
                            <span>Latency: {log.latency_ms || 12}ms</span>
                            <span className="font-mono opacity-75">ID: {String(log.id).substring(0, 14)}...</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-[#64748d] dark:text-[#94a3b8]">{timeFormatted}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90 text-[#533afd] dark:text-[#818cf8]' : 'text-[#64748d] dark:text-[#94a3b8]'}`} />
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
          <div className={`lg:col-span-5 rounded-2xl shadow-xl overflow-hidden sticky top-4 animate-in slide-in-from-right-4 duration-200 border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            {/* Inspector Header */}
            <div className="p-5 border-b border-[#273951] bg-[#0c1024] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#533afd]/20 text-[#818cf8] font-mono font-bold text-[10px] rounded border border-[#533afd]/40">
                    {selectedLog.method || 'POST'}
                  </span>
                  <h3 className="text-sm font-bold font-mono text-white truncate">
                    {selectedLog.endpoint || `/api/v1/${selectedLog.action || 'request'}`}
                  </h3>
                </div>
                <p className="text-[11px] text-[#94a3b8] font-mono mt-1">ID: {selectedLog.id}</p>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-[#121624] hover:bg-[#1c1e54] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className={`p-4 border-b grid grid-cols-3 gap-2 text-center text-xs ${
              isDark ? 'bg-[#121624]/70 border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
            }`}>
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
              }`}>
                <span className="text-[10px] font-bold uppercase text-[#64748d] dark:text-[#94a3b8] block">Status</span>
                <span className={`font-mono font-bold ${Number(selectedLog.status_code) >= 400 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {selectedLog.status_code || 200}
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
              }`}>
                <span className="text-[10px] font-bold uppercase text-[#64748d] dark:text-[#94a3b8] block">Latency</span>
                <span className="font-mono font-bold text-[#0d253d] dark:text-white">{selectedLog.latency_ms || 12}ms</span>
              </div>
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
              }`}>
                <span className="text-[10px] font-bold uppercase text-[#64748d] dark:text-[#94a3b8] block">Client IP</span>
                <span className="font-mono font-bold text-[#0d253d] dark:text-white truncate block">{selectedLog.ip || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Inspector Body Details */}
            <div className="p-5 space-y-5 max-h-[500px] overflow-y-auto">
              {/* Request Payload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#0d253d] dark:text-white">
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" />
                    Request Payload (Body)
                  </label>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.req_body || { recipient: selectedLog.recipient }, null, 2), "Request Payload")}
                    className="text-[11px] font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "Request Payload" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3.5 bg-[#0c1024] text-[#818cf8] rounded-xl text-xs font-mono overflow-x-auto border border-[#273951]">
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
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#0d253d] dark:text-white">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                    Server Response (JSON)
                  </label>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.res_body || { success: selectedLog.status === 'success', status: selectedLog.status }, null, 2), "Response Payload")}
                    className="text-[11px] font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "Response Payload" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3.5 bg-[#0c1024] text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto border border-[#273951]">
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
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#0d253d] dark:text-white">
                    <Terminal className="h-3.5 w-3.5 text-[#64748d] dark:text-[#94a3b8]" />
                    cURL Command (Replay Request)
                  </label>
                  <button
                    onClick={() => handleCopy(generateCurlFromLog(selectedLog), "cURL Replay")}
                    className="text-[11px] font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "cURL Replay" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy cURL
                  </button>
                </div>
                <pre className="p-3.5 bg-[#0c1024] text-slate-300 rounded-xl text-xs font-mono overflow-x-auto border border-[#273951]">
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
