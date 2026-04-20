import { clsx } from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import type { BookmarkFolder } from '@/lib/types';
import { useFolderSections } from '../hooks/useFolderSections';
import { DRAG_KEY_BOOKMARK_FOLDER, FolderItem } from './FolderItem';
import { DRAG_KEY_SECTION, SectionDivider } from './SectionDivider';

// ─── Types ──────────────────────────────────────────────────────

/** Discriminated union for drag-over visual feedback targets. */
type DragOverTarget =
  | { type: 'folder'; folderId: string }
  | { type: 'section'; sectionId: string }
  | null;

interface FolderListProps {
  folders: BookmarkFolder[];
  isFetching: boolean;
  onOpenFolder: (folderId: string) => void;
  onOpenBookmark: (url: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteBookmark: (bookmarkId: string, folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onMoveBookmark: (bookmarkId: string, targetFolderId: string) => void;
  getFolderAnnotation: (folderId: string) => string;
  onAnnotateFolder: (folderId: string, text: string) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function FolderList({
  folders,
  isFetching,
  onOpenFolder,
  onOpenBookmark,
  onDeleteFolder,
  onDeleteBookmark,
  onRenameFolder,
  onMoveBookmark,
  getFolderAnnotation,
  onAnnotateFolder,
}: FolderListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');

  const {
    sections,
    collapsed,
    addSection,
    renameSection,
    deleteSection,
    toggleCollapsed,
    assignFolderToSection,
    reorderSections,
  } = useFolderSections();

  // ── Derived data ────────────────────────────────────────────

  /** Quick lookup: folderId → BookmarkFolder */
  const folderById = useMemo(() => {
    const map = new Map<string, BookmarkFolder>();
    for (const f of folders) map.set(f.id, f);
    return map;
  }, [folders]);

  /** Set of folder IDs assigned to any section. */
  const assignedFolderIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of sections) {
      for (const fid of s.folderIds) set.add(fid);
    }
    return set;
  }, [sections]);

  /** Folders not assigned to any section. */
  const unsortedFolders = useMemo(
    () => folders.filter((f) => !assignedFolderIds.has(f.id)),
    [folders, assignedFolderIds],
  );

  const hasSections = sections.length > 0;

  // ── Folder toggle ───────────────────────────────────────────

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // ── Bookmark drop handler (existing behavior) ──────────────

  const handleBookmarkDragOver = useCallback((folderId: string, e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DRAG_KEY_BOOKMARK_FOLDER)) return;
    e.preventDefault();
    setDragOverTarget({ type: 'folder', folderId });
  }, []);

  const handleBookmarkDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTarget(null);
    }
  }, []);

  const handleBookmarkDrop = useCallback(
    (targetFolderId: string, e: React.DragEvent) => {
      e.preventDefault();
      setDragOverTarget(null);
      const bookmarkId = e.dataTransfer.getData('text/plain');
      const sourceFolderId = e.dataTransfer.getData('application/x-folder-id');
      if (bookmarkId && sourceFolderId !== targetFolderId) {
        onMoveBookmark(bookmarkId, targetFolderId);
      }
    },
    [onMoveBookmark],
  );

  // ── Add section ─────────────────────────────────────────────

  const handleAddSection = useCallback(() => {
    const trimmed = newSectionLabel.trim();
    if (!trimmed) return;
    addSection(trimmed);
    setNewSectionLabel('');
    setIsAddingSection(false);
  }, [newSectionLabel, addSection]);

  // ── Render helpers ──────────────────────────────────────────

  const renderFolderItem = (folder: BookmarkFolder) => (
    <FolderItem
      key={folder.id}
      folder={folder}
      isExpanded={expandedFolders.has(folder.id)}
      isDragOver={dragOverTarget?.type === 'folder' && dragOverTarget.folderId === folder.id}
      onToggleExpand={() => toggleFolder(folder.id)}
      onOpenFolder={() => onOpenFolder(folder.id)}
      onDeleteFolder={() => onDeleteFolder(folder.id)}
      onOpenBookmark={onOpenBookmark}
      onDeleteBookmark={onDeleteBookmark}
      onRenameFolder={(newName) => onRenameFolder(folder.id, newName)}
      onBookmarkDragOver={(e) => handleBookmarkDragOver(folder.id, e)}
      onBookmarkDragLeave={handleBookmarkDragLeave}
      onBookmarkDrop={(e) => handleBookmarkDrop(folder.id, e)}
      annotation={getFolderAnnotation(folder.id)}
      onAnnotate={(text) => onAnnotateFolder(folder.id, text)}
    />
  );

  // ── Loading state ───────────────────────────────────────────

  if (isFetching && folders.length === 0) {
    return (
      <div className="py-6 text-center text-(--color-grey) text-[13px]">Loading folders...</div>
    );
  }

  // ── Main render ─────────────────────────────────────────────

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
          {/* Named sections + their folders */}
          {sections.map((section, sectionIndex) => {
            // Filter out stale folder IDs (deleted externally in Chrome)
            const sectionFolders = section.folderIds
              .map((fid) => folderById.get(fid))
              .filter((f): f is BookmarkFolder => f !== undefined);

            const isCollapsed = collapsed[section.id] ?? false;

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: Drop target for section reorder + folder assignment
              <div
                key={section.id}
                className={clsx(
                  'rounded',
                  dragOverTarget?.type === 'section' &&
                    dragOverTarget.sectionId === section.id &&
                    'drop-target',
                )}
                onDragOver={(e) => {
                  const types = e.dataTransfer.types;
                  if (
                    !types.includes(DRAG_KEY_SECTION) &&
                    !types.includes(DRAG_KEY_BOOKMARK_FOLDER)
                  )
                    return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverTarget({ type: 'section', sectionId: section.id });
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverTarget(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverTarget(null);
                  const draggedId = e.dataTransfer.getData(DRAG_KEY_SECTION);
                  if (draggedId) {
                    const fromIndex = sections.findIndex((s) => s.id === draggedId);
                    if (fromIndex !== -1) reorderSections(fromIndex, sectionIndex);
                    return;
                  }
                  const folderId = e.dataTransfer.getData(DRAG_KEY_BOOKMARK_FOLDER);
                  if (folderId) assignFolderToSection(folderId, section.id);
                }}
              >
                <SectionDivider
                  sectionId={section.id}
                  label={section.label}
                  isCollapsed={isCollapsed}
                  onToggleCollapsed={() => toggleCollapsed(section.id)}
                  onRename={(newLabel) => renameSection(section.id, newLabel)}
                  onDelete={() => deleteSection(section.id)}
                />
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {sectionFolders.length === 0 ? (
                      <div className="px-6 py-1.5 text-[12px] opacity-40">
                        No folders in this section
                      </div>
                    ) : (
                      sectionFolders.map(renderFolderItem)
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unsorted folders (or all folders when no sections exist) */}
          {hasSections && unsortedFolders.length > 0 ? (
            // biome-ignore lint/a11y/noStaticElementInteractions: Drop target for folder unassignment
            <div
              className={clsx(
                'rounded',
                dragOverTarget?.type === 'section' &&
                  dragOverTarget.sectionId === 'unsorted' &&
                  'drop-target',
              )}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(DRAG_KEY_BOOKMARK_FOLDER)) {
                  e.preventDefault();
                  setDragOverTarget({ type: 'section', sectionId: 'unsorted' });
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverTarget(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverTarget(null);
                const folderId = e.dataTransfer.getData(DRAG_KEY_BOOKMARK_FOLDER);
                if (folderId) assignFolderToSection(folderId, null);
              }}
            >
              <div className="flex items-center gap-2 py-1.5">
                <span className="font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
                  Unsorted
                </span>
              </div>
              <div className="flex flex-col gap-0.5">{unsortedFolders.map(renderFolderItem)}</div>
            </div>
          ) : (
            (hasSections ? unsortedFolders : folders).map(renderFolderItem)
          )}
        </div>
      )}

      {/* + Add Section button */}
      <div className="mt-2">
        {isAddingSection ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded border border-white/20 light:border-black/15 bg-white/10 light:bg-white px-2 py-1 font-sans text-[12px] text-inherit outline-none focus:border-blue-500"
              placeholder="Section name..."
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSection();
                else if (e.key === 'Escape') {
                  setIsAddingSection(false);
                  setNewSectionLabel('');
                }
              }}
              onBlur={() => {
                if (newSectionLabel.trim()) handleAddSection();
                else {
                  setIsAddingSection(false);
                  setNewSectionLabel('');
                }
              }}
              // biome-ignore lint/a11y/noAutofocus: UX requirement — user just clicked "+ Add Section"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            className="w-full cursor-pointer rounded-md border border-dashed border-white/15 light:border-black/15 bg-transparent py-1.5 font-sans text-(--color-grey) text-[12px] transition-colors duration-150 hover:border-white/30 light:hover:border-black/30 hover:text-white/87 light:hover:text-(--color-text-light)"
            onClick={() => setIsAddingSection(true)}
          >
            + Add Section
          </button>
        )}
      </div>
    </section>
  );
}
