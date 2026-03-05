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
  tabs: {
    get: vi.fn(),
    remove: vi.fn(),
    query: vi.fn(),
    update: vi.fn(),
  },
  bookmarks: {
    create: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  tabGroups: {
    query: vi.fn(),
  },
  windows: {
    update: vi.fn(),
  },
  runtime: {
    id: 'test-extension-id',
  },
});

vi.mock('../ai', () => ({
  classifyTabs: vi.fn(),
  classifyTabsViaProxy: vi.fn(),
}));

vi.mock('../grouping', () => ({
  applyClassifications: vi.fn(),
  moveTabToGroup: vi.fn(),
}));

vi.mock('../license', () => ({
  activateLicense: vi.fn(),
  deactivateLicense: vi.fn(),
}));

vi.mock('../memory', () => ({
  measureTabMemory: vi.fn(),
}));

const { handleBookmarkTab } = await import('../commands');

const mockTab = {
  id: 1,
  index: 0,
  pinned: false,
  highlighted: false,
  windowId: 1,
  active: true,
  incognito: false,
  selected: false,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  title: 'Example',
  url: 'https://example.com',
};

beforeEach(() => {
  for (const key of Object.keys(mockStore)) {
    delete mockStore[key];
  }
  vi.clearAllMocks();
});

describe('handleBookmarkTab', () => {
  it('creates a bookmark in the Bookmarks Bar with tab title and URL', async () => {
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTab);
    (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.bookmarks.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '10' });

    const result = await handleBookmarkTab(1);

    expect(result).toEqual({ ok: true });
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '1',
      title: 'Example',
      url: 'https://example.com',
    });
  });

  it('closes the tab when bookmarkAutoClose is true (default)', async () => {
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTab);
    (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.bookmarks.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '10' });

    await handleBookmarkTab(1);

    expect(chrome.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('does NOT close the tab when bookmarkAutoClose is explicitly false', async () => {
    mockStore.senbetsu_settings = { ...DEFAULT_SETTINGS, bookmarkAutoClose: false };
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTab);
    (chrome.bookmarks.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '10' });

    await handleBookmarkTab(1);

    expect(chrome.tabs.remove).not.toHaveBeenCalled();
  });

  it('returns error when chrome.tabs.get fails', async () => {
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Tab not found'));

    const result = await handleBookmarkTab(999);

    expect(result).toEqual({ ok: false, error: 'Error: Tab not found' });
  });
});
