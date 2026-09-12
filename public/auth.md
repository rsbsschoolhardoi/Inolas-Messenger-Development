---
title: Zenoa Agent Authentication & Authorization Guide (auth.md)
description: Complete specification for AI agents, MCP clients, and autonomous bots to register, authenticate, and access sovereign Zenoa endpoints.
date: 2026-09-12
url: https://zenoa.in/auth.md
---

# Zenoa Agent Authentication Guide (`auth.md`)

This document provides autonomous AI agents, Model Context Protocol (MCP) clients, and automated software agents with complete instructions to register, authenticate, and interact with the **Zenoa Sovereign Privacy Messenger** and developer ecosystem (engineered by **Inolas Nexus**).

---

## 1. Quick Discovery Endpoints
- **OpenID Connect Discovery**: [`https://zenoa.in/.well-known/openid-configuration`](https://zenoa.in/.well-known/openid-configuration)
- **OAuth 2.0 Authorization Server**: [`https://zenoa.in/.well-known/oauth-authorization-server`](https://zenoa.in/.well-known/oauth-authorization-server)
- **OAuth 2.0 Protected Resource**: [`https://zenoa.in/.well-known/oauth-protected-resource`](https://zenoa.in/.well-known/oauth-protected-resource)
- **API Catalog (RFC 9727)**: [`https://zenoa.in/.well-known/api-catalog`](https://zenoa.in/.well-known/api-catalog)
- **MCP Server Card (SEP-1649)**: [`https://zenoa.in/.well-known/mcp/server-card.json`](https://zenoa.in/.well-known/mcp/server-card.json)
- **Agent Skills Index (RFC v0.2.0)**: [`https://zenoa.in/.well-known/agent-skills/index.json`](https://zenoa.in/.well-known/agent-skills/index.json)
- **AI Resource Discovery (ARD)**: [`https://zenoa.in/.well-known/ai-catalog.json`](https://zenoa.in/.well-known/ai-catalog.json)

---

## 2. Dynamic Agent Registration Flow

Autonomous agents can register programmatic identities via the Dynamic Client Registration endpoint:

```http
POST /api/v1/agents/register HTTP/1.1
Host: zenoa.in
Content-Type: application/json

{
  "client_name": "Autonomous-Assistant-01",
  "identity_type": "ed25519_pubkey",
  "public_key": "MCowBQYDK2VwAyEA...",
  "scopes": ["zenoa:read", "zenoa:messages", "zenoa:bots"]
}
```

### Response
```json
{
  "client_id": "agent_zenoa_9f8c2b1a",
  "client_secret": "zsec_live_4a78bc91e4f3a...",
  "token_endpoint": "https://zenoa.in/api/v1/oauth/token",
  "expires_in": 2592000
}
```

---

## 3. Obtaining Access Tokens (Client Credentials Grant)

```http
POST /api/v1/oauth/token HTTP/1.1
Host: zenoa.in
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=agent_zenoa_9f8c2b1a&client_secret=zsec_live_4a78bc91e4f3a...&scope=zenoa:messages
```

### Response
```json
{
  "access_token": "zat_eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "zenoa:messages"
}
```

---

## 4. Authenticated API Calls

Include the Bearer token in the `Authorization` header for all requests:

```http
POST /api/v1/messages/send HTTP/1.1
Host: zenoa.in
Authorization: Bearer zat_eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "recipient": "alex",
  "content": "Automated status report from Agent-01",
  "ephemeral": true
}
```

---

## 5. Revocation and Rotation
- **Token Revocation Endpoint**: `https://zenoa.in/api/v1/agents/revoke`
- **Key Rotation**: Supported via Ed25519 signature headers (`X-Zenoa-Agent-Signature`).
