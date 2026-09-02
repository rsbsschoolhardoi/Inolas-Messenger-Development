import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Terminal, Copy, Check, ExternalLink, Code2, ShieldCheck, 
  Send, CheckCircle2, ChevronRight, Hash, ArrowRight, Search, 
  Download, Play, Sparkles, Layers, Shield, FileText, Bot, Webhook, 
  Key, CreditCard, AlertTriangle, Rocket, ChevronDown, CheckCheck,
  Printer, FileCode, Sliders, Zap, Home, ArrowLeft, Globe, Database,
  Cpu, Users, PhoneCall, MessageSquare, Lock, Radio, Bell, RefreshCw,
  Eye, Laptop, Share2, HelpCircle
} from 'lucide-react';
import { generateDocsData, DocEndpoint, DocCategory } from './docs/docsData';
import { ApiPlayground } from './docs/ApiPlayground';
import { useBranding } from '../../brandingUtils';

interface DocumentationStandaloneProps {
  onBackToApp?: () => void;
  onOpenConsole?: () => void;
}

export const DocumentationStandalone: React.FC<DocumentationStandaloneProps> = ({ 
  onBackToApp,
  onOpenConsole 
}) => {
  const branding = useBranding();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.zenoa.inolas.com';

  // Retrieve stored app/credentials or fallback
  const storedApp = useMemo(() => {
    try {
      const raw = localStorage.getItem('zenoa_dev_apps');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch (e) {}
    return {
      id: 'demo_app',
      app_name: branding.app_name || 'Production Service Application',
      client_id: 'zen_live_prod_99x817a02e7b',
      client_secret: 'zen_sec_f9810a9c8b7123ef',
      active_client_id: 'zen_live_prod_99x817a02e7b',
      active_client_secret: 'zen_sec_f9810a9c8b7123ef',
      environment: 'live',
      rate_limit_tier: 'enterprise',
      credits_balance: 50000
    };
  }, [branding]);

  const categories = useMemo(() => generateDocsData(storedApp, baseUrl), [storedApp, baseUrl]);

  // Flattened list of all endpoints
  const allEndpoints = useMemo(() => {
    return categories.flatMap(c => c.sections);
  }, [categories]);

  // URL Hash / Query sync
  const getInitialSection = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && allEndpoints.some(e => e.id === hash)) return hash;
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section && allEndpoints.some(e => e.id === section)) return section;
    }
    return 'intro';
  };

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(getInitialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go' | 'java'>('curl');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTabMode, setActiveTabMode] = useState<'api' | 'architecture' | 'sdks'>('api');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'getting-started': true,
    'otp-service': true,
    'bot-messaging': true,
    'message-templates': true,
    'webhooks-guide': true,
    'oauth-sso': true,
    'billing-quotas': true,
    'error-codes': true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentEndpoint = useMemo(() => {
    return allEndpoints.find(e => e.id === selectedEndpointId) || allEndpoints[0];
  }, [allEndpoints, selectedEndpointId]);

  // Update hash when endpoint changes
  const handleSelectEndpoint = (id: string) => {
    setSelectedEndpointId(id);
    if (typeof window !== 'undefined') {
      window.location.hash = id;
    }
    // Scroll to top of content on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    let md = `# ${branding.app_name || 'Zenoa'} Enterprise API Documentation & Complete System Reference\n`;
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
    showToast('Markdown documentation copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-fade-in border border-indigo-400/30">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">{branding.app_name || 'Zenoa'}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  DOCS v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Enterprise System & Communication API Reference</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 ml-6 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTabMode('api')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTabMode === 'api' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTabMode('architecture')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTabMode === 'architecture' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              System Architecture
            </button>
            <button
              onClick={() => setActiveTabMode('sdks')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTabMode === 'sdks' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SDKs & Libraries
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              showPlayground 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="hidden md:inline">{showPlayground ? 'Close Sandbox' : 'API Playground'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy full documentation as Markdown"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy Docs</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {onOpenConsole ? (
            <button
              onClick={onOpenConsole}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Console</span>
            </button>
          ) : (
            <a
              href="/developer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Console</span>
            </a>
          )}

          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Return to Main App"
            >
              <Home className="h-4 w-4" />
            </button>
          ) : (
            <a
              href="/"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Return to Main App"
            >
              <Home className="h-4 w-4" />
            </a>
          )}
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0 overflow-hidden">
          {/* Search Box */}
          <div className="p-4 border-b border-slate-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints, guides, codes..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  \u2715
                </button>
              )}
            </div>
          </div>

          {/* Categories and Endpoints Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {filteredCategories.map(cat => {
              const isExpanded = expandedCategories[cat.id] ?? true;
              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors group cursor-pointer"
                  >
                    <span className="uppercase tracking-wider text-[11px] flex items-center gap-2">
                      {cat.name}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  </button>

                  {isExpanded && (
                    <div className="space-y-0.5 pl-1.5 border-l border-slate-800/60 ml-2">
                      {cat.sections.map(sec => {
                        const isSelected = selectedEndpointId === sec.id;
                        return (
                          <button
                            key={sec.id}
                            onClick={() => handleSelectEndpoint(sec.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                sec.method === 'GET'
                                  ? 'bg-sky-950 text-sky-400 border border-sky-800/40'
                                  : sec.method === 'POST'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  : sec.method === 'DELETE'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                                  : 'bg-indigo-950 text-indigo-400 border border-indigo-800/40'
                              }`}
                            >
                              {sec.method}
                            </span>
                            <span className="text-xs truncate flex-1">{sec.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Base URL Widget */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Base Endpoint</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 font-mono text-[11px] text-slate-300">
                <span className="truncate">{baseUrl}</span>
                <button
                  onClick={() => handleCopy(baseUrl, 'Base URL')}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy Base URL"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT & DETAILS VIEW */}
        <main className="flex-1 overflow-y-auto bg-slate-900/40 p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* IN-DOCUMENT SANDBOX PLAYGROUND */}
            {showPlayground && (
              <div className="p-6 rounded-3xl bg-slate-950 border border-indigo-500/40 shadow-2xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Live In-Doc API Playground</h3>
                      <p className="text-[11px] text-slate-400">Dispatch live requests using your active Sandbox credentials</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPlayground(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    \u2715
                  </button>
                </div>
                <ApiPlayground 
                  endpoint={currentEndpoint}
                  app={storedApp} 
                  showToast={showToast} 
                  onClose={() => setShowPlayground(false)}
                />
              </div>
            )}

            {/* SECTION 1: HEADER & METHOD BADGE */}
            <div className="space-y-3 pb-6 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    currentEndpoint.method === 'GET'
                      ? 'bg-sky-950 text-sky-400 border border-sky-700/60'
                      : currentEndpoint.method === 'POST'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                      : currentEndpoint.method === 'DELETE'
                      ? 'bg-rose-950 text-rose-400 border border-rose-700/60'
                      : 'bg-indigo-950 text-indigo-400 border border-indigo-700/60'
                  }`}
                >
                  {currentEndpoint.method}
                </span>
                <span className="font-mono text-sm text-slate-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  {currentEndpoint.path}
                </span>
                {currentEndpoint.authRequired && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Bearer Auth
                  </span>
                )}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  Rate Limit: {currentEndpoint.rateLimit}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight">{currentEndpoint.title}</h1>
              <p className="text-base text-slate-400 leading-relaxed">{currentEndpoint.summary}</p>
            </div>

            {/* SECTION 2: LONG DESCRIPTION / GUIDE CONTENT */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                Overview & Detailed Specifications
              </h3>
              <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-6 rounded-2xl border border-slate-800 whitespace-pre-line">
                {currentEndpoint.description}
              </div>
            </div>

            {/* SECTION 3: HEADERS & AUTHENTICATION SPEC */}
            {currentEndpoint.headers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Required HTTP Headers
                </h3>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                        <th className="p-3 font-semibold">Header Name</th>
                        <th className="p-3 font-semibold">Sample Value</th>
                        <th className="p-3 font-semibold">Description</th>
                        <th className="p-3 font-semibold">Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {currentEndpoint.headers.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-indigo-400">{h.name}</td>
                          <td className="p-3 text-slate-400 truncate max-w-[200px]">{h.value}</td>
                          <td className="p-3 font-sans text-slate-300">{h.desc}</td>
                          <td className="p-3 font-sans">
                            {h.required ? (
                              <span className="text-rose-400 font-bold">Yes</span>
                            ) : (
                              <span className="text-slate-500">Optional</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 4: PARAMETERS & ATTRIBUTES MATRIX */}
            {currentEndpoint.params.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  Parameters & Payload Attributes
                </h3>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                        <th className="p-3 font-semibold">Field Name</th>
                        <th className="p-3 font-semibold">Data Type</th>
                        <th className="p-3 font-semibold">Required</th>
                        <th className="p-3 font-semibold">Description & Validation Rules</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {currentEndpoint.params.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-white">{p.name}</td>
                          <td className="p-3 text-indigo-400">{p.type}</td>
                          <td className="p-3 font-sans">
                            {p.required ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/40">
                                Required
                              </span>
                            ) : (
                              <span className="text-slate-500 font-sans text-xs">Optional</span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-slate-300 leading-relaxed">
                            {p.desc}
                            {p.enum && (
                              <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px]">
                                {p.enum.map((en, idx) => (
                                  <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                    "{en}"
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 5: MULTI-LANGUAGE CODE SNIPPETS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-purple-400" />
                  Implementation Snippet
                </h3>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {(['curl', 'node', 'python', 'php', 'go', 'java'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-2.5 py-1 rounded-lg uppercase text-[11px] font-bold transition-all ${
                        selectedLang === lang
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                  <span>Language: {selectedLang.toUpperCase()}</span>
                  <button
                    onClick={() => handleCopy(currentEndpoint.snippets[selectedLang], 'Code snippet')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedLabel === 'Code snippet' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedLabel === 'Code snippet' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  <code>{currentEndpoint.snippets[selectedLang]}</code>
                </pre>
              </div>
            </div>

            {/* SECTION 6: SUCCESS & ERROR RESPONSE SCHEMAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Success Response */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Response (200 OK)
                  </span>
                  <button
                    onClick={() => handleCopy(currentEndpoint.responseSuccess, 'Success response')}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy JSON
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/40 text-emerald-300 font-mono text-xs overflow-x-auto max-h-72">
                  <pre>{currentEndpoint.responseSuccess}</pre>
                </div>
              </div>

              {/* Error Response (if defined) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Standard Error (4xx/5xx)
                  </span>
                  <button
                    onClick={() => handleCopy(currentEndpoint.responseError || '{"error": "INVALID_API_KEY"}', 'Error response')}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy JSON
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/40 text-rose-300 font-mono text-xs overflow-x-auto max-h-72">
                  <pre>
                    {currentEndpoint.responseError || `{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired Bearer Token.",
  "status": 401
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* SECTION 7: CRITICAL NOTES & BEST PRACTICES */}
            {currentEndpoint.notes && currentEndpoint.notes.length > 0 && (
              <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Engineering & Compliance Notes
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-indigo-200/90 leading-relaxed">
                  {currentEndpoint.notes.map((n, idx) => (
                    <li key={idx}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
