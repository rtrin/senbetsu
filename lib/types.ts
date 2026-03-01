// ─── Tab Categories ──────────────────────────────────────────────

export type TabCategory = string;

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

export interface TabMemoryInfo {
  tabId: number;
  title: string;
  url: string;
  favIconUrl: string;
  jsHeapUsedMB: number;
  category?: string;
}

export interface CmdSaveAndGroup {
  type: 'CMD_SAVE_AND_GROUP';
  userPrompt?: string;
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

export interface CmdCloseTab {
  type: 'CMD_CLOSE_TAB';
  tabId: number;
}

export interface CmdCloseGroup {
  type: 'CMD_CLOSE_GROUP';
  tabIds: number[];
}

export interface CmdDismissOnboarding {
  type: 'CMD_DISMISS_ONBOARDING';
}

export interface CmdGetMemoryUsage {
  type: 'CMD_GET_MEMORY_USAGE';
}

export type PopupCommand =
  | CmdSaveAndGroup
  | CmdRestoreSession
  | CmdSwitchTab
  | CmdDeleteSession
  | CmdCloseTab
  | CmdCloseGroup
  | CmdDismissOnboarding
  | CmdGetMemoryUsage;

export interface CommandResponse {
  ok: boolean;
  error?: string;
  data?: any;
}

export type ExtensionMessage = PopupCommand;

// ─── Classification ──────────────────────────────────────────────

export interface TabInfo {
  tabId: number;
  url: string;
  title: string;
  bodyText: string;
}

export interface ClassificationResult {
  tabId: number;
  category: TabCategory;
}

export interface BatchClassificationResponse {
  groups: Array<{
    name: string;
    tabIds: number[];
  }>;
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
