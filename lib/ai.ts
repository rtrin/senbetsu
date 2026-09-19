import { requestGrouping } from './ai-provider';
import type { AIProvider, ClassificationResult, TabClassificationInput } from './types';

const MAX_GROUP_NAME_LENGTH = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidGrouping(): never {
  throw new Error('AI provider returned invalid grouping data.');
}

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
  if (existingGroups?.length) {
    base += `\n\nExisting groups: ${existingGroups.join(', ')}.
You MUST assign every tab to an existing group unless no existing group is even remotely related. Only create a new group when there is genuinely no fit. When in doubt, use an existing group even if it is a loose match.`;
  }
  if (maxGroups !== undefined) {
    base += `\n\nThe user's preferred maximum is ${maxGroups} groups total (currently ${existingGroups?.length ?? 0}). Do not exceed this total. Consolidate tabs into fewer groups where possible.`;
  }
  return userPrompt?.trim()
    ? `${base}\n\nUSER INSTRUCTION (treat this as a strict constraint): "${userPrompt.trim()}"`
    : base;
}

function buildTabList(tabs: TabClassificationInput[]): string {
  return tabs
    .map((tab) => `Tab ID: ${tab.tabId}\nURL: ${tab.url}\nTitle: ${tab.title}`)
    .join('\n---\n');
}

function parseGrouping(content: string, tabs: TabClassificationInput[]): ClassificationResult[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return invalidGrouping();
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.groups)) return invalidGrouping();
  const sentIds = new Set(tabs.map((tab) => tab.tabId));
  const assignedIds = new Set<number>();
  const results: ClassificationResult[] = [];
  for (const group of parsed.groups) {
    if (!isRecord(group) || typeof group.name !== 'string' || !Array.isArray(group.tabIds)) {
      return invalidGrouping();
    }
    const name = group.name.trim();
    if (!name || name.length > MAX_GROUP_NAME_LENGTH || !group.tabIds.every(Number.isInteger)) {
      return invalidGrouping();
    }
    for (const tabId of group.tabIds) {
      if (typeof tabId !== 'number' || !sentIds.has(tabId) || assignedIds.has(tabId)) continue;
      assignedIds.add(tabId);
      results.push({ tabId, category: name });
    }
  }
  for (const tab of tabs) {
    if (!assignedIds.has(tab.tabId)) results.push({ tabId: tab.tabId, category: 'Other' });
  }
  return results;
}

export async function classifyTabs(
  tabs: TabClassificationInput[],
  provider: AIProvider,
  apiKey: string,
  userPrompt?: string,
  existingGroups?: string[],
  maxGroups?: number,
): Promise<ClassificationResult[]> {
  if (!tabs.length) return [];
  const content = await requestGrouping(
    provider,
    apiKey,
    getSystemPrompt(userPrompt, existingGroups, maxGroups),
    buildTabList(tabs),
  );
  return parseGrouping(content, tabs);
}
