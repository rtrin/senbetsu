import type { TabMemoryInfo } from './types';
import { isClassifiableUrl } from './utils';

export async function scrapeTabMemory(tabs: chrome.tabs.Tab[]): Promise<TabMemoryInfo[]> {
  const classifiable = tabs.filter(
    (t) => t.id !== undefined && !t.discarded && isClassifiableUrl(t.url),
  );

  const results: TabMemoryInfo[] = [];
  const SCRAPE_BATCH_SIZE = 10;

  for (let i = 0; i < classifiable.length; i += SCRAPE_BATCH_SIZE) {
    const batch = classifiable.slice(i, i + SCRAPE_BATCH_SIZE);

    const infos = await Promise.all(
      batch.map(async (t) => {
        // Exclude the extension's own popup and pages
        if (t.url?.startsWith(chrome.runtime.getURL(''))) return null;

        try {
          const res = await chrome.scripting.executeScript({
            target: { tabId: t.id! },
            func: () => {
              // @ts-expect-error
              const memory = performance.memory;
              if (!memory) return null;
              return memory.usedJSHeapSize;
            },
          });

          const usedJSHeapSize = res[0]?.result;
          if (typeof usedJSHeapSize !== 'number') return null;

          return {
            tabId: t.id!,
            title: t.title ?? '',
            url: t.url ?? '',
            favIconUrl: t.favIconUrl ?? '',
            jsHeapUsedMB: usedJSHeapSize / (1024 * 1024),
          };
        } catch {
          // May throw error if it's a restricted page or chrome://
          return null;
        }
      }),
    );

    for (const info of infos) {
      if (info !== null) {
        results.push(info);
      }
    }
  }

  return results.sort((a, b) => b.jsHeapUsedMB - a.jsHeapUsedMB);
}
