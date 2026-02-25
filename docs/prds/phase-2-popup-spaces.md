# Phase 2: Popup UI + Spaces (PRD)

## Overview
This phase introduces a minimal user interface via a browser extension popup and the underlying storage mechanisms to support "Spaces". Users will move from a purely passive experience (Phase 1) to an interactive one where they can view, manage, and override AI-generated tab groups.

## Core Features

### 1. Popup UI
- **Current Groups View:** Display a list of active tab groups currently managed by the extension.
- **Manual Override:** Let users manually move tabs between groups or rename the AI-generated group labels.
- **Spaces Overview:** Show a list of all defined spaces and allow users to select an active one.

### 2. Storage Layer
- **Technology:** `chrome.storage.local`
- **Data to Persist:**
  - Configured Spaces.
  - Manual overrides for tab groupings.
  - Saved folders/tabs.
  - User preferences (e.g., enable/disable auto-grouping).

### 3. Spaces Concept
- **Definition:** A "Space" is a contextual workspace (e.g., "Work", "Personal", "Research").
- **Functionality:** 
  - Each space can contain its own distinct set of tab groups.
  - Switching spaces could involve hiding/showing relevant tabs, changing the grouping strategy, or swapping out tab groups.
