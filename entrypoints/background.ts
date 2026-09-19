import {
  handleBookmarkTab,
  handleClassifyUnsorted,
  handleCloseGroup,
  handleCloseTab,
  handleDeleteBookmark,
  handleDeleteFolder,
  handleGetBookmarkFolders,
  handleGetMemoryUsage,
  handleMoveBookmark,
  handleMoveTabToGroup,
  handleOffloadTabs,
  handleOpenBookmark,
  handleOpenFolderAsGroup,
  handleRenameFolder,
  handleRenameGroup,
  handleSaveAndGroup,
  handleSaveGroupToFolder,
  handleSaveSettings,
  handleSelectAIProvider,
  handleSwitchTab,
  handleUngroupTabs,
} from '@/lib/commands';
import { cleanupWindow, removeTab } from '@/lib/grouping';
import { removeAnnotation } from '@/lib/storage';
import type { ExtensionMessage } from '@/lib/types';

const UNINSTALL_FEEDBACK_URL = 'https://forms.gle/CbwboV9kfFfz9ESz8';

export default defineBackground(() => {
  console.log('[senbetsu] Background service worker started');
  chrome.runtime.setUninstallURL(UNINSTALL_FEEDBACK_URL);

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
        case 'CMD_SAVE_SETTINGS':
          responsePromise = handleSaveSettings(message.provider, message.apiKey);
          break;
        case 'CMD_SELECT_AI_PROVIDER':
          responsePromise = handleSelectAIProvider(message.provider);
          break;
        case 'CMD_BOOKMARK_TAB':
          responsePromise = handleBookmarkTab(message.tabId);
          break;
        case 'CMD_SAVE_GROUP_TO_FOLDER':
          responsePromise = handleSaveGroupToFolder(
            message.tabIds,
            message.groupName,
            message.annotation,
          );
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
        case 'CMD_OFFLOAD_TABS':
          responsePromise = handleOffloadTabs(message.tabIds);
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
