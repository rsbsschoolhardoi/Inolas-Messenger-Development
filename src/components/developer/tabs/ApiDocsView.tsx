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
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ app, showToast }) => {
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
    'oauth-sso': true,
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
      case 'getting-started': return <Rocket className="h-4 w-4 text-indigo-500" />;
      case 'otp-service': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'bot-messaging': return <Bot className="h-4 w-4 text-blue-500" />;
      case 'message-templates': return <FileCode className="h-4 w-4 text-amber-500" />;
      case 'webhooks-guide': return <Webhook className="h-4 w-4 text-purple-500" />;
      case 'oauth-sso': return <Key className="h-4 w-4 text-rose-500" />;
      case 'billing-quotas': return <CreditCard className="h-4 w-4 text-cyan-500" />;
      case 'error-codes': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <BookOpen className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Google Docs Header Style */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>OFFICIAL SPECIFICATION v2.4</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold rounded-full">
                99.99% SLA
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Zenoa Developer Documentation
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Exhaustive technical reference, interactive request sandbox, cryptographic authentication specs, and multi-language SDK examples.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPlayground(!showPlayground)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                showPlayground
                  ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Terminal className="h-4 w-4 text-indigo-500" />
              <span>{showPlayground ? 'Close Sandbox' : 'Open API Sandbox'}</span>
            </button>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="Open documentation in a separate standalone fullscreen page"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Full Page Docs (/docs)</span>
            </a>

            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Copy className="h-4 w-4 text-slate-500" />
              <span>Copy Docs (MD)</span>
            </button>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 relative">
          <div className="relative max-w-2xl">
            <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search all endpoints, parameters, error codes, and authentication guides..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Documentation 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Multi-level Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
            <div className="flex items-center justify-between px-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
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
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.id)}
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                          {cat.name}
                        </span>
                      </div>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="pl-3 space-y-0.5 border-l-2 border-slate-100 ml-3.5">
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
                              className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/80 shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="text-[12px] truncate">{sec.title}</div>
                                {sec.method !== 'GUIDE' && (
                                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                    {sec.method} {sec.path}
                                  </div>
                                )}
                              </div>
                              {sec.method !== 'GUIDE' && (
                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  sec.method === 'POST' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
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
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="h-3 w-3 text-emerald-400" />
                  Your Active API Key
                </span>
                <button
                  onClick={() => handleCopy(app?.active_client_id || app?.client_id || 'sample_key', 'Active Key')}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold"
                >
                  {copiedLabel === 'Active Key' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-[11px] text-emerald-400 truncate bg-slate-950 p-2 rounded-lg border border-slate-800">
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xs space-y-8">
            
            {/* Header section of selected doc */}
            <div className="space-y-4 pb-6 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {currentEndpoint.category}
                </span>

                {currentEndpoint.method !== 'GUIDE' && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                    currentEndpoint.method === 'POST' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {currentEndpoint.method}
                  </span>
                )}

                {currentEndpoint.authRequired && (
                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-amber-600" />
                    Bearer Auth Required
                  </span>
                )}

                <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-mono">
                  Cost: {currentEndpoint.cost}
                </span>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {currentEndpoint.title}
                </h2>
                <p className="text-sm md:text-base text-slate-600 mt-2 leading-relaxed">
                  {currentEndpoint.summary}
                </p>
              </div>

              {currentEndpoint.method !== 'GUIDE' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 font-mono text-xs text-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-indigo-600">{currentEndpoint.method}</span>
                    <span className="truncate">{baseUrl}{currentEndpoint.path}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`${baseUrl}${currentEndpoint.path}`, 'Endpoint URL')}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-sans font-semibold text-xs flex items-center gap-1 shadow-2xs shrink-0"
                  >
                    {copiedLabel === 'Endpoint URL' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedLabel === 'Endpoint URL' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Markdown Description */}
            <div className="prose prose-slate max-w-none text-xs md:text-sm text-slate-700 leading-relaxed space-y-4">
              {currentEndpoint.description.split('\n\n').map((paragraph, pIdx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={pIdx} className="text-base font-bold text-slate-900 mt-6 mb-2">
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
                    <div key={pIdx} className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-xl text-xs my-3 font-medium">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Request Headers</span>
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Header Name</th>
                        <th className="p-3">Sample Value</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {currentEndpoint.headers.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{h.name}</td>
                          <td className="p-3 text-indigo-600 truncate max-w-xs">{h.value}</td>
                          <td className="p-3 font-sans">
                            {h.required ? (
                              <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Required</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Optional</span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-slate-600">{h.desc}</td>
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Payload & Query Parameters</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">JSON Body</span>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Default</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {currentEndpoint.params.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-indigo-600">{p.type}</td>
                          <td className="p-3 font-sans">
                            {p.required ? (
                              <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Required</span>
                            ) : (
                              <span className="text-slate-400 text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Optional</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500">{p.default || '-'}</td>
                          <td className="p-3 font-sans text-slate-600">{p.desc}</td>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Production Implementation Snippets</span>
                </h4>

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(['curl', 'node', 'python', 'php', 'go', 'java'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        selectedLang === lang 
                          ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'node' ? 'Node.js' : lang === 'curl' ? 'cURL' : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
                <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
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
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Success Response (HTTP 200 OK)</span>
                  </h4>
                  <button
                    onClick={() => handleCopy(currentEndpoint.responseSuccess, 'Success Schema')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {copiedLabel === 'Success Schema' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-64 overflow-y-auto shadow-2xs">
                  {currentEndpoint.responseSuccess}
                </pre>
              </div>

              {currentEndpoint.responseError && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Error Response (HTTP 4xx / 5xx)</span>
                    </h4>
                    <button
                      onClick={() => handleCopy(currentEndpoint.responseError!, 'Error Schema')}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {copiedLabel === 'Error Schema' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-rose-300 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-64 overflow-y-auto shadow-2xs">
                    {currentEndpoint.responseError}
                  </pre>
                </div>
              )}
            </div>

            {/* Implementation Notes & Security Guidelines */}
            {currentEndpoint.notes && currentEndpoint.notes.length > 0 && (
              <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>Developer Best Practices & Security Notes</span>
                </h5>
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-indigo-900">
                  {currentEndpoint.notes.map((note, nIdx) => (
                    <li key={nIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Floating Jump Navigation */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const currentIdx = allEndpoints.findIndex(e => e.id === currentEndpoint.id);
                  if (currentIdx > 0) {
                    setSelectedEndpointId(allEndpoints[currentIdx - 1].id);
                  }
                }}
                disabled={allEndpoints.findIndex(e => e.id === currentEndpoint.id) === 0}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
              >
                <span>← Previous Guide</span>
              </button>

              <button
                onClick={() => setShowPlayground(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
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
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
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
