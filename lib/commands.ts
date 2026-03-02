import { classifyTabs } from './ai';
import { applyClassifications } from './grouping';
import { storage } from './storage';
import type { CommandResponse, TabClassificationInput, TabSession, TabSnapshot } from './types';
import { isClassifiableUrl } from './utils';

const BODY_TEXT_LIMIT = 500;

async function extractTabBodyText(tabId: number): Promise<string> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (limit: number) => {
        return (document.body?.innerText ?? '').slice(0, limit);
      },
      args: [BODY_TEXT_LIMIT],
    });
    return results[0]?.result ?? '';
  } catch {
    // Tab may be a chrome:// page or otherwise restricted
    return '';
  }
}

export async function handleSaveAndGroup(userPrompt?: string): Promise<CommandResponse> {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const classifiable = tabs.filter((t) => t.id !== undefined && isClassifiableUrl(t.url));

    // Scrape page content in batches to avoid IPC saturation
    const tabInputs: TabClassificationInput[] = [];
    const SCRAPE_BATCH_SIZE = 10;
    for (let i = 0; i < classifiable.length; i += SCRAPE_BATCH_SIZE) {
      const batch = classifiable.slice(i, i + SCRAPE_BATCH_SIZE);
      const infos = await Promise.all(
        batch.map(async (t) => ({
          tabId: t.id!,
          url: t.url!,
          title: t.title ?? '',
          bodyText: await extractTabBodyText(t.id!),
        })),
      );
      tabInputs.push(...infos);
    }

    const results = await classifyTabs(tabInputs, userPrompt);
    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);

    // Build session snapshot
    const categoryMap = new Map(results.map((r) => [r.tabId, r.category]));
    const tabSnapshots: TabSnapshot[] = classifiable.map((t) => ({
      url: t.url!,
      title: t.title ?? '',
      favicon: t.favIconUrl ?? '',
      category: categoryMap.get(t.id!) ?? 'Other',
    }));

    const now = Date.now();
    const session: TabSession = {
      id: `session_${now}`,
      savedAt: now,
      label: new Date(now).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      tabs: tabSnapshots,
    };

    await storage.saveSession(session);
    await storage.updateSettings({ hasSeenOnboarding: true });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleClassifyUnsorted(
  unclassifiedTabIds: number[],
): Promise<CommandResponse> {
  try {
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToProcess = allTabs.filter(
      (t) => t.id !== undefined && unclassifiedTabIds.includes(t.id) && isClassifiableUrl(t.url),
    );

    if (tabsToProcess.length === 0) {
      return { ok: true }; // Nothing to do, but not an error
    }

    const tabInputs: TabClassificationInput[] = [];
    const SCRAPE_BATCH_SIZE = 10;
    for (let i = 0; i < tabsToProcess.length; i += SCRAPE_BATCH_SIZE) {
      const batch = tabsToProcess.slice(i, i + SCRAPE_BATCH_SIZE);
      const infos = await Promise.all(
        batch.map(async (t) => ({
          tabId: t.id!,
          url: t.url!,
          title: t.title ?? '',
          bodyText: await extractTabBodyText(t.id!),
        })),
      );
      tabInputs.push(...infos);
    }

    const results = await classifyTabs(tabInputs);
    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);

    const categoryMap = new Map(results.map((r) => [r.tabId, r.category]));
    const newTabSnapshots: TabSnapshot[] = tabsToProcess.map((t) => ({
      url: t.url!,
      title: t.title ?? '',
      favicon: t.favIconUrl ?? '',
      category: categoryMap.get(t.id!) ?? 'Other',
    }));

    await storage.updateLatestSession(newTabSnapshots);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleRestoreSession(sessionId: string): Promise<CommandResponse> {
  try {
    const sessions = await storage.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return { ok: false, error: 'Session not found' };

    const openTabs = await chrome.tabs.query({});
    const openUrls = new Map(openTabs.filter((t) => t.url && t.id).map((t) => [t.url!, t]));

    for (const savedTab of session.tabs) {
      const existing = openUrls.get(savedTab.url);
      if (existing?.id !== undefined && existing.windowId !== undefined) {
        await chrome.tabs.update(existing.id, { active: true });
        await chrome.windows.update(existing.windowId, { focused: true });
      } else {
        await chrome.tabs.create({ url: savedTab.url, active: false });
      }
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

export async function handleDeleteSession(sessionId: string): Promise<CommandResponse> {
  try {
    await storage.deleteSession(sessionId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function handleDismissOnboarding(): Promise<CommandResponse> {
  try {
    await storage.updateSettings({ hasSeenOnboarding: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

import { measureTabMemory } from './memory';

export async function handleGetMemoryUsage(): Promise<CommandResponse> {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const memoryInfos = await measureTabMemory(tabs);

    // Optionally fetch categories from the latest session to attach to results
    const sessions = await storage.getSessions();
    if (sessions.length > 0) {
      const latestSession = sessions[0]; // Sessions are prepended, so index 0 is newest
      const urlToCategory = new Map(latestSession.tabs.map((t) => [t.url, t.category]));
      for (const info of memoryInfos) {
        if (urlToCategory.has(info.url)) {
          info.category = urlToCategory.get(info.url);
        }
      }
    }

    return { ok: true, data: memoryInfos };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
