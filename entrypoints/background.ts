import {
  handleActivateLicense,
  handleBookmarkTab,
  handleClassifyUnsorted,
  handleCloseGroup,
  handleCloseTab,
  handleDeactivateLicense,
  handleGetBookmarkFolders,
  handleGetMemoryUsage,
  handleMoveTabToGroup,
  handleOpenBookmark,
  handleOpenFolderAsGroup,
  handleSaveAndGroup,
  handleSaveGroupToFolder,
  handleSaveSettings,
  handleSwitchTab,
} from '@/lib/commands';
import { cleanupWindow, removeTab } from '@/lib/grouping';
import type { ExtensionMessage } from '@/lib/types';

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
        case 'CMD_OPEN_BOOKMARK':
          responsePromise = handleOpenBookmark(message.url);
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
  });

  // Cleanup on window removal
  chrome.windows.onRemoved.addListener((windowId) => {
    cleanupWindow(windowId);
  });
});
