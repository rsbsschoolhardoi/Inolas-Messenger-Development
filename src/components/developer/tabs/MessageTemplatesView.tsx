import React, { useState, useEffect } from 'react';
import { 
  FileCode, Plus, CheckCircle2, Clock, XCircle, Trash2, Send, 
  Sparkles, RefreshCw, Eye, Copy, Check, Filter, Search, AlertCircle, ShieldCheck
} from 'lucide-react';

interface MessageTemplatesViewProps {
  app: any;
  showToast: (msg: string) => void;
  environment?: 'test' | 'live';
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

export const MessageTemplatesView: React.FC<MessageTemplatesViewProps> = ({ app, showToast, environment = 'test' }) => {
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

  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      // Render body with variables
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

  // Extract variables from body (e.g. {{code}}, {{name}})
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
          <span key={idx} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold text-xs">
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCode className="h-6 w-6 text-indigo-600" />
            Message Templates Manager
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Standardized, pre-approved message formats for OTPs, transactional receipts, and security alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTemplates}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
            title="Refresh templates"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Submit New Template
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Templates</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{templates.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all categories & languages</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">Approved & Active</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Ready for production dispatch</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">Pending Review</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Under automated compliance inspection</span>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates by name, keyword, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-500"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-500"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <FileCode className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No message templates found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first template to ensure compliant, anti-spam message delivery.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
            >
              Create Template
            </button>
          </div>
        ) : (
          filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900 text-sm">{tpl.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {tpl.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tpl.language}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    tpl.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : tpl.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {tpl.status === 'approved' ? <CheckCircle2 className="h-3 w-3" /> : tpl.status === 'rejected' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {tpl.status === 'approved' ? 'Approved' : tpl.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                  </span>

                  {/* Sandbox Approval Toggle */}
                  <button
                    onClick={() => handleToggleStatus(tpl.id, tpl.status)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-lg border border-slate-200 hover:border-indigo-200 bg-slate-50 transition-colors"
                    title="Toggle approval status in test mode"
                  >
                    {tpl.status === 'approved' ? 'Set Pending' : 'Approve Now'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTplForTest(tpl);
                      setDispatchOutcome(null);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Send className="h-3 w-3" /> Test Send
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Template Body */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                {renderHighlightedBody(tpl.body)}
              </div>

              {/* Sample Variables */}
              {tpl.sample_variables && Object.keys(tpl.sample_variables).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Sample Variables:</span>
                  {Object.entries(tpl.sample_variables).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                      <strong className="text-indigo-600">{k}</strong> = "{v}"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submit Message Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define your template parameters and variable placeholders like <code className="text-indigo-600 font-bold font-mono">&#123;&#123;code&#125;&#125;</code>
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. login_otp_v1 or order_shipped"
                    value={newTplName}
                    onChange={e => setNewTplName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newTplCategory}
                    onChange={e => setNewTplCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 outline-none"
                  >
                    <option value="AUTHENTICATION">Authentication (OTP)</option>
                    <option value="TRANSACTIONAL">Transactional Receipt</option>
                    <option value="SECURITY">Security Alert</option>
                    <option value="MARKETING">Marketing & Updates</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              {/* Interactive Variable Value Editor */}
              {extractVariables(newTplBody).length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-slate-700 block text-xs">
                    Sample Test Variables for Preview:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {extractVariables(newTplBody).map(vName => (
                      <div key={vName} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 font-mono font-semibold text-indigo-600 truncate">{`{{${vName}}}`}:</span>
                        <input
                          type="text"
                          value={testVariables[vName] || ''}
                          onChange={e => setTestVariables({ ...testVariables, [vName]: e.target.value })}
                          className="flex-1 px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-Time Rendered Preview */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-1.5">
                <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-indigo-600" /> Live Rendered Message Preview
                </span>
                <p className="text-xs text-slate-800 font-sans leading-relaxed">
                  {newTplBody.replace(/{{([a-zA-Z0-9_-]+)}}/g, (match, v) => testVariables[v] || match)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Dispatch Test Template Message</h3>
                <p className="text-xs text-slate-500 mt-0.5">Template: <code className="font-mono text-indigo-600">{selectedTplForTest.name}</code></p>
              </div>
              <button
                onClick={() => setSelectedTplForTest(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Username or Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +919876543210 or developer"
                  value={testRecipient}
                  onChange={e => setTestRecipient(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rendered Preview to Send
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
                  {selectedTplForTest.body.replace(/{{([a-zA-Z0-9_-]+)}}/g, (match, v) => (selectedTplForTest.sample_variables?.[v] || testVariables[v] || match))}
                </div>
              </div>

              {dispatchOutcome && (
                <div className={`p-3 rounded-xl border text-xs font-mono overflow-x-auto ${
                  dispatchOutcome.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {JSON.stringify(dispatchOutcome, null, 2)}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTplForTest(null)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDispatchTest}
                  disabled={dispatching || !testRecipient}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50"
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
