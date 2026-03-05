export interface SharedTabItemProps {
  id: number;
  url: string;
  title: string;
  favIconUrl: string;
  isActive: boolean;
  isHttp?: boolean;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onBookmarkTab: (tabId: number) => void;
}

export function TabItem({
  id,
  url,
  title,
  favIconUrl,
  isActive,
  isHttp = true,
  onSwitchTab,
  onCloseTab,
  onBookmarkTab,
}: SharedTabItemProps) {
  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone */}
      <div
        className="tab-item-row"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', id.toString());
        }}
      >
        <button
          type="button"
          className={`tab-item ${isActive ? 'tab-item--active' : ''}`}
          onClick={() => onSwitchTab(id)}
          title={url}
        >
          {favIconUrl ? (
            <img className="tab-item__favicon" src={favIconUrl} alt="" width={16} height={16} />
          ) : (
            <span className="tab-item__favicon-fallback" />
          )}
          <span className="tab-item__title">{title || url}</span>
          {!isHttp && <span className="tab-item__badge">system</span>}
        </button>
        <button
          type="button"
          className="action-btn action-btn--bookmark"
          onClick={() => onBookmarkTab(id)}
          title="Bookmark tab"
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
            aria-label="Bookmark"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button
          type="button"
          className="close-btn close-btn--tab"
          onClick={() => onCloseTab(id)}
          title="Close tab"
        >
          ×
        </button>
      </div>
    </>
  );
}
