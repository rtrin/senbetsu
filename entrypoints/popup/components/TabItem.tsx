export interface SharedTabItemProps {
  id: number;
  url: string;
  title: string;
  favIconUrl: string;
  isActive: boolean;
  isHttp?: boolean;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
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
}: SharedTabItemProps) {
  return (
    <div className="tab-item-row">
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
        className="close-btn close-btn--tab"
        onClick={() => onCloseTab(id)}
        title="Close tab"
      >
        ×
      </button>
    </div>
  );
}
