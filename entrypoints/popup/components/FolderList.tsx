import type { BookmarkFolder } from '@/lib/types';

interface FolderListProps {
  folders: BookmarkFolder[];
  isFetching: boolean;
  onOpenFolder: (folderId: string) => void;
}

export function FolderList({ folders, isFetching, onOpenFolder }: FolderListProps) {
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
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/5 light:hover:bg-black/5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
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
              </div>
              <button
                type="button"
                className="cursor-pointer rounded-lg border-0 bg-blue-500 px-3 py-1.5 font-sans font-semibold text-white text-xs transition-[opacity,background-color] duration-150 enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onOpenFolder(folder.id)}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
