import { clsx } from 'clsx';

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
    // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop dropzone
    <div
      className="group/row flex cursor-grab items-center rounded-md transition-colors duration-150 hover:bg-white/6 light:hover:bg-black/4 active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', id.toString());
      }}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left font-sans text-inherit"
        onClick={() => onSwitchTab(id)}
        title={url}
      >
        {favIconUrl ? (
          <img
            className="h-4 w-4 shrink-0 rounded-[2px]"
            src={favIconUrl}
            alt=""
            width={16}
            height={16}
          />
        ) : (
          <span className="h-4 w-4 shrink-0 rounded-[2px] bg-(--color-grey)" />
        )}
        <span className={clsx('flex-1 truncate text-[13px]', isActive && 'font-semibold')}>
          {title || url}
        </span>
        {!isHttp && (
          <span className="ml-auto shrink-0 rounded bg-white/10 light:bg-black/5 px-1 py-0.5 text-(--color-grey) text-[9px] uppercase tracking-wider">
            system
          </span>
        )}
      </button>
      {isHttp && (
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-yellow) group-hover/row:opacity-100"
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
      )}
      <button
        type="button"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-red) group-hover/row:opacity-100"
        onClick={() => onCloseTab(id)}
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
  );
}
