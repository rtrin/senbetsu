import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants';

const mockStore: Record<string, unknown> = {};
const mockBookmarkNodes: Record<string, unknown[]> = {};
const onUpdatedListeners: Array<(tabId: number, info: chrome.tabs.OnUpdatedInfo) => void> = [];

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
    create: vi.fn(),
    group: vi.fn(),
    query: vi.fn(),
    update: vi.fn(),
    discard: vi.fn(),
    onUpdated: {
      addListener: vi.fn((fn: (tabId: number, info: chrome.tabs.OnUpdatedInfo) => void) => {
        onUpdatedListeners.push(fn);
      }),
      removeListener: vi.fn((fn: (tabId: number, info: chrome.tabs.OnUpdatedInfo) => void) => {
        const idx = onUpdatedListeners.indexOf(fn);
        if (idx >= 0) onUpdatedListeners.splice(idx, 1);
      }),
    },
  },
  tabGroups: {
    update: vi.fn(),
    query: vi.fn(async () => []),
  },
  bookmarks: {
    create: vi.fn(),
    getTree: vi.fn(),
    getChildren: vi.fn(async (id: string) => mockBookmarkNodes[id] ?? []),
    get: vi.fn(async (id: string) => {
      // Search all nodes for the given id (mock implementation)
      for (const nodes of Object.values(mockBookmarkNodes)) {
        const found = (nodes as Array<{ id: string }>).find((n) => n.id === id);
        if (found) return [found];
      }
      return [];
    }),
    removeTree: vi.fn(),
  },
  windows: { update: vi.fn() },
  runtime: { id: 'test-extension-id' },
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

const {
  handleSaveGroupToFolder,
  handleGetBookmarkFolders,
  handleOpenFolderAsGroup,
  handleOpenBookmark,
} = await import('../commands');

const mockFn = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

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
  groupId: 1,
  title: 'Page',
  url: 'https://example.com',
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mockStore)) delete mockStore[key];
  for (const key of Object.keys(mockBookmarkNodes)) delete mockBookmarkNodes[key];
  onUpdatedListeners.length = 0;
  mockFn(chrome.bookmarks.getTree).mockResolvedValue([
    { id: 'root', children: [{ id: 'toolbar-root', folderType: 'bookmarks-bar' }] },
  ]);
});

describe('handleSaveGroupToFolder', () => {
  it('creates a folder with bookmarks for each tab', async () => {
    mockFn(chrome.bookmarks.create)
      .mockResolvedValueOnce({ id: '100', title: 'Dev' })
      .mockResolvedValue({});
    mockFn(chrome.tabs.get)
      .mockResolvedValueOnce({ ...mockTab, id: 1, title: 'Page A', url: 'https://a.com' })
      .mockResolvedValueOnce({ ...mockTab, id: 2, title: 'Page B', url: 'https://b.com' });

    const result = await handleSaveGroupToFolder([1, 2], 'Dev');

    expect(result.ok).toBe(true);
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: 'toolbar-root',
      title: 'Dev',
    });
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '100',
      title: 'Page A',
      url: 'https://a.com',
    });
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: '100',
      title: 'Page B',
      url: 'https://b.com',
    });
  });

  it('closes tabs when bookmarkAutoClose is true', async () => {
    mockStore.senbetsu_settings = { ...DEFAULT_SETTINGS, bookmarkAutoClose: true };
    mockFn(chrome.bookmarks.create).mockResolvedValueOnce({ id: '100' }).mockResolvedValue({});
    mockFn(chrome.tabs.get).mockResolvedValue(mockTab);

    await handleSaveGroupToFolder([1], 'Dev');

    expect(chrome.tabs.remove).toHaveBeenCalledWith([1]);
  });

  it('does not close tabs when bookmarkAutoClose is false', async () => {
    mockStore.senbetsu_settings = { ...DEFAULT_SETTINGS, bookmarkAutoClose: false };
    mockFn(chrome.bookmarks.create).mockResolvedValueOnce({ id: '100' }).mockResolvedValue({});
    mockFn(chrome.tabs.get).mockResolvedValue(mockTab);

    await handleSaveGroupToFolder([1], 'Dev');

    expect(chrome.tabs.remove).not.toHaveBeenCalled();
  });

  it('returns an error without creating a folder when the Bookmarks Bar is missing', async () => {
    mockFn(chrome.bookmarks.getTree).mockResolvedValue([{ id: 'root' }]);

    const result = await handleSaveGroupToFolder([1], 'Dev');

    expect(result).toEqual({ ok: false, error: 'Error: Bookmarks Bar root folder is missing.' });
    expect(chrome.bookmarks.create).not.toHaveBeenCalled();
  });
});

describe('handleGetBookmarkFolders', () => {
  it('returns only folders (nodes without url) with child counts', async () => {
    mockBookmarkNodes['toolbar-root'] = [
      { id: '10', title: 'Dev' },
      { id: '11', title: 'Google', url: 'https://google.com' },
      { id: '12', title: 'Work' },
    ];
    mockBookmarkNodes['10'] = [
      { id: '20', title: 'Page A', url: 'https://a.com' },
      { id: '21', title: 'Page B', url: 'https://b.com' },
    ];
    mockBookmarkNodes['12'] = [];

    const result = await handleGetBookmarkFolders();

    expect(result.ok).toBe(true);
    const folders = result.data as Array<{
      id: string;
      title: string;
      childCount: number;
      bookmarks: Array<{ id: string; title: string; url: string }>;
    }>;
    expect(folders).toHaveLength(2);
    expect(folders[0]).toEqual({
      id: '10',
      title: 'Dev',
      childCount: 2,
      bookmarks: [
        { id: '20', title: 'Page A', url: 'https://a.com' },
        { id: '21', title: 'Page B', url: 'https://b.com' },
      ],
    });
    expect(folders[1]).toEqual({
      id: '12',
      title: 'Work',
      childCount: 0,
      bookmarks: [],
    });
    expect(chrome.bookmarks.getChildren).toHaveBeenCalledWith('toolbar-root');
  });

  it('returns an error without reading folders when the Bookmarks Bar is missing', async () => {
    mockFn(chrome.bookmarks.getTree).mockResolvedValue([{ id: 'root' }]);

    const result = await handleGetBookmarkFolders();

    expect(result).toEqual({ ok: false, error: 'Error: Bookmarks Bar root folder is missing.' });
    expect(chrome.bookmarks.getChildren).not.toHaveBeenCalled();
  });
});

describe('handleOpenBookmark', () => {
  it('opens a URL in a new active tab', async () => {
    mockFn(chrome.tabs.create).mockResolvedValueOnce({ id: 50 });

    const result = await handleOpenBookmark('https://google.com');

    expect(result.ok).toBe(true);
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://google.com', active: true });
  });
});

describe('handleOpenFolderAsGroup', () => {
  it('creates tabs, groups them, and sets up deferred discard', async () => {
    mockBookmarkNodes['10'] = [
      { id: '20', title: 'Page A', url: 'https://a.com' },
      { id: '21', title: 'Page B', url: 'https://b.com' },
    ];
    mockBookmarkNodes['toolbar-root'] = [{ id: '10', title: 'Dev', parentId: 'toolbar-root' }];

    mockFn(chrome.tabs.create).mockResolvedValueOnce({ id: 50 }).mockResolvedValueOnce({ id: 51 });
    mockFn(chrome.tabs.group).mockResolvedValue(5);

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(true);
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://a.com', active: false });
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://b.com', active: false });
    expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [50, 51] });
    expect(chrome.tabGroups.update).toHaveBeenCalledWith(5, {
      title: 'Dev',
      color: 'blue',
      collapsed: false,
    });
    expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledTimes(2);
    expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('10');

    // Simulate tabs finishing load — triggers deferred discard
    for (const listener of [...onUpdatedListeners]) {
      listener(50, { status: 'complete' } as unknown as chrome.tabs.OnUpdatedInfo);
      listener(51, { status: 'complete' } as unknown as chrome.tabs.OnUpdatedInfo);
    }
    await vi.waitFor(() => {
      expect(chrome.tabs.discard).toHaveBeenCalledWith(50);
      expect(chrome.tabs.discard).toHaveBeenCalledWith(51);
    });
  });

  it('creates all tabs in parallel for large folders', async () => {
    const bookmarks = Array.from({ length: 12 }, (_, i) => ({
      id: String(200 + i),
      title: `Page ${i}`,
      url: `https://example.com/${i}`,
    }));
    mockBookmarkNodes['10'] = bookmarks;
    mockBookmarkNodes['toolbar-root'] = [
      { id: '10', title: 'Big Folder', parentId: 'toolbar-root' },
    ];

    let tabIdCounter = 100;
    mockFn(chrome.tabs.create).mockImplementation(async () => ({ id: tabIdCounter++ }));
    mockFn(chrome.tabs.group).mockResolvedValue(5);

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(true);
    expect(chrome.tabs.create).toHaveBeenCalledTimes(12);
    expect(chrome.tabs.group).toHaveBeenCalledWith({
      tabIds: Array.from({ length: 12 }, (_, i) => 100 + i),
    });
    expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledTimes(12);
  });

  it('returns error for empty folder', async () => {
    mockBookmarkNodes['10'] = [];

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('empty');
  });
});
