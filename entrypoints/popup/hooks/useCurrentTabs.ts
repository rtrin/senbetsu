import { useCallback, useEffect, useRef, useState } from 'react';

export function useCurrentTabs(): { tabs: chrome.tabs.Tab[]; refresh: () => void } {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const refreshRef = useRef(() => {});

  useEffect(() => {
    function refresh() {
      chrome.tabs.query({ currentWindow: true }).then(setTabs);
    }

    refreshRef.current = refresh;
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
    chrome.tabs.onCreated.addListener(refresh);

    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(refresh);
      chrome.tabs.onActivated.removeListener(refresh);
      chrome.tabs.onCreated.removeListener(refresh);
    };
  }, []);

  const refresh = useCallback(() => refreshRef.current(), []);

  return { tabs, refresh };
}
