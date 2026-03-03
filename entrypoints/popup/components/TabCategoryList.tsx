import { useState } from 'react';
import { isClassifiableUrl } from '@/lib/utils';
import { TabItem } from './TabItem';

interface TabCategoryListProps {
  tabs: chrome.tabs.Tab[];
  groups: Map<number, chrome.tabGroups.TabGroup>;
  isCleaningUp: boolean;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onCloseGroup: (tabIds: number[]) => void;
  onCleanUp: (tabIds: number[]) => void;
  onMoveTabToGroup: (tabId: number, targetGroupName: string) => void;
}

export function TabCategoryList({
  tabs,
  groups,
  isCleaningUp,
  onSwitchTab,
  onCloseTab,
  onCloseGroup,
  onCleanUp,
  onMoveTabToGroup,
}: TabCategoryListProps) {
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);

  const validTabs = tabs.filter((t) => t.id && t.url);
  if (validTabs.length === 0) return null;

  // Group tabs by their live Chrome groupId
  const byGroup = new Map<number, chrome.tabs.Tab[]>();
  for (const tab of validTabs) {
    const gid = tab.groupId ?? -1;
    const existing = byGroup.get(gid) ?? [];
    existing.push(tab);
    byGroup.set(gid, existing);
  }

  // Separate grouped and ungrouped
  const ungrouped = byGroup.get(-1) ?? [];
  byGroup.delete(-1);

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">Open Tabs</h2>
      </div>

      {/* Render Chrome tab groups */}
      {Array.from(byGroup.entries()).map(([groupId, groupTabs]) => {
        const group = groups.get(groupId);
        const groupName = group?.title || 'Unnamed Group';
        const colorVar = group?.color ? `var(--color-${group.color})` : 'var(--color-grey)';

        return (
          <>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone */}
            <div
              key={groupId}
              className={`tab-group ${dragOverGroupId === groupId ? 'tab-group--drop-target' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverGroupId(groupId);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverGroupId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverGroupId(null);
                const tabIdStr = e.dataTransfer.getData('text/plain');
                if (tabIdStr) {
                  onMoveTabToGroup(Number.parseInt(tabIdStr, 10), groupName);
                }
              }}
            >
              <div className="tab-group__header">
                <span className="tab-group__dot" style={{ backgroundColor: colorVar }} />
                <span className="tab-group__name">{groupName}</span>
                <span className="tab-group__count">{groupTabs.length}</span>
                <button
                  type="button"
                  className="close-btn close-btn--group"
                  onClick={() => onCloseGroup(groupTabs.map((t) => t.id!))}
                  title={`Close all ${groupTabs.length} tabs in "${groupName}"`}
                >
                  ×
                </button>
              </div>
              {groupTabs.map((tab) => (
                <TabItem
                  key={tab.id}
                  id={tab.id!}
                  url={tab.url!}
                  title={tab.title ?? tab.url!}
                  favIconUrl={tab.favIconUrl ?? ''}
                  isActive={tab.active ?? false}
                  onSwitchTab={onSwitchTab}
                  onCloseTab={onCloseTab}
                />
              ))}
            </div>
          </>
        );
      })}

      {/* Render ungrouped tabs */}
      {ungrouped.length > 0 && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone */}
          <div
            className={`tab-group tab-group--ungrouped ${dragOverGroupId === -1 ? 'tab-group--drop-target' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverGroupId(-1);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverGroupId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverGroupId(null);
              const tabIdStr = e.dataTransfer.getData('text/plain');
              if (tabIdStr) {
                onMoveTabToGroup(Number.parseInt(tabIdStr, 10), 'Ungrouped');
              }
            }}
          >
            <div className="tab-group__header">
              <span className="tab-group__dot tab-group__dot--dashed" />
              <span className="tab-group__name">Ungrouped</span>
              {ungrouped.some((t) => isClassifiableUrl(t.url)) && (
                <button
                  type="button"
                  className="btn btn--sm btn--primary ungrouped-action"
                  onClick={() =>
                    onCleanUp(ungrouped.filter((t) => isClassifiableUrl(t.url)).map((t) => t.id!))
                  }
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? 'Cleaning Up...' : 'Clean Up'}
                </button>
              )}
              <button
                type="button"
                className="close-btn close-btn--group"
                onClick={() => onCloseGroup(ungrouped.map((t) => t.id!))}
                title="Close all ungrouped tabs"
              >
                ×
              </button>
            </div>
            {ungrouped.map((tab) => (
              <TabItem
                key={tab.id}
                id={tab.id!}
                url={tab.url!}
                title={tab.title ?? tab.url!}
                favIconUrl={tab.favIconUrl ?? ''}
                isActive={tab.active ?? false}
                isHttp={isClassifiableUrl(tab.url)}
                onSwitchTab={onSwitchTab}
                onCloseTab={onCloseTab}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
