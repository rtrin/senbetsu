import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import type { AppSettings } from './types';

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
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

  async activate(licenseKey: string): Promise<void> {
    await this.updateSettings({ licenseKey });
  },

  async deactivate(): Promise<void> {
    await this.updateSettings({
      licenseKey: undefined,
      openaiApiKey: undefined,
    });
  },
};
