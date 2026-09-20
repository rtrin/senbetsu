import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTO_OFFLOAD_ALARM_NAME,
  AUTO_OFFLOAD_ALARM_PERIOD_MINUTES,
  STORAGE_KEYS,
} from '../constants';

const mockStore: Record<string, unknown> = {};
const tabs = new Map<number, chrome.tabs.Tab>();

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStore[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => Object.assign(mockStore, items)),
    },
  },
  tabs: {
    query: vi.fn(async () => [...tabs.values()]),
    get: vi.fn(async (tabId: number) => tabs.get(tabId)),
    discard: vi.fn(async (tabId: number) => {
      const tab = tabs.get(tabId);
      if (!tab) throw new Error('Tab closed');
      return tab;
    }),
  },
  alarms: {
    create: vi.fn(async () => undefined),
    clear: vi.fn(async () => true),
  },
});

const { createAutoOffloadController, isEligibleForAutoOffload, runAutoOffloadSweep } = await import(
  '../auto-offload'
);

const now = 10_000_000;

function makeTab(overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
  return {
    id: 1,
    index: 0,
    groupId: -1,
    windowId: 1,
    active: false,
    pinned: false,
    highlighted: false,
    selected: false,
    incognito: false,
    audible: false,
    discarded: false,
    autoDiscardable: true,
    frozen: false,
    status: 'complete',
    url: 'https://example.com',
    lastAccessed: now - 60_000,
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of Object.keys(mockStore)) delete mockStore[key];
  tabs.clear();
  vi.clearAllMocks();
});

describe('isEligibleForAutoOffload', () => {
  it('uses the threshold as a minimum and skips malformed or protected tabs', () => {
    expect(isEligibleForAutoOffload(makeTab(), 1, now)).toBe(true);
    expect(isEligibleForAutoOffload(makeTab({ lastAccessed: now - 59_999 }), 1, now)).toBe(false);
    expect(isEligibleForAutoOffload(makeTab({ lastAccessed: now + 1 }), 1, now)).toBe(false);

    const exclusions: Partial<chrome.tabs.Tab>[] = [
      { id: -1 },
      { id: 1.5 },
      { lastAccessed: Number.NaN },
      { active: true },
      { pinned: true },
      { incognito: true },
      { audible: true },
      { frozen: true },
      { discarded: true },
      { autoDiscardable: false },
      { status: 'loading' },
      { url: 'chrome://settings' },
      { url: 'file:///tmp/test.html' },
      { url: undefined },
    ];
    for (const exclusion of exclusions) {
      expect(isEligibleForAutoOffload(makeTab(exclusion), 1, now)).toBe(false);
    }
  });
});

describe('runAutoOffloadSweep', () => {
  it('queries every window and isolates discard failures', async () => {
    tabs.set(1, makeTab({ id: 1 }));
    tabs.set(2, makeTab({ id: 2 }));
    vi.mocked(chrome.tabs.discard).mockRejectedValueOnce(new Error('busy'));

    const result = await runAutoOffloadSweep(1, async () => true, now);

    expect(chrome.tabs.query).toHaveBeenCalledWith({});
    expect(chrome.tabs.discard).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ attempted: 2, succeeded: 1, failed: 1, cancelled: false });
  });

  it('does not dispatch stale work after a setting or tab-state change', async () => {
    tabs.set(1, makeTab({ id: 1 }));
    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeTab({ id: 1, active: true }),
    );

    const result = await runAutoOffloadSweep(1, async () => true, now);
    expect(chrome.tabs.discard).not.toHaveBeenCalled();
    expect(result.succeeded).toBe(0);

    (chrome.tabs.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(makeTab({ id: 1 }));
    let checks = 0;
    await runAutoOffloadSweep(
      1,
      async () => {
        checks += 1;
        return checks === 1;
      },
      now,
    );
    expect(chrome.tabs.discard).not.toHaveBeenCalled();
  });

  it('rechecks the final tab state after the async current check', async () => {
    tabs.set(1, makeTab({ id: 1 }));
    vi.mocked(chrome.tabs.get)
      .mockReset()
      .mockImplementation(async (tabId) => tabs.get(tabId));
    let releaseCurrent: ((value: boolean) => void) | undefined;
    const isCurrent = vi
      .fn<() => Promise<boolean>>()
      .mockResolvedValueOnce(true)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseCurrent = resolve;
          }),
      );

    const sweep = runAutoOffloadSweep(1, isCurrent, now);
    await vi.waitFor(() => expect(releaseCurrent).toBeTypeOf('function'));

    tabs.set(1, makeTab({ id: 1, active: true }));
    releaseCurrent?.(true);

    await expect(sweep).resolves.toMatchObject({ succeeded: 0, failed: 0, cancelled: false });
    expect(chrome.tabs.get).toHaveBeenCalledWith(1);
    expect(chrome.tabs.discard).not.toHaveBeenCalled();
  });
});

describe('createAutoOffloadController', () => {
  it('clears Off and creates exactly one named 30-second alarm when enabled', async () => {
    const controller = createAutoOffloadController();

    await controller.reconcile();
    expect(chrome.alarms.clear).toHaveBeenCalledWith(AUTO_OFFLOAD_ALARM_NAME);

    mockStore[STORAGE_KEYS.settings] = { autoOffloadInterval: 3 };
    await controller.onStorageChanged(
      { [STORAGE_KEYS.settings]: { newValue: mockStore[STORAGE_KEYS.settings] } },
      'local',
    );
    expect(chrome.alarms.create).toHaveBeenCalledWith(AUTO_OFFLOAD_ALARM_NAME, {
      periodInMinutes: AUTO_OFFLOAD_ALARM_PERIOD_MINUTES,
    });
  });

  it('ignores unrelated storage areas and alarm names', async () => {
    const controller = createAutoOffloadController();
    await controller.onStorageChanged({ other: {} }, 'local');
    await controller.onStorageChanged({ [STORAGE_KEYS.settings]: {} }, 'sync');
    await controller.onAlarm({ name: 'other-alarm' } as chrome.alarms.Alarm);

    expect(chrome.alarms.clear).not.toHaveBeenCalled();
    expect(chrome.alarms.create).not.toHaveBeenCalled();
  });

  it('cancels a sweep when the setting changes while tabs are being queried', async () => {
    const controller = createAutoOffloadController();
    mockStore[STORAGE_KEYS.settings] = { autoOffloadInterval: 1 };
    tabs.set(1, makeTab({ id: 1 }));

    let resolveQuery: ((value: chrome.tabs.Tab[]) => void) | undefined;
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveQuery = resolve;
        }),
    );
    const sweep = controller.onAlarm({ name: AUTO_OFFLOAD_ALARM_NAME } as chrome.alarms.Alarm);
    await Promise.resolve();

    mockStore[STORAGE_KEYS.settings] = { autoOffloadInterval: 'off' };
    await controller.onStorageChanged(
      { [STORAGE_KEYS.settings]: { newValue: mockStore[STORAGE_KEYS.settings] } },
      'local',
    );
    resolveQuery?.([makeTab({ id: 1 })]);

    await expect(sweep).resolves.toMatchObject({ cancelled: true, attempted: 0 });
    expect(chrome.tabs.discard).not.toHaveBeenCalled();
  });
});
