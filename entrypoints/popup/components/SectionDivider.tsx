import { InlineEdit } from './InlineEdit';

// ─── Drag Keys ──────────────────────────────────────────────────

export const DRAG_KEY_SECTION = 'application/x-section-id';

// ─── Props ──────────────────────────────────────────────────────

interface SectionDividerProps {
  sectionId: string;
  label: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onRename: (newLabel: string) => void;
  onDelete: () => void;
}

// ─── Component ──────────────────────────────────────────────────

export function SectionDivider({
  sectionId,
  label,
  isCollapsed,
  onToggleCollapsed,
  onRename,
  onDelete,
}: SectionDividerProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_KEY_SECTION, sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Drag source for section reordering
    <div
      className="group/section flex cursor-grab items-center gap-2 rounded py-1.5 active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Collapse chevron */}
      <button
        type="button"
        className="flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey)"
        onClick={onToggleCollapsed}
        title={isCollapsed ? 'Expand section' : 'Collapse section'}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
          role="img"
          aria-label="Toggle section"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Label (editable) */}
      <div className="group/header flex min-w-0 flex-1 items-center gap-1">
        <InlineEdit
          value={label}
          onSave={onRename}
          className="font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider"
        />
      </div>

      {/* Delete button (hover-reveal) */}
      <button
        type="button"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-(--color-grey) opacity-0 transition-[opacity,color] duration-150 hover:text-(--color-red) group-hover/section:opacity-100"
        onClick={onDelete}
        title={`Delete "${label}" section`}
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
          aria-label="Delete section"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
