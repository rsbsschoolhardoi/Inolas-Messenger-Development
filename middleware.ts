// Vercel Edge Routing Middleware for Content Negotiation (Accept: text/markdown)
// Runs at the edge BEFORE static files (index.html) are evaluated.
// Compliant with https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
// and https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md

export const config = {
  matcher: ['/((?!api/|_next/|static/|assets/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|js|css|woff|woff2|ttf|map)).*)'],
};

const DISCOVERY_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/openid-configuration>; rel="service-desc"; type="application/json"',
  '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"; type="application/json"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"; type="application/json"',
  '</.well-known/agent-card.json>; rel="agent-card"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"',
  '</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"',
  '</docs>; rel="service-doc"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</llms.txt>; rel="alternate"; type="text/markdown"',
  '</llms-full.txt>; rel="alternate"; type="text/markdown"',
  '</auth.md>; rel="author-authorization"; type="text/markdown"',
  '</sitemap.xml>; rel="sitemap"; type="application/xml"'
].join(', ');

function getMarkdownForPath(reqPath: string): string {
  const cleanPath = (reqPath || '/').toLowerCase().split('?')[0].replace(/\/+$/, '') || '/';

  if (cleanPath === '/docs' || cleanPath === '/api-docs' || cleanPath === '/developer/docs') {
    return `---
title: Zenoa API Documentation | Inolas Nexus
description: Comprehensive developer guide and API documentation for Zenoa sovereign messaging and OAuth platform.
date: 2026-09-16
url: https://zenoa.in/docs
---

# Zenoa Developer Documentation

Welcome to the **Zenoa Developer Ecosystem** by Inolas Nexus. Build autonomous AI bots, zero-retention webhook integrations, and sovereign OAuth 2.0 Single Sign-On applications.

## Quick Reference
- **Base API URL**: \`https://zenoa.in/api/v1\`
- **OpenAPI Specification**: \`https://zenoa.in/openapi.json\`
- **MCP Server Card**: \`https://zenoa.in/.well-known/mcp/server-card.json\`
- **Agent Card (A2A)**: \`https://zenoa.in/.well-known/agent-card.json\`
- **Agent Auth Specification**: \`https://zenoa.in/auth.md\`
- **OAuth Authorization Server**: \`https://zenoa.in/.well-known/oauth-authorization-server\`
- **OAuth Protected Resource**: \`https://zenoa.in/.well-known/oauth-protected-resource\`

## Core Endpoints
1. \`POST /api/v1/messages/send\` - Send zero-cloud encrypted sovereign messages.
2. \`POST /api/v1/agents/register\` - Autonomous agent registration (ID-JAG / claim flow).
3. \`POST /api/v1/sso/token\` - OAuth 2.0 client credentials token grant.
4. \`POST /api/v1/bots/create\` - Provision automated service accounts.
5. \`GET /api/v1/health\` - Platform uptime and relay mesh status.
`;
  }

  if (cleanPath === '/features') {
    return `---
title: Zenoa Features | Sovereign Private Messenger
description: Core architectural features of Zenoa zero-cloud encrypted private messaging platform by Inolas Nexus.
date: 2026-09-16
url: https://zenoa.in/features
---

# Zenoa Architecture & Features

Zenoa is engineered by Inolas Nexus from the ground up for strict privacy, cryptographic sovereignty, and developer velocity.

## 1. Zero-Cloud Retention (0ms TTL)
Messages exist only in ephemeral memory relays while in transit. Once delivered, payloads are wiped instantly with zero logs, zero database writes, and zero residual traces.

## 2. Client-Side WebCrypto Primitives
End-to-end cryptographic handshakes are performed locally in the client browser using modern WebCrypto (AES-256-GCM / X25519) and IndexedDB private keystores.

## 3. Sovereign DIDs & Decentralized Handles
Users own their cryptographic identity without requiring phone numbers, personal emails, or centralized corporate harvesting.

## 4. Developer-First Ecosystem
Native Model Context Protocol (MCP) server, A2A Agent Card, OpenAPI 3.1 specifications, and enterprise webhooks.
`;
  }

  if (cleanPath === '/security') {
    return `---
title: Zenoa Security Architecture & Cryptographic Primitives
description: In-depth technical security architecture of Zenoa sovereign messaging and zero-knowledge relays.
date: 2026-09-16
url: https://zenoa.in/security
---

# Zenoa Cryptographic Security Architecture

Built on zero-trust principles, Zenoa guarantees that even if relays or infrastructure are compromised, ciphertexts remain cryptographically opaque.

- **Ephemeral Relay Mesh**: 0ms Time-To-Live memory buffers.
- **Key Isolation**: Ed25519 authentication keys and X25519 key-exchange pairs remain strictly in client memory and encrypted IndexedDB.
- **Independent Verification**: Fully auditable OpenAPI specifications, machine-readable manifests, and RFC 8288 discovery.
`;
  }

  // Root fallback
  return `---
title: Zenoa | Sovereign Private Messenger, OAuth & Developer Platform
description: Sovereign private messaging platform and developer ecosystem built by Inolas Nexus featuring zero-cloud retention, client-side encryption, and developer APIs.
date: 2026-09-16
url: https://zenoa.in/
---

# Zenoa (Inolas Nexus) - Sovereign Privacy Platform

> **Zenoa** (https://zenoa.in) is the sovereign private messenger, developer ecosystem, and zero-retention identity platform engineered by **Inolas Nexus**.

## Overview
Zenoa delivers zero-cloud message retention, client-side WebCrypto encryption (AES-256-GCM / X25519), and high-throughput developer APIs. Built for the global privacy community, Zenoa guarantees that users retain sovereign ownership of their personal data while providing developers with enterprise-grade OAuth 2.0 Single Sign-On, Bot APIs, and instant webhook dispatches.

## Explore this site
- [Zenoa Private Messenger](https://zenoa.in/): Decentralized, ephemeral messaging application built by Inolas Nexus.
- [App Direct Messenger](https://app.zenoa.in/): Standalone browser messenger with direct instant authentication.
- [Web Companion QR Messenger](https://web.zenoa.in/): Pair mobile and desktop instances with cryptographic zero-knowledge QR handshakes.
- [Zenoa Developer Console](https://zenoa.in/developer): Management portal for global developers to generate API keys, configure webhooks, and register OAuth applications.
- [API Documentation](https://zenoa.in/docs): Interactive developer documentation with examples in 7+ languages (TypeScript, Python, Go, Node.js, cURL).
- [Zenoa OAuth & SSO Console](https://zenoa.in/sso): Identity gateway protecting user privacy with zero-data phone/email harvesting.
- [Security Architecture](https://zenoa.in/security): In-depth cryptographic whitepaper on 0ms TTL relay mesh and local IndexedDB isolation.
- [Privacy Policy](https://zenoa.in/privacy): Clear privacy commitments from Inolas Nexus.
- [Terms of Service](https://zenoa.in/terms): User agreement and open API guidelines.

## Developer & Machine-Readable Resources
- [OpenAPI Specification](https://zenoa.in/openapi.json): Standard OpenAPI 3.1 specification for AI bots and API clients.
- [Full LLM Context](https://zenoa.in/llms-full.txt): Comprehensive multi-page architectural guide for autonomous LLM agents.
- [LLMs Manifest](https://zenoa.in/llms.txt): Machine-readable markdown specification for AI agents.
- [A2A Agent Card](https://zenoa.in/.well-known/agent-card.json): Agent-to-Agent protocol discovery card.
- [MCP Server Card](https://zenoa.in/.well-known/mcp/server-card.json): Model Context Protocol server capabilities.
- [Agent Auth Guide](https://zenoa.in/auth.md): Agent authentication and self-contained registration flow.
- [AI Catalog (ARD)](https://zenoa.in/.well-known/ai-catalog.json): Agentic Resource Discovery manifest.
- [Robots Configuration](https://zenoa.in/robots.txt): Crawler policy and access rules for search engines and AI agents.
- [XML Sitemap](https://zenoa.in/sitemap.xml): Complete URL index for search engines.
`;
}

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const acceptHeader = (request.headers.get('accept') || '').toLowerCase();
  const formatQuery = (url.searchParams.get('format') || url.searchParams.get('markdown') || '').toLowerCase();

  const acceptsMarkdown = acceptHeader.includes('text/markdown') || 
                          acceptHeader.includes('text/x-markdown') || 
                          formatQuery === 'markdown' ||
                          formatQuery === 'true' ||
                          formatQuery === 'md';

  if (acceptsMarkdown) {
    const mdContent = getMarkdownForPath(url.pathname);
    const tokenCount = Math.max(1, Math.ceil(mdContent.length / 4));

    if (request.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Vary': 'Accept',
          'x-markdown-tokens': String(tokenCount),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'Link, WWW-Authenticate, Content-Type, Vary, x-markdown-tokens',
          'Link': DISCOVERY_LINK_HEADER
        }
      });
    }

    return new Response(mdContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
        'x-markdown-tokens': String(tokenCount),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Link, WWW-Authenticate, Content-Type, Vary, x-markdown-tokens',
        'Link': DISCOVERY_LINK_HEADER
      }
    });
  }

  // Fallthrough to standard routing
  return;
}
