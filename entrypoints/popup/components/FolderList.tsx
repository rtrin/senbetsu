import type { BookmarkFolder } from '@/lib/types';

interface FolderListProps {
  folders: BookmarkFolder[];
  isFetching: boolean;
  onOpenFolder: (folderId: string) => void;
}

export function FolderList({ folders, isFetching, onOpenFolder }: FolderListProps) {
  if (isFetching && folders.length === 0) {
    return <div className="memory-loading">Loading folders...</div>;
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">Bookmark Folders</h2>
      </div>
      {folders.length === 0 ? (
        <div className="folder-empty">No bookmark folders in the Bookmarks Bar.</div>
      ) : (
        <div className="folder-list">
          {folders.map((folder) => (
            <div key={folder.id} className="folder-item">
              <div className="folder-item__info">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="folder-item__icon"
                  role="img"
                  aria-label="Folder"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="folder-item__name">{folder.title}</span>
                <span className="folder-item__count">{folder.childCount}</span>
              </div>
              <button
                type="button"
                className="btn btn--sm btn--primary"
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
