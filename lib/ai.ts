import { OPENAI_MODEL, PROXY_BASE_URL } from './constants';
import type {
  AIGroupingResponse,
  ClassificationResult,
  OpenAIChatRequest,
  OpenAIChatResponse,
  TabClassificationInput,
} from './types';

function getSystemPrompt(userPrompt?: string, existingGroups?: string[]): string {
  let base = `You are an intelligent tab organizer. You will receive a list of browser tabs with their URLs, titles, and page content.

Your job is to group them into logical clusters and give each group a short, descriptive name based on the actual content (e.g. "React Libraries", "Job Applications", "Cooking Recipes").

Rules:
- Aim for 3-7 groups total
- Group names should be concise (1-4 words) and specific to the content
- Every tab must be assigned to exactly one group
- Use tab IDs exactly as provided

Respond strictly in JSON format:
{ "groups": [{ "name": "<Group Name>", "tabIds": [<id>, ...] }] }`;

  if (existingGroups && existingGroups.length > 0) {
    base += `\n\nThese groups already exist: ${existingGroups.join(', ')}.\nPrefer assigning tabs to these existing groups when the content is a good fit.\nYou may create new groups if tabs don't fit any existing category.`;
  }

  if (userPrompt?.trim()) {
    return `${base}\n\nUSER INSTRUCTION: Group the tabs based on: "${userPrompt.trim()}"`;
  }

  return base;
}

const MAX_CONTENT_CHARS = 60_000;

function buildTabList(tabs: TabClassificationInput[]): string {
  let totalContent = 0;
  return tabs
    .map((t) => {
      const lines = [`Tab ID: ${t.tabId}`, `URL: ${t.url}`, `Title: ${t.title}`];
      const snippet = t.bodyText.trim();
      if (snippet && totalContent < MAX_CONTENT_CHARS) {
        const allowed = Math.min(snippet.length, MAX_CONTENT_CHARS - totalContent);
        lines.push(`Content: ${snippet.slice(0, allowed)}`);
        totalContent += allowed;
      }
      return lines.join('\n');
    })
    .join('\n---\n');
}

export async function classifyTabs(
  tabs: TabClassificationInput[],
  apiKey: string,
  userPrompt?: string,
  existingGroups?: string[],
): Promise<ClassificationResult[]> {
  if (tabs.length === 0) return [];

  const body: OpenAIChatRequest = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt(userPrompt, existingGroups) },
      { role: 'user', content: buildTabList(tabs) },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText} — ${errBody}`);
  }

  const data: OpenAIChatResponse = await res.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  let parsed: AIGroupingResponse;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Failed to parse OpenAI response: ${content.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.groups)) {
    throw new Error('Invalid response: missing groups array');
  }

  // Validate tab IDs against what we sent
  const sentIds = new Set(tabs.map((t) => t.tabId));
  const assignedIds = new Set<number>();
  const results: ClassificationResult[] = [];

  for (const group of parsed.groups) {
    const name = typeof group.name === 'string' && group.name.trim() ? group.name.trim() : 'Other';
    for (const tabId of group.tabIds) {
      if (!sentIds.has(tabId) || assignedIds.has(tabId)) continue;
      assignedIds.add(tabId);
      results.push({ tabId, category: name });
    }
  }

  // Assign unmatched tabs to "Other"
  for (const tab of tabs) {
    if (!assignedIds.has(tab.tabId)) {
      results.push({ tabId: tab.tabId, category: 'Other' });
    }
  }

  return results;
}

/**
 * Classify tabs via the Vercel proxy (used for free/pro tiers).
 * The proxy adds the OpenAI API key server-side.
 */
export async function classifyTabsViaProxy(
  tabs: TabClassificationInput[],
  userPrompt?: string,
  existingGroups?: string[],
): Promise<ClassificationResult[]> {
  if (tabs.length === 0) return [];

  const res = await fetch(`${PROXY_BASE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabs, userPrompt, existingGroups }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Proxy error: ${res.status} — ${errBody}`);
  }

  const parsed: AIGroupingResponse = await res.json();

  if (!Array.isArray(parsed.groups)) {
    throw new Error('Invalid proxy response: missing groups array');
  }

  // Validate tab IDs against what we sent
  const sentIds = new Set(tabs.map((t) => t.tabId));
  const assignedIds = new Set<number>();
  const results: ClassificationResult[] = [];

  for (const group of parsed.groups) {
    const name = typeof group.name === 'string' && group.name.trim() ? group.name.trim() : 'Other';
    for (const tabId of group.tabIds) {
      if (!sentIds.has(tabId) || assignedIds.has(tabId)) continue;
      assignedIds.add(tabId);
      results.push({ tabId, category: name });
    }
  }

  // Assign unmatched tabs to "Other"
  for (const tab of tabs) {
    if (!assignedIds.has(tab.tabId)) {
      results.push({ tabId: tab.tabId, category: 'Other' });
    }
  }

  return results;
}

export async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
