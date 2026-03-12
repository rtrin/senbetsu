import { classifyTabs, classifyTabsViaProxy } from './ai';
import { FREE_DAILY_LIMIT } from './constants';
import { applyClassifications, moveTabToGroup } from './grouping';
import { activateLicense, deactivateLicense } from './license';
import { measureTabMemory } from './memory';
import { storage } from './storage';
import type { CommandResponse, TabClassificationInput } from './types';
import { isClassifiableUrl } from './utils';

type ClassificationStrategy =
  | { mode: 'proxy' }
  | { mode: 'direct'; apiKey: string }
  | { error: string };

async function resolveClassificationStrategy(): Promise<ClassificationStrategy> {
  const settings = await storage.getSettings();

  if (settings.tier === 'byok') {
    if (!settings.openaiApiKey) {
      return { error: 'BYOK tier but no API key set. Add your key in Settings.' };
    }
    return { mode: 'direct', apiKey: settings.openaiApiKey };
  }

  if (settings.tier === 'pro') {
    return { mode: 'proxy' };
  }

  // Free tier — enforce daily limit
  const count = await storage.getUsageCount();
  if (count >= FREE_DAILY_LIMIT) {
    return {
      error: `Daily limit of ${FREE_DAILY_LIMIT} free usages reached. Upgrade to Pro or add your own API key.`,
    };
  }
  return { mode: 'proxy' };
}

export async function handleSaveAndGroup(userPrompt?: string): Promise<CommandResponse> {
  try {
    const strategy = await resolveClassificationStrategy();
    if ('error' in strategy) return { ok: false, error: strategy.error };

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const classifiable = tabs.filter((t) => t.id !== undefined && isClassifiableUrl(t.url));

    const tabInputs: TabClassificationInput[] = classifiable.map((t) => ({
      tabId: t.id!,
      url: t.url!,
      title: t.title ?? '',
    }));

    const results =
      strategy.mode === 'proxy'
        ? await classifyTabsViaProxy(tabInputs, userPrompt)
        : await classifyTabs(tabInputs, strategy.apiKey, userPrompt);

    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);

    const settings = await storage.getSettings();
    if (settings.tier === 'free') {
      await storage.incrementUsage();
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleClassifyUnsorted(
  unclassifiedTabIds: number[],
): Promise<CommandResponse> {
  try {
    const strategy = await resolveClassificationStrategy();
    if ('error' in strategy) return { ok: false, error: strategy.error };

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

    const liveGroups = await chrome.tabGroups.query({});
    const existingGroups = Array.from(
      new Set(liveGroups.filter((g) => g.title).map((g) => g.title!)),
    );

    const results =
      strategy.mode === 'proxy'
        ? await classifyTabsViaProxy(tabInputs, undefined, existingGroups)
        : await classifyTabs(tabInputs, strategy.apiKey, undefined, existingGroups);

    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);

    const settings = await storage.getSettings();
    if (settings.tier === 'free') {
      await storage.incrementUsage();
    }

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

export async function handleActivateLicense(licenseKey: string): Promise<CommandResponse> {
  try {
    const result = await activateLicense(licenseKey);
    if (!result.valid || !result.tier) {
      return { ok: false, error: result.error ?? 'License activation failed' };
    }
    await storage.activateTier(result.tier, licenseKey);
    return { ok: true, data: { tier: result.tier } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleDeactivateLicense(): Promise<CommandResponse> {
  try {
    const settings = await storage.getSettings();
    if (settings.licenseKey) {
      await deactivateLicense(settings.licenseKey);
    }
    await storage.deactivate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleSaveSettings(openaiApiKey: string | null): Promise<CommandResponse> {
  try {
    await storage.saveApiKey(openaiApiKey);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleBookmarkTab(tabId: number): Promise<CommandResponse> {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.bookmarks.create({
      parentId: '1',
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
): Promise<CommandResponse> {
  try {
    const folder = await chrome.bookmarks.create({
      parentId: '1',
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
    const children = await chrome.bookmarks.getChildren('1');
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
    }

    // Discard each tab after it loads to free memory (fire-and-forget)
    for (const id of newTabIds) {
      waitForTabLoad(id)
        .then(() => chrome.tabs.discard(id))
        .catch(() => {});
    }

    await chrome.bookmarks.removeTree(folderId);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleDeleteFolder(folderId: string): Promise<CommandResponse> {
  try {
    await chrome.bookmarks.removeTree(folderId);
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

export async function handleOpenBookmark(url: string): Promise<CommandResponse> {
  try {
    await chrome.tabs.create({ url, active: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
