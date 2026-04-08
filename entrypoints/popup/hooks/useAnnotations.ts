import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

type AnnotationMap = Record<string, string>;

const tabKey = (tabId: number) => `tab:${tabId}`;
const groupKey = (groupId: number) => `group:${groupId}`;

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

  return { getTabAnnotation, getGroupAnnotation, setTabAnnotation, setGroupAnnotation };
}
