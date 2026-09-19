import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import type { AIProvider, AppSettings } from './types';

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

type AnnotationMap = Record<string, string>;

const PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'gemini'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSettings(value: unknown): AppSettings {
  const raw = isRecord(value) ? value : {};
  const rawKeys = isRecord(raw.apiKeys) ? raw.apiKeys : {};
  const apiKeys: Partial<Record<AIProvider, string>> = {};

  for (const provider of PROVIDERS) {
    if (Object.hasOwn(rawKeys, provider)) {
      if (typeof rawKeys[provider] === 'string' && rawKeys[provider]) {
        apiKeys[provider] = rawKeys[provider];
      }
    } else if (provider === 'openai' && typeof raw.openaiApiKey === 'string' && raw.openaiApiKey) {
      apiKeys.openai = raw.openaiApiKey;
    }
  }

  const activeProvider: AIProvider = PROVIDERS.includes(raw.activeProvider as AIProvider)
    ? (raw.activeProvider as AIProvider)
    : 'openai';
  const {
    activeProvider: _activeProvider,
    apiKeys: _apiKeys,
    openaiApiKey: _legacyKey,
    ...rest
  } = raw;
  return { ...DEFAULT_SETTINGS, ...rest, activeProvider, apiKeys };
}

export async function setAnnotation(key: string, text: string): Promise<void> {
  const map = await get<AnnotationMap>(STORAGE_KEYS.annotations, {});
  const trimmed = text.trim();
  if (trimmed) map[key] = trimmed;
  else delete map[key];
  await set(STORAGE_KEYS.annotations, map);
}

export async function removeAnnotation(key: string): Promise<void> {
  const map = await get<AnnotationMap>(STORAGE_KEYS.annotations, {});
  if (!(key in map)) return;
  delete map[key];
  await set(STORAGE_KEYS.annotations, map);
}

export async function getAnnotation(key: string): Promise<string> {
  const map = await get<AnnotationMap>(STORAGE_KEYS.annotations, {});
  return map[key] ?? '';
}

export const storage = {
  async getSettings(): Promise<AppSettings> {
    return normalizeSettings(await get<unknown>(STORAGE_KEYS.settings, {}));
  },

  async updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    await set(STORAGE_KEYS.settings, {
      ...current,
      ...patch,
      apiKeys: { ...current.apiKeys, ...patch.apiKeys },
    });
  },

  async saveApiKey(provider: AIProvider, key: string | null): Promise<void> {
    const current = await this.getSettings();
    const apiKeys = { ...current.apiKeys };
    if (key === null) {
      delete apiKeys[provider];
    } else {
      apiKeys[provider] = key;
    }
    await set(STORAGE_KEYS.settings, { ...current, apiKeys });
  },

  async setActiveProvider(provider: AIProvider): Promise<void> {
    await this.updateSettings({ activeProvider: provider });
  },
};
