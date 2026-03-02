import type { CommandResponse, PopupCommand } from '@/lib/types';
import './App.css';

import type { TabMemoryInfo } from '@/lib/types';
import { Header } from './components/Header';
import { MemoryUsageList } from './components/MemoryUsageList';
import { SaveGroupButton } from './components/SaveGroupButton';
import { TabCategoryList } from './components/TabCategoryList';
import { useCurrentTabs } from './hooks/useCurrentTabs';

function sendCommand(cmd: PopupCommand): Promise<CommandResponse> {
  return chrome.runtime.sendMessage(cmd);
}

function App() {
  const [isClassifying, setIsClassifying] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [activeView, setActiveView] = useState<'groups' | 'memory'>('groups');
  const [memoryInfos, setMemoryInfos] = useState<TabMemoryInfo[]>([]);
  const [isFetchingMemory, setIsFetchingMemory] = useState(false);
  const { tabs: liveTabs, groups: liveGroups, refresh: refreshLiveTabs } = useCurrentTabs();

  const handleSaveAndGroup = useCallback(
    async (prompt?: string) => {
      setIsClassifying(true);
      try {
        const resp = await sendCommand({
          type: 'CMD_SAVE_AND_GROUP',
          userPrompt: prompt,
        });
        if (!resp.ok) {
          console.error('[senbetsu] Group tabs failed:', resp.error);
        } else {
          refreshLiveTabs();
        }
      } finally {
        setIsClassifying(false);
      }
    },
    [refreshLiveTabs],
  );

  const handleCleanUp = useCallback(
    async (tabIds: number[]) => {
      setIsCleaningUp(true);
      try {
        const resp = await sendCommand({ type: 'CMD_CLASSIFY_UNSORTED', tabIds });
        if (!resp.ok) {
          console.error('[senbetsu] Clean up failed:', resp.error);
        } else {
          refreshLiveTabs();
        }
      } finally {
        setIsCleaningUp(false);
      }
    },
    [refreshLiveTabs],
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

  return (
    <div className="popup">
      <Header tabCount={liveTabs.length} />

      <SaveGroupButton isClassifying={isClassifying} onSave={handleSaveAndGroup} />

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
      </div>

      {activeView === 'groups' ? (
        <TabCategoryList
          tabs={liveTabs}
          groups={liveGroups}
          isCleaningUp={isCleaningUp}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onCloseGroup={handleCloseGroup}
          onCleanUp={handleCleanUp}
        />
      ) : (
        <MemoryUsageList
          memoryInfos={memoryInfos.filter((info) => liveTabs.some((t) => t.id === info.tabId))}
          isFetching={isFetchingMemory}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
        />
      )}
    </div>
  );
}

export default App;
