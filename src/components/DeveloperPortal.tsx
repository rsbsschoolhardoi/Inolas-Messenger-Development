import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { Terminal, Plus, Key, Copy, Check, ArrowLeft, Bot, Shield, Code, Server, BarChart3, History, Lock, FileText, ExternalLink, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { UserData } from '../types';

interface DeveloperPortalProps {
  currentUser: UserData;
  onBack: () => void;
}

type TabType = 'apps' | 'analytics' | 'otp' | 'docs' | 'logs' | 'settings';

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({ currentUser, onBack }) => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('apps');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  
  // App Creation/Settings State
  const [isCreating, setIsCreating] = useState(false);
  const [appName, setAppName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Test/Automation State
  const [testRecipient, setTestRecipient] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [otpRecipient, setOtpRecipient] = useState("");
  const [otpCodeToVerify, setOtpCodeToVerify] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Data State
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchAppData();
    }
  }, [selectedAppId, activeTab]);

  const fetchApps = async () => {
    try {
      if (!currentUser?.username) {
        setLoading(false);
        return;
      }
      const q = query(collection(db, 'developer_apps'), where('owner', '==', currentUser.username));
      const snap = await getDocs(q);
      const fetchedApps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApps(fetchedApps);
      if (fetchedApps.length > 0 && !selectedAppId) {
        setSelectedAppId(fetchedApps[0].id);
      }
    } catch (err) {
      console.error("Error fetching apps:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppData = async () => {
    if (!selectedAppId) return;
    const selectedApp = apps.find(a => a.id === selectedAppId);
    if (!selectedApp) return;

    try {
      if (activeTab === 'settings') {
        setWebhookUrl(selectedApp.webhook_url || '');
        setAppName(selectedApp.app_name || '');
      } else if (activeTab === 'analytics') {
        const res = await fetch('/api/v1/apps/analytics', {
          headers: { 'Authorization': `Bearer ${selectedApp.api_key}` }
        });
        const data = await res.json();
        setAnalytics(data.data);
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/v1/apps/logs', {
          headers: { 'Authorization': `Bearer ${selectedApp.api_key}` }
        });
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching app data:", err);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !botUsername.trim()) return;
    
    setIsCreating(true);
    try {
      const newApiKey = "zen_live_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      const formattedBotUsername = botUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

      const appRef = doc(collection(db, 'developer_apps'));
      await setDoc(appRef, {
        owner: currentUser.username,
        app_name: appName.trim(),
        bot_username: formattedBotUsername,
        api_key: newApiKey,
        created_at: serverTimestamp(),
        status: 'active'
      });

      const botRef = doc(db, 'users', formattedBotUsername);
      await setDoc(botRef, {
        username: formattedBotUsername,
        display_name: appName.trim(),
        is_service_account: true,
        followers: [],
        following: [],
        created_at: serverTimestamp()
      });

      setAppName('');
      setBotUsername('');
      await fetchApps();
    } catch (err) {
      console.error("Error creating app:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSettings = async () => {
    const selectedApp = apps.find(a => a.id === selectedAppId);
    if (!selectedApp) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/apps/update", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${selectedApp.api_key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          app_name: appName
        })
      });
      if (res.ok) {
        await fetchApps();
        alert("Settings updated successfully!");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApiRequest = async (type: 'send_message' | 'send_otp' | 'verify_otp') => {
    const selectedApp = apps.find(a => a.id === selectedAppId);
    if (!selectedApp) return;

    setTestLoading(true);
    setTestResult(null);

    let url = "/api/v1/messages/send";
    let body: any = { recipient: testRecipient, message: testMessage };

    if (type === 'send_otp') {
      url = "/api/v1/otp/send";
      body = { recipient: otpRecipient };
    } else if (type === 'verify_otp') {
      url = "/api/v1/otp/verify";
      body = { recipient: otpRecipient, code: otpCodeToVerify };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${selectedApp.api_key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setTestResult({ status: res.status, data });
      if (res.status === 200) fetchAppData();
    } catch (err: any) {
      setTestResult({ status: 500, data: { error: err.message } });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0f19] overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Developer Console</h1>
          </div>
        </div>
        
        {selectedApp && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Bot className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold dark:text-white">@{selectedApp.bot_username}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-57px)]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col gap-1 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">Main Menu</p>
          {[
            { id: 'apps', icon: Server, label: 'Applications' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'otp', icon: Lock, label: 'OTP Automation' },
            { id: 'logs', icon: History, label: 'Activity Logs' },
            { id: 'docs', icon: FileText, label: 'API Docs' },
            { id: 'settings', icon: Shield, label: 'Bot Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}

          <div className="mt-auto pt-4">
             <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-2xl text-white">
                <Shield className="h-5 w-5 text-indigo-400 mb-2" />
                <p className="text-[10px] font-bold opacity-70">SECURE API</p>
                <p className="text-[11px] font-medium leading-relaxed mt-1">All Zenoa Bots are 256-bit encrypted.</p>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* TAB: APPLICATIONS */}
            {activeTab === 'apps' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-indigo-500" />
                    Create New Bot
                  </h3>
                  <form onSubmit={handleCreateApp} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bot Display Name</label>
                        <input 
                          type="text" 
                          value={appName}
                          onChange={e => setAppName(e.target.value)}
                          placeholder="e.g. Finance Notifier" 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bot Username</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-mono">@</span>
                          <input 
                            type="text" 
                            value={botUsername}
                            onChange={e => setBotUsername(e.target.value)}
                            placeholder="finance_bot" 
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isCreating || !appName || !botUsername}
                      className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isCreating ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span>Generate Bot & API Key</span>
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Your Bots</h3>
                  {apps.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                      <Bot className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm font-medium">No bots found. Create one to get started.</p>
                    </div>
                  ) : (
                    apps.map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedAppId(app.id)}
                        className={`bg-white dark:bg-slate-900 border p-5 rounded-3xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm cursor-pointer transition-all ${
                          selectedAppId === app.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedAppId === app.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            <Bot className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white leading-tight">{app.app_name}</h4>
                            <p className="text-xs font-mono text-slate-500 mt-1">@{app.bot_username}</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">API Status</span>
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                            <Activity className="h-3 w-3" />
                            Live & Verified
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Messages</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.messages_sent || 0}</p>
                    <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> All systems normal
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OTP Verified</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.otp_stats?.verified || 0}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-2">From {analytics?.otp_stats?.total || 0} attempts</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{analytics?.otp_stats?.success_rate || 0}%</p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics?.otp_stats?.success_rate || 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="font-black dark:text-white mb-6 flex items-center gap-2">
                     <Lock className="h-5 w-5 text-indigo-500" />
                     Message Sandbox
                   </h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Recipient @username or Mobile</label>
                          <input 
                            type="text" 
                            value={testRecipient}
                            onChange={e => setTestRecipient(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                            placeholder="aman_azad or 919876543210"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Message Content</label>
                          <input 
                            type="text" 
                            value={testMessage}
                            onChange={e => setTestMessage(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                            placeholder="Hello Zenoa!"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleApiRequest('send_message')}
                        disabled={testLoading || !testRecipient}
                        className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {testLoading ? 'Processing...' : 'Execute API Call'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* TAB: OTP AUTOMATION */}
            {activeTab === 'otp' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2rem] text-white shadow-xl">
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    <Shield className="h-7 w-7" />
                    OTP Automation
                  </h3>
                  <p className="text-indigo-100 text-sm max-w-lg mb-6">
                    Professional authentication for your apps. Send 6-digit verification codes to any Zenoa user automatically via your verified bot.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">10-MIN EXPIRY</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">AUTO-GENERATE</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold border border-white/20">SECURE VERIFICATION</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Step 1: Send OTP */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 font-bold text-xs">1</div>
                      <h4 className="font-black dark:text-white">Trigger OTP</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">Send a code to the recipient via your bot. Supports username or mobile.</p>
                    <div className="space-y-4">
                       <input 
                         type="text" 
                         value={otpRecipient}
                         onChange={e => setOtpRecipient(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none"
                         placeholder="Enter @username or mobile"
                       />
                       <button
                         onClick={() => handleApiRequest('send_otp')}
                         disabled={testLoading || !otpRecipient}
                         className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                       >
                         {testLoading ? 'Sending...' : 'Send OTP Code'}
                       </button>
                    </div>
                  </div>

                  {/* Step 2: Verify OTP */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 font-bold text-xs">2</div>
                      <h4 className="font-black dark:text-white">Verify Code</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">Check if the user-entered code is valid.</p>
                    <div className="space-y-4">
                       <input 
                         type="text" 
                         maxLength={6}
                         value={otpCodeToVerify}
                         onChange={e => setOtpCodeToVerify(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none text-center tracking-[0.5em] font-mono text-lg"
                         placeholder="000000"
                       />
                       <button
                         onClick={() => handleApiRequest('verify_otp')}
                         disabled={testLoading || !otpCodeToVerify || !otpRecipient}
                         className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                       >
                         {testLoading ? 'Verifying...' : 'Verify Secure Code'}
                       </button>
                    </div>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-5 rounded-3xl border animate-in slide-in-from-top-2 ${testResult.status === 200 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${testResult.status === 200 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Server Response: {testResult.status}
                      </span>
                      <span className="text-[10px] font-mono opacity-50">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-[11px] font-mono overflow-x-auto dark:text-white">{JSON.stringify(testResult.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACTIVITY LOGS */}
            {activeTab === 'logs' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                   <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="h-4 w-4 text-indigo-500" />
                        Recent Activity
                      </h3>
                      <button onClick={fetchAppData} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-xs italic">No logs found for this bot yet.</div>
                      ) : (
                        logs.map(log => (
                          <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                             <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${log.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {log.action === 'message_send' ? <Bot className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-slate-900 dark:text-white">
                                     {log.action === 'message_send' ? 'Message Sent' : 'OTP Action'} to @{log.recipient}
                                   </p>
                                   <p className="text-[10px] text-slate-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                             </div>
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               {log.status.toUpperCase()}
                             </span>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            )}

            {/* TAB: BOT SETTINGS */}
            {activeTab === 'settings' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="text-lg font-black dark:text-white mb-6 flex items-center gap-2">
                     <Shield className="h-5 w-5 text-indigo-500" />
                     Bot Configuration
                   </h3>
                   
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bot Name</label>
                          <input 
                            type="text" 
                            value={appName}
                            onChange={e => setAppName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="My Bot Name"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Webhook URL (For Incoming Messages)</label>
                          <input 
                            type="url" 
                            value={webhookUrl}
                            onChange={e => setWebhookUrl(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://your-server.com/zenoa-webhook"
                          />
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                            Zenoa will send a POST request to this URL whenever a user sends a message to your bot.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                         <div className="flex items-center gap-3 mb-2">
                            <Bot className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-bold dark:text-white">Bot Username</span>
                         </div>
                         <p className="text-xs font-mono text-slate-500">@{selectedApp.bot_username}</p>
                         <p className="text-[10px] text-slate-400 mt-1">Bot usernames are permanent and cannot be changed.</p>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleUpdateSettings}
                          disabled={isSaving}
                          className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                          {isSaving ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                          Save Changes
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl p-6 border border-red-100 dark:border-red-900/30">
                   <h3 className="text-red-600 dark:text-red-400 font-black flex items-center gap-2 mb-2">
                     <Lock className="h-5 w-5" />
                     Danger Zone
                   </h3>
                   <p className="text-xs text-red-500/70 mb-4">Deleting this bot will revoke all API access and remove it from Zenoa. This action cannot be undone.</p>
                   <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-[11px] font-bold hover:bg-red-700 transition-colors">
                     Delete Bot Forever
                   </button>
                </div>
              </div>
            )}

            {/* TAB: API DOCS */}
            {activeTab === 'docs' && selectedApp && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-12">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-2xl font-black text-slate-900 dark:text-white">API Documentation</h2>
                     <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">v1.1.0</span>
                  </div>

                  <div className="space-y-8">
                     <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Your Authentication</h3>
                        <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[11px] text-slate-300 relative group">
                           <div className="flex items-center gap-2 mb-2 text-indigo-400">
                             <Lock className="h-3.5 w-3.5" />
                             <span className="font-bold">API Key (X-Authorization)</span>
                           </div>
                           <p className="break-all">{selectedApp.api_key}</p>
                           <button 
                             onClick={() => handleCopy(selectedApp.api_key)}
                             className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
                           >
                             {copiedKey === selectedApp.api_key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                           </button>
                        </div>
                     </section>

                     <section>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">Endpoints</h3>
                        
                        <div className="space-y-6">
                           {/* Send Message */}
                           <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                 <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black">POST</span>
                                 <code className="text-xs font-bold text-slate-600 dark:text-slate-400">/api/v1/messages/send</code>
                              </div>
                              <p className="text-xs text-slate-500">Send a direct message to any Zenoa user from your bot.</p>
                              <div className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-slate-300">
                                 <pre>{`{
  "recipient": "username",
  "message": "Hello from my Zenoa Bot!",
  "media_url": "https://example.com/img.png" (optional)
}`}</pre>
                              </div>
                           </div>

                           {/* Send OTP */}
                           <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                 <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black">POST</span>
                                 <code className="text-xs font-bold text-slate-600 dark:text-slate-400">/api/v1/otp/send</code>
                              </div>
                              <p className="text-xs text-slate-500">Generate and send a 6-digit OTP via Zenoa DM.</p>
                              <div className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-slate-300">
                                 <pre>{`{
  "recipient": "username"
}`}</pre>
                              </div>
                           </div>

                           {/* Update Settings */}
                           <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                 <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black">POST</span>
                                 <code className="text-xs font-bold text-slate-600 dark:text-slate-400">/api/v1/apps/update</code>
                              </div>
                              <p className="text-xs text-slate-500">Update bot name or webhook URL.</p>
                              <div className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-slate-300">
                                 <pre>{`{
  "app_name": "New Name",
  "webhook_url": "https://callback.io/hook"
}`}</pre>
                              </div>
                           </div>

                           {/* Verify OTP */}
                           <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                 <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black">POST</span>
                                 <code className="text-xs font-bold text-slate-600 dark:text-slate-400">/api/v1/otp/verify</code>
                              </div>
                              <p className="text-xs text-slate-500">Verify the code entered by the user.</p>
                              <div className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-slate-300">
                                 <pre>{`{
  "recipient": "username",
  "code": "123456"
}`}</pre>
                              </div>
                           </div>
                        </div>
                     </section>

                     <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <a 
                          href="https://ais-dev-mlsq3dnqd2zuthukebbtej-40312758548.asia-southeast1.run.app/api/v1/docs" 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Public JSON Documentation
                        </a>
                     </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
