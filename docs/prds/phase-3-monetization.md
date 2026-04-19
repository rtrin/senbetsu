# Phase 3: Monetization (PRD)

## Overview

~~Originally introduced a $5 BYOK lifetime license via LemonSqueezy.~~

**Updated:** All features are now completely free. Monetization is via voluntary Ko-fi donations at https://ko-fi.com/8bits.

## BYOK Flow
- Settings tab in the extension has an OpenAI API key input field (no license required).
- Key stored in `chrome.storage.local`—never sent to our servers.
- All AI calls go directly from the extension to `api.openai.com` using the user's key.
