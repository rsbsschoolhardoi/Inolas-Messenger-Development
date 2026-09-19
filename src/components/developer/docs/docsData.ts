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
  const apiKey = app?.active_client_id || app?.client_id || 'zen_live_app_sample_key';
  const secretKey = app?.active_client_secret || app?.client_secret || 'zen_sa_7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a';
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
- **Abuse Reporting**: One-tap reporting immediately routes conversational context and transcript signatures to Zenoa Trust & Safety for review.

---

### 5. Infrastructure Capacity & Rate Limit Explanation
- **Why Rate Limit is listed as "N/A (Policy Specification)"**: This document is an architectural governance specification rather than an active request endpoint.
- **Actual Pipeline Capacity**: When sending active messages or OTPs via \`POST /api/v1/bot/message/send\`, throughput is governed by your account tier:
  - **Sandbox Mode**: 60 requests / minute (designed for test environments).
  - **Live Standard**: 500 requests / minute.
  - **Live Enterprise (Verified)**: Dedicated unthrottled message queues supporting up to 10,000 messages/sec with enterprise SLAs.
- **Dedicated Worker Threads**: Business Service Accounts communicate across isolated message queues backed by high-throughput Redis and WebSocket pipelines, ensuring zero latency degradation for end-user consumer chats.`,
          authRequired: false,
          rateLimit: 'N/A (Architecture & Policy Specification)',
          cost: 'Free Documentation',
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
        },
        {
          id: 'kyb-verification',
          category: 'Getting Started',
          title: 'Official Enterprise Verification & KYB Standards',
          method: 'GUIDE',
          path: '/docs/enterprise-verification',
          summary: 'Requirements, compliance checklist, and audit procedure to earn the Green Verified Checkmark and high-throughput quotas.',
          description: `To protect the ecosystem from fraudulent impersonation and mass spam, Zenoa maintains strict separation between **Standard Business Accounts** and **Official Enterprise Verified Accounts**.

---

### 1. Standard Business vs. Verified Enterprise

| Attribute | Standard Business Account | Official Verified Enterprise |
| :--- | :--- | :--- |
| **Verification Badge** | None (Unverified Default) | **Official Green Checkmark (✓)** |
| **Chat Subtitle** | "Business Account" | **"Official Business"** |
| **Security Warning** | "Uses secure infrastructure" banner | Trusted Brand Header |
| **Default Throughput** | 500 requests / minute | **10,000+ msgs / second** (Dedicated) |
| **Media Attachments** | Up to 15MB | **Up to 100MB** |
| **Direct Directory Search** | Hidden unless searched by exact handle | **Top Global Discovery & Indexing** |

---

### 2. KYB (Know Your Business) Verification Checklist
Organizations requesting Official Verification must submit the following credentials via Developer Console:

1. **Certificate of Incorporation**: Valid government-issued business registration document (e.g. MCA/GST in India, Delaware/SEC in US, Companies House in UK).
2. **Domain Ownership (DNS TXT)**: A DNS TXT record placed at your root domain (e.g. \`zenoa-site-verification=app_${apiKey}\`).
3. **Authorized Representative ID**: Government photo ID of the legal director or designated corporate officer.
4. **Brand Trademarks**: Trademark registration certificate matching the requested handle and brand display name.

---

### 3. Verification Audit Process
- **Turnaround Time**: Standard compliance audits take **24 to 48 business hours**.
- **Post-Approval Privileges**: Upon approval, your green badge is activated instantly across the global network, and your API rate limit ceiling is escalated to Enterprise status.`,
          authRequired: false,
          rateLimit: 'N/A (Policy Specification)',
          cost: 'Free Documentation',
          headers: [],
          params: [],
          responseSuccess: `{
  "organization": "Acme Global Technologies Inc.",
  "kyb_status": "verified_enterprise",
  "badge": "green_checkmark",
  "assigned_handle": "@sa_acme_official",
  "audit_completed_at": "2026-04-12T10:00:00Z",
  "rate_limit_tier": "enterprise_unthrottled"
}`,
          snippets: {
            curl: `# Query Organization Verification Status
curl -X GET "${baseUrl}/api/v1/accounts/kyb/status?client_id=${apiKey}"`,
            node: `const axios = require('axios');

async function getVerificationStatus() {
  const res = await axios.get('${baseUrl}/api/v1/accounts/kyb/status?client_id=${apiKey}');
  console.log('KYB Status:', res.data.kyb_status);
}
getVerificationStatus();`,
            python: `import requests
res = requests.get("${baseUrl}/api/v1/accounts/kyb/status?client_id=${apiKey}")
print("KYB Status:", res.json())`,
            php: `<?php
$res = file_get_contents("${baseUrl}/api/v1/accounts/kyb/status?client_id=${apiKey}");
echo "KYB: " . $res;`,
            go: `resp, err := http.Get("${baseUrl}/api/v1/accounts/kyb/status?client_id=${apiKey}")`,
            java: `HttpRequest.newBuilder().uri(URI.create("${baseUrl}/api/v1/accounts/kyb/status?client_id=${apiKey}")).GET().build();`
          },
          notes: [
            'Official checkmarks are non-transferable and tied to your legal corporate entity.',
            'Any deceptive practice or unauthorized resale of accounts triggers immediate permanent revocation.'
          ]
        },
        {
          id: 'rate-limiting-spec',
          category: 'Getting Started',
          title: 'Rate Governance, RFC Headers & Quotas',
          method: 'GUIDE',
          path: '/docs/rate-limits',
          summary: 'Detailed specification of API rate limit tiers, RFC 6585 response headers, and resilient retry patterns.',
          description: `Zenoa employs dynamic token-bucket and leaky-bucket algorithms to ensure uninterrupted carrier service availability.

---

### 1. HTTP Response Headers
Every API response returns standard RFC rate governance headers:

| Header | Description | Example |
| :--- | :--- | :--- |
| \`X-RateLimit-Limit\` | Maximum allowable requests within the current 60s sliding window | \`1000\` |
| \`X-RateLimit-Remaining\` | Number of requests remaining in the active window | \`984\` |
| \`X-RateLimit-Reset\` | UTC Unix timestamp when the active rate quota resets | \`1726742400\` |
| \`Retry-After\` | Seconds to sleep before issuing the next attempt (only on 429) | \`12\` |

---

### 2. Handling HTTP 429 Too Many Requests
If an application exceeds its quota ceiling, Zenoa returns **HTTP 429**:

\`\`\`json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait 12 seconds before retrying.",
  "retry_after": 12
}
\`\`\`

---

### 3. Recommended Exponential Backoff Algorithm
When implementing automated bots or webhook listeners, implement exponential backoff with full jitter:

\`\`\`javascript
async function fetchWithRetry(url, options, maxRetries = 4) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
        const delay = (retryAfter * 1000) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
    }
  }
}
\`\`\``,
          authRequired: false,
          rateLimit: 'N/A (RFC Specification)',
          cost: 'Free Documentation',
          headers: [],
          params: [],
          responseSuccess: `{
  "current_tier": "pro_developer",
  "window_seconds": 60,
  "limit": 1000,
  "remaining": 984,
  "reset_at": 1726742400
}`,
          snippets: {
            curl: `# Check Rate Limit Status via HTTP Headers
curl -i -X GET "${baseUrl}/api/v1/billing/summary" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET"`,
            node: `// Inspect Rate Limit Headers
const axios = require('axios');

async function checkRateLimit() {
  const res = await axios.get('${baseUrl}/api/v1/billing/summary', {
    headers: { 'X-Client-Id': '${apiKey}', 'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET }
  });
  console.log('Remaining:', res.headers['x-ratelimit-remaining']);
  console.log('Reset Timestamp:', res.headers['x-ratelimit-reset']);
}
checkRateLimit();`,
            python: `import requests
res = requests.get("${baseUrl}/api/v1/billing/summary", headers={"X-Client-Id": "${apiKey}"})
print("Remaining:", res.headers.get("X-RateLimit-Remaining"))`,
            php: `// PHP inspect headers`,
            go: `// Go inspect response headers`,
            java: `// Java inspect response headers`
          },
          notes: [
            'API calls that return 4xx client errors (e.g. 400 Bad Request) still count against the sliding rate limit window.',
            'Health check endpoint (/api/health) is unmetered and exempt from rate limits.'
          ]
        }
      ]
    },
    {
      id: 'sso-oauth',
      name: 'OAuth 2.0 & Single Sign-On (SSO)',
      icon: 'Key',
      description: 'Universal Passport authentication, Authorization Code Flow with PKCE, JWT tokens, and user profile claims.',
      sections: [
        {
          id: 'oauth-overview',
          category: 'OAuth 2.0 & Single Sign-On (SSO)',
          title: 'SSO & OAuth 2.0 Integration Architecture',
          method: 'GUIDE',
          path: '/docs/sso/overview',
          summary: 'Connect your web and mobile applications with Zenoa Single Sign-On in under 5 minutes.',
          description: `Zenoa SSO implements RFC 6749 and OpenID Connect (OIDC) core specifications. By integrating Zenoa OAuth, your users can authenticate with 1-click biometric passkeys, verified email OTPs, or passwordless login.

### Key Benefits of Zenoa SSO:
- **Universal Passport**: Over thousands of active Zenoa users can instantly log into your application with zero signup friction.
- **Zero Auth Maintenance**: Zenoa takes care of password hashing, session revocation, token rotation, and 2FA compliance.
- **PKCE Security**: Full Proof Key for Code Exchange (RFC 7636) support for secure SPA (Single Page Apps) and mobile clients.
- **White-Label Email Relay**: Authentication codes and alerts are sent with your verified brand name and custom email address.

---

### Integration Protocol Workflow:

| Step | Endpoint | Action |
| :--- | :--- | :--- |
| **1. Authorize** | \`GET /api/sso/authorize\` | Redirect user to Zenoa Consent & Login Portal. |
| **2. Callback** | \`YOUR_REDIRECT_URI\` | Receive temporary one-time \`authorization_code\`. |
| **3. Token Exchange** | \`POST /api/sso/token\` | Exchange code for \`access_token\` and \`id_token\`. |
| **4. User Identity** | \`GET /api/sso/userinfo\` | Retrieve verified user profile, email, and metadata. |`,
          authRequired: false,
          rateLimit: 'Unlimited',
          cost: 'Free',
          headers: [],
          params: [],
          responseSuccess: `{
  "issuer": "${baseUrl}",
  "authorization_endpoint": "${baseUrl}/api/sso/authorize",
  "token_endpoint": "${baseUrl}/api/sso/token",
  "userinfo_endpoint": "${baseUrl}/api/sso/userinfo",
  "scopes_supported": ["openid", "profile", "email", "phone", "offline_access"]
}`,
          snippets: {
            curl: `# Step 1: Redirect User to Authorize Endpoint
https://${baseUrl.replace('https://', '').replace('http://', '')}/api/sso/authorize?client_id=${apiKey}&redirect_uri=https://yourdomain.com/callback&response_type=code&scope=openid%20profile%20email&state=xyz123`,
            node: `// Redirecting user in Express.js / Node.js
app.get('/login', (req, res) => {
  const authUrl = \`${baseUrl}/api/sso/authorize?\` + new URLSearchParams({
    client_id: process.env.ZENOA_CLIENT_ID,
    redirect_uri: 'https://yourdomain.com/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: 'secure_random_state'
  });
  res.redirect(authUrl);
});`,
            python: `# Python FastAPI / Flask Redirect
@app.get("/login")
def login():
    auth_url = f"${baseUrl}/api/sso/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=openid profile email"
    return RedirectResponse(url=auth_url)`,
            php: `// PHP Redirect to Zenoa SSO
$authUrl = "${baseUrl}/api/sso/authorize?" . http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => 'https://yourdomain.com/callback',
    'response_type' => 'code',
    'scope' => 'openid profile email'
]);
header('Location: ' . $authUrl);
exit;`,
            go: `// Go HTTP Handler
func handleLogin(w http.ResponseWriter, r *http.Request) {
    url := fmt.Sprintf("${baseUrl}/api/sso/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=openid profile email", clientId, redirectUri)
    http.Redirect(w, r, url, http.StatusFound)
}`,
            java: `// Java Spring Boot Redirect
@GetMapping("/login")
public RedirectView login() {
    String authUrl = "${baseUrl}/api/sso/authorize?client_id=" + clientId + "&redirect_uri=" + redirectUri + "&response_type=code&scope=openid profile email";
    return new RedirectView(authUrl);
}`
          },
          notes: [
            'Always generate a cryptographically random \`state\` parameter to protect against CSRF attacks.',
            'Redirect URIs must match the exact authorized domains registered in your Application Settings.'
          ]
        },
        {
          id: 'sso-token-exchange',
          category: 'OAuth 2.0 & Single Sign-On (SSO)',
          title: 'Exchange Authorization Code for Token',
          method: 'POST',
          path: '/api/sso/token',
          summary: 'Exchanges a temporary authorization code received at the callback for verified Access & ID Tokens.',
          description: `After the user completes authentication and approves permissions on the Zenoa Consent Screen, Zenoa redirects back to your \`redirect_uri\` with a \`code\` parameter.

Make a server-to-server \`POST\` request to this endpoint to receive the user's cryptographically signed JWT tokens.

### Token Expiry Standards:
- **Access Token**: Valid for 1 hour (3600 seconds).
- **ID Token**: Standard JWT containing OIDC claims signed with RS256 / HS256.
- **Refresh Token**: Valid for 30 days when \`offline_access\` scope is requested.`,
          authRequired: true,
          rateLimit: '300 req/min',
          cost: 'Free',
          headers: [
            { name: 'Content-Type', value: 'application/json', desc: 'JSON request payload', required: true }
          ],
          params: [
            { name: 'grant_type', type: 'string', required: true, desc: 'Must be "authorization_code" or "refresh_token".', default: 'authorization_code' },
            { name: 'client_id', type: 'string', required: true, desc: 'Your registered App Client ID.' },
            { name: 'client_secret', type: 'string', required: true, desc: 'Your registered App Client Secret (keep confidential on server).' },
            { name: 'code', type: 'string', required: true, desc: 'The authorization code received from callback URL.' },
            { name: 'redirect_uri', type: 'string', required: true, desc: 'Must match the redirect_uri used in authorize step.' }
          ],
          requestBodyExample: `{
  "grant_type": "authorization_code",
  "client_id": "${apiKey}",
  "client_secret": "${secretKey}",
  "code": "zen_code_9a8b7c6d5e4f3a2b1c",
  "redirect_uri": "https://yourdomain.com/callback"
}`,
          responseSuccess: `{
  "access_token": "zen_at_f9810a9c8b7123ef6543189abced214764839210fabc45781290384756bca910",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "zen_rt_1234567890abcdef1234567890abcdef",
  "scope": "openid profile email",
  "user": {
    "id": "usr_99812491",
    "name": "Alex Mercer",
    "email": "alex.mercer@gmail.com",
    "avatar_url": "https://api.zenoa.in/avatars/usr_99812491.png",
    "email_verified": true
  }
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/sso/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "${apiKey}",
    "client_secret": "${secretKey}",
    "code": "AUTHORIZATION_CODE_FROM_CALLBACK",
    "redirect_uri": "https://yourdomain.com/callback"
  }'`,
            node: `// Node.js Token Exchange
const axios = require('axios');

async function exchangeToken(code) {
  const res = await axios.post('${baseUrl}/api/sso/token', {
    grant_type: 'authorization_code',
    client_id: process.env.ZENOA_CLIENT_ID,
    client_secret: process.env.ZENOA_CLIENT_SECRET,
    code: code,
    redirect_uri: 'https://yourdomain.com/callback'
  });
  
  console.log('Logged in user:', res.data.user);
  return res.data;
}`,
            python: `# Python Token Exchange
import requests

def exchange_token(code):
    payload = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    res = requests.post("${baseUrl}/api/sso/token", json=payload)
    return res.json()`,
            php: `// PHP Token Exchange
$ch = curl_init('${baseUrl}/api/sso/token');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'grant_type' => 'authorization_code',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'code' => $code,
    'redirect_uri' => $redirectUri
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);`,
            go: `// Go Token Exchange
payload := map[string]string{
    "grant_type": "authorization_code",
    "client_id": clientId,
    "client_secret": clientSecret,
    "code": code,
    "redirect_uri": redirectUri,
}
jsonPayload, _ := json.Marshal(payload)
resp, err := http.Post("${baseUrl}/api/sso/token", "application/json", bytes.NewBuffer(jsonPayload))`,
            java: `// Java Token Exchange
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/api/sso/token"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
    .build();`
          },
          notes: [
            'Never expose \`client_secret\` on the client browser. Token exchange must always occur on your secure backend server.',
            'Authorization codes are strictly single-use and expire within 120 seconds of issuance.'
          ]
        },
        {
          id: 'sso-userinfo',
          category: 'OAuth 2.0 & Single Sign-On (SSO)',
          title: 'Get Authenticated User Profile (OIDC)',
          method: 'GET',
          path: '/api/sso/userinfo',
          summary: 'Fetches verified user identity, email, avatar, and permission claims using a valid Access Token.',
          description: `Returns standard OpenID Connect compliant identity claims for the authenticated user session. Requires the \`Authorization: Bearer <access_token>\` header.

### Returned Profile Claims:
- **sub / id**: Unique, immutable user identifier in the Zenoa Identity Network.
- **name**: Display name or registered full name.
- **email**: Primary verified email address.
- **email_verified**: Boolean indicating email cryptographic confirmation status.
- **phone**: Verified E.164 phone number (when \`phone\` scope is requested).
- **avatar_url**: High-resolution profile avatar.`,
          authRequired: true,
          rateLimit: '1,000 req/min',
          cost: 'Free',
          headers: [
            { name: 'Authorization', value: 'Bearer zen_at_...', desc: 'Bearer Access Token from /token endpoint', required: true }
          ],
          params: [],
          responseSuccess: `{
  "sub": "usr_99812491",
  "id": "usr_99812491",
  "name": "Alex Mercer",
  "email": "alex.mercer@gmail.com",
  "email_verified": true,
  "phone": "+919876543210",
  "phone_verified": true,
  "avatar_url": "https://api.zenoa.in/avatars/usr_99812491.png",
  "created_at": 1726000000,
  "app_metadata": {
    "role": "member",
    "tier": "standard"
  }
}`,
          snippets: {
            curl: `curl -X GET "${baseUrl}/api/sso/userinfo" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,
            node: `// Node.js Fetch User Info
const axios = require('axios');

async function getUserProfile(accessToken) {
  const res = await axios.get('${baseUrl}/api/sso/userinfo', {
    headers: {
      Authorization: \`Bearer \${accessToken}\`
    }
  });
  return res.data;
}`,
            python: `# Python Fetch User Info
import requests

def get_user_profile(access_token):
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get("${baseUrl}/api/sso/userinfo", headers=headers)
    return res.json()`,
            php: `// PHP Userinfo
$ch = curl_init('${baseUrl}/api/sso/userinfo');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$profile = json_decode(curl_exec($ch), true);
curl_close($ch);`,
            go: `// Go Userinfo
req, _ := http.NewRequest("GET", "${baseUrl}/api/sso/userinfo", nil)
req.Header.Set("Authorization", "Bearer "+accessToken)
resp, _ := http.DefaultClient.Do(req)`,
            java: `// Java Userinfo
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/api/sso/userinfo"))
    .header("Authorization", "Bearer " + accessToken)
    .GET()
    .build();`
          },
          notes: [
            'Cache user profile responses in Redis with a short TTL (e.g., 5 minutes) to minimize network roundtrips.',
            'If the access token expires (HTTP 401), use your \`refresh_token\` to obtain a fresh access token.'
          ]
        }
      ]
    },
    {
      id: 'security-passkeys',
      name: 'Passkeys & Session Security',
      icon: 'Shield',
      description: 'Passwordless WebAuthn biometrics (FaceID/TouchID), session governance, remote token revocation, and device auditing.',
      sections: [
        {
          id: 'passkeys-webauthn',
          category: 'Passkeys & Session Security',
          title: 'Passkeys & FIDO2 WebAuthn Architecture',
          method: 'GUIDE',
          path: '/docs/security/passkeys',
          summary: 'Phishing-resistant, passwordless authentication using on-device secure enclaves and hardware authenticators.',
          description: `Zenoa implements FIDO Alliance WebAuthn Level 3 specifications. Passkeys replace vulnerable shared secrets with public-key cryptography stored securely inside client device enclaves (Apple Secure Enclave, Android StrongBox, Windows Hello, YubiKey).

---

### 1. How Passkeys Work in Zenoa
1. **Public/Private Key Pair**: The user's biometric authenticator generates a cryptographic keypair locally on device.
2. **Private Key Never Leaves Device**: The private key is strictly isolated inside hardware silicon and never transmitted over the network.
3. **Public Key Registered**: The Zenoa Identity Network registers only the public key credential and credential ID.
4. **Challenge-Response Signature**: When authenticating, Zenoa issues a high-entropy 256-bit cryptographic challenge. The device signs it locally via biometric confirmation (FaceID / TouchID / PIN).

---

### 2. Browser & Platform Support
- **Apple iOS & macOS**: Safari, Chrome, Edge (Face ID, Touch ID, iCloud Keychain synchronization).
- **Android**: Chrome, Brave (Fingerprint, Face Unlock, Google Password Manager).
- **Windows**: Windows Hello (Facial recognition, Fingerprint sensor, TPM-backed PIN).
- **Hardware Keys**: FIDO2 USB-C / NFC Security Keys (YubiKey 5 Series, Google Titan).

---

### 3. Benefits for Developers & Users
- **100% Phishing Immune**: Passkey domain binding prevents malicious proxy domains and credential harvesting.
- **Zero SMS OTP Delivery Cost**: Zero latency, zero SMS carrier outages, and instant 1-touch sign-in.
- **Biometric Fraud Shield**: Eliminates password reuse, brute force, and credential stuffing attacks.`,
          authRequired: false,
          rateLimit: 'N/A (Cryptographic Specification)',
          cost: 'Free Feature',
          headers: [],
          params: [],
          responseSuccess: `{
  "passkey_support": "fido2_webauthn_l3",
  "authenticator_attachment": "platform_or_cross_platform",
  "resident_key": "required",
  "user_verification": "preferred",
  "rp_name": "Zenoa Identity Network",
  "rp_id": "zenoa.in"
}`,
          snippets: {
            curl: `# Query WebAuthn Registration Options
curl -X GET "${baseUrl}/api/auth/webauthn/register-options?user_id=usr_99812491"`,
            node: `// Client-side WebAuthn Registration
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: Uint8Array.from(challengeString, c => c.charCodeAt(0)),
    rp: { name: "Zenoa Identity", id: window.location.hostname },
    user: {
      id: Uint8Array.from(userId, c => c.charCodeAt(0)),
      name: userEmail,
      displayName: userName
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }]
  }
});`,
            python: `# Python verify WebAuthn signature
# Standard FIDO2 signature verification`,
            php: `// PHP WebAuthn verification`,
            go: `// Go WebAuthn verification`,
            java: `// Java WebAuthn verification`
          },
          notes: [
            'Passkeys are synced across user devices via Apple iCloud Keychain, Google Password Manager, or Microsoft Passkeys.',
            'Always provide Email OTP as a fallback authentication method for legacy devices without platform biometric authenticators.'
          ]
        },
        {
          id: 'session-governance',
          category: 'Passkeys & Session Security',
          title: 'Remote Session Revocation & Device Governance',
          method: 'POST',
          path: '/api/v1/sessions/revoke',
          summary: 'Remotely invalidate active refresh tokens, audit connected devices, and force global logout across all platforms.',
          description: `Enables enterprise developers and security operations teams to programmatically terminate compromised sessions, force password resets, or audit logged-in user devices.

---

### Key Capabilities:
- **Instant Token Invalidation**: Blacklists the target session ID in high-speed Redis caches, terminating active WebSocket and REST API access immediately.
- **Revoke All Devices**: Pass \`revoke_all: true\` to purge every active session belonging to a specific user (e.g. after a credential breach or lost phone).
- **Device Metadata Audit**: Returns hardware model, OS version, IP address, geolocation, and last active timestamp.`,
          authRequired: true,
          rateLimit: '120 req/min',
          cost: 'Free',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'Your App Client ID', required: true },
            { name: 'X-Client-Secret', value: 'YOUR_CLIENT_SECRET', desc: 'Your App Client Secret (Confidential)', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON request body', required: true }
          ],
          params: [
            { name: 'user_id', type: 'string', required: true, desc: 'Target user identifier (e.g. usr_99812491)' },
            { name: 'session_id', type: 'string', required: false, desc: 'Specific session token ID to terminate. Omit if revoke_all is true.' },
            { name: 'revoke_all', type: 'boolean', required: false, desc: 'If true, terminates all active sessions across all devices for this user.' }
          ],
          requestBodyExample: `{
  "user_id": "usr_99812491",
  "session_id": "sess_88319f2a7",
  "revoke_all": false
}`,
          responseSuccess: `{
  "success": true,
  "user_id": "usr_99812491",
  "revoked_sessions": 1,
  "revoked_at": 1726742400,
  "status": "terminated"
}`,
          responseError: `{
  "success": false,
  "error": "SESSION_NOT_FOUND",
  "message": "The specified session_id does not exist or has already expired.",
  "status": 404
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/sessions/revoke" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "usr_99812491",
    "session_id": "sess_88319f2a7"
  }'`,
            node: `const axios = require('axios');

async function revokeSession(userId, sessionId) {
  const res = await axios.post('${baseUrl}/api/v1/sessions/revoke', {
    user_id: userId,
    session_id: sessionId
  }, {
    headers: {
      'X-Client-Id': '${apiKey}',
      'X-Client-Secret': process.env.ZENOA_SA_CLIENT_SECRET,
      'Content-Type': 'application/json'
    }
  });
  console.log('Session Revoked:', res.data);
}
revokeSession('usr_99812491', 'sess_88319f2a7');`,
            python: `import requests
res = requests.post("${baseUrl}/api/v1/sessions/revoke", json={"user_id": "usr_99812491", "session_id": "sess_88319f2a7"}, headers={"X-Client-Id": "${apiKey}"})`,
            php: `// PHP Revoke Session`,
            go: `// Go Revoke Session`,
            java: `// Java Revoke Session`
          },
          notes: [
            'Revoking a session immediately severs real-time socket connections for that client.',
            'Logged out users receive an automated notification informing them their device session was terminated.'
          ]
        }
      ]
    },
    {
      id: 'email-notifications',
      name: 'Emails & Outbound Notifications',
      icon: 'Mail',
      description: 'Zero-config modern API keys (Resend, SendGrid, Postmark), Google Workspace/Zoho app passwords, and transactional dispatch APIs.',
      sections: [
        {
          id: 'email-overview',
          category: 'Emails & Outbound Notifications',
          title: 'Custom SMTP & API Key Relay Architecture',
          method: 'GUIDE',
          path: '/docs/emails/overview',
          summary: 'White-label email infrastructure for brand-aligned OTPs, receipts, and order notifications.',
          description: `Zenoa provides a dual-benefit communication engine:
1. **SSO Authentication Delivery**: Automatically dispatches 2FA passcodes, login alerts, and magic links from your own verified domain.
2. **Transactional Dispatch API**: Send order confirmations, receipts, invoices, and password resets to **any customer on your platform** with 1 API call.

---

### Supported Provider Archetypes:

| Category | Supported Providers | Required Input | Handshake Method |
| :--- | :--- | :--- | :--- |
| **Modern Developer APIs** | **Resend**, **SendGrid**, **Postmark**, **Brevo**, **Mailgun** | **API Key Only** (\`re_...\`, \`SG.xxx\`) | High-speed API Token Relay |
| **Business Mailboxes** | **Google Workspace / Gmail**, **Zoho Mail**, **Microsoft 365**, **AWS SES** | **App-Specific Password** | Port 465 Implicit SSL / 587 STARTTLS |
| **Self-Hosted SMTP** | Postfix, Exim, cPanel, Mailcow, Zimbra | Host, Port, Username, Password | Direct RFC SMTP Socket |

---

### Why Connect Your Own Provider?
- **100% Brand Trust**: End-users see your brand name (\`Acme Security <auth@acme.com>\`) rather than generic service addresses.
- **Zero Sending Costs on Zenoa**: All email volumes are processed through your provider quota with zero per-message markup.
- **High Inbox Placement**: Your emails leverage your verified SPF, DKIM, and DMARC domain reputation.`,
          authRequired: false,
          rateLimit: 'Unlimited',
          cost: 'Free',
          headers: [],
          params: [],
          responseSuccess: `{
  "dispatch_engine": "zenoa_universal_email_router",
  "supported_providers": ["resend", "sendgrid", "postmark", "brevo", "mailgun", "gmail", "zoho", "office365", "ses", "custom"],
  "features": ["zero_config_api_keys", "auto_ssl_failover", "live_socket_diagnostics", "variable_templating"]
}`,
          snippets: {
            curl: `# Configure your SMTP / API Key in Developer Console under "Emails & SMTP" tab.
# Once configured, dispatch transactional messages instantly.`,
            node: `// Zero setup needed in your app code!
// Configure your API key once in Zenoa Console, then use /api/v1/notify/send`,
            python: `# Once configured in the console, your SSO emails dispatch automatically.`,
            php: `// Zero configuration required in code`,
            go: `// Handled automatically by Zenoa`,
            java: `// Configured in Zenoa Developer Portal`
          },
          notes: [
            'Test your credentials with the "Test Dispatch" button in the Emails & SMTP tab to verify live socket handshakes.',
            'For Gmail/Google Workspace accounts, generate a 16-character App Password at myaccount.google.com/apppasswords.'
          ]
        },
        {
          id: 'email-send-api',
          category: 'Emails & Outbound Notifications',
          title: 'Send Transactional Email Notification',
          method: 'POST',
          path: '/api/v1/notify/send',
          summary: 'Dispatches a branded transactional notification or custom email to any recipient using your configured email provider.',
          description: `Dispatches an instant email to any user email address. The message is automatically formatted using Zenoa's high-contrast, responsive email template engine, or rendered with your custom HTML/text payload.

### Dynamic Template Variables:
Use double braces in your templates:
- \`{{user_name}}\`: Recipient's full name.
- \`{{otp_code}}\`: 6-digit numeric verification code (if auth type).
- \`{{action_url}}\`: Deep-link button action URL.
- \`{{brand_name}}\`: Your application display name.`,
          authRequired: true,
          rateLimit: '120 req/min',
          cost: 'Free (Uses your configured provider quota)',
          headers: [
            { name: 'X-Client-Id', value: apiKey, desc: 'App Client ID', required: true },
            { name: 'X-Client-Secret', value: secretKey, desc: 'App Client Secret', required: true },
            { name: 'Content-Type', value: 'application/json', desc: 'JSON request payload', required: true }
          ],
          params: [
            { name: 'to', type: 'string', required: true, desc: 'Recipient email address (e.g. customer@gmail.com).' },
            { name: 'subject', type: 'string', required: true, desc: 'Subject line of the email.' },
            { name: 'template', type: 'string', required: false, desc: 'Template type: "order_receipt", "security_alert", "welcome", "custom".', default: 'custom' },
            { name: 'body_html', type: 'string', required: false, desc: 'Raw custom HTML content (optional).' },
            { name: 'body_text', type: 'string', required: false, desc: 'Fallback plaintext content.' },
            { name: 'data', type: 'object', required: false, desc: 'Key-value data dictionary for dynamic template variable replacement.' }
          ],
          requestBodyExample: `{
  "to": "customer@example.com",
  "subject": "Order #4092 Confirmed! - Acme Store",
  "template": "order_receipt",
  "data": {
    "user_name": "Rahul Verma",
    "order_id": "#4092",
    "total_amount": "₹1,499",
    "item_count": "2 items",
    "action_url": "https://acme.com/orders/4092"
  }
}`,
          responseSuccess: `{
  "success": true,
  "message_id": "msg_9981290384756",
  "provider_used": "resend",
  "recipient": "customer@example.com",
  "dispatched_at": 1726000000,
  "latency_ms": 184
}`,
          snippets: {
            curl: `curl -X POST "${baseUrl}/api/v1/notify/send" \\
  -H "X-Client-Id: ${apiKey}" \\
  -H "X-Client-Secret: ${secretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "customer@example.com",
    "subject": "Security Alert: New Sign-in Detected",
    "template": "security_alert",
    "data": {
      "user_name": "Rahul",
      "device": "Chrome on macOS",
      "location": "Mumbai, India",
      "action_url": "https://acme.com/security"
    }
  }'`,
            node: `// Node.js Dispatch Transactional Notification
const axios = require('axios');

async function sendOrderAlert(customerEmail, orderData) {
  const res = await axios.post('${baseUrl}/api/v1/notify/send', {
    to: customerEmail,
    subject: \`Order \${orderData.id} Confirmed!\`,
    template: 'order_receipt',
    data: {
      user_name: orderData.customerName,
      total_amount: orderData.total,
      action_url: \`https://acme.com/orders/\${orderData.id}\`
    }
  }, {
    headers: {
      'X-Client-Id': process.env.ZENOA_CLIENT_ID,
      'X-Client-Secret': process.env.ZENOA_CLIENT_SECRET,
      'Content-Type': 'application/json'
    }
  });

  console.log('Dispatch status:', res.data);
}`,
            python: `# Python Dispatch Transactional Alert
import requests

def send_alert(to_email, subject, data):
    headers = {
        "X-Client-Id": CLIENT_ID,
        "X-Client-Secret": CLIENT_SECRET,
        "Content-Type": "application/json"
    }
    payload = {
        "to": to_email,
        "subject": subject,
        "template": "order_receipt",
        "data": data
    }
    res = requests.post("${baseUrl}/api/v1/notify/send", json=payload, headers=headers)
    return res.json()`,
            php: `// PHP Send Transactional Email
$payload = [
    'to' => 'customer@example.com',
    'subject' => 'Invoice #1024 Paid',
    'template' => 'order_receipt',
    'data' => ['user_name' => 'Rahul', 'total_amount' => '₹2,500']
];
$ch = curl_init('${baseUrl}/api/v1/notify/send');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-Client-Id: ' . $clientId,
    'X-Client-Secret: ' . $clientSecret,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = json_decode(curl_exec($ch), true);
curl_close($ch);`,
            go: `// Go Transactional Email Dispatch
payload := map[string]interface{}{
    "to": "customer@example.com",
    "subject": "Order Confirmed",
    "template": "order_receipt",
    "data": map[string]string{"user_name": "Rahul"},
}
jsonPayload, _ := json.Marshal(payload)
req, _ := http.NewRequest("POST", "${baseUrl}/api/v1/notify/send", bytes.NewBuffer(jsonPayload))
req.Header.Set("X-Client-Id", clientId)
req.Header.Set("X-Client-Secret", clientSecret)
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)`,
            java: `// Java Transactional Email Dispatch
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/api/v1/notify/send"))
    .header("X-Client-Id", clientId)
    .header("X-Client-Secret", clientSecret)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
    .build();`
          },
          notes: [
            'All emails are dispatched through your configured email provider with 100% white-label sender headers.',
            'If no custom email provider is configured, the system falls back to Zenoa standard managed relay.'
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
  "documentation_url": "https://zenoa.in/docs/errors#MACHINE_READABLE_CODE"
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
