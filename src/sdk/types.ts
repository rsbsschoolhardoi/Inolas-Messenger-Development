/**
 * @zenoa/sdk - Official TypeScript SDK for Zenoa Developer Platform & OAuth 2.0
 * Production Target: https://zenoa-inolas.vercel.app
 */

export interface ZenoaClientConfig {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  baseUrl?: string;
  environment?: 'production' | 'sandbox';
  timeoutMs?: number;
}

export interface ZenoaAuthUrlOptions {
  clientId?: string;
  redirectUri: string;
  scopes?: ('openid' | 'profile' | 'email' | 'phone' | 'offline_access' | string)[];
  state?: string;
  responseType?: 'code' | 'token';
}

export interface ZenoaTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

export interface ZenoaUserProfile {
  sub: string;
  username: string;
  name: string;
  email?: string;
  email_verified?: boolean;
  phone?: string;
  phone_verified?: boolean;
  avatar_url?: string;
  avatar_seed?: string;
  status?: string;
  locale?: string;
  updated_at?: number;
}

export interface ZenoaSendMessageOptions {
  to: string; // '@username' or phone number
  text?: string;
  media_url?: string;
  media_type?: 'image' | 'file' | 'audio';
  buttons?: { label: string; url?: string; action?: string }[];
  parse_mode?: 'markdown' | 'plain';
}

export interface ZenoaSendOtpOptions {
  to: string; // phone or @username
  code?: string; // Optional custom code (auto-generated if omitted)
  length?: 4 | 6 | 8;
  template?: 'login_verification' | 'password_reset' | 'transaction_approval' | string;
  expiryMinutes?: number;
}

export interface ZenoaVerifyOtpOptions {
  to: string;
  code: string;
}

export interface ZenoaOtpResult {
  success: boolean;
  message_id?: string;
  to: string;
  status: 'delivered' | 'pending' | 'failed' | 'verified' | 'invalid';
  timestamp: number;
  expires_at?: number;
  error?: string;
}

export interface ZenoaWebhookEvent {
  event: 'message.received' | 'user.authenticated' | 'otp.verified' | 'bot.action';
  id: string;
  timestamp: number;
  data: any;
  signature: string;
}
