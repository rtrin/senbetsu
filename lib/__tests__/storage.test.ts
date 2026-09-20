import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants';

const mockStore: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStore[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => Object.assign(mockStore, items)),
    },
  },
});

const { storage } = await import('../storage');

beforeEach(() => {
  for (const key of Object.keys(mockStore)) delete mockStore[key];
});

describe('storage.getSettings', () => {
  it('returns independent normalized defaults when nothing is stored', async () => {
    const settings = await storage.getSettings();
    settings.apiKeys.openai = 'changed';
    expect(DEFAULT_SETTINGS.apiKeys.openai).toBeUndefined();
  });

  it('migrates a legacy OpenAI key and preserves unrelated settings', async () => {
    mockStore.senbetsu_settings = { openaiApiKey: 'sk-legacy', customSetting: 'keep' };
    const settings = await storage.getSettings();
    expect(settings.apiKeys).toEqual({ openai: 'sk-legacy' });
    expect(settings.activeProvider).toBe('openai');
    expect(settings).toMatchObject({ customSetting: 'keep' });
  });

  it('prefers normalized keys and safely handles malformed provider storage', async () => {
    mockStore.senbetsu_settings = {
      activeProvider: 'invalid',
      openaiApiKey: 'sk-legacy',
      apiKeys: { openai: 'sk-new', anthropic: 42, gemini: '' },
    };
    const settings = await storage.getSettings();
    expect(settings.activeProvider).toBe('openai');
    expect(settings.apiKeys).toEqual({ openai: 'sk-new' });
  });

  it('defaults malformed automatic offload intervals to Off', async () => {
    for (const value of [0, 2, '1', Infinity, null, undefined]) {
      mockStore.senbetsu_settings = { autoOffloadInterval: value };
      await expect(storage.getSettings()).resolves.toMatchObject({ autoOffloadInterval: 'off' });
    }
  });

  it('normalizes each supported automatic offload interval', async () => {
    for (const value of [1, 3, 5] as const) {
      mockStore.senbetsu_settings = { autoOffloadInterval: value };
      await expect(storage.getSettings()).resolves.toMatchObject({ autoOffloadInterval: value });
    }
  });
});

describe('storage API keys', () => {
  it('keeps keys isolated and removes only the selected provider key', async () => {
    await storage.saveApiKey('openai', 'sk-openai');
    await storage.saveApiKey('anthropic', 'sk-ant');
    await storage.saveApiKey('openai', null);
    const settings = await storage.getSettings();
    expect(settings.apiKeys).toEqual({ anthropic: 'sk-ant' });
  });

  it('updates the selected provider without changing keys', async () => {
    await storage.saveApiKey('gemini', 'AIza-key');
    await storage.setActiveProvider('gemini');
    const settings = await storage.getSettings();
    expect(settings.activeProvider).toBe('gemini');
    expect(settings.apiKeys.gemini).toBe('AIza-key');
  });

  it('serializes overlapping settings changes without losing either field', async () => {
    await Promise.all([
      storage.updateSettings({ autoOffloadInterval: 3 }),
      storage.updateSettings({ maxGroups: 7 }),
    ]);

    await expect(storage.getSettings()).resolves.toMatchObject({
      autoOffloadInterval: 3,
      maxGroups: 7,
    });
  });

  it('re-reads and merges when another writer changes storage during a save', async () => {
    const setMock = chrome.storage.local.set as ReturnType<typeof vi.fn>;
    const originalSet = setMock.getMockImplementation()!;
    let writes = 0;
    setMock.mockImplementation(async (items: Record<string, unknown>) => {
      Object.assign(mockStore, items);
      writes += 1;
      if (writes === 1) {
        mockStore.senbetsu_settings = {
          ...(mockStore.senbetsu_settings as Record<string, unknown>),
          autoOffloadInterval: 'off',
          maxGroups: 9,
        };
      }
    });

    try {
      await storage.updateSettings({ autoOffloadInterval: 5 });
      await expect(storage.getSettings()).resolves.toMatchObject({
        autoOffloadInterval: 5,
        maxGroups: 9,
      });
      expect(writes).toBe(2);
    } finally {
      setMock.mockImplementation(originalSet);
    }
  });
});
