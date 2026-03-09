import { useState } from 'react';
import type { BookmarkFolder } from '@/lib/types';

interface FolderListProps {
  folders: BookmarkFolder[];
  isFetching: boolean;
  onOpenFolder: (folderId: string) => void;
  onOpenBookmark: (url: string) => void;
}

export function FolderList({ folders, isFetching, onOpenFolder, onOpenBookmark }: FolderListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  if (isFetching && folders.length === 0) {
    return (
      <div className="py-6 text-center text-(--color-grey) text-[13px]">Loading folders...</div>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Bookmark Folders
        </h2>
      </div>
      {folders.length === 0 ? (
        <div className="px-2 py-3 text-center text-[13px] opacity-60">
          No bookmark folders in the Bookmarks Bar.
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {folders.map((folder) => {
            const isExpanded = expandedFolders.has(folder.id);
            return (
              <div key={folder.id} className="flex flex-col gap-0.5">
                {/* Folder header row */}
                <div className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/5 light:hover:bg-black/5">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent text-left font-sans text-inherit"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {/* Chevron */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 opacity-50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      role="img"
                      aria-label="Toggle folder"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    {/* Folder icon */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 opacity-60"
                      role="img"
                      aria-label="Folder"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="truncate text-[13px]">{folder.title}</span>
                    <span className="mr-2 shrink-0 rounded-lg bg-white/10 light:bg-black/8 px-1.5 py-px text-[11px]">
                      {folder.childCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg border-0 bg-blue-500 px-3 py-1.5 font-sans font-semibold text-white text-xs transition-[opacity,background-color] duration-150 enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onOpenFolder(folder.id)}
                  >
                    Open
                  </button>
                </div>

                {/* Expanded bookmark list */}
                {isExpanded && folder.bookmarks && (
                  <div className="ml-3.5 flex flex-col gap-0.5 border-white/10 light:border-black/10 border-l pl-1.5">
                    {folder.bookmarks.length === 0 ? (
                      <div className="px-2 py-1.5 text-[12px] opacity-40">Empty folder</div>
                    ) : (
                      folder.bookmarks.map((bookmark) => {
                        let faviconUrl = '';
                        try {
                          const domain = new URL(bookmark.url).hostname;
                          faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                        } catch {
                          // Invalid URL — use fallback
                        }

                        return (
                          <button
                            key={bookmark.id}
                            type="button"
                            className="flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left font-sans text-inherit transition-colors duration-150 hover:bg-white/5 light:hover:bg-black/5"
                            onClick={() => onOpenBookmark(bookmark.url)}
                            title={bookmark.url}
                          >
                            {faviconUrl ? (
                              <img
                                className="h-4 w-4 shrink-0 rounded-[2px]"
                                src={faviconUrl}
                                alt=""
                                width={16}
                                height={16}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    (
                                      e.currentTarget.nextElementSibling as HTMLElement
                                    ).style.display = 'block';
                                  }
                                }}
                              />
                            ) : null}
                            <span
                              className="h-4 w-4 shrink-0 rounded-[2px] bg-(--color-grey)"
                              style={{ display: faviconUrl ? 'none' : 'block' }}
                            />
                            <span className="truncate text-[13px]">
                              {bookmark.title || bookmark.url}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
