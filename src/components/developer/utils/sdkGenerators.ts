/**
 * Production-ready Multi-Language SDK & Key Generators for Zenoa Developer Console
 * 
 * Two-Tier Key Architecture:
 * 1. Public Widget API Key (zen_pub_...): For browser storefronts, HTML buttons & slide-up drawers.
 * 2. Secret Business API Key (zen_sec_...): For server-to-server backend API, carrier OTPs & bot messaging.
 */

import { DeveloperCategoryTier } from '../../../types';

export const resolveBotHandle = (app: any): string => {
  const handle = app?.bot_username || app?.bot_handle || app?.owner_username || app?.owner || 'service_account';
  const clean = String(handle).replace(/^@/, '').trim();
  return `@${clean}`;
};

export const resolveKeys = (app: any, env: 'test' | 'live' = 'test') => {
  const isTest = env === 'test' || app?.environment === 'test';
  
  const pubKey = isTest
    ? (app?.test_widget_key || app?.test_public_key || (app?.test_api_key ? `zen_pub_test_${app.test_api_key.replace(/^z(sa|wg)_(test|live)_/, '').replace(/^zen_(test|live)_/, '').substring(0, 24)}` : 'zen_pub_test_88f9a2b1c4e6d7a0912'))
    : (app?.widget_key || app?.public_key || (app?.api_key ? `zen_pub_live_${app.api_key.replace(/^z(sa|wg)_(test|live)_/, '').replace(/^zen_(test|live)_/, '').substring(0, 24)}` : 'zen_pub_live_88f9a2b1c4e6d7a0912'));

  const secKey = isTest
    ? (app?.test_secret_key || app?.test_api_key || 'zen_sec_test_41c09e3a7b5d8f1e290a')
    : (app?.secret_key || app?.api_key || 'zen_sec_live_41c09e3a7b5d8f1e290a');

  return { pubKey, secKey };
};

// ============================================================================
// 1. TYPESCRIPT SDK GENERATOR (Backend Server-to-Server)
// ============================================================================
export const generateTsSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const botHandle = resolveBotHandle(app);
  const appName = app?.app_name || 'Service Account';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `/**
 * Zenoa Messenger & Bot TypeScript SDK
 * Tier: Messenger Plan (Carrier OTP & Direct Bot Messaging)
 * Registered Service Account: ${botHandle} (${appName})
 * Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)
 */

export interface ZenoaConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface SendOtpOptions {
  recipient: string;
  templateType?: 'standard_otp' | '2fa_auth' | 'password_reset' | 'transaction_auth';
  customCode?: string;
  expiryMins?: number;
}

export interface SendMessageOptions {
  recipient: string;
  message: string;
  mediaUrl?: string;
}

export class ZenoaMessengerClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaConfig) {
    this.secretKey = config?.apiKey || (typeof process !== 'undefined' ? process.env.ZENOA_SECRET_KEY : '') || "zen_sec_live_your_key";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": \`Bearer \${this.secretKey}\`,
      "X-Zenoa-Secret-Key": this.secretKey,
      "Content-Type": "application/json"
    };
  }

  /**
   * Dispatches a carrier-verified OTP to recipient DM or phone.
   */
  async sendOtp(options: SendOtpOptions | string, templateType = "standard_otp", expiryMins = 10) {
    const payload = typeof options === 'string'
      ? { recipient: options, template_type: templateType, expiry_mins: expiryMins }
      : { 
          recipient: options.recipient, 
          template_type: options.templateType || templateType, 
          custom_code: options.customCode,
          expiry_mins: options.expiryMins || expiryMins 
        };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Cryptographically verifies recipient OTP code.
   */
  async verifyOtp(recipient: string, code: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient, code })
    });
    return await res.json();
  }

  /**
   * Sends a direct bot message or transactional notification.
   */
  async sendMessage(options: SendMessageOptions) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        recipient: options.recipient,
        message: options.message,
        media_url: options.mediaUrl
      })
    });
    return await res.json();
  }
}

export default ZenoaMessengerClient;
`;
  }

  if (categoryTier === 'business') {
    return `/**
 * Zenoa Business & AI Copilot TypeScript SDK
 * Tier: Business Suite (Autonomous AI Assistant & Storefront Support)
 * Registered Service Account: ${botHandle} (${appName})
 * Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)
 */

export interface ZenoaBusinessConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface CustomerContext {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_id?: string;
  order_status?: string;
  cart_value?: string;
  product_specs?: any;
}

export interface ChatRequestOptions {
  sessionId: string;
  message: string;
  customerContext?: CustomerContext;
}

export class ZenoaBusinessClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaBusinessConfig) {
    this.secretKey = config?.apiKey || (typeof process !== 'undefined' ? process.env.ZENOA_SECRET_KEY : '') || "zen_sec_live_your_key";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": \`Bearer \${this.secretKey}\`,
      "X-Zenoa-Secret-Key": this.secretKey,
      "Content-Type": "application/json"
    };
  }

  /**
   * Sends customer message or spec question to Autonomous AI with full live context.
   */
  async chat(options: ChatRequestOptions) {
    const res = await fetch(\`\${this.baseUrl}/api/business/chat\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        session_id: options.sessionId,
        message: options.message,
        customer_context: options.customerContext
      })
    });
    return await res.json();
  }

  /**
   * Retrieves active customer conversation thread.
   */
  async getConversation(conversationId: string) {
    const res = await fetch(\`\${this.baseUrl}/api/business/conversations/\${conversationId}\`, {
      method: "GET",
      headers: this.getHeaders()
    });
    return await res.json();
  }
}

export default ZenoaBusinessClient;
`;
  }

  // Hybrid Enterprise
  return `/**
 * Zenoa Unified Omnichannel Enterprise SDK
 * Tier: Hybrid Enterprise (Carrier Messaging + Business Assistant)
 * Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)
 */

export interface ZenoaEnterpriseConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class ZenoaClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaEnterpriseConfig) {
    this.secretKey = config?.apiKey || (typeof process !== 'undefined' ? process.env.ZENOA_SECRET_KEY : '') || "zen_sec_live_your_key";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": \`Bearer \${this.secretKey}\`,
      "X-Zenoa-Secret-Key": this.secretKey,
      "Content-Type": "application/json"
    };
  }

  async sendOtp(recipient: string, templateType = "standard_otp") {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient, template_type: templateType })
    });
    return await res.json();
  }

  async sendMessage(recipient: string, message: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient, message })
    });
    return await res.json();
  }
}

export default ZenoaClient;
`;
};

// ============================================================================
// 2. NODE.JS SDK
// ============================================================================
export const generateNodeSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const botHandle = resolveBotHandle(app);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `// Zenoa Node.js Backend Service Account SDK
// Install: npm install axios
// Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)

const axios = require('axios');

class ZenoaService {
  constructor(secretKey) {
    this.secretKey = secretKey || process.env.ZENOA_SECRET_KEY || 'zen_sec_live_your_key';
    this.baseUrl = '${origin}';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': \`Bearer \${this.secretKey}\`,
        'X-Zenoa-Secret-Key': this.secretKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  // 1. Send Carrier OTP
  async sendOtp(recipient, templateType = 'standard_otp') {
    const resp = await this.client.post('/api/v1/otp/send', { recipient, template_type: templateType });
    return resp.data;
  }

  // 2. Send Bot Direct Message
  async sendMessage(recipient, message) {
    const resp = await this.client.post('/api/v1/bot/send', { recipient, message });
    return resp.data;
  }

  // 3. Dispatch AI Business Chat
  async chat(sessionId, message, customerContext = {}) {
    const resp = await this.client.post('/api/business/chat', {
      session_id: sessionId,
      message,
      customer_context: customerContext
    });
    return resp.data;
  }
}

module.exports = ZenoaService;
`;
};

// ============================================================================
// 3. PYTHON SDK
// ============================================================================
export const generatePythonSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `# Zenoa Python Backend SDK
# Install: pip install requests
# Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)

import os
import requests

class ZenoaClient:
    def __init__(self, secret_key=None, base_url="${origin}"):
        self.secret_key = secret_key or os.getenv("ZENOA_SECRET_KEY", "zen_sec_live_your_key")
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "X-Zenoa-Secret-Key": self.secret_key,
            "Content-Type": "application/json"
        }

    def send_otp(self, recipient: str, template_type: str = "standard_otp"):
        url = f"{self.base_url}/api/v1/otp/send"
        payload = {"recipient": recipient, "template_type": template_type}
        return requests.post(url, json=payload, headers=self.headers, timeout=10).json()

    def send_message(self, recipient: str, message: str):
        url = f"{self.base_url}/api/v1/bot/send"
        payload = {"recipient": recipient, "message": message}
        return requests.post(url, json=payload, headers=self.headers, timeout=10).json()

    def chat_assistant(self, session_id: str, message: str, customer_context: dict = None):
        url = f"{self.base_url}/api/business/chat"
        payload = {
            "session_id": session_id,
            "message": message,
            "customer_context": customer_context or {}
        }
        return requests.post(url, json=payload, headers=self.headers, timeout=10).json()
`;
};

// ============================================================================
// 4. PHP SDK
// ============================================================================
export const generatePhpSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `<?php
// Zenoa PHP Backend SDK
// Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)

class ZenoaClient {
    private string $secretKey;
    private string $baseUrl;

    public function __construct(?string $secretKey = null, string $baseUrl = "${origin}") {
        $this->secretKey = $secretKey ?? getenv('ZENOA_SECRET_KEY') ?: 'zen_sec_live_your_key';
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    private function request(string $method, string $endpoint, array $data = []): array {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->secretKey,
            'X-Zenoa-Secret-Key: ' . $this->secretKey,
            'Content-Type: application/json'
        ]);
        if (!empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true) ?? [];
    }

    public function sendOtp(string $recipient, string $template = 'standard_otp'): array {
        return $this->request('POST', '/api/v1/otp/send', ['recipient' => $recipient, 'template_type' => $template]);
    }

    public function sendMessage(string $recipient, string $message): array {
        return $this->request('POST', '/api/v1/bot/send', ['recipient' => $recipient, 'message' => $message]);
    }
}
`;
};

// ============================================================================
// 5. GO SDK
// ============================================================================
export const generateGoSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `package zenoa

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type Client struct {
	SecretKey  string
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(secretKey string) *Client {
	if secretKey == "" {
		secretKey = os.Getenv("ZENOA_SECRET_KEY")
	}
	return &Client{
		SecretKey:  secretKey,
		BaseURL:    "${origin}",
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) SendOTP(recipient, templateType string) (*http.Response, error) {
	payload, _ := json.Marshal(map[string]string{
		"recipient":     recipient,
		"template_type": templateType,
	})
	req, _ := http.NewRequest("POST", c.BaseURL+"/api/v1/otp/send", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer "+c.SecretKey)
	req.Header.Set("X-Zenoa-Secret-Key", c.SecretKey)
	req.Header.Set("Content-Type", "application/json")
	return c.HTTPClient.Do(req)
}
`;
};

// ============================================================================
// 6. JAVA SDK
// ============================================================================
export const generateJavaSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `// Zenoa Java Backend Service SDK
// Authentication: Secret Key (ZENOA_SECRET_KEY / zen_sec_...)

package in.zenoa.sdk;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ZenoaClient {
    private final String secretKey;
    private final String baseUrl;
    private final HttpClient httpClient;

    public ZenoaClient(String secretKey) {
        this.secretKey = secretKey != null ? secretKey : System.getenv("ZENOA_SECRET_KEY");
        this.baseUrl = "${origin}";
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public String sendOtp(String recipient, String templateType) throws Exception {
        String json = String.format("{\"recipient\":\"%s\",\"template_type\":\"%s\"}", recipient, templateType);
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(this.baseUrl + "/api/v1/otp/send"))
            .header("Authorization", "Bearer " + this.secretKey)
            .header("X-Zenoa-Secret-Key", this.secretKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        return this.httpClient.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }
}
`;
};

// ============================================================================
// 7. CURL SNIPPETS
// ============================================================================
export const generateCurlSnippets = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `# 1. Backend Service Account Request (Uses Secret Key: zen_sec_...)
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer $ZENOA_SECRET_KEY" \\
  -H "X-Zenoa-Secret-Key: $ZENOA_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+919876543210", "template_type": "standard_otp"}'

# 2. Storefront In-Context Assistant Request (Uses Public Key: zen_pub_...)
curl -X POST "${origin}/api/business/triage-ai" \\
  -H "X-Zenoa-Public-Key: $ZENOA_PUBLIC_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_id": "${app?.id || 'biz_default'}",
    "message": "Kya is hotel room me AC hai?",
    "customer_context": {
      "product_specs": "Room: Deluxe Suite, Split AC: Yes, Balcony: Yes"
    }
  }'`;
};

// ============================================================================
// 8. .ENV CONFIG GENERATOR
// ============================================================================
export const generateEnvConfig = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const botHandle = resolveBotHandle(app);
  const appName = app?.app_name || 'Service Account';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';
  const { pubKey, secKey } = resolveKeys(app);

  return `# Zenoa Two-Tier API Key Configuration (${appName})
# 1. Public Storefront Key (Safe for frontend HTML, React & Next.js client embeds)
ZENOA_PUBLIC_KEY=${pubKey}

# 2. Secret Business API Key (For secure backend server-to-server operations, OTPs & Bot DMs)
ZENOA_SECRET_KEY=${secKey}

# Infrastructure Parameters
ZENOA_SERVICE_ACCOUNT=${botHandle}
ZENOA_GATEWAY_URL=${origin}
`;
};

// ============================================================================
// 9. MODERN WIDGET SDK HTML SNIPPET (Uses Public Key)
// ============================================================================
export const generateHtmlSnippet = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';
  const { pubKey } = resolveKeys(app);

  return `<!-- Zenoa Modern Web Widget & Assistant SDK (v2.4) -->
<!-- Step 1: Embed Runtime Script (Uses Public Storefront Key) -->
<script 
  src="${origin}/widget/v2/zenoa-widget.js" 
  data-zenoa-key="${pubKey}" 
  data-project-id="${app?.id || 'biz_default'}"
  async>
</script>

<!-- Step 2: Attach Assistant Button on any Product or Item -->
<button 
  class="zenoa-assistant-btn" 
  data-zenoa-assistant 
  data-zenoa-key="${pubKey}" 
  data-zenoa-label="Ask Assistant">
  Ask Assistant
</button>`;
};
