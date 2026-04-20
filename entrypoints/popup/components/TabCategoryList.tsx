import { clsx } from 'clsx';
import { useState } from 'react';
import { isClassifiableUrl } from '@/lib/utils';
import { CopyLinksButton } from './CopyLinksButton';
import { InlineEdit } from './InlineEdit';
import { NoteEdit } from './NoteEdit';
import { TabItem } from './TabItem';

interface TabCategoryListProps {
  tabs: chrome.tabs.Tab[];
  groups: Map<number, chrome.tabGroups.TabGroup>;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onCloseGroup: (tabIds: number[]) => void;
  onMoveTabToGroup: (tabId: number, targetGroupName: string) => void;
  onBookmarkTab: (tabId: number) => void;
  onSaveGroupToFolder: (tabIds: number[], groupName: string, groupId?: number) => void;
  onRenameGroup: (groupId: number, newName: string) => void;
  onUngroupTabs: (tabIds: number[]) => void;
  getGroupAnnotation: (groupId: number) => string;
  onAnnotateGroup: (groupId: number, text: string) => void;
}

export function TabCategoryList({
  tabs,
  groups,
  onSwitchTab,
  onCloseTab,
  onCloseGroup,
  onMoveTabToGroup,
  onBookmarkTab,
  onSaveGroupToFolder,
  onRenameGroup,
  onUngroupTabs,
  getGroupAnnotation,
  onAnnotateGroup,
}: TabCategoryListProps) {
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);
  const [isAddingNote, setIsAddingNote] = useState<Record<number, boolean>>({});

  const validTabs = tabs.filter((t) => t.id && t.url);
  if (validTabs.length === 0) return null;

  const byGroup = new Map<number, chrome.tabs.Tab[]>();
  for (const tab of validTabs) {
    const gid = tab.groupId ?? -1;
    const existing = byGroup.get(gid) ?? [];
    existing.push(tab);
    byGroup.set(gid, existing);
  }

  const ungrouped = byGroup.get(-1) ?? [];
  byGroup.delete(-1);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Open Tabs
        </h2>
      </div>

      {Array.from(byGroup.entries()).map(([groupId, groupTabs]) => {
        const group = groups.get(groupId);
        const groupName = group?.title || 'Unnamed Group';
        const colorVar = group?.color ? `var(--color-${group.color})` : 'var(--color-grey)';
        const hasNote = !!getGroupAnnotation(groupId);

        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone
          <div
            key={groupId}
            className={clsx('mb-3', dragOverGroupId === groupId && 'drop-target')}
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
            <div className="group/header mb-1 flex items-center gap-1.5 py-1">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: colorVar }}
              />
              <InlineEdit
                value={groupName}
                onSave={(newName) => onRenameGroup(groupId, newName)}
                className="font-semibold text-xs"
                suffix={
                  <span className="rounded-md bg-white/10 light:bg-black/8 px-1.5 py-px text-[11px] opacity-0 transition-opacity duration-150 group-hover/header:opacity-100">
                    {groupTabs.length}
                  </span>
                }
              />
              <CopyLinksButton
                links={groupTabs.map((t) => ({ title: t.title ?? t.url!, url: t.url! }))}
                groupName={groupName}
              />
              {!hasNote && (
                <button
                  type="button"
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-yellow) group-hover/header:opacity-100"
                  onClick={() => setIsAddingNote((prev) => ({ ...prev, [groupId]: true }))}
                  title="Add note"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    role="img"
                    aria-label="Add note"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-blue) group-hover/header:opacity-100"
                onClick={() =>
                  onSaveGroupToFolder(
                    groupTabs.map((t) => t.id!),
                    groupName,
                    groupId,
                  )
                }
                title={`Save "${groupName}" as bookmark folder`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Save to folder"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-orange) group-hover/header:opacity-100"
                onClick={() => onUngroupTabs(groupTabs.map((t) => t.id!))}
                title={`Ungroup all tabs in "${groupName}"`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Ungroup"
                >
                  <rect x="1" y="1" width="10" height="10" rx="2" />
                  <rect x="13" y="13" width="10" height="10" rx="2" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-red) group-hover/header:opacity-100"
                onClick={() => onCloseGroup(groupTabs.map((t) => t.id!))}
                title={`Close all ${groupTabs.length} tabs in "${groupName}"`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Close"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            {(hasNote || isAddingNote[groupId]) && (
              <NoteEdit
                value={getGroupAnnotation(groupId)}
                onSave={(text) => {
                  onAnnotateGroup(groupId, text);
                  if (!text.trim()) setIsAddingNote((prev) => ({ ...prev, [groupId]: false }));
                }}
              />
            )}
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
                onBookmarkTab={onBookmarkTab}
              />
            ))}
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone
        <div
          className={clsx('mb-3', dragOverGroupId === -1 && 'drop-target')}
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
          <div className="group/header mb-1 flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 shrink-0 rounded-full border-(--color-grey) border-[1.5px] border-dashed bg-transparent" />
            <span className="flex-1 font-semibold text-xs">Ungrouped</span>
            <CopyLinksButton
              links={ungrouped.map((t) => ({ title: t.title ?? t.url!, url: t.url! }))}
              groupName="Ungrouped"
            />
            <button
              type="button"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-red) group-hover/header:opacity-100"
              onClick={() => onCloseGroup(ungrouped.map((t) => t.id!))}
              title="Close all ungrouped tabs"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Close"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
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
              onBookmarkTab={onBookmarkTab}
            />
          ))}
        </div>
      )}
    </section>
  );
}
