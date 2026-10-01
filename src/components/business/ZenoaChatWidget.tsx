import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, AlertCircle, Check, 
  X, ShoppingBag, ShieldAlert, RefreshCw,
  User, MessageSquare, Maximize2, Minimize2, Ticket,
  Zap, Headphones, Sparkles
} from 'lucide-react';
import { BusinessApp, BusinessConversation, BusinessMessage, CustomerContext } from '../../types';

export type WidgetCategoryMode = 'bubble_ai_only' | 'contextual_in_app' | 'priority_ticket';

interface ZenoaChatWidgetProps {
  appId?: string;
  widgetMode?: WidgetCategoryMode;
  initialCustomerContext?: CustomerContext;
  primaryColor?: string;
  themeMode?: 'light' | 'dark';
  onClose?: () => void;
  isStandalone?: boolean;
}

export const ZenoaChatWidget: React.FC<ZenoaChatWidgetProps> = ({
  appId = 'biz_default',
  widgetMode,
  initialCustomerContext = {},
  primaryColor = '#18181b',
  themeMode = 'light',
  onClose,
  isStandalone = false
}) => {
  const [app, setApp] = useState<BusinessApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<BusinessConversation | null>(null);
  const [messages, setMessages] = useState<BusinessMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showOrderInputModal, setShowOrderInputModal] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState(initialCustomerContext.order_id || '');
  const [phoneInput, setPhoneInput] = useState(initialCustomerContext.customer_phone || '');
  const [nameInput, setNameInput] = useState(initialCustomerContext.customer_name || '');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine active category mode: prop > query param > app setting > default
  const queryMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') as WidgetCategoryMode : null;
  const activeMode: WidgetCategoryMode = widgetMode || queryMode || (app as any)?.widget_mode || 'contextual_in_app';

  // Toggle fullscreen state and notify parent iframe if embedded
  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({ type: 'zenoa_widget_fullscreen_toggle', fullscreen: nextState }, '*');
    }
  };
  
  // Rate limiting & anti-abuse client guard
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cooldown countdown tick
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          setRateLimitWarning(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Generate or retrieve persistent customer session ID
  const [sessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('zenoa_livechat_session_id');
      if (saved) return saved;
      const created = 'cust_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('zenoa_livechat_session_id', created);
      return created;
    } catch {
      return 'cust_' + Math.random().toString(36).substring(2, 9);
    }
  });

  // Fetch App info
  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/business/apps?app_id=${encodeURIComponent(appId)}`);
        const data = await res.json();
        if (data.success && data.app) {
          setApp(data.app);
        }
      } catch (err) {
        console.warn('Failed to fetch business app:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId]);

  // Load existing conversation or messages if session already active
  useEffect(() => {
    if (!appId || !sessionId) return;
    const fetchExisting = async () => {
      try {
        const convId = `conv_${appId}_${sessionId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const res = await fetch(`/api/business/conversations/${convId}/messages`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
          setActiveConversation({
            id: convId,
            app_id: appId,
            customer_session_id: sessionId,
            customer: initialCustomerContext,
            intent: data.messages.some((m: any) => m.text?.includes('#ORD')) ? 'post_purchase_issue' : 'pre_purchase',
            status: 'open',
            priority: 'normal',
            ai_active: true,
            messages_count: data.messages.length,
            last_message: data.messages[data.messages.length - 1].text,
            last_message_time: data.messages[data.messages.length - 1].created_at,
            last_sender: data.messages[data.messages.length - 1].sender_type,
            unread_for_agent: false,
            unread_for_customer: false,
            created_at: data.messages[0].created_at,
            updated_at: Date.now()
          });
        }
      } catch (e) {
        // Pristine start
      }
    };
    fetchExisting();
  }, [appId, sessionId]);

  // Poll for agent reply updates every 3.5 seconds
  useEffect(() => {
    if (!activeConversation?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/business/conversations/${activeConversation.id}/messages`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          if (data.messages.length > messages.length) {
            setMessages(data.messages);
          }
        }
      } catch {}
    }, 3500);
    return () => clearInterval(interval);
  }, [activeConversation?.id, messages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Track 1: Pre-Purchase & Discovery (Automated Assistant)
  const handleStartPrePurchaseChat = async () => {
    setLoading(true);
    try {
      const initialText = "Hello! I would like to inquire about your services and available features.";
      const res = await fetch('/api/business/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appId,
          customer_session_id: sessionId,
          customer: {
            ...initialCustomerContext,
            customer_name: initialCustomerContext.customer_name || 'Customer'
          },
          intent: 'pre_purchase',
          initial_message: initialText
        })
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setActiveConversation(data.conversation);
        setMessages([
          {
            id: 'msg_' + Date.now(),
            conversation_id: data.conversation.id,
            app_id: appId,
            sender_type: 'customer',
            sender_name: 'You',
            text: initialText,
            created_at: Date.now(),
            read: true
          }
        ]);

        // Automated Response
        setIsAiTyping(true);
        setTimeout(async () => {
          try {
            const aiRes = await fetch('/api/business/triage-ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                app_id: appId,
                conversation_id: data.conversation.id,
                message: initialText,
                customer_context: initialCustomerContext
              })
            });
            const aiData = await aiRes.json();
            if (aiData.success && aiData.reply) {
              setMessages(prev => [
                ...prev,
                {
                  id: 'msg_ai_' + Date.now(),
                  conversation_id: data.conversation.id,
                  app_id: appId,
                  sender_type: 'ai',
                  sender_name: `${app?.app_name || 'Store'} Assistant`,
                  text: aiData.reply,
                  created_at: Date.now(),
                  read: true
                }
              ]);
            }
          } finally {
            setIsAiTyping(false);
          }
        }, 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Track 2: Order Issue & Human Escalation
  const handleStartPostPurchaseEscalation = async () => {
    setShowOrderInputModal(false);
    setLoading(true);
    try {
      const orderNum = orderIdInput.trim() || '#ORD-UNKNOWN';
      const initialText = `Priority Support: Inquiring on Order ${orderNum}. Contact: ${phoneInput || 'Provided in session'}.`;

      const res = await fetch('/api/business/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appId,
          customer_session_id: sessionId,
          customer: {
            ...initialCustomerContext,
            customer_name: nameInput.trim() || initialCustomerContext.customer_name || 'Customer',
            customer_phone: phoneInput.trim() || initialCustomerContext.customer_phone,
            order_id: orderNum,
            order_status: 'Customer requested human support'
          },
          intent: 'post_purchase_issue',
          initial_message: initialText
        })
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setActiveConversation(data.conversation);
        setMessages([
          {
            id: 'msg_' + Date.now(),
            conversation_id: data.conversation.id,
            app_id: appId,
            sender_type: 'customer',
            sender_name: 'You',
            text: initialText,
            created_at: Date.now(),
            read: true
          },
          {
            id: 'msg_sys_' + Date.now(),
            conversation_id: data.conversation.id,
            app_id: appId,
            sender_type: 'system',
            sender_name: 'Support System',
            text: 'Ticket registered. An agent has been alerted with your order inquiry.',
            created_at: Date.now() + 50,
            read: true
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldownRemaining > 0) return;

    const text = inputText.trim();
    if (!text || !activeConversation) return;

    const maxLen = app?.rate_limiting?.max_input_length || 500;
    if (text.length > maxLen) {
      setRateLimitWarning(`Character limit exceeded (${text.length}/${maxLen}). Please shorten your message.`);
      return;
    }

    setInputText('');
    setRateLimitWarning(null);

    // Enforce initial local cooldown between customer messages (default 3s)
    const bubbleCooldown = app?.rate_limiting?.customer_cooldown_seconds ?? 3;
    setCooldownRemaining(bubbleCooldown);

    const newMsg: BusinessMessage = {
      id: 'msg_' + Date.now(),
      conversation_id: activeConversation.id,
      app_id: appId,
      sender_type: 'customer',
      sender_name: 'You',
      text,
      created_at: Date.now(),
      read: true
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      const msgRes = await fetch(`/api/business/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sender_type: 'customer',
          sender_name: initialCustomerContext.customer_name || 'Customer',
          app_id: appId
        })
      });

      const msgData = await msgRes.json();

      // Check if server throttled the customer
      if (msgRes.status === 429 || msgData.rate_limited) {
        const lockoutSec = msgData.retry_after || 15;
        setCooldownRemaining(lockoutSec);
        setRateLimitWarning(msgData.error || `Rate limit active. Please wait ${lockoutSec}s.`);

        setMessages(prev => [
          ...prev,
          {
            id: 'msg_sys_rl_' + Date.now(),
            conversation_id: activeConversation.id,
            app_id: appId,
            sender_type: 'system',
            sender_name: 'Anti-Flood Shield',
            text: msgData.error || `Anti-spam cooldown active. Please wait ${lockoutSec}s before sending another message.`,
            created_at: Date.now(),
            read: true
          }
        ]);
        return;
      }

      // If conversation is in Track 1 (Pre-Purchase) and automated mode is active
      if (activeConversation.intent === 'pre_purchase' && activeConversation.ai_active) {
        setIsAiTyping(true);
        setTimeout(async () => {
          try {
            const aiRes = await fetch('/api/business/triage-ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                app_id: appId,
                conversation_id: activeConversation.id,
                message: text,
                customer_context: initialCustomerContext
              })
            });
            const aiData = await aiRes.json();
            if (aiData.rate_limited) {
              setCooldownRemaining(aiData.retry_after || 15);
              setRateLimitWarning(aiData.error || 'AI Co-Pilot is cooling down.');
            } else if (aiData.success && aiData.reply) {
              setMessages(prev => [
                ...prev,
                {
                  id: 'msg_ai_' + Date.now(),
                  conversation_id: activeConversation.id,
                  app_id: appId,
                  sender_type: 'ai',
                  sender_name: `${app?.app_name || 'Store'} Assistant`,
                  text: aiData.reply,
                  created_at: Date.now(),
                  read: true
                }
              ]);
            }
          } finally {
            setIsAiTyping(false);
          }
        }, 700);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden font-sans ${
      isFullscreen ? 'fixed inset-0 z-[2147483647] rounded-none w-screen h-screen' : ''
    } ${
      themeMode === 'dark' ? 'bg-[#121215] text-[#f4f4f5]' : 'bg-white text-[#09090b]'
    } ${isStandalone && !isFullscreen ? 'rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl' : ''}`}>
      
      {/* 1. MINIMAL HEADER */}
      <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 transition-colors ${
        themeMode === 'dark' ? 'bg-[#18181b] border-zinc-800' : 'bg-zinc-900 border-zinc-900 text-white'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-white/10 text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {activeMode === 'bubble_ai_only' ? <Sparkles className="h-4 w-4" /> : activeMode === 'priority_ticket' ? <Ticket className="h-4 w-4 text-rose-400" /> : <Headphones className="h-4 w-4" />}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-xs tracking-tight text-white truncate flex items-center gap-1.5">
              <span>{app?.app_name || 'Customer Support'}</span>
              {activeMode === 'priority_ticket' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Priority Desk
                </span>
              )}
            </h3>
            <p className="text-[10px] text-zinc-300 font-mono flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                {activeMode === 'bubble_ai_only' 
                  ? 'Pure Automation & AI' 
                  : activeMode === 'priority_ticket' 
                    ? (ticketId ? `Ticket: #${ticketId}` : 'Incident Escalation')
                    : (activeConversation?.intent === 'post_purchase_issue' ? 'Escalated to Agent' : 'AI + Live Agent')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Fullscreen Expansion Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Restore window" : "Expand to fullscreen"}
            className="p-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {activeConversation && (
            <button
              onClick={() => {
                setActiveConversation(null);
                setMessages([]);
                setTicketId(null);
              }}
              title="Reset conversation"
              className="p-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close chat"
              className="p-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. BODY WORKSPACE */}
      {!activeConversation ? (
        // VIEW A: MODE-SPECIFIC TRIAGE OPTIONS
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-1">
              <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">
                {activeMode === 'priority_ticket' 
                  ? 'Urgent Support & Incident Escalation' 
                  : (app?.widget_theme?.greeting_title || 'How can we help?')}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                {activeMode === 'priority_ticket'
                  ? 'File an escalation for post-delivery issues, completed ride disputes, or damaged items.'
                  : activeMode === 'bubble_ai_only'
                    ? 'Ask any question. Our automated AI co-pilot provides instant 24/7 answers.'
                    : (app?.widget_theme?.greeting_subtitle || 'Start an inquiry or connect with a support specialist.')}
              </p>
            </div>

            {/* TRACK 1: AUTOMATED AI CO-PILOT (Available in all modes) */}
            <button
              onClick={handleStartPrePurchaseChat}
              disabled={loading}
              className="w-full text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-colors shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-zinc-900 dark:text-white">
                      {activeMode === 'priority_ticket' ? 'Instant AI Incident Triage' : 'Automated AI Co-Pilot'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                      Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                    {activeMode === 'priority_ticket'
                      ? 'Self-service verification and instant FAQ troubleshooting.'
                      : 'Real-time guidance, knowledge base answers, and service details.'}
                  </p>
                </div>
              </div>
            </button>

            {/* TRACK 2: LIVE HUMAN AGENT HANDOFF (Available in contextual_in_app and priority_ticket) */}
            {activeMode !== 'bubble_ai_only' && (
              <button
                onClick={() => setShowOrderInputModal(true)}
                disabled={loading}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors group cursor-pointer ${
                  activeMode === 'priority_ticket'
                    ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60 dark:bg-rose-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-colors shrink-0 ${
                    activeMode === 'priority_ticket'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900'
                  }`}>
                    {activeMode === 'priority_ticket' ? <Ticket className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-zinc-900 dark:text-white">
                        {activeMode === 'priority_ticket' ? 'Generate Real Incident Ticket' : 'Connect with Live Agent'}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        activeMode === 'priority_ticket'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {activeMode === 'priority_ticket' ? 'URGENT' : 'Live Agent'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                      {activeMode === 'priority_ticket'
                        ? 'Generates verified ticket ID and immediately pages priority support team.'
                        : 'Direct handoff to a human representative in Business Messenger.'}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="pt-3 text-center border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-mono text-zinc-400">
              {activeMode === 'bubble_ai_only' ? 'Autonomous AI Channel' : 'Omnichannel Business Messenger'}
            </span>
          </div>
        </div>
      ) : (
        // VIEW B: ACTIVE CONVERSATION THREAD
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-[#0c0c0e]">
          
          {/* TRACK STATUS RIBBON */}
          <div className="px-3.5 py-1.5 text-[11px] font-medium flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-600 dark:text-zinc-300">
            <span className="truncate">
              {activeConversation.intent === 'post_purchase_issue' 
                ? (ticketId ? `Ticket #${ticketId}` : `Order: ${activeConversation.customer?.order_id || 'Active'}`) 
                : (activeMode === 'bubble_ai_only' ? 'Automated AI Co-Pilot' : 'Product & Service Assistant')}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-zinc-400">
                {activeConversation.status === 'pending_human' ? 'Awaiting Agent' : 'Connected'}
              </span>
              {activeMode !== 'bubble_ai_only' && activeConversation.status !== 'pending_human' && (
                <button
                  type="button"
                  onClick={() => setShowOrderInputModal(true)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {activeMode === 'priority_ticket' ? 'Escalate' : 'Agent'}
                </button>
              )}
            </div>
          </div>

          {/* MESSAGES LIST */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {messages.map(msg => {
              const isMe = msg.sender_type === 'customer';
              const isSystem = msg.sender_type === 'system';
              const isAi = msg.sender_type === 'ai';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-1.5 px-2">
                    <p className="inline-block text-[10px] py-1 px-2.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                      {msg.text}
                    </p>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1 mb-0.5 px-1">
                    <span className="text-[9px] text-zinc-400">
                      {isMe ? 'You' : (isAi ? 'Automated' : 'Support')}
                    </span>
                  </div>

                  <div 
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed select-text ${
                      isMe 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <span className="text-[9px] text-zinc-400 mt-0.5 px-1 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {isAiTyping && (
              <div className="text-[11px] text-zinc-400 font-mono py-1 px-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
                <span>Typing response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* RATE LIMIT / COOLDOWN NOTICE */}
          {(rateLimitWarning || cooldownRemaining > 0) && (
            <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300 flex items-center justify-between font-mono">
              <span className="truncate pr-2">{rateLimitWarning || `Flood guard: Cooldown active`}</span>
              <span className="font-semibold shrink-0">{cooldownRemaining}s</span>
            </div>
          )}

          {/* COMPOSER */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-white dark:bg-[#121215] border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                maxLength={app?.rate_limiting?.max_input_length || 500}
                placeholder={cooldownRemaining > 0 ? `Please wait ${cooldownRemaining}s...` : "Type message..."}
                disabled={cooldownRemaining > 0}
                className="w-full pl-3 pr-14 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white transition-colors disabled:opacity-50 select-text"
              />
              {inputText.length > 20 && (
                <span className="absolute right-2 text-[9px] font-mono text-zinc-400 select-none">
                  {inputText.length}/{app?.rate_limiting?.max_input_length || 500}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || cooldownRemaining > 0}
              className="p-2 min-w-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-30 transition-colors cursor-pointer flex items-center justify-center font-mono text-xs font-semibold"
            >
              {cooldownRemaining > 0 ? `${cooldownRemaining}s` : <Send className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>
      )}

      {/* TRACK 2 ESCALATION MODAL */}
      {showOrderInputModal && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white dark:bg-[#121215] rounded-xl p-4 shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-semibold text-zinc-900 dark:text-white">
                Order Support Inquiry
              </span>
              <button 
                onClick={() => setShowOrderInputModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Provide order details so our team can immediately inspect status.
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={e => setOrderIdInput(e.target.value)}
                  placeholder="e.g. #ORD-88219"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowOrderInputModal(false)}
                className="flex-1 py-1.5 rounded-lg font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartPostPurchaseEscalation}
                disabled={!orderIdInput.trim()}
                className="flex-1 py-1.5 rounded-lg font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
