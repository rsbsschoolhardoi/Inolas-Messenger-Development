---
title: Zenoa Agent Authentication & Authorization Guide (auth.md)
description: Complete specification for AI agents, MCP clients, and autonomous bots to authenticate and interact with Zenoa Sovereign APIs.
date: 2026-09-16
url: https://zenoa.in/auth.md
---

# Zenoa Agent Authentication Guide (`auth.md`)

This specification provides autonomous AI agents, Model Context Protocol (MCP) clients, and automated vibe-coding assistants with the exact protocol to authenticate and interact with **Zenoa Sovereign Messenger & Developer APIs** (by Inolas Nexus).

---

## 1. Discovery Endpoints
- **OpenID Connect Discovery**: [`https://zenoa.in/.well-known/openid-configuration`](https://zenoa.in/.well-known/openid-configuration)
- **OAuth 2.0 Authorization Server**: [`https://zenoa.in/.well-known/oauth-authorization-server`](https://zenoa.in/.well-known/oauth-authorization-server)
- **OAuth 2.0 Protected Resource**: [`https://zenoa.in/.well-known/oauth-protected-resource`](https://zenoa.in/.well-known/oauth-protected-resource)
- **RFC 9727 API Catalog**: [`https://zenoa.in/.well-known/api-catalog`](https://zenoa.in/.well-known/api-catalog)
- **OpenAPI 3.1 Spec**: [`https://zenoa.in/openapi.json`](https://zenoa.in/openapi.json)
- **MCP Server Card (SEP-1649)**: [`https://zenoa.in/.well-known/mcp/server-card.json`](https://zenoa.in/.well-known/mcp/server-card.json)
- **AI Resource Discovery**: [`https://zenoa.in/.well-known/ai-catalog.json`](https://zenoa.in/.well-known/ai-catalog.json)

---

## 2. Authentication Methods

### Method A: Direct Service Account Key (Recommended for Bots & Scripts)
Every registered application in the [Zenoa Developer Console](https://zenoa.in/developer) is issued a sovereign Service Account credential pair:
- `X-Client-Id`: `zen_client_...`
- `X-Client-Secret`: `zen_sec_...`

You may pass these credentials either in HTTP request headers:
```http
X-Client-Id: your_client_id
X-Client-Secret: your_client_secret
```
Or via standard HTTP Basic Auth (`base64(client_id:client_secret)`):
```http
Authorization: Basic <base64_credentials>
```

### Method B: OAuth 2.0 Client Credentials Grant
For autonomous agent token exchange:

```http
POST /api/v1/sso/token HTTP/1.1
Host: zenoa.in
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}
```

#### Response
```json
{
  "access_token": "zat_eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## 3. Making Authenticated Requests

Include your Bearer token or Service Account headers with each API call:

```http
POST /api/v1/messages/send HTTP/1.1
Host: zenoa.in
X-Client-Id: your_client_id
X-Client-Secret: your_client_secret
Content-Type: application/json

{
  "recipient": "alex",
  "message": "Automated alert: Backup finished successfully.",
  "media_url": "https://example.com/status.png"
}
```

---

## 4. Security Principles
- **Never expose `client_secret` on client-side frontend code**: Keep API keys in server environment variables (`process.env.ZENOA_CLIENT_SECRET`).
- **Cryptographic Sender Isolation**: Bot messages are strictly signed and delivered from the application's verified service account bot handle.
