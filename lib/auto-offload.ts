import {
  AUTO_OFFLOAD_ALARM_NAME,
  AUTO_OFFLOAD_ALARM_PERIOD_MINUTES,
  STORAGE_KEYS,
} from './constants';
import { storage } from './storage';
import type { AutoOffloadInterval } from './types';

export interface AutoOffloadSweepResult {
  attempted: number;
  succeeded: number;
  failed: number;
  cancelled: boolean;
}

export function isEligibleForAutoOffload(
  tab: chrome.tabs.Tab,
  interval: AutoOffloadInterval,
  now = Date.now(),
): boolean {
  if (interval === 'off' || !Number.isInteger(tab.id) || (tab.id as number) < 0) return false;
  if (!Number.isFinite(now)) return false;
  if (!Number.isFinite(tab.lastAccessed) || (tab.lastAccessed as number) < 0) return false;
  if (now - (tab.lastAccessed as number) < interval * 60_000) return false;
  if (
    tab.active ||
    tab.pinned ||
    tab.incognito ||
    tab.audible ||
    tab.frozen ||
    tab.discarded ||
    tab.autoDiscardable === false ||
    tab.status !== 'complete'
  ) {
    return false;
  }

  if (typeof tab.url !== 'string') return false;
  try {
    const protocol = new URL(tab.url).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

type IsSweepCurrent = () => Promise<boolean>;
type IsGenerationCurrent = () => boolean;

export async function runAutoOffloadSweep(
  interval: AutoOffloadInterval,
  isCurrent: IsSweepCurrent = async () => true,
  now = Date.now(),
  isGenerationCurrent: IsGenerationCurrent = () => true,
): Promise<AutoOffloadSweepResult> {
  if (interval === 'off' || !(await isCurrent())) {
    return { attempted: 0, succeeded: 0, failed: 0, cancelled: true };
  }

  const tabs = await chrome.tabs.query({});
  const candidates = tabs.filter((tab) => isEligibleForAutoOffload(tab, interval, now));
  const results = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const tabId = candidate.id as number;
      if (!(await isCurrent())) return false;

      let latestTab: chrome.tabs.Tab | undefined;
      try {
        latestTab = await chrome.tabs.get(tabId);
      } catch {
        return false;
      }
      if (!latestTab) return false;
      if (!isEligibleForAutoOffload(latestTab, interval, Date.now())) return false;
      if (!isGenerationCurrent()) return false;

      await chrome.tabs.discard(tabId);
      return true;
    }),
  );
  const succeeded = results.filter(
    (result) => result.status === 'fulfilled' && result.value,
  ).length;
  const failed = results.filter((result) => result.status === 'rejected').length;

  return {
    attempted: succeeded + failed,
    succeeded,
    failed,
    cancelled: false,
  };
}

export interface AutoOffloadController {
  reconcile(): Promise<void>;
  onAlarm(alarm: chrome.alarms.Alarm): Promise<AutoOffloadSweepResult | undefined>;
  onStorageChanged(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ): Promise<void>;
}

export function createAutoOffloadController(): AutoOffloadController {
  let generation = 0;
  let reconciliationRequested = false;
  let reconciliationQueue = Promise.resolve();

  async function reconcileOnce(): Promise<void> {
    const interval = (await storage.getSettings()).autoOffloadInterval;
    if (interval === 'off') {
      await chrome.alarms.clear(AUTO_OFFLOAD_ALARM_NAME);
      return;
    }
    await chrome.alarms.create(AUTO_OFFLOAD_ALARM_NAME, {
      periodInMinutes: AUTO_OFFLOAD_ALARM_PERIOD_MINUTES,
    });
  }

  function reconcile(): Promise<void> {
    reconciliationRequested = true;
    const run = async () => {
      while (reconciliationRequested) {
        reconciliationRequested = false;
        await reconcileOnce();
      }
    };
    reconciliationQueue = reconciliationQueue.then(run, run);
    return reconciliationQueue;
  }

  async function isCurrent(expectedGeneration: number, interval: AutoOffloadInterval) {
    if (generation !== expectedGeneration) return false;
    const currentInterval = (await storage.getSettings()).autoOffloadInterval;
    return generation === expectedGeneration && currentInterval === interval;
  }

  async function onAlarm(alarm: chrome.alarms.Alarm): Promise<AutoOffloadSweepResult | undefined> {
    if (alarm.name !== AUTO_OFFLOAD_ALARM_NAME) return undefined;
    const interval = (await storage.getSettings()).autoOffloadInterval;
    if (interval === 'off') {
      await chrome.alarms.clear(AUTO_OFFLOAD_ALARM_NAME);
      return { attempted: 0, succeeded: 0, failed: 0, cancelled: true };
    }
    const expectedGeneration = generation;
    return runAutoOffloadSweep(
      interval,
      () => isCurrent(expectedGeneration, interval),
      Date.now(),
      () => generation === expectedGeneration,
    );
  }

  async function onStorageChanged(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ): Promise<void> {
    if (areaName !== 'local' || !(STORAGE_KEYS.settings in changes)) return;
    generation += 1;
    await reconcile();
  }

  return { reconcile, onAlarm, onStorageChanged };
}
