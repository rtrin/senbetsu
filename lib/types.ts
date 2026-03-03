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

// ─── Popup Commands ─────────────────────────────────────────────

export type MemoryLevel = 'high' | 'medium' | 'low';

export interface TabMemoryInfo {
  tabId: number;
  title: string;
  url: string;
  favIconUrl: string;
  jsHeapUsedMB: number;
  memoryLevel?: MemoryLevel;
  category?: string;
}

export interface CmdSaveAndGroup {
  type: 'CMD_SAVE_AND_GROUP';
  userPrompt?: string;
}

export interface CmdSaveAndGroup {
  type: 'CMD_SAVE_AND_GROUP';
  userPrompt?: string;
}

export interface CmdSwitchTab {
  type: 'CMD_SWITCH_TAB';
  tabId: number;
}

export interface CmdCloseTab {
  type: 'CMD_CLOSE_TAB';
  tabId: number;
}

export interface CmdCloseGroup {
  type: 'CMD_CLOSE_GROUP';
  tabIds: number[];
}

export interface CmdGetMemoryUsage {
  type: 'CMD_GET_MEMORY_USAGE';
}

export interface CmdClassifyUnsorted {
  type: 'CMD_CLASSIFY_UNSORTED';
  tabIds: number[];
}

export interface CmdMoveTabToGroup {
  type: 'CMD_MOVE_TAB_TO_GROUP';
  tabId: number;
  targetGroupName: string;
}

export type PopupCommand =
  | CmdSaveAndGroup
  | CmdSwitchTab
  | CmdCloseTab
  | CmdCloseGroup
  | CmdGetMemoryUsage
  | CmdClassifyUnsorted
  | CmdMoveTabToGroup;

export interface CommandResponse {
  ok: boolean;
  error?: string;
  data?: unknown;
}

export type ExtensionMessage = PopupCommand;

// ─── Classification ──────────────────────────────────────────────

export interface TabClassificationInput {
  tabId: number;
  url: string;
  title: string;
  bodyText: string;
}

export interface ClassificationResult {
  tabId: number;
  category: TabCategory;
}

export interface AIGroupingResponse {
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
