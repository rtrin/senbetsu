import {
  handleDeleteSession,
  handleDismissOnboarding,
  handleRestoreSession,
  handleSaveAndGroup,
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
          responsePromise = handleSaveAndGroup();
          break;
        case 'CMD_RESTORE_SESSION':
          responsePromise = handleRestoreSession(message.sessionId);
          break;
        case 'CMD_SWITCH_TAB':
          responsePromise = handleSwitchTab(message.tabId);
          break;
        case 'CMD_DELETE_SESSION':
          responsePromise = handleDeleteSession(message.sessionId);
          break;
        case 'CMD_DISMISS_ONBOARDING':
          responsePromise = handleDismissOnboarding();
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
