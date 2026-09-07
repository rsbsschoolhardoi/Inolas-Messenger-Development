import { ZenoaClientConfig, ZenoaAuthUrlOptions, ZenoaTokenResponse, ZenoaUserProfile } from './types';

export class ZenoaAuth {
  private config: ZenoaClientConfig;
  private baseUrl: string;

  constructor(config: ZenoaClientConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://zenoa-inolas.vercel.app';
  }

  /**
   * Generates the secure "Continue with Zenoa" authorization URL.
   */
  public getAuthorizationUrl(options: ZenoaAuthUrlOptions): string {
    const clientId = options.clientId || this.config.clientId;
    if (!clientId) {
      throw new Error('[ZenoaAuth] clientId is required to generate Authorization URL.');
    }

    const scopes = (options.scopes || ['openid', 'profile', 'email']).join(' ');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: options.redirectUri,
      response_type: options.responseType || 'code',
      scope: scopes
    });

    if (options.state) {
      params.append('state', options.state);
    }

    return `${this.baseUrl}/auth/sso?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an Access Token (Server-to-Server).
   */
  public async exchangeCode(code: string, redirectUri?: string): Promise<ZenoaTokenResponse> {
    const clientId = this.config.clientId;
    const clientSecret = this.config.clientSecret;

    if (!clientId || !clientSecret) {
      throw new Error('[ZenoaAuth] Both clientId and clientSecret are required for code exchange.');
    }

    const response = await fetch(`${this.baseUrl}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`[ZenoaAuth] Token exchange failed: ${errorData.error_description || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetches user identity profile and claims using a Bearer Access Token.
   */
  public async getUserInfo(accessToken: string): Promise<ZenoaUserProfile> {
    if (!accessToken) {
      throw new Error('[ZenoaAuth] accessToken is required to fetch user claims.');
    }

    const response = await fetch(`${this.baseUrl}/api/oauth/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`[ZenoaAuth] Fetch user claims failed: ${errorData.error_description || response.statusText}`);
    }

    return response.json();
  }
}
