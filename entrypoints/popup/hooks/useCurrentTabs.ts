import { useCallback, useEffect, useRef, useState } from 'react';

interface CurrentTabsResult {
  tabs: chrome.tabs.Tab[];
  groups: Map<number, chrome.tabGroups.TabGroup>;
  refresh: () => void;
}

export function useCurrentTabs(): CurrentTabsResult {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [groups, setGroups] = useState<Map<number, chrome.tabGroups.TabGroup>>(new Map());
  const refreshRef = useRef(() => {});

  useEffect(() => {
    function refresh() {
      chrome.tabs.query({ currentWindow: true }).then(setTabs);
      chrome.tabGroups.query({}).then((g) => {
        setGroups(new Map(g.map((group) => [group.id, group])));
      });
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
    chrome.tabs.onReplaced.addListener(refresh);

    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(refresh);
      chrome.tabs.onActivated.removeListener(refresh);
      chrome.tabs.onCreated.removeListener(refresh);
      chrome.tabs.onReplaced.removeListener(refresh);
    };
  }, []);

  const refresh = useCallback(() => refreshRef.current(), []);

  return { tabs, groups, refresh };
}
