import React, { useState, useEffect } from 'react';
import { 
  FileCode, Plus, CheckCircle2, Clock, XCircle, Trash2, Send, 
  Sparkles, RefreshCw, Eye, Copy, Check, Filter, Search, AlertCircle, ShieldCheck
} from 'lucide-react';

interface MessageTemplatesViewProps {
  app: any;
  showToast: (msg: string) => void;
  environment?: 'test' | 'live';
  themeMode?: 'light' | 'dark';
}

interface TemplateItem {
  id: string;
  name: string;
  category: 'AUTHENTICATION' | 'TRANSACTIONAL' | 'SECURITY' | 'MARKETING';
  language: string;
  body: string;
  status: 'approved' | 'pending_review' | 'rejected';
  created_at: number;
  sample_variables?: Record<string, string>;
}

export const MessageTemplatesView: React.FC<MessageTemplatesViewProps> = ({ 
  app, 
  showToast, 
  environment = 'test',
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal: Create Template
  const [isCreating, setIsCreating] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplCategory, setNewTplCategory] = useState<'AUTHENTICATION' | 'TRANSACTIONAL' | 'SECURITY' | 'MARKETING'>('AUTHENTICATION');
  const [newTplLang, setNewTplLang] = useState('en_US');
  const [newTplBody, setNewTplBody] = useState('Your {{app_name}} verification code is {{code}}. Valid for {{expiry_mins}} minutes.');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    app_name: 'Zenoa Platform',
    code: '938104',
    expiry_mins: '10'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: Test Dispatch using Template
  const [selectedTplForTest, setSelectedTplForTest] = useState<TemplateItem | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchOutcome, setDispatchOutcome] = useState<any | null>(null);

  const appId = app?.client_id || app?.id || 'default_app';
  const apiKey = app?.api_key || app?.client_secret || appId;

  useEffect(() => {
    fetchTemplates();
  }, [app]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/templates`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.warn('Fetch templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim() || !newTplBody.trim()) {
      showToast('Template name and body are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/templates/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name: newTplName.trim(),
          category: newTplCategory,
          language: newTplLang,
          body: newTplBody.trim(),
          sample_variables: testVariables
        })
      });

      const data = await res.json();
      if (res.ok && data.template) {
        setTemplates(prev => [data.template, ...prev]);
        setIsCreating(false);
        setNewTplName('');
        showToast(environment === 'test' ? 'Template created & auto-approved in sandbox!' : 'Template submitted for review!');
      } else {
        showToast(data.error || 'Failed to create template');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (tplId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'pending_review' : 'approved';
    try {
      const res = await fetch(`/api/v1/templates/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ template_id: tplId, status: nextStatus })
      });
      if (res.ok) {
        setTemplates(prev => prev.map(t => t.id === tplId ? { ...t, status: nextStatus } : t));
        showToast(`Template status changed to ${nextStatus === 'approved' ? 'Approved' : 'Pending Review'}`);
      }
    } catch (e) {
      showToast('Status update failed');
    }
  };

  const handleDeleteTemplate = async (tplId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/v1/templates/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ template_id: tplId })
      });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== tplId));
        showToast('Template deleted.');
      }
    } catch (e) {
      showToast('Failed to delete template');
    }
  };

  const handleDispatchTest = async () => {
    if (!selectedTplForTest || !testRecipient) {
      showToast('Please provide a recipient phone/username.');
      return;
    }

    setDispatching(true);
    setDispatchOutcome(null);

    try {
      let renderedMessage = selectedTplForTest.body;
      const vars = selectedTplForTest.sample_variables || testVariables;
      for (const [k, v] of Object.entries(vars)) {
        renderedMessage = renderedMessage.replace(new RegExp(`{{${k}}}`, 'g'), v);
      }

      const res = await fetch('/api/v1/bot/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Environment': environment
        },
        body: JSON.stringify({
          recipient: testRecipient.trim(),
          message: renderedMessage,
          template_id: selectedTplForTest.id
        })
      });

      const data = await res.json();
      setDispatchOutcome({
        status_code: res.status,
        success: res.ok,
        rendered_message: renderedMessage,
        response: data
      });
      if (res.ok) {
        showToast('Template message delivered to DM!');
      } else {
        showToast(data.error || 'Dispatch error');
      }
    } catch (e: any) {
      setDispatchOutcome({ status_code: 500, success: false, error: e.message });
      showToast('Network error');
    } finally {
      setDispatching(false);
    }
  };

  const extractVariables = (text: string) => {
    const matches = text.match(/{{([a-zA-Z0-9_-]+)}}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))));
  };

  const renderHighlightedBody = (body: string) => {
    const parts = body.split(/({{[a-zA-Z0-9_-]+}})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span key={idx} className="bg-[#533afd]/15 text-[#533afd] dark:text-[#818cf8] px-1.5 py-0.5 rounded font-mono font-bold text-xs">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const filteredTemplates = templates.filter(t => {
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    }
    return true;
  });

  const approvedCount = templates.filter(t => t.status === 'approved').length;
  const pendingCount = templates.filter(t => t.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#0d253d] dark:text-white">
            <FileCode className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
            Message Templates Manager
          </h2>
          <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
            Standardized, pre-approved message formats for OTPs, transactional receipts, and security alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTemplates}
            className={`p-2.5 rounded-xl shadow-xs transition-colors border cursor-pointer ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-[#94a3b8] hover:text-white' 
                : 'bg-white border-[#e3e8ee] text-slate-600 hover:text-[#0d253d]'
            }`}
            title="Refresh templates"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Submit New Template
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-5 shadow-xs border ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] block">Total Templates</span>
          <div className="text-2xl font-extrabold text-[#0d253d] dark:text-white mt-1">{templates.length}</div>
          <span className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5 block">Across all categories & languages</span>
        </div>

        <div className={`rounded-2xl p-5 shadow-xs border ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block">Approved & Active</span>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">{approvedCount}</div>
          <span className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5 block">Ready for production dispatch</span>
        </div>

        <div className={`rounded-2xl p-5 shadow-xs border ${
          isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block">Pending Review</span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">{pendingCount}</div>
          <span className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-0.5 block">Under automated compliance</span>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className={`rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 border ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
      }`}>
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates by name, keyword, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs outline-none transition-all border ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs outline-none cursor-pointer border ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
            }`}
          >
            <option value="ALL">All Categories</option>
            <option value="AUTHENTICATION">Authentication (OTP)</option>
            <option value="TRANSACTIONAL">Transactional</option>
            <option value="SECURITY">Security</option>
            <option value="MARKETING">Marketing</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs outline-none cursor-pointer border ${
              isDark 
                ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center space-y-3 border ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
          }`}>
            <FileCode className="h-10 w-10 text-slate-400 mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[#0d253d] dark:text-white">No message templates found</p>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] max-w-sm mx-auto">
              Create your first template to ensure compliant, anti-spam message delivery.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 px-4 py-2 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Create Template
            </button>
          </div>
        ) : (
          filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              className={`rounded-2xl p-5 shadow-xs transition-all space-y-4 border ${
                isDark ? 'bg-[#0d1326] border-[#273951] hover:border-[#533afd]/50' : 'bg-white border-[#e3e8ee] hover:border-slate-300'
              }`}
            >
              {/* Header row */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#0d253d] dark:text-white text-sm">{tpl.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isDark ? 'bg-[#121624] text-[#94a3b8] border-[#273951]' : 'bg-[#f6f9fc] text-slate-600 border-[#e3e8ee]'
                  }`}>
                    {tpl.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#533afd]/15 text-[#533afd] dark:text-[#818cf8] border border-[#533afd]/30">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] text-[#64748d] dark:text-[#94a3b8] font-mono">
                    {tpl.language}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    tpl.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' 
                      : tpl.status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                  }`}>
                    {tpl.status === 'approved' ? <CheckCircle2 className="h-3 w-3" /> : tpl.status === 'rejected' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {tpl.status === 'approved' ? 'Approved' : tpl.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                  </span>

                  {/* Sandbox Approval Toggle */}
                  <button
                    onClick={() => handleToggleStatus(tpl.id, tpl.status)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-[#121624] border-[#273951] text-[#94a3b8] hover:text-white' 
                        : 'bg-[#f6f9fc] border-[#e3e8ee] text-slate-600 hover:text-[#533afd]'
                    }`}
                    title="Toggle approval status in test mode"
                  >
                    {tpl.status === 'approved' ? 'Set Pending' : 'Approve Now'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTplForTest(tpl);
                      setDispatchOutcome(null);
                    }}
                    className="px-3 py-1.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="h-3 w-3" /> Test Send
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Template Body */}
              <div className={`p-4 rounded-xl text-xs leading-relaxed font-sans border ${
                isDark ? 'bg-[#121624] border-[#273951] text-slate-200' : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]'
              }`}>
                {renderHighlightedBody(tpl.body)}
              </div>

              {/* Sample Variables */}
              {tpl.sample_variables && Object.keys(tpl.sample_variables).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#64748d] dark:text-[#94a3b8]">
                  <span className="font-semibold text-[#0d253d] dark:text-white">Sample Variables:</span>
                  {Object.entries(tpl.sample_variables).map(([k, v]) => (
                    <span key={k} className={`px-2 py-0.5 rounded border font-mono text-[10px] ${
                      isDark ? 'bg-[#121624] border-[#273951] text-slate-300' : 'bg-white border-[#e3e8ee] text-slate-700'
                    }`}>
                      <strong className="text-[#533afd] dark:text-[#818cf8]">{k}</strong> = "{v}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL: Create New Template */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <div>
                <h3 className="text-lg font-bold text-[#0d253d] dark:text-white">Submit Message Template</h3>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                  Define your template parameters and variable placeholders like <code className="text-[#533afd] dark:text-[#818cf8] font-bold font-mono">&#123;&#123;code&#125;&#125;</code>
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-[#64748d] dark:text-[#94a3b8]">
                    Template Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. login_otp_v1 or order_shipped"
                    value={newTplName}
                    onChange={e => setNewTplName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs outline-none transition-all ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1 text-[#64748d] dark:text-[#94a3b8]">
                    Category
                  </label>
                  <select
                    value={newTplCategory}
                    onChange={e => setNewTplCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
                    }`}
                  >
                    <option value="AUTHENTICATION">Authentication (OTP)</option>
                    <option value="TRANSACTIONAL">Transactional Receipt</option>
                    <option value="SECURITY">Security Alert</option>
                    <option value="MARKETING">Marketing & Updates</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-[#64748d] dark:text-[#94a3b8]">
                  Template Body Text (Use &#123;&#123;variable&#125;&#125; for placeholders)
                </label>
                <textarea
                  rows={4}
                  value={newTplBody}
                  onChange={e => {
                    setNewTplBody(e.target.value);
                    const vars = extractVariables(e.target.value);
                    const newVars: Record<string, string> = {};
                    vars.forEach(v => {
                      newVars[v] = testVariables[v] || `sample_${v}`;
                    });
                    setTestVariables(newVars);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs outline-none transition-all ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                  required
                />
              </div>

              {/* Interactive Variable Value Editor */}
              {extractVariables(newTplBody).length > 0 && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
                }`}>
                  <span className="font-bold block text-xs text-[#0d253d] dark:text-white">
                    Sample Test Variables for Preview:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {extractVariables(newTplBody).map(vName => (
                      <div key={vName} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 font-mono font-semibold text-[#533afd] dark:text-[#818cf8] truncate">{`{{${vName}}}`}:</span>
                        <input
                          type="text"
                          value={testVariables[vName] || ''}
                          onChange={e => setTestVariables({ ...testVariables, [vName]: e.target.value })}
                          className={`flex-1 px-2.5 py-1 rounded-lg border text-xs outline-none ${
                            isDark ? 'bg-[#0c1024] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-Time Rendered Preview */}
              <div className={`p-4 rounded-xl border space-y-1.5 ${
                isDark ? 'bg-[#533afd]/10 border-[#533afd]/30' : 'bg-indigo-50/50 border-indigo-200'
              }`}>
                <span className="font-bold text-xs flex items-center gap-1.5 text-[#533afd] dark:text-[#818cf8]">
                  <Eye className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" /> Live Rendered Message Preview
                </span>
                <p className="text-xs text-[#0d253d] dark:text-white font-sans leading-relaxed">
                  {newTplBody.replace(/{{([a-zA-Z0-9_-]+)}}/g, (match, v) => testVariables[v] || match)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className={`px-4 py-2 border rounded-xl font-semibold cursor-pointer ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' : 'bg-white border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Test Dispatch Message using Template */}
      {selectedTplForTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
            }`}>
              <div>
                <h3 className="text-base font-bold text-[#0d253d] dark:text-white">Dispatch Test Template Message</h3>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">Template: <code className="font-mono text-[#533afd] dark:text-[#818cf8]">{selectedTplForTest.name}</code></p>
              </div>
              <button
                onClick={() => setSelectedTplForTest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-[#64748d] dark:text-[#94a3b8]">
                  Recipient Username or Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +919876543210 or developer"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none transition-all ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider mb-1 text-[#64748d] dark:text-[#94a3b8]">
                  Rendered Preview to Send
                </label>
                <div className={`p-3.5 rounded-xl border text-xs font-sans leading-relaxed ${
                  isDark ? 'bg-[#121624] border-[#273951] text-slate-200' : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d]'
                }`}>
                  {selectedTplForTest.body.replace(/{{([a-zA-Z0-9_-]+)}}/g, (match, v) => (selectedTplForTest.sample_variables?.[v] || testVariables[v] || match))}
                </div>
              </div>

              {dispatchOutcome && (
                <div className={`p-3.5 rounded-xl border text-xs font-mono overflow-x-auto ${
                  dispatchOutcome.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                }`}>
                  {JSON.stringify(dispatchOutcome, null, 2)}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTplForTest(null)}
                  className={`px-4 py-2 border rounded-xl font-semibold cursor-pointer ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white hover:bg-[#1c1e54]' : 'bg-white border-[#e3e8ee] text-[#0d253d] hover:bg-[#f6f9fc]'
                  }`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDispatchTest}
                  disabled={dispatching || !testRecipient}
                  className="px-5 py-2 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {dispatching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {dispatching ? 'Sending...' : 'Send Live Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
