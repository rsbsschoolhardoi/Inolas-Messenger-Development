import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Activity, Clock, ShieldCheck, 
  ArrowUpRight, RefreshCw, Download, 
  Zap, CheckCircle2, Globe, Calendar, Filter,
  Terminal, Shield, FileSpreadsheet
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

interface AnalyticsViewProps {
  app: any;
  environment: 'test' | 'live';
  themeMode?: 'light' | 'dark';
  showToast: (msg: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  app,
  environment,
  themeMode = 'light',
  showToast
}) => {
  const isDark = themeMode === 'dark';
  const appId = app?.id || 'sa_active';

  // Discrete timeframe filters: '15m' | '1h' | '24h' | '7d' | '30d' | 'custom'
  const [timeframe, setTimeframe] = useState<string>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState<boolean>(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);
  const [activeChartMetric, setActiveChartMetric] = useState<'volume' | 'latency' | 'errors'>('volume');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Realistically scaled snapshot data based on selected timeframe, app age, and environment mode
  const timeSeriesData = useMemo(() => {
    const points: Array<{
      label: string;
      timestamp: string;
      requests: number;
      successful: number;
      failed: number;
      latencyMs: number;
      p95Latency: number;
    }> = [];

    let numPoints = 24;
    let intervalMs = 3600000; // 1 hour

    if (timeframe === '15m') {
      numPoints = 15;
      intervalMs = 60000; // 1 minute
    } else if (timeframe === '1h') {
      numPoints = 12;
      intervalMs = 300000; // 5 minutes
    } else if (timeframe === '24h') {
      numPoints = 24;
      intervalMs = 3600000; // 1 hour
    } else if (timeframe === '7d') {
      numPoints = 14;
      intervalMs = 43200000; // 12 hours
    } else if (timeframe === '30d') {
      numPoints = 30;
      intervalMs = 86400000; // 1 day
    } else if (timeframe === 'custom') {
      numPoints = 14;
      intervalMs = 86400000;
    }

    const now = lastRefreshed.getTime();
    const appCreatedAt = app?.created_at || Date.now() - 3600000;
    const appAgeHours = Math.max(0.1, (now - appCreatedAt) / (1000 * 3600));
    const isNewApp = appAgeHours < 24;
    const isSandbox = environment === 'test';

    // Base request scale: Sandbox apps have test traffic; Live apps have production traffic; New apps start fresh
    let baseScale = isSandbox ? (isNewApp ? 2 : 12) : (isNewApp ? 25 : 180);

    for (let i = numPoints - 1; i >= 0; i--) {
      const time = new Date(now - i * intervalMs);
      let label = '';
      if (timeframe === '15m' || timeframe === '1h') {
        label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else if (timeframe === '24h') {
        label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        label = time.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      // If point timestamp is before app creation, request count is 0
      const pointTime = time.getTime();
      let totalReq = 0;
      if (pointTime >= appCreatedAt - intervalMs) {
        const seed = Math.sin(i * 0.7) * 0.3 + 1;
        const randomVariance = ((i * 17) % 11) / 50;
        totalReq = Math.max(0, Math.floor(baseScale * seed * (0.8 + randomVariance)));
      }

      const failureRate = isSandbox ? 0.01 : 0.002;
      const failed = Math.floor(totalReq * failureRate);
      const successful = Math.max(0, totalReq - failed);
      const latency = Math.floor(28 + Math.cos(i * 0.5) * 4);
      const p95 = Math.floor(latency * 1.8 + 10);

      points.push({
        label,
        timestamp: time.toISOString(),
        requests: totalReq,
        successful,
        failed,
        latencyMs: latency,
        p95Latency: p95
      });
    }
    return points;
  }, [timeframe, lastRefreshed, app?.created_at, environment]);

  // Derived Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = timeSeriesData.reduce((acc, p) => acc + p.requests, 0);
    const successTotal = timeSeriesData.reduce((acc, p) => acc + p.successful, 0);
    const failedTotal = timeSeriesData.reduce((acc, p) => acc + p.failed, 0);
    const avgLatency = Math.round(timeSeriesData.reduce((acc, p) => acc + p.latencyMs, 0) / timeSeriesData.length);
    const p95Avg = Math.round(timeSeriesData.reduce((acc, p) => acc + p.p95Latency, 0) / timeSeriesData.length);
    const successRate = total > 0 ? ((successTotal / total) * 100).toFixed(2) : '100.00';

    return {
      totalFormatted: total.toLocaleString(),
      successRate: `${successRate}%`,
      avgLatency: `${avgLatency}ms`,
      p95Latency: `${p95Avg}ms`,
      failedTotal: failedTotal.toLocaleString(),
      botConversations: (Math.round(total * 0.45)).toLocaleString(),
      otpVerified: (Math.round(total * 0.30)).toLocaleString()
    };
  }, [timeSeriesData]);

  // Endpoints performance breakdown
  const endpointsBreakdown = [
    {
      method: 'POST',
      path: '/api/v1/bot/send',
      name: 'Direct Bot Dispatch',
      calls: Math.round(timeSeriesData.reduce((acc, p) => acc + p.requests, 0) * 0.44),
      share: '44.0%',
      avgLatency: '38ms',
      errorRate: '0.04%',
      status: 'nominal'
    },
    {
      method: 'POST',
      path: '/api/business/chat',
      name: 'Autonomous AI Concierge',
      calls: Math.round(timeSeriesData.reduce((acc, p) => acc + p.requests, 0) * 0.28),
      share: '28.0%',
      avgLatency: '108ms',
      errorRate: '0.10%',
      status: 'nominal'
    },
    {
      method: 'POST',
      path: '/api/v1/otp/send',
      name: 'Carrier OTP Verification',
      calls: Math.round(timeSeriesData.reduce((acc, p) => acc + p.requests, 0) * 0.18),
      share: '18.0%',
      avgLatency: '42ms',
      errorRate: '0.06%',
      status: 'nominal'
    },
    {
      method: 'POST',
      path: '/api/v1/webhooks',
      name: 'Ingress Webhook Events',
      calls: Math.round(timeSeriesData.reduce((acc, p) => acc + p.requests, 0) * 0.07),
      share: '7.0%',
      avgLatency: '22ms',
      errorRate: '0.02%',
      status: 'nominal'
    },
    {
      method: 'GET',
      path: '/api/v1/sso/verify',
      name: 'SSO Protocol Handshake',
      calls: Math.round(timeSeriesData.reduce((acc, p) => acc + p.requests, 0) * 0.03),
      share: '3.0%',
      avgLatency: '18ms',
      errorRate: '0.00%',
      status: 'nominal'
    }
  ];

  // Status code distribution
  const statusCodes = [
    { code: '200 OK', percentage: 91.2, color: 'bg-emerald-500' },
    { code: '201 Created', percentage: 6.8, color: 'bg-indigo-500' },
    { code: '400 Bad Request', percentage: 1.1, color: 'bg-amber-500' },
    { code: '401 Unauthorized', percentage: 0.5, color: 'bg-orange-500' },
    { code: '429 Rate Limited', percentage: 0.3, color: 'bg-purple-500' },
    { code: '500 Server Error', percentage: 0.1, color: 'bg-rose-500' }
  ];

  // Regional edge latency distribution
  const regionalGateways = [
    { region: 'Asia Pacific (Mumbai / in-south-1)', share: '56%', latency: '21ms', status: 'Optimal' },
    { region: 'Asia Pacific (Singapore / ap-southeast-1)', share: '25%', latency: '36ms', status: 'Optimal' },
    { region: 'Europe (Frankfurt / eu-central-1)', share: '12%', latency: '74ms', status: 'Nominal' },
    { region: 'North America (N. Virginia / us-east-1)', share: '7%', latency: '118ms', status: 'Nominal' }
  ];

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
      showToast('Telemetry snapshot updated');
    }, 400);
  };

  const handleTimeframeChange = (val: string) => {
    setTimeframe(val);
    if (val === 'custom') {
      setIsCustomRangeOpen(true);
    } else {
      setIsCustomRangeOpen(false);
    }
  };

  // Max value calculation for SVG Area Chart scaling
  const maxReq = Math.max(...timeSeriesData.map(d => d.requests), 10);
  const maxLatency = Math.max(...timeSeriesData.map(d => d.p95Latency), 20);

  // SVG Chart Dimensions
  const svgWidth = 700;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const pointsString = timeSeriesData.map((d, index) => {
    const x = paddingLeft + (index / (timeSeriesData.length - 1 || 1)) * chartWidth;
    const value = activeChartMetric === 'volume' 
      ? d.requests 
      : activeChartMetric === 'latency' 
        ? d.latencyMs 
        : d.failed;
    const maxVal = activeChartMetric === 'volume' 
      ? maxReq 
      : activeChartMetric === 'latency' 
        ? maxLatency 
        : Math.max(...timeSeriesData.map(x => x.failed), 5);
    const y = paddingTop + chartHeight - (value / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = timeSeriesData.length > 0
    ? `M ${paddingLeft},${paddingTop + chartHeight} L ${pointsString} L ${paddingLeft + chartWidth},${paddingTop + chartHeight} Z`
    : '';

  const handleExportCsv = () => {
    const headers = 'Timestamp,Label,Total Requests,Successful,Failed,Avg Latency (ms),P95 Latency (ms)\n';
    const rows = timeSeriesData.map(d => 
      `"${d.timestamp}","${d.label}",${d.requests},${d.successful},${d.failed},${d.latencyMs},${d.p95Latency}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenoa_analytics_${appId}_${timeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Analytics CSV report exported');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Discrete Timeframe Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-[#533afd] dark:text-[#818cf8]" />
            <span>Developer Analytics &amp; Throughput</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
            <span>Discrete snapshot telemetry &bull; Zero background bandwidth polling</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="font-mono text-[11px]">Synced: {lastRefreshed.toLocaleTimeString()}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Discrete Timeframe Selector */}
          <div className="w-44">
            <CustomSelect
              value={timeframe}
              onChange={handleTimeframeChange}
              size="sm"
              options={[
                { value: '15m', label: 'Last 15 Minutes' },
                { value: '1h', label: 'Last 1 Hour' },
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'custom', label: 'Custom Range...' },
              ]}
            />
          </div>

          {/* Manual Snapshot Refresh (Zero Auto-Polling) */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-zinc-300 hover:bg-[#1c1e54]' 
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
            title="Fetch Latest Snapshot"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#533afd]' : 'text-zinc-400'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Export CSV Report */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (Only shown if custom is selected) */}
      {isCustomRangeOpen && (
        <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-4 text-xs ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#533afd]" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Custom Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-zinc-500">Start:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-xs outline-none ${
                isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-zinc-500">End:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-xs outline-none ${
                isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setLastRefreshed(new Date());
              showToast(`Applied custom date range: ${customStartDate} to ${customEndDate}`);
            }}
            className="px-3 py-1 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total API Requests */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total API Requests</span>
            <div className="h-8 w-8 rounded-lg bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {summaryMetrics.totalFormatted}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              <ArrowUpRight className="h-3.5 w-3.5" /> +12.8%
            </span>
            <span className="text-zinc-400 text-[11px]">&bull; In timeframe</span>
          </div>
        </div>

        {/* Metric 2: Gateway Success Rate SLA */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Success Rate (SLA)</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {summaryMetrics.successRate}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              99.9% Uptime
            </span>
            <span className="text-zinc-400 text-[11px]">&bull; 0 Outages</span>
          </div>
        </div>

        {/* Metric 3: Response Latency */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Average Latency</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {summaryMetrics.avgLatency}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-mono text-zinc-600 dark:text-zinc-400">
              p95: {summaryMetrics.p95Latency}
            </span>
            <span className="text-zinc-400 text-[11px]">&bull; Edge Routed</span>
          </div>
        </div>

        {/* Metric 4: Verified Dispatches */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bot &amp; OTP Sessions</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {summaryMetrics.botConversations}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-[#533afd] dark:text-[#818cf8] font-semibold">
              {summaryMetrics.otpVerified} OTPs
            </span>
            <span className="text-zinc-400 text-[11px]">&bull; 100% Delivery</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart: Traffic Trend & Latency */}
      <div className={`rounded-2xl p-6 border space-y-4 ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Request Throughput &amp; Error Distribution
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Snapshot distribution across {timeframe.toUpperCase()} timeframe.
            </p>
          </div>

          {/* Chart Metric Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveChartMetric('volume')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeChartMetric === 'volume'
                  ? 'bg-white dark:bg-[#533afd] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Request Volume
            </button>

            <button
              type="button"
              onClick={() => setActiveChartMetric('latency')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeChartMetric === 'latency'
                  ? 'bg-white dark:bg-[#533afd] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Latency (ms)
            </button>

            <button
              type="button"
              onClick={() => setActiveChartMetric('errors')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeChartMetric === 'errors'
                  ? 'bg-white dark:bg-[#533afd] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Error Rate
            </button>
          </div>
        </div>

        {/* SVG Area / Line Chart with Tooltip */}
        <div className="relative w-full h-[240px] overflow-hidden pt-2">
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="primaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#533afd" stopOpacity={isDark ? "0.45" : "0.25"} />
                <stop offset="100%" stopColor="#533afd" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="errorAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Horizontal Guide Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + chartHeight * ratio;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={paddingLeft + chartWidth}
                    y2={y}
                    stroke={isDark ? "#273951" : "#e2e8f0"}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill={isDark ? "#94a3b8" : "#94a3b8"}
                    fontFamily="monospace"
                  >
                    {activeChartMetric === 'volume' 
                      ? Math.round(maxReq * (1 - ratio)).toLocaleString()
                      : activeChartMetric === 'latency'
                        ? `${Math.round(maxLatency * (1 - ratio))}ms`
                        : Math.round(Math.max(...timeSeriesData.map(x => x.failed), 5) * (1 - ratio))}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            {areaPath && (
              <path
                d={areaPath}
                fill={activeChartMetric === 'errors' ? "url(#errorAreaGradient)" : "url(#primaryAreaGradient)"}
              />
            )}

            {/* Main Metric Line */}
            {pointsString && (
              <polyline
                fill="none"
                stroke={activeChartMetric === 'errors' ? "#f43f5e" : "#533afd"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}

            {/* Data Point Circles & Interactive Hover Hitboxes */}
            {timeSeriesData.map((d, index) => {
              const x = paddingLeft + (index / (timeSeriesData.length - 1 || 1)) * chartWidth;
              const value = activeChartMetric === 'volume' 
                ? d.requests 
                : activeChartMetric === 'latency' 
                  ? d.latencyMs 
                  : d.failed;
              const maxVal = activeChartMetric === 'volume' 
                ? maxReq 
                : activeChartMetric === 'latency' 
                  ? maxLatency 
                  : Math.max(...timeSeriesData.map(x => x.failed), 5);
              const y = paddingTop + chartHeight - (value / maxVal) * chartHeight;
              const isHovered = hoveredDataPoint?.index === index;

              return (
                <g key={index} onMouseEnter={() => setHoveredDataPoint({ ...d, index, x, y })}>
                  <rect
                    x={x - chartWidth / (timeSeriesData.length * 2 || 1)}
                    y={paddingTop}
                    width={chartWidth / (timeSeriesData.length || 1)}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "5" : "3"}
                    fill={isHovered ? "#ffffff" : activeChartMetric === 'errors' ? "#f43f5e" : "#533afd"}
                    stroke={activeChartMetric === 'errors' ? "#f43f5e" : "#533afd"}
                    strokeWidth="2"
                    className="transition-all"
                  />
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredDataPoint && (
            <div 
              className={`absolute top-2 right-4 p-3 rounded-xl border shadow-xl z-20 pointer-events-none text-xs ${
                isDark ? 'bg-[#0d1326]/95 border-[#273951] text-white' : 'bg-white/95 border-zinc-200 text-zinc-900'
              }`}
            >
              <div className="font-bold border-b pb-1.5 mb-1.5 flex items-center justify-between gap-4 border-zinc-200 dark:border-zinc-800">
                <span>{hoveredDataPoint.label}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {new Date(hoveredDataPoint.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">Total Requests:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{hoveredDataPoint.requests.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-emerald-500">Successful (2xx):</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{hoveredDataPoint.successful.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-rose-500">Failed (4xx/5xx):</span>
                  <strong className="text-rose-600 dark:text-rose-400">{hoveredDataPoint.failed}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Latency:</span>
                  <strong>{hoveredDataPoint.latencyMs}ms (p95: {hoveredDataPoint.p95Latency}ms)</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Grid: Endpoint Performance & Status Code Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoints Table (2 Columns wide) */}
        <div className={`lg:col-span-2 rounded-2xl p-6 border space-y-4 ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Top Endpoint Performance
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Execution speed, volume share, and error rates per route.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-semibold">5 Active Routes</span>
          </div>

          <div className="space-y-3">
            {endpointsBreakdown.map((ep, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-[#121624]/60 border-[#273951]' : 'bg-zinc-50/70 border-zinc-200'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    ep.method === 'POST' ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8]' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {ep.method}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono truncate">
                      {ep.path}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {ep.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0 pl-7 sm:pl-0">
                  <div>
                    <span className="text-[10px] text-zinc-400 block sm:hidden">Calls</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{ep.calls.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block sm:hidden">Latency</span>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">{ep.avgLatency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block sm:hidden">Share</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold">
                      {ep.share}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HTTP Status Code Breakdown (1 Column wide) */}
        <div className={`rounded-2xl p-6 border space-y-4 ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
        }`}>
          <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              HTTP Response Codes
            </h3>
            <span className="text-xs font-mono text-emerald-500 font-semibold">98.0% 2xx Success</span>
          </div>

          <div className="space-y-3.5">
            {statusCodes.map((st, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{st.code}</span>
                  <span className="text-zinc-500">{st.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${st.color}`} 
                    style={{ width: `${st.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <strong>Bandwidth Guard:</strong> Snapshot metrics are cached and only fetched on manual refresh or timeframe changes.
          </div>
        </div>
      </div>

      {/* Edge Routing & Regional Gateway Distribution */}
      <div className={`rounded-2xl p-6 border space-y-4 ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200 shadow-2xs'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>Global Edge Gateway Latency</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Multi-region traffic dispatch with local carrier peering and DNS routing.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            4 Regions Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regionalGateways.map((gw, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#121624]/60 border-[#273951]' : 'bg-zinc-50/70 border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{gw.region.split('(')[0]}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {gw.share}
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-[#533afd] dark:text-[#818cf8]">
                {gw.latency}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>{gw.status} Routing</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
