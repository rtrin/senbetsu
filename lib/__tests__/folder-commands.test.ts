import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants';

const mockStore: Record<string, unknown> = {};
const mockBookmarkNodes: Record<string, unknown[]> = {};

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
  },
  tabGroups: {
    update: vi.fn(),
    query: vi.fn(async () => []),
  },
  bookmarks: {
    create: vi.fn(),
    getChildren: vi.fn(async (id: string) => mockBookmarkNodes[id] ?? []),
    removeTree: vi.fn(),
  },
  scripting: { executeScript: vi.fn() },
  windows: { update: vi.fn() },
  runtime: {
    id: 'test-extension-id',
    getURL: vi.fn((path: string) => `chrome-extension://test-extension-id/${path}`),
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

const { handleSaveGroupToFolder, handleGetBookmarkFolders, handleOpenFolderAsGroup } = await import(
  '../commands'
);

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
    expect(chrome.bookmarks.create).toHaveBeenCalledWith({ parentId: '1', title: 'Dev' });
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
});

describe('handleGetBookmarkFolders', () => {
  it('returns only folders (nodes without url) with child counts', async () => {
    mockBookmarkNodes['1'] = [
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
    const folders = result.data as Array<{ id: string; title: string; childCount: number }>;
    expect(folders).toHaveLength(2);
    expect(folders[0]).toEqual({ id: '10', title: 'Dev', childCount: 2 });
    expect(folders[1]).toEqual({ id: '12', title: 'Work', childCount: 0 });
  });
});

describe('handleOpenFolderAsGroup', () => {
  it('opens bookmarks as suspended tabs, groups them, and deletes the folder', async () => {
    mockBookmarkNodes['10'] = [
      { id: '20', title: 'Page A', url: 'https://a.com' },
      { id: '21', title: 'Page B', url: 'https://b.com' },
    ];
    mockBookmarkNodes['1'] = [{ id: '10', title: 'Dev', parentId: '1' }];

    mockFn(chrome.tabs.create).mockResolvedValueOnce({ id: 50 }).mockResolvedValueOnce({ id: 51 });
    mockFn(chrome.tabs.group).mockResolvedValue(5);

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(true);
    const calls = mockFn(chrome.tabs.create).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0].url).toContain('suspended.html');
    expect(calls[0][0].url).toContain(encodeURIComponent('https://a.com'));
    expect(calls[0][0].active).toBe(false);
    expect(calls[1][0].url).toContain(encodeURIComponent('https://b.com'));
    expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [50, 51] });
    expect(chrome.tabGroups.update).toHaveBeenCalledWith(5, { title: 'Dev', color: 'blue' });
    expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('10');
  });

  it('creates all tabs in parallel for large folders', async () => {
    const bookmarks = Array.from({ length: 12 }, (_, i) => ({
      id: String(200 + i),
      title: `Page ${i}`,
      url: `https://example.com/${i}`,
    }));
    mockBookmarkNodes['10'] = bookmarks;
    mockBookmarkNodes['1'] = [{ id: '10', title: 'Big Folder', parentId: '1' }];

    let tabIdCounter = 100;
    mockFn(chrome.tabs.create).mockImplementation(async () => ({ id: tabIdCounter++ }));
    mockFn(chrome.tabs.group).mockResolvedValue(5);

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(true);
    expect(chrome.tabs.create).toHaveBeenCalledTimes(12);
    expect(chrome.tabs.group).toHaveBeenCalledWith({
      tabIds: Array.from({ length: 12 }, (_, i) => 100 + i),
    });
  });

  it('returns error for empty folder', async () => {
    mockBookmarkNodes['10'] = [];

    const result = await handleOpenFolderAsGroup('10');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('empty');
  });
});
