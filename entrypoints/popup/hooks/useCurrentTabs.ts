import { useEffect, useState } from 'react';

export function useCurrentTabs(): chrome.tabs.Tab[] {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

  useEffect(() => {
    function refresh() {
      chrome.tabs.query({ currentWindow: true }).then(setTabs);
    }

    refresh();

    const onUpdated = (
      _tabId: number,
      changeInfo: { status?: string; title?: string; favIconUrl?: string },
    ) => {
      if (changeInfo.status === 'complete' || changeInfo.title || changeInfo.favIconUrl) {
        refresh();
      }
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(refresh);
    chrome.tabs.onActivated.addListener(refresh);

    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(refresh);
      chrome.tabs.onActivated.removeListener(refresh);
    };
  }, []);

  return tabs;
}
