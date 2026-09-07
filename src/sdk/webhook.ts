import { ZenoaWebhookEvent } from './types';

export interface WebhookHandlerOptions {
  secret?: string;
  onMessage?: (data: any) => void | Promise<void>;
  onUserAuth?: (data: any) => void | Promise<void>;
  onOtpVerified?: (data: any) => void | Promise<void>;
  onError?: (err: Error) => void;
}

export class ZenoaWebhook {
  /**
   * Express.js compatible middleware handler.
   */
  public static middleware(options: WebhookHandlerOptions) {
    return async (req: any, res: any, next?: any) => {
      try {
        const signature = req.headers['x-zenoa-signature'];
        const event: ZenoaWebhookEvent = req.body;

        if (!event || !event.event) {
          return res.status(400).json({ error: 'Invalid Zenoa webhook payload' });
        }

        switch (event.event) {
          case 'message.received':
            if (options.onMessage) await options.onMessage(event.data);
            break;
          case 'user.authenticated':
            if (options.onUserAuth) await options.onUserAuth(event.data);
            break;
          case 'otp.verified':
            if (options.onOtpVerified) await options.onOtpVerified(event.data);
            break;
          default:
            break;
        }

        return res.status(200).json({ received: true });
      } catch (err: any) {
        if (options.onError) options.onError(err);
        return res.status(500).json({ error: err.message || 'Webhook processing failed' });
      }
    };
  }
}
