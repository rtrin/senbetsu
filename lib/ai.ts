import { OPENAI_API_KEY, OPENAI_MODEL } from './constants';
import {
  type ClassificationRequest,
  type ClassificationResponse,
  type ClassificationResult,
  type OpenAIChatRequest,
  type OpenAIChatResponse,
  TAB_CATEGORIES,
  type TabCategory,
} from './types';

const SYSTEM_PROMPT = `You are a tab classifier. Given a webpage's URL, title, description, and site name, classify it into exactly one category.

Categories: ${TAB_CATEGORIES.join(', ')}

Respond with JSON: { "category": "<category>" }
Choose the single best-fitting category. If unsure, use "Other".`;

function buildUserPrompt(req: ClassificationRequest): string {
  return [
    `URL: ${req.url}`,
    `Title: ${req.title}`,
    `Description: ${req.description}`,
    `Site: ${req.siteName}`,
  ].join('\n');
}

function isValidCategory(value: string): value is TabCategory {
  return (TAB_CATEGORIES as readonly string[]).includes(value);
}

export async function classifyTab(req: ClassificationRequest): Promise<ClassificationResult> {
  const body: OpenAIChatRequest = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(req) },
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
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const data: OpenAIChatResponse = await res.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed: ClassificationResponse = JSON.parse(content);
  const category = isValidCategory(parsed.category) ? parsed.category : 'Other';

  return { tabId: req.tabId, category };
}

export async function classifyTabs(
  requests: ClassificationRequest[],
): Promise<ClassificationResult[]> {
  const results = await Promise.allSettled(requests.map(classifyTab));

  return results
    .filter((r): r is PromiseFulfilledResult<ClassificationResult> => r.status === 'fulfilled')
    .map((r) => r.value);
}
