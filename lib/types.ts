// ─── Tab Categories ──────────────────────────────────────────────

export const TAB_CATEGORIES = [
  'Social Media',
  'Development',
  'Shopping',
  'News',
  'Entertainment',
  'Work',
  'Communication',
  'Reference',
  'Finance',
  'Other',
] as const;

export type TabCategory = (typeof TAB_CATEGORIES)[number];

export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

// ─── Storage ────────────────────────────────────────────────────

export interface AppSettings {
  hasSeenOnboarding: boolean;
}

export interface SavedTab {
  url: string;
  title: string;
  favicon: string;
  category: TabCategory;
}

export interface SavedSession {
  id: string;
  savedAt: number;
  label: string;
  tabs: SavedTab[];
}

// ─── Popup Commands ─────────────────────────────────────────────

export interface CmdSaveAndGroup {
  type: 'CMD_SAVE_AND_GROUP';
}

export interface CmdRestoreSession {
  type: 'CMD_RESTORE_SESSION';
  sessionId: string;
}

export interface CmdSwitchTab {
  type: 'CMD_SWITCH_TAB';
  tabId: number;
}

export interface CmdDeleteSession {
  type: 'CMD_DELETE_SESSION';
  sessionId: string;
}

export interface CmdDismissOnboarding {
  type: 'CMD_DISMISS_ONBOARDING';
}

export type PopupCommand =
  | CmdSaveAndGroup
  | CmdRestoreSession
  | CmdSwitchTab
  | CmdDeleteSession
  | CmdDismissOnboarding;

export interface CommandResponse {
  ok: boolean;
  error?: string;
}

export type ExtensionMessage = PopupCommand;

// ─── Classification ──────────────────────────────────────────────

export interface ClassificationRequest {
  tabId: number;
  url: string;
  title: string;
  description: string;
  siteName: string;
}

export interface ClassificationResult {
  tabId: number;
  category: TabCategory;
}

// ─── OpenAI API Types ────────────────────────────────────────────

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  response_format: { type: 'json_object' };
}

export interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface ClassificationResponse {
  category: string;
}
