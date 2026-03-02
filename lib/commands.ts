import { classifyTabs } from './ai';
import { applyClassifications } from './grouping';
import type { CommandResponse, TabClassificationInput } from './types';
import { isClassifiableUrl } from './utils';

const BODY_TEXT_LIMIT = 500;
const SCRAPE_TIMEOUT_MS = 2000;

async function extractTabBodyText(tabId: number): Promise<string> {
  try {
    const scrapePromise = chrome.scripting.executeScript({
      target: { tabId },
      func: (limit: number) => {
        return (document.body?.innerText ?? '').slice(0, limit);
      },
      args: [BODY_TEXT_LIMIT],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('scrape timeout')), SCRAPE_TIMEOUT_MS),
    );

    const results = await Promise.race([scrapePromise, timeoutPromise]);
    return results[0]?.result ?? '';
  } catch {
    return '';
  }
}

export async function handleSaveAndGroup(userPrompt?: string): Promise<CommandResponse> {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const classifiable = tabs.filter((t) => t.id !== undefined && isClassifiableUrl(t.url));

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
      return { ok: true };
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

    // Pull existing group names from live Chrome tab groups
    const liveGroups = await chrome.tabGroups.query({});
    const existingGroups = Array.from(
      new Set(liveGroups.filter((g) => g.title).map((g) => g.title!)),
    );

    const results = await classifyTabs(tabInputs, undefined, existingGroups);
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

import { measureTabMemory } from './memory';

export async function handleGetMemoryUsage(): Promise<CommandResponse> {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const memoryInfos = await measureTabMemory(tabs);

    return { ok: true, data: memoryInfos };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
