# Phase 3: Monetization & Auth (PRD)

## Overview
Introduce a monetization strategy featuring a freemium model with tier gating, user authentication, and an option for power users to use their own API keys (BYOK).

## Current Pricing

**BYOK lifetime license — $5 one-time** via LemonSqueezy.

All core features are free (drag & drop, memory tracking, folder workspaces, annotations, copy links as markdown). AI tab grouping requires a BYOK license. Users provide their own OpenAI API key; it's stored in `chrome.storage.local` and never leaves the user's machine. No backend proxy, no subscriptions.

## BYOK Flow
- Settings tab in the extension has an OpenAI API key input field.
- Key stored in `chrome.storage.local`—never sent to our servers.
- All AI calls go directly from the extension to `api.openai.com` using the user's key.
