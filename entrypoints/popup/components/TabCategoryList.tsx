import type { TabCategory, TabSession } from '@/lib/types';
import { getCategoryColor } from '@/lib/utils';

interface TabCategoryListProps {
  tabs: chrome.tabs.Tab[];
  latestSession: TabSession | null;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onCloseGroup: (tabIds: number[]) => void;
  onRefresh: () => void;
}

interface ClassifiedTab {
  tabId: number;
  url: string;
  title: string;
  favIconUrl: string;
  category: TabCategory;
  isActive: boolean;
}

function getCategoryColorVar(category: TabCategory): string {
  const color = getCategoryColor(category);
  return `var(--color-${color})`;
}

export function TabCategoryList({
  tabs,
  latestSession,
  onSwitchTab,
  onCloseTab,
  onCloseGroup,
  onRefresh,
}: TabCategoryListProps) {
  // When no session exists yet, show all tabs in a flat list
  if (!latestSession) {
    const allTabs = tabs
      .filter((t) => t.id && t.url)
      .map((t) => ({
        tabId: t.id!,
        url: t.url!,
        title: t.title ?? t.url!,
        favIconUrl: t.favIconUrl ?? '',
        isActive: t.active ?? false,
      }));

    if (allTabs.length === 0) return null;

    return (
      <section>
        <div className="section-header">
          <h2 className="section-title">Open Tabs</h2>
          <button type="button" className="refresh-btn" onClick={onRefresh} title="Refresh tabs">
            ↻
          </button>
        </div>
        <div className="tab-group">
          {allTabs.map((tab) => (
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
      </section>
    );
  }

  // Build a URL → category map from the latest session
  const urlToCategory = new Map(latestSession.tabs.map((t) => [t.url, t.category]));

  // Match live tabs to their categories
  const categorized: ClassifiedTab[] = tabs
    .filter((t) => t.id && t.url && urlToCategory.has(t.url))
    .map((t) => ({
      tabId: t.id!,
      url: t.url!,
      title: t.title ?? t.url!,
      favIconUrl: t.favIconUrl ?? '',
      category: urlToCategory.get(t.url!)!,
      isActive: t.active ?? false,
    }));

  if (categorized.length === 0) return null;

  // Group by category
  const grouped = new Map<TabCategory, ClassifiedTab[]>();
  for (const tab of categorized) {
    const existing = grouped.get(tab.category) ?? [];
    existing.push(tab);
    grouped.set(tab.category, existing);
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">Open Tabs</h2>
        <button type="button" className="refresh-btn" onClick={onRefresh} title="Refresh tabs">
          ↻
        </button>
      </div>
      {Array.from(grouped.entries()).map(([category, categoryTabs]) => (
        <div key={category} className="tab-group">
          <div className="tab-group__header">
            <span
              className="tab-group__dot"
              style={{ backgroundColor: getCategoryColorVar(category) }}
            />
            <span className="tab-group__name">{category}</span>
            <span className="tab-group__count">{categoryTabs.length}</span>
            <button
              type="button"
              className="close-btn close-btn--group"
              onClick={() => onCloseGroup(categoryTabs.map((t) => t.tabId))}
              title={`Close all ${categoryTabs.length} tabs in "${category}"`}
            >
              ×
            </button>
          </div>
          {categoryTabs.map((tab) => (
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
      ))}
    </section>
  );
}
