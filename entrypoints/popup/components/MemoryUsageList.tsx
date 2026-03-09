import { clsx } from 'clsx';
import type { TabMemoryInfo } from '@/lib/types';

const badgeClasses: Record<string, string> = {
  high: 'text-(--color-red) bg-red-500/15',
  medium: 'text-amber-500 bg-amber-500/15',
  low: 'text-(--color-grey) bg-white/10 light:bg-black/5',
};

interface MemoryUsageListProps {
  memoryInfos: TabMemoryInfo[];
  isFetching: boolean;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
}

export function MemoryUsageList({
  memoryInfos,
  isFetching,
  onSwitchTab,
  onCloseTab,
}: MemoryUsageListProps) {
  if (isFetching && memoryInfos.length === 0) {
    return (
      <div className="py-6 text-center text-(--color-grey) text-[13px]">
        Calculating memory usage...
      </div>
    );
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Memory Usage
        </h2>
      </div>
      <div className="mb-3">
        {memoryInfos.length === 0 ? (
          <div className="p-2 text-(--color-grey) text-[13px] opacity-70">
            No memory data available for current tabs.
          </div>
        ) : (
          memoryInfos.map((info) => (
            <div
              key={info.tabId}
              className="flex items-center rounded-md transition-colors duration-150 hover:bg-white/6 light:hover:bg-black/4"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left font-sans text-inherit"
                onClick={() => onSwitchTab(info.tabId)}
                title={info.url}
              >
                {info.favIconUrl ? (
                  <img
                    className="h-4 w-4 shrink-0 rounded-[2px]"
                    src={info.favIconUrl}
                    alt=""
                    width={16}
                    height={16}
                  />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-[2px] bg-(--color-grey)" />
                )}
                <span className="flex-1 truncate text-[13px]">{info.title || info.url}</span>
                {info.memoryLevel && (
                  <span
                    className={clsx(
                      'ml-2 shrink-0 rounded px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider',
                      badgeClasses[info.memoryLevel],
                    )}
                  >
                    {info.memoryLevel.charAt(0).toUpperCase() + info.memoryLevel.slice(1)}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) leading-none transition-[opacity,color] duration-150 hover:text-(--color-red)"
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
