import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import type { FolderSection, FolderSectionsState } from '@/lib/types';

// ─── Default State ──────────────────────────────────────────────

const DEFAULT_STATE: FolderSectionsState = {
  sections: [],
  collapsed: {},
};

// ─── Storage Helpers ────────────────────────────────────────────

async function load(): Promise<FolderSectionsState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.folderSections);
  return (result[STORAGE_KEYS.folderSections] as FolderSectionsState) ?? { ...DEFAULT_STATE };
}

async function persist(state: FolderSectionsState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.folderSections]: state });
}

// ─── Hook ───────────────────────────────────────────────────────

/**
 * Manages folder section state in chrome.storage.local.
 * Follows the same pattern as useAnnotations: load on mount,
 * optimistic state updates, fire-and-forget saves.
 */
export function useFolderSections() {
  const [state, setState] = useState<FolderSectionsState>(DEFAULT_STATE);

  useEffect(() => {
    load().then(setState);
  }, []);

  /** Optimistic update + fire-and-forget save. */
  const update = useCallback((mutate: (current: FolderSectionsState) => FolderSectionsState) => {
    setState((current) => {
      const next = mutate(current);
      persist(next);
      return next;
    });
  }, []);

  const addSection = useCallback(
    (label: string) => {
      const newSection: FolderSection = {
        id: crypto.randomUUID(),
        label,
        folderIds: [],
      };
      update((current) => ({
        ...current,
        sections: [...current.sections, newSection],
      }));
    },
    [update],
  );

  const renameSection = useCallback(
    (id: string, label: string) => {
      update((current) => ({
        ...current,
        sections: current.sections.map((s) => (s.id === id ? { ...s, label } : s)),
      }));
    },
    [update],
  );

  const deleteSection = useCallback(
    (id: string) => {
      update((current) => {
        const { [id]: _, ...remainingCollapsed } = current.collapsed;
        return {
          sections: current.sections.filter((s) => s.id !== id),
          collapsed: remainingCollapsed,
        };
      });
    },
    [update],
  );

  const toggleCollapsed = useCallback(
    (id: string) => {
      update((current) => ({
        ...current,
        collapsed: {
          ...current.collapsed,
          [id]: !current.collapsed[id],
        },
      }));
    },
    [update],
  );

  const assignFolderToSection = useCallback(
    (folderId: string, sectionId: string | null) => {
      update((current) => {
        // Remove folderId from all sections first
        const cleaned = current.sections.map((s) => ({
          ...s,
          folderIds: s.folderIds.filter((fid) => fid !== folderId),
        }));

        // If sectionId is null, just unassign
        if (sectionId === null) {
          return { ...current, sections: cleaned };
        }

        // Add folderId to the target section
        return {
          ...current,
          sections: cleaned.map((s) =>
            s.id === sectionId ? { ...s, folderIds: [...s.folderIds, folderId] } : s,
          ),
        };
      });
    },
    [update],
  );

  const reorderSections = useCallback(
    (fromIndex: number, toIndex: number) => {
      update((current) => {
        const next = [...current.sections];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return { ...current, sections: next };
      });
    },
    [update],
  );

  return {
    sections: state.sections,
    collapsed: state.collapsed,
    addSection,
    renameSection,
    deleteSection,
    toggleCollapsed,
    assignFolderToSection,
    reorderSections,
  };
}
