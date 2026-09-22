import React, { useState, useMemo, useEffect } from 'react';
import { resolveAndApplyMetadata } from '../../seoUtils';
import { 
  BookOpen, Terminal, Copy, Check, ExternalLink, Code2, ShieldCheck, 
  Send, CheckCircle2, ChevronRight, Hash, ArrowRight, Search, 
  Download, Play, Sparkles, Layers, Shield, FileText, Bot, Webhook, 
  Key, CreditCard, AlertTriangle, Rocket, ChevronDown, CheckCheck,
  Printer, FileCode, Sliders, Zap, Home, ArrowLeft, Globe, Database,
  Cpu, Users, PhoneCall, MessageSquare, Lock, Radio, Bell, RefreshCw,
  Eye, Laptop, Share2, HelpCircle, X, Menu
} from 'lucide-react';
import { generateDocsData, DocEndpoint, DocCategory } from './docs/docsData';
import { ApiPlayground } from './docs/ApiPlayground';
import { useBranding } from '../../brandingUtils';
import { MarkdownRenderer, renderInlineFormatting } from './docs/MarkdownRenderer';

interface DocumentationStandaloneProps {
  onBackToApp?: () => void;
  onOpenConsole?: () => void;
  initialSection?: string;
}

/**
 * Aesthetic, sophisticated, mature method badge styling.
 * Strictly avoids eye-straining neon glows while maintaining clear semantic distinction.
 */
const getMethodBadgeClass = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-[#142032] text-[#93c5fd] border border-[#223554]';
    case 'POST':
      return 'bg-[#12261e] text-[#86efac] border border-[#1f4535]';
    case 'PUT':
      return 'bg-[#281e12] text-[#fcd34d] border border-[#4a361e]';
    case 'DELETE':
      return 'bg-[#291319] text-[#fca5a5] border border-[#4e222d]';
    case 'PATCH':
      return 'bg-[#112428] text-[#5eead4] border border-[#1d4348]';
    case 'OAUTH':
      return 'bg-[#241738] text-[#e9d5ff] border border-[#462c6d]';
    case 'WEBHOOK':
      return 'bg-[#132332] text-[#bae6fd] border border-[#203c54]';
    case 'GUIDE':
    default:
      return 'bg-[#1c1935] text-[#c7d2fe] border border-[#362f62]';
  }
};

export const DocumentationStandalone: React.FC<DocumentationStandaloneProps> = ({ 
  onBackToApp,
  onOpenConsole,
  initialSection
}) => {
  useEffect(() => {
    resolveAndApplyMetadata({ isDocShowing: true });
  }, []);

  const branding = useBranding();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.zenoa.in';

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
      client_secret: 'zen_sa_f9810a9c8b7123ef6543189abced214764839210fabc45781290384756bca910',
      active_client_id: 'zen_live_prod_99x817a02e7b',
      active_client_secret: 'zen_sa_f9810a9c8b7123ef6543189abced214764839210fabc45781290384756bca910',
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
    if (initialSection && allEndpoints.some(e => e.id === initialSection)) {
      return initialSection;
    }
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

  useEffect(() => {
    if (initialSection && allEndpoints.some(e => e.id === initialSection)) {
      setSelectedEndpointId(initialSection);
    }
  }, [initialSection, allEndpoints]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go' | 'java'>('curl');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<'api' | 'architecture' | 'sdks'>('api');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'getting-started': true,
    'otp-service': true,
    'bot-messaging': true,
    'message-templates': true,
    'webhooks-guide': true,
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
    setIsMobileSidebarOpen(false);
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
    <div className="min-h-screen bg-[#101116] text-[#f1f5f9] flex flex-col font-sans selection:bg-[#6366f1]/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] px-4 py-3 bg-[#4f46e5] text-white rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-fade-in border border-[#818cf8]/30">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header on Charcoal Black */}
      <header className="h-16 border-b border-[#232736] bg-[#13151c]/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[#1a1d26] transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center text-[#818cf8] shadow-inner">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">{branding.app_name || 'Zenoa'}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1c1935] text-[#c7d2fe] border border-[#362f62]">
                  Docs
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] hidden sm:block">Carrier-Grade Messaging, SSO, OTP & Cloud Infrastructure</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 ml-6 bg-[#171922] p-1 rounded-xl border border-[#262b3a] text-xs">
            <button
              onClick={() => setActiveTabMode('api')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTabMode === 'api' ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTabMode('architecture')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTabMode === 'architecture' ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Architecture & Security
            </button>
            <button
              onClick={() => setActiveTabMode('sdks')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTabMode === 'sdks' ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              SDKs & Webhooks
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              showPlayground 
                ? 'bg-[#059669] text-white shadow-lg' 
                : 'bg-[#181b24] hover:bg-[#1f2330] text-[#f1f5f9] border border-[#2a3142]'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="hidden md:inline">{showPlayground ? 'Close Sandbox' : 'API Playground'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#181b24] hover:bg-[#1f2330] text-[#f1f5f9] border border-[#2a3142] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy full documentation as Markdown"
          >
            <Copy className="h-3.5 w-3.5 text-[#94a3b8]" />
            <span className="hidden sm:inline">Copy Docs</span>
          </button>

          <div className="h-6 w-px bg-[#232736] mx-1 hidden sm:block" />

          {onOpenConsole ? (
            <button
              onClick={onOpenConsole}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Console</span>
            </button>
          ) : (
            <a
              href="/developer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Console</span>
            </a>
          )}

          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[#1a1d26] transition-colors"
              title="Return to Main App"
            >
              <Home className="h-4 w-4" />
            </button>
          ) : (
            <a
              href="/"
              className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[#1a1d26] transition-colors"
              title="Return to Main App"
            >
              <Home className="h-4 w-4" />
            </a>
          )}
        </div>
      </header>

      {/* Main Layout Grid on Charcoal Black */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-30 md:z-auto
          w-80 border-r border-[#232736] bg-[#13151c] flex flex-col shrink-0 overflow-hidden
          transition-transform duration-200 ease-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          top-16 md:top-0 h-[calc(100vh-4rem)] md:h-auto
        `}>
          {/* Search Box */}
          <div className="p-4 border-b border-[#232736]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints, guides, error codes..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#171a22] border border-[#262b3a] rounded-xl text-white placeholder-[#64748b] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/50 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
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
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-[#94a3b8] hover:text-white transition-colors group cursor-pointer"
                  >
                    <span className="uppercase tracking-wider text-[11px] flex items-center gap-2 text-white">
                      {cat.name}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#64748b] group-hover:text-white transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  </button>

                  {isExpanded && (
                    <div className="space-y-0.5 pl-1.5 border-l border-[#232736] ml-2">
                      {cat.sections.map(sec => {
                        const isSelected = selectedEndpointId === sec.id;
                        return (
                          <button
                            key={sec.id}
                            onClick={() => handleSelectEndpoint(sec.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1b1f2b] text-white border border-[#31394d] font-semibold shadow-sm'
                                : 'text-[#cbd5e1] hover:text-white hover:bg-[#171a22]'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${getMethodBadgeClass(sec.method)}`}
                            >
                              {sec.method}
                            </span>
                            <span className="text-xs truncate flex-1 font-medium">{sec.title}</span>
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
          <div className="p-3 border-t border-[#232736] bg-[#101116]">
            <div className="p-2.5 rounded-xl bg-[#161821] border border-[#252936] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#94a3b8]">
                <span className="text-white">API Base Origin</span>
                <span className="text-[#86efac] flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#86efac] animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 font-mono text-[11px] text-white">
                <span className="truncate">{baseUrl}</span>
                <button
                  onClick={() => handleCopy(baseUrl, 'Base URL')}
                  className="p-1 text-[#94a3b8] hover:text-white transition-colors"
                  title="Copy Base URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay backdrop for mobile */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* CENTER CONTENT & DETAILS VIEW */}
        <main className="flex-1 overflow-y-auto bg-[#101116] p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* IN-DOCUMENT SANDBOX PLAYGROUND */}
            {showPlayground && (
              <div className="p-6 rounded-3xl bg-[#161821] border border-[#6366f1]/40 shadow-2xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#262b3a] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#059669]/20 text-[#86efac] flex items-center justify-center">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Live In-Doc API Playground</h3>
                      <p className="text-[11px] text-[#94a3b8]">Dispatch live requests using your active Sandbox credentials</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPlayground(false)}
                    className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1f2330] transition-colors"
                  >
                    <X className="h-4 w-4" />
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
            <div className="space-y-3 pb-6 border-b border-[#232736]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${getMethodBadgeClass(currentEndpoint.method)}`}
                >
                  {currentEndpoint.method}
                </span>
                <span className="font-mono text-sm text-white bg-[#171a22] px-3 py-1 rounded-lg border border-[#262b3a] font-semibold">
                  {currentEndpoint.path}
                </span>
                {currentEndpoint.authRequired && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#281e12] text-[#fcd34d] border border-[#4a361e] flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Dual Credential Required
                  </span>
                )}
                {currentEndpoint.method === 'GUIDE' || currentEndpoint.rateLimit?.startsWith('N/A') ? (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#1c1935] text-[#c7d2fe] border border-[#362f62] flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#818cf8]" />
                    {currentEndpoint.rateLimit || 'N/A (Architecture Guide • 500 req/min API Quota)'}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#181b24] text-white border border-[#2a3142]">
                    Rate Limit: {currentEndpoint.rateLimit}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{currentEndpoint.title}</h1>
              <p className="text-sm sm:text-base text-[#f1f5f9] leading-relaxed font-normal">{currentEndpoint.summary}</p>
            </div>

            {/* SECTION 2: LONG DESCRIPTION / GUIDE CONTENT */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#818cf8]" />
                Specifications & Architectural Guide
              </h3>
              <div className="bg-[#161821] p-6 sm:p-7 rounded-2xl border border-[#262b3a] shadow-sm">
                <MarkdownRenderer content={currentEndpoint.description} isDark={true} />
              </div>
            </div>

            {/* SECTION 3: HEADERS & AUTHENTICATION SPEC */}
            {currentEndpoint.headers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#86efac]" />
                  Required HTTP Headers
                </h3>
                <div className="border border-[#262b3a] rounded-2xl overflow-hidden bg-[#161821]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#191d28] border-b border-[#262b3a] text-white font-bold">
                        <th className="p-3.5">Header Name</th>
                        <th className="p-3.5">Sample Value</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5">Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222736] font-mono text-[#f1f5f9]">
                      {currentEndpoint.headers.map((h, i) => (
                        <tr key={i} className="hover:bg-[#1a1e2a] transition-colors">
                          <td className="p-3.5 font-bold text-[#93c5fd]">{h.name}</td>
                          <td className="p-3.5 text-[#cbd5e1] truncate max-w-[200px]">{h.value}</td>
                          <td className="p-3.5 font-sans text-white font-normal">{h.desc}</td>
                          <td className="p-3.5 font-sans">
                            {h.required ? (
                              <span className="text-[#fca5a5] font-bold">Yes</span>
                            ) : (
                              <span className="text-[#94a3b8]">Optional</span>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#7dd3fc]" />
                  Parameters & Payload Attributes
                </h3>
                <div className="border border-[#262b3a] rounded-2xl overflow-hidden bg-[#161821]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#191d28] border-b border-[#262b3a] text-white font-bold">
                        <th className="p-3.5">Field Name</th>
                        <th className="p-3.5">Data Type</th>
                        <th className="p-3.5">Required</th>
                        <th className="p-3.5">Description & Validation Rules</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222736] font-mono text-[#f1f5f9]">
                      {currentEndpoint.params.map((p, i) => (
                        <tr key={i} className="hover:bg-[#1a1e2a] transition-colors">
                          <td className="p-3.5 font-bold text-white">{p.name}</td>
                          <td className="p-3.5 text-[#93c5fd]">{p.type}</td>
                          <td className="p-3.5 font-sans">
                            {p.required ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#291319] text-[#fca5a5] border border-[#4e222d]">
                                Required
                              </span>
                            ) : (
                              <span className="text-[#94a3b8] font-sans text-xs">Optional</span>
                            )}
                          </td>
                          <td className="p-3.5 font-sans text-white leading-relaxed font-normal">
                            {p.desc}
                            {p.enum && (
                              <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px]">
                                {p.enum.map((en, idx) => (
                                  <span key={idx} className="bg-[#1f2433] px-1.5 py-0.5 rounded text-[#cbd5e1] border border-[#2b3345]">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#c4b5fd]" />
                  Executable Code Implementation
                </h3>
                <div className="flex items-center gap-1 bg-[#161821] p-1 rounded-xl border border-[#262b3a] text-xs">
                  {(['curl', 'node', 'python', 'php', 'go', 'java'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-2.5 py-1 rounded-lg uppercase text-[11px] font-bold transition-all ${
                        selectedLang === lang
                          ? 'bg-[#4f46e5] text-white shadow-xs'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-2xl bg-[#0e1015] border border-[#262b3a] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#141720] border-b border-[#242938] text-xs font-mono text-white">
                  <span className="font-bold text-[#cbd5e1]">Language: {selectedLang.toUpperCase()}</span>
                  <button
                    onClick={() => handleCopy(currentEndpoint.snippets[selectedLang], 'Code snippet')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1b1f2b] hover:bg-[#23293a] text-white transition-colors cursor-pointer border border-[#2c3447]"
                  >
                    {copiedLabel === 'Code snippet' ? <Check className="h-3.5 w-3.5 text-[#86efac]" /> : <Copy className="h-3.5 w-3.5 text-[#94a3b8]" />}
                    <span className="text-xs font-semibold">{copiedLabel === 'Code snippet' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-white overflow-x-auto leading-relaxed">
                  <code>{currentEndpoint.snippets[selectedLang]}</code>
                </pre>
              </div>
            </div>

            {/* SECTION 6: SUCCESS & ERROR RESPONSE SCHEMAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Success Response */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#86efac] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Response (200 OK)
                  </span>
                  <button
                    onClick={() => handleCopy(currentEndpoint.responseSuccess, 'Success response')}
                    className="text-[11px] text-[#94a3b8] hover:text-white flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy JSON
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-[#0e1015] border border-[#1f4535]/70 text-[#86efac] font-mono text-xs overflow-x-auto max-h-72">
                  <pre>{currentEndpoint.responseSuccess}</pre>
                </div>
              </div>

              {/* Error Response (if defined) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#fca5a5] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Standard Error (4xx/5xx)
                  </span>
                  <button
                    onClick={() => handleCopy(currentEndpoint.responseError || '{"error": "INVALID_API_KEY"}', 'Error response')}
                    className="text-[11px] text-[#94a3b8] hover:text-white flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy JSON
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-[#0e1015] border border-[#4e222d]/70 text-[#fca5a5] font-mono text-xs overflow-x-auto max-h-72">
                  <pre>{currentEndpoint.responseError || `{\n  "error": "UNAUTHORIZED",\n  "message": "Invalid client_id or client_secret provided.",\n  "status": 401\n}`}</pre>
                </div>
              </div>
            </div>

            {/* SECTION 7: NEXT STEP CALLOUT */}
            <div className="p-6 rounded-2xl bg-[#161821] border border-[#262b3a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-sm">Need help integrating this endpoint?</h4>
                <p className="text-xs text-[#94a3b8] mt-0.5">Explore real-time telemetry, test with live credentials, or generate production API keys in the developer console.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowPlayground(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#181b24] hover:bg-[#1f2330] text-white border border-[#2a3142] transition-colors"
                >
                  Open Sandbox
                </button>
                {onOpenConsole ? (
                  <button
                    onClick={onOpenConsole}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors"
                  >
                    Go to Console
                  </button>
                ) : (
                  <a
                    href="/developer"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors"
                  >
                    Go to Console
                  </a>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};
