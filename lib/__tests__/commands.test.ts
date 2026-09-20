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
    getTree: vi.fn(),
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

const { handleBookmarkTab, handleSaveAndGroup, handleUpdateSettings } = await import('../commands');
const { classifyTabs } = await import('../ai');

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
  (chrome.bookmarks.getTree as ReturnType<typeof vi.fn>).mockResolvedValue([
    { id: 'root', children: [{ id: 'toolbar-root', folderType: 'bookmarks-bar' }] },
  ]);
});

describe('handleBookmarkTab', () => {
  it('creates a bookmark in the Bookmarks Bar with tab title and URL', async () => {
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTab);
    (chrome.tabs.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (chrome.bookmarks.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '10' });

    const result = await handleBookmarkTab(1);

    expect(result).toEqual({ ok: true });
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: 'toolbar-root',
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

  it('returns an error without creating a bookmark when the Bookmarks Bar is missing', async () => {
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTab);
    (chrome.bookmarks.getTree as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'root' }]);

    const result = await handleBookmarkTab(1);

    expect(result).toEqual({ ok: false, error: 'Error: Bookmarks Bar root folder is missing.' });
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  it('returns an error without creating a bookmark for an ambiguous Bookmarks Bar root', async () => {
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockTab);
    (chrome.bookmarks.getTree as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'root',
        children: [
          { id: 'toolbar-one', folderType: 'bookmarks-bar' },
          { id: 'toolbar-two', folderType: 'bookmarks-bar' },
        ],
      },
    ]);

    const result = await handleBookmarkTab(1);

    expect(result).toEqual({
      ok: false,
      error: 'Error: Bookmarks tree has multiple Bookmarks Bar root folders.',
    });
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });
});

describe('AI grouping provider selection', () => {
  it('reports a missing key for the selected provider', async () => {
    mockStore.senbetsu_settings = { ...DEFAULT_SETTINGS, activeProvider: 'gemini' };
    await expect(handleSaveAndGroup()).resolves.toEqual({
      ok: false,
      error: 'Add your Gemini API Key in Settings to use AI grouping.',
    });
  });

  it('passes the active provider and its key to classification', async () => {
    mockStore.senbetsu_settings = {
      ...DEFAULT_SETTINGS,
      activeProvider: 'anthropic',
      apiKeys: { anthropic: 'sk-ant' },
    };
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([mockTab]);
    (chrome.tabGroups.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (classifyTabs as ReturnType<typeof vi.fn>).mockResolvedValue([{ tabId: 1, category: 'Other' }]);

    await expect(handleSaveAndGroup()).resolves.toEqual({ ok: true });
    expect(classifyTabs).toHaveBeenCalledWith(
      expect.any(Array),
      'anthropic',
      'sk-ant',
      undefined,
      [],
      5,
    );
  });
});

describe('settings mutations', () => {
  it('does not let a second writer commit between the first read and write', async () => {
    mockStore.senbetsu_settings = { ...DEFAULT_SETTINGS };
    const getMock = chrome.storage.local.get as ReturnType<typeof vi.fn>;
    const initialSettings = {
      ...(mockStore.senbetsu_settings as Record<string, unknown>),
    };
    let releaseRead: ((value: Record<string, unknown>) => void) | undefined;
    getMock.mockImplementationOnce(
      (key: string) =>
        new Promise((resolve) => {
          releaseRead = (value) => resolve({ [key]: value });
        }),
    );

    const first = handleUpdateSettings({ autoOffloadInterval: 3 });
    await vi.waitFor(() => expect(releaseRead).toBeTypeOf('function'));
    const second = handleUpdateSettings({ maxGroups: 7 });
    await Promise.resolve();
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
    releaseRead?.(initialSettings as Record<string, unknown>);

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(mockStore.senbetsu_settings).toMatchObject({
      autoOffloadInterval: 3,
      maxGroups: 7,
    });
  });
});
