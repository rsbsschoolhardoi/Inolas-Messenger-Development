import React, { useState } from 'react';
import { 
  Terminal, Package, Copy, Check, Play, Download, Sparkles, 
  ShieldCheck, ArrowRight, ExternalLink, Code2, RefreshCw, Key,
  Bot, Lock, CheckCircle2, ChevronRight, Laptop
} from 'lucide-react';
import { ZenoaCliRunner } from '../../../sdk/cli';

interface NpmPackageCliViewProps {
  app: any;
  showToast: (msg: string) => void;
  isDark?: boolean;
}

export const NpmPackageCliView: React.FC<NpmPackageCliViewProps> = ({
  app,
  showToast,
  isDark = false
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [cliInput, setCliInput] = useState<string>('zenoa login');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; out: string; time: string }>>([
    {
      cmd: 'npm install @zenoa/sdk',
      out: `added 1 package in 1.2s\n+ @zenoa/sdk@1.0.0\nTarget Platform: https://zenoa-inolas.vercel.app`,
      time: '12:00:00'
    },
    {
      cmd: 'zenoa whoami',
      out: `Logged in as: @${app?.owner || 'developer'}\nActive Service Account: @${app?.bot_username || 'sa_bot'}\nDefault Client ID: ${app?.client_id || 'zen_client_production'}\nTarget Host: https://zenoa-inolas.vercel.app`,
      time: '12:00:05'
    }
  ]);

  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const cliRunner = new ZenoaCliRunner('https://zenoa-inolas.vercel.app');

  const handleCopy = (text: string, keyId: string, label: string = 'Command copied') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    showToast(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExecuteCli = async (customCmd?: string) => {
    const rawCmd = (customCmd || cliInput).trim();
    if (!rawCmd) return;

    setIsRunningCommand(true);
    const args = rawCmd.replace(/^npx\s+/, '').replace(/^zenoa\s*/, '').trim().split(/\s+/).filter(Boolean);
    if (args.length === 0) args.push('help');

    const result = await cliRunner.execute(args, args[0] === 'login' && args.length === 1 ? {
      username: app?.owner || 'developer',
      name: app?.app_name || 'Developer',
      botName: app?.bot_username || 'sa_bot',
      clientId: app?.client_id || 'zen_client_production',
      clientSecret: app?.client_secret || 'zen_sec_production'
    } : undefined);

    setTerminalHistory(prev => [
      ...prev,
      {
        cmd: rawCmd.startsWith('npx') ? rawCmd : `npx zenoa ${args.join(' ')}`,
        out: result.output,
        time: new Date().toLocaleTimeString()
      }
    ]);

    setIsRunningCommand(false);
    setCliInput('');
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                Official NPM Package & CLI
              </span>
              <span className="text-xs text-slate-400 font-semibold">&bull; v1.0.0 Production</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              @zenoa/sdk & Developer CLI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Unified, lightweight TypeScript SDK for Bot Messaging, OTP Dispatch, and OAuth 2.0 Identity. Pre-configured for <strong className="text-indigo-600 dark:text-indigo-400 font-mono">https://zenoa-inolas.vercel.app</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => handleCopy('npm install @zenoa/sdk', 'install_npm', 'Install command copied')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>{copiedKey === 'install_npm' ? 'Copied!' : 'npm install @zenoa/sdk'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Command Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <span>Quick Terminal Commands</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Auth CLI */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>1. Authenticate CLI</span>
              </span>
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                1-Click Web Auth
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Binds your local developer terminal directly to your active Zenoa Messenger Account (@{app?.owner || 'developer'}).
            </p>
            <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <code className="text-indigo-600 dark:text-indigo-400 font-bold">npx zenoa login</code>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExecuteCli('npx zenoa login')}
                  className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-sans font-bold hover:bg-indigo-700 cursor-pointer"
                  title="Run in Live Terminal below"
                >
                  Run
                </button>
                <button
                  onClick={() => handleCopy('npx zenoa login', 'cmd_login')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  title="Copy command"
                >
                  {copiedKey === 'cmd_login' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Bot Dispatch */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
                <span>2. Service Account Bot Dispatch</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                Messaging
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Send verified messages directly from @{app?.bot_username || 'sa_bot'} to any user or group.
            </p>
            <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <code className="text-emerald-600 dark:text-emerald-400 font-bold truncate mr-2">npx zenoa bot status</code>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleExecuteCli('npx zenoa bot status')}
                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-sans font-bold hover:bg-emerald-700 cursor-pointer"
                  title="Run in Live Terminal below"
                >
                  Run
                </button>
                <button
                  onClick={() => handleCopy('npx zenoa bot status', 'cmd_bot_status')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  {copiedKey === 'cmd_bot_status' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: OTP Dispatch */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>3. Live OTP Simulator</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold">
                Passcode
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Test immediate 6-digit passcode delivery via Zenoa Messenger encrypted notification.
            </p>
            <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <code className="text-amber-600 dark:text-amber-400 font-bold truncate mr-2">npx zenoa otp test</code>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleExecuteCli('npx zenoa otp test')}
                  className="px-2 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-sans font-bold hover:bg-amber-700 cursor-pointer"
                  title="Run in Live Terminal below"
                >
                  Run
                </button>
                <button
                  onClick={() => handleCopy('npx zenoa otp test', 'cmd_otp_test')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  {copiedKey === 'cmd_otp_test' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: OAuth List */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-500" />
                <span>4. OAuth 2.0 Client Registry</span>
              </span>
              <span className="text-[10px] font-mono bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded font-bold">
                SSO Identity
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              List and manage your registered client IDs, allowed callback URIs, and scopes.
            </p>
            <div className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <code className="text-sky-600 dark:text-sky-400 font-bold truncate mr-2">npx zenoa oauth list</code>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleExecuteCli('npx zenoa oauth list')}
                  className="px-2 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-sans font-bold hover:bg-sky-700 cursor-pointer"
                  title="Run in Live Terminal below"
                >
                  Run
                </button>
                <button
                  onClick={() => handleCopy('npx zenoa oauth list', 'cmd_oauth_list')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  {copiedKey === 'cmd_oauth_list' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Terminal Emulator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-500" />
            <span>Interactive CLI Terminal Simulator</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">https://zenoa-inolas.vercel.app</span>
        </div>

        <div className="rounded-2xl bg-[#090d16] border border-slate-800 text-slate-200 font-mono text-xs shadow-2xl overflow-hidden">
          {/* Terminal Titlebar */}
          <div className="px-4 py-3 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-semibold text-slate-400">bash &mdash; zenoa-cli v1.0.0</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTerminalHistory([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-sans cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Output Body */}
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <span className="text-emerald-400 font-bold">$</span>
                  <span className="font-bold">{item.cmd}</span>
                  <span className="text-[9px] text-slate-600 ml-auto">{item.time}</span>
                </div>
                <pre className="text-slate-300 whitespace-pre-wrap pl-4 border-l border-slate-800">{item.out}</pre>
              </div>
            ))}

            {isRunningCommand && (
              <div className="flex items-center gap-2 text-slate-400 animate-pulse pl-4">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Executing CLI runner...</span>
              </div>
            )}
          </div>

          {/* Terminal Interactive Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteCli();
            }}
            className="p-3 bg-[#0d1322] border-t border-slate-800 flex items-center gap-2"
          >
            <span className="text-emerald-400 font-bold pl-2">$</span>
            <input
              type="text"
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
              placeholder="Type any command (e.g. zenoa login, zenoa bot status, zenoa --help)..."
              className="flex-1 bg-transparent text-xs text-white outline-none font-mono placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isRunningCommand}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-bold cursor-pointer disabled:opacity-50"
            >
              Execute
            </button>
          </form>
        </div>
      </div>

      {/* Code Integration Preview */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-[#111726] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'} space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Node.js / TypeScript Integration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Production ready code snippet with your active credentials and target host.
            </p>
          </div>
          <button
            onClick={() => handleCopy(
              `import { ZenoaClient } from '@zenoa/sdk';\n\nconst zenoa = new ZenoaClient({\n  clientId: '${app?.client_id || 'zen_client_your_id'}',\n  clientSecret: process.env.ZENOA_CLIENT_SECRET || '${app?.client_secret || 'zen_sec_your_secret'}',\n  baseUrl: 'https://zenoa-inolas.vercel.app'\n});\n\n// 1. Dispatch Bot Message\nawait zenoa.bot.sendMessage({ to: '@demo', text: 'Hello!' });\n\n// 2. Dispatch OTP\nawait zenoa.otp.send({ to: '+919876543210' });\n\n// 3. OAuth 2.0 Auth URL\nconst authUrl = zenoa.auth.getAuthorizationUrl({ redirectUri: 'https://yourapp.com/callback' });`,
              'code_sdk',
              'SDK snippet copied'
            )}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copiedKey === 'code_sdk' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy SDK Snippet</span>
          </button>
        </div>

        <div className="rounded-xl bg-[#090d16] border border-slate-800 p-4 text-xs font-mono text-slate-200 overflow-x-auto">
          <pre className="text-[11px] leading-relaxed">
{`import { ZenoaClient } from '@zenoa/sdk';

const zenoa = new ZenoaClient({
  clientId: '${app?.client_id || 'zen_client_your_id'}',
  clientSecret: process.env.ZENOA_CLIENT_SECRET || '${app?.client_secret || 'zen_sec_your_secret'}',
  baseUrl: 'https://zenoa-inolas.vercel.app'
});

// 1. Send Bot Message via Service Account (@${app?.bot_username || 'sa_bot'})
await zenoa.bot.sendMessage({
  to: '@demo_user',
  text: 'Hello from Zenoa SDK!'
});

// 2. Send 6-Digit Verification Passcode
await zenoa.otp.send({
  to: '+919876543210',
  length: 6,
  template: 'login_verification'
});

// 3. Generate "Continue with Zenoa" Login URL
const authUrl = zenoa.auth.getAuthorizationUrl({
  redirectUri: 'https://yourapp.com/auth/callback',
  scopes: ['openid', 'profile', 'email']
});`}
          </pre>
        </div>
      </div>
    </div>
  );
};
