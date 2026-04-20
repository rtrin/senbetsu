import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

type AnnotationMap = Record<string, string>;

const tabKey = (tabId: number) => `tab:${tabId}`;
const groupKey = (groupId: number) => `group:${groupId}`;
const folderKey = (folderId: string) => `folder:${folderId}`;

async function load(): Promise<AnnotationMap> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.annotations);
  return (result[STORAGE_KEYS.annotations] as AnnotationMap) ?? {};
}

async function save(annotations: AnnotationMap): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.annotations]: annotations });
}

function upsert(map: AnnotationMap, key: string, text: string): AnnotationMap {
  const trimmed = text.trim();
  if (trimmed) return { ...map, [key]: trimmed };
  const { [key]: _, ...rest } = map;
  return rest;
}

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<AnnotationMap>({});

  useEffect(() => {
    load().then(setAnnotations);

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (STORAGE_KEYS.annotations in changes) {
        const newValue = changes[STORAGE_KEYS.annotations].newValue as AnnotationMap | undefined;
        setAnnotations(newValue ?? {});
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const setTabAnnotation = useCallback((tabId: number, text: string) => {
    setAnnotations((current) => {
      const updated = upsert(current, tabKey(tabId), text);
      save(updated);
      return updated;
    });
  }, []);

  const setGroupAnnotation = useCallback((groupId: number, text: string) => {
    setAnnotations((current) => {
      const updated = upsert(current, groupKey(groupId), text);
      save(updated);
      return updated;
    });
  }, []);

  const getTabAnnotation = useCallback(
    (tabId: number) => annotations[tabKey(tabId)] ?? '',
    [annotations],
  );

  const getGroupAnnotation = useCallback(
    (groupId: number) => annotations[groupKey(groupId)] ?? '',
    [annotations],
  );

  const setFolderAnnotation = useCallback((folderId: string, text: string) => {
    setAnnotations((current) => {
      const updated = upsert(current, folderKey(folderId), text);
      save(updated);
      return updated;
    });
  }, []);

  const getFolderAnnotation = useCallback(
    (folderId: string) => annotations[folderKey(folderId)] ?? '',
    [annotations],
  );

  return {
    getTabAnnotation,
    getGroupAnnotation,
    getFolderAnnotation,
    setTabAnnotation,
    setGroupAnnotation,
    setFolderAnnotation,
  };
}
