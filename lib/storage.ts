import { DEFAULT_SETTINGS, MAX_SAVED_SESSIONS, STORAGE_KEYS } from './constants';
import type { AppSettings, TabSession, TabSnapshot } from './types';

async function get<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export const storage = {
  async getSettings(): Promise<AppSettings> {
    return get(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  },

  async updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const current = await storage.getSettings();
    await set(STORAGE_KEYS.settings, { ...current, ...patch });
  },

  async getSessions(): Promise<TabSession[]> {
    return get(STORAGE_KEYS.sessions, []);
  },

  async saveSession(session: TabSession): Promise<void> {
    const sessions = await storage.getSessions();
    const updated = [session, ...sessions].slice(0, MAX_SAVED_SESSIONS);
    await set(STORAGE_KEYS.sessions, updated);
  },

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await storage.getSessions();
    const updated = sessions.filter((s) => s.id !== sessionId);
    await set(STORAGE_KEYS.sessions, updated);
  },

  async updateLatestSession(newTabs: TabSnapshot[]): Promise<void> {
    const sessions = await storage.getSessions();
    if (sessions.length === 0) return;

    const latest = sessions[0];

    // Create a map to ensure unique URLs, favoring the new categories
    const urlMap = new Map<string, TabSnapshot>();
    for (const tab of latest.tabs) {
      urlMap.set(tab.url, tab);
    }
    for (const tab of newTabs) {
      urlMap.set(tab.url, tab);
    }

    const updatedLatest: TabSession = {
      ...latest,
      tabs: Array.from(urlMap.values()),
    };

    const updatedSessions = [updatedLatest, ...sessions.slice(1)];
    await set(STORAGE_KEYS.sessions, updatedSessions);
  },
};
