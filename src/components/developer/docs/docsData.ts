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
  const botHandle = app?.bot_username ? (app.bot_username.startsWith('@') ? app.bot_username : `@${app.bot_username}`) : '@sa_business_bot';

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
          description: `Zenoa Developer Platform provides carrier-grade communication APIs engineered for sub-second OTP verification, automated service account notifications, message template governance, and real-time webhooks.

### Key Capabilities:
- **Instant OTP Verification**: Deliver 4 or 6-digit numeric passcodes to Zenoa user inboxes and verified mobile numbers in under 400ms.
- **Service Account Direct Messaging**: Send rich Markdown, media attachments, and interactive buttons from your verified service account identity.
- **Message Templates & Anti-Spam Compliance**: Ensure enterprise brand safety with pre-approved message formats and variable syntax.
- **Real-Time Webhooks with HMAC Signatures**: Receive instant delivery reports, read receipts, and user reply events with SHA-256 cryptographic verification.
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
          id: 'business-vs-official-accounts',
          category: 'Getting Started',
          title: 'Business Service Accounts & Secure Infrastructure',
          method: 'GUIDE',
          path: '/docs/business-service-accounts',
          summary: 'Comprehensive guide to Developer Business Service Accounts, communication infrastructure, user privacy protections, verification standards, and sovereign controls.',
          description: `Zenoa provides Developer Business Service Accounts to enable organizations, startups, and developers to automate transactional messaging, 2FA/OTP delivery, and customer care on secure carrier infrastructure.

---

### 1. What is a Business Service Account?
Business accounts are programmatic, non-human entities registered by developers through the Zenoa Developer Console. They allow verified external applications to converse with Zenoa users over end-to-end encrypted gateways.

- **Developer Controlled**: Configured with custom application names, handles (prefixed with \`sa_\`), webhooks, and REST API credentials.
- **Verification Policy**: **Never Automatically Verified**. Business accounts remain unverified by default. Verification is exclusively granted after manual compliance audit and review by Zenoa administrators.
- **Subtitles & Badging**: Displays **"Business Account"** beneath the handle in chats and message bubbles.
- **In-Chat Banner**: Displays **"This business account uses secure Zenoa infrastructure to communicate. Tap to learn more."**

---

### 2. Capabilities: What Business Accounts Can & Cannot Do

#### What Business Accounts CAN Do:
1. **Automated Transactional Notifications**: Send order confirmations, shipping tracking updates, OTP authentication codes, and booking receipts.
2. **Customer Service & Inquiries**: Receive and respond to user messages when the user chooses to converse with the business entity.
3. **Structured Interactive Messages**: Send rich message templates with quick-reply action buttons, media attachments, and deep links.

#### What Business Accounts CANNOT Do:
1. **Zero Access to Personal Chats**: Business accounts have zero visibility into your private conversations, contact lists, or audio/video calls.
2. **Zero Access to Encryption Keys**: All user cryptographic keys remain isolated on individual client devices using zero-knowledge architecture.
3. **No Unsolicited Bulk Spam**: Business accounts cannot scrape directory databases or send broadcast spam without explicit recipient opt-in.
4. **No Calling Features**: Service accounts cannot initiate or receive voice or video calls.
5. **No Personal Social Features**: Follow button, personal nicknames, group chat creation, and online timestamps are disabled for service accounts.

---

### 3. Profile Picture & Environment Visibility
- **Testing (Sandbox) Mode**: Developers can upload and update their service account profile photo in the Developer Console settings. While in Sandbox mode, this photo is kept private and will not be displayed to messenger users.
- **Live (Production) Mode**: Once the developer switches their service account to Live Production mode, the customized profile photo becomes active and visible to all messenger users.

---

### 4. User Sovereign Controls & Protections
Every Zenoa user retains complete sovereign authority over every business interaction:

- **Instant Mute**: One-tap muting directly from the chat menu or business security banner.
- **Immediate One-Tap Block**: Block any business permanently with zero delay. Once blocked, the business cannot send messages or determine your online status.
- **Abuse Reporting**: One-tap reporting immediately routes conversational context and transcript signatures to Zenoa Trust & Safety for review.`,
          authRequired: false,
          rateLimit: 'Unlimited',
          cost: 'Free',
          headers: [],
          params: [],
          responseSuccess: `{
  "account_tier": "business_service_account",
  "verification_status": "unverified_default",
  "encryption_level": "tls_1_3_secure_gateway",
  "operational_modes": ["sandbox", "live"],
  "user_sovereign_controls": {
    "can_mute": true,
    "can_block": true,
    "can_report": true
  }
}`,
          snippets: {
            curl: `# Check Business Account Status & Security Tier
curl -X GET "${baseUrl}/api/v1/accounts/verify?username=sa_my_business"`,
            node: `const axios = require('axios');

async function checkBusinessAccount(username) {
  const res = await axios.get('${baseUrl}/api/v1/accounts/verify?username=' + username);
  console.log('Business Account Info:', res.data);
}
checkBusinessAccount('sa_my_business');`,
            python: `import requests

res = requests.get("${baseUrl}/api/v1/accounts/verify?username=sa_my_business")
print("Business Account Info:", res.json())`,
            php: `<?php
$res = file_get_contents("${baseUrl}/api/v1/accounts/verify?username=sa_my_business");
echo "Business Account Info: " . $res;`,
            go: `package main

import (
  "fmt"
  "net/http"
  "io/ioutil"
)

func main() {
  resp, err := http.Get("${baseUrl}/api/v1/accounts/verify?username=sa_my_business")
  if err != nil { panic(err) }
  defer resp.Body.Close()
  body, _ := ioutil.ReadAll(resp.Body)
  fmt.Println(string(body))
}`,
            java: `import java.net.http.*;
import java.net.URI;

public class VerifyBusinessAccount {
  public static void main(String[] args) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest req = HttpRequest.newBuilder()
      .uri(URI.create("${baseUrl}/api/v1/accounts/verify?username=sa_my_business"))
      .GET()
      .build();
    HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
    System.out.println("Response: " + res.body());
  }
}`
          },
          notes: [
            'Business accounts operate strictly within sandbox and production gateway standards.',
            'Developer accounts cannot mimic or claim system administrator status.',
            'Misleading branding, phishing, or impersonation results in instant permanent revocation of API keys.'
          ]
        },
        {
          id: 'auth-guide',
          category: 'Getting Started',
          title: 'Authentication & Dual-Credential Security',
          method: 'GUIDE',
          path: '/docs/authentication',
          summary: 'Strict dual-credential enforcement: All service account operations require BOTH Client ID and Client Secret.',
          description: `All programmatic requests to Zenoa Developer Platform service account endpoints strictly mandate **Dual-Credential Verification**.

### Credential Requirements:
1. **Client ID (\`client_id\` / \`X-Client-Id\`)**: Identifies your registered Service Account (\`${apiKey}\`).
2. **Client Secret (\`client_secret\` / \`X-Client-Secret\` / Basic Auth)**: Strictly confidential master token. Mandatory for all OTP dispatches, passcode verifications, and bot messaging.

### Header Standards:
\`\`\`http
X-Client-Id: ${apiKey}
X-Client-Secret: YOUR_SERVICE_ACCOUNT_SECRET
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/json
\`\`\`

> **CRITICAL SECURITY RULE**: Never pass API requests with only a Client ID. Unauthenticated requests without a matching Client Secret will be rejected with HTTP 401 Unauthorized.`,
          authRequired: true,
          rateLimit: 'Governed by Plan Tier',
          cost: 'Free',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'Your App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'Your App Client Secret (Confidential)', required: true },
            { name: 'Authorization', value: `Basic <base64(client_id:client_secret)>`, desc: 'Standard HTTP Basic Authorization header', required: false },
            { name: 'Content-Type', value: 'application/json', desc: 'Mandatory for all POST/PUT requests', required: true }
          ],
          params: [],
          responseSuccess: `{
  "authenticated": true,
  "app_id": "${apiKey}",
  "service_account": "${botHandle}",
  "environment": "test",
  "permissions": ["otp:send", "otp:verify", "bot:send", "templates:read", "webhooks:manage"]
}`,
          responseError: `{
  "error": "UNAUTHORIZED",
  "message": "Missing client_secret. Developer Console Service Account actions strictly require BOTH client_id and client_secret.",
  "status": 401
}`,
          snippets: {
            curl: `curl -X GET "${baseUrl}/api/v1/billing/summary" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json"`,
            node: `const axios = require('axios');

const client = axios.create({
  baseURL: '${baseUrl}',
  headers: {
    'X-Client-Id': process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
    'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET,
    'Content-Type': 'application/json'
  }
});`,
            python: `import os
import requests

headers = {
    "X-Client-Id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "X-Client-Secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "Content-Type": "application/json"
}
response = requests.get("${baseUrl}/api/v1/billing/summary", headers=headers)`,
            php: `<?php
$headers = [
  'X-Client-Id: ' . (getenv('ZENOA_SA_CLIENT_ID') ?: '${apiKey}'),
  'X-Client-Secret: ' . getenv('ZENOA_SA_CLIENT_SECRET'),
  'Content-Type: application/json'
];`,
            go: `req.Header.Set("X-Client-Id", os.Getenv("ZENOA_SA_CLIENT_ID"))
req.Header.Set("X-Client-Secret", os.Getenv("ZENOA_SA_CLIENT_SECRET"))
req.Header.Set("Content-Type", "application/json")`,
            java: `HttpRequest.newBuilder()
  .header("X-Client-Id", System.getenv("ZENOA_SA_CLIENT_ID"))
  .header("X-Client-Secret", System.getenv("ZENOA_SA_CLIENT_SECRET"))
  .header("Content-Type", "application/json")`
          },
          notes: [
            'Both client_id and client_secret are strictly required for every service account action.',
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
          description: `Dispatches an instant, cryptographically secure OTP directly to a user's Zenoa chat inbox or verified phone number. Strictly requires dual-credential authentication with both Client ID and Client Secret.

### Delivery Logic:
- If recipient is a \`@username\`, delivered to the user's active Zenoa chat.
- If recipient is an \`E.164 phone number\` (e.g., \`+919876543210\`), matched with verified user accounts.
- Codes default to 6 numeric digits and 10 minutes expiry unless overridden.`,
          authRequired: true,
          rateLimit: '60 req/min (Free) • 500 req/min (Growth)',
          cost: '1 Credit per OTP dispatched (0 in Sandbox)',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'App Client Secret', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON body format', required: true }
          ],
          params: [
            { name: 'client_id', type: 'string', required: true, desc: 'Your Service Account Client ID' },
            { name: 'client_secret', type: 'string', required: true, desc: 'Your Service Account Client Secret' },
            { name: 'recipient', type: 'string', required: true, desc: 'Target @username or E.164 phone number (+919876543210)' },
            { name: 'template_type', type: 'string', required: false, desc: 'Format: "standard_otp" | "2fa_auth" | "password_reset" | "transaction_auth"', default: 'standard_otp' },
            { name: 'expiry_mins', type: 'number', required: false, desc: 'Passcode validity window in minutes (1 to 1440)', default: '10' },
            { name: 'custom_code', type: 'string', required: false, desc: 'Specific 4 or 6-digit code if generated by your internal system' },
            { name: 'custom_message', type: 'string', required: false, desc: 'Optional custom prefix text' }
          ],
          requestBodyExample: `{
  "client_id": "${apiKey}",
  "client_secret": "YOUR_CLIENT_SECRET",
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
  "error": "UNAUTHORIZED",
  "message": "Missing client_secret. Both client_id and client_secret are strictly required for OTP dispatch."
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/otp/send" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${apiKey}",
    "client_secret": "'"$ZENOA_SA_CLIENT_SECRET"'",
    "recipient": "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins": 10
  }'`,
            node: `const axios = require('axios');

async function sendVerificationOtp(recipient) {
  const response = await axios.post('${baseUrl}/api/v1/otp/send', {
    client_id: process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
    client_secret: process.env.ZENOA_SA_CLIENT_SECRET,
    recipient: recipient,
    template_type: 'standard_otp',
    expiry_mins: 10
  }, {
    headers: {
      'X-Client-Id': process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
      'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET,
      'Content-Type': 'application/json'
    }
  });

  console.log('OTP Dispatched successfully:', response.data);
  return response.data;
}

sendVerificationOtp('+919876543210');`,
            python: `import os
import requests

url = "${baseUrl}/api/v1/otp/send"
headers = {
    "X-Client-Id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "X-Client-Secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "Content-Type": "application/json"
}
payload = {
    "client_id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "client_secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "recipient": "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins": 10
}

response = requests.post(url, json=payload, headers=headers)
print("OTP Send Response:", response.json())`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/otp/send");
$clientId = getenv('ZENOA_SA_CLIENT_ID') ?: "${apiKey}";
$clientSecret = getenv('ZENOA_SA_CLIENT_SECRET');

$payload = json_encode([
    "client_id" => $clientId,
    "client_secret" => $clientSecret,
    "recipient" => "+919876543210",
    "template_type" => "standard_otp",
    "expiry_mins" => 10
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-Client-Id: ' . $clientId,
    'X-Client-Secret: ' . $clientSecret,
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
  "os"
)

func main() {
  clientID := os.Getenv("ZENOA_SA_CLIENT_ID")
  if clientID == "" { clientID = "${apiKey}" }
  clientSecret := os.Getenv("ZENOA_SA_CLIENT_SECRET")

  payload := map[string]interface{}{
    "client_id":     clientID,
    "client_secret": clientSecret,
    "recipient":     "+919876543210",
    "template_type": "standard_otp",
    "expiry_mins":   10,
  }
  jsonPayload, _ := json.Marshal(payload)

  req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/otp/send", bytes.NewBuffer(jsonPayload))
  req.Header.Set("X-Client-Id", clientID)
  req.Header.Set("X-Client-Secret", clientSecret)
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
    String clientId = System.getenv("ZENOA_SA_CLIENT_ID") != null ? System.getenv("ZENOA_SA_CLIENT_ID") : "${apiKey}";
    String clientSecret = System.getenv("ZENOA_SA_CLIENT_SECRET") != null ? System.getenv("ZENOA_SA_CLIENT_SECRET") : "";

    String json = String.format("{\\"client_id\\":\\"%s\\",\\"client_secret\\":\\"%s\\",\\"recipient\\":\\"+919876543210\\",\\"template_type\\":\\"standard_otp\\",\\"expiry_mins\\":10}", clientId, clientSecret);
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest req = HttpRequest.newBuilder()
      .uri(URI.create("${baseUrl}/api/v1/otp/send"))
      .header("X-Client-Id", clientId)
      .header("X-Client-Secret", clientSecret)
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(json))
      .build();
    HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
    System.out.println("Result: " + res.body());
  }
}`
          },
          notes: [
            'Strict dual-credential authentication: Both client_id and client_secret are required.',
            'Recipient rate limiting restricts maximum 5 OTP dispatches per phone number in a 5-minute window.'
          ]
        },
        {
          id: 'otp-verify',
          category: 'OTP & MFA Verification',
          title: 'Verify Passcode',
          method: 'POST',
          path: '/api/v1/otp/verify',
          summary: 'Validates user-submitted OTP code with dual-credential protection.',
          description: `Performs atomic verification of the 6-digit passcode submitted by the end user. Expired, invalid, or already consumed codes are immediately rejected. Strictly requires both Client ID and Client Secret.

### Verification Lifecycle:
1. Validates client_id and client_secret dual authentication.
2. Matches recipient and app ID in secure atomic storage.
3. Checks timestamp validity (\`Date.now() < expires_at\`).
4. Auto-expires code upon successful verification (One-Time Use guarantee).
5. Increments failed attempt counter (locks code after 5 consecutive failures).`,
          authRequired: true,
          rateLimit: '120 req/min',
          cost: 'Free (Included with Send)',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'App Client Secret', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON format', required: true }
          ],
          params: [
            { name: 'client_id', type: 'string', required: true, desc: 'Your Service Account Client ID' },
            { name: 'client_secret', type: 'string', required: true, desc: 'Your Service Account Client Secret' },
            { name: 'recipient', type: 'string', required: true, desc: 'Target @username or mobile number used during send' },
            { name: 'code', type: 'string', required: true, desc: '6-digit passcode entered by the user' }
          ],
          requestBodyExample: `{
  "client_id": "${apiKey}",
  "client_secret": "YOUR_CLIENT_SECRET",
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
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${apiKey}",
    "client_secret": "'"$ZENOA_SA_CLIENT_SECRET"'",
    "recipient": "+919876543210",
    "code": "584920"
  }'`,
            node: `const axios = require('axios');

async function verifyUserCode(recipient, userCode) {
  try {
    const res = await axios.post('${baseUrl}/api/v1/otp/verify', {
      client_id: process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
      client_secret: process.env.ZENOA_SA_CLIENT_SECRET,
      recipient: recipient,
      code: userCode
    }, {
      headers: {
        'X-Client-Id': process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
        'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET,
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
            python: `import os
import requests

res = requests.post("${baseUrl}/api/v1/otp/verify", json={
    "client_id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "client_secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "recipient": "+919876543210",
    "code": "584920"
}, headers={
    "X-Client-Id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "X-Client-Secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "Content-Type": "application/json"
})

data = res.json()
if data.get("verified"):
    print("Authentication confirmed!")`,
            php: `<?php
$clientId = getenv('ZENOA_SA_CLIENT_ID') ?: "${apiKey}";
$clientSecret = getenv('ZENOA_SA_CLIENT_SECRET');

$ch = curl_init("${baseUrl}/api/v1/otp/verify");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "client_id" => $clientId,
  "client_secret" => $clientSecret,
  "recipient" => "+919876543210",
  "code" => "584920"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'X-Client-Id: ' . $clientId,
  'X-Client-Secret: ' . $clientSecret,
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
  "os"
)

func main() {
  clientID := os.Getenv("ZENOA_SA_CLIENT_ID")
  if clientID == "" { clientID = "${apiKey}" }
  clientSecret := os.Getenv("ZENOA_SA_CLIENT_SECRET")

  body, _ := json.Marshal(map[string]string{
    "client_id":     clientID,
    "client_secret": clientSecret,
    "recipient":     "+919876543210",
    "code":          "584920",
  })
  req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/otp/verify", bytes.NewBuffer(body))
  req.Header.Set("X-Client-Id", clientID)
  req.Header.Set("X-Client-Secret", clientSecret)
  req.Header.Set("Content-Type", "application/json")

  resp, _ := http.DefaultClient.Do(req)
  defer resp.Body.Close()
  fmt.Println("Status:", resp.Status)
}`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/otp/verify"))
  .header("X-Client-Id", System.getenv("ZENOA_SA_CLIENT_ID") != null ? System.getenv("ZENOA_SA_CLIENT_ID") : "${apiKey}")
  .header("X-Client-Secret", System.getenv("ZENOA_SA_CLIENT_SECRET") != null ? System.getenv("ZENOA_SA_CLIENT_SECRET") : "")
  .header("Content-Type", "application/json")
  .POST(HttpRequest.BodyPublishers.ofString("{\\"client_id\\":\\"${apiKey}\\",\\"client_secret\\":\\"SECRET\\",\\"recipient\\":\\"+919876543210\\",\\"code\\":\\"584920\\"}"))
  .build();`
          },
          notes: [
            'Once verified, the token is automatically invalidated to prevent replay attacks.',
            'Dual authentication ensures only authorized servers can verify codes.'
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
          description: `Dispatches an instant transactional alert, order status update, ticket notification, or direct message from your verified Service Account identity. Strictly requires both Client ID and Client Secret.

### Supported Features:
- **Markdown Formatting**: Bold (\`**text**\`), Italic (\`*text*\`), Inline Code (\`\` \`code\` \`\`), and Code Blocks.
- **Media Attachments**: High-resolution PNG, JPEG, PDF, and MP4 attachment URLs.
- **Action Buttons**: Optional quick-reply action buttons for deep-linking.`,
          authRequired: true,
          rateLimit: '100 req/min',
          cost: '1 Credit per message',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'App Client Secret', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON format', required: true }
          ],
          params: [
            { name: 'client_id', type: 'string', required: true, desc: 'Your Service Account Client ID' },
            { name: 'client_secret', type: 'string', required: true, desc: 'Your Service Account Client Secret' },
            { name: 'recipient', type: 'string', required: true, desc: 'Target @username or mobile number (+91...)' },
            { name: 'message', type: 'string', required: true, desc: 'Message content body with Markdown support' },
            { name: 'media_url', type: 'string', required: false, desc: 'Public URL to image or document attachment' },
            { name: 'actions', type: 'array', required: false, desc: 'List of button actions: [{ label: "View Order", url: "https://..." }]' }
          ],
          requestBodyExample: `{
  "client_id": "${apiKey}",
  "client_secret": "YOUR_CLIENT_SECRET",
  "recipient": "john_doe",
  "message": "**Your Order #84920 has shipped!**\\n\\nCarrier: FedEx Priority\\nTracking: #9847291849",
  "media_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"
}`,
          responseSuccess: `{
  "success": true,
  "message_id": "msg_9847192847",
  "recipient": "john_doe",
  "sender_bot": "${botHandle}",
  "status": "delivered",
  "timestamp": 1725184980000
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/bot/send" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "${apiKey}",
    "client_secret": "'"$ZENOA_SA_CLIENT_SECRET"'",
    "recipient": "john_doe",
    "message": "Your payment of $49.00 was received successfully!"
  }'`,
            node: `const axios = require('axios');

await axios.post('${baseUrl}/api/v1/bot/send', {
  client_id: process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
  client_secret: process.env.ZENOA_SA_CLIENT_SECRET,
  recipient: 'john_doe',
  message: '**Your Order #84920 has shipped!**\\nTrack at: https://example.com/track',
  media_url: 'https://example.com/shipping-label.png'
}, {
  headers: {
    'X-Client-Id': process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
    'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET,
    'Content-Type': 'application/json'
  }
});`,
            python: `import os
import requests

url = "${baseUrl}/api/v1/bot/send"
headers = {
    "X-Client-Id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "X-Client-Secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "Content-Type": "application/json"
}
payload = {
    "client_id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "client_secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", ""),
    "recipient": "john_doe",
    "message": "Your flight **ZN-402** is on schedule for boarding at Gate 14."
}

res = requests.post(url, json=payload, headers=headers)
print("Message Dispatched:", res.json())`,
            php: `<?php
$clientId = getenv('ZENOA_SA_CLIENT_ID') ?: "${apiKey}";
$clientSecret = getenv('ZENOA_SA_CLIENT_SECRET');

$ch = curl_init("${baseUrl}/api/v1/bot/send");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "client_id" => $clientId,
  "client_secret" => $clientSecret,
  "recipient" => "john_doe",
  "message" => "Welcome to our platform!"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'X-Client-Id: ' . $clientId,
  'X-Client-Secret: ' . $clientSecret,
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
  "os"
)

func main() {
  clientID := os.Getenv("ZENOA_SA_CLIENT_ID")
  if clientID == "" { clientID = "${apiKey}" }
  clientSecret := os.Getenv("ZENOA_SA_CLIENT_SECRET")

  body, _ := json.Marshal(map[string]interface{}{
    "client_id":     clientID,
    "client_secret": clientSecret,
    "recipient":     "john_doe",
    "message":       "Hello from Go Service Account SDK!",
  })
  req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/bot/send", bytes.NewBuffer(body))
  req.Header.Set("X-Client-Id", clientID)
  req.Header.Set("X-Client-Secret", clientSecret)
  req.Header.Set("Content-Type", "application/json")

  resp, _ := http.DefaultClient.Do(req)
  defer resp.Body.Close()
  fmt.Println("Message Send Status:", resp.Status)
}`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/bot/send"))
  .header("X-Client-Id", System.getenv("ZENOA_SA_CLIENT_ID") != null ? System.getenv("ZENOA_SA_CLIENT_ID") : "${apiKey}")
  .header("X-Client-Secret", System.getenv("ZENOA_SA_CLIENT_SECRET") != null ? System.getenv("ZENOA_SA_CLIENT_SECRET") : "")
  .header("Content-Type", "application/json")
  .POST(HttpRequest.BodyPublishers.ofString("{\\"client_id\\":\\"${apiKey}\\",\\"client_secret\\":\\"SECRET\\",\\"recipient\\":\\"john_doe\\",\\"message\\":\\"Hello from Java!\\"}"))
  .build();`
          },
          notes: [
            'Messages are sent under your service account identity.',
            'Target users receive standard push notifications for all inbound messages.'
          ]
        }
      ]
    },
    {
      id: 'message-templates',
      name: 'Templates & Anti-Spam Governance',
      icon: 'FileCode',
      description: 'Pre-approved message layouts, variable placeholders, compliance tiers, and approval status.',
      sections: [
        {
          id: 'templates-list',
          category: 'Templates & Anti-Spam Governance',
          title: 'List Active Templates',
          method: 'GET',
          path: '/api/v1/templates',
          summary: 'Retrieves all approved and pending message templates registered for this application.',
          description: `Returns the full catalog of registered message templates. In Production mode, transactional messages must adhere to pre-approved templates with dynamic \`{{variable}}\` placeholders.`,
          authRequired: true,
          rateLimit: '120 req/min',
          cost: 'Free',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'App Client Secret', required: true }
          ],
          params: [],
          responseSuccess: `{
  "success": true,
  "templates": [
    {
      "id": "tpl_otp_verification",
      "name": "Standard OTP Code",
      "category": "AUTHENTICATION",
      "status": "approved",
      "body": "Your Zenoa verification code is {{1}}. Valid for {{2}} minutes.",
      "created_at": 1725184900000
    }
  ]
}`,
          snippets: {
            curl: `curl -X GET "${baseUrl}/api/v1/templates" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET"`,
            node: `const axios = require('axios');

const res = await axios.get('${baseUrl}/api/v1/templates', {
  headers: {
    'X-Client-Id': process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
    'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET
  }
});
console.log('Registered Templates:', res.data.templates);`,
            python: `import os
import requests

res = requests.get("${baseUrl}/api/v1/templates", headers={
    "X-Client-Id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "X-Client-Secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", "")
})
print("Templates:", res.json())`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/templates");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'X-Client-Id: ' . (getenv('ZENOA_SA_CLIENT_ID') ?: '${apiKey}'),
  'X-Client-Secret: ' . getenv('ZENOA_SA_CLIENT_SECRET')
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo $res;`,
            go: `req, _ := http.NewRequest("GET", "${baseUrl}/api/v1/templates", nil)
req.Header.Set("X-Client-Id", os.Getenv("ZENOA_SA_CLIENT_ID"))
req.Header.Set("X-Client-Secret", os.Getenv("ZENOA_SA_CLIENT_SECRET"))
resp, _ := http.DefaultClient.Do(req)`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/templates"))
  .header("X-Client-Id", System.getenv("ZENOA_SA_CLIENT_ID"))
  .header("X-Client-Secret", System.getenv("ZENOA_SA_CLIENT_SECRET"))
  .GET()
  .build();`
          },
          notes: [
            'Templates can be submitted and managed via Developer Console Templates tab.',
            'Approval takes under 5 minutes through automated compliance scanning.'
          ]
        }
      ]
    },
    {
      id: 'webhooks-guide',
      name: 'Real-Time Webhooks & Events',
      icon: 'Webhook',
      description: 'HTTPS delivery webhooks, HMAC SHA-256 signature verification, and automated retry policies.',
      sections: [
        {
          id: 'webhooks-verify',
          category: 'Real-Time Webhooks & Events',
          title: 'Verify Inbound HMAC Signatures',
          method: 'GUIDE',
          path: '/docs/webhooks/signatures',
          summary: 'Cryptographically authenticate webhook events sent by Zenoa to your HTTP server.',
          description: `Every webhook dispatched by Zenoa contains a \`X-Zenoa-Signature\` header containing the HMAC-SHA256 hex digest of the raw request payload computed using your app's confidential Client Secret.

### Verification Algorithm:
\`\`\`
computed_signature = HMAC_SHA256(raw_request_body, app.client_secret)
is_valid = constant_time_compare(computed_signature, req.headers['X-Zenoa-Signature'])
\`\`\``,
          authRequired: false,
          rateLimit: 'N/A',
          cost: 'Free',
          headers: [
            { name: 'X-Zenoa-Signature', value: 'sha256=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', desc: 'HMAC SHA-256 hex digest', required: true }
          ],
          params: [],
          responseSuccess: `{
  "event": "message.delivered",
  "message_id": "msg_849201948",
  "recipient": "alex_turner",
  "timestamp": 1725184985000
}`,
          snippets: {
            curl: `# Simulate Inbound Webhook Event Verification
echo -n '{"event":"message.delivered"}' | openssl dgst -sha256 -hmac "${secretKey}"`,
            node: `const crypto = require('crypto');

function verifyWebhook(rawPayload, signatureHeader, secretKey) {
  const hmac = crypto.createHmac('sha256', secretKey);
  const expectedSig = 'sha256=' + hmac.update(rawPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSig));
}`,
            python: `import hmac
import hashlib

def verify_webhook(raw_payload: bytes, signature_header: str, secret_key: str) -> bool:
    expected_sig = "sha256=" + hmac.new(secret_key.encode(), raw_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature_header, expected_sig)`,
            php: `<?php
function verifyWebhook($rawPayload, $signatureHeader, $secretKey) {
    $expected = 'sha256=' . hash_hmac('sha256', $rawPayload, $secretKey);
    return hash_equals($expected, $signatureHeader);
}`,
            go: `package main

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
)

func VerifyWebhook(payload []byte, signature, secret string) bool {
  mac := hmac.New(sha256.New, []byte(secret))
  mac.Write(payload)
  expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
  return hmac.Equal([]byte(signature), []byte(expected))
}`,
            java: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

public class WebhookVerifier {
  public static boolean verify(byte[] payload, String signature, String secret) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
    byte[] hash = mac.doFinal(payload);
    String expected = "sha256=" + HexFormat.of().formatHex(hash);
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
            { name: 'X-Client-Id', value: apiKey, desc: 'App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'App Client Secret', required: true }
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
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET"`,
            node: `const axios = require('axios');

const res = await axios.get('${baseUrl}/api/v1/billing/summary', {
  headers: {
    'X-Client-Id': process.env.ZENOA_SA_CLIENT_ID || '${apiKey}',
    'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET
  }
});
console.log('Remaining Credits:', res.data.billing.credits_balance);`,
            python: `import os
import requests

res = requests.get("${baseUrl}/api/v1/billing/summary", headers={
    "X-Client-Id": os.environ.get("ZENOA_SA_CLIENT_ID", "${apiKey}"),
    "X-Client-Secret": os.environ.get("ZENOA_SA_CLIENT_SECRET", "")
})
print("Quota Status:", res.json())`,
            php: `<?php
$ch = curl_init("${baseUrl}/api/v1/billing/summary");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'X-Client-Id: ' . (getenv('ZENOA_SA_CLIENT_ID') ?: '${apiKey}'),
  'X-Client-Secret: ' . getenv('ZENOA_SA_CLIENT_SECRET')
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo $res;`,
            go: `req, _ := http.NewRequest("GET", "${baseUrl}/api/v1/billing/summary", nil)
req.Header.Set("X-Client-Id", os.Getenv("ZENOA_SA_CLIENT_ID"))
req.Header.Set("X-Client-Secret", os.Getenv("ZENOA_SA_CLIENT_SECRET"))
resp, _ := http.DefaultClient.Do(req)`,
            java: `HttpRequest req = HttpRequest.newBuilder()
  .uri(URI.create("${baseUrl}/api/v1/billing/summary"))
  .header("X-Client-Id", System.getenv("ZENOA_SA_CLIENT_ID"))
  .header("X-Client-Secret", System.getenv("ZENOA_SA_CLIENT_SECRET"))
  .GET()
  .build();`
          },
          notes: [
            'Test API keys will show high Sandbox test balances for uninterrupted development.',
            'HTTP 429 Too Many Requests response headers include \`Retry-After: <seconds>\`.'
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
  "documentation_url": "https://zenoa.sbs/docs/errors#MACHINE_READABLE_CODE"
}
\`\`\`

### Comprehensive Error Reference Table:

| HTTP Status | Error Code | Root Cause | Resolution Action |
| :--- | :--- | :--- | :--- |
| **400** | \`INVALID_PAYLOAD\` | Missing required fields in JSON body. | Validate that \`recipient\` and \`message\`/\`code\` exist. |
| **400** | \`INVALID_PHONE_FORMAT\` | Phone number is not in E.164 standard. | Format numbers with country code e.g. \`+919876543210\`. |
| **401** | \`UNAUTHORIZED\` | Missing or invalid \`client_id\` or \`client_secret\`. | Provide both \`X-Client-Id\` and \`X-Client-Secret\`. |
| **401** | \`INVALID_CREDENTIALS\` | Secret or Client ID does not match registered service account. | Copy credentials from API Credentials console tab. |
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
  -H "X-Client-Id: invalid_id" \\
  -H "X-Client-Secret: invalid_secret"`,
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
            'Always inspect the \`error\` string field rather than parsing the \`message\` for robust programmatic handling.',
            'All error responses are logged in real-time in the Live Inspector tab for instant debugging.'
          ]
        }
      ]
    }
  ];
};
