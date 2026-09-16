---
title: Zenoa Agent Authentication & Authorization Guide (auth.md)
description: Complete specification for AI agents, MCP clients, and autonomous bots to authenticate and interact with Zenoa Sovereign APIs.
date: 2026-09-16
url: https://zenoa.in/auth.md
agent_auth:
  version: "1.0"
  skill: "https://zenoa.in/auth.md"
  register_uri: "https://zenoa.in/api/v1/agents/register"
  claim_uri: "https://zenoa.in/api/v1/agents/claim"
  revocation_uri: "https://zenoa.in/api/v1/agents/revoke"
  supported_flows:
    - agent_verified
    - user_claimed
  supported_identity_types:
    - ephemeral_key
    - agent_did
    - ed25519_pubkey
  supported_credential_types:
    - bearer_token
    - mcp_token
    - api_key
---

# Zenoa Agent Authentication Specification (auth.md)

This document specifies the authentication protocol for autonomous AI agents, Model Context Protocol (MCP) clients, and vibe-coding assistants integrating with **Zenoa Sovereign Messenger & Developer APIs** (by Inolas Nexus).

---

## 1. Discovery Endpoints (RFC Standards)

All metadata documents conform to published IETF RFCs and AI discovery specifications:

- **OAuth 2.0 Authorization Server**: https://zenoa.in/.well-known/oauth-authorization-server
- **OAuth 2.0 Protected Resource**: https://zenoa.in/.well-known/oauth-protected-resource
- **OpenID Connect Discovery**: https://zenoa.in/.well-known/openid-configuration
- **RFC 9727 API Catalog**: https://zenoa.in/.well-known/api-catalog
- **OpenAPI 3.1 Specification**: https://zenoa.in/openapi.json
- **MCP Server Card (SEP-1649)**: https://zenoa.in/.well-known/mcp/server-card.json
- **A2A Agent Card**: https://zenoa.in/.well-known/agent-card.json
- **AI Resource Discovery**: https://zenoa.in/.well-known/ai-catalog.json

---

## 2. Autonomous Agent Registration Flow

Zenoa supports zero-touch autonomous agent registration and claim ceremonies conforming to the `auth.md` specification.

### Flow A: Agent-Verified Registration (ID-JAG / Identity Assertion)

Agents operating on behalf of a verified provider or holding an autonomous Ed25519 keypair can register directly without interactive human browser prompts.

#### Step 1: Agent Self-Registration
Send an HTTP POST request to the registration endpoint:

```http
POST /api/v1/agents/register HTTP/1.1
Host: zenoa.in
Content-Type: application/json
Accept: application/json

{
  "client_name": "Autonomous Agent Bot",
  "identity_type": "ephemeral_key",
  "public_key": "MCowBQYDK2VwAyEA...",
  "requested_scopes": ["zenoa:read", "zenoa:messages"]
}
```

#### Step 2: Service Issues Agent Credentials
The server verifies the payload and responds synchronously with scoped credentials:

```json
{
  "client_id": "zen_agent_7f8a9b",
  "access_token": "zat_eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "zenoa:read zenoa:messages",
  "claim_uri": "https://zenoa.in/api/v1/agents/claim"
}
```

### Flow B: User-Claimed Registration (OTP Confirmation Flow)

When an agent needs to associate with a human user account:

#### Step 1: Initiate Registration
The agent submits the user's sovereign handle or email to receive a pending registration:

```http
POST /api/v1/agents/register HTTP/1.1
Host: zenoa.in
Content-Type: application/json

{
  "client_name": "Coding Assistant Agent",
  "user_identifier": "alex",
  "flow": "user_claimed"
}
```

#### Step 2: User Confirms via Claim Code
The server returns a `pending_token` and triggers a confirmation notification to the user:

```json
{
  "status": "pending_claim",
  "claim_uri": "https://zenoa.in/api/v1/agents/claim",
  "user_code": "ZEN-8492"
}
```

The agent or user completes the claim:

```http
POST /api/v1/agents/claim HTTP/1.1
Host: zenoa.in
Content-Type: application/json

{
  "user_code": "ZEN-8492",
  "client_id": "zen_agent_7f8a9b"
}
```

---

## 3. Direct Service Account Keys (Recommended for Bots & Scripts)

Every registered application in the Zenoa Developer Console (https://zenoa.in/developer) is provisioned a Service Account credential pair:
- `X-Client-Id`: `zen_client_...`
- `X-Client-Secret`: `zen_sec_...`

Include these credentials in HTTP headers:

```http
POST /api/v1/messages/send HTTP/1.1
Host: zenoa.in
X-Client-Id: your_client_id
X-Client-Secret: your_client_secret
Content-Type: application/json

{
  "recipient": "alex",
  "message": "Deployment completed successfully."
}
```

Or authenticate via standard OAuth 2.0 Bearer token:

```http
Authorization: Bearer zat_your_token_here
```

---

## 4. Supported Scopes

- `zenoa:read` — Read conversations, status, and public profiles.
- `zenoa:write` — Manage agent settings and webhooks.
- `zenoa:messages` — Send sovereign encrypted and automated bot messages.
- `zenoa:bots` — Configure bot webhooks and handle events.
- `zenoa:webhooks` — Subscribe to real-time events.

---

## 5. Security & Isolation

- All agent operations are sandboxed to the permissions granted by the user or service account.
- Zero credential leakage: Tokens are signed with RS256 and verified against `https://zenoa.in/.well-known/jwks.json`.
- Rate limiting: Agents receive 120 requests/minute per client ID with adaptive burst capacity.
