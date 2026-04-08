import { OPENAI_MODEL } from './constants';
import type {
  AIGroupingResponse,
  ClassificationResult,
  OpenAIChatRequest,
  OpenAIChatResponse,
  TabClassificationInput,
} from './types';

function getSystemPrompt(
  userPrompt?: string,
  existingGroups?: string[],
  maxGroups?: number,
): string {
  let base = `You are an intelligent tab organizer. You will receive a list of browser tabs with their URLs and titles.

Your job is to group them into logical clusters and give each group a short, descriptive name (e.g. "React Libraries", "Job Applications", "Cooking Recipes").

Rules:
- Group names should be concise (1-4 words) and specific to the content
- Every tab must be assigned to exactly one group
- Use tab IDs exactly as provided

Respond strictly in JSON format:
{ "groups": [{ "name": "<Group Name>", "tabIds": [<id>, ...] }] }`;

  if (existingGroups && existingGroups.length > 0) {
    base += `\n\nExisting groups: ${existingGroups.join(', ')}.
You MUST assign every tab to an existing group unless no existing group is even remotely related. Only create a new group when there is genuinely no fit. When in doubt, use an existing group even if it is a loose match.`;
  }

  if (maxGroups !== undefined) {
    const current = existingGroups?.length ?? 0;
    base += `\n\nThe user's preferred maximum is ${maxGroups} groups total (currently ${current}). Do not exceed this total. Consolidate tabs into fewer groups where possible.`;
  }

  if (userPrompt?.trim()) {
    return `${base}\n\nUSER INSTRUCTION (treat this as a strict constraint): "${userPrompt.trim()}"`;
  }

  return base;
}

function buildTabList(tabs: TabClassificationInput[]): string {
  return tabs.map((t) => `Tab ID: ${t.tabId}\nURL: ${t.url}\nTitle: ${t.title}`).join('\n---\n');
}

export async function classifyTabs(
  tabs: TabClassificationInput[],
  apiKey: string,
  userPrompt?: string,
  existingGroups?: string[],
  maxGroups?: number,
): Promise<ClassificationResult[]> {
  if (tabs.length === 0) return [];

  const body: OpenAIChatRequest = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt(userPrompt, existingGroups, maxGroups) },
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
