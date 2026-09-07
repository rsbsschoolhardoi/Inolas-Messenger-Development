import { ZenoaClientConfig, ZenoaSendOtpOptions, ZenoaVerifyOtpOptions, ZenoaOtpResult } from './types';

export class ZenoaOtp {
  private config: ZenoaClientConfig;
  private baseUrl: string;

  constructor(config: ZenoaClientConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://zenoa-inolas.vercel.app';
  }

  /**
   * Generates and dispatches a verified 6-digit authentication passcode to a user's Zenoa Messenger or phone.
   */
  public async send(options: ZenoaSendOtpOptions): Promise<ZenoaOtpResult> {
    const apiKey = this.config.apiKey || this.config.clientId;
    const clientSecret = this.config.clientSecret;

    if (!apiKey) {
      throw new Error('[ZenoaOtp] Client ID or API Key is required to send OTPs.');
    }

    const payload = {
      to: options.to,
      code: options.code,
      length: options.length || 6,
      template: options.template || 'login_verification',
      expiry_minutes: options.expiryMinutes || 5,
      environment: this.config.environment || 'production'
    };

    const response = await fetch(`${this.baseUrl}/api/developer/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zenoa-Client-ID': apiKey,
        'X-Zenoa-Client-Secret': clientSecret || '',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        to: options.to,
        status: 'failed',
        timestamp: Date.now(),
        error: err.message || response.statusText
      };
    }

    return response.json();
  }

  /**
   * Verifies an OTP entered by the user.
   */
  public async verify(options: ZenoaVerifyOtpOptions): Promise<{ valid: boolean; reason?: string }> {
    const apiKey = this.config.apiKey || this.config.clientId;

    const response = await fetch(`${this.baseUrl}/api/developer/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zenoa-Client-ID': apiKey || '',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: options.to,
        code: options.code
      })
    });

    if (!response.ok) {
      return { valid: false, reason: 'Verification failed or code expired.' };
    }

    return response.json();
  }
}
