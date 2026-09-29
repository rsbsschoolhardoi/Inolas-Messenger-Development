import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Sliders, MessageSquare, Zap, Clock, ShieldCheck, 
  Plus, Trash2, Check, RefreshCw, Copy, ExternalLink, AlertTriangle,
  Play, Settings, FileText, ChevronRight, Eye, EyeOff, ShieldAlert, 
  ShoppingBag, Shield, Activity, Terminal, Key, Send
} from 'lucide-react';
import { BusinessApp } from '../../../types';
import { CustomSelect } from '../common/CustomSelect';

interface BusinessAutomationAiViewProps {
  app: any;
  showToast: (msg: string) => void;
  onUpdateApp: (updates: any) => Promise<void>;
  themeMode?: 'light' | 'dark';
}

type SubTab = 'ai_model' | 'rate_limits' | 'knowledge' | 'workflows' | 'widget_customizer';

const PROVIDER_MODELS: Record<string, Array<{ id: string; label: string; desc: string }>> = {
  google: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Ultra-low latency, optimized for real-time customer triage' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'High-speed multimodal generation' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Complex reasoning & deep inventory catalog analysis' }
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o Omni', desc: 'High intelligence flagship reasoning model' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast, cost-efficient model for high volume chat' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Comprehensive reasoning with wide knowledge cutoff' }
  ],
  anthropic: [
    { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet', desc: 'Latest flagship reasoning & nuance in customer support' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', desc: 'Nuanced and empathetic conversation flow' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', desc: 'Near-instant response velocity' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Groq LPU', desc: 'Sub-second LPUs for ultra-fast replies' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B Groq', desc: 'Balanced open-weights intelligence' }
  ],
  mistral: [
    { id: 'mistral-large-latest', label: 'Mistral Large 2', desc: 'Top-tier multilingual & enterprise commerce reasoning' },
    { id: 'mistral-small-latest', label: 'Mistral Small', desc: 'Fast, lightweight conversational agent' }
  ],
  openrouter: [
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash OpenRouter', desc: 'Fast unified gateway routing' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B OpenRouter', desc: 'High capability open weights' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet OpenRouter', desc: 'Universal routing to Anthropic' }
  ],
  custom: [
    { id: 'custom_model', label: 'Self-Hosted / VPS Endpoint', desc: 'Ollama, vLLM, or custom OpenAI-compatible server' }
  ]
};

export const BusinessAutomationAiView: React.FC<BusinessAutomationAiViewProps> = ({
  app,
  showToast,
  onUpdateApp,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('ai_model');
  const [isSaving, setIsSaving] = useState(false);

  // 1. AI Studio & BYOK Credentials State
  const [aiEnabled, setAiEnabled] = useState(app?.ai_enabled ?? true);
  const [aiProvider, setAiProvider] = useState<'google' | 'openai' | 'anthropic' | 'groq' | 'mistral' | 'openrouter' | 'custom'>(app?.ai_provider || 'google');
  const [aiModel, setAiModel] = useState(app?.ai_model || 'gemini-2.5-flash');
  const [useCustomModelInput, setUseCustomModelInput] = useState(false);
  const [aiApiKey, setAiApiKey] = useState(app?.ai_api_key || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiCustomEndpoint, setAiCustomEndpoint] = useState(app?.ai_custom_endpoint || 'http://localhost:11434/v1/chat/completions');
  
  const [aiSystemPrompt, setAiSystemPrompt] = useState(app?.ai_system_prompt || 'You are the intelligent customer concierge for this store. Help customers find sizes, explain shipping, and describe return policies.');
  const [aiTemperature, setAiTemperature] = useState<number>(app?.ai_temperature ?? 0.3);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState<number>(app?.ai_confidence_threshold ?? 75);
  const [aiTone, setAiTone] = useState<'concise' | 'friendly' | 'technical' | 'formal'>(app?.ai_tone || 'friendly');

  // Key Test Probe State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [keyTestLatency, setKeyTestLatency] = useState<number | null>(null);
  const [keyTestError, setKeyTestError] = useState<string | null>(null);

  // Test sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState('Do you offer a return or exchange on shoes?');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [isSimulatingAi, setIsSimulatingAi] = useState(false);

  // 2. Rate Limiting & Anti-Spam Guard State
  const [rateLimitingEnabled, setRateLimitingEnabled] = useState(app?.rate_limiting?.enabled ?? true);
  const [customerCooldownSeconds, setCustomerCooldownSeconds] = useState<number>(app?.rate_limiting?.customer_cooldown_seconds ?? 3);
  const [maxMessagesPerMinute, setMaxMessagesPerMinute] = useState<number>(app?.rate_limiting?.max_messages_per_minute ?? 8);
  const [burstCooldownSeconds, setBurstCooldownSeconds] = useState<number>(app?.rate_limiting?.burst_cooldown_seconds ?? 20);
  const [agentCooldownMs, setAgentCooldownMs] = useState<number>(app?.rate_limiting?.agent_cooldown_ms ?? 700);
  const [ipAbuseBlockMinutes, setIpAbuseBlockMinutes] = useState<number>(app?.rate_limiting?.ip_abuse_block_minutes ?? 10);
  const [maxInputLength, setMaxInputLength] = useState<number>(app?.rate_limiting?.max_input_length ?? 500);

  // Abuse Simulator probe state
  const [isSimulatingAbuse, setIsSimulatingAbuse] = useState(false);
  const [abuseSimulationLogs, setAbuseSimulationLogs] = useState<any[] | null>(null);

  // Webhook Test probe state
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any | null>(null);

  // 3. Knowledge Base FAQs State
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string; category?: string }>>(
    Array.isArray(app?.knowledge_faqs) && app.knowledge_faqs.length > 0 
      ? app.knowledge_faqs 
      : [
          {
            id: 'faq_1',
            question: 'What is your standard return and exchange window?',
            answer: 'We provide an instant 14-day exchange and return policy on all eligible items. Items must retain original box and tags.',
            category: 'Returns'
          },
          {
            id: 'faq_2',
            question: 'How long does express shipping take?',
            answer: 'Orders process within 24 hours. Standard domestic delivery arrives in 3-5 business days with end-to-end tracking.',
            category: 'Shipping'
          },
          {
            id: 'faq_3',
            question: 'How do sizing charts fit across apparel and footwear?',
            answer: 'All items fit true to standard international sizing. If between sizes or seeking an oversized fit, size up one unit.',
            category: 'Sizing'
          }
        ]
  );
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newFaqCat, setNewFaqCat] = useState('General');

  // 4. Automation Workflows & Triage Rules State
  const [welcomeMessage, setWelcomeMessage] = useState(app?.welcome_message || 'Hello! How can our support team or virtual assistant assist you today?');
  const [fallbackHumanMessage, setFallbackHumanMessage] = useState(app?.fallback_human_message || 'I have escalated your inquiry directly to our priority human support team. A representative will connect shortly.');
  const [escalationWebhookUrl, setEscalationWebhookUrl] = useState(app?.escalation_webhook_url || '');
  const [autoResolveMinutes, setAutoResolveMinutes] = useState<number>(app?.auto_resolve_minutes ?? 30);
  
  // Business Hours
  const [hoursEnabled, setHoursEnabled] = useState(app?.business_hours?.enabled ?? false);
  const [timezone, setTimezone] = useState(app?.business_hours?.timezone || 'Asia/Kolkata');
  const [startTime, setStartTime] = useState(app?.business_hours?.start_time || '09:00');
  const [endTime, setEndTime] = useState(app?.business_hours?.end_time || '20:00');
  const [awayMessage, setAwayMessage] = useState(app?.business_hours?.away_message || 'Our support specialists are away right now. Please drop your email or order ID and we will reply first thing.');

  // Triage Rules
  const [triageRules, setTriageRules] = useState<Array<{
    id: string;
    name: string;
    condition_type: 'keyword' | 'intent' | 'order_status' | 'cart_value';
    match_value: string;
    action: 'escalate_human' | 'trigger_ai' | 'apply_tag' | 'send_canned';
    action_payload?: string;
    is_active: boolean;
  }>>(
    Array.isArray(app?.auto_triage_rules) && app.auto_triage_rules.length > 0
      ? app.auto_triage_rules
      : [
          {
            id: 'rule_1',
            name: 'Escalate Delayed Orders Instantly',
            condition_type: 'keyword',
            match_value: 'delayed',
            action: 'escalate_human',
            action_payload: 'Order flagged as delayed. Priority dispatch supervisor alerted.',
            is_active: true
          },
          {
            id: 'rule_2',
            name: 'Order Number Detection',
            condition_type: 'keyword',
            match_value: '#ORD',
            action: 'escalate_human',
            action_payload: 'Identified order inquiry. Escalated to live desk.',
            is_active: true
          }
        ]
  );
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleMatch, setNewRuleMatch] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'escalate_human' | 'trigger_ai' | 'send_canned'>('escalate_human');

  // 5. Widget Studio State
  const [primaryColor, setPrimaryColor] = useState(app?.widget_theme?.primary_color || '#18181b');
  const [greetingTitle, setGreetingTitle] = useState(app?.widget_theme?.greeting_title || 'How can we help?');
  const [greetingSubtitle, setGreetingSubtitle] = useState(app?.widget_theme?.greeting_subtitle || 'Select an option below to start a live support conversation.');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>(app?.widget_theme?.position || 'bottom-right');
  const [quickReplies, setQuickReplies] = useState<Array<{ id: string; shortcut: string; title: string; content: string }>>(
    Array.isArray(app?.quick_replies) && app.quick_replies.length > 0
      ? app.quick_replies
      : [
          { id: 'qr_1', shortcut: '/shipping', title: 'Shipping Policy', content: 'We process orders within 24 hours. Delivery takes 3-5 business days.' },
          { id: 'qr_2', shortcut: '/returns', title: 'Return Policy', content: 'We offer a 14-day exchange and return policy with tags intact.' }
        ]
  );
  const [newQrShortcut, setNewQrShortcut] = useState('');
  const [newQrTitle, setNewQrTitle] = useState('');
  const [newQrContent, setNewQrContent] = useState('');

  // Update default model on provider switch
  useEffect(() => {
    const available = PROVIDER_MODELS[aiProvider];
    if (available && available.length > 0) {
      if (!available.some(m => m.id === aiModel)) {
        setAiModel(available[0].id);
      }
    }
  }, [aiProvider]);

  // Test Custom API Key Live
  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    setKeyTestStatus('idle');
    setKeyTestError(null);
    setKeyTestLatency(null);

    try {
      const res = await fetch('/api/business/test-ai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          model: aiModel,
          api_key: aiApiKey.trim(),
          custom_endpoint: aiCustomEndpoint.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.verified) {
        setKeyTestStatus('success');
        setKeyTestLatency(data.latency_ms || 120);
        showToast(`API Key verified for ${aiProvider.toUpperCase()} (${data.latency_ms}ms)`);
      } else {
        setKeyTestStatus('error');
        setKeyTestError(data.error || 'Authentication probe rejected by provider.');
        showToast('API Key test failed: ' + (data.error || 'Check key'));
      }
    } catch (err: any) {
      setKeyTestStatus('error');
      setKeyTestError(err.message || 'Network error');
      showToast('Connection error during key test.');
    } finally {
      setIsTestingKey(false);
    }
  };

  // Handle Save All Settings
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = {
        ai_enabled: aiEnabled,
        ai_provider: aiProvider,
        ai_model: aiModel,
        ai_api_key: aiApiKey.trim(),
        ai_custom_endpoint: aiCustomEndpoint.trim(),
        ai_system_prompt: aiSystemPrompt.trim(),
        ai_temperature: aiTemperature,
        ai_confidence_threshold: aiConfidenceThreshold,
        ai_tone: aiTone,
        rate_limiting: {
          enabled: rateLimitingEnabled,
          customer_cooldown_seconds: customerCooldownSeconds,
          max_messages_per_minute: maxMessagesPerMinute,
          burst_cooldown_seconds: burstCooldownSeconds,
          agent_cooldown_ms: agentCooldownMs,
          ip_abuse_block_minutes: ipAbuseBlockMinutes,
          max_input_length: maxInputLength
        },
        welcome_message: welcomeMessage.trim(),
        fallback_human_message: fallbackHumanMessage.trim(),
        escalation_webhook_url: escalationWebhookUrl.trim(),
        auto_resolve_minutes: autoResolveMinutes,
        business_hours: {
          enabled: hoursEnabled,
          timezone,
          start_time: startTime,
          end_time: endTime,
          away_message: awayMessage.trim()
        },
        auto_triage_rules: triageRules,
        knowledge_faqs: faqs,
        widget_theme: {
          primary_color: primaryColor,
          greeting_title: greetingTitle.trim(),
          greeting_subtitle: greetingSubtitle.trim(),
          position
        },
        quick_replies: quickReplies
      };

      // 1. Sync through parent updateApp handler
      await onUpdateApp(updates);

      // 2. Also sync to Zenoa Business Console endpoint
      await fetch('/api/business/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id || app.client_id,
          app_id: app.id,
          app_name: app.app_name,
          owner_username: app.owner_username || app.owner,
          ...updates
        })
      });

      showToast('Automation, BYOK credentials & rate limit rules saved.');
    } catch (err: any) {
      showToast('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Run Test AI Simulation
  const handleRunSimulation = async () => {
    if (!sandboxPrompt.trim()) return;
    setIsSimulatingAi(true);
    setSandboxResponse(null);
    try {
      const res = await fetch('/api/business/triage-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: app.id || 'biz_default',
          message: sandboxPrompt,
          customer_context: {
            customer_name: 'Developer Sandbox',
            cart_value: '₹14,999.00',
            order_id: '#ORD-SANDBOX'
          }
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setSandboxResponse(data.reply);
      } else if (data.rate_limited) {
        setSandboxResponse(`Rate Limit Active: ${data.error}`);
      } else {
        setSandboxResponse('Automated assistant responded with empty output.');
      }
    } catch (err: any) {
      setSandboxResponse('Simulation error: ' + err.message);
    } finally {
      setIsSimulatingAi(false);
    }
  };

  // Run Real-Time Flood & Rate Limit Abuse Simulation
  const handleSimulateAbuse = async () => {
    setIsSimulatingAbuse(true);
    setAbuseSimulationLogs(null);
    try {
      const res = await fetch('/api/business/simulate-abuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: app.id || 'biz_default',
          burst_count: 6,
          simulation_type: 'customer_flood'
        })
      });
      const data = await res.json();
      if (data.success) {
        setAbuseSimulationLogs(data.logs || []);
        showToast(data.throttle_triggered ? 'Simulation: Throttle triggered successfully.' : 'Simulation executed.');
      } else {
        showToast('Simulation failed: ' + (data.error || 'Server error'));
      }
    } catch (e: any) {
      showToast('Simulation connection error: ' + e.message);
    } finally {
      setIsSimulatingAbuse(false);
    }
  };

  // Run Outbound Webhook Test Dispatch
  const handleTestWebhook = async () => {
    if (!escalationWebhookUrl.trim()) {
      showToast('Please enter an Escalation Webhook URL first.');
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch('/api/business/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: escalationWebhookUrl.trim(),
          event: 'customer_escalation_probe',
          payload: { app_id: app.id || app.client_id }
        })
      });
      const data = await res.json();
      setWebhookTestResult(data);
      if (data.delivered) {
        showToast(`Webhook responded: HTTP ${data.status_code} (${data.latency_ms}ms)`);
      } else {
        showToast(`Webhook rejected: HTTP ${data.status_code || 500}`);
      }
    } catch (e: any) {
      setWebhookTestResult({ delivered: false, error: e.message });
      showToast('Webhook probe connection error.');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleLoadPresetPrompt = (preset: 'ecommerce' | 'saas' | 'hospitality') => {
    if (preset === 'ecommerce') {
      setAiSystemPrompt('You are the dedicated customer concierge for this retail storefront. Autonomously answer product sizing, material details, delivery timelines (3-5 business days), and return policy (14 days). If customer reports order damage or delivery delays, apologize warmly and advise that human support has been alerted.');
      setAiTone('friendly');
    } else if (preset === 'saas') {
      setAiSystemPrompt('You are the technical product specialist for this software platform. Assist developers and users with API credentials, SDK integrations, webhook error codes, and subscription tier allowances. Maintain a crisp, structured technical tone.');
      setAiTone('technical');
    } else {
      setAiSystemPrompt('You are the front desk concierge. Guide guests through booking availability, room amenities, check-in requirements, and dining menus. Maintain a polite and formal executive tone.');
      setAiTone('formal');
    }
    showToast('Loaded preset prompt template.');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER BANNER */}
      <div className={`rounded-xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-[#0d253d] dark:text-white">
                Business Automation &amp; AI Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                BYOK Ready
              </span>
            </div>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5 max-w-xl leading-relaxed">
              Configure multi-provider AI (Google, OpenAI, Anthropic, Groq, Self-Hosted), custom API keys, anti-spam rate limits, and live widget appearance for <strong>{app.app_name}</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          <span>{isSaving ? 'Saving Configurations...' : 'Save Automation Suite'}</span>
        </button>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {[
          { id: 'ai_model', label: 'AI Engine & BYOK', icon: Key },
          { id: 'rate_limits', label: 'Rate Limits & Abuse Guard', icon: Shield },
          { id: 'knowledge', label: 'Knowledge Base & FAQs', icon: FileText, count: faqs.length },
          { id: 'workflows', label: 'Automations & Triage Rules', icon: Zap, count: triageRules.length },
          { id: 'widget_customizer', label: 'Live Widget Studio', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] font-mono opacity-70">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. SUBTAB PANELS */}

      {/* TAB 1: AI ENGINE & BRING YOUR OWN KEY (BYOK) */}
      {activeSubTab === 'ai_model' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: CONFIGURATION */}
          <div className={`lg:col-span-2 rounded-xl border p-5 space-y-5 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white">
                  Multi-Provider Model Selection &amp; API Key
                </h3>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                  Select your preferred AI provider, model, and bring your own API key.
                </p>
              </div>

              {/* Master AI Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {aiEnabled ? 'AI Active' : 'AI Paused'}
                </span>
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={e => setAiEnabled(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </label>
            </div>

            {/* Provider and Model Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  1. Select AI Provider
                </label>
                <CustomSelect
                  value={aiProvider}
                  onChange={(val) => {
                    const p = val as any;
                    setAiProvider(p);
                    setUseCustomModelInput(false);
                  }}
                  options={[
                    { value: 'google', label: 'Google Gemini', description: 'Recommended' },
                    { value: 'openai', label: 'OpenAI', description: 'ChatGPT / GPT-4o / o3-mini' },
                    { value: 'anthropic', label: 'Anthropic Claude', description: 'Claude 3.7 / 3.5' },
                    { value: 'groq', label: 'Groq LPU', description: 'Ultra-fast Llama 3.3 LPUs' },
                    { value: 'mistral', label: 'Mistral AI', description: 'Mistral Large 2 / Small' },
                    { value: 'openrouter', label: 'OpenRouter', description: 'Universal Model Gateway' },
                    { value: 'custom', label: 'Custom / VPS Endpoint', description: 'Ollama / vLLM / Self-Hosted' },
                  ]}
                />
              </div>

              {/* Model Choice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    2. Select Model
                  </label>
                  {aiProvider !== 'custom' && (
                    <button
                      type="button"
                      onClick={() => setUseCustomModelInput(!useCustomModelInput)}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer"
                    >
                      {useCustomModelInput ? 'Preset Models' : 'Custom Model String'}
                    </button>
                  )}
                </div>
                {aiProvider === 'custom' || useCustomModelInput ? (
                  <input
                    type="text"
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    placeholder={
                      aiProvider === 'openrouter' ? 'e.g. meta-llama/llama-3.3-70b-instruct' :
                      aiProvider === 'custom' ? 'e.g. llama3.2:latest or mistral' :
                      'Type custom model ID (e.g. gpt-4.5-preview)...'
                    }
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                ) : (
                  <CustomSelect
                    value={aiModel}
                    onChange={(val) => setAiModel(val)}
                    options={(PROVIDER_MODELS[aiProvider] || []).map(m => ({
                      value: m.id,
                      label: m.label,
                      description: m.desc
                    }))}
                  />
                )}
              </div>
            </div>

            {/* Custom Endpoint URL if Provider is 'custom' */}
            {aiProvider === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Custom OpenAI-Compatible Endpoint URL
                </label>
                <input
                  type="text"
                  value={aiCustomEndpoint}
                  onChange={e => setAiCustomEndpoint(e.target.value)}
                  placeholder="https://vps.yourdomain.com/v1/chat/completions"
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Supports any standard `/v1/chat/completions` API endpoint hosted on a VPS, Ollama, or local proxy.
                </p>
              </div>
            )}

            {/* Bring Your Own API Key Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  3. {aiProvider === 'custom' ? 'API Key / Bearer Token (Optional)' : `${aiProvider.toUpperCase()} API Key`}
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  {aiApiKey ? 'Custom Key Stored' : 'Using Managed Fallback'}
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiApiKey}
                  onChange={e => {
                    setAiApiKey(e.target.value);
                    setKeyTestStatus('idle');
                  }}
                  placeholder={
                    aiProvider === 'google' ? 'AIzaSy... (Leave empty to use default server key)' :
                    aiProvider === 'openai' ? 'sk-proj-... (Paste OpenAI API Key)' :
                    aiProvider === 'anthropic' ? 'sk-ant-... (Paste Anthropic Key)' :
                    aiProvider === 'groq' ? 'gsk_... (Paste Groq API Key)' :
                    aiProvider === 'mistral' ? 'Paste Mistral AI API Key...' :
                    aiProvider === 'openrouter' ? 'sk-or-v1-... (Paste OpenRouter API Key)' :
                    'Bearer token or API secret (Optional)'
                  }
                  className={`w-full pl-3 pr-20 py-2 rounded-lg border text-xs font-mono outline-none transition-colors ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white focus:border-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                  }`}
                />

                <div className="absolute right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(prev => !prev)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    title={showApiKey ? 'Hide Key' : 'Reveal Key'}
                  >
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isTestingKey}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[10px] font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isTestingKey ? 'Testing...' : 'Test Key'}
                  </button>
                </div>
              </div>

              {/* Key Verification Probe Result Banner */}
              {keyTestStatus === 'success' && (
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>
                    Connection verified with {aiProvider.toUpperCase()} ({aiModel}). Latency: <strong>{keyTestLatency}ms</strong>.
                  </span>
                </div>
              )}

              {keyTestStatus === 'error' && (
                <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">
                    {keyTestError || 'API key rejected by provider.'}
                  </span>
                </div>
              )}
            </div>

            {/* Hyperparameters: Tone, Temperature, Confidence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Response Tone
                </label>
                <CustomSelect
                  value={aiTone}
                  onChange={(val) => setAiTone(val as any)}
                  options={[
                    { value: 'friendly', label: 'Warm Concierge' },
                    { value: 'concise', label: 'Concise Executive' },
                    { value: 'technical', label: 'Technical Specialist' },
                    { value: 'formal', label: 'Formal Corporate' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Temperature</span>
                  <span className="font-mono text-zinc-500">{aiTemperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aiTemperature}
                  onChange={e => setAiTemperature(parseFloat(e.target.value))}
                  className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Confidence Cutoff</span>
                  <span className="font-mono text-zinc-500">{aiConfidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={aiConfidenceThreshold}
                  onChange={e => setAiConfidenceThreshold(parseInt(e.target.value))}
                  className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
                />
              </div>
            </div>

            {/* Persona Instruction Editor */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  System Persona &amp; Store Knowledge
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-mono">Load Preset:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetPrompt('ecommerce')}
                    className="text-[10px] font-mono underline hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    E-Comm
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetPrompt('saas')}
                    className="text-[10px] font-mono underline hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    SaaS
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetPrompt('hospitality')}
                    className="text-[10px] font-mono underline hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    Desk
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={aiSystemPrompt}
                onChange={e => setAiSystemPrompt(e.target.value)}
                placeholder="Instruct the model on your brand identity, product details, return timelines..."
                className={`w-full p-3 rounded-lg border text-xs font-mono outline-none leading-relaxed transition-colors ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-white focus:border-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400'
                }`}
              />
            </div>
          </div>

          {/* RIGHT 1 COLUMN: LIVE PROMPT SIMULATION SANDBOX */}
          <div className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <Play className="h-4 w-4 text-zinc-500" />
                <h3 className="text-xs font-semibold text-[#0d253d] dark:text-white">
                  Real-Time Prompt Sandbox
                </h3>
              </div>
              <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8]">
                Test how the configured model answers a customer query before deploying to customers.
              </p>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                  Sample Customer Query
                </label>
                <input
                  type="text"
                  value={sandboxPrompt}
                  onChange={e => setSandboxPrompt(e.target.value)}
                  placeholder="e.g. Can I exchange size after delivery?"
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulatingAi || !sandboxPrompt.trim()}
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-40"
              >
                {isSimulatingAi ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isSimulatingAi ? 'Generating response...' : 'Run Simulation'}</span>
              </button>

              {sandboxResponse && (
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Model Output
                  </span>
                  <div className={`p-3 rounded-lg border text-xs leading-relaxed max-h-48 overflow-y-auto ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}>
                    {sandboxResponse}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Provider: {aiProvider}</span>
              <span>Model: {aiModel}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RATE LIMITS & ANTI-SPAM GUARD */}
      {activeSubTab === 'rate_limits' && (
        <div className={`rounded-xl border p-5 space-y-6 transition-colors ${
          isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>Rate Limiting, Flood Protection &amp; Anti-Spam Guard</span>
              </h3>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                Protect your live chat bubble from automated bot spam, token exhaustion, and rapid merchant shortcut loops.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {rateLimitingEnabled ? 'Protection Active' : 'Protection Disabled'}
              </span>
              <input
                type="checkbox"
                checked={rateLimitingEnabled}
                onChange={e => setRateLimitingEnabled(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer h-4 w-4"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Bubble Message Cooldown */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Customer Bubble Consecutive Cooldown
                </span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {customerCooldownSeconds}s between messages
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Enforces a cooling-off timer on the floating chat bubble so visitors cannot rapid-fire submit messages.
              </p>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={customerCooldownSeconds}
                onChange={e => setCustomerCooldownSeconds(parseInt(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>1s (Instant)</span>
                <span>3s (Recommended)</span>
                <span>15s (Aggressive)</span>
              </div>
            </div>

            {/* Customer Bubble Rate Limit (Messages per minute) */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Max Visitor Messages Per Minute
                </span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {maxMessagesPerMinute} msgs / min
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Maximum number of messages a website visitor can send within a 60-second window before lockout triggers.
              </p>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={maxMessagesPerMinute}
                onChange={e => setMaxMessagesPerMinute(parseInt(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>3 msgs (Strict)</span>
                <span>8 msgs (Standard)</span>
                <span>25 msgs (High)</span>
              </div>
            </div>

            {/* Burst Cooldown Duration */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Flood Lockout Duration
                </span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {burstCooldownSeconds} Seconds
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Length of the temporary lock enforced on the customer bubble when rate limit is exceeded.
              </p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[10, 15, 20, 60].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setBurstCooldownSeconds(sec)}
                    className={`py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                      burstCooldownSeconds === sec
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Merchant Rapid-Fire Debounce */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Merchant Canned Shortcut Debounce
                </span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {agentCooldownMs}ms
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Prevents accidental double-clicks or rapid macro shortcuts from flooding the customer with duplicate messages.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[400, 700, 1200].map(ms => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setAgentCooldownMs(ms)}
                    className={`py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                      agentCooldownMs === ms
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {ms}ms
                  </button>
                ))}
              </div>
            </div>

            {/* Message Character Limit */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Max Bubble Character Length
                </span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {maxInputLength} Chars
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Limits customer input length to prevent token-draining attacks and prompt injection overflows.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[300, 500, 1000].map(len => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setMaxInputLength(len)}
                    className={`py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                      maxInputLength === len
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {len} chars
                  </button>
                ))}
              </div>
            </div>

            {/* IP Abuse Temporary Block */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Abuse Window &amp; Token Shield
                </span>
                <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {ipAbuseBlockMinutes} Minutes
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Repeatedly throttled client sessions or IPs are held in cooldown to protect your AI quota.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[5, 10, 30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setIpAbuseBlockMinutes(mins)}
                    className={`py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                      ipAbuseBlockMinutes === mins
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INTERACTIVE ABUSE & FLOOD SIMULATOR */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Interactive Flood &amp; Rate Limit Simulator</span>
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Simulate a visitor submitting 6 messages in rapid sub-second bursts to verify how your anti-flood guard locks out the attacker.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulateAbuse}
                disabled={isSimulatingAbuse}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 shrink-0"
              >
                {isSimulatingAbuse ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isSimulatingAbuse ? 'Running Probe...' : 'Simulate Flood Probe'}</span>
              </button>
            </div>

            {abuseSimulationLogs && (
              <div className="mt-3 p-3 rounded-lg bg-white dark:bg-[#121624] border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                  Simulation Probe Telemetry (6 Sequential Requests)
                </span>
                <div className="space-y-1.5 text-xs font-mono">
                  {abuseSimulationLogs.map((log: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-1 px-2 rounded bg-zinc-50 dark:bg-zinc-900/60 text-[11px]">
                      <span className="text-zinc-700 dark:text-zinc-300">Attempt #{log.attempt}</span>
                      {log.allowed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Allowed (200 OK)</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Throttled (429 Rate Limit Cooldown)</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE & FAQS */}
      {activeSubTab === 'knowledge' && (
        <div className={`rounded-xl border p-5 space-y-5 transition-colors ${
          isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white">
                Knowledge Base &amp; Store FAQ Vault
              </h3>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                Verified answers directly delivered to customer chat before invoking LLM token generation.
              </p>
            </div>

            <span className="text-xs font-mono text-zinc-500">
              {faqs.length} Active Records
            </span>
          </div>

          {/* ADD FAQ FORM */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
              Add Verified FAQ Entry
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newFaqQ}
                  onChange={e => setNewFaqQ(e.target.value)}
                  placeholder="Question (e.g. Do you ship to international addresses?)"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <CustomSelect
                  value={newFaqCat}
                  onChange={(val) => setNewFaqCat(val)}
                  options={[
                    { value: 'General', label: 'General' },
                    { value: 'Shipping', label: 'Shipping' },
                    { value: 'Returns', label: 'Returns' },
                    { value: 'Sizing', label: 'Sizing & Fit' },
                    { value: 'Payment', label: 'Billing & Payment' },
                  ]}
                />
              </div>
            </div>

            <div>
              <textarea
                rows={2}
                value={newFaqA}
                onChange={e => setNewFaqA(e.target.value)}
                placeholder="Verified Answer delivered by the assistant..."
                className={`w-full p-2.5 rounded-lg border text-xs outline-none leading-relaxed ${
                  isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!newFaqQ.trim() || !newFaqA.trim()) return;
                  const item = {
                    id: `faq_${Date.now()}`,
                    question: newFaqQ.trim(),
                    answer: newFaqA.trim(),
                    category: newFaqCat
                  };
                  setFaqs(prev => [item, ...prev]);
                  setNewFaqQ('');
                  setNewFaqA('');
                  showToast('FAQ entry added to knowledge base.');
                }}
                disabled={!newFaqQ.trim() || !newFaqA.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {/* FAQS LIST */}
          <div className="space-y-2.5">
            {faqs.map(faq => (
              <div 
                key={faq.id} 
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 transition-colors ${
                  isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {faq.category || 'General'}
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {faq.question}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFaqs(prev => prev.filter(f => f.id !== faq.id));
                    showToast('FAQ deleted.');
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer transition-colors shrink-0"
                  title="Remove FAQ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WORKFLOWS & TRIAGE RULES */}
      {activeSubTab === 'workflows' && (
        <div className="space-y-6">
          {/* GENERAL MESSAGING & TIMEOUTS */}
          <div className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Automated Messaging &amp; Inactivity Escalations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Instant Welcome Greeting
                </label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Fallback Human Escalation Message
                </label>
                <textarea
                  rows={2}
                  value={fallbackHumanMessage}
                  onChange={e => setFallbackHumanMessage(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Inactivity Auto-Resolve Window
                </label>
                <CustomSelect
                  value={String(autoResolveMinutes)}
                  onChange={(val) => setAutoResolveMinutes(parseInt(val))}
                  options={[
                    { value: '15', label: '15 Minutes of idle customer time' },
                    { value: '30', label: '30 Minutes of idle customer time' },
                    { value: '60', label: '1 Hour of idle customer time' },
                    { value: '0', label: 'Disabled (Never auto-resolve)' },
                  ]}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Escalation Webhook Dispatch URL
                  </label>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !escalationWebhookUrl.trim()}
                    className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer disabled:opacity-40"
                  >
                    {isTestingWebhook ? 'Pinging...' : 'Send Test Ping'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={escalationWebhookUrl}
                    onChange={e => {
                      setEscalationWebhookUrl(e.target.value);
                      setWebhookTestResult(null);
                    }}
                    placeholder="https://your-crm.com/api/webhooks/support-escalated"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !escalationWebhookUrl.trim()}
                    className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {isTestingWebhook ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {webhookTestResult && (
                  <div className={`mt-2 p-2 rounded-lg text-xs font-mono flex items-center justify-between border ${
                    webhookTestResult.delivered
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span>
                      {webhookTestResult.delivered 
                        ? `Delivered: HTTP ${webhookTestResult.status_code} (${webhookTestResult.latency_ms}ms)` 
                        : `Failed: ${webhookTestResult.error || `HTTP ${webhookTestResult.status_code}`}`}
                    </span>
                    <span className="text-[10px] opacity-75">{webhookTestResult.status_text || 'Completed'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BUSINESS HOURS SCHEDULE */}
          <div className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white">
                  Operating Business Hours &amp; Away Schedule
                </h3>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                  Automatically switch to away messages when human staff is off duty.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {hoursEnabled ? 'Schedule Active' : '24/7 Always Open'}
                </span>
                <input
                  type="checkbox"
                  checked={hoursEnabled}
                  onChange={e => setHoursEnabled(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </label>
            </div>

            {hoursEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Daily Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Daily End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    After-Hours Away Message
                  </label>
                  <input
                    type="text"
                    value={awayMessage}
                    onChange={e => setAwayMessage(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* AUTO-TRIAGE RULES BUILDER */}
          <div className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Autonomous Trigger &amp; Triage Rules
            </h3>

            {/* ADD RULE FORM */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                Create Triage Trigger Rule
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={e => setNewRuleName(e.target.value)}
                    placeholder="Rule Label (e.g. VIP Urgent Tag)"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={newRuleMatch}
                    onChange={e => setNewRuleMatch(e.target.value)}
                    placeholder="Keyword match (e.g. refund, broken)"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-[#121624] border-[#273951] text-white' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div>
                  <CustomSelect
                    value={newRuleAction}
                    onChange={(val) => setNewRuleAction(val as any)}
                    options={[
                      { value: 'escalate_human', label: 'Escalate to Human Agent' },
                      { value: 'trigger_ai', label: 'Trigger AI Autonomous Solver' },
                      { value: 'send_canned', label: 'Send Instant Canned Notice' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newRuleName.trim() || !newRuleMatch.trim()) return;
                    const r = {
                      id: `rule_${Date.now()}`,
                      name: newRuleName.trim(),
                      condition_type: 'keyword' as const,
                      match_value: newRuleMatch.trim(),
                      action: newRuleAction,
                      is_active: true
                    };
                    setTriageRules(prev => [...prev, r]);
                    setNewRuleName('');
                    setNewRuleMatch('');
                    showToast('Triage rule activated.');
                  }}
                  disabled={!newRuleName.trim() || !newRuleMatch.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Activate Rule</span>
                </button>
              </div>
            </div>

            {/* RULES LIST */}
            <div className="space-y-2">
              {triageRules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={rule.is_active}
                      onChange={e => {
                        const checked = e.target.checked;
                        setTriageRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: checked } : r));
                      }}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer h-4 w-4"
                    />

                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-900 dark:text-white block truncate">
                        {rule.name}
                      </span>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        IF contains &quot;{rule.match_value}&quot; → {rule.action.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTriageRules(prev => prev.filter(r => r.id !== rule.id))}
                    className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE WIDGET STUDIO & REAL-TIME PREVIEW */}
      {activeSubTab === 'widget_customizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT: CONTROLS */}
          <div className={`rounded-xl border p-5 space-y-5 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Widget Theme &amp; Quick Replies
            </h3>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                Primary Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="h-8 w-12 rounded border border-zinc-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className={`w-32 px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
                <div className="flex items-center gap-1.5">
                  {['#18181b', '#0f172a', '#2563eb', '#059669', '#d97706'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      style={{ backgroundColor: c }}
                      className="h-6 w-6 rounded-full border border-white/40 cursor-pointer shadow-xs"
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                Launcher Bubble Screen Position
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'bottom-right', label: 'Bottom Right' },
                  { id: 'bottom-left', label: 'Bottom Left' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                      position === pos.id
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Greetings */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Launcher Greeting Title
                </label>
                <input
                  type="text"
                  value={greetingTitle}
                  onChange={e => setGreetingTitle(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Launcher Subtitle
                </label>
                <input
                  type="text"
                  value={greetingSubtitle}
                  onChange={e => setGreetingSubtitle(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            {/* QUICK REPLIES MANAGER */}
            <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                Canned Shortcuts for Support Agents
              </span>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newQrShortcut}
                  onChange={e => setNewQrShortcut(e.target.value)}
                  placeholder="/shortcut"
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
                <input
                  type="text"
                  value={newQrTitle}
                  onChange={e => setNewQrTitle(e.target.value)}
                  placeholder="Button Label"
                  className={`col-span-2 px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQrContent}
                  onChange={e => setNewQrContent(e.target.value)}
                  placeholder="Full canned response text dispatched to customer..."
                  className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newQrTitle.trim() || !newQrContent.trim()) return;
                    setQuickReplies(prev => [
                      ...prev,
                      {
                        id: `qr_${Date.now()}`,
                        shortcut: newQrShortcut.trim() || '/reply',
                        title: newQrTitle.trim(),
                        content: newQrContent.trim()
                      }
                    ]);
                    setNewQrShortcut('');
                    setNewQrTitle('');
                    setNewQrContent('');
                    showToast('Canned reply shortcut registered.');
                  }}
                  disabled={!newQrTitle.trim() || !newQrContent.trim()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium cursor-pointer disabled:opacity-40"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickReplies.map(qr => (
                  <span
                    key={qr.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-[11px] bg-zinc-50 dark:bg-zinc-900"
                  >
                    <span className="font-mono text-zinc-500">{qr.shortcut}</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{qr.title}</span>
                    <button
                      onClick={() => setQuickReplies(prev => prev.filter(q => q.id !== qr.id))}
                      className="text-zinc-400 hover:text-rose-500 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: REAL-TIME INTERACTIVE WIDGET PREVIEW */}
          <div className={`rounded-xl border p-5 flex flex-col justify-between items-center transition-colors relative min-h-[500px] ${
            isDark ? 'bg-[#0a0d18] border-[#273951]' : 'bg-zinc-100 border-[#e2e8f0]'
          }`}>
            <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-mono">
              <span>Interactive Customer Preview</span>
              <span>Position: {position}</span>
            </div>

            {/* SIMULATED CHAT WINDOW */}
            <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] my-auto">
              <div 
                className="px-4 py-3 text-white flex items-center justify-between"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-white/20 flex items-center justify-center font-bold text-xs">
                    {app.app_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs leading-none">{app.app_name}</h4>
                    <span className="text-[9px] text-zinc-200 font-mono">Active Support</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5">
                  <h5 className="font-semibold text-zinc-900 dark:text-white">{greetingTitle}</h5>
                  <p className="text-[11px] text-zinc-500 leading-normal">{greetingSubtitle}</p>
                </div>

                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2.5">
                  <ShoppingBag className="h-4 w-4 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[11px] block">Product &amp; Sizing Specs</span>
                    <span className="text-[9px] font-mono text-zinc-400">Track 1 • Automated</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[11px] block">Order Issue or Delay</span>
                    <span className="text-[9px] font-mono text-zinc-400">Track 2 • Human Priority</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="flex-1 px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                  Type a reply...
                </span>
                <span className="p-1 rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-semibold px-2">
                  Send
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono text-center pt-2">
              Updates in real-time as you tweak colors, greetings, and rules.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
