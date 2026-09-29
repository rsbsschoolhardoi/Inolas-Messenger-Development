---
title: Zenoa Agent Authentication & Authorization Guide (auth.md)
description: Complete specification for AI agents, MCP clients, and autonomous bots to authenticate and interact with Zenoa Sovereign Developer & Business AI APIs.
date: 2026-09-29
url: https://zenoa.in/auth.md
agent_auth:
  version: "2.5"
  skill: "https://zenoa.in/auth.md"
  openapi: "https://zenoa.in/openapi.json"
  supported_auth_schemes:
    - bearer_api_key
    - header_api_key
  supported_tiers:
    - messenger
    - business
    - hybrid
---

# Zenoa Agent Authentication Specification (auth.md)

This document specifies the authentication protocol for autonomous AI agents, Model Context Protocol (MCP) clients, and vibe-coding assistants integrating with **Zenoa Sovereign Messenger & Developer APIs** (by Inolas Nexus).

---

## 1. Unified Authentication Protocol

All Zenoa APIs use a unified **API Key** authentication scheme. Agents and backend microservices authenticate their requests using either:

### Method A: HTTP Bearer Authorization (Standard)
```http
POST /api/v1/otp/send HTTP/1.1
Host: zenoa.in
Authorization: Bearer YOUR_ZENOA_API_KEY
Content-Type: application/json
```

### Method B: Custom Header (`X-Zenoa-Api-Key`)
```http
POST /api/business/chat HTTP/1.1
Host: zenoa.in
X-Zenoa-Api-Key: YOUR_ZENOA_API_KEY
Content-Type: application/json
```

---

## 2. API Capabilities by Developer Category

| Tier | Primary Capability | Available Endpoints |
|---|---|---|
| **Messenger** (`messenger`) | High-speed Carrier OTP & Bot Notifications | `/api/v1/otp/send`, `/api/v1/otp/verify`, `/api/v1/bot/send` |
| **Business Suite** (`business`) | Autonomous AI Concierge & Storefront Widget | `/api/business/chat`, `/api/business/conversations/:id`, `/widget/live-chat.js` |
| **Hybrid Gateway** (`hybrid`) | Omnichannel Multi-Modal Integration | Full Access (OTP + Bot DMs + Business AI Copilot + Analytics) |

---

## 3. Autonomous AI Agent Discovery Endpoints

- **OpenAPI 3.1.0 Specification**: `https://zenoa.in/openapi.json`
- **Agent Specification (auth.md)**: `https://zenoa.in/auth.md`
- **LLM Manifest**: `https://zenoa.in/llms.txt`
- **LLM Full Documentation**: `https://zenoa.in/llms-full.txt`
- **Service Health Check**: `https://zenoa.in/api/health`
- **Developer Console**: `https://zenoa.in/developer`
