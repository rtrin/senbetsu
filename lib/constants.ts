import type { AppSettings, TabGroupColor } from './types';

export const TAB_COLORS: TabGroupColor[] = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
];

// ─── Storage ────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  settings: 'senbetsu_settings',
  sessions: 'senbetsu_sessions',
  annotations: 'senbetsu_annotations',
  folderSections: 'senbetsu_folder_sections',
} as const;

export const MAX_SAVED_SESSIONS = 20;

export const AUTO_OFFLOAD_ALARM_NAME = 'senbetsu-auto-offload';
export const AUTO_OFFLOAD_ALARM_PERIOD_MINUTES = 0.5;

// ─── Settings ───────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'openai',
  apiKeys: {},
  autoOffloadInterval: 'off',
  bookmarkAutoClose: true,
  preserveExistingGroups: true,
  maxGroups: 5,
};

// ─── Bookmarks ──────────────────────────────────────────────────

/** Chrome Bookmarks Bar root node ID */
export const BOOKMARK_BAR_ID = '1';

/** Timeout (ms) for waiting on a tab to finish loading before discarding */
export const DISCARD_TIMEOUT_MS = 10_000;
