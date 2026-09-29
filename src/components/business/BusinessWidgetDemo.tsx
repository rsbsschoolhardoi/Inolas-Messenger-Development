import React, { useState } from 'react';
import { 
  ShoppingBag, ShieldAlert, ArrowLeft, 
  Sun, Moon, Check, Truck, RotateCcw, Copy, Package
} from 'lucide-react';
import { ZenoaChatWidget } from './ZenoaChatWidget';
import { CustomerContext } from '../../types';

interface BusinessWidgetDemoProps {
  onBackToBusiness?: () => void;
  appId?: string;
  themeMode?: 'light' | 'dark';
}

export const BusinessWidgetDemo: React.FC<BusinessWidgetDemoProps> = ({
  onBackToBusiness,
  appId = 'biz_default',
  themeMode: initialTheme = 'light'
}) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(initialTheme);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [cartCount, setCartCount] = useState(1);
  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedSize, setSelectedSize] = useState('UK 9');

  // Customer Context for live telemetry
  const [customerContext] = useState<CustomerContext>({
    customer_name: 'Rohit Verma',
    customer_email: 'rohit.v@example.com',
    customer_phone: '+91 98112 34567',
    current_page_url: typeof window !== 'undefined' ? window.location.href : '',
    page_title: 'Minimalist Chronometer 01 — Obsidian Edition',
    cart_value: '₹14,999.00',
    cart_items: [
      { name: 'Minimalist Chronometer 01 (Obsidian / 40mm)', qty: 1, price: 14999 }
    ],
    order_id: '#ORD-88219',
    order_status: 'Transit delayed (ETA updated)',
    device_type: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
    location: 'New Delhi, India'
  });

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleCopyEmbedCode = () => {
    const code = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/live-chat.js" 
  data-app-id="${appId}" 
  data-primary-color="#18181b" 
  data-position="bottom-right"
  async>
</script>`;
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const isEmbedMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === 'true';
  if (isEmbedMode) {
    return (
      <div className="h-screen w-screen bg-transparent">
        <ZenoaChatWidget
          appId={appId}
          initialCustomerContext={customerContext}
          themeMode={themeMode}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors ${
      themeMode === 'dark' ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-[#fafafa] text-[#09090b]'
    }`}>
      
      {/* 1. TOP MINIMALIST NAV */}
      <header className={`sticky top-0 z-30 px-4 sm:px-6 h-14 border-b flex items-center justify-between transition-colors ${
        themeMode === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          {onBackToBusiness ? (
            <button
              onClick={onBackToBusiness}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Console</span>
            </button>
          ) : (
            <a
              href="/business"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Console</span>
            </a>
          )}

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs tracking-wider uppercase truncate text-zinc-900 dark:text-white">
              Apex Goods
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
              Storefront Preview
            </span>
          </div>
        </div>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyEmbedCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {copiedScript ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedScript ? 'Copied' : 'Embed Code'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {themeMode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Bag ({cartCount})</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN STOREFRONT CONTENT */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* CALM SIMULATION BANNER */}
        <div className={`rounded-xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          themeMode === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-white">
                Live Store Simulation
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Telemetry Connected
              </span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-normal">
              Test automated product sizing support and order escalation in the live widget.
            </p>
          </div>

          <button
            onClick={() => setIsWidgetOpen(prev => !prev)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            {isWidgetOpen ? 'Hide Widget' : 'Open Widget'}
          </button>
        </div>

        {/* PRODUCT DETAILS CARD */}
        <div className={`rounded-2xl border p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 transition-colors ${
          themeMode === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          {/* PRODUCT VISUAL - PURE MINIMALIST VECTOR */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-8 sm:p-12 flex flex-col items-center justify-center relative border border-zinc-200 dark:border-zinc-800 min-h-[260px] sm:min-h-[320px]">
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              Limited Run
            </span>

            {/* Geometric Vector Minimalist Chronometer Dial */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center relative p-3">
              <div className="w-full h-full rounded-full border border-dashed border-zinc-400 dark:border-zinc-600 flex items-center justify-center relative">
                {/* Dial Tick Marks */}
                <div className="absolute top-1 w-0.5 h-2 bg-zinc-500" />
                <div className="absolute bottom-1 w-0.5 h-2 bg-zinc-500" />
                <div className="absolute left-1 h-0.5 w-2 bg-zinc-500" />
                <div className="absolute right-1 h-0.5 w-2 bg-zinc-500" />

                {/* Minimal Hands */}
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white z-10" />
                <div className="absolute top-4 w-0.5 h-12 bg-zinc-800 dark:bg-zinc-200 origin-bottom" style={{ transform: 'rotate(25deg)' }} />
                <div className="absolute top-6 w-0.5 h-8 bg-zinc-400 origin-bottom" style={{ transform: 'rotate(-70deg)' }} />
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 font-mono mt-5">SKU: CHR-01-OBS</p>
          </div>

          {/* PRODUCT METADATA */}
          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span>Obsidian Series</span>
                <span>•</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">In Stock</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Minimalist Chronometer 01
              </h1>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white font-mono">
                  ₹14,999.00
                </span>
                <span className="text-xs text-zinc-400 line-through font-mono">
                  ₹18,499.00
                </span>
              </div>
            </div>

            {/* SIZE / CASE SELECTOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Case Diameter</span>
                <button 
                  onClick={() => setIsWidgetOpen(true)}
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-[11px] underline cursor-pointer"
                >
                  Need size advice? Ask Live
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {['38mm', '40mm', '42mm', '44mm'].map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                      selectedSize === sz
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-medium'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setCartCount(c => c + 1)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add to Bag — ₹14,999</span>
              </button>

              <div className="grid grid-cols-2 gap-2 text-center text-zinc-500 dark:text-zinc-400 text-[11px]">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Free Express Delivery</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>14-Day Complimentary Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE SIMULATED ORDER BAR */}
        <div className={`rounded-xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          themeMode === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5 sm:mt-0">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                  Order #ORD-88219
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Delay Notice
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Dispatch rescheduled by 24h. Click to test priority support escalation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWidgetOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            Escalate to Human Agent
          </button>
        </div>
      </main>

      {/* 3. RESPONSIVE FLOATING LIVE CHAT WIDGET CONTAINER */}
      {isWidgetOpen && (
        <div className="fixed inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[380px] sm:h-[580px] rounded-2xl overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f12] animate-in fade-in slide-in-from-bottom-3 duration-150">
          <ZenoaChatWidget
            appId={appId}
            initialCustomerContext={customerContext}
            themeMode={themeMode}
            onClose={() => setIsWidgetOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
