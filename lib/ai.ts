import { OPENAI_API_KEY, OPENAI_MODEL } from './constants';
import type {
  BatchClassificationResponse,
  ClassificationResult,
  OpenAIChatRequest,
  OpenAIChatResponse,
  TabInfo,
} from './types';

function getSystemPrompt(userPrompt?: string): string {
  const base = `You are an intelligent tab organizer. You will receive a list of browser tabs with their URLs, titles, and page content.

Your job is to group them into logical clusters and give each group a short, descriptive name based on the actual content (e.g. "React Libraries", "Job Applications", "Cooking Recipes").

Rules:
- Aim for 3-7 groups total
- Group names should be concise (1-4 words) and specific to the content
- Every tab must be assigned to exactly one group
- Use tab IDs exactly as provided

Respond strictly in JSON format:
{ "groups": [{ "name": "<Group Name>", "tabIds": [<id>, ...] }] }`;

  if (userPrompt?.trim()) {
    return `${base}\n\nUSER INSTRUCTION: Group the tabs based on: "${userPrompt.trim()}"`;
  }

  return base;
}

const MAX_CONTENT_CHARS = 60_000;

function buildTabList(tabs: TabInfo[]): string {
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
  tabs: TabInfo[],
  userPrompt?: string,
): Promise<ClassificationResult[]> {
  if (tabs.length === 0) return [];

  const body: OpenAIChatRequest = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt(userPrompt) },
      { role: 'user', content: buildTabList(tabs) },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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

  let parsed: BatchClassificationResponse;
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
