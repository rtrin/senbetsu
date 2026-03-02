import { memo } from 'react';
import type { TabSession } from '@/lib/types';

interface UnclassifiedTab {
  tabId: number;
  url: string;
  title: string;
  favIconUrl: string;
  category: 'Ungrouped';
  isActive: boolean;
  isHttp: boolean;
}

interface UnsortedTabsProps {
  tabs: chrome.tabs.Tab[];
  latestSession: TabSession | null;
  isGrouping: boolean;
  onGroup: (tabIds: number[]) => void;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onCloseGroup: (tabIds: number[]) => void;
}

export const UnsortedTabs = memo(function UnsortedTabs({
  tabs,
  latestSession,
  isGrouping,
  onGroup,
  onSwitchTab,
  onCloseTab,
  onCloseGroup,
}: UnsortedTabsProps) {
  // We need to figure out which live tabs are NOT in the latest session
  const alreadyClassifiedUrls = new Set(latestSession?.tabs.map((t) => t.url) ?? []);

  const unclassifiedTabs: UnclassifiedTab[] = tabs
    .filter((t) => t.id && t.url && !alreadyClassifiedUrls.has(t.url))
    .map((t) => ({
      tabId: t.id!,
      url: t.url!,
      title: t.title ?? t.url!,
      favIconUrl: t.favIconUrl ?? '',
      category: 'Ungrouped',
      isActive: t.active ?? false,
      isHttp: t.url!.startsWith('http'),
    }));

  if (unclassifiedTabs.length === 0) return null;

  // Only pass HTTP tabs to the AI
  const classifiableTabIds = unclassifiedTabs.filter((t) => t.isHttp).map((t) => t.tabId);

  return (
    <div className="tab-group tab-group--ungrouped">
      <div className="tab-group__header">
        <span className="tab-group__dot tab-group__dot--dashed" />
        <span className="tab-group__name">Ungrouped</span>
        {classifiableTabIds.length > 0 && latestSession && (
          <button
            type="button"
            className="btn btn--sm btn--primary ungrouped-action"
            onClick={() => onGroup(classifiableTabIds)}
            disabled={isGrouping}
          >
            {isGrouping ? 'Cleaning Up...' : 'Clean Up'}
          </button>
        )}

        <button
          type="button"
          className="close-btn close-btn--group"
          onClick={() => onCloseGroup(unclassifiedTabs.map((t) => t.tabId))}
          title="Close all ungrouped tabs"
        >
          ×
        </button>
      </div>

      {unclassifiedTabs.map((tab) => (
        <div key={tab.tabId} className="tab-item-row">
          <button
            type="button"
            className={`tab-item ${tab.isActive ? 'tab-item--active' : ''}`}
            onClick={() => onSwitchTab(tab.tabId)}
            title={tab.url}
          >
            {tab.favIconUrl ? (
              <img
                className="tab-item__favicon"
                src={tab.favIconUrl}
                alt=""
                width={16}
                height={16}
              />
            ) : (
              <span className="tab-item__favicon-fallback" />
            )}
            <span className="tab-item__title">{tab.title}</span>
            {!tab.isHttp && <span className="tab-item__badge">system</span>}
          </button>
          <button
            type="button"
            className="close-btn close-btn--tab"
            onClick={() => onCloseTab(tab.tabId)}
            title="Close tab"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
});
