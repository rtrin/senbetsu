import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants';

const mockStore: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStore[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStore, items);
      }),
    },
  },
});

// Import after mocking chrome
const { storage } = await import('../storage');

beforeEach(() => {
  for (const key of Object.keys(mockStore)) {
    delete mockStore[key];
  }
});

describe('storage.getSettings', () => {
  it('returns default settings when nothing is stored', async () => {
    const settings = await storage.getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('returns stored settings', async () => {
    const custom = { ...DEFAULT_SETTINGS, licenseKey: 'abc', openaiApiKey: 'sk-123' };
    mockStore.senbetsu_settings = custom;

    const settings = await storage.getSettings();
    expect(settings.licenseKey).toBe('abc');
    expect(settings.openaiApiKey).toBe('sk-123');
  });
});

describe('storage.updateSettings', () => {
  it('merges patch into existing settings', async () => {
    await storage.updateSettings({ openaiApiKey: 'sk-test' });
    const settings = await storage.getSettings();
    expect(settings.openaiApiKey).toBe('sk-test');
    expect(settings.bookmarkAutoClose).toBe(true);
  });
});

describe('storage.saveApiKey', () => {
  it('saves an API key', async () => {
    await storage.saveApiKey('sk-test123');
    const settings = await storage.getSettings();
    expect(settings.openaiApiKey).toBe('sk-test123');
  });

  it('removes API key when null', async () => {
    mockStore.senbetsu_settings = { ...DEFAULT_SETTINGS, openaiApiKey: 'sk-old' };

    await storage.saveApiKey(null);
    const settings = await storage.getSettings();
    expect(settings.openaiApiKey).toBeUndefined();
  });
});

describe('storage.activate', () => {
  it('saves license key', async () => {
    await storage.activate('license-abc');
    const settings = await storage.getSettings();
    expect(settings.licenseKey).toBe('license-abc');
  });
});

describe('storage.deactivate', () => {
  it('clears license key and API key', async () => {
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      licenseKey: 'abc',
      openaiApiKey: 'sk-123',
    };

    await storage.deactivate();
    const settings = await storage.getSettings();
    expect(settings.licenseKey).toBeUndefined();
    expect(settings.openaiApiKey).toBeUndefined();
  });
});
