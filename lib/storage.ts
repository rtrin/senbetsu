import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import type { AppSettings } from './types';

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

type AnnotationMap = Record<string, string>;

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
    return get<AppSettings>(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS });
  },

  async updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    await set(STORAGE_KEYS.settings, { ...current, ...patch });
  },

  async saveApiKey(key: string | null): Promise<void> {
    if (key === null) {
      await this.updateSettings({ openaiApiKey: undefined });
    } else {
      await this.updateSettings({ openaiApiKey: key });
    }
  },
};
