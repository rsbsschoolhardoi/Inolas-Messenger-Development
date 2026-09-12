---
name: zenoa-oauth
description: Instructions for AI agents to authenticate users, issue consent prompts, and exchange OAuth 2.0 authorization codes without email/phone harvesting.
---

# Zenoa OAuth 2.0 Skill for AI Agents

Zenoa OAuth allows users to log in securely to third-party applications using their sovereign `@zenoa` identity.

## Authentication Steps
1. Redirect user to `https://zenoa.in/sso?client_id=<ID>&redirect_uri=<URI>&response_type=code&scope=openid+profile`.
2. Exchange authorization code for tokens at `/api/v1/oauth/token`.
3. Fetch cryptographic user info at `/api/v1/oauth/userinfo`.
