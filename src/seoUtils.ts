// Zenoa SEO & Dynamic Meta Management Utility

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string;
}

/**
 * Metadata Matrix mapping domains, routes, and internal app states to clean,
 * dedicated titles and professional descriptions.
 */
export const METADATA_CONFIGS = {
  // 1. Web & Main App Messenger
  APP_MESSENGER: {
    title: 'Zenoa | The Next Gen Private Messenger',
    description: 'The next-generation sovereign private messenger engineered by Inolas Nexus. Featuring zero cloud retention, client-side zero-knowledge encryption, and instant WebRTC peer-to-peer calls.',
    keywords: 'Zenoa, private messenger, sovereign chat, encrypted messaging, zero retention, Inolas Nexus'
  },

  // 2. Developer Console & Developer Platform
  DEVELOPER_PORTAL: {
    title: 'Zenoa Developer | Make Business Easier with Zenoa',
    description: 'Empowering developers and enterprise businesses with modern messaging APIs, service account bots, webhooks, and scalable developer infrastructure.',
    keywords: 'Zenoa Developer, Zenoa API, bot platform, webhooks, messaging API, developer console, Inolas Nexus'
  },

  // 3. SSO / OAuth Console
  OAUTH_CONSOLE: {
    title: 'Zenoa OAuth | Authentication you can Trust',
    description: 'Sovereign Single Sign-On and zero-trust OAuth 2.0 authentication provider. Fast, secure, and privacy-focused identity verification you can trust.',
    keywords: 'Zenoa OAuth, Single Sign-On, Zenoa SSO, trusted authentication, zero trust identity, OAuth 2.0 provider'
  },

  // 4. Main Site & Landing Hub
  LANDING_MAIN: {
    title: 'Zenoa | Sovereign Communications & Privacy Ecosystem',
    description: 'The premier privacy-first communication platform engineered by Inolas Nexus. Private messaging, sovereign OAuth identity, and enterprise developer solutions.',
    keywords: 'Zenoa, privacy ecosystem, sovereign messenger, Inolas Nexus, secure communications, zero retention'
  },

  // 5. Developer Documentation & Guides
  DOCUMENTATION: {
    title: 'Zenoa Docs | Developer Platform & API Reference',
    description: 'Official API reference, Bot SDK guides, webhook configurations, and WebCrypto zero-knowledge encryption technical specifications.',
    keywords: 'Zenoa docs, API documentation, bot SDK, webhook guide, OAuth technical specs'
  },

  // 6. Administrative Console
  ADMIN_CONSOLE: {
    title: 'Zenoa Console | Systems & Platform Operations',
    description: 'Official administrative management console for Zenoa network health, security monitoring, and platform ecosystem analytics.',
    keywords: 'Zenoa admin console, platform operations, network analytics, security monitoring'
  },

  // 7. Login / Registration Portal
  AUTH_PORTAL: {
    title: 'Zenoa | Secure Login & Account Portal',
    description: 'Log in or register your sovereign Zenoa account with client-side zero-knowledge encryption and privacy-first authentication.',
    keywords: 'Zenoa login, Zenoa account, secure sign in, sovereign account, private login'
  },

  // 8. In-App Views
  APP_SETTINGS: {
    title: 'Settings | Zenoa Private Messenger',
    description: 'Manage security preferences, notification alerts, zero-knowledge cloud vault backups, and account privacy options.'
  },
  APP_SEARCH: {
    title: 'Discover & Search | Zenoa',
    description: 'Search verified contacts, official service accounts, and private channels on Zenoa.'
  },
  APP_PROFILE: {
    title: 'Profile & Vault | Zenoa',
    description: 'Manage your sovereign Zenoa profile, zero-knowledge cloud vault, and media attachments library.'
  }
};

/**
 * Dynamically updates document title and meta/OG tags in document.head.
 */
export function updatePageMetadata(title: string, description: string, url?: string): void {
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

  // 3. Open Graph (OG) Tags
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);

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

  // 1. Hostname-based Detection
  const isDevDomain = host.startsWith('developer.') || host.startsWith('dev.');
  const isConsoleDomain = host.startsWith('console.') || host.startsWith('sso.') || host.startsWith('oauth.') || host.startsWith('accounts.');
  const isAppDomain = host.startsWith('app.') || host.startsWith('web.') || host.startsWith('chat.');

  // 2. Specific Route / Mode Overrides

  // Documentation view
  if (opts?.isDocShowing || path === '/docs' || path === '/documentation') {
    updatePageMetadata(METADATA_CONFIGS.DOCUMENTATION.title, METADATA_CONFIGS.DOCUMENTATION.description, currentUrl);
    return;
  }

  // Admin view
  if (opts?.isAdmin || path === '/admin' || path.startsWith('/admin/')) {
    updatePageMetadata(METADATA_CONFIGS.ADMIN_CONSOLE.title, METADATA_CONFIGS.ADMIN_CONSOLE.description, currentUrl);
    return;
  }

  // Public User Profile view
  if (opts?.publicUsername || path.startsWith('/u/')) {
    const u = opts?.publicUsername || path.split('/u/')[1]?.split('/')[0] || 'user';
    const cleanU = u.replace(/^@/, '');
    const title = `Zenoa Profile | @${cleanU}`;
    const desc = `Connect with @${cleanU} on Zenoa — The next-generation sovereign private messenger.`;
    updatePageMetadata(title, desc, currentUrl);
    return;
  }

  // Standalone Developer Console domain
  if (isDevDomain) {
    updatePageMetadata(METADATA_CONFIGS.DEVELOPER_PORTAL.title, METADATA_CONFIGS.DEVELOPER_PORTAL.description, currentUrl);
    return;
  }

  // Standalone SSO / OAuth Console domain
  if (isConsoleDomain) {
    updatePageMetadata(METADATA_CONFIGS.OAUTH_CONSOLE.title, METADATA_CONFIGS.OAUTH_CONSOLE.description, currentUrl);
    return;
  }

  // Auth / Login routes
  if (opts?.isAuthShowing || path === '/login' || path === '/signup' || path === '/auth' || path === '/register') {
    updatePageMetadata(METADATA_CONFIGS.AUTH_PORTAL.title, METADATA_CONFIGS.AUTH_PORTAL.description, currentUrl);
    return;
  }

  // Active App Messenger Subdomain or View
  if (isAppDomain) {
    if (opts?.activeChatName) {
      const chatTitle = opts.activeChatUsername ? `Chat with ${opts.activeChatName} (@${opts.activeChatUsername.replace(/^@/, '')}) | Zenoa` : `Chat with ${opts.activeChatName} | Zenoa`;
      const chatDesc = `Encrypted sovereign conversation on Zenoa Private Messenger. Zero cloud retention, client-side WebCrypto security.`;
      updatePageMetadata(chatTitle, chatDesc, currentUrl);
      return;
    }

    if (opts?.activeView === 'settings') {
      updatePageMetadata(METADATA_CONFIGS.APP_SETTINGS.title, METADATA_CONFIGS.APP_SETTINGS.description, currentUrl);
      return;
    }

    if (opts?.activeView === 'search') {
      updatePageMetadata(METADATA_CONFIGS.APP_SEARCH.title, METADATA_CONFIGS.APP_SEARCH.description, currentUrl);
      return;
    }

    if (opts?.activeView === 'profile') {
      updatePageMetadata(METADATA_CONFIGS.APP_PROFILE.title, METADATA_CONFIGS.APP_PROFILE.description, currentUrl);
      return;
    }

    if (opts?.activeView === 'developer_portal') {
      updatePageMetadata(METADATA_CONFIGS.DEVELOPER_PORTAL.title, METADATA_CONFIGS.DEVELOPER_PORTAL.description, currentUrl);
      return;
    }

    // Default App Messenger
    updatePageMetadata(METADATA_CONFIGS.APP_MESSENGER.title, METADATA_CONFIGS.APP_MESSENGER.description, currentUrl);
    return;
  }

  // Root Domain (Zenoa.in) default landing hub
  updatePageMetadata(METADATA_CONFIGS.LANDING_MAIN.title, METADATA_CONFIGS.LANDING_MAIN.description, currentUrl);
}
