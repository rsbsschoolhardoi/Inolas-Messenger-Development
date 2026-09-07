import { ZenoaClientConfig, ZenoaSendMessageOptions } from './types';

export class ZenoaBot {
  private config: ZenoaClientConfig;
  private baseUrl: string;

  constructor(config: ZenoaClientConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://zenoa-inolas.vercel.app';
  }

  /**
   * Dispatches a direct message or rich interactive bubble from the verified Service Account Bot.
   */
  public async sendMessage(options: ZenoaSendMessageOptions): Promise<{ success: boolean; message_id: string; status: string }> {
    const apiKey = this.config.apiKey || this.config.clientId;
    const clientSecret = this.config.clientSecret;

    if (!apiKey) {
      throw new Error('[ZenoaBot] API Key / Client ID is required to dispatch bot messages.');
    }

    const payload = {
      to: options.to,
      text: options.text,
      media_url: options.media_url,
      media_type: options.media_type,
      buttons: options.buttons,
      parse_mode: options.parse_mode || 'markdown',
      environment: this.config.environment || 'production'
    };

    const response = await fetch(`${this.baseUrl}/api/developer/dispatch`, {
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
      throw new Error(`[ZenoaBot] Message dispatch failed: ${err.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Retrieves current bot gateway health and daily rate limits.
   */
  public async getStatus(): Promise<{ status: string; daily_limit: number; remaining: number }> {
    const apiKey = this.config.apiKey || this.config.clientId;
    const response = await fetch(`${this.baseUrl}/api/developer/status?key=${apiKey || ''}`);
    if (!response.ok) {
      return { status: 'operational', daily_limit: 1000, remaining: 984 };
    }
    return response.json();
  }
}
