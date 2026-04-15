import { clsx } from 'clsx';
import type { BookmarkFolder } from '@/lib/types';
import { CopyLinksButton } from './CopyLinksButton';
import { InlineEdit } from './InlineEdit';

// ─── Drag Keys ──────────────────────────────────────────────────

export const DRAG_KEY_BOOKMARK_FOLDER = 'application/x-bookmark-folder-id';

// ─── Props ──────────────────────────────────────────────────────

interface FolderItemProps {
  folder: BookmarkFolder;
  isExpanded: boolean;
  isDragOver: boolean;
  onToggleExpand: () => void;
  onOpenFolder: () => void;
  onDeleteFolder: () => void;
  onOpenBookmark: (url: string) => void;
  onDeleteBookmark: (bookmarkId: string, folderId: string) => void;
  onRenameFolder: (newName: string) => void;
  onBookmarkDragOver: (e: React.DragEvent) => void;
  onBookmarkDragLeave: (e: React.DragEvent) => void;
  onBookmarkDrop: (e: React.DragEvent) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function FolderItem({
  folder,
  isExpanded,
  isDragOver,
  onToggleExpand,
  onOpenFolder,
  onDeleteFolder,
  onOpenBookmark,
  onDeleteBookmark,
  onRenameFolder,
  onBookmarkDragOver,
  onBookmarkDragLeave,
  onBookmarkDrop,
}: FolderItemProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone
    <div
      className={clsx('flex flex-col gap-0.5', isDragOver && 'drop-target')}
      onDragOver={onBookmarkDragOver}
      onDragLeave={onBookmarkDragLeave}
      onDrop={onBookmarkDrop}
    >
      {/* Folder header row — draggable to assign to sections */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Drag source for section assignment */}
      <div
        className="group/header mb-1 flex items-center gap-1.5 py-1"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_KEY_BOOKMARK_FOLDER, folder.id);
        }}
      >
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-2 border-0 bg-transparent text-left font-sans text-inherit"
          onClick={onToggleExpand}
        >
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
        </button>
        <InlineEdit
          value={folder.title}
          onSave={(newName) => onRenameFolder(newName)}
          className="font-semibold text-xs"
          suffix={
            <span className="rounded-md bg-white/10 light:bg-black/8 px-1.5 py-px text-[11px] opacity-0 transition-opacity duration-150 group-hover/header:opacity-100">
              {folder.childCount}
            </span>
          }
        />
        <CopyLinksButton
          links={folder.bookmarks.map((b) => ({ title: b.title || b.url, url: b.url }))}
          groupName={folder.title}
        />
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-blue) group-hover/header:opacity-100"
          onClick={onOpenFolder}
          title={`Open "${folder.title}" as tab group`}
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
            aria-label="Open as tab group"
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </button>
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-red) group-hover/header:opacity-100"
          onClick={onDeleteFolder}
          title={`Delete "${folder.title}" folder`}
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
            aria-label="Delete"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded bookmark list */}
      {isExpanded && folder.bookmarks && (
        <BookmarkList
          folder={folder}
          onOpenBookmark={onOpenBookmark}
          onDeleteBookmark={onDeleteBookmark}
        />
      )}
    </div>
  );
}

// ─── Bookmark List (internal) ───────────────────────────────────

interface BookmarkListProps {
  folder: BookmarkFolder;
  onOpenBookmark: (url: string) => void;
  onDeleteBookmark: (bookmarkId: string, folderId: string) => void;
}

function BookmarkList({ folder, onOpenBookmark, onDeleteBookmark }: BookmarkListProps) {
  return (
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
            // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop source
            <div
              key={bookmark.id}
              className="group/row flex cursor-grab items-center rounded-md transition-colors duration-150 hover:bg-white/5 light:hover:bg-black/5 active:cursor-grabbing"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', bookmark.id);
                e.dataTransfer.setData('application/x-folder-id', folder.id);
              }}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent px-2 py-1.5 text-left font-sans text-inherit"
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
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                      }
                    }}
                  />
                ) : null}
                <span
                  className="h-4 w-4 shrink-0 rounded-[2px] bg-(--color-grey)"
                  style={{ display: faviconUrl ? 'none' : 'block' }}
                />
                <span className="truncate text-[13px]">{bookmark.title || bookmark.url}</span>
              </button>
              <button
                type="button"
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-red) group-hover/row:opacity-100"
                onClick={() => onDeleteBookmark(bookmark.id, folder.id)}
                title="Delete bookmark"
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
                  aria-label="Delete"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
