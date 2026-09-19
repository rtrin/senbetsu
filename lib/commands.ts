import { classifyTabs } from './ai';
import { AI_PROVIDER_METADATA } from './ai-provider';
import { getBookmarksBarId } from './bookmarks';
import { applyClassifications, moveTabToGroup } from './grouping';
import { measureTabMemory } from './memory';
import { getAnnotation, removeAnnotation, setAnnotation, storage } from './storage';
import type { AIProvider, CommandResponse, TabClassificationInput } from './types';
import { isClassifiableUrl } from './utils';

async function getActiveProviderKey(): Promise<{ provider: AIProvider; apiKey: string | null }> {
  const settings = await storage.getSettings();
  return {
    provider: settings.activeProvider,
    apiKey: settings.apiKeys[settings.activeProvider] ?? null,
  };
}

export async function handleSaveAndGroup(userPrompt?: string): Promise<CommandResponse> {
  try {
    const { provider, apiKey } = await getActiveProviderKey();
    if (!apiKey) {
      return {
        ok: false,
        error: `Add your ${providerKeyLabel(provider)} in Settings to use AI grouping.`,
      };
    }

    const settings = await storage.getSettings();
    const preserveGroups = settings.preserveExistingGroups !== false;

    const tabs = await chrome.tabs.query({ currentWindow: true });

    let existingGroups: string[] | undefined;
    let namedGroupIds: Set<number> | undefined;
    if (preserveGroups) {
      const liveGroups = await chrome.tabGroups.query({});
      const named = liveGroups.filter((g) => g.title);
      existingGroups = Array.from(new Set(named.map((g) => g.title!)));
      namedGroupIds = new Set(named.map((g) => g.id));
    }

    const classifiable = preserveGroups
      ? tabs.filter(
          (t) => t.id !== undefined && isClassifiableUrl(t.url) && !namedGroupIds!.has(t.groupId),
        )
      : tabs.filter((t) => t.id !== undefined && isClassifiableUrl(t.url));

    const tabInputs: TabClassificationInput[] = classifiable.map((t) => ({
      tabId: t.id!,
      url: t.url!,
      title: t.title ?? '',
    }));

    const results = await classifyTabs(
      tabInputs,
      provider,
      apiKey,
      userPrompt,
      existingGroups,
      settings.maxGroups,
    );

    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleClassifyUnsorted(
  unclassifiedTabIds: number[],
): Promise<CommandResponse> {
  try {
    const { provider, apiKey } = await getActiveProviderKey();
    if (!apiKey) {
      return {
        ok: false,
        error: `Add your ${providerKeyLabel(provider)} in Settings to use AI grouping.`,
      };
    }

    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToProcess = allTabs.filter(
      (t) => t.id !== undefined && unclassifiedTabIds.includes(t.id) && isClassifiableUrl(t.url),
    );

    if (tabsToProcess.length === 0) {
      return { ok: true };
    }

    const tabInputs: TabClassificationInput[] = tabsToProcess.map((t) => ({
      tabId: t.id!,
      url: t.url!,
      title: t.title ?? '',
    }));

    const [liveGroups, settings] = await Promise.all([
      chrome.tabGroups.query({}),
      storage.getSettings(),
    ]);
    const existingGroups = Array.from(
      new Set(liveGroups.filter((g) => g.title).map((g) => g.title!)),
    );

    const results = await classifyTabs(
      tabInputs,
      provider,
      apiKey,
      undefined,
      existingGroups,
      settings.maxGroups,
    );

    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleSwitchTab(tabId: number): Promise<CommandResponse> {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { active: true });
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleCloseTab(tabId: number): Promise<CommandResponse> {
  try {
    await chrome.tabs.remove(tabId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleCloseGroup(tabIds: number[]): Promise<CommandResponse> {
  try {
    await chrome.tabs.remove(tabIds);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleGetMemoryUsage(): Promise<CommandResponse> {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const memoryInfos = await measureTabMemory(tabs);
    return { ok: true, data: memoryInfos };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleMoveTabToGroup(
  tabId: number,
  targetGroupName: string,
): Promise<CommandResponse> {
  try {
    await moveTabToGroup(tabId, targetGroupName);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function providerKeyLabel(provider: AIProvider): string {
  return AI_PROVIDER_METADATA[provider].keyLabel;
}

export async function handleSaveSettings(
  provider: AIProvider,
  apiKey: string | null,
): Promise<CommandResponse> {
  try {
    await storage.saveApiKey(provider, apiKey);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleSelectAIProvider(provider: AIProvider): Promise<CommandResponse> {
  try {
    await storage.setActiveProvider(provider);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleBookmarkTab(tabId: number): Promise<CommandResponse> {
  try {
    const tab = await chrome.tabs.get(tabId);
    const bookmarksBarId = await getBookmarksBarId();
    await chrome.bookmarks.create({
      parentId: bookmarksBarId,
      title: tab.title ?? tab.url ?? 'Untitled',
      url: tab.url,
    });

    const settings = await storage.getSettings();
    if (settings.bookmarkAutoClose !== false) {
      await chrome.tabs.remove(tabId);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleSaveGroupToFolder(
  tabIds: number[],
  groupName: string,
  annotation?: string,
): Promise<CommandResponse> {
  try {
    const bookmarksBarId = await getBookmarksBarId();
    const folder = await chrome.bookmarks.create({
      parentId: bookmarksBarId,
      title: groupName,
    });

    for (const tabId of tabIds) {
      const tab = await chrome.tabs.get(tabId);
      await chrome.bookmarks.create({
        parentId: folder.id,
        title: tab.title ?? tab.url ?? 'Untitled',
        url: tab.url,
      });
    }

    if (annotation?.trim()) {
      await setAnnotation(`folder:${folder.id}`, annotation.trim());
    }

    const settings = await storage.getSettings();
    if (settings.bookmarkAutoClose !== false) {
      await chrome.tabs.remove(tabIds);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleGetBookmarkFolders(): Promise<CommandResponse> {
  try {
    const bookmarksBarId = await getBookmarksBarId();
    const children = await chrome.bookmarks.getChildren(bookmarksBarId);
    const folders = children.filter((node) => !node.url);

    const result = await Promise.all(
      folders.map(async (folder) => {
        const contents = await chrome.bookmarks.getChildren(folder.id);
        const bookmarks = contents
          .filter((node) => node.url)
          .map((node) => ({ id: node.id, title: node.title, url: node.url! }));
        return {
          id: folder.id,
          title: folder.title,
          childCount: bookmarks.length,
          bookmarks,
        };
      }),
    );

    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        // Fix for "Cached Tab" Deadlock:
        // Cached sites load so fast that they reach 'complete' before the listener below
        // can attach, accidentally triggering the 30-second kill-switch. We resolve this
        // by querying the live tab state instantly beforehand to bypass the wait.
        if (tab.status === 'complete') {
          resolve();
          return;
        }

        // Fix for "Wait For Load" Memory Leak:
        // A vulnerability existed where if a tab never finished loading (e.g. broken URL
        // or user immediately closed it), the background listener would wait forever,
        // silently leaking memory. This strict 30-second kill-switch prevents that.
        const timeout = setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 30_000);

        const listener = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
          if (id === tabId && info.status === 'complete') {
            clearTimeout(timeout);
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      })
      .catch(() => resolve()); // Resolve if tab doesn't exist anymore
  });
}

export async function handleOpenFolderAsGroup(folderId: string): Promise<CommandResponse> {
  try {
    const children = await chrome.bookmarks.getChildren(folderId);
    const bookmarks = children.filter((node) => node.url);

    if (bookmarks.length === 0) {
      return { ok: false, error: 'Folder is empty' };
    }

    const folderAnnotation = await getAnnotation(`folder:${folderId}`);

    const tabs = await Promise.all(
      bookmarks.map((b) => chrome.tabs.create({ url: b.url, active: false })),
    );
    const newTabIds = tabs.map((t) => t.id).filter((id): id is number => id !== undefined);

    if (newTabIds.length > 0) {
      const groupId = await chrome.tabs.group({
        tabIds: newTabIds as [number, ...number[]],
      });

      const [folder] = await chrome.bookmarks.get(folderId);
      const title = folder?.title ?? 'Restored';
      const color = 'blue' as chrome.tabGroups.Color;
      await chrome.tabGroups.update(groupId, { title, color, collapsed: false });

      if (folderAnnotation) {
        await setAnnotation(`group:${groupId}`, folderAnnotation);
      }
    }

    // Discard each tab after it loads to free memory (fire-and-forget)
    for (const id of newTabIds) {
      waitForTabLoad(id)
        .then(() => chrome.tabs.discard(id))
        .catch(() => {});
    }

    await removeAnnotation(`folder:${folderId}`);
    await chrome.bookmarks.removeTree(folderId);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleDeleteFolder(folderId: string): Promise<CommandResponse> {
  try {
    await chrome.bookmarks.removeTree(folderId);
    await removeAnnotation(`folder:${folderId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleDeleteBookmark(
  bookmarkId: string,
  folderId: string,
): Promise<CommandResponse> {
  try {
    await chrome.bookmarks.remove(bookmarkId);
  } catch (e) {
    return { ok: false, error: String(e) };
  }

  try {
    const remaining = await chrome.bookmarks.getChildren(folderId);
    if (remaining.length === 0) {
      await chrome.bookmarks.removeTree(folderId);
    }
  } catch {
    // Folder may have already been deleted
  }

  return { ok: true };
}

export async function handleRenameGroup(
  groupId: number,
  newName: string,
): Promise<CommandResponse> {
  try {
    await chrome.tabGroups.update(groupId, { title: newName });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleUngroupTabs(tabIds: number[]): Promise<CommandResponse> {
  try {
    await chrome.tabs.ungroup(tabIds as [number, ...number[]]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleMoveBookmark(
  bookmarkId: string,
  targetFolderId: string,
): Promise<CommandResponse> {
  try {
    await chrome.bookmarks.move(bookmarkId, { parentId: targetFolderId });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleRenameFolder(
  folderId: string,
  newName: string,
): Promise<CommandResponse> {
  try {
    await chrome.bookmarks.update(folderId, { title: newName });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleOffloadTabs(tabIds: number[]): Promise<CommandResponse> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = activeTab?.id;
    const discardable = tabIds.filter((id) => id !== activeTabId);
    const results = await Promise.allSettled(discardable.map((id) => chrome.tabs.discard(id)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    return {
      ok: true,
      data: { offloaded: succeeded, skipped: tabIds.length - discardable.length },
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleOpenBookmark(url: string): Promise<CommandResponse> {
  try {
    await chrome.tabs.create({ url, active: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
