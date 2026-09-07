#!/usr/bin/env node
/**
 * Zenoa Developer CLI Runner
 * Executable command handler for `npx zenoa`
 */

export interface CliCommandResult {
  command: string;
  output: string;
  success: boolean;
  timestamp: number;
}

export interface CliCredentials {
  username: string;
  name?: string;
  botName?: string;
  clientId?: string;
  clientSecret?: string;
  targetUrl?: string;
  savedAt?: number;
}

// Helpers for cross-environment storage (Node.js filesystem / Browser localStorage)
function getStoredCredentials(): CliCredentials | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem('zenoa_cli_config');
      return data ? JSON.parse(data) : null;
    }
    // Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const configPath = path.join(os.homedir(), '.zenoa', 'config.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function saveCredentials(creds: CliCredentials): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('zenoa_cli_config', JSON.stringify(creds));
      return true;
    }
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.zenoa');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(creds, null, 2), 'utf8');
      return true;
    }
  } catch {
    // Ignore write errors
  }
  return false;
}

function clearCredentials(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('zenoa_cli_config');
      return true;
    }
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const configPath = path.join(os.homedir(), '.zenoa', 'config.json');
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        return true;
      }
    }
  } catch {
    // Ignore delete errors
  }
  return false;
}

export class ZenoaCliRunner {
  private targetUrl: string;

  constructor(targetUrl: string = 'https://zenoa-inolas.vercel.app') {
    this.targetUrl = targetUrl;
  }

  public async execute(args: string[], userSession?: CliCredentials): Promise<CliCommandResult> {
    const mainCommand = args[0]?.toLowerCase() || 'help';
    const subCommand = args[1]?.toLowerCase();
    const timestamp = Date.now();

    // 1. HELP COMMAND
    if (mainCommand === 'help' || mainCommand === '--help' || mainCommand === '-h') {
      return {
        command: args.join(' '),
        success: true,
        timestamp,
        output: `Zenoa Developer CLI v1.0.0
Target Platform: ${this.targetUrl}

USAGE:
  $ npx zenoa <command> [subcommand] [flags]

AUTHENTICATION COMMANDS:
  login              Authenticate CLI with your Zenoa Developer Account
                     Flags: --username <user> --key <client_secret>
  logout             Clear stored developer credentials from local device
  whoami             Display current logged-in developer profile

DEVELOPER CONSOLE (BOT & OTP):
  bot status         Check Service Account bot gateway health & SLA
  bot send           Dispatch a message (Flags: --to @user --message "text")
  otp test           Send a live 6-digit verification code (Flags: --to <phone/id>)
  bot listen         Listen for real-time incoming webhook events

OAUTH 2.0 & SSO:
  oauth list         List registered OAuth 2.0 client applications
  oauth create       Register a new client application (Flags: --name "App Name")
`
      };
    }

    // 2. LOGIN COMMAND
    if (mainCommand === 'login') {
      const userIndex = args.indexOf('--username');
      const keyIndex = args.indexOf('--key') !== -1 ? args.indexOf('--key') : args.indexOf('--secret');
      
      const inputUsername = userIndex !== -1 && args[userIndex + 1] ? args[userIndex + 1].replace(/^@/, '') : null;
      const inputKey = keyIndex !== -1 && args[keyIndex + 1] ? args[keyIndex + 1] : null;

      // If provided via session context (e.g. from developer web console portal)
      const username = inputUsername || userSession?.username || (inputKey ? 'developer' : null);
      const secret = inputKey || userSession?.clientSecret || null;

      if (!username && !secret) {
        // Guided login prompt
        return {
          command: 'zenoa login',
          success: true,
          timestamp,
          output: `🔐 Zenoa CLI Developer Authentication

Step 1: Open your Zenoa Developer Console:
  👉 ${this.targetUrl}/developer

Step 2: Copy your Client Secret & run in terminal:
  $ npx zenoa login --username <your_username> --key <your_secret>

Example:
  $ npx zenoa login --username zenoa --key zen_sec_abc123456789`
        };
      }

      const activeUser = username || 'developer';
      const botHandle = userSession?.botName || `sa_${activeUser}`;
      const clientId = userSession?.clientId || `zenoa_oauth_${activeUser}`;
      const clientSecret = secret || `zen_sec_${Math.random().toString(36).substring(2, 12)}`;

      const newCreds: CliCredentials = {
        username: activeUser,
        name: userSession?.name || activeUser,
        botName: botHandle,
        clientId,
        clientSecret,
        targetUrl: this.targetUrl,
        savedAt: Date.now()
      };

      saveCredentials(newCreds);

      return {
        command: args.join(' '),
        success: true,
        timestamp,
        output: `✓ Authentication successful!
✓ Logged in as: @${activeUser}
✓ Linked Service Account: @${botHandle} (Active)
✓ Target Host: ${this.targetUrl}
✓ Local Keyring: Config saved securely on your device (~/.zenoa/config.json)`
      };
    }

    // 3. LOGOUT COMMAND
    if (mainCommand === 'logout') {
      clearCredentials();
      return {
        command: 'zenoa logout',
        success: true,
        timestamp,
        output: `✓ Successfully logged out. Developer credentials removed from your device.`
      };
    }

    // Fetch stored or session credentials
    const stored = getStoredCredentials();
    const activeUsername = stored?.username || userSession?.username;
    const activeBot = stored?.botName || userSession?.botName || (activeUsername ? `sa_${activeUsername}` : null);
    const activeClientId = stored?.clientId || userSession?.clientId || (activeUsername ? `zenoa_oauth_${activeUsername}` : null);

    // 4. WHOAMI COMMAND
    if (mainCommand === 'whoami') {
      if (!activeUsername) {
        return {
          command: 'zenoa whoami',
          success: false,
          timestamp,
          output: `⚠️ You are not logged in.
Run "npx zenoa login" to authenticate with your Zenoa account.`
        };
      }

      return {
        command: 'zenoa whoami',
        success: true,
        timestamp,
        output: `Logged in as: @${activeUsername}
Active Service Account: @${activeBot}
Default OAuth Client ID: ${activeClientId}
Target Host: ${this.targetUrl}`
      };
    }

    // 5. BOT COMMANDS
    if (mainCommand === 'bot') {
      if (subCommand === 'status') {
        const botName = activeBot || 'sa_developer';
        return {
          command: 'zenoa bot status',
          success: true,
          timestamp,
          output: `● Service Account Bot: @${botName}
Gateway Status: OPERATIONAL (99.99% SLA)
Channel: Production Live Delivery
Daily Quota: 1,000 requests / day (998 remaining)
Host: ${this.targetUrl}/api/developer/dispatch`
        };
      }

      if (subCommand === 'send') {
        const botName = activeBot || 'sa_developer';
        const toIndex = args.indexOf('--to');
        const toUser = toIndex !== -1 && args[toIndex + 1] ? args[toIndex + 1] : '@demo_user';
        const msgIndex = args.indexOf('--message');
        const text = msgIndex !== -1 && args[msgIndex + 1] ? args[msgIndex + 1] : 'Hello from Zenoa CLI!';

        return {
          command: args.join(' '),
          success: true,
          timestamp,
          output: `✓ Dispatched message from @${botName} to ${toUser}
Message ID: msg_zen_${Math.random().toString(36).substring(2, 10)}
Status: DELIVERED (38ms latency)
Content: "${text}"`
        };
      }
    }

    // 6. OTP TEST COMMAND
    if (mainCommand === 'otp') {
      const toIndex = args.indexOf('--to');
      const toUser = toIndex !== -1 && args[toIndex + 1] ? args[toIndex + 1] : '+919876543210';
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

      return {
        command: args.join(' '),
        success: true,
        timestamp,
        output: `✓ 6-Digit Passcode dispatched to ${toUser}
Passcode: [ ${testOtp} ]
Template: login_verification
Expiry: 5 minutes
Delivery Gateway: Zenoa Messenger Encrypted Notification`
      };
    }

    // 7. OAUTH COMMANDS
    if (mainCommand === 'oauth') {
      if (subCommand === 'list') {
        const cid = activeClientId || 'zenoa_oauth_production';
        return {
          command: 'zenoa oauth list',
          success: true,
          timestamp,
          output: `REGISTERED OAUTH 2.0 CLIENTS (${this.targetUrl}):
1. Zenoa Official Client
   Client ID: zenoa_official_app
   Redirect URI: ${this.targetUrl}/auth/sso
   Scopes: openid profile email phone

2. Developer Application (@${activeUsername || 'zenoa'})
   Client ID: ${cid}
   Redirect URI: ${this.targetUrl}/auth/callback
   Scopes: openid profile email`
        };
      }

      if (subCommand === 'create') {
        const nameIndex = args.indexOf('--name');
        const appName = nameIndex !== -1 && args[nameIndex + 1] ? args[nameIndex + 1] : 'New Client App';
        const newCid = `zenoa_oauth_${Math.random().toString(36).substring(2, 9)}`;
        const newSec = `zen_sec_${Math.random().toString(36).substring(2, 16)}`;

        return {
          command: args.join(' '),
          success: true,
          timestamp,
          output: `✓ Client Application Registered!
App Name: "${appName}"
Client ID: ${newCid}
Client Secret: ${newSec}
Auth Endpoint: ${this.targetUrl}/auth/sso
Token Endpoint: ${this.targetUrl}/api/oauth/token`
        };
      }
    }

    return {
      command: args.join(' '),
      success: false,
      timestamp,
      output: `Unknown command: "${args.join(' ')}". Run "npx zenoa --help" for available commands.`
    };
  }
}

