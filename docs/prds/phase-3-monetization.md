# Phase 3: Monetization & Auth (PRD)

## Overview
Introduce a monetization strategy featuring a freemium model with tier gating, user authentication, and an option for power users to use their own API keys (BYOK).

## Core Features

### 1. Backend Infrastructure
- **Technology:** Supabase (PostgreSQL, Auth, Edge Functions) or a similar lightweight server.
- **Responsibilities:**
  - Securely manage user authentication.
  - Track credit usage for free tier users.
  - Proxy AI API calls to protect the main project API key.

### 2. BYOK (Bring Your Own Key) Flow
- Provide a settings page within the extension options.
- Allow users to input their own LLM API key (e.g., OpenAI, Anthropic).
- **Security:** Store this key explicitly in `chrome.storage.local` so it never leaves the user's local machine. Bypass the centralized proxy if a local key is present.

### 3. Tier Gating
- **Free Tier:** Limited usage (e.g., 1 space, 5 AI grouping credits per day/month).
- **Pro Tier:** Unlimited usage.
- **BYOK Tier:** Key passthrough functionality.

### 4. Payment Integration
- **Technology:** Stripe Checkout or similar.
- **Pricing Model:**
  - $5/month subscription for Pro tier.
  - $19 one-time purchase option.
