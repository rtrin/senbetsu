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
});
