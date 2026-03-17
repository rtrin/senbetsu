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

// ─── Settings ───────────────────────────────────────────────────

export type UserTier = 'free' | 'pro' | 'byok';

export interface AppSettings {
  licenseKey?: string;
  tier: UserTier;
  openaiApiKey?: string;
  dailyUsageCount: number;
  dailyUsageDate: string;
  bookmarkAutoClose?: boolean;
}

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

export interface CmdActivateLicense {
  type: 'CMD_ACTIVATE_LICENSE';
  licenseKey: string;
}

export interface CmdSaveSettings {
  type: 'CMD_SAVE_SETTINGS';
  openaiApiKey?: string | null;
}

export interface CmdDeactivateLicense {
  type: 'CMD_DEACTIVATE_LICENSE';
}

export interface CmdBookmarkTab {
  type: 'CMD_BOOKMARK_TAB';
  tabId: number;
}

export interface CmdSaveGroupToFolder {
  type: 'CMD_SAVE_GROUP_TO_FOLDER';
  tabIds: number[];
  groupName: string;
}

export interface CmdOpenFolderAsGroup {
  type: 'CMD_OPEN_FOLDER_AS_GROUP';
  folderId: string;
}

export interface CmdGetBookmarkFolders {
  type: 'CMD_GET_BOOKMARK_FOLDERS';
}

export interface CmdDeleteFolder {
  type: 'CMD_DELETE_FOLDER';
  folderId: string;
}

export interface CmdDeleteBookmark {
  type: 'CMD_DELETE_BOOKMARK';
  bookmarkId: string;
  folderId: string;
}

export interface CmdOpenBookmark {
  type: 'CMD_OPEN_BOOKMARK';
  url: string;
}

export interface CmdRenameGroup {
  type: 'CMD_RENAME_GROUP';
  groupId: number;
  newName: string;
}

export interface CmdRenameFolder {
  type: 'CMD_RENAME_FOLDER';
  folderId: string;
  newName: string;
}

export interface CmdMoveBookmark {
  type: 'CMD_MOVE_BOOKMARK';
  bookmarkId: string;
  targetFolderId: string;
}

export type PopupCommand =
  | CmdSaveAndGroup
  | CmdSwitchTab
  | CmdCloseTab
  | CmdCloseGroup
  | CmdGetMemoryUsage
  | CmdClassifyUnsorted
  | CmdMoveTabToGroup
  | CmdActivateLicense
  | CmdSaveSettings
  | CmdDeactivateLicense
  | CmdBookmarkTab
  | CmdSaveGroupToFolder
  | CmdOpenFolderAsGroup
  | CmdGetBookmarkFolders
  | CmdDeleteFolder
  | CmdDeleteBookmark
  | CmdOpenBookmark
  | CmdRenameGroup
  | CmdRenameFolder
  | CmdMoveBookmark;

export interface CommandResponse {
  ok: boolean;
  error?: string;
  data?: unknown;
}

export type ExtensionMessage = PopupCommand;

// ─── Bookmark Folders ───────────────────────────────────────────

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

export interface BookmarkFolder {
  id: string;
  title: string;
  childCount: number;
  bookmarks: BookmarkItem[];
}

// ─── Classification ──────────────────────────────────────────────

export interface TabClassificationInput {
  tabId: number;
  url: string;
  title: string;
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
