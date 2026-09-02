export interface DocParam {
  name: string;
  type: string;
  required: boolean;
  desc: string;
  default?: string;
  enum?: string[];
}

export interface DocSnippet {
  curl: string;
  node: string;
  python: string;
  php: string;
  go: string;
  java: string;
}

export interface DocEndpoint {
  id: string;
  category: string;
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'GUIDE';
  path: string;
  summary: string;
  description: string;
  authRequired: boolean;
  rateLimit: string;
  cost: string;
  headers: { name: string; value: string; desc: string; required: boolean }[];
  params: DocParam[];
  requestBodyExample?: string;
  responseSuccess: string;
  responseError?: string;
  snippets: DocSnippet;
  notes?: string[];
}

export interface DocCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  sections: DocEndpoint[];
}

export const generateDocsData = (app: any, baseUrl: string): DocCategory[] => {
  const apiKey = app?.active_client_id || app?.client_id || 'zen_test_app_sample_key';
  const secretKey = app?.active_client_secret || app?.client_secret || 'zen_sec_sample_secret';
  const appName = app?.app_name || 'My Application';

  return [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: 'Rocket',
      description: 'Foundational concepts, authentication keys, environment models, and security principles.',
      sections: [
        {
          id: 'intro',
          category: 'Getting Started',
          title: 'Platform Introduction & Overview',
          method: 'GUIDE',
          path: '/docs/introduction',
          summary: 'High-performance messaging, OTP verification, and bot infrastructure for modern web & mobile apps.',
          description: `Zenoa Developer Platform provides resilient, carrier-grade communication APIs engineered for sub-second OTP verification, automated service account notifications, message template governance, real-time webhooks, WebRTC voice/video signaling, and unified OAuth 2.0 Single Sign-On.

### Key Capabilities:
- **Instant OTP Verification**: Deliver 4 or 6-digit numeric passcodes to Zenoa user inboxes and verified mobile numbers in under 400ms.
- **Service Account Direct Messaging**: Send rich Markdown, media attachments, and interactive buttons from your verified bot identity.
- **Message Templates & Anti-Spam Compliance**: Ensure enterprise brand safety with pre-approved message formats and variable syntax.
- **Real-Time Webhooks with HMAC Signatures**: Receive instant delivery reports, read receipts, and user reply events with SHA-256 cryptographic verification.
- **OAuth 2.0 Identity Gateway**: Allow millions of users to authenticate into your web or mobile app using "Login with Zenoa".
- **Transparent Credits & Rate Governance**: Monitor API quotas, wallet balances, and usage metrics with zero hidden overage charges.`,
          authRequired: false,
          rateLimit: 'Unlimited',
          cost: 'Free',
          headers: [],
          params: [],
          responseSuccess: `{
  "status": "ready",
  "version": "2.4.0",
  "environment": "sandbox_or_live",
  "latency_sla": "< 500ms",
  "uptime_sla": "99.99%"
}`,
          snippets: {
            curl: `# Verify API Service Health
curl -X GET "${baseUrl}/api/health"`,
            node: `const axios = require('axios');

async function checkHealth() {
  const res = await axios.get('${baseUrl}/api/health');
  console.log('Zenoa API Status:', res.data);
}
checkHealth();`,
            python: `import requests

res = requests.get("${baseUrl}/api/health")
print("API Health:", res.json())`,
            php: `<?php
$res = file_get_contents("${baseUrl}/api/health");
echo "Status: " . $res;`,
            go: `package main

import (
  "fmt"
  "net/http"
  "io/ioutil"
)

func main() {
  resp, err := http.Get("${baseUrl}/api/health")
  if err != nil { panic(err) }
  defer resp.Body.Close()
  body, _ := ioutil.ReadAll(resp.Body)
  fmt.Println(string(body))
}`,
            java: `import java.net.http.*;
import java.net.URI;

public class ZenoaHealth {
  public static void main(String[] args) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest req = HttpRequest.newBuilder()
      .uri(URI.create("${baseUrl}/api/health"))
      .GET()
      .build();
    HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
    System.out.println("Response: " + res.body());
  }
}`
          },
          notes: [
            'All API endpoints accept and return UTF-8 JSON payloads.',
            'Production endpoints mandate TLS 1.3 encryption across all public HTTP endpoints.',
            'Test API keys (zen_test_*) operate safely in Sandbox mode with 0 wallet balance deductions.'
          ]
        },
        {
          id: 'auth-guide',
          category: 'Getting Started',
          title: 'Authentication & API Keys',
          method: 'GUIDE',
          path: '/docs/authentication',
          summary: 'How to authenticate all API requests via Bearer Tokens and Header keys.',
          description: `All requests to the Zenoa Developer API require authentication via HTTP Bearer token in the \`Authorization\` header, or via the \`X-API-Key\` header.

### Key Types:
1. **Client ID (\`client_id\` / \`api_key\`)**: Safe for public identity identification. Starts with \`zen_test_\` (Sandbox) or \`zen_live_\` (Production).
2. **Client Secret (\`client_secret\`)**: Strictly confidential master secret. Used for signing OAuth 2.0 token exchanges, secret rotation, and server-side privileged commands.

### Header Standards:
\`\`\`http
Authorization: Bearer ${apiKey}
Content-Type: application/json
\`\`\`

> **CRITICAL SECURITY RULE**: Never embed your Client Secret in client-side applications (React, iOS, Android, Vue) or commit them to public GitHub repositories. Always proxy requests through your secure backend server.`,
          authRequired: true,
          rateLimit: 'Governed by Plan Tier',
          cost: 'Free',
          headers: [
            { name: 'Authorization', value: `Bearer ${apiKey}`, desc: 'Standard HTTP Bearer authorization token', required: true },
            { name: 'X-API-Key', value: apiKey, desc: 'Alternative header if Bearer prefix is not supported', required: false },
            { name: 'Content-Type', value: 'application/json', desc: 'Mandatory for all POST/PUT requests', required: true }
          ],
          params: [],
          responseSuccess: `{
  "authenticated": true,
  "app_id": "${apiKey}",
  "environment": "test",
  "permissions": ["otp:send", "otp:verify", "bot:send", "templates:read", "webhooks:manage"]
}`,
          responseError: `{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing Bearer token in Authorization header.",
  "status": 401
}`,
          snippets: {
            curl: `curl -X GET "${baseUrl}/api/v1/billing/summary" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`,
            node: `const axios = require('axios');

const client = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});`,
            python: `import requests

headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
response = requests.get("${baseUrl}/api/v1/billing/summary", headers=headers)`,
            php: `<?php
$headers = [
  'Authorization: Bearer ${apiKey}',
  'Content-Type: application/json'
];`,
            go: `req.Header.Set("Authorization", "Bearer ${apiKey}")
req.Header.Set("Content-Type", "application/json")`,
            java: `HttpRequest.newBuilder()
  .header("Authorization", "Bearer ${apiKey}")
  .header("Content-Type", "application/json")`
          },
          notes: [
            'API keys can be instantly rotated in the Settings & Security console tab without server restart.',
            'Failed authentication attempts return HTTP 401 Unauthorized with descriptive machine-readable error codes.'
          ]
        }
      ]
    },
    {
      id: 'otp-service',
      name: 'OTP & MFA Verification',
      icon: 'ShieldCheck',
      description: 'End-to-end encrypted one-time passcode delivery, instant validation, and abuse prevention.',
      sections: [
        {
          id: 'otp-send',
          category: 'OTP & MFA Verification',
          title: 'Send One-Time Passcode',
          method: 'POST',
          path: '/api/v1/otp/send',
          summary: 'Dispatches a high-priority 4 or 6-digit verification passcode to any target user.',
          description: `Dispatches an instant, cryptographically secure OTP directly to a user's Zenoa chat inbox or verified phone number. In Sandbox mode, requests succeed instantly and allow simulation without consuming balance.

### Delivery Logic:
- If recipient is a \`@username\`, delivered to the user's active Zenoa chat.
- If recipient is an \`E.164 phone number\` (e.g., \`+919876543210\`), matched with verified user accounts.
- Codes default to 6 numeric digits and 10 minutes expiry unless overridden.`,
          authRequired: true,
          rateLimit: '60 req/min (Free) • 500 req/min (Growth)',
          cost: '1 Credit per OTP dispatched (0 in Sandbox)',
          headers: [
            { name: 'Authorization', value: `Bearer ${apiKey}`, desc: 'App Client ID / API Key', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON body format', required: true }
          ],
          params: [
            { name: 'recipient', type: 'string', required: true, desc: 'Target @username or E.164 phone number (+919876543210)' },
            { name: 'template_type', type: 'string', required: false, desc: 'Format: "standard_otp" | "2fa_auth" | "password_reset" | "transaction_auth"', default: 'standard_otp' },
            { name: 'expiry_mins', type: 'number', required: false, desc: 'Passcode validity window in minutes (1 to 1440)', default: '10' },
            { name: 'custom_code', type: 'string', required: false, desc: 'Specific 4 or 6-digit code if generated by your internal system' },
            { name: 'custom_message', type: 'string', required: false, desc: 'Optional custom prefix text (must adhere to template compliance)' }
          ],
          requestBodyExample: `{
  "recipient": "+919876543210",
  "template_type": "standard_otp",
  "expiry_mins": 10
}`,
          responseSuccess: `{
  "success": true,
  "recipient": "+919876543210",
  "otp_id": "+919876543210_${apiKey}",
  "chat_id": "chat_user_rec_84920",
  "expiry_mins": 10,
  "timestamp": 1725184920000,
  "status": "sent"
}`,
          responseError: `{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many OTP requests dispatched to this recipient. Please wait 60 seconds.",
  "retry_after_seconds": 60
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins": 10
  }'`,
            node: `const axios = require('axios');

async function sendVerificationOtp(recipient) {
  const response = await axios.post('${baseUrl}/api/v1/otp/send', {
    recipient: recipient,
    template_type: 'standard_otp',
    expiry_mins: 10
  }, {
    headers: {
      'Authorization': 'Bearer ${apiKey}',
      'Content-Type': 'application/json'
    }
  });

  console.log('OTP Dispatched successfully:', response.data);
  return response.data;
}

sendVerificationOtp('+919876543210');`,
            python: `import requests

url = "${baseUrl}/api/v1/otp/send"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "recipient": "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins": 10
}

response = requests.post(url, json=payload, headers=headers)
print("OTP Send Response:", response.json())`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/otp/send");
$payload = json_encode([
    "recipient" => "+919876543210",
    "template_type" => "standard_otp",
    "expiry_mins" => 10
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${apiKey}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);

echo $result;`,
            go: `package main

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
  "io/ioutil"
)

func main() {
  payload := map[string]interface{}{
    "recipient": "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins": 10,
  }
  jsonPayload, _ := json.Marshal(payload)

  req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/otp/send", bytes.NewBuffer(jsonPayload))
  req.Header.Set("Authorization", "Bearer ${apiKey}")
  req.Header.Set("Content-Type", "application/json")

  client := &http.Client{}
  resp, _ := client.Do(req)
  defer resp.Body.Close()
  body, _ := ioutil.ReadAll(resp.Body)
  fmt.Println(string(body))
}`,
            java: `import java.net.http.*;
import java.net.URI;

public class SendOtp {
  public static void main(String[] args) throws Exception {
    String json = "{\\"recipient\\":\\"+919876543210\\",\\"template_type\\":\\"standard_otp\\",\\"expiry_mins\\":10}";
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest req = HttpRequest.newBuilder()
      .uri(URI.create("${baseUrl}/api/v1/otp/send"))
      .header("Authorization", "Bearer ${apiKey}")
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(json))
      .build();
    HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
    System.out.println("Result: " + res.body());
  }
}`
          },
          notes: [
            'Sandbox mode simulates delivery without deducting wallet credits.',
            'Recipient rate limiting restricts maximum 5 OTP dispatches per phone number in a 5-minute window to eliminate SMS bombing.'
          ]
        },
        {
          id: 'otp-verify',
          category: 'OTP & MFA Verification',
          title: 'Verify Passcode',
          method: 'POST',
          path: '/api/v1/otp/verify',
          summary: 'Validates user-submitted OTP code with sub-millisecond accuracy.',
          description: `Performs atomic verification of the 6-digit passcode submitted by the end user. Expired, invalid, or already consumed codes are immediately rejected.

### Verification Lifecycle:
1. Matches recipient and app ID in secure atomic storage.
2. Checks timestamp validity (\`Date.now() < expires_at\`).
3. Compares string token match.
4. Auto-expires code upon successful verification (One-Time Use guarantee).
5. Increments failed attempt counter (locks code after 5 consecutive failures).`,
          authRequired: true,
          rateLimit: '120 req/min',
          cost: 'Free (Included with Send)',
          headers: [
            { name: 'Authorization', value: `Bearer ${apiKey}`, desc: 'App Client ID / API Key', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON format', required: true }
          ],
          params: [
            { name: 'recipient', type: 'string', required: true, desc: 'Target @username or mobile number used during send' },
            { name: 'code', type: 'string', required: true, desc: '6-digit passcode entered by the user' }
          ],
          requestBodyExample: `{
  "recipient": "+919876543210",
  "code": "584920"
}`,
          responseSuccess: `{
  "success": true,
  "verified": true,
  "recipient": "+919876543210",
  "message": "OTP verified successfully.",
  "timestamp": 1725184935000
}`,
          responseError: `{
  "success": false,
  "verified": false,
  "error": "INVALID_CODE",
  "message": "The code provided is incorrect or has expired.",
  "attempts_remaining": 3
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/otp/verify" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+919876543210",
    "code": "584920"
  }'`,
            node: `const axios = require('axios');

async function verifyUserCode(recipient, userCode) {
  try {
    const res = await axios.post('${baseUrl}/api/v1/otp/verify', {
      recipient: recipient,
      code: userCode
    }, {
      headers: {
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json'
      }
    });

    if (res.data.verified) {
      console.log('User verified successfully!');
      return true;
    }
  } catch (err) {
    console.error('Verification failed:', err.response?.data);
    return false;
  }
}

verifyUserCode('+919876543210', '584920');`,
            python: `import requests

res = requests.post("${baseUrl}/api/v1/otp/verify", json={
    "recipient": "+919876543210",
    "code": "584920"
}, headers={
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
})

data = res.json()
if data.get("verified"):
    print("Authentication confirmed!")`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/otp/verify");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "recipient" => "+919876543210",
  "code" => "584920"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer ${apiKey}',
  'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo $res;`,
            go: `package main

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
)

func main() {
  body, _ := json.Marshal(map[string]string{
    "recipient": "+919876543210",
    "code": "584920",
  })
  req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/otp/verify", bytes.NewBuffer(body))
  req.Header.Set("Authorization", "Bearer ${apiKey}")
  req.Header.Set("Content-Type", "application/json")

  resp, _ := http.DefaultClient.Do(req)
  defer resp.Body.Close()
  fmt.Println("Status:", resp.Status)
}`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/otp/verify"))
  .header("Authorization", "Bearer ${apiKey}")
  .header("Content-Type", "application/json")
  .POST(HttpRequest.BodyPublishers.ofString("{\\"recipient\\":\\"+919876543210\\",\\"code\\":\\"584920\\"}"))
  .build();`
          },
          notes: [
            'Once verified, the token is automatically invalidated to prevent replay attacks.',
            'Triggering verification dispatches an `otp.verified` webhook event to all subscribed endpoints.'
          ]
        }
      ]
    },
    {
      id: 'bot-messaging',
      name: 'Bot & Messaging API',
      icon: 'Bot',
      description: 'Programmatic direct messaging, rich Markdown formatting, interactive actions, and broadcasts.',
      sections: [
        {
          id: 'bot-send',
          category: 'Bot & Messaging API',
          title: 'Send Direct Message',
          method: 'POST',
          path: '/api/v1/bot/send',
          summary: 'Sends a branded transactional message, order alert, or notification to a user inbox.',
          description: `Dispatches an instant transactional alert, order status update, ticket notification, or direct message from your verified Service Account / Bot identity.

### Supported Features:
- **Markdown Formatting**: Bold (\`**text**\`), Italic (\`*text*\`), Inline Code (\`\` \`code\` \`\`), and Code Blocks.
- **Media Attachments**: High-resolution PNG, JPEG, PDF, and MP4 attachment URLs.
- **Action Buttons**: Optional quick-reply action buttons for deep-linking.`,
          authRequired: true,
          rateLimit: '100 req/min',
          cost: '1 Credit per message',
          headers: [
            { name: 'Authorization', value: `Bearer ${apiKey}`, desc: 'App Client ID or Secret', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON format', required: true }
          ],
          params: [
            { name: 'recipient', type: 'string', required: true, desc: 'Target @username or mobile number (+91...)' },
            { name: 'message', type: 'string', required: true, desc: 'Message content body with Markdown support' },
            { name: 'media_url', type: 'string', required: false, desc: 'Public URL to image or document attachment' },
            { name: 'actions', type: 'array', required: false, desc: 'List of button actions: [{ label: "View Order", url: "https://..." }]' }
          ],
          requestBodyExample: `{
  "recipient": "john_doe",
  "message": "🚀 **Your Order #84920 has shipped!**\\n\\nCarrier: FedEx Priority\\nTracking: #9847291849",
  "media_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"
}`,
          responseSuccess: `{
  "success": true,
  "message_id": "msg_9847192847",
  "recipient": "john_doe",
  "sender_bot": "sa_${app?.username || 'developer'}",
  "status": "delivered",
  "timestamp": 1725184980000
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/bot/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "john_doe",
    "message": "Your payment of $49.00 was received successfully!"
  }'`,
            node: `const axios = require('axios');

await axios.post('${baseUrl}/api/v1/bot/send', {
  recipient: 'john_doe',
  message: '🚀 **Your Order #84920 has shipped!**\\nTrack at: https://example.com/track',
  media_url: 'https://example.com/shipping-label.png'
}, {
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json'
  }
});`,
            python: `import requests

requests.post("${baseUrl}/api/v1/bot/send", json={
    "recipient": "john_doe",
    "message": "Hello from Zenoa Bot! Your build completed successfully."
}, headers={
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
})`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/bot/send");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "recipient" => "john_doe",
  "message" => "Invoice #1094 ready for download."
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${apiKey}', 'Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);`,
            go: `package main

import (
  "bytes"
  "encoding/json"
  "net/http"
)

func main() {
  body, _ := json.Marshal(map[string]string{
    "recipient": "john_doe",
    "message": "Welcome aboard! 🎉",
  })
  req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/bot/send", bytes.NewBuffer(body))
  req.Header.Set("Authorization", "Bearer ${apiKey}")
  req.Header.Set("Content-Type", "application/json")
  http.DefaultClient.Do(req)
}`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/bot/send"))
  .header("Authorization", "Bearer ${apiKey}")
  .header("Content-Type", "application/json")
  .POST(HttpRequest.BodyPublishers.ofString("{\\"recipient\\":\\"john_doe\\",\\"message\\":\\"Hello World\\"}"))
  .build();`
          },
          notes: [
            'Messages are sent under your verified Service Account / Bot identity with verified badge.',
            'Recipients can directly reply to messages, triggering inbound webhook events.'
          ]
        }
      ]
    },
    {
      id: 'message-templates',
      name: 'Message Templates & Anti-Spam',
      icon: 'FileCode',
      description: 'Template creation, variable parameters, and automated compliance moderation.',
      sections: [
        {
          id: 'templates-list',
          category: 'Message Templates & Anti-Spam',
          title: 'List Pre-Approved Templates',
          method: 'GET',
          path: '/api/v1/templates',
          summary: 'Retrieves all active system and custom pre-approved message templates.',
          description: `Returns all registered message templates for your application along with approval status (\`approved\`, \`pending\`, \`rejected\`), category tags, and variable placeholders.`,
          authRequired: true,
          rateLimit: '300 req/min',
          cost: 'Free',
          headers: [
            { name: 'Authorization', value: `Bearer ${apiKey}`, desc: 'App Client ID / API Key', required: true }
          ],
          params: [],
          responseSuccess: `{
  "success": true,
  "templates": [
    {
      "id": "tpl_otp_standard",
      "name": "Standard OTP Passcode",
      "category": "AUTHENTICATION",
      "status": "approved",
      "body": "Your {{app_name}} verification passcode is {{code}}. Valid for {{expiry}} minutes. Never share this code."
    },
    {
      "id": "tpl_2fa_auth",
      "name": "2FA Two-Factor Authentication",
      "category": "AUTHENTICATION",
      "status": "approved",
      "body": "Security Alert: Use code {{code}} to approve your {{app_name}} sign-in attempt."
    },
    {
      "id": "tpl_order_shipped",
      "name": "Order Dispatch Notice",
      "category": "UTILITY",
      "status": "approved",
      "body": "Your {{app_name}} order #{{order_id}} has been dispatched! Track at {{tracking_url}}."
    }
  ]
}`,
          snippets: {
            curl: `curl -X GET "${baseUrl}/api/v1/templates" \\
  -H "Authorization: Bearer ${apiKey}"`,
            node: `const axios = require('axios');

const res = await axios.get('${baseUrl}/api/v1/templates', {
  headers: { 'Authorization': 'Bearer ${apiKey}' }
});
console.log('Approved templates:', res.data.templates);`,
            python: `import requests

res = requests.get("${baseUrl}/api/v1/templates", headers={"Authorization": "Bearer ${apiKey}"})
print("Templates:", res.json())`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/templates");
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ${apiKey}']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
echo curl_exec($ch);`,
            go: `req, _ := http.NewRequest("GET", "${baseUrl}/api/v1/templates", nil)
req.Header.Set("Authorization", "Bearer ${apiKey}")
resp, _ := http.DefaultClient.Do(req)`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/templates"))
  .header("Authorization", "Bearer ${apiKey}")
  .GET()
  .build();`
          },
          notes: [
            'Templates ensure anti-spam compliance and protect brand delivery rates.',
            'Custom templates submitted via Developer Console are reviewed within 15 minutes.'
          ]
        }
      ]
    },
    {
      id: 'webhooks-guide',
      name: 'Webhooks & Event System',
      icon: 'Webhook',
      description: 'Real-time HTTP push notifications, cryptographic HMAC-SHA256 signatures, and event specs.',
      sections: [
        {
          id: 'webhooks-spec',
          category: 'Webhooks & Event System',
          title: 'Webhook Architecture & Verification',
          method: 'POST',
          path: 'Incoming HTTP POST to your server',
          summary: 'Cryptographically verified real-time events pushed directly to your infrastructure.',
          description: `Zenoa delivers instant HTTP POST webhooks for all real-time events. Each request contains a SHA-256 HMAC signature in the \`X-Zenoa-Signature\` header calculated against your app's Client Secret.

### Webhook Headers Sent by Zenoa:
- \`X-Zenoa-Signature\`: Hex-encoded HMAC-SHA256 digest computed with your Client Secret.
- \`X-Zenoa-Event\`: Machine-readable event name (e.g., \`otp.verified\`, \`message.received\`).
- \`X-Zenoa-Timestamp\`: Unix timestamp in milliseconds for replay attack prevention.

### Verification Algorithm:
\`\`\`javascript
const expected = crypto.createHmac('sha256', CLIENT_SECRET).update(rawRequestBody).digest('hex');
if (req.headers['x-zenoa-signature'] !== expected) {
  return res.status(401).send('Invalid signature');
}
\`\`\``,
          authRequired: false,
          rateLimit: 'Real-time push',
          cost: 'Free',
          headers: [
            { name: 'X-Zenoa-Signature', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', desc: 'HMAC-SHA256 signature', required: true },
            { name: 'X-Zenoa-Event', value: 'otp.verified', desc: 'Event identifier string', required: true },
            { name: 'X-Zenoa-Timestamp', value: '1725184920123', desc: 'Epoch timestamp ms', required: true }
          ],
          params: [],
          responseSuccess: `{
  "event": "otp.verified",
  "app_id": "${apiKey}",
  "timestamp": 1725184920123,
  "data": {
    "recipient": "+919876543210",
    "verified": true,
    "otp_id": "+919876543210_${apiKey}",
    "latency_ms": 312
  }
}`,
          snippets: {
            curl: `# Simulated Webhook Payload Inspection
curl -X POST "https://your-domain.com/api/zenoa-webhook" \\
  -H "X-Zenoa-Signature: hmac_sha256_hash_here" \\
  -H "X-Zenoa-Event: otp.verified" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "otp.verified",
    "app_id": "${apiKey}",
    "timestamp": 1725184920000,
    "data": { "recipient": "+919876543210", "verified": true }
  }'`,
            node: `// Express.js Webhook Handler with HMAC-SHA256 Verification
const express = require('express');
const crypto = require('crypto');

const app = express();
const CLIENT_SECRET = process.env.ZENOA_CLIENT_SECRET || '${secretKey}';

app.post('/api/zenoa-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-zenoa-signature'];
  const eventName = req.headers['x-zenoa-event'];

  // Compute expected HMAC
  const expectedSig = crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSig) {
    console.error('Signature mismatch!');
    return res.status(401).json({ error: 'INVALID_SIGNATURE' });
  }

  const payload = JSON.parse(req.body.toString());
  console.log(\`Received \${eventName} event:\`, payload);

  // Acknowledge receipt
  res.status(200).json({ received: true });
});

app.listen(8080, () => console.log('Webhook server running on port 8080'));`,
            python: `import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
CLIENT_SECRET = b"${secretKey}"

@app.route('/api/zenoa-webhook', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Zenoa-Signature')
    expected = hmac.new(CLIENT_SECRET, request.data, hashlib.sha256).hexdigest()
    
    if signature != expected:
        return jsonify({"error": "Unauthorized"}), 401
        
    event_data = request.json
    print(f"Verified event: {event_data.get('event')}")
    return jsonify({"received": True}), 200`,
            php: `<?php
$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_ZENOA_SIGNATURE'] ?? '';
$clientSecret = '${secretKey}';

$expectedSig = hash_hmac('sha256', $rawBody, $clientSecret);

if ($signature !== $expectedSig) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid HMAC Signature"]);
    exit;
}

$event = json_decode($rawBody, true);
http_response_code(200);
echo json_encode(["received" => true]);`,
            go: `package main

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "io/ioutil"
  "net/http"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
  body, _ := ioutil.ReadAll(r.Body)
  sig := r.Header.Get("X-Zenoa-Signature")

  mac := hmac.New(sha256.New, []byte("${secretKey}"))
  mac.Write(body)
  expected := hex.EncodeToString(mac.Sum(nil))

  if sig != expected {
    w.WriteHeader(http.StatusUnauthorized)
    return
  }

  w.WriteHeader(http.StatusOK)
  w.Write([]byte("OK"))
}`,
            java: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

public class WebhookVerifier {
  public static boolean verify(byte[] payload, String signature, String secret) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
    byte[] hash = mac.doFinal(payload);
    String expected = HexFormat.of().formatHex(hash);
    return expected.equals(signature);
  }
}`
          },
          notes: [
            'Webhook endpoints must return HTTP 2xx within 5 seconds.',
            'Failed deliveries trigger automatic retries with exponential backoff (1m, 5m, 15m, 1h).'
          ]
        }
      ]
    },
    {
      id: 'oauth-sso',
      name: 'OAuth 2.0 & Identity SSO',
      icon: 'Key',
      description: 'Login with Zenoa authorization code flow, profile tokens, and scope access.',
      sections: [
        {
          id: 'sso-token',
          category: 'OAuth 2.0 & Identity SSO',
          title: 'Exchange Authorization Code',
          method: 'POST',
          path: '/api/v1/sso/token',
          summary: 'Exchanges OAuth 2.0 authorization code for user access token and profile info.',
          description: `Completes the "Login with Zenoa" standard OAuth 2.0 Authorization Code flow. After user grants permission on the consent screen, your redirect URI receives a \`?code=...\` parameter which your backend server exchanges for a permanent or temporary user access token.`,
          authRequired: true,
          rateLimit: '60 req/min',
          cost: 'Free',
          headers: [
            { name: 'Content-Type', value: 'application/json', desc: 'JSON payload format', required: true }
          ],
          params: [
            { name: 'client_id', type: 'string', required: true, desc: 'Your App Client ID' },
            { name: 'client_secret', type: 'string', required: true, desc: 'Your App Client Secret' },
            { name: 'code', type: 'string', required: true, desc: 'Authorization code from redirect URI parameter' },
            { name: 'grant_type', type: 'string', required: true, desc: 'Must be "authorization_code"' }
          ],
          requestBodyExample: `{
  "client_id": "${apiKey}",
  "client_secret": "${secretKey}",
  "code": "zen_code_984719284712",
  "grant_type": "authorization_code"
}`,
          responseSuccess: `{
  "access_token": "zen_at_849201948201",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "read:profile send:messages",
  "user": {
    "id": "usr_84920481",
    "username": "alex_turner",
    "full_name": "Alex Turner",
    "mobile_number": "+919876543210",
    "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "verified": true
  }
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/sso/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${apiKey}",
    "client_secret": "${secretKey}",
    "code": "AUTH_CODE_RECEIVED",
    "grant_type": "authorization_code"
  }'`,
            node: `const axios = require('axios');

async function handleOAuthCallback(authCode) {
  const res = await axios.post('${baseUrl}/api/v1/sso/token', {
    client_id: '${apiKey}',
    client_secret: '${secretKey}',
    code: authCode,
    grant_type: 'authorization_code'
  });

  console.log('Authenticated User Profile:', res.data.user);
  return res.data;
}`,
            python: `import requests

res = requests.post("${baseUrl}/api/v1/sso/token", json={
    "client_id": "${apiKey}",
    "client_secret": "${secretKey}",
    "code": auth_code,
    "grant_type": "authorization_code"
})
print("User profile:", res.json()["user"])`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/sso/token");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "client_id" => "${apiKey}",
  "client_secret" => "${secretKey}",
  "code" => $_GET['code'],
  "grant_type" => "authorization_code"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$data = curl_exec($ch);
curl_close($ch);`,
            go: `// Go OAuth exchange example
payload, _ := json.Marshal(map[string]string{
  "client_id": "${apiKey}",
  "client_secret": "${secretKey}",
  "code": authCode,
  "grant_type": "authorization_code",
})
http.Post("${baseUrl}/api/v1/sso/token", "application/json", bytes.NewBuffer(payload))`,
            java: `// Java OAuth exchange example`
          },
          notes: [
            'Codes expire after 10 minutes if not exchanged.',
            'Never pass client_secret in frontend JavaScript applications.'
          ]
        }
      ]
    },
    {
      id: 'billing-quotas',
      name: 'Billing, Quotas & Rate Limits',
      icon: 'CreditCard',
      description: 'Account balance queries, rate limit tiers, usage counters, and HTTP 429 semantics.',
      sections: [
        {
          id: 'billing-summary',
          category: 'Billing, Quotas & Rate Limits',
          title: 'Query Wallet Balance & Quotas',
          method: 'GET',
          path: '/api/v1/billing/summary',
          summary: 'Returns live credit balance, daily quota utilization, and current tier limits.',
          description: `Returns real-time account wallet metrics including remaining prepaid credits, today's request count, active plan tier, and rate limit ceiling.`,
          authRequired: true,
          rateLimit: '300 req/min',
          cost: 'Free',
          headers: [
            { name: 'Authorization', value: `Bearer ${apiKey}`, desc: 'App Client ID / API Key', required: true }
          ],
          params: [],
          responseSuccess: `{
  "success": true,
  "billing": {
    "plan": "developer_free",
    "tier_name": "Developer Sandbox",
    "credits_balance": 5000,
    "credits_used_month": 432,
    "daily_rate_limit": 1000,
    "daily_requests_today": 128,
    "requests_remaining_today": 872,
    "auto_recharge_enabled": false
  }
}`,
          snippets: {
            curl: `curl -X GET "${baseUrl}/api/v1/billing/summary" \\
  -H "Authorization: Bearer ${apiKey}"`,
            node: `const axios = require('axios');

const res = await axios.get('${baseUrl}/api/v1/billing/summary', {
  headers: { 'Authorization': 'Bearer ${apiKey}' }
});
console.log('Remaining Credits:', res.data.billing.credits_balance);`,
            python: `import requests

res = requests.get("${baseUrl}/api/v1/billing/summary", headers={"Authorization": "Bearer ${apiKey}"})
print("Quota Status:", res.json())`,
            php: `<?php
$res = file_get_contents("${baseUrl}/api/v1/billing/summary", false, stream_context_create([
  'http' => ['header' => 'Authorization: Bearer ${apiKey}']
]));
echo $res;`,
            go: `req, _ := http.NewRequest("GET", "${baseUrl}/api/v1/billing/summary", nil)
req.Header.Set("Authorization", "Bearer ${apiKey}")
resp, _ := http.DefaultClient.Do(req)`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/billing/summary"))
  .header("Authorization", "Bearer ${apiKey}")
  .GET()
  .build();`
          },
          notes: [
            'Test API keys will show high Sandbox test balances for uninterrupted development.',
            'HTTP 429 Too Many Requests response headers include `Retry-After: <seconds>`.'
          ]
        }
      ]
    },
    {
      id: 'error-codes',
      name: 'Error Codes & Troubleshooting',
      icon: 'AlertTriangle',
      description: 'Comprehensive error code catalog, HTTP status code semantics, and resolution steps.',
      sections: [
        {
          id: 'errors-table',
          category: 'Error Codes & Troubleshooting',
          title: 'Standard Error Codes Reference',
          method: 'GUIDE',
          path: '/docs/errors',
          summary: 'Complete machine-readable error codes and their exact resolution workflows.',
          description: `All Zenoa APIs follow standard RESTful HTTP status code semantics coupled with consistent JSON error responses.

### Error Response Schema:
\`\`\`json
{
  "success": false,
  "error": "MACHINE_READABLE_CODE",
  "message": "Human-readable explanation of why the request failed.",
  "status": 400,
  "documentation_url": "https://zenoa.inolas.com/docs/errors#MACHINE_READABLE_CODE"
}
\`\`\`

### Comprehensive Error Reference Table:

| HTTP Status | Error Code | Root Cause | Resolution Action |
| :--- | :--- | :--- | :--- |
| **400** | \`INVALID_PAYLOAD\` | Missing required fields in JSON body. | Validate that \`recipient\` and \`message\`/\`code\` exist. |
| **400** | \`INVALID_PHONE_FORMAT\` | Phone number is not in E.164 standard. | Format numbers with country code e.g. \`+919876543210\`. |
| **401** | \`UNAUTHORIZED\` | Missing or malformed \`Authorization\` header. | Pass \`Authorization: Bearer <API_KEY>\`. |
| **401** | \`INVALID_API_KEY\` | API Key or Client ID does not exist or was rotated. | Copy active key from API Credentials tab. |
| **403** | \`IP_NOT_ALLOWLISTED\` | Request IP is blocked by CIDR security rules. | Add your server public IP in Security & IPs tab. |
| **403** | \`INSUFFICIENT_CREDITS\` | Production wallet balance is 0. | Add credits or switch to Sandbox mode. |
| **403** | \`TEMPLATE_NOT_APPROVED\` | Template is in pending review or rejected status. | Wait for template approval or use standard template. |
| **404** | \`RECIPIENT_NOT_FOUND\` | Targeted username does not exist on Zenoa. | Confirm username spelling without extra symbols. |
| **410** | \`OTP_EXPIRED\` | The verification passcode has expired. | Request a new OTP passcode via \`POST /api/v1/otp/send\`. |
| **422** | \`OTP_MAX_ATTEMPTS\` | 5 incorrect verification attempts recorded. | Security lock activated. Issue new OTP after 60s. |
| **429** | \`RATE_LIMIT_EXCEEDED\` | Daily or per-minute request quota reached. | Inspect \`Retry-After\` header and upgrade plan tier. |
| **500** | \`INTERNAL_SERVER_ERROR\` | Transient database or network exception. | Safe to retry with exponential backoff. |`,
          authRequired: false,
          rateLimit: 'N/A',
          cost: 'Free',
          headers: [],
          params: [],
          responseSuccess: `{
  "error_catalog_version": "2026.09",
  "total_codes": 12,
  "sla_uptime": "99.99%"
}`,
          snippets: {
            curl: `# Handling error responses in cURL
curl -i -X POST "${baseUrl}/api/v1/otp/verify" \\
  -H "Authorization: Bearer invalid_key"`,
            node: `// Robust Error Handling in Node.js
try {
  const res = await axios.post('${baseUrl}/api/v1/otp/send', payload, { headers });
} catch (error) {
  if (error.response) {
    console.error('API Error Code:', error.response.data.error);
    console.error('Message:', error.response.data.message);
    if (error.response.status === 429) {
      console.warn('Rate limited! Retry after:', error.response.headers['retry-after']);
    }
  }
}`,
            python: `try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
except requests.exceptions.HTTPError as err:
    print(f"HTTP Error: {err.response.status_code}")
    print(f"Details: {err.response.json()}")`,
            php: `// PHP Error handling example`,
            go: `// Go Error handling example`,
            java: `// Java Error handling example`
          },
          notes: [
            'Always inspect the `error` string field rather than parsing the `message` for robust programmatic handling.',
            'All error responses are logged in real-time in the Live Inspector tab for instant debugging.'
          ]
        }
      ]
    }
  ];
};
