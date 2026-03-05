import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import type { AppSettings, CommandResponse, PopupCommand, TabMemoryInfo } from '@/lib/types';
import './App.css';

import { Header } from './components/Header';
import { MemoryUsageList } from './components/MemoryUsageList';
import { SaveGroupButton } from './components/SaveGroupButton';
import { SettingsPanel } from './components/SettingsPanel';
import { TabCategoryList } from './components/TabCategoryList';
import { useCurrentTabs } from './hooks/useCurrentTabs';

function sendCommand(cmd: PopupCommand): Promise<CommandResponse> {
  return chrome.runtime.sendMessage(cmd);
}

function App() {
  const [isClassifying, setIsClassifying] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [activeView, setActiveView] = useState<'groups' | 'memory' | 'settings'>('groups');
  const [memoryInfos, setMemoryInfos] = useState<TabMemoryInfo[]>([]);
  const [isFetchingMemory, setIsFetchingMemory] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [usageCount, setUsageCount] = useState(0);
  const [groupingError, setGroupingError] = useState('');
  const { tabs: liveTabs, groups: liveGroups, refresh: refreshLiveTabs } = useCurrentTabs();

  const refreshSettings = useCallback(async () => {
    const [s, count] = await Promise.all([storage.getSettings(), storage.getUsageCount()]);
    setSettings(s);
    setUsageCount(count);
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

  const handleCleanUp = useCallback(
    async (tabIds: number[]) => {
      setIsCleaningUp(true);
      setGroupingError('');
      try {
        const resp = await sendCommand({ type: 'CMD_CLASSIFY_UNSORTED', tabIds });
        if (!resp.ok) {
          setGroupingError(resp.error ?? 'Clean up failed');
        } else {
          refreshLiveTabs();
          refreshSettings();
        }
      } finally {
        setIsCleaningUp(false);
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

  const handleSwitchToMemory = useCallback(() => {
    setActiveView('memory');
    fetchMemoryUsage();
  }, [fetchMemoryUsage]);

  const handleSwitchTab = useCallback((tabId: number) => {
    sendCommand({ type: 'CMD_SWITCH_TAB', tabId });
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

  return (
    <div className="popup">
      <Header tabCount={liveTabs.length} />

      {activeView !== 'settings' && (
        <SaveGroupButton isClassifying={isClassifying} onSave={handleSaveAndGroup} />
      )}

      {groupingError && <div className="grouping-error">{groupingError}</div>}

      <div className="view-toggle">
        <button
          type="button"
          className={`toggle-btn ${activeView === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveView('groups')}
        >
          Groups
        </button>
        <button
          type="button"
          className={`toggle-btn ${activeView === 'memory' ? 'active' : ''}`}
          onClick={handleSwitchToMemory}
        >
          Memory
        </button>
        <button
          type="button"
          className={`toggle-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          Settings
        </button>
      </div>

      {activeView === 'groups' && (
        <TabCategoryList
          tabs={liveTabs}
          groups={liveGroups}
          isCleaningUp={isCleaningUp}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onCloseGroup={handleCloseGroup}
          onCleanUp={handleCleanUp}
          onMoveTabToGroup={handleMoveTabToGroup}
          onBookmarkTab={handleBookmarkTab}
        />
      )}

      {activeView === 'memory' && (
        <MemoryUsageList
          memoryInfos={memoryInfos.filter((info) => liveTabs.some((t) => t.id === info.tabId))}
          isFetching={isFetchingMemory}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
        />
      )}

      {activeView === 'settings' && (
        <SettingsPanel
          settings={settings}
          usageCount={usageCount}
          sendCommand={sendCommand}
          onSettingsChanged={refreshSettings}
        />
      )}
    </div>
  );
}

export default App;
