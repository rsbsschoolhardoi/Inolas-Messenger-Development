/**
 * Production-ready Multi-Language SDK Generators for Zenoa Developer Console
 * 
 * Security Directives:
 * - API keys are NEVER exposed directly in client/server snippet bodies.
 * - Developers configure their keys via Environment Variables (ZENOA_API_KEY)
 *   or pass standard placeholders ("YOUR_ZENOA_API_KEY").
 * 
 * Category-Aware Generation Architecture:
 * - Messenger Plan: Direct Bot DMs (/api/v1/bot/send), Carrier OTPs (/api/v1/otp/send), Webhooks
 * - Business Suite: Autonomous AI Customer Copilot (/api/business/chat), Live Storefront Chat Widget, Canned Replies
 * - Hybrid Enterprise: Unified Omnichannel Gateway (Carrier OTP + Bot DMs + Business AI Copilot)
 */

import { DeveloperCategoryTier } from '../../../types';

export const resolveBotHandle = (app: any): string => {
  const handle = app?.bot_username || app?.bot_handle || app?.owner_username || app?.owner || 'service_account';
  const clean = String(handle).replace(/^@/, '').trim();
  return `@${clean}`;
};

// ============================================================================
// 1. TYPESCRIPT SDK GENERATOR
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
 * Authentication: Configured via ZENOA_API_KEY environment variable
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
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaConfig) {
    this.apiKey = config?.apiKey || (typeof process !== 'undefined' ? process.env.ZENOA_API_KEY : '') || "YOUR_ZENOA_API_KEY";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": \`Bearer \${this.apiKey}\`,
      "X-Zenoa-Api-Key": this.apiKey,
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

// Usage Example:
// const zenoa = new ZenoaMessengerClient({ apiKey: process.env.ZENOA_API_KEY });
// await zenoa.sendOtp({ recipient: "+919876543210", templateType: "standard_otp" });
`;
  }

  if (categoryTier === 'business') {
    return `/**
 * Zenoa Business & AI Copilot TypeScript SDK
 * Tier: Business Suite (Autonomous AI Concierge & Storefront Support)
 * Registered Service Account: ${botHandle} (${appName})
 * Authentication: Configured via ZENOA_API_KEY environment variable
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
  cart_items?: Array<{ name: string; qty: number; price: number }>;
}

export interface ChatRequestOptions {
  sessionId: string;
  message: string;
  customerContext?: CustomerContext;
}

export class ZenoaBusinessClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaBusinessConfig) {
    this.apiKey = config?.apiKey || (typeof process !== 'undefined' ? process.env.ZENOA_API_KEY : '') || "YOUR_ZENOA_API_KEY";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": \`Bearer \${this.apiKey}\`,
      "X-Zenoa-Api-Key": this.apiKey,
      "Content-Type": "application/json"
    };
  }

  /**
   * Sends customer message to Autonomous AI Concierge with full live cart/order context.
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

  /**
   * Dispatches pre-approved canned reply or agent handover.
   */
  async sendCannedReply(conversationId: string, cannedId: string) {
    const res = await fetch(\`\${this.baseUrl}/api/business/conversations/\${conversationId}/canned\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ canned_id: cannedId })
    });
    return await res.json();
  }
}

export default ZenoaBusinessClient;

// Usage Example:
// const zenoa = new ZenoaBusinessClient();
// const reply = await zenoa.chat({
//   sessionId: "cust_98210",
//   message: "Where is my package #ORD-88219?",
//   customerContext: { customer_name: "Rohit Verma", order_id: "#ORD-88219" }
// });
// console.log("AI Concierge:", reply.reply);
`;
  }

  // Hybrid Enterprise
  return `/**
 * Zenoa Unified Omnichannel Enterprise SDK
 * Tier: Hybrid Enterprise (Messaging Gateway + Autonomous Business AI)
 * Registered Service Account: ${botHandle} (${appName})
 * Authentication: Configured via ZENOA_API_KEY environment variable
 */

export interface ZenoaEnterpriseConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class ZenoaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaEnterpriseConfig) {
    this.apiKey = config?.apiKey || (typeof process !== 'undefined' ? process.env.ZENOA_API_KEY : '') || "YOUR_ZENOA_API_KEY";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": \`Bearer \${this.apiKey}\`,
      "X-Zenoa-Api-Key": this.apiKey,
      "Content-Type": "application/json"
    };
  }

  // === 1. Messaging & OTP Endpoints ===
  async sendOtp(recipient: string, templateType = "standard_otp") {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient, template_type: templateType })
    });
    return await res.json();
  }

  async verifyOtp(recipient: string, code: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient, code })
    });
    return await res.json();
  }

  async sendBotMessage(recipient: string, message: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient, message })
    });
    return await res.json();
  }

  // === 2. Business Suite & AI Copilot ===
  async businessChat(sessionId: string, message: string, context?: Record<string, any>) {
    const res = await fetch(\`\${this.baseUrl}/api/business/chat\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ session_id: sessionId, message, customer_context: context })
    });
    return await res.json();
  }

  async getConversation(conversationId: string) {
    const res = await fetch(\`\${this.baseUrl}/api/business/conversations/\${conversationId}\`, {
      method: "GET",
      headers: this.getHeaders()
    });
    return await res.json();
  }
}

export default ZenoaClient;
`;
};

// ============================================================================
// 2. NODE.JS SDK GENERATOR
// ============================================================================
export const generateNodeSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const botHandle = resolveBotHandle(app);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `/**
 * Zenoa Messenger Node.js SDK (CommonJS / ESM)
 * Tier: Messenger Plan
 * Service Account: ${botHandle}
 * Authentication: Reads process.env.ZENOA_API_KEY
 */

class ZenoaMessenger {
  constructor(apiKey = process.env.ZENOA_API_KEY || "YOUR_ZENOA_API_KEY") {
    this.apiKey = apiKey;
    this.baseUrl = "${origin}";
  }

  _headers() {
    return {
      "Authorization": \`Bearer \${this.apiKey}\`,
      "X-Zenoa-Api-Key": this.apiKey,
      "Content-Type": "application/json"
    };
  }

  async sendOtp(recipient, templateType = "standard_otp", expiryMins = 10) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ recipient, template_type: templateType, expiry_mins: expiryMins })
    });
    return await res.json();
  }

  async verifyOtp(recipient, code) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ recipient, code })
    });
    return await res.json();
  }

  async sendMessage(recipient, message) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ recipient, message })
    });
    return await res.json();
  }
}

module.exports = ZenoaMessenger;
`;
  }

  if (categoryTier === 'business') {
    return `/**
 * Zenoa Business AI Node.js SDK
 * Tier: Business Suite
 * Service Account: ${botHandle}
 * Authentication: Reads process.env.ZENOA_API_KEY
 */

class ZenoaBusiness {
  constructor(apiKey = process.env.ZENOA_API_KEY || "YOUR_ZENOA_API_KEY") {
    this.apiKey = apiKey;
    this.baseUrl = "${origin}";
  }

  _headers() {
    return {
      "Authorization": \`Bearer \${this.apiKey}\`,
      "X-Zenoa-Api-Key": this.apiKey,
      "Content-Type": "application/json"
    };
  }

  async chat(sessionId, message, customerContext = {}) {
    const res = await fetch(\`\${this.baseUrl}/api/business/chat\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ session_id: sessionId, message, customer_context: customerContext })
    });
    return await res.json();
  }

  async getConversation(conversationId) {
    const res = await fetch(\`\${this.baseUrl}/api/business/conversations/\${conversationId}\`, {
      method: "GET",
      headers: this._headers()
    });
    return await res.json();
  }
}

module.exports = ZenoaBusiness;
`;
  }

  // Hybrid Enterprise
  return `/**
 * Zenoa Omnichannel Hybrid Node.js SDK
 * Tier: Hybrid Enterprise
 * Service Account: ${botHandle}
 * Authentication: Reads process.env.ZENOA_API_KEY
 */

class ZenoaOmnichannel {
  constructor(apiKey = process.env.ZENOA_API_KEY || "YOUR_ZENOA_API_KEY") {
    this.apiKey = apiKey;
    this.baseUrl = "${origin}";
  }

  _headers() {
    return {
      "Authorization": \`Bearer \${this.apiKey}\`,
      "X-Zenoa-Api-Key": this.apiKey,
      "Content-Type": "application/json"
    };
  }

  // 1. Messaging & OTP Gateway
  async sendOtp(recipient, templateType = "standard_otp") {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ recipient, template_type: templateType })
    });
    return await res.json();
  }

  async verifyOtp(recipient, code) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ recipient, code })
    });
    return await res.json();
  }

  async sendMessage(recipient, message) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ recipient, message })
    });
    return await res.json();
  }

  // 2. Autonomous AI Business Copilot
  async chat(sessionId, message, customerContext = {}) {
    const res = await fetch(\`\${this.baseUrl}/api/business/chat\`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ session_id: sessionId, message, customer_context: customerContext })
    });
    return await res.json();
  }
}

module.exports = ZenoaOmnichannel;
`;
};

// ============================================================================
// 3. PYTHON SDK GENERATOR
// ============================================================================
export const generatePythonSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `# Zenoa Messenger Python SDK
# Tier: Messenger Plan
# pip install requests

import os
import requests

class ZenoaMessenger:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ZENOA_API_KEY", "YOUR_ZENOA_API_KEY")
        self.base_url = "${origin}"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-Zenoa-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

    def send_otp(self, recipient: str, template_type: str = "standard_otp", expiry_mins: int = 10):
        url = f"{self.base_url}/api/v1/otp/send"
        payload = {"recipient": recipient, "template_type": template_type, "expiry_mins": expiry_mins}
        return requests.post(url, json=payload, headers=self._headers()).json()

    def verify_otp(self, recipient: str, code: str):
        url = f"{self.base_url}/api/v1/otp/verify"
        payload = {"recipient": recipient, "code": code}
        return requests.post(url, json=payload, headers=self._headers()).json()

    def send_message(self, recipient: str, message: str):
        url = f"{self.base_url}/api/v1/bot/send"
        payload = {"recipient": recipient, "message": message}
        return requests.post(url, json=payload, headers=self._headers()).json()

# Example Usage:
# client = ZenoaMessenger()
# client.send_otp("+919876543210")
`;
  }

  if (categoryTier === 'business') {
    return `# Zenoa Business & AI Copilot Python SDK
# Tier: Business Suite
# pip install requests

import os
import requests

class ZenoaBusiness:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ZENOA_API_KEY", "YOUR_ZENOA_API_KEY")
        self.base_url = "${origin}"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-Zenoa-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

    def chat(self, session_id: str, message: str, customer_context: dict = None):
        url = f"{self.base_url}/api/business/chat"
        payload = {
            "session_id": session_id,
            "message": message,
            "customer_context": customer_context or {}
        }
        return requests.post(url, json=payload, headers=self._headers()).json()

    def get_conversation(self, conversation_id: str):
        url = f"{self.base_url}/api/business/conversations/{conversation_id}"
        return requests.get(url, headers=self._headers()).json()

# Example Usage:
# client = ZenoaBusiness()
# res = client.chat("session_123", "Where is my order #ORD-88219?", {"order_id": "#ORD-88219"})
# print(res.get("reply"))
`;
  }

  // Hybrid Enterprise
  return `# Zenoa Unified Omnichannel Python SDK
# Tier: Hybrid Enterprise
# pip install requests

import os
import requests

class ZenoaOmnichannel:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ZENOA_API_KEY", "YOUR_ZENOA_API_KEY")
        self.base_url = "${origin}"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "X-Zenoa-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

    # 1. Messaging & OTP Gateway
    def send_otp(self, recipient: str, template_type: str = "standard_otp"):
        return requests.post(
            f"{self.base_url}/api/v1/otp/send",
            json={"recipient": recipient, "template_type": template_type},
            headers=self._headers()
        ).json()

    def send_message(self, recipient: str, message: str):
        return requests.post(
            f"{self.base_url}/api/v1/bot/send",
            json={"recipient": recipient, "message": message},
            headers=self._headers()
        ).json()

    # 2. Autonomous Business AI
    def business_chat(self, session_id: str, message: str, customer_context: dict = None):
        return requests.post(
            f"{self.base_url}/api/business/chat",
            json={"session_id": session_id, "message": message, "customer_context": customer_context or {}},
            headers=self._headers()
        ).json()
`;
};

// ============================================================================
// 4. GO SDK GENERATOR
// ============================================================================
export const generateGoSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `// Zenoa Messenger Go SDK (Go 1.18+)
// Tier: Messenger Plan
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

type ZenoaMessenger struct {
	ApiKey  string
	BaseUrl string
	Client  *http.Client
}

func NewZenoaMessenger() *ZenoaMessenger {
	apiKey := os.Getenv("ZENOA_API_KEY")
	if apiKey == "" {
		apiKey = "YOUR_ZENOA_API_KEY"
	}
	return &ZenoaMessenger{
		ApiKey:  apiKey,
		BaseUrl: "${origin}",
		Client:  &http.Client{},
	}
}

func (z *ZenoaMessenger) SendOtp(recipient, templateType string) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"recipient":     recipient,
		"template_type": templateType,
		"expiry_mins":   10,
	}
	data, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", z.BaseUrl+"/api/v1/otp/send", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+z.ApiKey)
	req.Header.Set("X-Zenoa-Api-Key", z.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := z.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
`;
  }

  if (categoryTier === 'business') {
    return `// Zenoa Business & AI Copilot Go SDK
// Tier: Business Suite
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

type ZenoaBusiness struct {
	ApiKey  string
	BaseUrl string
	Client  *http.Client
}

func NewZenoaBusiness() *ZenoaBusiness {
	apiKey := os.Getenv("ZENOA_API_KEY")
	if apiKey == "" {
		apiKey = "YOUR_ZENOA_API_KEY"
	}
	return &ZenoaBusiness{
		ApiKey:  apiKey,
		BaseUrl: "${origin}",
		Client:  &http.Client{},
	}
}

func (z *ZenoaBusiness) Chat(sessionId, message string, context map[string]interface{}) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"session_id":       sessionId,
		"message":          message,
		"customer_context": context,
	}
	data, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", z.BaseUrl+"/api/business/chat", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+z.ApiKey)
	req.Header.Set("X-Zenoa-Api-Key", z.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := z.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
`;
  }

  // Hybrid Enterprise
  return `// Zenoa Unified Omnichannel Go SDK
// Tier: Hybrid Enterprise
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

type ZenoaOmnichannel struct {
	ApiKey  string
	BaseUrl string
	Client  *http.Client
}

func NewZenoaOmnichannel() *ZenoaOmnichannel {
	apiKey := os.Getenv("ZENOA_API_KEY")
	if apiKey == "" {
		apiKey = "YOUR_ZENOA_API_KEY"
	}
	return &ZenoaOmnichannel{
		ApiKey:  apiKey,
		BaseUrl: "${origin}",
		Client:  &http.Client{},
	}
}

func (z *ZenoaOmnichannel) SendOtp(recipient, templateType string) (map[string]interface{}, error) {
	payload := map[string]interface{}{"recipient": recipient, "template_type": templateType}
	data, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", z.BaseUrl+"/api/v1/otp/send", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+z.ApiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := z.Client.Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()
	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	return res, nil
}

func (z *ZenoaOmnichannel) BusinessChat(sessionId, message string, context map[string]interface{}) (map[string]interface{}, error) {
	payload := map[string]interface{}{"session_id": sessionId, "message": message, "customer_context": context}
	data, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", z.BaseUrl+"/api/business/chat", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+z.ApiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := z.Client.Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()
	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)
	return res, nil
}
`;
};

// ============================================================================
// 5. PHP SDK GENERATOR
// ============================================================================
export const generatePhpSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `<?php
// Zenoa Messenger PHP SDK
// Tier: Messenger Plan

class ZenoaMessenger {
    private $apiKey;
    private $baseUrl = "${origin}";

    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: (getenv('ZENOA_API_KEY') ?: "YOUR_ZENOA_API_KEY");
    }

    public function sendOtp($recipient, $templateType = "standard_otp") {
        $ch = curl_init($this->baseUrl . "/api/v1/otp/send");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            "recipient" => $recipient,
            "template_type" => $templateType
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->apiKey,
            "X-Zenoa-Api-Key: " . $this->apiKey,
            "Content-Type: application/json"
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}
`;
  }

  if (categoryTier === 'business') {
    return `<?php
// Zenoa Business & AI Copilot PHP SDK
// Tier: Business Suite

class ZenoaBusiness {
    private $apiKey;
    private $baseUrl = "${origin}";

    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: (getenv('ZENOA_API_KEY') ?: "YOUR_ZENOA_API_KEY");
    }

    public function chat($sessionId, $message, $context = []) {
        $ch = curl_init($this->baseUrl . "/api/business/chat");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            "session_id" => $sessionId,
            "message" => $message,
            "customer_context" => $context
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->apiKey,
            "X-Zenoa-Api-Key: " . $this->apiKey,
            "Content-Type: application/json"
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}
`;
  }

  // Hybrid Enterprise
  return `<?php
// Zenoa Unified Omnichannel Enterprise PHP SDK
// Tier: Hybrid Enterprise

class ZenoaOmnichannel {
    private $apiKey;
    private $baseUrl = "${origin}";

    public function __construct($apiKey = null) {
        $this->apiKey = $apiKey ?: (getenv('ZENOA_API_KEY') ?: "YOUR_ZENOA_API_KEY");
    }

    // 1. Messaging Gateway
    public function sendOtp($recipient, $templateType = "standard_otp") {
        $ch = curl_init($this->baseUrl . "/api/v1/otp/send");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["recipient" => $recipient, "template_type" => $templateType]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->apiKey,
            "Content-Type: application/json"
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        return json_decode($res, true);
    }

    // 2. Autonomous Business AI
    public function chat($sessionId, $message, $context = []) {
        $ch = curl_init($this->baseUrl . "/api/business/chat");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["session_id" => $sessionId, "message" => $message, "customer_context" => $context]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->apiKey,
            "Content-Type: application/json"
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        return json_decode($res, true);
    }
}
`;
};

// ============================================================================
// 6. JAVA SDK GENERATOR
// ============================================================================
export const generateJavaSdk = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `// Zenoa Messenger Java 11+ HttpClient SDK
// Tier: Messenger Plan
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ZenoaMessengerClient {
    private final String apiKey;
    private final String baseUrl = "${origin}";
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public ZenoaMessengerClient(String apiKey) {
        this.apiKey = (apiKey != null) ? apiKey : System.getenv().getOrDefault("ZENOA_API_KEY", "YOUR_ZENOA_API_KEY");
    }

    public String sendOtp(String recipient, String templateType) throws Exception {
        String payload = String.format("{\\"recipient\\":\\"%s\\",\\"template_type\\":\\"%s\\"}", recipient, templateType);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/api/v1/otp/send"))
            .header("Authorization", "Bearer " + apiKey)
            .header("X-Zenoa-Api-Key", apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
`;
  }

  if (categoryTier === 'business') {
    return `// Zenoa Business AI Java 11+ HttpClient SDK
// Tier: Business Suite
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ZenoaBusinessClient {
    private final String apiKey;
    private final String baseUrl = "${origin}";
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public ZenoaBusinessClient(String apiKey) {
        this.apiKey = (apiKey != null) ? apiKey : System.getenv().getOrDefault("ZENOA_API_KEY", "YOUR_ZENOA_API_KEY");
    }

    public String chat(String sessionId, String message) throws Exception {
        String payload = String.format("{\\"session_id\\":\\"%s\\",\\"message\\":\\"%s\\"}", sessionId, message);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/api/business/chat"))
            .header("Authorization", "Bearer " + apiKey)
            .header("X-Zenoa-Api-Key", apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
`;
  }

  // Hybrid Enterprise
  return `// Zenoa Omnichannel Enterprise Java 11+ SDK
// Tier: Hybrid Enterprise
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ZenoaOmnichannelClient {
    private final String apiKey;
    private final String baseUrl = "${origin}";
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public ZenoaOmnichannelClient(String apiKey) {
        this.apiKey = (apiKey != null) ? apiKey : System.getenv().getOrDefault("ZENOA_API_KEY", "YOUR_ZENOA_API_KEY");
    }

    public String sendRequest(String endpoint, String jsonPayload) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + endpoint))
            .header("Authorization", "Bearer " + apiKey)
            .header("X-Zenoa-Api-Key", apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
`;
};

// ============================================================================
// 7. CURL COMMAND SNIPPETS
// ============================================================================
export const generateCurlSnippets = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'messenger') {
    return `# 1. Dispatch Carrier OTP
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "X-Zenoa-Api-Key: $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins": 10
  }'

# 2. Verify Recipient Passcode
curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+919876543210",
    "code": "482910"
  }'

# 3. Direct Service Account Bot Message
curl -X POST "${origin}/api/v1/bot/send" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "@customer_handle",
    "message": "Hello! Your verification is complete."
  }'`;
  }

  if (categoryTier === 'business') {
    return `# 1. Dispatch Message to Autonomous AI Concierge
curl -X POST "${origin}/api/business/chat" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "X-Zenoa-Api-Key: $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "cust_session_8819",
    "message": "Where is my order #ORD-88219?",
    "customer_context": {
      "customer_name": "Rohit Verma",
      "customer_email": "rohit.v@example.com",
      "order_id": "#ORD-88219",
      "cart_value": "₹14,999.00"
    }
  }'

# 2. Retrieve Conversation Details
curl -X GET "${origin}/api/business/conversations/conv_8819" \\
  -H "Authorization: Bearer $ZENOA_API_KEY"`;
  }

  // Hybrid Enterprise
  return `# 1. Carrier OTP Dispatch (Messenger Gateway)
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+919876543210", "template_type": "standard_otp"}'

# 2. Autonomous AI Business Concierge
curl -X POST "${origin}/api/business/chat" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "X-Zenoa-Api-Key: $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id": "sess_912", "message": "Inquire product specifications"}'

# 3. Bot DM Notification
curl -X POST "${origin}/api/v1/bot/send" \\
  -H "Authorization: Bearer $ZENOA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "@user", "message": "Omnichannel alert notification"}'`;
};

// ============================================================================
// 8. .ENV CONFIG GENERATOR
// ============================================================================
export const generateEnvConfig = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const botHandle = resolveBotHandle(app);
  const appName = app?.app_name || 'Service Account';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  return `# Zenoa Developer Environment Configuration (${appName})
# Category Tier: ${categoryTier.toUpperCase()}
# Note: Copy your secret API key from the Credentials tab above and paste it below

ZENOA_API_KEY=your_zenoa_api_key_here
ZENOA_CATEGORY_TIER=${categoryTier}
ZENOA_SERVICE_ACCOUNT=${botHandle}
ZENOA_GATEWAY_URL=${origin}
`;
};

// ============================================================================
// 9. HTML / CLIENT SCRIPT SNIPPET
// ============================================================================
export const generateHtmlSnippet = (app: any, categoryTier: DeveloperCategoryTier = 'business'): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.in';

  if (categoryTier === 'business' || categoryTier === 'hybrid') {
    return `<!-- Zenoa Live Storefront Chat Widget -->
<!-- Option A: Floating Bubble Widget (Default) -->
<script 
  src="${origin}/widget/live-chat.js" 
  data-api-key="YOUR_ZENOA_API_KEY" 
  data-category="${categoryTier}"
  data-mode="bubble"
  data-position="bottom-right"
  async>
</script>

<!-- Option B: Embedded Inline Tab Container -->
<!-- <div id="zenoa-chat-container" style="width: 100%; height: 600px;"></div>
<script 
  src="${origin}/widget/live-chat.js" 
  data-api-key="YOUR_ZENOA_API_KEY" 
  data-mode="tab"
  data-target="#zenoa-chat-container">
</script> -->`;
  }

  return `<!-- Zenoa Messenger Client SDK -->
<script src="${origin}/sdk/zenoa-messenger.js"></script>
<script>
  const zenoa = new ZenoaMessenger({ apiKey: "YOUR_ZENOA_API_KEY" });
  // Ready to dispatch OTPs or direct bot notifications
</script>`;
};
