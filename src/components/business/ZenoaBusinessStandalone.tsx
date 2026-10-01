import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, MessageSquare, Check, Search, 
  Send, RefreshCw, Copy, Sliders, Sun, 
  Moon, ChevronLeft, Volume2, VolumeX, X, Info, 
  ArrowUpRight
} from 'lucide-react';
import { 
  BusinessApp, BusinessConversation, BusinessMessage, 
  ConversationStatus, UserData 
} from '../../types';

interface ZenoaBusinessStandaloneProps {
  currentUser?: UserData | null;
  onNavigateToMessenger?: () => void;
  onNavigateToDeveloper?: () => void;
  onNavigateToDemo?: () => void;
}

export const ZenoaBusinessStandalone: React.FC<ZenoaBusinessStandaloneProps> = ({
  currentUser,
  onNavigateToMessenger,
  onNavigateToDeveloper,
  onNavigateToDemo
}) => {
  const currentUsername = currentUser?.username || 'merchant';
  const currentDisplayName = currentUser?.display_name || currentUser?.username || 'Business Admin';

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_biz_theme') || localStorage.getItem('zenoa_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('zenoa_biz_theme', themeMode);
    } catch {}
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Core Data State
  const [app, setApp] = useState<BusinessApp | null>(null);
  const [conversations, setConversations] = useState<BusinessConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BusinessMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrack, setFilterTrack] = useState<'all' | 'vip_human' | 'ai_managed' | 'resolved'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMobileInspector, setShowMobileInspector] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings State
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [appNameInput, setAppNameInput] = useState('');
  const [quickRepliesList, setQuickRepliesList] = useState<Array<{ id: string; shortcut: string; title: string; content: string }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Audio indicator for escalated tickets
  const playVIPAudioChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}
  };

  // 1. Fetch App Info
  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/business/apps?owner_username=${encodeURIComponent(currentUsername)}`);
      const data = await res.json();
      if (data.success && data.app) {
        setApp(data.app);
        setAiSystemPrompt(data.app.ai_system_prompt || '');
        setAppNameInput(data.app.app_name || '');
        setQuickRepliesList(data.app.quick_replies || []);
        return data.app;
      }
    } catch (err) {
      console.warn('Failed to load business app:', err);
    }
    return null;
  };

  // 2. Fetch Conversations List
  const fetchConversations = async (targetAppId?: string) => {
    const aid = targetAppId || app?.id;
    if (!aid) return;
    try {
      const res = await fetch(`/api/business/conversations?app_id=${encodeURIComponent(aid)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const loadedApp = await fetchApp();
      if (loadedApp) {
        await fetchConversations(loadedApp.id);
      }
    };
    init();
  }, [currentUsername]);

  // Periodic polling every 3.5s
  useEffect(() => {
    if (!app?.id) return;
    const interval = setInterval(() => {
      fetchConversations(app.id);
    }, 3500);
    return () => clearInterval(interval);
  }, [app?.id]);

  // Load Messages for Selected Conversation
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/business/conversations/${selectedConvId}/messages`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.warn('Failed to load messages:', err);
      }
    };
    loadMessages();
  }, [selectedConvId]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find(c => c.id === selectedConvId) || null;

  const [isAgentThrottled, setIsAgentThrottled] = useState(false);
  const lastAgentSendRef = useRef<number>(0);

  // Send Agent Reply
  const handleSendAgentReply = async (textToSend?: string) => {
    const text = (textToSend || replyText).trim();
    if (!text || !selectedConvId || !app) return;

    const now = Date.now();
    const cooldownMs = app.rate_limiting?.agent_cooldown_ms ?? 700;
    if (now - lastAgentSendRef.current < cooldownMs) {
      showToast(`Throttle active: wait ${cooldownMs}ms between replies to prevent loop flooding.`);
      return;
    }

    lastAgentSendRef.current = now;
    setIsAgentThrottled(true);
    setTimeout(() => setIsAgentThrottled(false), cooldownMs);

    if (!textToSend) setReplyText('');

    const newMsg: BusinessMessage = {
      id: 'msg_' + Date.now(),
      conversation_id: selectedConvId,
      app_id: app.id,
      sender_type: 'agent',
      sender_name: currentDisplayName,
      sender_id: currentUsername,
      text,
      created_at: Date.now(),
      read: true
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      const res = await fetch(`/api/business/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sender_type: 'agent',
          sender_name: currentDisplayName,
          sender_id: currentUsername,
          app_id: app.id
        })
      });

      const data = await res.json();
      if (res.status === 429 || data.rate_limited) {
        showToast(data.error || 'Rate limit active: please slow down.');
        // Rollback optimistic message if rejected
        setMessages(prev => prev.filter(m => m.id !== newMsg.id));
        return;
      }

      setConversations(prev => prev.map(c => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            last_message: text,
            last_message_time: Date.now(),
            last_sender: 'agent',
            status: c.status === 'pending_human' ? 'open' : c.status
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to dispatch agent message:', err);
    }
  };

  // Toggle AI Active for current conversation
  const handleToggleAi = async () => {
    if (!activeConversation) return;
    const newAiState = !activeConversation.ai_active;

    try {
      await fetch(`/api/business/conversations/${activeConversation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_active: newAiState })
      });

      setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, ai_active: newAiState } : c));
      showToast(newAiState ? 'Automated co-pilot active' : 'Automated assistant paused');
    } catch (err) {
      console.error(err);
    }
  };

  // Update Conversation Status
  const handleUpdateStatus = async (status: ConversationStatus) => {
    if (!activeConversation) return;

    try {
      await fetch(`/api/business/conversations/${activeConversation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, status } : c));
      showToast(`Status updated to ${status}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;

    try {
      const updated = {
        ...app,
        app_name: appNameInput.trim() || app.app_name,
        ai_system_prompt: aiSystemPrompt.trim(),
        quick_replies: quickRepliesList
      };

      const res = await fetch('/api/business/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setApp(data.app);
        setShowSettingsModal(false);
        showToast('Settings updated');
      }
    } catch (err) {
      console.error('Settings save failed:', err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customer?.customer_name?.toLowerCase().includes(q);
      const matchOrder = c.customer?.order_id?.toLowerCase().includes(q);
      const matchEmail = c.customer?.customer_email?.toLowerCase().includes(q);
      const matchMsg = c.last_message?.toLowerCase().includes(q);
      if (!matchName && !matchOrder && !matchEmail && !matchMsg) return false;
    }

    if (filterTrack === 'vip_human') {
      return (c as any).needs_human === true || c.status === 'pending_human' || c.status === 'open' || c.intent === 'post_purchase_issue' || c.priority === 'high' || c.priority === 'urgent';
    }
    if (filterTrack === 'ai_managed') {
      return (c as any).needs_human !== true && c.status !== 'pending_human' && (c.ai_active || c.status === 'automated');
    }
    if (filterTrack === 'resolved') {
      return c.status === 'resolved' || c.status === 'closed';
    }
    return true;
  });

  const vipCount = conversations.filter(c => (c as any).needs_human === true || c.status === 'pending_human' || c.status === 'open' || c.intent === 'post_purchase_issue' || c.priority === 'high').length;
  const aiCount = conversations.filter(c => (c as any).needs_human !== true && c.status !== 'pending_human' && (c.ai_active || c.status === 'automated')).length;
  const resolvedCount = conversations.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  const embedScriptTag = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://zenoa.in'}/widget/live-chat.js" 
  data-app-id="${app?.id || 'biz_default'}" 
  data-primary-color="#18181b" 
  data-position="bottom-right"
  async>
</script>`;

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden ${
      themeMode === 'dark' ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-[#fafafa] text-[#09090b]'
    }`}>
      
      {/* 1. TOP MINIMAL HEADER */}
      <header className={`h-14 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 z-30 transition-colors ${
        themeMode === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        {/* BRAND & ROUTING */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-semibold text-xs">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-white">
                Zenoa Business
              </span>
              <span className="hidden sm:inline text-xs text-zinc-400 font-mono">
                / {app?.app_name || 'Store Console'}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

          {/* SECONDARY ROUTE SHORTCUTS */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <button
              onClick={() => onNavigateToDemo ? onNavigateToDemo() : (window.location.href = '/widget-demo')}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Widget Demo</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => onNavigateToDeveloper ? onNavigateToDeveloper() : (window.location.href = '/developer')}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Developer Portal
            </button>
            <button
              onClick={() => onNavigateToMessenger ? onNavigateToMessenger() : (window.location.href = '/app')}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Messenger
            </button>
          </nav>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? 'border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
            }`}
            title={soundEnabled ? 'Sound alerts active' : 'Sound alerts muted'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Toggle color theme"
          >
            {themeMode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 transition-colors cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* 2. ADAPTIVE RESPONSIVE WORKSPACE CONTAINER */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* PANE 1: CONVERSATIONS INBOX */}
        <aside className={`flex flex-col shrink-0 border-r transition-colors ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex w-full md:w-72 lg:w-80'
        } ${themeMode === 'dark' ? 'bg-[#0f0f12] border-zinc-800' : 'bg-white border-zinc-200'}`}>
          
          {/* SEARCH & FILTERS */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inquiries, orders..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors"
              />
            </div>

            {/* MINIMAL FILTER TABS */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
              {[
                { id: 'all', label: 'All', count: conversations.length },
                { id: 'vip_human', label: 'Priority', count: vipCount },
                { id: 'ai_managed', label: 'Automated', count: aiCount },
                { id: 'resolved', label: 'Resolved', count: resolvedCount },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTrack(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    filterTrack === tab.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* CONVERSATION CARDS */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 overscroll-contain">
            {filteredConversations.length === 0 ? (
              <div className="py-12 px-4 text-center text-zinc-400">
                <MessageSquare className="h-5 w-5 mx-auto opacity-30 mb-2" />
                <p className="text-xs font-medium">No inquiries in this view.</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const isPriority = conv.intent === 'post_purchase_issue' || conv.status === 'pending_human';

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setMobileView('chat');
                    }}
                    className={`w-full p-2.5 sm:p-3 rounded-lg cursor-pointer transition-colors text-left border ${
                      isSelected
                        ? 'bg-zinc-100/90 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700'
                        : isPriority
                          ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          : 'bg-white dark:bg-[#0f0f12] border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          conv.status === 'resolved' 
                            ? 'bg-zinc-400' 
                            : isPriority 
                              ? 'bg-zinc-900 dark:bg-white' 
                              : 'bg-zinc-400'
                        }`} />
                        <p className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">
                          {conv.customer?.customer_name || 'Guest'}
                        </p>
                      </div>

                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        {new Date(conv.last_message_time || conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
                        {conv.customer?.order_id || conv.customer?.customer_email || 'Session'}
                      </p>

                      {isPriority ? (
                        <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          Priority
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-400">
                          {conv.ai_active ? 'Automated' : 'Manual'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate mt-1">
                      {conv.last_message || 'Inquiry created'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* PANE 2: ACTIVE CONVERSATION */}
        <section className={`flex-1 flex flex-col min-w-0 min-h-0 ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        } ${themeMode === 'dark' ? 'bg-[#09090b]' : 'bg-[#fafafa]'}`}>
          
          {activeConversation ? (
            <>
              {/* CHAT HEADER */}
              <div className={`h-14 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 ${
                themeMode === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                    title="Back to inquiries"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                        {activeConversation.customer?.customer_name || 'Customer'}
                      </h2>
                      {activeConversation.customer?.order_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {activeConversation.customer.order_id}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      {activeConversation.customer?.customer_email || 'No email provided'}
                    </p>
                  </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleAi}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      activeConversation.ai_active
                        ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    {activeConversation.ai_active ? 'Automated' : 'Manual'}
                  </button>

                  {activeConversation.status !== 'resolved' ? (
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus('open')}
                      className="px-3 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      Reopen
                    </button>
                  )}

                  <button
                    onClick={() => setShowMobileInspector(prev => !prev)}
                    className="lg:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                    title="Toggle context"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* MESSAGES AREA */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {messages.map(msg => {
                  const isAgent = msg.sender_type === 'agent';
                  const isAi = msg.sender_type === 'ai';
                  const isSystem = msg.sender_type === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-1.5">
                        <span className="inline-block py-1 px-2.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[10px] text-zinc-400">
                          {isAgent 
                            ? msg.sender_name 
                            : (isAi ? 'Automated Assistant' : (msg.sender_name || 'Customer'))}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div 
                        className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                          isAgent
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : isAi
                              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60'
                              : 'bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* CANNED REPLIES */}
              {quickRepliesList.length > 0 && (
                <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-[#121215]">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 shrink-0">Canned:</span>
                  {quickRepliesList.map(qr => (
                    <button
                      key={qr.id}
                      onClick={() => handleSendAgentReply(qr.content)}
                      disabled={isAgentThrottled}
                      className="px-2.5 py-1 rounded text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {qr.title}
                    </button>
                  ))}
                </div>
              )}

              {/* COMPOSER */}
              <form 
                onSubmit={e => { e.preventDefault(); handleSendAgentReply(); }} 
                className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={isAgentThrottled ? "Debounce active..." : "Type reply to customer..."}
                  disabled={isAgentThrottled}
                  className="flex-1 px-3.5 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white transition-colors disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isAgentThrottled}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 disabled:opacity-40 text-white dark:text-zinc-900 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isAgentThrottled ? "Sending..." : "Send"}</span>
                  <Send className="h-3 w-3" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-2">
              <MessageSquare className="h-6 w-6 opacity-30" />
              <h3 className="font-semibold text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                No Inquiry Selected
              </h3>
              <p className="text-xs max-w-xs">
                Select a conversation from the left to view customer context and reply.
              </p>
            </div>
          )}
        </section>

        {/* PANE 3: CUSTOMER CONTEXT INSPECTOR (Desktop: Fixed sidebar, Mobile/Tablet: Slide-Over) */}
        {activeConversation && (
          <aside className={`border-l flex flex-col shrink-0 overflow-y-auto p-4 sm:p-5 space-y-4 transition-colors ${
            showMobileInspector
              ? 'absolute inset-0 z-40 bg-white dark:bg-[#0f0f12] w-full'
              : 'hidden lg:flex w-72'
          } ${themeMode === 'dark' ? 'bg-[#0f0f12] border-zinc-800' : 'bg-white border-zinc-200'}`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                Customer Context
              </h3>
              {showMobileInspector && (
                <button 
                  onClick={() => setShowMobileInspector(false)}
                  className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* IDENTITY DETAILS */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-zinc-400 text-[10px] font-mono block">Name</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {activeConversation.customer?.customer_name || 'Guest User'}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] font-mono block">Email</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {activeConversation.customer?.customer_email || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] font-mono block">Phone</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {activeConversation.customer?.customer_phone || 'Not provided'}
                </span>
              </div>
            </div>

            {/* ORDER DATA */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <h4 className="text-[10px] font-semibold text-zinc-400 font-mono uppercase">
                Order Status
              </h4>

              {activeConversation.customer?.order_id ? (
                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-medium text-zinc-900 dark:text-white">
                      {activeConversation.customer.order_id}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {activeConversation.customer.order_status || 'Tracking'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Status: {activeConversation.customer.order_status || 'In Transit'}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400">No linked order for this inquiry.</p>
              )}

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-zinc-400">Cart Total:</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  {activeConversation.customer?.cart_value || '0.00'}
                </span>
              </div>
            </div>

            {/* SESSION TELEMETRY */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <h4 className="text-[10px] font-semibold text-zinc-400 font-mono uppercase">
                Session Telemetry
              </h4>

              <div>
                <span className="text-zinc-400 text-[10px] font-mono block">Location</span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {activeConversation.customer?.location || 'Verified IP'}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] font-mono block">Device</span>
                <span className="text-zinc-800 dark:text-zinc-200 truncate block">
                  {activeConversation.customer?.device_type || 'Web Client'}
                </span>
              </div>
            </div>

            {/* INTEGRATION SNIPPET */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 block">
                Store Widget Script
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(embedScriptTag);
                  setCopiedCode(true);
                  showToast('Script tag copied');
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="w-full py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Script Tag'}</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* 3. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                Store Configuration
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Store Display Name
                </label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={e => setAppNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Automated Assistant Knowledge Context
                </label>
                <textarea
                  rows={4}
                  value={aiSystemPrompt}
                  onChange={e => setAiSystemPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-mono text-xs outline-none focus:border-zinc-400"
                  placeholder="Define return windows, shipping guidelines, sizing specs..."
                />
              </div>

              <div>
                <label className="font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Embeddable HTML Script
                </label>
                <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                  {embedScriptTag}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-1.5 rounded-lg font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CALM TOAST */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium shadow-md border border-zinc-700 flex items-center gap-1.5">
          <Check className="h-3 w-3 text-zinc-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
