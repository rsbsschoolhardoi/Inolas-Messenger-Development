import { ZenoaClientConfig } from './types';
import { ZenoaAuth } from './auth';
import { ZenoaBot } from './bot';
import { ZenoaOtp } from './otp';
import { ZenoaWebhook } from './webhook';
import { ZenoaCliRunner } from './cli';

export * from './types';
export * from './auth';
export * from './bot';
export * from './otp';
export * from './webhook';
export * from './cli';

/**
 * Main Zenoa SDK Client
 * Unified entry point for OAuth 2.0 Identity, Service Account Bot messaging, and OTP dispatch.
 */
export class ZenoaClient {
  public auth: ZenoaAuth;
  public bot: ZenoaBot;
  public otp: ZenoaOtp;
  public config: ZenoaClientConfig;

  constructor(config: ZenoaClientConfig = {}) {
    this.config = {
      baseUrl: 'https://zenoa-inolas.vercel.app',
      environment: 'production',
      ...config
    };

    this.auth = new ZenoaAuth(this.config);
    this.bot = new ZenoaBot(this.config);
    this.otp = new ZenoaOtp(this.config);
  }

  public static webhook = ZenoaWebhook.middleware;
  public static cli = new ZenoaCliRunner();
}

export default ZenoaClient;
