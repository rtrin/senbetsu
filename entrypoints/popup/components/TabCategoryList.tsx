import type { SavedSession, TabCategory } from '@/lib/types';
import { getCategoryColor } from '@/lib/utils';

interface TabCategoryListProps {
  tabs: chrome.tabs.Tab[];
  latestSession: SavedSession | null;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onCloseGroup: (tabIds: number[]) => void;
}

interface CategorizedTab {
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
}: TabCategoryListProps) {
  if (!latestSession) return null;

  // Build a URL → category map from the latest session
  const urlToCategory = new Map(latestSession.tabs.map((t) => [t.url, t.category]));

  // Match live tabs to their categories
  const categorized: CategorizedTab[] = tabs
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
  const grouped = new Map<TabCategory, CategorizedTab[]>();
  for (const tab of categorized) {
    const existing = grouped.get(tab.category) ?? [];
    existing.push(tab);
    grouped.set(tab.category, existing);
  }

  return (
    <section>
      <h2 className="section-title">Open Tabs</h2>
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
