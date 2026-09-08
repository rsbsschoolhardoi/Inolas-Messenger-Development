/**
 * Production-ready SDK Generators for Zenoa Developer Console (Service Accounts & Bot APIs)
 * Service Account Credentials & Endpoints are embedded for Developer Console services.
 * Note: SSO / OAuth 2.0 Identity code is managed separately in the SSO Portal.
 */

const resolveBotHandle = (app: any): string => {
  const handle = app?.bot_username || app?.bot_handle || app?.owner_username || app?.owner || 'service_account';
  const clean = String(handle).replace(/^@/, '').trim();
  return `@${clean}`;
};

export const generateTsSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `/**
 * Zenoa Service Account TypeScript SDK
 * Service Account: ${botHandle} (${appName})
 * Pre-Configured with Encrypted Client Credentials
 */

export interface ZenoaConfig {
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface SendOtpOptions {
  recipient: string;
  templateType?: 'standard_otp' | '2fa_auth' | 'password_reset' | 'transaction_auth' | string;
  customCode?: string;
  customMessage?: string;
  expiryMins?: number;
}

export interface VerifyOtpOptions {
  recipient: string;
  code: string;
}

export class ZenoaSDK {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;

  constructor(config?: ZenoaConfig) {
    this.clientId = config?.clientId || "${cid}";
    this.clientSecret = config?.clientSecret || "${sec}";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  /**
   * Dispatches an OTP directly from your registered service account (${botHandle})
   */
  async sendOtp(options: SendOtpOptions | string, templateType = "standard_otp", expiryMins = 10) {
    const payload = typeof options === 'string' 
      ? { recipient: options, template_type: templateType, expiry_mins: expiryMins }
      : { 
          recipient: options.recipient, 
          template_type: options.templateType || templateType, 
          custom_code: options.customCode,
          custom_message: options.customMessage,
          expiry_mins: options.expiryMins || expiryMins 
        };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "X-API-Key": this.clientId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Cryptographically validates an OTP provided by the user
   */
  async verifyOtp(recipientOrOptions: string | VerifyOtpOptions, code?: string) {
    const payload = typeof recipientOrOptions === 'string'
      ? { recipient: recipientOrOptions, code: code || '' }
      : { recipient: recipientOrOptions.recipient, code: recipientOrOptions.code };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "X-API-Key": this.clientId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Sends an automated service account message or transaction notification
   */
  async sendMessage(recipient: string, message: string, mediaUrl?: string) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientSecret}\`,
        "X-API-Key": this.clientId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: this.clientId,
        recipient,
        message,
        media_url: mediaUrl
      })
    });
    return await res.json();
  }
}

export default ZenoaSDK;
`;
};

export const generateNodeSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `/**
 * Zenoa Node.js SDK (CommonJS / ES Module)
 * Service Account: ${botHandle} (${appName})
 */

class ZenoaSDK {
  constructor(config = {}) {
    this.clientId = config.clientId || "${cid}";
    this.clientSecret = config.clientSecret || "${sec}";
    this.baseUrl = (config.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  async sendOtp(recipient, templateType = "standard_otp", expiryMins = 10) {
    const payload = typeof recipient === 'object' ? recipient : { recipient, template_type: templateType, expiry_mins: expiryMins };
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async verifyOtp(recipient, code) {
    const payload = typeof recipient === 'object' ? recipient : { recipient, code };
    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientId}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async sendMessage(recipient, message, mediaUrl = null) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.clientSecret}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ client_id: this.clientId, recipient, message, media_url: mediaUrl })
    });
    return await res.json();
  }
}

module.exports = ZenoaSDK;
`;
};

export const generatePythonSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `"""
Zenoa Python SDK for ${appName}
Service Account: ${botHandle}
Pre-configured with credentials
"""

import requests
from typing import Optional, Dict, Any

class ZenoaSDK:
    def __init__(self, client_id: str = "${cid}", client_secret: str = "${sec}", base_url: str = "${origin}"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url.rstrip("/")

    def send_otp(self, recipient: str, template_type: str = "standard_otp", expiry_mins: int = 10) -> Dict[str, Any]:
        """Dispatches an OTP passcode directly to the recipient."""
        url = f"{self.base_url}/api/v1/otp/send"
        headers = {
            "Authorization": f"Bearer {self.client_id}",
            "Content-Type": "application/json"
        }
        payload = {
            "recipient": recipient,
            "template_type": template_type,
            "expiry_mins": expiry_mins
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.json()

    def verify_otp(self, recipient: str, code: str) -> Dict[str, Any]:
        """Validates a user-supplied OTP passcode."""
        url = f"{self.base_url}/api/v1/otp/verify"
        headers = {
            "Authorization": f"Bearer {self.client_id}",
            "Content-Type": "application/json"
        }
        payload = {
            "recipient": recipient,
            "code": code
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.json()

    def send_message(self, recipient: str, message: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        """Sends a notification or service account message."""
        url = f"{self.base_url}/api/v1/bot/send"
        headers = {
            "Authorization": f"Bearer {self.client_secret}",
            "Content-Type": "application/json"
        }
        payload = {
            "client_id": self.client_id,
            "recipient": recipient,
            "message": message,
            "media_url": media_url
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.json()
`;
};

export const generateGoSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `// Package zenoa provides Go bindings for Zenoa Service Account APIs
// Service Account: ${botHandle} (${appName})
package zenoa

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"
)

type Client struct {
	ClientID     string
	ClientSecret string
	BaseURL      string
	HTTPClient   *http.Client
}

func NewClient() *Client {
	return &Client{
		ClientID:     "${cid}",
		ClientSecret: "${sec}",
		BaseURL:      "${origin}",
		HTTPClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

type OTPResponse struct {
	Success bool   \`json:"success"\`
	Message string \`json:"message"\`
	Status  string \`json:"status"\`
}

func (c *Client) SendOTP(recipient, templateType string) (*OTPResponse, error) {
	payload := map[string]interface{}{
		"recipient":     recipient,
		"template_type": templateType,
		"expiry_mins":   10,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", c.BaseURL+"/api/v1/otp/send", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+c.ClientID)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var out OTPResponse
	json.Unmarshal(respBody, &out)
	return &out, nil
}
`;
};

export const generatePhpSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `<?php
/**
 * Zenoa Service Account PHP SDK
 * Service Account: ${botHandle} (${appName})
 */

class ZenoaSDK {
    private $clientId;
    private $clientSecret;
    private $baseUrl;

    public function __construct($clientId = "${cid}", $clientSecret = "${sec}", $baseUrl = "${origin}") {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    public function sendOtp($recipient, $templateType = "standard_otp", $expiryMins = 10) {
        $url = $this->baseUrl . "/api/v1/otp/send";
        $data = json_encode([
            "recipient" => $recipient,
            "template_type" => $templateType,
            "expiry_mins" => $expiryMins
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->clientId,
            "Content-Type: application/json"
        ]);

        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    public function verifyOtp($recipient, $code) {
        $url = $this->baseUrl . "/api/v1/otp/verify";
        $data = json_encode([
            "recipient" => $recipient,
            "code" => $code
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $this->clientId,
            "Content-Type: application/json"
        ]);

        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}
?>`;
};

export const generateJavaSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `/**
 * Zenoa Service Account Java SDK (Java 11+)
 * Service Account: ${botHandle} (${appName})
 */

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ZenoaSDK {
    private final String clientId;
    private final String clientSecret;
    private final String baseUrl;
    private final HttpClient client;

    public ZenoaSDK() {
        this("${cid}", "${sec}", "${origin}");
    }

    public ZenoaSDK(String clientId, String clientSecret, String baseUrl) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.baseUrl = baseUrl.replaceAll("/$", "");
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String sendOtp(String recipient, String templateType) throws Exception {
        String json = String.format("{\\"recipient\\":\\"%s\\",\\"template_type\\":\\"%s\\",\\"expiry_mins\\":10}", recipient, templateType);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/otp/send"))
                .header("Authorization", "Bearer " + clientId)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
`;
};

export const generateEnvConfig = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `# Service Account Configuration for ${appName}
# Service Account Name: ${appName}
# Service Account Handle: ${botHandle}
ZENOA_SERVICE_ACCOUNT_NAME="${appName}"
ZENOA_SERVICE_ACCOUNT_HANDLE="${botHandle}"
ZENOA_CLIENT_ID="${cid}"
ZENOA_CLIENT_SECRET="${sec}"
ZENOA_BASE_URL="${origin}"
ZENOA_OTP_SEND_URL="${origin}/api/v1/otp/send"
ZENOA_OTP_VERIFY_URL="${origin}/api/v1/otp/verify"
ZENOA_BOT_SEND_URL="${origin}/api/v1/bot/send"`;
};

export const generateCurlSnippets = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const sec = app.active_client_secret || app.client_secret || 'zen_sec_secret';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  return `# 1. Send OTP Request
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+919876543210", "template_type": "standard_otp"}'

# 2. Verify OTP Request
curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer ${cid}" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+919876543210", "code": "481920"}'

# 3. Send Bot DM Message Request
curl -X POST "${origin}/api/v1/bot/send" \\
  -H "Authorization: Bearer ${sec}" \\
  -H "Content-Type: application/json" \\
  -d '{"client_id": "${cid}", "recipient": "john_doe", "message": "Order confirmed!"}'`;
};

export const generateHtmlSnippet = (app: any) => {
  if (!app) return '';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  return `<a href="${origin}/@${botHandle.replace(/^@/, '')}" target="_blank" rel="noopener noreferrer">Contact ${appName} (${botHandle})</a>`;
};
