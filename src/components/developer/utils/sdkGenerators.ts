/**
 * Production-ready SDK Generators for Zenoa Developer Console (Service Accounts & Bot APIs)
 * 
 * SECURITY MANDATE:
 * Developer Console Service Account APIs strictly require BOTH Client ID and Client Secret
 * for all operations (OTP dispatch, OTP verification, bot DM transmission, etc.).
 * Confidential Client Secrets are strictly loaded via ZENOA_SA_CLIENT_SECRET.
 * Developer Console and SSO Console are completely decoupled flagship services.
 */

const resolveBotHandle = (app: any): string => {
  const handle = app?.bot_username || app?.bot_handle || app?.owner_username || app?.owner || 'service_account';
  const clean = String(handle).replace(/^@/, '').trim();
  return `@${clean}`;
};

export const generateTsSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `/**
 * Zenoa Service Account TypeScript SDK
 * Flagship: Developer Console (Service Accounts & Secure Gateway)
 * Service Account: ${botHandle} (${appName})
 *
 * DUAL CREDENTIAL SECURITY ENFORCEMENT:
 * All programmatic service account actions strictly require BOTH ZENOA_SA_CLIENT_ID
 * and ZENOA_SA_CLIENT_SECRET. Neither OTP dispatch nor bot messaging will execute
 * without verified client secret authentication.
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
    this.clientId = config?.clientId || (typeof process !== 'undefined' && process.env?.ZENOA_SA_CLIENT_ID) || "${cid}";
    this.clientSecret = config?.clientSecret || (typeof process !== 'undefined' && process.env?.ZENOA_SA_CLIENT_SECRET) || "";
    this.baseUrl = (config?.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      "X-Client-Id": this.clientId,
      "X-Client-Secret": this.clientSecret,
      "Authorization": "Basic " + (typeof Buffer !== 'undefined' 
        ? Buffer.from(\`\${this.clientId}:\${this.clientSecret}\`).toString('base64')
        : (typeof btoa !== 'undefined' ? btoa(\`\${this.clientId}:\${this.clientSecret}\`) : '')),
      "Content-Type": "application/json"
    };
  }

  /**
   * Dispatches an OTP directly from your registered service account (${botHandle}).
   * Strictly requires both Client ID and Client Secret.
   */
  async sendOtp(options: SendOtpOptions | string, templateType = "standard_otp", expiryMins = 10) {
    if (!this.clientSecret) {
      throw new Error("[ZenoaSDK] Security Exception: ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly mandatory for OTP dispatch.");
    }

    const payload = typeof options === 'string' 
      ? { 
          client_id: this.clientId,
          client_secret: this.clientSecret,
          recipient: options, 
          template_type: templateType, 
          expiry_mins: expiryMins 
        }
      : { 
          client_id: this.clientId,
          client_secret: this.clientSecret,
          recipient: options.recipient, 
          template_type: options.templateType || templateType, 
          custom_code: options.customCode,
          custom_message: options.customMessage,
          expiry_mins: options.expiryMins || expiryMins 
        };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Cryptographically validates an OTP provided by the user.
   * Strictly requires both Client ID and Client Secret.
   */
  async verifyOtp(recipientOrOptions: string | VerifyOtpOptions, code?: string) {
    if (!this.clientSecret) {
      throw new Error("[ZenoaSDK] Security Exception: ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly mandatory for OTP verification.");
    }

    const payload = typeof recipientOrOptions === 'string'
      ? { client_id: this.clientId, client_secret: this.clientSecret, recipient: recipientOrOptions, code: code || '' }
      : { client_id: this.clientId, client_secret: this.clientSecret, recipient: recipientOrOptions.recipient, code: recipientOrOptions.code };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  /**
   * Sends an automated service account message or transaction notification.
   * Strictly requires both Client ID and Client Secret.
   */
  async sendMessage(recipient: string, message: string, mediaUrl?: string) {
    if (!this.clientSecret) {
      throw new Error("[ZenoaSDK] Security Exception: ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly mandatory for message transmission.");
    }

    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `/**
 * Zenoa Node.js SDK (CommonJS / ES Module)
 * Flagship: Developer Console (Service Accounts & Secure Gateway)
 * Service Account: ${botHandle} (${appName})
 *
 * Load your credentials securely via:
 * process.env.ZENOA_SA_CLIENT_ID
 * process.env.ZENOA_SA_CLIENT_SECRET
 */

class ZenoaSDK {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.ZENOA_SA_CLIENT_ID || "${cid}";
    this.clientSecret = config.clientSecret || process.env.ZENOA_SA_CLIENT_SECRET || "";
    this.baseUrl = (config.baseUrl || "${origin}").replace(/\\/$/, '');
  }

  _getHeaders() {
    return {
      "X-Client-Id": this.clientId,
      "X-Client-Secret": this.clientSecret,
      "Authorization": "Basic " + Buffer.from(\`\${this.clientId}:\${this.clientSecret}\`).toString('base64'),
      "Content-Type": "application/json"
    };
  }

  async sendOtp(recipient, templateType = "standard_otp", expiryMins = 10) {
    if (!this.clientSecret) {
      throw new Error("[ZenoaSDK] ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly required.");
    }
    const payload = typeof recipient === 'object' 
      ? { ...recipient, client_id: this.clientId, client_secret: this.clientSecret }
      : { client_id: this.clientId, client_secret: this.clientSecret, recipient, template_type: templateType, expiry_mins: expiryMins };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/send\`, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async verifyOtp(recipient, code) {
    if (!this.clientSecret) {
      throw new Error("[ZenoaSDK] ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly required.");
    }
    const payload = typeof recipient === 'object'
      ? { ...recipient, client_id: this.clientId, client_secret: this.clientSecret }
      : { client_id: this.clientId, client_secret: this.clientSecret, recipient, code };

    const res = await fetch(\`\${this.baseUrl}/api/v1/otp/verify\`, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async sendMessage(recipient, message, mediaUrl = null) {
    if (!this.clientSecret) {
      throw new Error("[ZenoaSDK] ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly required.");
    }
    const res = await fetch(\`\${this.baseUrl}/api/v1/bot/send\`, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify({ 
        client_id: this.clientId, 
        client_secret: this.clientSecret, 
        recipient, 
        message, 
        media_url: mediaUrl 
      })
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `"""
Zenoa Python SDK for ${appName}
Flagship: Developer Console (Service Accounts & Secure Gateway)
Service Account: ${botHandle}

SECURITY REQUIREMENT:
Programmatic actions strictly require BOTH ZENOA_SA_CLIENT_ID and ZENOA_SA_CLIENT_SECRET.
export ZENOA_SA_CLIENT_ID="${cid}"
export ZENOA_SA_CLIENT_SECRET="your_copied_secret_here"
"""

import os
import requests
import base64
from typing import Optional, Dict, Any

class ZenoaSDK:
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None, base_url: str = "${origin}"):
        self.client_id = client_id or os.environ.get("ZENOA_SA_CLIENT_ID", "${cid}")
        self.client_secret = client_secret or os.environ.get("ZENOA_SA_CLIENT_SECRET", "")
        self.base_url = base_url.rstrip("/")

    def _headers(self) -> Dict[str, str]:
        auth_str = f"{self.client_id}:{self.client_secret}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()
        return {
            "X-Client-Id": self.client_id,
            "X-Client-Secret": self.client_secret,
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/json"
        }

    def send_otp(self, recipient: str, template_type: str = "standard_otp", expiry_mins: int = 10) -> Dict[str, Any]:
        """Dispatches an OTP passcode. Strictly requires both client_id and client_secret."""
        if not self.client_secret:
            raise ValueError("[ZenoaSDK] ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are required.")
        url = f"{self.base_url}/api/v1/otp/send"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "recipient": recipient,
            "template_type": template_type,
            "expiry_mins": expiry_mins
        }
        response = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        return response.json()

    def verify_otp(self, recipient: str, code: str) -> Dict[str, Any]:
        """Validates a user-supplied OTP passcode. Strictly requires both client_id and client_secret."""
        if not self.client_secret:
            raise ValueError("[ZenoaSDK] ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are required.")
        url = f"{self.base_url}/api/v1/otp/verify"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "recipient": recipient,
            "code": code
        }
        response = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        return response.json()

    def send_message(self, recipient: str, message: str, media_url: Optional[str] = None) -> Dict[str, Any]:
        """Sends a notification or service account message. Strictly requires both client_id and client_secret."""
        if not self.client_secret:
            raise ValueError("[ZenoaSDK] ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are required.")
        url = f"{self.base_url}/api/v1/bot/send"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "recipient": recipient,
            "message": message,
            "media_url": media_url
        }
        response = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        return response.json()
`;
};

export const generateGoSdk = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `// Package zenoa provides Go bindings for Zenoa Service Account APIs
// Flagship: Developer Console (Service Accounts & Secure Gateway)
// Service Account: ${botHandle} (${appName})
package zenoa

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"time"
)

type Client struct {
	ClientID     string
	ClientSecret string
	BaseURL      string
	HTTPClient   *http.Client
}

func NewClient() *Client {
	clientID := os.Getenv("ZENOA_SA_CLIENT_ID")
	if clientID == "" {
		clientID = "${cid}"
	}
	clientSecret := os.Getenv("ZENOA_SA_CLIENT_SECRET")

	return &Client{
		ClientID:     clientID,
		ClientSecret: clientSecret,
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
	if c.ClientSecret == "" {
		return nil, errors.New("ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly required")
	}

	payload := map[string]interface{}{
		"client_id":     c.ClientID,
		"client_secret": c.ClientSecret,
		"recipient":     recipient,
		"template_type": templateType,
		"expiry_mins":   10,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", c.BaseURL+"/api/v1/otp/send", bytes.NewBuffer(body))

	authHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte(c.ClientID+":"+c.ClientSecret))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("X-Client-Id", c.ClientID)
	req.Header.Set("X-Client-Secret", c.ClientSecret)
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `<?php
/**
 * Zenoa Service Account PHP SDK
 * Flagship: Developer Console (Service Accounts & Secure Gateway)
 * Service Account: ${botHandle} (${appName})
 */

class ZenoaSDK {
    private $clientId;
    private $clientSecret;
    private $baseUrl;

    public function __construct($clientId = null, $clientSecret = null, $baseUrl = "${origin}") {
        $this->clientId = $clientId ?? (getenv('ZENOA_SA_CLIENT_ID') ?: "${cid}");
        $this->clientSecret = $clientSecret ?? (getenv('ZENOA_SA_CLIENT_SECRET') ?: '');
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    public function sendOtp($recipient, $templateType = "standard_otp", $expiryMins = 10) {
        if (empty($this->clientSecret)) {
            throw new Exception("ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly required.");
        }

        $url = $this->baseUrl . "/api/v1/otp/send";
        $data = json_encode([
            "client_id" => $this->clientId,
            "client_secret" => $this->clientSecret,
            "recipient" => $recipient,
            "template_type" => $templateType,
            "expiry_mins" => $expiryMins
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "X-Client-Id: " . $this->clientId,
            "X-Client-Secret: " . $this->clientSecret,
            "Authorization: Basic " . base64_encode($this->clientId . ":" . $this->clientSecret),
            "Content-Type: application/json"
        ]);

        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    public function verifyOtp($recipient, $code) {
        if (empty($this->clientSecret)) {
            throw new Exception("ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are strictly required.");
        }

        $url = $this->baseUrl . "/api/v1/otp/verify";
        $data = json_encode([
            "client_id" => $this->clientId,
            "client_secret" => $this->clientSecret,
            "recipient" => $recipient,
            "code" => $code
        ]);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "X-Client-Id: " . $this->clientId,
            "X-Client-Secret: " . $this->clientSecret,
            "Authorization: Basic " . base64_encode($this->clientId . ":" . $this->clientSecret),
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `/**
 * Zenoa Service Account Java SDK (Java 11+)
 * Flagship: Developer Console (Service Accounts & Secure Gateway)
 * Service Account: ${botHandle} (${appName})
 */

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;

public class ZenoaSDK {
    private final String clientId;
    private final String clientSecret;
    private final String baseUrl;
    private final HttpClient client;

    public ZenoaSDK() {
        this(
            System.getenv("ZENOA_SA_CLIENT_ID") != null ? System.getenv("ZENOA_SA_CLIENT_ID") : "${cid}",
            System.getenv("ZENOA_SA_CLIENT_SECRET") != null ? System.getenv("ZENOA_SA_CLIENT_SECRET") : "",
            "${origin}"
        );
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
        if (clientSecret == null || clientSecret.isEmpty()) {
            throw new IllegalStateException("ZENOA_SA_CLIENT_SECRET is missing. Both client_id and client_secret are required.");
        }

        String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());
        String json = String.format("{\\"client_id\\":\\"%s\\",\\"client_secret\\":\\"%s\\",\\"recipient\\":\\"%s\\",\\"template_type\\":\\"%s\\",\\"expiry_mins\\":10}", clientId, clientSecret, recipient, templateType);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/otp/send"))
                .header("X-Client-Id", clientId)
                .header("X-Client-Secret", clientSecret)
                .header("Authorization", "Basic " + auth)
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';

  return `# ==============================================================================
# Zenoa Service Account (Developer Console) Configuration
# Service Account Name: ${appName}
# Service Account Handle: ${botHandle}
#
# DUAL CREDENTIAL SECURITY REQUIREMENT:
# Both ZENOA_SA_CLIENT_ID and ZENOA_SA_CLIENT_SECRET are mandatory.
# Neither OTP dispatch nor bot messaging will execute without both credentials.
# ==============================================================================
ZENOA_SA_SERVICE_ACCOUNT_NAME="${appName}"
ZENOA_SA_SERVICE_ACCOUNT_HANDLE="${botHandle}"
ZENOA_SA_CLIENT_ID="${cid}"

# Paste your copied Service Account Client Secret below (Keep this confidential & never commit to Git):
ZENOA_SA_CLIENT_SECRET="YOUR_SA_CLIENT_SECRET_HERE"

# Endpoints
ZENOA_BASE_URL="${origin}"
ZENOA_OTP_SEND_URL="${origin}/api/v1/otp/send"
ZENOA_OTP_VERIFY_URL="${origin}/api/v1/otp/verify"
ZENOA_BOT_SEND_URL="${origin}/api/v1/bot/send"`;
};

export const generateCurlSnippets = (app: any) => {
  if (!app) return '';
  const cid = app.active_client_id || app.client_id || app.api_key || 'zen_client_prod';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  return `# Ensure both variables are exported on your secure backend:
export ZENOA_SA_CLIENT_ID="${cid}"
export ZENOA_SA_CLIENT_SECRET="your_secret_here"

# 1. Send OTP Request (Requires BOTH Client ID & Client Secret)
curl -X POST "${origin}/api/v1/otp/send" \\
  -H "X-Client-Id: $ZENOA_SA_CLIENT_ID" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "'"$ZENOA_SA_CLIENT_ID"'",
    "client_secret": "'"$ZENOA_SA_CLIENT_SECRET"'",
    "recipient": "+919876543210", 
    "template_type": "standard_otp"
  }'

# 2. Verify OTP Request (Requires BOTH Client ID & Client Secret)
curl -X POST "${origin}/api/v1/otp/verify" \\
  -H "X-Client-Id: $ZENOA_SA_CLIENT_ID" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "'"$ZENOA_SA_CLIENT_ID"'",
    "client_secret": "'"$ZENOA_SA_CLIENT_SECRET"'",
    "recipient": "+919876543210", 
    "code": "481920"
  }'

# 3. Send Bot DM Message Request (Requires BOTH Client ID & Client Secret)
curl -X POST "${origin}/api/v1/bot/send" \\
  -H "X-Client-Id: $ZENOA_SA_CLIENT_ID" \\
  -H "X-Client-Secret: $ZENOA_SA_CLIENT_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "'"$ZENOA_SA_CLIENT_ID"'",
    "client_secret": "'"$ZENOA_SA_CLIENT_SECRET"'",
    "recipient": "john_doe", 
    "message": "Order confirmed!"
  }'`;
};

export const generateHtmlSnippet = (app: any) => {
  if (!app) return '';
  const botHandle = resolveBotHandle(app);
  const appName = app.app_name || 'Service Account';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developer.zenoa.sbs';
  return `<a href="${origin}/@${botHandle.replace(/^@/, '')}" target="_blank" rel="noopener noreferrer">Contact ${appName} (${botHandle})</a>`;
};
