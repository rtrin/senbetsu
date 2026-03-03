import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants';
import type { AppSettings, UserTier } from './types';

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export const storage = {
  async getSettings(): Promise<AppSettings> {
    return get<AppSettings>(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS });
  },

  async updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    await set(STORAGE_KEYS.settings, { ...current, ...patch });
  },

  async getUsageCount(): Promise<number> {
    const settings = await this.getSettings();
    if (settings.dailyUsageDate !== todayString()) {
      await this.updateSettings({ dailyUsageCount: 0, dailyUsageDate: todayString() });
      return 0;
    }
    return settings.dailyUsageCount;
  },

  async incrementUsage(): Promise<void> {
    const settings = await this.getSettings();
    const today = todayString();
    const count = settings.dailyUsageDate === today ? settings.dailyUsageCount : 0;
    await this.updateSettings({ dailyUsageCount: count + 1, dailyUsageDate: today });
  },

  async saveApiKey(key: string | null): Promise<void> {
    if (key === null) {
      await this.updateSettings({ openaiApiKey: undefined });
    } else {
      await this.updateSettings({ openaiApiKey: key });
    }
  },

  async activateTier(tier: UserTier, licenseKey?: string): Promise<void> {
    await this.updateSettings({ tier, licenseKey });
  },

  async deactivate(): Promise<void> {
    await this.updateSettings({
      tier: 'free',
      licenseKey: undefined,
      openaiApiKey: undefined,
    });
  },
};
