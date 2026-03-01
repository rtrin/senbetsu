import type { ClassificationResult, TabCategory } from './types';
import { getCategoryColor } from './utils';

// windowId -> category -> groupId
const activeGroups = new Map<number, Map<TabCategory, number>>();

// tabId -> category
const tabCategories = new Map<number, TabCategory>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Force Chrome to render the group title by toggling collapsed state.
 * Chrome has a known bug where tabGroups.update sets the title in the API
 * but the UI doesn't render it until the group is collapsed/uncollapsed.
 */
async function forceRenderTitle(
  groupId: number,
  title: string,
  color: chrome.tabGroups.ColorEnum,
): Promise<void> {
  // Set title + collapse to force Chrome to render the title chip
  await chrome.tabGroups.update(groupId, { title, color, collapsed: true });
  await delay(50);
  // Uncollapse to show tabs again — title should now be visible
  await chrome.tabGroups.update(groupId, { collapsed: false });
}

async function findOrCreateGroup(windowId: number, category: TabCategory): Promise<number | null> {
  const windowGroups = activeGroups.get(windowId) ?? new Map();
  activeGroups.set(windowId, windowGroups);

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

  const activeResults = tabEntries.filter((r): r is NonNullable<typeof r> => r !== null);
  const windowCategoryTabs = new Map<number, Map<TabCategory, [number, ...number[]]>>();

  for (const { tabId, category, windowId } of activeResults) {
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
          const windowGroups = activeGroups.get(windowId)!;
          windowGroups.set(category, groupId);
        }

        await forceRenderTitle(groupId, category, color);

        for (const tabId of tabIds) {
          tabCategories.set(tabId, category);
          console.log(`[senbetsu] Tab ${tabId} → "${category}" (group ${groupId})`);
        }
      } catch (e) {
        console.warn(`[senbetsu] Failed to group tabs ${tabIds.join(', ')}:`, e);
      }
    }
  }
}

export function removeTab(tabId: number): void {
  tabCategories.delete(tabId);
}

export function cleanupWindow(windowId: number): void {
  activeGroups.delete(windowId);
}
