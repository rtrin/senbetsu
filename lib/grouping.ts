import type { ClassificationResult, TabCategory, TabGroupColor } from './types';
import { getCategoryColor } from './utils';

// windowId -> category -> groupId
const trackedGroups = new Map<number, Map<TabCategory, number>>();

// tabId -> category
const tabCategoryCache = new Map<number, TabCategory>();

/**
 * Force Chrome to render the group title by toggling collapsed state.
 * Chrome has a known bug where tabGroups.update sets the title in the API
 * but the UI doesn't render it until the group is collapsed/uncollapsed.
 */
// TODO: check this
async function forceRenderTitle(
  groupId: number,
  title: string,
  color: TabGroupColor,
): Promise<void> {
  const chromeColor = color as chrome.tabGroups.Color;

  // Simple update — works on Chrome 146+
  await chrome.tabGroups.update(groupId, { title, color: chromeColor });
}

async function findOrCreateGroup(windowId: number, category: TabCategory): Promise<number | null> {
  const windowGroups = trackedGroups.get(windowId) ?? new Map();
  trackedGroups.set(windowId, windowGroups);

  const existingId = windowGroups.get(category);

  if (existingId !== undefined) {
    try {
      await chrome.tabGroups.get(existingId);
      return existingId;
    } catch {
      windowGroups.delete(category);
    }
  }

  return null;
}

export async function applyClassifications(results: ClassificationResult[]): Promise<void> {
  // Bootstrap trackedGroups from live Chrome tab groups
  try {
    const existingTabGroups = await chrome.tabGroups.query({});
    for (const group of existingTabGroups) {
      if (group.title) {
        let windowGroups = trackedGroups.get(group.windowId);
        if (!windowGroups) {
          windowGroups = new Map();
          trackedGroups.set(group.windowId, windowGroups);
        }
        windowGroups.set(group.title as TabCategory, group.id);
      }
    }
  } catch (e) {
    console.warn('[senbetsu] Failed to bootstrap existing tab groups:', e);
  }

  const tabEntries = await Promise.all(
    results.map(async (r) => {
      try {
        const tab = await chrome.tabs.get(r.tabId);
        if (tab.windowId) return { ...r, windowId: tab.windowId };
      } catch {
        // Tab might be closed
      }
      return null;
    }),
  );

  const validResults = tabEntries.filter((r): r is NonNullable<typeof r> => r !== null);
  const windowCategoryTabs = new Map<number, Map<TabCategory, [number, ...number[]]>>();

  for (const { tabId, category, windowId } of validResults) {
    let categoryMap = windowCategoryTabs.get(windowId);
    if (!categoryMap) {
      categoryMap = new Map();
      windowCategoryTabs.set(windowId, categoryMap);
    }
    const tabs = categoryMap.get(category);
    if (tabs) {
      tabs.push(tabId);
    } else {
      categoryMap.set(category, [tabId]);
    }
  }

  for (const [windowId, categoryMap] of windowCategoryTabs.entries()) {
    for (const [category, tabIds] of categoryMap.entries()) {
      try {
        const existingGroupId = await findOrCreateGroup(windowId, category);
        const color = getCategoryColor(category);
        let groupId: number;

        if (existingGroupId !== null) {
          groupId = existingGroupId;
          await chrome.tabs.group({ tabIds, groupId });
        } else {
          groupId = await chrome.tabs.group({ tabIds });
          const windowGroups = trackedGroups.get(windowId)!;
          windowGroups.set(category, groupId);
        }

        await forceRenderTitle(groupId, category, color);

        for (const tabId of tabIds) {
          tabCategoryCache.set(tabId, category);
          console.log(`[senbetsu] Tab ${tabId} → "${category}" (group ${groupId})`);
        }
      } catch (e) {
        console.warn(`[senbetsu] Failed to group tabs ${tabIds.join(', ')}:`, e);
      }
    }
  }
}

export function removeTab(tabId: number): void {
  tabCategoryCache.delete(tabId);
}

export function cleanupWindow(windowId: number): void {
  trackedGroups.delete(windowId);
}
