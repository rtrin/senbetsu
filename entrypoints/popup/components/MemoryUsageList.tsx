import { clsx } from 'clsx';
import type { AutoOffloadInterval, TabMemoryInfo } from '@/lib/types';

const badgeClasses: Record<string, string> = {
  high: 'text-(--color-red) bg-red-500/15',
  medium: 'text-amber-500 bg-amber-500/15',
  low: 'text-(--color-grey) bg-white/10 light:bg-black/5',
};

interface MemoryUsageListProps {
  memoryInfos: TabMemoryInfo[];
  isFetching: boolean;
  hasPermission: boolean | null;
  autoOffloadInterval: AutoOffloadInterval;
  isSavingAutoOffload: boolean;
  autoOffloadError?: string;
  onAutoOffloadIntervalChange: (interval: AutoOffloadInterval) => Promise<void>;
  onRequestPermission: () => void;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onOffloadTab: (tabId: number) => void;
  onOffloadAll: () => void;
}

export function MemoryUsageList({
  memoryInfos,
  isFetching,
  hasPermission,
  autoOffloadInterval,
  isSavingAutoOffload,
  autoOffloadError,
  onAutoOffloadIntervalChange,
  onRequestPermission,
  onSwitchTab,
  onCloseTab,
  onOffloadTab,
  onOffloadAll,
}: MemoryUsageListProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Memory Usage
        </h2>
        {hasPermission && memoryInfos.length > 0 && (
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-sans text-(--color-grey) text-[11px] transition-colors duration-150 hover:text-(--color-text) light:hover:text-(--color-text-light)"
            onClick={onOffloadAll}
            title="Offload all tabs to free memory"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Offload all"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            Offload All
          </button>
        )}
      </div>
      <div className="mb-3 flex flex-col gap-1 border-white/8 light:border-black/8 border-y py-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 font-medium text-[13px]">Automatic offload</p>
            <p className="m-0 text-(--color-grey) text-[11px]">
              Offload inactive tabs after the selected minimum time.
            </p>
          </div>
          <select
            className="rounded-lg border border-white/20 light:border-black/15 bg-white/5 light:bg-white px-2 py-1 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 focus:border-blue-500 light:focus:border-blue-500 focus:bg-white/10 disabled:opacity-60"
            value={autoOffloadInterval}
            disabled={isSavingAutoOffload}
            aria-label="Automatic offload interval"
            onChange={(event) => {
              const value = event.target.value;
              const interval: AutoOffloadInterval =
                value === 'off' ? 'off' : (Number(value) as 1 | 3 | 5);
              void onAutoOffloadIntervalChange(interval);
            }}
          >
            <option value="off">Off</option>
            <option value="1">1 minute</option>
            <option value="3">3 minutes</option>
            <option value="5">5 minutes</option>
          </select>
        </div>
        {autoOffloadError && (
          <p className="m-0 text-(--color-red) text-[11px]">{autoOffloadError}</p>
        )}
      </div>

      {hasPermission === false && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-(--color-grey) text-[13px]">
            Memory measurement requires permission to read tab data.
          </p>
          <button
            type="button"
            className="cursor-pointer rounded-lg border-0 bg-blue-500 px-4 py-2 font-sans font-semibold text-sm text-white transition-[opacity,background-color] duration-150 enabled:hover:bg-blue-600"
            onClick={onRequestPermission}
          >
            Grant Access
          </button>
        </div>
      )}

      {hasPermission === null || (isFetching && memoryInfos.length === 0) ? (
        <div className="py-6 text-center text-(--color-grey) text-[13px]">
          Calculating memory usage...
        </div>
      ) : hasPermission ? (
        <div>
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
                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) transition-[opacity,color] duration-150 hover:text-blue-400"
                    onClick={() => onOffloadTab(info.tabId)}
                    title="Offload tab"
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
                      aria-label="Offload"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) transition-[opacity,color] duration-150 hover:text-(--color-red)"
                    onClick={() => onCloseTab(info.tabId)}
                    title="Close tab"
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
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
