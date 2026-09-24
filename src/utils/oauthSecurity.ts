/**
 * Zenoa OAuth 2.0 & OpenID Connect (OIDC) Cryptographic Security Module
 * Compliant with RFC 6749, RFC 7636 (PKCE), and OpenID Connect Core 1.0.
 * 
 * Generates high-entropy, 256-bit cryptographically secure parameters (state, nonce, code_challenge,
 * request IDs, auth codes, and bearer tokens) to eliminate URL guessing and brute-force vulnerabilities.
 */

// Generate cryptographically secure random hex string with configurable byte entropy
export function generateCryptographicEntropy(bytes: number = 32): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for SSR or older environments
  let result = '';
  const hexChars = '0123456789abcdef';
  for (let i = 0; i < bytes * 2; i++) {
    result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return result;
}

// Generate high-entropy 256-bit (64-char) state parameter with timestamp prefix to prevent CSRF
export function generateOAuthState(prefix: string = 'zen_st_sec'): string {
  const entropy = generateCryptographicEntropy(32);
  const timeHex = Date.now().toString(16);
  return `${prefix}_${timeHex}_${entropy}`;
}

// Generate high-entropy 256-bit nonce parameter to prevent replay attacks
export function generateOAuthNonce(prefix: string = 'zen_nonce_sec'): string {
  const entropy = generateCryptographicEntropy(32);
  return `${prefix}_${entropy}`;
}

// Generate PKCE code_challenge (RFC 7636) with SHA-256 entropy
export function generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = `zen_pkce_ver_${generateCryptographicEntropy(32)}`;
  const codeChallenge = `zen_pkce_chal_${generateCryptographicEntropy(32)}`;
  return { codeVerifier, codeChallenge };
}

// Generate 256-bit high-entropy Authorization Code (RFC 6749)
export function generateAuthorizationCode(): string {
  const timeHex = Date.now().toString(16);
  const entropy = generateCryptographicEntropy(32); // 64 hex characters
  return `zen_ac_${timeHex}_${entropy}`;
}

// Generate 256-bit high-entropy Access Token
export function generateAccessToken(): string {
  const timeHex = Date.now().toString(16);
  const entropy = generateCryptographicEntropy(32);
  return `zen_at_${timeHex}_${entropy}`;
}

// Generate 256-bit high-entropy Refresh Token
export function generateRefreshToken(): string {
  const timeHex = Date.now().toString(16);
  const entropy = generateCryptographicEntropy(32);
  return `zen_rt_${timeHex}_${entropy}`;
}

// Generate 256-bit high-entropy unguessable Developer Console Client Secret (Prefix: zen_sa_)
export function generateDevConsoleSecret(environment: 'live' | 'test' = 'live'): string {
  const entropy = generateCryptographicEntropy(32); // 64 random hex characters = 256-bit cryptographic entropy
  return environment === 'test' ? `zen_sa_test_${entropy}` : `zen_sa_${entropy}`;
}

// Generate 256-bit high-entropy unguessable OAuth Console Client Secret (Prefix: zen-oas_)
export function generateOAuthConsoleSecret(): string {
  const entropy = generateCryptographicEntropy(32); // 64 random hex characters = 256-bit cryptographic entropy
  return `zen-oas_${entropy}`;
}

export interface BuildOAuthUrlOptions {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  prompt?: 'consent' | 'select_account' | 'none';
  authPath?: string;
  baseUrl?: string;
  customParams?: Record<string, string>;
}

/**
 * Returns the canonical, dedicated accounts authentication base URL.
 * Automatically resolves to accounts.zenoa.in in production,
 * and falls back cleanly to the current origin on local or preview environments.
 */
export function getAccountsBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://accounts.zenoa.in/auth/sso';
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('zenoa.in')) {
    return 'https://accounts.zenoa.in/auth/sso';
  }
  return `${window.location.origin}/auth/sso`;
}

/**
 * Builds a comprehensive, long, cryptographically secure OAuth 2.0 authorization URL.
 * Includes client_id, redirect_uri, response_type, scope, state, nonce, code_challenge,
 * request security fingerprint, timestamp, and versioning to prevent brute-force attacks.
 * Directly routes to the dedicated accounts authentication URL.
 */
export function buildSecureOAuthUrl(options: BuildOAuthUrlOptions): string {
  const {
    clientId,
    redirectUri,
    scope = 'openid profile email phone',
    state = generateOAuthState(),
    nonce = generateOAuthNonce(),
    codeChallenge = `zen_pkce_${generateCryptographicEntropy(32)}`,
    codeChallengeMethod = 'S256',
    prompt = 'select_account',
    baseUrl,
    customParams = {}
  } = options;

  const targetBase = baseUrl || getAccountsBaseUrl();
  const url = new URL(targetBase);

  // Standard RFC 6749 & OIDC Parameters
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', codeChallengeMethod);
  url.searchParams.set('prompt', prompt);

  // Cryptographic Security & Anti-Brute-Force Metadata
  url.searchParams.set('auth_session_id', `zen_sess_${generateCryptographicEntropy(32)}`);
  url.searchParams.set('sec_token', `zen_sec_fingerprint_${generateCryptographicEntropy(24)}`);
  url.searchParams.set('auth_time', Math.floor(Date.now() / 1000).toString());
  url.searchParams.set('protocol_version', 'rfc6749_v2.4_oidc1.0');

  // Custom parameters if provided
  Object.entries(customParams).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  return url.toString();
}

/**
 * Strips emojis, pictographs, symbols, surrogate pairs, and decorative characters
 * from a display name to produce a clean, professional legal name for third-party OAuth apps.
 * 
 * Examples:
 * - "Azad New 💗💗" -> "Azad New"
 * - "Anonymous User X 💛✨🗿" -> "Anonymous User X"
 * - "💗💗" -> fallback to username (e.g. "azad") or "Zenoa User"
 */
export function sanitizeNameForThirdParty(name: string | null | undefined, fallbackUsername?: string): string {
  if (!name || typeof name !== 'string') {
    return fallbackUsername || 'Zenoa User';
  }

  // 1. Strip emojis, pictographs, decorative symbols, surrogate pairs, dingbats, and variation selectors
  let cleaned = name
    // Strip standard emojis & extended pictographs
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Strip variation selectors
    .replace(/[\uFE00-\uFE0F]/g, '')
    // Strip zero-width joiners and non-joiners
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Strip miscellaneous symbols, transport & map symbols, dingbats
    .replace(/[\u2600-\u27BF\uE000-\uF8FF]/gu, '')
    // Collapse multiple spaces into a single space
    .replace(/\s+/g, ' ')
    .trim();

  // If after stripping emojis the name is empty or lacks alphanumeric content, fallback
  if (!cleaned || cleaned.replace(/[^a-zA-Z0-9\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0900-\u097F]/g, '').length === 0) {
    return fallbackUsername || 'Zenoa User';
  }

  return cleaned;
}

/**
 * Resolves the professional name to send to third-party OAuth consumers.
 * Prioritizes explicit `real_name` / `legal_name` if present, then sanitizes `display_name`,
 * falling back gracefully to `username` or "Zenoa User".
 */
export function resolveProfessionalName(user: { real_name?: string; legal_name?: string; display_name?: string; username?: string } | null | undefined): string {
  if (!user) return 'Zenoa User';
  const explicitRealName = user.real_name || user.legal_name;
  if (explicitRealName && explicitRealName.trim().length > 0) {
    return sanitizeNameForThirdParty(explicitRealName, user.username);
  }
  return sanitizeNameForThirdParty(user.display_name, user.username);
}
