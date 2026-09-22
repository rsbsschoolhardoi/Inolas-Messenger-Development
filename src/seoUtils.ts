// Zenoa SEO & Dynamic Meta Management Utility

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string;
  siteName?: string;
}

/**
 * Metadata Matrix mapping domains, subdomains, routes, and internal app states to clean,
 * dedicated titles, brand identities, and professional descriptions.
 */
export const METADATA_CONFIGS = {
  // 1. Personal Account & Security Management Portal (account.zenoa.in / myaccount.zenoa.in / /account)
  ACCOUNT_PORTAL: {
    title: 'Zenoa Account | Manage Your Sovereign Identity & Security',
    description: 'Manage your sovereign Zenoa profile, authorized third-party applications, two-factor authentication, cryptographic security keys, and zero-knowledge privacy settings.',
    keywords: 'Zenoa account, account management, privacy settings, authorized apps, security center, sovereign identity',
    siteName: 'Zenoa Account'
  },

  // 2. Accounts / OAuth 2.0 & SSO Authentication Gateway (accounts.zenoa.in / auth.zenoa.in / /auth/sso)
  ACCOUNTS_GATEWAY: {
    title: 'Zenoa Accounts | Sovereign Single Sign-On & OAuth 2.0 Gateway',
    description: 'Sign in securely with Zenoa. Sovereign, zero-trust OAuth 2.0 and OpenID Connect identity provider engineered for high privacy and zero data leakage.',
    keywords: 'Zenoa accounts, sign in with zenoa, sovereign SSO, OAuth 2.0 provider, zero-knowledge authentication, OpenID Connect',
    siteName: 'Zenoa Accounts'
  },

  // 3. Web QR Pairing Companion (web.zenoa.in / /web)
  WEB_MESSENGER: {
    title: 'Zenoa Web | Sovereign Browser Messenger & Device Link',
    description: 'Link your browser securely to Zenoa with end-to-end encrypted peer-to-peer sync. Zero cloud retention, client-side encryption, and instant web chat.',
    keywords: 'Zenoa Web, web messenger, QR device link, browser chat, peer-to-peer sync, sovereign messaging',
    siteName: 'Zenoa Web'
  },

  // 4. App Direct Sovereign Messenger (app.zenoa.in / /app)
  APP_MESSENGER: {
    title: 'Zenoa | The Next Gen Private Sovereign Messenger',
    description: 'The next-generation sovereign private messenger engineered by Inolas Nexus. Featuring zero cloud retention, client-side zero-knowledge encryption, and instant WebRTC peer-to-peer calls.',
    keywords: 'Zenoa, private messenger, sovereign chat, encrypted messaging, zero retention, Inolas Nexus',
    siteName: 'Zenoa Messenger'
  },

  // 5. Developer Console & Developer Platform (developer.zenoa.in / dev.zenoa.in / /developer)
  DEVELOPER_PORTAL: {
    title: 'Zenoa Developer | Build Scalable Bot APIs & Webhooks',
    description: 'Empowering developers and enterprise businesses with modern messaging APIs, service account bots, webhooks, and scalable developer infrastructure.',
    keywords: 'Zenoa Developer, Zenoa API, bot platform, webhooks, messaging API, developer console, Inolas Nexus',
    siteName: 'Zenoa Developer Console'
  },

  // 6. Developer Documentation & Guides (docs.zenoa.in / /docs)
  DOCUMENTATION: {
    title: 'Zenoa Docs | Developer Platform & API Reference',
    description: 'Official API reference, Bot SDK guides, webhook configurations, and WebCrypto zero-knowledge encryption technical specifications.',
    keywords: 'Zenoa docs, API documentation, bot SDK, webhook guide, OAuth technical specs, REST APIs',
    siteName: 'Zenoa Documentation'
  },

  // 7. SSO / OAuth Management Console (console.zenoa.in / sso.zenoa.in / /sso)
  OAUTH_CONSOLE: {
    title: 'Zenoa OAuth | Authentication you can Trust',
    description: 'Sovereign Single Sign-On and zero-trust OAuth 2.0 application registry. Register client applications, configure redirect URIs, and manage API credentials.',
    keywords: 'Zenoa OAuth, Single Sign-On, Zenoa SSO, trusted authentication, zero trust identity, OAuth 2.0 provider',
    siteName: 'Zenoa OAuth Console'
  },

  // 8. Main Site & Sovereign Ecosystem Hub (zenoa.in / zenoa.sbs)
  LANDING_MAIN: {
    title: 'Zenoa | Sovereign Communications & Privacy Ecosystem',
    description: 'The premier privacy-first communication platform engineered by Inolas Nexus. Sovereign messaging, OAuth identity, and enterprise developer solutions.',
    keywords: 'Zenoa, privacy ecosystem, sovereign messenger, Inolas Nexus, secure communications, zero retention',
    siteName: 'Zenoa'
  },

  // 9. Administrative Console (/admin)
  ADMIN_CONSOLE: {
    title: 'Zenoa Console | Systems & Platform Operations',
    description: 'Official administrative management console for Zenoa network health, security monitoring, and platform ecosystem analytics.',
    keywords: 'Zenoa admin console, platform operations, network analytics, security monitoring',
    siteName: 'Zenoa Admin Console'
  },

  // 10. Login / Registration Portal (/login, /signup)
  AUTH_PORTAL: {
    title: 'Zenoa | Secure Login & Account Portal',
    description: 'Log in or register your sovereign Zenoa account with client-side zero-knowledge encryption and privacy-first authentication.',
    keywords: 'Zenoa login, Zenoa account, secure sign in, sovereign account, private login',
    siteName: 'Zenoa Identity'
  },

  // 11. In-App Messenger Views
  APP_SETTINGS: {
    title: 'Settings | Zenoa Private Messenger',
    description: 'Manage security preferences, notification alerts, zero-knowledge cloud vault backups, and account privacy options.',
    keywords: 'Zenoa settings, security preferences, vault backup, privacy settings',
    siteName: 'Zenoa Messenger'
  },
  APP_SEARCH: {
    title: 'Discover & Search | Zenoa',
    description: 'Search verified contacts, official service accounts, and private channels on Zenoa.',
    keywords: 'Zenoa search, directory, verified contacts, public channels',
    siteName: 'Zenoa Messenger'
  },
  APP_PROFILE: {
    title: 'Profile & Vault | Zenoa',
    description: 'Manage your sovereign Zenoa profile, zero-knowledge cloud vault, and media attachments library.',
    keywords: 'Zenoa profile, cloud vault, encrypted attachments',
    siteName: 'Zenoa Messenger'
  }
};

/**
 * Dynamically updates document title and meta/OG/Twitter tags in document.head.
 */
export function updatePageMetadata(
  title: string, 
  description: string, 
  url?: string, 
  keywords?: string, 
  siteName?: string
): void {
  if (typeof document === 'undefined') return;

  // 1. Set document title
  document.title = title;

  // Helper to ensure meta tag exists and updates its content
  const setMeta = (attributeName: 'name' | 'property', attributeValue: string, content: string) => {
    let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attributeName, attributeValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // 2. Standard Meta Tags
  setMeta('name', 'description', description);
  if (keywords) {
    setMeta('name', 'keywords', keywords);
  }

  // 3. Open Graph (OG) Tags
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  if (siteName) {
    setMeta('property', 'og:site_name', siteName);
  }

  // 4. Twitter Meta Tags
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);

  // 5. Canonical URL
  if (url) {
    setMeta('property', 'og:url', url);
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', url);
  }
}

/**
 * Resolves current location hostname, path, and active view to determine
 * the precise metadata config to apply.
 */
export function resolveAndApplyMetadata(opts?: {
  activeView?: string;
  activeChatName?: string;
  activeChatUsername?: string;
  publicUsername?: string;
  isAdmin?: boolean;
  isDocShowing?: boolean;
  isAuthShowing?: boolean;
}): void {
  if (typeof window === 'undefined') return;

  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const currentUrl = window.location.href;

  // 1. Precise Hostname & Path Detection
  const isAccountDomain = host.startsWith('account.') || host.startsWith('myaccount.') || path === '/account' || path.startsWith('/account/');
  const isAccountsDomain = host.startsWith('accounts.') || host.startsWith('auth.') || path === '/auth/sso' || path.startsWith('/auth/sso');
  const isWebDomain = host.startsWith('web.') || path === '/web' || path.startsWith('/web/');
  const isAppDomain = host.startsWith('app.') || host.startsWith('chat.') || path === '/app' || path.startsWith('/app/');
  const isDevDomain = host.startsWith('developer.') || host.startsWith('dev.') || path === '/developer' || path.startsWith('/developer/');
  const isDocsDomain = host.startsWith('docs.') || host.startsWith('documentation.') || opts?.isDocShowing || path === '/docs' || path === '/documentation';
  const isConsoleDomain = host.startsWith('console.') || host.startsWith('sso.') || host.startsWith('oauth.') || path === '/sso' || path.startsWith('/sso/');
  const isAdminDomain = host.startsWith('admin.') || opts?.isAdmin || path === '/admin' || path.startsWith('/admin/');

  // 2. Specific Route / Mode Priority Overrides

  // Documentation view (docs.zenoa.in or /docs)
  if (isDocsDomain) {
    const cfg = METADATA_CONFIGS.DOCUMENTATION;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Admin view (admin.zenoa.in or /admin)
  if (isAdminDomain) {
    const cfg = METADATA_CONFIGS.ADMIN_CONSOLE;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Personal Account Management Portal (account.zenoa.in or /account)
  if (isAccountDomain) {
    const cfg = METADATA_CONFIGS.ACCOUNT_PORTAL;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Accounts SSO / OAuth Gateway (accounts.zenoa.in or /auth/sso)
  if (isAccountsDomain) {
    const cfg = METADATA_CONFIGS.ACCOUNTS_GATEWAY;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Developer Console domain (developer.zenoa.in or /developer)
  if (isDevDomain || opts?.activeView === 'developer_portal') {
    const cfg = METADATA_CONFIGS.DEVELOPER_PORTAL;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // SSO / OAuth Management Console (console.zenoa.in or /sso)
  if (isConsoleDomain) {
    const cfg = METADATA_CONFIGS.OAUTH_CONSOLE;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Web Browser Messenger & QR Device Link (web.zenoa.in or /web)
  if (isWebDomain) {
    const cfg = METADATA_CONFIGS.WEB_MESSENGER;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Public User Profile view (/u/:username)
  if (opts?.publicUsername || path.startsWith('/u/')) {
    const u = opts?.publicUsername || path.split('/u/')[1]?.split('/')[0] || 'user';
    const cleanU = u.replace(/^@/, '');
    const title = `Zenoa Profile | @${cleanU}`;
    const desc = `Connect with @${cleanU} on Zenoa — The next-generation sovereign private messenger.`;
    const keywords = `Zenoa, @${cleanU}, profile, sovereign messenger, encrypted chat`;
    updatePageMetadata(title, desc, currentUrl, keywords, 'Zenoa Profile');
    return;
  }

  // Auth / Login routes
  if (opts?.isAuthShowing || path === '/login' || path === '/signup' || path === '/auth' || path === '/register') {
    const cfg = METADATA_CONFIGS.AUTH_PORTAL;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Active App Messenger Subdomain or View (app.zenoa.in or /app)
  if (isAppDomain) {
    if (opts?.activeChatName) {
      const chatTitle = opts.activeChatUsername ? `Chat with ${opts.activeChatName} (@${opts.activeChatUsername.replace(/^@/, '')}) | Zenoa` : `Chat with ${opts.activeChatName} | Zenoa`;
      const chatDesc = `Encrypted sovereign conversation on Zenoa Private Messenger. Zero cloud retention, client-side WebCrypto security.`;
      updatePageMetadata(chatTitle, chatDesc, currentUrl, 'encrypted chat, private messaging, zenoa conversation', 'Zenoa Messenger');
      return;
    }

    if (opts?.activeView === 'settings') {
      const cfg = METADATA_CONFIGS.APP_SETTINGS;
      updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
      return;
    }

    if (opts?.activeView === 'search') {
      const cfg = METADATA_CONFIGS.APP_SEARCH;
      updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
      return;
    }

    if (opts?.activeView === 'profile') {
      const cfg = METADATA_CONFIGS.APP_PROFILE;
      updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
      return;
    }

    // Default App Messenger
    const cfg = METADATA_CONFIGS.APP_MESSENGER;
    updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
    return;
  }

  // Root Domain (Zenoa.in) default landing hub
  const cfg = METADATA_CONFIGS.LANDING_MAIN;
  updatePageMetadata(cfg.title, cfg.description, currentUrl, cfg.keywords, cfg.siteName);
}
