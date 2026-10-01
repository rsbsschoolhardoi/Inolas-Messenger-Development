import React, { useState, useEffect } from 'react';
import { 
  Sliders, MessageSquare, Zap, Clock, ShieldCheck, 
  Plus, Trash2, Check, RefreshCw, Copy, ExternalLink, AlertTriangle,
  Play, Settings, FileText, ChevronRight, Eye, EyeOff, ShieldAlert, 
  ShoppingBag, Shield, Activity, Terminal, Key, Send, Bot,
  Code2, Layers, HelpCircle, X, ChevronUp, Maximize2, Globe, Sparkles
} from 'lucide-react';
import { BusinessApp } from '../../../types';
import { CustomSelect } from '../common/CustomSelect';

interface BusinessAutomationAiViewProps {
  app: any;
  showToast: (msg: string) => void;
  onUpdateApp: (updates: any) => Promise<void>;
  themeMode?: 'light' | 'dark';
}

type SubTab = 'ai_model' | 'rate_limits' | 'knowledge' | 'workflows' | 'widget_customizer' | 'widget_sdk';

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
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('widget_customizer');
  const [isSaving, setIsSaving] = useState(false);

  // 1. AI Studio & BYOK Credentials State
  const [aiEnabled, setAiEnabled] = useState(app?.ai_enabled ?? true);
  const [aiProvider, setAiProvider] = useState<'google' | 'openai' | 'anthropic' | 'groq' | 'mistral' | 'openrouter' | 'custom'>(app?.ai_provider || 'google');
  const [aiModel, setAiModel] = useState(app?.ai_model || 'gemini-2.5-flash');
  const [useCustomModelInput, setUseCustomModelInput] = useState(false);
  const [aiApiKey, setAiApiKey] = useState(app?.ai_api_key || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiCustomEndpoint, setAiCustomEndpoint] = useState(app?.ai_custom_endpoint || 'http://localhost:11434/v1/chat/completions');
  
  const [aiSystemPrompt, setAiSystemPrompt] = useState(app?.ai_system_prompt || 'You are the intelligent customer concierge for this platform. Assist customers clearly according to configured knowledge base rules.');
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
      : []
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

  // 5. Widget Studio & In-Context Assistant State
  const [primaryColor, setPrimaryColor] = useState(app?.widget_theme?.primary_color || '#181d26');
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

  // 6. In-Context Action Button & Bottom-Sheet Drawer Settings
  const [actionButtonLabel, setActionButtonLabel] = useState(app?.action_button?.label || 'Ask Assistant');
  const [actionButtonStyle, setActionButtonStyle] = useState<'solid' | 'outline' | 'pill' | 'subtle'>(app?.action_button?.style || 'solid');
  const [actionButtonIcon, setActionButtonIcon] = useState<'bot' | 'help' | 'message' | 'none'>(app?.action_button?.icon || 'bot');
  const [integrationMode, setIntegrationMode] = useState<'turnkey_drawer' | 'headless_sdk' | 'inline_embed'>(app?.action_button?.integration_mode || 'turnkey_drawer');
  const [drawerHeight, setDrawerHeight] = useState<'half' | 'compact' | 'full'>(app?.action_button?.drawer_height || 'half');
  const [customCssSelector, setCustomCssSelector] = useState(app?.action_button?.custom_css_selector || '');
  const [autoExtractDom, setAutoExtractDom] = useState(app?.action_button?.auto_extract_dom ?? true);
  
  // Interactive Live Product Demo Tester & Bottom Sheet State
  const [demoProductCategory, setDemoProductCategory] = useState<'hotel' | 'food' | 'ecommerce' | 'saas'>('hotel');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [demoQuestion, setDemoQuestion] = useState('Kya is hotel room me AC aur balcony dono hai?');
  const [demoAnswer, setDemoAnswer] = useState<string | null>(null);
  const [isAnsweringDemo, setIsAnsweringDemo] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your verified product concierge. Ask me anything about room amenities, food ingredients, or product specifications in your preferred language.',
      time: 'Just now'
    }
  ]);
  const [activeSdkCodeTab, setActiveSdkCodeTab] = useState<'turnkey' | 'headless' | 'react'>('turnkey');

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
        action_button: {
          label: actionButtonLabel.trim(),
          style: actionButtonStyle,
          icon: actionButtonIcon,
          integration_mode: integrationMode,
          drawer_height: drawerHeight,
          custom_css_selector: customCssSelector.trim(),
          auto_extract_dom: autoExtractDom
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

      showToast('Automation, widget settings & assistant rules saved.');
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
      } else {
        setSandboxResponse('Our system accepts returns within 14 days of purchase with original packaging and receipt.');
      }
    } catch {
      setSandboxResponse('Our system accepts returns within 14 days of purchase with original packaging and receipt.');
    } finally {
      setIsSimulatingAi(false);
    }
  };

  // Run Rate Limit Abuse Simulation
  const handleSimulateAbuse = async () => {
    setIsSimulatingAbuse(true);
    setAbuseSimulationLogs(null);
    try {
      const res = await fetch('/api/business/simulate-abuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: app.id || 'biz_default',
          rate_limiting: {
            customer_cooldown_seconds: customerCooldownSeconds,
            max_messages_per_minute: maxMessagesPerMinute,
            burst_cooldown_seconds: burstCooldownSeconds
          }
        })
      });
      const data = await res.json();
      setAbuseSimulationLogs(data.logs || [
        { seq: 1, delay_ms: 0, status: 'allowed', latency_ms: 24, reason: 'OK' },
        { seq: 2, delay_ms: 100, status: 'throttled', latency_ms: 2, reason: 'Per-user burst cooldown triggered (3s)' },
        { seq: 3, delay_ms: 200, status: 'blocked', latency_ms: 1, reason: 'Exceeded max rate 8 req/min. Temp block applied.' }
      ]);
      showToast('Anti-spam burst probe completed.');
    } catch {
      setAbuseSimulationLogs([
        { seq: 1, delay_ms: 0, status: 'allowed', latency_ms: 22, reason: 'OK' },
        { seq: 2, delay_ms: 100, status: 'throttled', latency_ms: 3, reason: 'Per-user cooldown triggered (3s)' },
        { seq: 3, delay_ms: 200, status: 'blocked', latency_ms: 1, reason: 'Rate limit ceiling reached. IP abuse guard active.' }
      ]);
      showToast('Anti-spam simulation simulated locally.');
    } finally {
      setIsSimulatingAbuse(false);
    }
  };

  // Test Escalation Webhook Probe
  const handleTestWebhook = async () => {
    if (!escalationWebhookUrl.trim()) {
      showToast('Enter a valid webhook URL first');
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
          event: 'customer_escalation',
          payload: {
            app_id: app.id || 'biz_default',
            customer_id: 'cust_9831',
            reason: 'High priority customer ticket unresolved by triage AI',
            timestamp: new Date().toISOString()
          }
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

  // In-Context QA Query Runner (with Grounding across all application categories)
  const handleTestInContextQuery = async () => {
    if (!demoQuestion.trim()) return;
    const userMsg = demoQuestion.trim();
    setIsAnsweringDemo(true);
    setDemoAnswer(null);

    // Append to live conversation
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

    let productSpecs = '';
    if (demoProductCategory === 'hotel') {
      productSpecs = 'Room Type: Deluxe King Ocean Suite. Price: ₹4,499/night. Amenities: Air Conditioning (Split Inverter AC): Yes, Private Balcony: Yes (Sea View), Breakfast: Complimentary Buffet Included, WiFi: Free 100Mbps, Check-in: 12:00 PM, Cancellation: Free before 24 hrs.';
    } else if (demoProductCategory === 'food') {
      productSpecs = 'Dish: Paneer Lababdar & Butter Naan Combo. Dietary: 100% Pure Vegetarian. Ingredients: Fresh Cottage Cheese (Paneer), Tomato-Cashew Cream Gravy, Butter, Mild Indian Spices. Allergens: Contains Dairy (Milk/Butter) & Tree Nuts (Cashew). Spice Level: Mild to Medium.';
    } else if (demoProductCategory === 'saas') {
      productSpecs = 'Product: Cloud Cluster Pro Plan. Price: $49/month. Specs: 8 Dedicated vCPUs, 32GB RAM, 500GB NVMe SSD, 10Gbps Network Port, 99.99% Uptime SLA, Automatic Daily Backups, 24/7 Priority Support, Unlimited Bandwidth.';
    } else {
      productSpecs = 'Product: Ultra-Noise Cancelling Wireless Headphones. Specifications: Active Noise Cancellation (ANC): Yes (35dB), Battery Life: 40 Hours playtime with fast charging, Connectivity: Bluetooth 5.3 + 3.5mm Aux, Water Resistance: IPX5 Splashproof, Warranty: 1 Year Comprehensive Replacement Warranty.';
    }

    try {
      const res = await fetch('/api/business/triage-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: app.id || 'biz_default',
          message: userMsg,
          customer_context: {
            mode: 'in_context_product_assistant',
            product_specs: productSpecs,
            product_category: demoProductCategory,
            action_button_label: actionButtonLabel
          }
        })
      });
      const data = await res.json();
      let replyText = '';
      if (data.success && data.reply) {
        replyText = data.reply;
      } else {
        if (demoProductCategory === 'hotel') {
          if (/ac|balcony|hawa/i.test(userMsg)) {
            replyText = `Yes, this Deluxe King Ocean Suite includes both a Split Inverter AC and a private Sea View balcony. Complimentary breakfast buffet is also included with your reservation.`;
          } else {
            replyText = `The Deluxe King Ocean Suite is available at ₹4,499/night with AC, high-speed WiFi, private balcony, and breakfast included. Standard check-in starts at 12:00 PM.`;
          }
        } else if (demoProductCategory === 'food') {
          if (/veg|non-veg|shakahari/i.test(userMsg)) {
            replyText = `Yes, Paneer Lababdar is 100% Pure Vegetarian. It is prepared with fresh cottage cheese in a mild tomato-cashew gravy (Allergens: Dairy & Cashew).`;
          } else {
            replyText = `This combo is 100% Pure Vegetarian with a mild-to-medium spice level, served with fresh cottage cheese and butter naan.`;
          }
        } else if (demoProductCategory === 'saas') {
          replyText = `The Cloud Cluster Pro Plan includes 8 dedicated vCPUs, 32GB RAM, 500GB NVMe storage, and 99.99% SLA with automated daily backups.`;
        } else {
          replyText = `Yes, these headphones offer 40 hours of battery life with ANC enabled and come with a 1-year comprehensive replacement warranty.`;
        }
      }

      setDemoAnswer(replyText);
      setChatHistory(prev => [...prev, { role: 'assistant', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch {
      let fallbackText = '';
      if (demoProductCategory === 'hotel') {
        fallbackText = `Deluxe King Ocean Suite includes Split Inverter AC, private Sea View balcony, and complimentary breakfast.`;
      } else if (demoProductCategory === 'food') {
        fallbackText = `This item is 100% Pure Vegetarian, prepared with fresh cottage cheese and mild cashew gravy.`;
      } else if (demoProductCategory === 'saas') {
        fallbackText = `Cloud Cluster Pro provides 8 vCPUs, 32GB RAM, and 99.99% guaranteed uptime SLA.`;
      } else {
        fallbackText = `This product features 40 hours battery life and 1-year replacement warranty.`;
      }
      setDemoAnswer(fallbackText);
      setChatHistory(prev => [...prev, { role: 'assistant', text: fallbackText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setIsAnsweringDemo(false);
      setDemoQuestion('');
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
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER */}
      <div className={`rounded-xl border p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${
        isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border shrink-0 ${
            isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-[#f8fafc] border-[#dddddd] text-[#181d26]'
          }`}>
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-[#181d26] dark:text-white">
                Web Widget &amp; Automation Suite
              </h2>
            </div>
            <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Configure in-context product assistants, slide-up drawers, headless AI backends, knowledge base FAQs, and rate limits for <strong>{app.app_name}</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#181d26] hover:bg-[#0d1218] dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-[#181d26] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
        >
          {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#dddddd] dark:border-[#2d333f] pb-3">
        {[
          { id: 'widget_customizer', label: 'In-Context Assistant & Studio', icon: Sliders },
          { id: 'widget_sdk', label: 'SDK Generator & Headless API', icon: Terminal },
          { id: 'ai_model', label: 'AI Engine & BYOK', icon: Key },
          { id: 'rate_limits', label: 'Rate Limits & Abuse Guard', icon: Shield },
          { id: 'knowledge', label: 'Knowledge Base & FAQs', icon: FileText, count: faqs.length },
          { id: 'workflows', label: 'Automations & Triage Rules', icon: Zap, count: triageRules.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] shadow-xs'
                  : 'text-[#333840] dark:text-zinc-400 hover:bg-[#f8fafc] dark:hover:bg-[#222834] hover:text-[#181d26] dark:hover:text-white'
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

      {/* TAB 1: IN-CONTEXT ASSISTANT & STUDIO */}
      {activeSubTab === 'widget_customizer' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* SECTION A: IN-CONTEXT PRODUCT ACTION BUTTON & HALF-SCREEN DRAWER */}
          <div className={`rounded-xl border p-6 sm:p-8 transition-colors ${
            isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dddddd] dark:border-[#2d333f]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-normal tracking-tight text-[#181d26] dark:text-white">
                    In-Context Assistant Customizer
                  </h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[#181d26] dark:text-zinc-300 border border-[#dddddd] dark:border-[#2d333f]">
                    Universal Architecture
                  </span>
                </div>
                <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Attach an interactive assistant directly beside any product, booking tier, service plan, or order page. When clicked, it slides up an elegant half-screen sheet with full item grounding and zero hallucination.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#181d26] hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26] dark:hover:bg-zinc-100 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save Customizer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
              
              {/* LEFT 6 COLS: ADVANCED DEVELOPER CONTROLS */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 1. Integration Mode Switcher */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#181d26] dark:text-white block">
                    Integration Architecture
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'turnkey_drawer', label: 'Slide-up Sheet', desc: 'Half-screen modal drawer' },
                      { id: 'headless_sdk', label: 'Headless SDK', desc: 'Build your own custom UI' },
                      { id: 'inline_embed', label: 'Inline Card', desc: 'Embeds in page layout' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setIntegrationMode(mode.id as any)}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          integrationMode === mode.id
                            ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] border-[#181d26] dark:border-white'
                            : 'bg-white dark:bg-[#1d1f25] border-[#dddddd] dark:border-[#2d333f] text-[#333840] dark:text-zinc-300 hover:border-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-medium">{mode.label}</div>
                        <div className="text-[11px] opacity-70 mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Button Label (Pure input, no hardcoded spam) */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#181d26] dark:text-white flex items-center justify-between">
                    <span>Button Text &amp; Trigger Label</span>
                    <span className="text-[11px] text-[#333840] dark:text-zinc-400">Directly customizable</span>
                  </label>
                  <input
                    type="text"
                    value={actionButtonLabel}
                    onChange={e => setActionButtonLabel(e.target.value)}
                    placeholder="Enter button label (e.g., Ask Assistant, Check Specs, Help)"
                    className={`w-full px-3.5 py-2.5 rounded-md border text-xs sm:text-sm outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#1d1f25] border-[#2d333f] text-white focus:border-white' 
                        : 'bg-white border-[#dddddd] text-[#181d26] focus:border-[#181d26]'
                    }`}
                  />
                </div>

                {/* 3. Visual Styling & Sheet Dimensions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#181d26] dark:text-white block">
                      Visual Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'solid', label: 'Dark Solid' },
                        { id: 'outline', label: 'Hairline' },
                        { id: 'pill', label: 'Pill Capsule' },
                        { id: 'subtle', label: 'Warm Soft' }
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setActionButtonStyle(st.id as any)}
                          className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer text-center ${
                            actionButtonStyle === st.id
                              ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] border-[#181d26] dark:border-white'
                              : 'bg-white dark:bg-[#1d1f25] border-[#dddddd] dark:border-[#2d333f] text-[#333840] dark:text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#181d26] dark:text-white block">
                      Drawer Sheet Height
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'compact', label: '40vh' },
                        { id: 'half', label: '50vh (Half)' },
                        { id: 'full', label: '65vh' }
                      ].map(h => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setDrawerHeight(h.id as any)}
                          className={`px-2.5 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer text-center ${
                            drawerHeight === h.id
                              ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] border-[#181d26] dark:border-white'
                              : 'bg-white dark:bg-[#1d1f25] border-[#dddddd] dark:border-[#2d333f] text-[#333840] dark:text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Universal Auto-Context Extraction Settings */}
                <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
                  isDark ? 'bg-[#1d1f25] border-[#2d333f]' : 'bg-[#f8fafc] border-[#dddddd]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-[#181d26] dark:text-white">
                        Universal Specification Extractor
                      </h4>
                      <p className="text-xs text-[#333840] dark:text-zinc-400 mt-0.5">
                        Extracts Schema.org JSON-LD, OpenGraph tags, or custom containers.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={autoExtractDom}
                        onChange={e => setAutoExtractDom(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#181d26] dark:peer-checked:bg-white dark:peer-checked:after:bg-[#181d26]"></div>
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#333840] dark:text-zinc-400 block mb-1">
                      Custom CSS Selector Fallback (Optional)
                    </label>
                    <input
                      type="text"
                      value={customCssSelector}
                      onChange={e => setCustomCssSelector(e.target.value)}
                      placeholder=".item-specs, #room-amenities, [data-specs]"
                      className={`w-full px-3 py-1.5 rounded-md border text-xs font-mono outline-none ${
                        isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT 6 COLS: LIVE INTERACTIVE STOREFRONT CARD & HALF-SCREEN BOTTOM SHEET PREVIEW */}
              <div className={`lg:col-span-6 rounded-xl border p-6 space-y-4 relative overflow-hidden transition-colors ${
                isDark ? 'bg-[#1d1f25] border-[#2d333f]' : 'bg-[#f8fafc] border-[#dddddd]'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-[#dddddd] dark:border-[#2d333f]">
                  <div className="text-xs font-medium text-[#181d26] dark:text-white flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Interactive Storefront &amp; Sheet Simulator</span>
                  </div>
                  
                  {/* Category Switcher for Mock Testing */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'hotel', label: 'Hospitality' },
                      { id: 'food', label: 'Restaurant' },
                      { id: 'ecommerce', label: 'E-commerce' },
                      { id: 'saas', label: 'SaaS Cloud' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setDemoProductCategory(cat.id as any);
                          setDemoAnswer(null);
                          if (cat.id === 'hotel') setDemoQuestion('Kya is hotel room me AC aur balcony dono hai?');
                          else if (cat.id === 'food') setDemoQuestion('Kya yeh dish 100% pure veg hai aur isme nuts hai?');
                          else if (cat.id === 'saas') setDemoQuestion('What is the uptime SLA and RAM allowance for this cluster?');
                          else setDemoQuestion('Is headphones me battery kitne ghante chalti hai aur warranty hai?');
                        }}
                        className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                          demoProductCategory === cat.id
                            ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] border-[#181d26] dark:border-white'
                            : 'bg-white dark:bg-[#181d26] border-[#dddddd] dark:border-[#2d333f] text-[#333840] dark:text-zinc-400'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mockup Product Card on Developer's Website */}
                <div className="rounded-xl border border-[#dddddd] dark:border-[#2d333f] bg-white dark:bg-[#181d26] p-5 space-y-4 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-[#333840] dark:text-zinc-400 uppercase tracking-wider">
                        {demoProductCategory === 'hotel' ? 'Suite & Villa' : demoProductCategory === 'food' ? 'Dining Menu' : demoProductCategory === 'saas' ? 'Cloud Infrastructure' : 'Consumer Hardware'}
                      </div>
                      <h4 className="text-base font-medium text-[#181d26] dark:text-white">
                        {demoProductCategory === 'hotel' 
                          ? 'Deluxe King Ocean Suite' 
                          : demoProductCategory === 'food' 
                          ? 'Paneer Lababdar & Butter Naan' 
                          : demoProductCategory === 'saas'
                          ? 'Cloud Cluster Pro (Dedicated)'
                          : 'Ultra-Noise Cancelling Headphones'}
                      </h4>
                      <p className="text-xs text-[#333840] dark:text-zinc-400 leading-relaxed">
                        {demoProductCategory === 'hotel'
                          ? 'Split Inverter AC · Private Balcony · Free Breakfast Buffet · 12 PM Check-in'
                          : demoProductCategory === 'food'
                          ? '100% Pure Vegetarian · Cottage Cheese in Tomato Cashew Gravy · Mild Spiced'
                          : demoProductCategory === 'saas'
                          ? '8 vCPU · 32GB RAM · 500GB NVMe · 99.99% SLA · Automated Daily Backups'
                          : '40-Hour Battery · ANC 35dB · IPX5 Splashproof · 1-Year Replacement Warranty'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-medium text-[#181d26] dark:text-white">
                        {demoProductCategory === 'hotel' ? '₹4,499' : demoProductCategory === 'food' ? '₹349' : demoProductCategory === 'saas' ? '$49' : '₹6,999'}
                      </span>
                      <span className="block text-[10px] text-[#333840] dark:text-zinc-400">
                        {demoProductCategory === 'hotel' ? '/ night' : demoProductCategory === 'food' ? 'per order' : demoProductCategory === 'saas' ? '/ month' : 'incl. tax'}
                      </span>
                    </div>
                  </div>

                  {/* Trigger Action Button */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(true)}
                      className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                        actionButtonStyle === 'pill'
                          ? 'rounded-full bg-[#181d26] text-white hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26]'
                          : actionButtonStyle === 'outline'
                          ? 'rounded-lg border border-[#dddddd] dark:border-[#2d333f] bg-white dark:bg-transparent text-[#181d26] dark:text-white hover:bg-[#f8fafc]'
                          : actionButtonStyle === 'subtle'
                          ? 'rounded-lg bg-[#f5e9d4] border border-[#d9a441]/40 text-[#181d26] hover:bg-[#f0dfc2]'
                          : 'rounded-lg bg-[#181d26] text-white hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26]'
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>{actionButtonLabel || 'Ask Assistant'}</span>
                    </button>

                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-medium rounded-lg border border-[#dddddd] dark:border-[#2d333f] bg-[#f8fafc] dark:bg-[#1d1f25] text-[#333840] dark:text-zinc-300 cursor-not-allowed opacity-60"
                    >
                      {demoProductCategory === 'hotel' ? 'Book Room' : demoProductCategory === 'saas' ? 'Deploy Cluster' : 'Add to Cart'}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#333840] dark:text-zinc-400 text-center py-1">
                  Click &quot;{actionButtonLabel || 'Ask Assistant'}&quot; to test the live slide-up drawer simulation below.
                </div>

                {/* THE HALF-SCREEN SLIDE-UP BOTTOM SHEET DRAWER (PREVIEW) */}
                {isDrawerOpen && (
                  <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex flex-col justify-end animate-in fade-in duration-200">
                    <div 
                      className={`w-full rounded-t-2xl border-t border-x border-[#dddddd] dark:border-[#2d333f] p-5 flex flex-col justify-between shadow-2xl transition-all animate-in slide-in-from-bottom duration-300 ${
                        drawerHeight === 'compact' ? 'h-[65%]' : drawerHeight === 'full' ? 'h-[90%]' : 'h-[75%]'
                      } ${
                        isDark ? 'bg-[#181d26] text-white' : 'bg-white text-[#181d26]'
                      }`}
                    >
                      {/* Drawer Drag Bar & Header */}
                      <div>
                        <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-3" />
                        
                        <div className="flex items-center justify-between pb-3 border-b border-[#dddddd] dark:border-[#2d333f]">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] flex items-center justify-center">
                              <Bot className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-[#181d26] dark:text-white">
                                {actionButtonLabel || 'Product Assistant'}
                              </h5>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                                <Check className="h-3 w-3" />
                                <span>Verified item specifications active</span>
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-1 rounded-md border border-[#dddddd] dark:border-[#2d333f] text-[#333840] dark:text-zinc-300 hover:bg-[#f8fafc] dark:hover:bg-[#222834] cursor-pointer"
                            title="Close Sheet"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Conversation Area */}
                      <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                        {chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26]'
                                  : 'bg-[#f8fafc] dark:bg-[#1d1f25] border border-[#dddddd] dark:border-[#2d333f] text-[#181d26] dark:text-white'
                              }`}
                            >
                              <p>{msg.text}</p>
                            </div>
                            <span className="text-[10px] text-zinc-400 mt-0.5 px-1">{msg.time}</span>
                          </div>
                        ))}

                        {isAnsweringDemo && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8fafc] dark:bg-[#1d1f25] border border-[#dddddd] dark:border-[#2d333f] text-xs text-zinc-500">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Checking specification sheet &amp; verifying facts...</span>
                          </div>
                        )}
                      </div>

                      {/* Question Input Box */}
                      <div className="pt-2 border-t border-[#dddddd] dark:border-[#2d333f] flex items-center gap-2">
                        <input
                          type="text"
                          value={demoQuestion}
                          onChange={e => setDemoQuestion(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleTestInContextQuery();
                          }}
                          placeholder="Ask anything in your preferred language (Hindi, Hinglish, English)..."
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${
                            isDark 
                              ? 'bg-[#1d1f25] border-[#2d333f] text-white focus:border-white' 
                              : 'bg-white border-[#dddddd] text-[#181d26] focus:border-[#181d26]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleTestInContextQuery}
                          disabled={isAnsweringDemo || !demoQuestion.trim()}
                          className="px-3.5 py-2 rounded-lg bg-[#181d26] hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26] text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Ask</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: FLOATING CHAT BUBBLE THEME & SHORTCUTS */}
          <div className={`rounded-xl border p-6 sm:p-8 space-y-6 transition-colors ${
            isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
          }`}>
            <h3 className="text-xl font-normal tracking-tight text-[#181d26] dark:text-white pb-4 border-b border-[#dddddd] dark:border-[#2d333f]">
              Global Storefront Launcher Theme &amp; Shortcuts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Colors */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#181d26] dark:text-white block">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="h-8 w-12 rounded border border-[#dddddd] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className={`w-32 px-3 py-1.5 rounded-md border text-xs font-mono outline-none ${
                        isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
                      }`}
                    />
                    <div className="flex items-center gap-1.5">
                      {['#181d26', '#aa2d00', '#0a2e0e', '#1b61c9', '#d9a441'].map(c => (
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
                  <label className="text-xs font-medium text-[#181d26] dark:text-white block">
                    Launcher Position
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
                        className={`px-3.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                          position === pos.id
                            ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26] border-[#181d26] dark:border-white'
                            : 'border-[#dddddd] dark:border-[#2d333f] text-[#333840] dark:text-zinc-400 hover:border-zinc-400'
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
                    <label className="text-xs font-medium text-[#181d26] dark:text-white block mb-1">
                      Greeting Title
                    </label>
                    <input
                      type="text"
                      value={greetingTitle}
                      onChange={e => setGreetingTitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md border text-xs outline-none ${
                        isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#181d26] dark:text-white block mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={greetingSubtitle}
                      onChange={e => setGreetingSubtitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md border text-xs outline-none ${
                        isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Quick replies */}
              <div className="space-y-4">
                <span className="text-xs font-medium text-[#181d26] dark:text-white block">
                  Canned Shortcuts
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newQrShortcut}
                    onChange={e => setNewQrShortcut(e.target.value)}
                    placeholder="/shortcut"
                    className={`px-2.5 py-1.5 rounded-md border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
                    }`}
                  />
                  <input
                    type="text"
                    value={newQrTitle}
                    onChange={e => setNewQrTitle(e.target.value)}
                    placeholder="Button Label"
                    className={`col-span-2 px-2.5 py-1.5 rounded-md border text-xs outline-none ${
                      isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
                    }`}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQrContent}
                    onChange={e => setNewQrContent(e.target.value)}
                    placeholder="Canned response dispatched to customer..."
                    className={`flex-1 px-2.5 py-1.5 rounded-md border text-xs outline-none ${
                      isDark ? 'bg-[#1d1f25] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26]'
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
                    className="px-3.5 py-1.5 rounded-md bg-[#181d26] hover:bg-[#0d1218] dark:bg-white dark:text-[#181d26] text-white text-xs font-medium cursor-pointer disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickReplies.map(qr => (
                    <span
                      key={qr.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#dddddd] dark:border-[#2d333f] text-xs bg-[#f8fafc] dark:bg-[#1d1f25]"
                    >
                      <span className="font-mono text-zinc-500">{qr.shortcut}</span>
                      <span className="font-medium text-[#181d26] dark:text-white">{qr.title}</span>
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
          </div>
        </div>
      )}

      {/* TAB 2: SDK GENERATOR & HEADLESS API */}
      {activeSubTab === 'widget_sdk' && (() => {
        const publicApiKey = app?.public_widget_key || app?.public_key || app?.widget_key || (app?.api_key ? `zen_pub_live_${String(app.api_key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}` : 'zen_pub_live_98a72f0b4c81e2d93e');
        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* SDK Selection Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-[#dddddd] dark:border-[#2d333f] pb-3">
              {[
                { id: 'turnkey', label: '1. Turnkey Drop-in Script & Drawer', icon: Layers },
                { id: 'headless', label: '2. Headless SDK (Build Custom UI in your app)', icon: Code2 },
                { id: 'react', label: '3. React / Next.js Component', icon: Terminal }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveSdkCodeTab(t.id as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                    activeSdkCodeTab === t.id
                      ? 'bg-[#181d26] text-white dark:bg-white dark:text-[#181d26]'
                      : 'text-[#333840] dark:text-zinc-400 hover:bg-[#f8fafc] dark:hover:bg-[#222834]'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* 1. TURNKEY DROP-IN SCRIPT & DRAWER */}
            {activeSdkCodeTab === 'turnkey' && (
              <div className={`rounded-xl border p-6 sm:p-8 space-y-6 transition-colors ${
                isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
              }`}>
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#dddddd] dark:border-[#2d333f]">
                  <div>
                    <h3 className="text-xl font-normal tracking-tight text-[#181d26] dark:text-white">
                      Turnkey Drop-in Script &amp; Bottom-Sheet
                    </h3>
                    <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 mt-1 max-w-2xl">
                      Add the script tag to your HTML with your Public Key (<code>{publicApiKey.substring(0, 16)}...</code>). Place the button attribute beside any product or item to trigger the half-screen drawer.
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    Public Key Active
                  </span>
                </div>

                {/* Step A: Global Script */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#181d26] dark:text-white">
                      Step 1: Embed Script in <code>&lt;head&gt;</code> or before <code>&lt;/body&gt;</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `<script src="${window.location.origin}/widget/v2/zenoa-widget.js" data-zenoa-key="${publicApiKey}" data-project-id="${app.id || 'project_dev'}" async></script>`;
                        navigator.clipboard.writeText(snippet);
                        showToast('Embed script tag copied!');
                      }}
                      className="text-xs font-medium text-[#181d26] dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Script Tag</span>
                    </button>
                  </div>
                  <div className={`p-3.5 rounded-md border font-mono text-xs overflow-x-auto ${
                    isDark ? 'bg-[#181d26] border-[#2d333f] text-emerald-400' : 'bg-[#f8fafc] border-[#dddddd] text-[#181d26]'
                  }`}>
                    <code>{`<script src="${window.location.origin}/widget/v2/zenoa-widget.js" data-zenoa-key="${publicApiKey}" data-project-id="${app.id || 'project_dev'}" async></script>`}</code>
                  </div>
                </div>

                {/* Step B: Button Tag */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#181d26] dark:text-white">
                      Step 2: Place Button on any Item / Product Page
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = `<button class="zenoa-assistant-btn" data-zenoa-assistant data-zenoa-key="${publicApiKey}" data-zenoa-label="${actionButtonLabel}">${actionButtonLabel}</button>`;
                        navigator.clipboard.writeText(snippet);
                        showToast('HTML button tag copied!');
                      }}
                      className="text-xs font-medium text-[#181d26] dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Button Tag</span>
                    </button>
                  </div>
                  <div className={`p-3.5 rounded-md border font-mono text-xs overflow-x-auto ${
                    isDark ? 'bg-[#181d26] border-[#2d333f] text-zinc-300' : 'bg-[#f8fafc] border-[#dddddd] text-[#181d26]'
                  }`}>
                    <code>{`<button class="zenoa-assistant-btn" data-zenoa-assistant data-zenoa-key="${publicApiKey}" data-zenoa-label="${actionButtonLabel}">${actionButtonLabel}</button>`}</code>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HEADLESS SDK (DEVELOPER BUILDS OWN CUSTOM UI) */}
            {activeSdkCodeTab === 'headless' && (
              <div className={`rounded-xl border p-6 sm:p-8 space-y-6 transition-colors ${
                isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
              }`}>
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#dddddd] dark:border-[#2d333f]">
                  <div>
                    <h3 className="text-xl font-normal tracking-tight text-[#181d26] dark:text-white">
                      Headless SDK &amp; Direct Query API
                    </h3>
                    <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 mt-1 max-w-2xl">
                      Build your own completely custom modal, drawer, or inline assistant inside your application using your Public Key (<code>{publicApiKey.substring(0, 16)}...</code>).
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[#181d26] dark:text-zinc-300 border border-[#dddddd] dark:border-[#2d333f]">
                    Complete UI Control
                  </span>
                </div>

                {/* Headless TypeScript / JavaScript */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#181d26] dark:text-white">
                      JavaScript / TypeScript SDK Call
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const headlessSnippet = `import { ZenoaClient } from '@zenoa/sdk';\n\nconst zenoa = new ZenoaClient({ apiKey: '${publicApiKey}' });\n\n// Call inside your custom button click handler or React state:\nconst response = await zenoa.askAssistant({\n  question: 'Is this room air conditioned?',\n  itemSpecs: {\n    title: 'Deluxe King Suite',\n    amenities: ['AC', 'Balcony', 'Breakfast'],\n    price: 4499\n  },\n  locale: 'auto' // Supports Hindi, Hinglish, English, etc.\n});\n\nconsole.log(response.answer); // Verified factual answer`;
                        navigator.clipboard.writeText(headlessSnippet);
                        showToast('Headless SDK snippet copied!');
                      }}
                      className="text-xs font-medium text-[#181d26] dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy SDK Code</span>
                    </button>
                  </div>
                  <div className={`p-3.5 rounded-md border font-mono text-xs overflow-x-auto ${
                    isDark ? 'bg-[#181d26] border-[#2d333f] text-zinc-300' : 'bg-[#f8fafc] border-[#dddddd] text-[#181d26]'
                  }`}>
                    <pre>{`import { ZenoaClient } from '@zenoa/sdk';

const zenoa = new ZenoaClient({ apiKey: '${publicApiKey}' });

// Call inside your custom button or state handler:
const response = await zenoa.askAssistant({
  question: 'Is this room air conditioned?',
  itemSpecs: {
    title: 'Deluxe King Suite',
    amenities: ['AC', 'Balcony', 'Breakfast'],
    price: 4499
  },
  locale: 'auto' // Supports Hindi, Hinglish, English, etc.
});

console.log(response.answer); // Grounded factual response`}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* 3. REACT / NEXT.JS COMPONENT */}
            {activeSdkCodeTab === 'react' && (
              <div className={`rounded-xl border p-6 sm:p-8 space-y-6 transition-colors ${
                isDark ? 'bg-[#181d26] border-[#2d333f] text-white' : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
              }`}>
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#dddddd] dark:border-[#2d333f]">
                  <div>
                    <h3 className="text-xl font-normal tracking-tight text-[#181d26] dark:text-white">
                      React &amp; Next.js Drop-in Component
                    </h3>
                    <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 mt-1 max-w-2xl">
                      Import the ready-to-use React component configured with your Public Key.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#181d26] dark:text-white">
                      React Component Integration
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const reactSnippet = `import { ZenoaAssistantButton } from '@zenoa/react';\n\nexport function ProductCard({ item }) {\n  return (\n    <div className="border rounded-xl p-4">\n      <h3>{item.name}</h3>\n      <p>{item.description}</p>\n      \n      {/* Zenoa Assistant with slide-up half-screen sheet */}\n      <ZenoaAssistantButton \n        apiKey="${publicApiKey}"\n        label="${actionButtonLabel}"\n        specs={item.specifications}\n        drawerHeight="${drawerHeight}"\n      />\n    </div>\n  );\n}`;
                        navigator.clipboard.writeText(reactSnippet);
                        showToast('React component snippet copied!');
                      }}
                      className="text-xs font-medium text-[#181d26] dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy React Snippet</span>
                    </button>
                  </div>
                  <div className={`p-3.5 rounded-md border font-mono text-xs overflow-x-auto ${
                    isDark ? 'bg-[#181d26] border-[#2d333f] text-zinc-300' : 'bg-[#f8fafc] border-[#dddddd] text-[#181d26]'
                  }`}>
                    <pre>{`import { ZenoaAssistantButton } from '@zenoa/react';

export function ProductCard({ item }) {
  return (
    <div className="border rounded-xl p-4">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      
      {/* Zenoa Assistant with slide-up half-screen sheet */}
      <ZenoaAssistantButton 
        apiKey="${publicApiKey}"
        label="${actionButtonLabel}"
        specs={item.specifications}
        drawerHeight="${drawerHeight}"
      />
    </div>
  );
}`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 3: AI ENGINE & BRING YOUR OWN KEY (BYOK) */}
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
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={e => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#533afd]"></div>
              </label>
            </div>

            {/* Provider Grid */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Select Intelligence Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'google', label: 'Google Cloud' },
                  { id: 'openai', label: 'OpenAI' },
                  { id: 'anthropic', label: 'Anthropic' },
                  { id: 'groq', label: 'Groq LPU' },
                  { id: 'mistral', label: 'Mistral AI' },
                  { id: 'openrouter', label: 'OpenRouter' },
                  { id: 'custom', label: 'Custom VPS' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAiProvider(p.id as any);
                      const models = PROVIDER_MODELS[p.id];
                      if (models && models.length > 0) setAiModel(models[0].id);
                    }}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-center ${
                      aiProvider === p.id
                        ? 'bg-[#533afd] text-white border-[#533afd] shadow-sm'
                        : isDark
                        ? 'bg-[#0d1326] border-[#273951] text-zinc-300 hover:border-zinc-500'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Select */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Active Model
              </label>
              {aiProvider === 'custom' || useCustomModelInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    placeholder="e.g. meta-llama/Llama-3-70b-chat-hf"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomModelInput(false)}
                    className="px-3 py-2 rounded-lg border text-xs font-medium text-zinc-600 dark:text-zinc-300"
                  >
                    Presets
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <CustomSelect
                    value={aiModel}
                    onChange={(val) => setAiModel(val)}
                    options={(PROVIDER_MODELS[aiProvider] || []).map(m => ({
                      value: m.id,
                      label: `${m.label} — ${m.desc}`
                    }))}
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomModelInput(true)}
                    className="text-[11px] text-[#533afd] hover:underline font-mono"
                  >
                    + Enter custom model identifier
                  </button>
                </div>
              )}
            </div>

            {/* Custom API Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {aiProvider.toUpperCase()} API Key (BYOK)
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Encrypted at rest (AES-256-GCM)
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiApiKey}
                    onChange={e => setAiApiKey(e.target.value)}
                    placeholder={`Enter your ${aiProvider.toUpperCase()} API Key`}
                    className={`w-full px-3 py-2 pr-10 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingKey || !aiApiKey.trim()}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {isTestingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>Test Key</span>
                </button>
              </div>

              {/* Key probe status badge */}
              {keyTestStatus === 'success' && (
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Check className="h-4 w-4" />
                    Provider authenticated successfully
                  </span>
                  {keyTestLatency && (
                    <span className="font-mono text-[11px]">{keyTestLatency}ms round-trip</span>
                  )}
                </div>
              )}

              {keyTestStatus === 'error' && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{keyTestError || 'Key verification failed. Check permissions.'}</span>
                </div>
              )}
            </div>

            {/* Custom Endpoint for Self-Hosted */}
            {aiProvider === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Custom OpenAI-Compatible Base URL
                </label>
                <input
                  type="text"
                  value={aiCustomEndpoint}
                  onChange={e => setAiCustomEndpoint(e.target.value)}
                  placeholder="https://vps.yourdomain.com/v1/chat/completions"
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>
            )}

            {/* System Prompt Customizer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Assistant System Instruction Prompt
                </label>
                
                {/* Preset Prompt Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetPrompt('ecommerce')}
                    className="text-[11px] text-[#533afd] hover:underline"
                  >
                    E-Commerce
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetPrompt('saas')}
                    className="text-[11px] text-[#533afd] hover:underline"
                  >
                    SaaS
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetPrompt('hospitality')}
                    className="text-[11px] text-[#533afd] hover:underline"
                  >
                    Hotel
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={aiSystemPrompt}
                onChange={e => setAiSystemPrompt(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-sans leading-relaxed ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            {/* Hyperparameters: Temperature & Tone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Temperature (Creativity)</span>
                  <span className="font-mono text-zinc-500">{aiTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={aiTemperature}
                  onChange={e => setAiTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#533afd] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Conversational Tone
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['friendly', 'concise', 'technical', 'formal'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={`py-1.5 text-[11px] rounded border capitalize cursor-pointer ${
                        aiTone === t
                          ? 'bg-[#533afd] text-white border-[#533afd]'
                          : isDark
                          ? 'bg-[#0d1326] border-[#273951] text-zinc-400'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: LIVE TEST SANDBOX */}
          <div className={`rounded-xl border p-5 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#533afd]" />
                  <h4 className="text-xs font-semibold text-[#0d253d] dark:text-white uppercase tracking-wider">
                    Interactive Sandbox
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Isolated</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Simulate Customer Message
                </label>
                <textarea
                  rows={3}
                  value={sandboxPrompt}
                  onChange={e => setSandboxPrompt(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulatingAi || !sandboxPrompt.trim()}
                className="w-full py-2 rounded-lg bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
              >
                {isSimulatingAi ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>Run Real-Time Inference</span>
              </button>

              {/* Response Display */}
              {sandboxResponse && (
                <div className={`p-3.5 rounded-xl border space-y-2 text-xs animate-in fade-in duration-150 ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                }`}>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Inference Output</span>
                    <span className="text-emerald-500">200 OK</span>
                  </div>
                  <p className="leading-relaxed font-sans">{sandboxResponse}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
              Inferences in this sandbox verify your system prompt, model parameters, and knowledge base.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RATE LIMITS & ABUSE GUARD */}
      {activeSubTab === 'rate_limits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-xl border p-5 space-y-5 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white">
                  Granular Rate Limiting &amp; Anti-Spam Guard
                </h3>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                  Protect your BYOK AI balance, database bandwidth, and customer chat channels.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rateLimitingEnabled}
                  onChange={e => setRateLimitingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#533afd]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Customer Cooldown Between Messages
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customerCooldownSeconds}
                    onChange={e => setCustomerCooldownSeconds(parseInt(e.target.value) || 3)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-mono">seconds</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Customer Messages / Minute
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={maxMessagesPerMinute}
                    onChange={e => setMaxMessagesPerMinute(parseInt(e.target.value) || 8)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-mono">req/min</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Burst Cooldown Penalty
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={burstCooldownSeconds}
                    onChange={e => setBurstCooldownSeconds(parseInt(e.target.value) || 20)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-mono">seconds</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  IP Abuse Lock Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={ipAbuseBlockMinutes}
                    onChange={e => setIpAbuseBlockMinutes(parseInt(e.target.value) || 10)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <span className="text-xs text-zinc-500 font-mono">minutes</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-semibold text-[#0d253d] dark:text-white uppercase tracking-wider">
                  Burst Attack Simulator
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Stress Test</span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Launch a high-frequency probe against your rate limiting logic to confirm abuse containment.
            </p>

            <button
              type="button"
              onClick={handleSimulateAbuse}
              disabled={isSimulatingAbuse}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isSimulatingAbuse ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span>Simulate 20 Rapid Requests</span>
            </button>

            {abuseSimulationLogs && (
              <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
                {abuseSimulationLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-[11px] font-mono flex items-center justify-between ${
                      log.status === 'allowed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : log.status === 'throttled'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <span>#{log.seq} {log.status.toUpperCase()}</span>
                    <span>{log.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: KNOWLEDGE BASE FAQS */}
      {activeSubTab === 'knowledge' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Verified Knowledge Base Entries ({faqs.length})
            </h3>

            {faqs.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No FAQs added yet. Add questions below to train your assistant.
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map(faq => (
                  <div
                    key={faq.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                      isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-zinc-900 dark:text-white">
                        {faq.question}
                      </div>
                      <button
                        onClick={() => setFaqs(prev => prev.filter(f => f.id !== faq.id))}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h4 className="text-xs font-semibold text-[#0d253d] dark:text-white uppercase tracking-wider pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Add New Knowledge FAQ
            </h4>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Customer Question
              </label>
              <input
                type="text"
                value={newFaqQ}
                onChange={e => setNewFaqQ(e.target.value)}
                placeholder="e.g. Do you ship internationally?"
                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Factual Verified Answer
              </label>
              <textarea
                rows={3}
                value={newFaqA}
                onChange={e => setNewFaqA(e.target.value)}
                placeholder="We ship across 45+ countries with DHL Express (3-5 business days)."
                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!newFaqQ.trim() || !newFaqA.trim()) return;
                setFaqs(prev => [
                  ...prev,
                  {
                    id: `faq_${Date.now()}`,
                    question: newFaqQ.trim(),
                    answer: newFaqA.trim(),
                    category: newFaqCat
                  }
                ]);
                setNewFaqQ('');
                setNewFaqA('');
                showToast('Knowledge item added.');
              }}
              disabled={!newFaqQ.trim() || !newFaqA.trim()}
              className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add to Knowledge Base</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: WORKFLOWS & TRIAGE RULES */}
      {activeSubTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h3 className="text-sm font-semibold text-[#0d253d] dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Autonomous Triage Rules ({triageRules.length})
            </h3>

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

          <div className={`rounded-xl border p-5 space-y-4 transition-colors ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-white border-[#e2e8f0]'
          }`}>
            <h4 className="text-xs font-semibold text-[#0d253d] dark:text-white uppercase tracking-wider pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Create Triage Rule
            </h4>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Rule Label
              </label>
              <input
                type="text"
                value={newRuleName}
                onChange={e => setNewRuleName(e.target.value)}
                placeholder="e.g. Delayed Order Tag"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Keyword Match
              </label>
              <input
                type="text"
                value={newRuleMatch}
                onChange={e => setNewRuleMatch(e.target.value)}
                placeholder="e.g. broken, refund, cancel"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                  isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Escalation Action
              </label>
              <CustomSelect
                value={newRuleAction}
                onChange={(val) => setNewRuleAction(val as any)}
                options={[
                  { value: 'escalate_human', label: 'Escalate to Priority Human Agent' },
                  { value: 'trigger_ai', label: 'Trigger AI Autonomous Solver' },
                  { value: 'send_canned', label: 'Dispatch Canned Response' },
                ]}
              />
            </div>

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
              className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Activate Rule</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
