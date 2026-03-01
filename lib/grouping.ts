import { CATEGORY_COLORS } from './constants';
import type { ClassificationResult, TabCategory } from './types';

// windowId -> category -> groupId
const activeGroups = new Map<number, Map<TabCategory, number>>();

// tabId -> category
const tabCategories = new Map<number, TabCategory>();

async function findOrCreateGroup(windowId: number, category: TabCategory): Promise<number | null> {
  const windowGroups = activeGroups.get(windowId) ?? new Map();
  activeGroups.set(windowId, windowGroups);

  const existingId = windowGroups.get(category);

  // Verify the group still exists
  if (existingId !== undefined) {
    try {
      await chrome.tabGroups.get(existingId);
      return existingId;
    } catch {
      // Group was closed by user — remove stale reference
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
        let groupId: number;

        if (existingGroupId !== null) {
          groupId = existingGroupId;
          await chrome.tabs.group({ tabIds, groupId });
          // Redundantly update title to fix Chrome rendering bug
          setTimeout(() => {
            chrome.tabGroups.update(groupId, { title: category }).catch(() => {});
          }, 100);
        } else {
          groupId = await chrome.tabs.group({ tabIds });
          await chrome.tabGroups.update(groupId, {
            title: category,
            color: CATEGORY_COLORS[category],
            collapsed: false,
          });

          // Hack to ensure Chrome renders the title properly on creation
          setTimeout(() => {
            chrome.tabGroups.update(groupId, { title: category }).catch(() => {});
          }, 100);

          const windowGroups = activeGroups.get(windowId)!;
          windowGroups.set(category, groupId);
        }

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
