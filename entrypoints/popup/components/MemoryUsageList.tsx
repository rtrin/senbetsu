import type { TabMemoryInfo } from '@/lib/types';

interface MemoryUsageListProps {
  memoryInfos: TabMemoryInfo[];
  isFetching: boolean;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onRefresh: () => void;
}

function formatMemory(mb: number): string {
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(mb * 1024).toFixed(0)} KB`;
}

export function MemoryUsageList({
  memoryInfos,
  isFetching,
  onSwitchTab,
  onCloseTab,
  onRefresh,
}: MemoryUsageListProps) {
  if (isFetching && memoryInfos.length === 0) {
    return <div className="memory-loading">Calculating memory usage...</div>;
  }

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">Memory Usage</h2>
        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isFetching}
          title="Refresh memory usage"
        >
          {isFetching ? '...' : '↻'}
        </button>
      </div>
      <div className="tab-group">
        {memoryInfos.length === 0 ? (
          <div
            className="tab-item-row"
            style={{ padding: '8px', opacity: 0.7, fontSize: '13px', color: 'var(--color-grey)' }}
          >
            No memory data available for current tabs.
          </div>
        ) : (
          memoryInfos.map((info, idx) => (
            <div key={info.tabId} className="tab-item-row">
              <button
                type="button"
                className="tab-item"
                onClick={() => onSwitchTab(info.tabId)}
                title={info.url}
              >
                {info.favIconUrl ? (
                  <img
                    className="tab-item__favicon"
                    src={info.favIconUrl}
                    alt=""
                    width={16}
                    height={16}
                  />
                ) : (
                  <span className="tab-item__favicon-fallback" />
                )}
                <span className="tab-item__title">{info.title || info.url}</span>
                <span
                  className="tab-item__memory"
                  style={{
                    fontWeight: idx < 3 ? 'bold' : 'normal',
                    color: idx < 3 && info.jsHeapUsedMB > 10 ? 'var(--color-red)' : 'inherit',
                  }}
                >
                  {formatMemory(info.jsHeapUsedMB)}
                </span>
              </button>
              <button
                type="button"
                className="close-btn close-btn--tab"
                onClick={() => onCloseTab(info.tabId)}
                title="Close tab"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
