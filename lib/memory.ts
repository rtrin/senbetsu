import type { TabMemoryInfo } from './types';
import { isClassifiableUrl } from './utils';

const SCRAPE_TIMEOUT_MS = 2000;

export async function measureTabMemory(tabs: chrome.tabs.Tab[]): Promise<TabMemoryInfo[]> {
  const classifiable = tabs.filter(
    (t) => t.id !== undefined && !t.discarded && isClassifiableUrl(t.url),
  );

  const results: TabMemoryInfo[] = [];
  const SCRAPE_BATCH_SIZE = 10;

  for (let i = 0; i < classifiable.length; i += SCRAPE_BATCH_SIZE) {
    const batch = classifiable.slice(i, i + SCRAPE_BATCH_SIZE);

    const infos = await Promise.all(
      batch.map(async (t) => {
        if (t.url?.startsWith(chrome.runtime.getURL(''))) return null;

        try {
          const scrapePromise = chrome.scripting.executeScript({
            target: { tabId: t.id! },
            func: () => {
              // @ts-expect-error
              const memory = performance.memory;
              if (!memory) return null;
              return memory.usedJSHeapSize;
            },
          });
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), SCRAPE_TIMEOUT_MS),
          );

          const res = await Promise.race([scrapePromise, timeoutPromise]);
          if (!res) return null;

          const usedJSHeapSize = (res as chrome.scripting.InjectionResult[])[0]?.result;
          if (typeof usedJSHeapSize !== 'number') return null;

          return {
            tabId: t.id!,
            title: t.title ?? '',
            url: t.url ?? '',
            favIconUrl: t.favIconUrl ?? '',
            jsHeapUsedMB: usedJSHeapSize / (1024 * 1024),
          };
        } catch {
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

  const sortedResults = results.sort((a, b) => b.jsHeapUsedMB - a.jsHeapUsedMB);

  // Compute memory levels
  if (sortedResults.length > 0) {
    if (sortedResults.length <= 3) {
      // For very few tabs, use absolute thresholds
      for (const info of sortedResults) {
        if (info.jsHeapUsedMB > 100) info.memoryLevel = 'high';
        else if (info.jsHeapUsedMB > 30) info.memoryLevel = 'medium';
        else info.memoryLevel = 'low';
      }
    } else {
      // Use percentile logic for > 3 tabs
      const highCutoff = sortedResults[Math.floor(sortedResults.length * 0.25)].jsHeapUsedMB;
      const lowCutoff = sortedResults[Math.floor(sortedResults.length * 0.75)].jsHeapUsedMB;

      for (const info of sortedResults) {
        if (info.jsHeapUsedMB >= highCutoff || info.jsHeapUsedMB > 100) {
          info.memoryLevel = 'high';
        } else if (info.jsHeapUsedMB > lowCutoff) {
          info.memoryLevel = 'medium';
        } else {
          info.memoryLevel = 'low';
        }
      }
    }
  }

  return sortedResults;
}
