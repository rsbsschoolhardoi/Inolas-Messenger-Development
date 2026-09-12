import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Terminal, Copy, Check, ExternalLink, Code2, ShieldCheck, 
  Send, CheckCircle2, ChevronRight, Hash, ArrowRight, Search, 
  Download, Play, Sparkles, Layers, Shield, FileText, Bot, Webhook, 
  Key, CreditCard, AlertTriangle, Rocket, ChevronDown, CheckCheck,
  Printer, FileCode, Sliders, Zap
} from 'lucide-react';
import { generateDocsData, DocEndpoint, DocCategory } from '../docs/docsData';
import { ApiPlayground } from '../docs/ApiPlayground';

interface ApiDocsViewProps {
  app: any;
  showToast: (msg: string) => void;
  themeMode?: 'light' | 'dark';
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ 
  app, 
  showToast,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const baseUrl = window.location.origin;
  const categories = useMemo(() => generateDocsData(app, baseUrl), [app, baseUrl]);

  // Flattened list of all endpoints
  const allEndpoints = useMemo(() => {
    return categories.flatMap(c => c.sections);
  }, [categories]);

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go' | 'java'>('curl');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'getting-started': true,
    'otp-service': true,
    'bot-messaging': true,
    'message-templates': true,
    'webhooks-guide': true,
    'billing-quotas': true,
    'error-codes': true
  });

  const currentEndpoint = useMemo(() => {
    return allEndpoints.find(e => e.id === selectedEndpointId) || allEndpoints[0];
  }, [allEndpoints, selectedEndpointId]);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.map(cat => {
      const filteredSections = cat.sections.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.path.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.params.some(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
      );
      return { ...cat, sections: filteredSections };
    }).filter(cat => cat.sections.length > 0);
  }, [categories, searchQuery]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleCopyMarkdown = () => {
    let md = `# Zenoa Developer Platform API Reference\n`;
    md += `Generated on: ${new Date().toISOString()}\n`;
    md += `Base URL: ${baseUrl}\n\n`;

    categories.forEach(cat => {
      md += `## ${cat.name}\n${cat.description}\n\n`;
      cat.sections.forEach(sec => {
        md += `### [${sec.method}] ${sec.title}\n`;
        md += `**Path:** \`${sec.path}\`\n\n`;
        md += `${sec.summary}\n\n`;
        md += `#### Description\n${sec.description}\n\n`;
        if (sec.params.length > 0) {
          md += `#### Parameters\n`;
          sec.params.forEach(p => {
            md += `- **\`${p.name}\`** (${p.type}${p.required ? ', required' : ''}): ${p.desc}\n`;
          });
          md += `\n`;
        }
        md += `#### cURL Example\n\`\`\`bash\n${sec.snippets.curl}\n\`\`\`\n\n`;
        md += `#### Response Schema (200 OK)\n\`\`\`json\n${sec.responseSuccess}\n\`\`\`\n\n---\n\n`;
      });
    });

    navigator.clipboard.writeText(md);
    showToast('Copied full API reference markdown documentation to clipboard!');
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'getting-started': return <Rocket className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />;
      case 'otp-service': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'bot-messaging': return <Bot className="h-4 w-4 text-sky-500" />;
      case 'message-templates': return <FileCode className="h-4 w-4 text-amber-500" />;
      case 'webhooks-guide': return <Webhook className="h-4 w-4 text-purple-500" />;
      case 'oauth-sso': return <Key className="h-4 w-4 text-rose-500" />;
      case 'billing-quotas': return <CreditCard className="h-4 w-4 text-cyan-500" />;
      case 'error-codes': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <BookOpen className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Docs Header */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden border ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#533afd]/15 border border-[#533afd]/30 text-[#533afd] dark:text-[#818cf8] text-xs font-bold rounded-full flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>OFFICIAL SPECIFICATION v2.4</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-bold rounded-full">
                99.99% SLA
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#0d253d] dark:text-white">
              Zenoa Developer Documentation
            </h1>
            <p className="text-sm text-[#64748d] dark:text-[#94a3b8] max-w-2xl leading-relaxed">
              Exhaustive technical reference, interactive request sandbox, cryptographic authentication specs, and multi-language SDK examples.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPlayground(!showPlayground)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                showPlayground
                  ? 'bg-[#533afd] text-white shadow-indigo-600/30'
                  : isDark
                  ? 'bg-[#121624] border border-[#273951] text-white hover:bg-[#1c1e54]'
                  : 'bg-white border border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#0d253d]'
              }`}
            >
              <Terminal className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>{showPlayground ? 'Close Sandbox' : 'Open API Sandbox'}</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-[#533afd]/10 border border-[#533afd]/30 hover:bg-[#533afd]/20 text-[#533afd] dark:text-[#818cf8] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="Open documentation in a separate standalone fullscreen page"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Full Page Docs (/docs)</span>
            </a>

            <button
              onClick={handleCopyMarkdown}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs border cursor-pointer ${
                isDark 
                  ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' 
                  : 'bg-white border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#0d253d]'
              }`}
            >
              <Copy className="h-4 w-4 text-[#64748d] dark:text-[#94a3b8]" />
              <span>Copy Docs (MD)</span>
            </button>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div className={`mt-6 pt-6 border-t relative ${isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'}`}>
          <div className="relative max-w-2xl">
            <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search all endpoints, parameters, error codes, and authentication guides..."
              className={`w-full rounded-2xl pl-11 pr-4 py-3 text-xs font-medium outline-none transition-all border ${
                isDark 
                  ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                  : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Documentation 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Multi-level Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className={`rounded-2xl p-4 shadow-xs space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            <div className="flex items-center justify-between px-2 text-[10px] uppercase font-bold tracking-wider text-[#64748d] dark:text-[#94a3b8]">
              <span>Documentation Index</span>
              <span>{allEndpoints.length} Guides</span>
            </div>

            <div className="space-y-3">
              {filteredCategories.map(cat => {
                const isExpanded = expandedCategories[cat.id] ?? true;
                return (
                  <div key={cat.id} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors group cursor-pointer ${
                        isDark ? 'hover:bg-[#121624]' : 'hover:bg-[#f6f9fc]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.id)}
                        <span className="text-xs font-bold text-[#0d253d] dark:text-white group-hover:text-[#533afd] dark:group-hover:text-[#818cf8]">
                          {cat.name}
                        </span>
                      </div>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className={`pl-3 space-y-0.5 border-l-2 ml-3.5 ${
                        isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
                      }`}>
                        {cat.sections.map(sec => {
                          const isSelected = selectedEndpointId === sec.id;
                          return (
                            <button
                              key={sec.id}
                              onClick={() => {
                                setSelectedEndpointId(sec.id);
                                if (window.innerWidth < 1024) {
                                  window.scrollTo({ top: 400, behavior: 'smooth' });
                                }
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#533afd]/15 text-[#533afd] dark:text-white font-bold border border-[#533afd]/40'
                                  : isDark
                                  ? 'text-[#94a3b8] hover:bg-[#121624] hover:text-white font-medium'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#0d253d] font-medium'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="text-[12px] truncate">{sec.title}</div>
                                {sec.method !== 'GUIDE' && (
                                  <div className="text-[10px] font-mono text-[#64748d] dark:text-[#94a3b8] truncate mt-0.5">
                                    {sec.method} {sec.path}
                                  </div>
                                )}
                              </div>
                              {sec.method !== 'GUIDE' && (
                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  sec.method === 'POST' ? 'bg-[#533afd]/20 text-[#533afd] dark:text-[#818cf8]' : 'bg-emerald-500/20 text-emerald-500'
                                }`}>
                                  {sec.method}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky API Key Reference */}
            <div className="p-3.5 bg-[#0c1024] text-white rounded-xl space-y-2 border border-[#273951]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="h-3 w-3 text-emerald-400" />
                  Your Active API Key
                </span>
                <button
                  onClick={() => handleCopy(app?.active_client_id || app?.client_id || 'sample_key', 'Active Key')}
                  className="text-[#818cf8] hover:underline text-[10px] font-bold cursor-pointer"
                >
                  {copiedLabel === 'Active Key' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-[11px] text-emerald-400 truncate bg-slate-950 p-2 rounded-lg border border-[#273951]">
                {app?.active_client_id || app?.client_id || 'zen_live_sample_key'}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER & RIGHT COLUMN: Main Document Body */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Optional Interactive Request Runner Drawer */}
          {showPlayground && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <ApiPlayground
                endpoint={currentEndpoint}
                app={app}
                showToast={showToast}
                onClose={() => setShowPlayground(false)}
              />
            </div>
          )}

          {/* Main Document Content Card */}
          <div className={`rounded-3xl p-6 md:p-10 shadow-xs space-y-8 border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            
            {/* Header section of selected doc */}
            <div className={`space-y-4 pb-6 border-b ${isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'bg-[#121624] text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {currentEndpoint.category}
                </span>

                {currentEndpoint.method !== 'GUIDE' && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                    currentEndpoint.method === 'POST' ? 'bg-[#533afd] text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {currentEndpoint.method}
                  </span>
                )}

                {currentEndpoint.authRequired && (
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-amber-500" />
                    Bearer Auth Required
                  </span>
                )}

                <span className={`px-2.5 py-1 border rounded-lg text-xs font-mono ${
                  isDark ? 'bg-[#121624] border-[#273951] text-[#94a3b8]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-600'
                }`}>
                  Cost: {currentEndpoint.cost}
                </span>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0d253d] dark:text-white">
                  {currentEndpoint.title}
                </h2>
                <p className="text-sm md:text-base text-[#64748d] dark:text-[#94a3b8] mt-2 leading-relaxed">
                  {currentEndpoint.summary}
                </p>
              </div>

              {currentEndpoint.method !== 'GUIDE' && (
                <div className={`p-3 rounded-2xl border flex items-center justify-between gap-4 font-mono text-xs ${
                  isDark ? 'bg-[#121624] border-[#273951] text-slate-200' : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]'
                }`}>
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[#533afd] dark:text-[#818cf8]">{currentEndpoint.method}</span>
                    <span className="truncate">{baseUrl}{currentEndpoint.path}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`${baseUrl}${currentEndpoint.path}`, 'Endpoint URL')}
                    className={`px-3 py-1.5 rounded-xl font-sans font-semibold text-xs flex items-center gap-1 shrink-0 border cursor-pointer ${
                      isDark 
                        ? 'bg-[#0c1024] border-[#273951] text-white hover:bg-[#1c1e54]' 
                        : 'bg-white border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc]'
                    }`}
                  >
                    {copiedLabel === 'Endpoint URL' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedLabel === 'Endpoint URL' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Markdown Description */}
            <div className={`prose max-w-none text-xs md:text-sm leading-relaxed space-y-4 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {currentEndpoint.description.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={pIdx} className="text-base font-bold text-[#0d253d] dark:text-white mt-6 mb-2">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
                      {paragraph.split('\n').map((li, liIdx) => (
                        <li key={liIdx}>{li.replace('- ', '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <div key={pIdx} className="p-4 bg-amber-500/10 border-l-4 border-amber-500 text-amber-500 rounded-r-xl text-xs my-3 font-medium">
                      {paragraph.replace('> ', '')}
                    </div>
                  );
                }
                return <p key={pIdx}>{paragraph}</p>;
              })}
            </div>

            {/* Headers Table */}
            {currentEndpoint.headers && currentEndpoint.headers.length > 0 && (
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" />
                  <span>Request Headers</span>
                </h4>
                <div className={`border rounded-2xl overflow-hidden ${
                  isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
                }`}>
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b font-bold uppercase text-[10px] ${
                      isDark ? 'bg-[#121624] border-[#273951] text-[#94a3b8]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-600'
                    }`}>
                      <tr>
                        <th className="p-3">Header Name</th>
                        <th className="p-3">Sample Value</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-[#273951] text-slate-300' : 'divide-[#e3e8ee] text-slate-700'
                    }`}>
                      {currentEndpoint.headers.map((h, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-[#121624]/60' : 'hover:bg-slate-50/60'}>
                          <td className="p-3 font-bold text-[#0d253d] dark:text-white">{h.name}</td>
                          <td className="p-3 text-[#533afd] dark:text-[#818cf8] truncate max-w-xs">{h.value}</td>
                          <td className="p-3 font-sans">
                            {h.required ? (
                              <span className="text-rose-500 font-bold text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">Required</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Optional</span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-[#64748d] dark:text-[#94a3b8]">{h.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Request Parameters Table */}
            {currentEndpoint.params && currentEndpoint.params.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" />
                    <span>Payload & Query Parameters</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">JSON Body</span>
                </div>
                <div className={`border rounded-2xl overflow-hidden ${
                  isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
                }`}>
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b font-bold uppercase text-[10px] ${
                      isDark ? 'bg-[#121624] border-[#273951] text-[#94a3b8]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-600'
                    }`}>
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Default</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isDark ? 'divide-[#273951] text-slate-300' : 'divide-[#e3e8ee] text-slate-700'
                    }`}>
                      {currentEndpoint.params.map((p, idx) => (
                        <tr key={idx} className={isDark ? 'hover:bg-[#121624]/60' : 'hover:bg-slate-50/60'}>
                          <td className="p-3 font-bold text-[#0d253d] dark:text-white">{p.name}</td>
                          <td className="p-3 text-[#533afd] dark:text-[#818cf8]">{p.type}</td>
                          <td className="p-3 font-sans">
                            {p.required ? (
                              <span className="text-rose-500 font-bold text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">Required</span>
                            ) : (
                              <span className="text-slate-400 text-[10px] bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/30">Optional</span>
                            )}
                          </td>
                          <td className="p-3 text-[#64748d] dark:text-[#94a3b8]">{p.default || '-'}</td>
                          <td className="p-3 font-sans text-[#64748d] dark:text-[#94a3b8]">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interactive Code Snippets Across 6 Languages */}
            <div className="space-y-3 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" />
                  <span>Production Implementation Snippets</span>
                </h4>

                {/* Language Switcher */}
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                  isDark ? 'bg-[#121624] border-[#273951]' : 'bg-slate-100 border-slate-200'
                }`}>
                  {(['curl', 'node', 'python', 'php', 'go', 'java'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        selectedLang === lang 
                          ? isDark ? 'bg-[#533afd] text-white font-bold' : 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'node' ? 'Node.js' : lang === 'curl' ? 'cURL' : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative group rounded-2xl overflow-hidden border border-[#273951] bg-[#0c1024] shadow-md">
                <div className="p-3 bg-slate-950/80 border-b border-[#273951] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 ml-2">
                      {selectedLang === 'node' ? 'index.js' : selectedLang === 'python' ? 'app.py' : selectedLang === 'go' ? 'main.go' : selectedLang === 'java' ? 'ZenoaClient.java' : 'terminal'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy((currentEndpoint.snippets as any)[selectedLang] || currentEndpoint.snippets.curl, `${selectedLang.toUpperCase()} Code`)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLabel === `${selectedLang.toUpperCase()} Code` ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedLabel === `${selectedLang.toUpperCase()} Code` ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96 overflow-y-auto">
                  {(currentEndpoint.snippets as any)[selectedLang] || currentEndpoint.snippets.curl}
                </pre>
              </div>
            </div>

            {/* Response Output Schema */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Success Response (HTTP 200 OK)</span>
                  </h4>
                  <button
                    onClick={() => handleCopy(currentEndpoint.responseSuccess, 'Success Schema')}
                    className="text-[11px] font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline cursor-pointer"
                  >
                    {copiedLabel === 'Success Schema' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 bg-[#0c1024] text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto border border-[#273951] leading-relaxed max-h-64 overflow-y-auto shadow-2xs">
                  {currentEndpoint.responseSuccess}
                </pre>
              </div>

              {currentEndpoint.responseError && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Error Response (HTTP 4xx / 5xx)</span>
                    </h4>
                    <button
                      onClick={() => handleCopy(currentEndpoint.responseError!, 'Error Schema')}
                      className="text-[11px] font-semibold text-[#533afd] dark:text-[#818cf8] hover:underline cursor-pointer"
                    >
                      {copiedLabel === 'Error Schema' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#0c1024] text-rose-300 rounded-2xl text-xs font-mono overflow-x-auto border border-[#273951] leading-relaxed max-h-64 overflow-y-auto shadow-2xs">
                    {currentEndpoint.responseError}
                  </pre>
                </div>
              )}
            </div>

            {/* Implementation Notes & Security Guidelines */}
            {currentEndpoint.notes && currentEndpoint.notes.length > 0 && (
              <div className={`p-5 rounded-2xl space-y-2 border ${
                isDark ? 'bg-[#533afd]/10 border-[#533afd]/30' : 'bg-indigo-50/60 border-indigo-100'
              }`}>
                <h5 className="text-xs font-bold flex items-center gap-2 text-[#533afd] dark:text-[#818cf8]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Developer Best Practices & Security Notes</span>
                </h5>
                <ul className={`space-y-1.5 pl-5 list-disc text-xs ${
                  isDark ? 'text-slate-300' : 'text-indigo-900'
                }`}>
                  {currentEndpoint.notes.map((note, nIdx) => (
                    <li key={nIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Floating Jump Navigation */}
            <div className={`pt-6 border-t flex items-center justify-between ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <button
                onClick={() => {
                  const currentIdx = allEndpoints.findIndex(e => e.id === currentEndpoint.id);
                  if (currentIdx > 0) {
                    setSelectedEndpointId(allEndpoints[currentIdx - 1].id);
                  }
                }}
                disabled={allEndpoints.findIndex(e => e.id === currentEndpoint.id) === 0}
                className={`px-4 py-2 disabled:opacity-30 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isDark ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>← Previous Guide</span>
              </button>

              <button
                onClick={() => setShowPlayground(true)}
                className="px-5 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Test in Live Sandbox</span>
              </button>

              <button
                onClick={() => {
                  const currentIdx = allEndpoints.findIndex(e => e.id === currentEndpoint.id);
                  if (currentIdx < allEndpoints.length - 1) {
                    setSelectedEndpointId(allEndpoints[currentIdx + 1].id);
                  }
                }}
                disabled={allEndpoints.findIndex(e => e.id === currentEndpoint.id) === allEndpoints.length - 1}
                className={`px-4 py-2 disabled:opacity-30 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isDark ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Next Guide →</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
