import {
  handleActivateLicense,
  handleBookmarkTab,
  handleClassifyUnsorted,
  handleCloseGroup,
  handleCloseTab,
  handleDeactivateLicense,
  handleDeleteBookmark,
  handleDeleteFolder,
  handleGetBookmarkFolders,
  handleGetMemoryUsage,
  handleMoveBookmark,
  handleMoveTabToGroup,
  handleOpenBookmark,
  handleOpenFolderAsGroup,
  handleRenameFolder,
  handleRenameGroup,
  handleSaveAndGroup,
  handleSaveGroupToFolder,
  handleSaveSettings,
  handleSwitchTab,
  handleUngroupTabs,
} from '@/lib/commands';
import { STORAGE_KEYS } from '@/lib/constants';
import { cleanupWindow, removeTab } from '@/lib/grouping';
import type { ExtensionMessage } from '@/lib/types';

async function removeAnnotation(key: string): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.annotations);
  const current = (result[STORAGE_KEYS.annotations] as Record<string, string>) ?? {};
  if (!(key in current)) return;
  const { [key]: _, ...rest } = current;
  await chrome.storage.local.set({ [STORAGE_KEYS.annotations]: rest });
}

export default defineBackground(() => {
  console.log('[senbetsu] Background service worker started');

  browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    // ── Popup commands ──
    if (message.type.startsWith('CMD_')) {
      let responsePromise: Promise<{ ok: boolean; error?: string }>;

      switch (message.type) {
        case 'CMD_SAVE_AND_GROUP':
          responsePromise = handleSaveAndGroup(message.userPrompt);
          break;
        case 'CMD_SWITCH_TAB':
          responsePromise = handleSwitchTab(message.tabId);
          break;
        case 'CMD_CLOSE_TAB':
          responsePromise = handleCloseTab(message.tabId);
          break;
        case 'CMD_CLOSE_GROUP':
          responsePromise = handleCloseGroup(message.tabIds);
          break;
        case 'CMD_GET_MEMORY_USAGE':
          responsePromise = handleGetMemoryUsage();
          break;
        case 'CMD_CLASSIFY_UNSORTED':
          responsePromise = handleClassifyUnsorted(message.tabIds);
          break;
        case 'CMD_MOVE_TAB_TO_GROUP':
          responsePromise = handleMoveTabToGroup(message.tabId, message.targetGroupName);
          break;
        case 'CMD_ACTIVATE_LICENSE':
          responsePromise = handleActivateLicense(message.licenseKey);
          break;
        case 'CMD_DEACTIVATE_LICENSE':
          responsePromise = handleDeactivateLicense();
          break;
        case 'CMD_SAVE_SETTINGS':
          responsePromise = handleSaveSettings(message.openaiApiKey ?? null);
          break;
        case 'CMD_BOOKMARK_TAB':
          responsePromise = handleBookmarkTab(message.tabId);
          break;
        case 'CMD_SAVE_GROUP_TO_FOLDER':
          responsePromise = handleSaveGroupToFolder(message.tabIds, message.groupName);
          break;
        case 'CMD_OPEN_FOLDER_AS_GROUP':
          responsePromise = handleOpenFolderAsGroup(message.folderId);
          break;
        case 'CMD_GET_BOOKMARK_FOLDERS':
          responsePromise = handleGetBookmarkFolders();
          break;
        case 'CMD_DELETE_FOLDER':
          responsePromise = handleDeleteFolder(message.folderId);
          break;
        case 'CMD_DELETE_BOOKMARK':
          responsePromise = handleDeleteBookmark(message.bookmarkId, message.folderId);
          break;
        case 'CMD_OPEN_BOOKMARK':
          responsePromise = handleOpenBookmark(message.url);
          break;
        case 'CMD_RENAME_GROUP':
          responsePromise = handleRenameGroup(message.groupId, message.newName);
          break;
        case 'CMD_RENAME_FOLDER':
          responsePromise = handleRenameFolder(message.folderId, message.newName);
          break;
        case 'CMD_MOVE_BOOKMARK':
          responsePromise = handleMoveBookmark(message.bookmarkId, message.targetFolderId);
          break;
        case 'CMD_UNGROUP_TABS':
          responsePromise = handleUngroupTabs(message.tabIds);
          break;
        default: {
          const _exhaustive: never = message;
          responsePromise = Promise.resolve({
            ok: false,
            error: `Unknown command: ${(_exhaustive as ExtensionMessage).type}`,
          });
          break;
        }
      }

      responsePromise.then(sendResponse);
      return true; // keep channel open for async response
    }

    return false;
  });

  // Cleanup on tab removal
  chrome.tabs.onRemoved.addListener((tabId) => {
    removeTab(tabId);
    removeAnnotation(`tab:${tabId}`).catch(() => {});
  });

  // Cleanup on group removal
  chrome.tabGroups.onRemoved.addListener((group) => {
    removeAnnotation(`group:${group.id}`).catch(() => {});
  });

  // Cleanup on window removal
  chrome.windows.onRemoved.addListener((windowId) => {
    cleanupWindow(windowId);
  });
});
