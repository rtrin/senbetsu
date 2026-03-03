import { classifyTabs, classifyTabsViaProxy } from './ai';
import { FREE_DAILY_LIMIT } from './constants';
import { applyClassifications, moveTabToGroup } from './grouping';
import { activateLicense, deactivateLicense } from './license';
import { measureTabMemory } from './memory';
import { storage } from './storage';
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
