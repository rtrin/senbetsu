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
    const custom = { ...DEFAULT_SETTINGS, tier: 'pro' as const, licenseKey: 'abc' };
    mockStore.senbetsu_settings = custom;

    const settings = await storage.getSettings();
    expect(settings.tier).toBe('pro');
    expect(settings.licenseKey).toBe('abc');
  });
});

describe('storage.updateSettings', () => {
  it('merges patch into existing settings', async () => {
    await storage.updateSettings({ tier: 'byok' });
    const settings = await storage.getSettings();
    expect(settings.tier).toBe('byok');
    expect(settings.dailyUsageCount).toBe(0);
  });
});

describe('storage.getUsageCount', () => {
  it('returns 0 when no usage recorded', async () => {
    const count = await storage.getUsageCount();
    expect(count).toBe(0);
  });

  it('returns stored count for today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      dailyUsageCount: 5,
      dailyUsageDate: today,
    };

    const count = await storage.getUsageCount();
    expect(count).toBe(5);
  });

  it('resets count when date is stale', async () => {
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      dailyUsageCount: 8,
      dailyUsageDate: '2020-01-01',
    };

    const count = await storage.getUsageCount();
    expect(count).toBe(0);
  });
});

describe('storage.incrementUsage', () => {
  it('increments from 0', async () => {
    await storage.incrementUsage();
    const count = await storage.getUsageCount();
    expect(count).toBe(1);
  });

  it('increments existing count for today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      dailyUsageCount: 3,
      dailyUsageDate: today,
    };

    await storage.incrementUsage();
    const count = await storage.getUsageCount();
    expect(count).toBe(4);
  });

  it('resets and increments when date is stale', async () => {
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      dailyUsageCount: 9,
      dailyUsageDate: '2020-01-01',
    };

    await storage.incrementUsage();
    const count = await storage.getUsageCount();
    expect(count).toBe(1);
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

describe('storage.activateTier', () => {
  it('saves tier and license key', async () => {
    await storage.activateTier('pro', 'license-abc');
    const settings = await storage.getSettings();
    expect(settings.tier).toBe('pro');
    expect(settings.licenseKey).toBe('license-abc');
  });
});

describe('storage.deactivate', () => {
  it('resets to free tier and clears keys', async () => {
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      tier: 'byok',
      licenseKey: 'abc',
      openaiApiKey: 'sk-123',
    };

    await storage.deactivate();
    const settings = await storage.getSettings();
    expect(settings.tier).toBe('free');
    expect(settings.licenseKey).toBeUndefined();
    expect(settings.openaiApiKey).toBeUndefined();
  });
});
