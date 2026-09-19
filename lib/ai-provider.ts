import type { AIProvider } from './types';

export interface AIProviderMetadata {
  label: string;
  keyLabel: string;
  placeholder: string;
  helpUrl: string;
  helpText: string;
}

export const AI_PROVIDER_METADATA: Record<AIProvider, AIProviderMetadata> = {
  openai: {
    label: 'OpenAI',
    keyLabel: 'OpenAI API Key',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: 'Get one at platform.openai.com',
  },
  anthropic: {
    label: 'Anthropic',
    keyLabel: 'Claude API Key',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpText: 'Get one at console.anthropic.com',
  },
  gemini: {
    label: 'Google',
    keyLabel: 'Gemini API Key',
    placeholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpText: 'Get one at Google AI Studio',
  },
};

const REQUEST_TIMEOUT_MS = 30_000;
export const ANTHROPIC_MODEL = 'claude-sonnet-5';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function extractOpenAIText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.choices) || !isRecord(data.choices[0])) return null;
  const message = data.choices[0].message;
  return isRecord(message) ? getText(message.content) : null;
}

function extractAnthropicText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.content)) return null;
  const text = data.content
    .filter(isRecord)
    .filter((block) => block.type === 'text')
    .map((block) => getText(block.text))
    .filter((block): block is string => block !== null)
    .join('\n');
  return getText(text);
}

function extractGeminiText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.candidates)) return null;
  const candidate = data.candidates.find((item) => isRecord(item) && item.finishReason === 'STOP');
  if (
    !isRecord(candidate) ||
    !isRecord(candidate.content) ||
    !Array.isArray(candidate.content.parts)
  ) {
    return null;
  }
  return getText(
    candidate.content.parts
      .filter(isRecord)
      .map((part) => getText(part.text))
      .filter((part): part is string => part !== null)
      .join('\n'),
  );
}

async function postJson(
  provider: AIProvider,
  endpoint: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new Error(
        controller.signal.aborted
          ? `${AI_PROVIDER_METADATA[provider].label} request timed out.`
          : `${AI_PROVIDER_METADATA[provider].label} request failed.`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `${AI_PROVIDER_METADATA[provider].label} API request failed (${response.status}).`,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new Error(`${AI_PROVIDER_METADATA[provider].label} returned an invalid response.`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function requestAnthropic(
  apiKey: string,
  system: string,
  user: string,
): Promise<string | null> {
  const data = await postJson(
    'anthropic',
    'https://api.anthropic.com/v1/messages',
    {
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    },
    {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
  );
  return extractAnthropicText(data);
}

async function requestGemini(apiKey: string, system: string, user: string): Promise<string | null> {
  const data = await postJson(
    'gemini',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    },
    { 'x-goog-api-key': apiKey },
  );
  return extractGeminiText(data);
}

async function requestOpenAI(apiKey: string, system: string, user: string): Promise<string | null> {
  const data = await postJson(
    'openai',
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    },
    { Authorization: `Bearer ${apiKey}` },
  );
  return extractOpenAIText(data);
}

export async function requestGrouping(
  provider: AIProvider,
  apiKey: string,
  system: string,
  user: string,
): Promise<string> {
  const content =
    provider === 'anthropic'
      ? await requestAnthropic(apiKey, system, user)
      : provider === 'gemini'
        ? await requestGemini(apiKey, system, user)
        : await requestOpenAI(apiKey, system, user);
  if (!content)
    throw new Error(`${AI_PROVIDER_METADATA[provider].label} returned no usable response.`);
  return content;
}
