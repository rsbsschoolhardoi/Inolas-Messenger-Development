---
name: secure-messaging
description: Instructions for AI agents to compose, encrypt, and dispatch zero-retention messages through Zenoa sovereign relays.
---

# Zenoa Secure Messaging Skill for AI Agents

This skill enables autonomous agents and MCP clients to send sovereign messages over Zenoa.

## Prerequisites
- Valid API key or OAuth 2.0 Bearer token (`zenoa:messages` scope).

## Protocol Overview
1. Establish recipient public key using `/api/v1/users/:username/keys`.
2. Encrypt payload using WebCrypto AES-256-GCM or ephemeral relay mode.
3. POST payload to `/api/v1/messages/send`.

```http
POST /api/v1/messages/send HTTP/1.1
Host: zenoa.in
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient": "target_user",
  "content": "Encrypted message content",
  "ephemeral": true
}
```
