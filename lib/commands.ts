import { classifyTabs } from './ai';
import { applyClassifications } from './grouping';
import { storage } from './storage';
import type { CommandResponse, SavedSession, SavedTab, TabInfo } from './types';
import { isClassifiableUrl } from './utils';

const BODY_TEXT_LIMIT = 500;

async function scrapeTabContent(tabId: number): Promise<string> {
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
    const tabInfos: TabInfo[] = [];
    const SCRAPE_BATCH_SIZE = 10;
    for (let i = 0; i < classifiable.length; i += SCRAPE_BATCH_SIZE) {
      const batch = classifiable.slice(i, i + SCRAPE_BATCH_SIZE);
      const infos = await Promise.all(
        batch.map(async (t) => ({
          tabId: t.id!,
          url: t.url!,
          title: t.title ?? '',
          bodyText: await scrapeTabContent(t.id!),
        })),
      );
      tabInfos.push(...infos);
    }

    const results = await classifyTabs(tabInfos, userPrompt);
    if (results.length === 0) {
      return { ok: false, error: 'Classification failed: no tabs could be categorized' };
    }

    await applyClassifications(results);

    // Build session snapshot
    const categoryMap = new Map(results.map((r) => [r.tabId, r.category]));
    const savedTabs: SavedTab[] = classifiable.map((t) => ({
      url: t.url!,
      title: t.title ?? '',
      favicon: t.favIconUrl ?? '',
      category: categoryMap.get(t.id!) ?? 'Other',
    }));

    const now = Date.now();
    const session: SavedSession = {
      id: `session_${now}`,
      savedAt: now,
      label: new Date(now).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      tabs: savedTabs,
    };

    await storage.saveSession(session);
    await storage.updateSettings({ hasSeenOnboarding: true });

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
