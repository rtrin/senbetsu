import { clsx } from 'clsx';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import type {
  AppSettings,
  BookmarkFolder,
  CommandResponse,
  PopupCommand,
  TabMemoryInfo,
} from '@/lib/types';

import { FolderList } from './components/FolderList';
import { Header } from './components/Header';
import { MemoryUsageList } from './components/MemoryUsageList';
import { SaveGroupButton } from './components/SaveGroupButton';
import { SettingsPanel } from './components/SettingsPanel';
import { TabCategoryList } from './components/TabCategoryList';
import { useAnnotations } from './hooks/useAnnotations';
import { useCurrentTabs } from './hooks/useCurrentTabs';

function sendCommand(cmd: PopupCommand): Promise<CommandResponse> {
  return chrome.runtime.sendMessage(cmd);
}

function App() {
  const [isClassifying, setIsClassifying] = useState(false);
  const [activeView, setActiveView] = useState<'groups' | 'folders' | 'memory' | 'settings'>(
    'groups',
  );
  const [memoryInfos, setMemoryInfos] = useState<TabMemoryInfo[]>([]);
  const [isFetchingMemory, setIsFetchingMemory] = useState(false);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [isFetchingFolders, setIsFetchingFolders] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [groupingError, setGroupingError] = useState('');
  const { tabs: liveTabs, groups: liveGroups, refresh: refreshLiveTabs } = useCurrentTabs();
  const { getTabAnnotation, getGroupAnnotation, setTabAnnotation, setGroupAnnotation } =
    useAnnotations();

  const refreshSettings = useCallback(async () => {
    setSettings(await storage.getSettings());
  }, []);

  useEffect(() => {
    refreshSettings();

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (STORAGE_KEYS.settings in changes) {
        refreshSettings();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [refreshSettings]);

  const handleSaveAndGroup = useCallback(
    async (prompt?: string) => {
      setIsClassifying(true);
      setGroupingError('');
      try {
        const resp = await sendCommand({
          type: 'CMD_SAVE_AND_GROUP',
          userPrompt: prompt,
        });
        if (!resp.ok) {
          setGroupingError(resp.error ?? 'Grouping failed');
        } else {
          refreshLiveTabs();
          refreshSettings();
        }
      } finally {
        setIsClassifying(false);
      }
    },
    [refreshLiveTabs, refreshSettings],
  );

  const handleMoveTabToGroup = useCallback(
    async (tabId: number, targetGroupName: string) => {
      const tab = liveTabs.find((t) => t.id === tabId);
      if (!tab) return;

      const currentGroupName =
        tab.groupId === -1 ? 'Ungrouped' : liveGroups.get(tab.groupId)?.title || 'Unnamed Group';
      if (currentGroupName === targetGroupName) return;

      try {
        const resp = await sendCommand({
          type: 'CMD_MOVE_TAB_TO_GROUP',
          tabId,
          targetGroupName,
        });
        if (!resp.ok) {
          console.error('[senbetsu] Move tab failed:', resp.error);
        } else {
          refreshLiveTabs();
        }
      } catch (e) {
        console.error('[senbetsu] Move tab error:', e);
      }
    },
    [liveTabs, liveGroups, refreshLiveTabs],
  );

  const [hasMemoryPermission, setHasMemoryPermission] = useState<boolean | null>(null);

  const fetchMemoryUsage = useCallback(async () => {
    setIsFetchingMemory(true);
    try {
      const resp = await sendCommand({ type: 'CMD_GET_MEMORY_USAGE' });
      if (resp.ok && resp.data) {
        setMemoryInfos(resp.data as TabMemoryInfo[]);
      }
    } finally {
      setIsFetchingMemory(false);
    }
  }, []);

  const checkMemoryPermission = useCallback(async () => {
    const granted = await chrome.permissions.contains({
      permissions: ['scripting'],
      origins: ['<all_urls>'],
    });
    setHasMemoryPermission(granted);
    return granted;
  }, []);

  const requestMemoryPermission = useCallback(async () => {
    const granted = await chrome.permissions.request({
      permissions: ['scripting'],
      origins: ['<all_urls>'],
    });
    setHasMemoryPermission(granted);
    if (granted) fetchMemoryUsage();
  }, [fetchMemoryUsage]);

  const handleSwitchToMemory = useCallback(async () => {
    setActiveView('memory');
    const granted = await checkMemoryPermission();
    if (granted) fetchMemoryUsage();
  }, [checkMemoryPermission, fetchMemoryUsage]);

  const handleSwitchTab = useCallback((tabId: number) => {
    sendCommand({ type: 'CMD_SWITCH_TAB', tabId });
    window.close();
  }, []);

  const handleOpenBookmark = useCallback((url: string) => {
    sendCommand({ type: 'CMD_OPEN_BOOKMARK', url });
    window.close();
  }, []);

  const handleCloseTab = useCallback((tabId: number) => {
    sendCommand({ type: 'CMD_CLOSE_TAB', tabId });
  }, []);

  const handleCloseGroup = useCallback((tabIds: number[]) => {
    sendCommand({ type: 'CMD_CLOSE_GROUP', tabIds });
  }, []);

  const handleBookmarkTab = useCallback((tabId: number) => {
    sendCommand({ type: 'CMD_BOOKMARK_TAB', tabId });
  }, []);

  const handleSaveGroupToFolder = useCallback(async (tabIds: number[], groupName: string) => {
    const resp = await sendCommand({
      type: 'CMD_SAVE_GROUP_TO_FOLDER',
      tabIds,
      groupName,
    });
    if (!resp.ok) {
      setGroupingError(resp.error ?? 'Failed to save group');
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    setIsFetchingFolders(true);
    try {
      const resp = await sendCommand({ type: 'CMD_GET_BOOKMARK_FOLDERS' });
      if (resp.ok && resp.data) {
        setFolders(resp.data as BookmarkFolder[]);
      }
    } finally {
      setIsFetchingFolders(false);
    }
  }, []);

  const handleSwitchToFolders = useCallback(() => {
    setActiveView('folders');
    fetchFolders();
  }, [fetchFolders]);

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const resp = await sendCommand({ type: 'CMD_DELETE_FOLDER', folderId });
      if (resp.ok) fetchFolders();
      else setGroupingError(resp.error ?? 'Failed to delete folder');
    },
    [fetchFolders],
  );

  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string, folderId: string) => {
      const resp = await sendCommand({ type: 'CMD_DELETE_BOOKMARK', bookmarkId, folderId });
      if (resp.ok) fetchFolders();
      else setGroupingError(resp.error ?? 'Failed to delete bookmark');
    },
    [fetchFolders],
  );

  const handleRenameGroup = useCallback(
    async (groupId: number, newName: string) => {
      const resp = await sendCommand({ type: 'CMD_RENAME_GROUP', groupId, newName });
      if (resp.ok) refreshLiveTabs();
    },
    [refreshLiveTabs],
  );

  const handleRenameFolder = useCallback(
    async (folderId: string, newName: string) => {
      const resp = await sendCommand({ type: 'CMD_RENAME_FOLDER', folderId, newName });
      if (resp.ok) fetchFolders();
    },
    [fetchFolders],
  );

  const handleMoveBookmark = useCallback(
    async (bookmarkId: string, targetFolderId: string) => {
      const resp = await sendCommand({ type: 'CMD_MOVE_BOOKMARK', bookmarkId, targetFolderId });
      if (resp.ok) fetchFolders();
    },
    [fetchFolders],
  );

  const handleOpenFolder = useCallback(
    async (folderId: string) => {
      const resp = await sendCommand({ type: 'CMD_OPEN_FOLDER_AS_GROUP', folderId });
      if (resp.ok) {
        fetchFolders();
        refreshLiveTabs();
      }
    },
    [fetchFolders, refreshLiveTabs],
  );

  const groupCount = new Set(liveTabs.filter((t) => t.groupId !== -1).map((t) => t.groupId)).size;
  const showGroupWarning =
    activeView === 'groups' && settings.maxGroups !== undefined && groupCount > settings.maxGroups;

  const viewToggleBtn = (view: typeof activeView, label: string, onClick: () => void) => (
    <button
      type="button"
      className={clsx(
        'flex-1 cursor-pointer rounded-md border-0 bg-transparent py-1.5 font-sans font-semibold text-(--color-grey) text-xs transition-all duration-200',
        'hover:text-white/87 light:hover:text-(--color-text-light)',
        activeView === view &&
          'bg-white/10 light:bg-white light:text-(--color-text-light) text-white light:shadow-black/10 shadow-sm',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3 p-4">
      <Header tabCount={liveTabs.length} />

      <div className="mb-2 flex rounded-lg bg-white/5 light:bg-black/5 p-1">
        {viewToggleBtn('groups', 'Groups', () => setActiveView('groups'))}
        {viewToggleBtn('folders', 'Folders', handleSwitchToFolders)}
        {viewToggleBtn('memory', 'Memory', handleSwitchToMemory)}
        {viewToggleBtn('settings', 'Settings', () => setActiveView('settings'))}
      </div>

      {activeView === 'groups' && (
        <SaveGroupButton isClassifying={isClassifying} onSave={handleSaveAndGroup} />
      )}

      {groupingError && (
        <div className="rounded-md bg-red-500/10 light:bg-red-500/8 px-3 py-2 text-(--color-red) text-xs">
          {groupingError}
        </div>
      )}

      {showGroupWarning && (
        <div className="rounded-md bg-yellow-500/10 light:bg-yellow-500/8 px-3 py-2 text-(--color-yellow) text-xs">
          You have {groupCount} groups open (max: {settings.maxGroups}). Save some groups to folders
          for a cleaner workspace.
        </div>
      )}

      {activeView === 'groups' && (
        <TabCategoryList
          tabs={liveTabs}
          groups={liveGroups}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onCloseGroup={handleCloseGroup}
          onMoveTabToGroup={handleMoveTabToGroup}
          onBookmarkTab={handleBookmarkTab}
          onSaveGroupToFolder={handleSaveGroupToFolder}
          onRenameGroup={handleRenameGroup}
          getTabAnnotation={getTabAnnotation}
          getGroupAnnotation={getGroupAnnotation}
          onAnnotateTab={setTabAnnotation}
          onAnnotateGroup={setGroupAnnotation}
        />
      )}

      {activeView === 'folders' && (
        <FolderList
          folders={folders}
          isFetching={isFetchingFolders}
          onOpenFolder={handleOpenFolder}
          onOpenBookmark={handleOpenBookmark}
          onDeleteFolder={handleDeleteFolder}
          onDeleteBookmark={handleDeleteBookmark}
          onRenameFolder={handleRenameFolder}
          onMoveBookmark={handleMoveBookmark}
        />
      )}

      {activeView === 'memory' && (
        <MemoryUsageList
          memoryInfos={memoryInfos.filter((info) => liveTabs.some((t) => t.id === info.tabId))}
          isFetching={isFetchingMemory}
          hasPermission={hasMemoryPermission}
          onRequestPermission={requestMemoryPermission}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
        />
      )}

      {activeView === 'settings' && (
        <SettingsPanel
          settings={settings}
          sendCommand={sendCommand}
          onSettingsChanged={refreshSettings}
        />
      )}
    </div>
  );
}

export default App;
