import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import type { CommandResponse, PopupCommand, TabSession } from '@/lib/types';
import './App.css';

import type { TabMemoryInfo } from '@/lib/types';
import { Header } from './components/Header';
import { MemoryUsageList } from './components/MemoryUsageList';
import { SaveGroupButton } from './components/SaveGroupButton';
import { SessionHistory } from './components/SessionHistory';
import { TabCategoryList } from './components/TabCategoryList';
import { UnsortedTabs } from './components/UnsortedTabs';
import { useCurrentTabs } from './hooks/useCurrentTabs';

function sendCommand(cmd: PopupCommand): Promise<CommandResponse> {
  return chrome.runtime.sendMessage(cmd);
}

function App() {
  const [sessions, setSessions] = useState<TabSession[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [activeView, setActiveView] = useState<'groups' | 'memory'>('groups');
  const [memoryInfos, setMemoryInfos] = useState<TabMemoryInfo[]>([]);
  const [isFetchingMemory, setIsFetchingMemory] = useState(false);
  const { tabs: liveTabs, refresh: refreshTabs } = useCurrentTabs();

  useEffect(() => {
    storage.getSessions().then(setSessions);
  }, []);

  useEffect(() => {
    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEYS.sessions]) {
        setSessions(changes[STORAGE_KEYS.sessions].newValue as TabSession[]);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const handleSaveAndGroup = useCallback(async (prompt?: string) => {
    setIsClassifying(true);
    try {
      const resp = await sendCommand({
        type: 'CMD_SAVE_AND_GROUP',
        userPrompt: prompt,
      });
      if (!resp.ok) {
        console.error('[senbetsu] Save & group failed:', resp.error);
      }
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const handleClassifyUnsorted = useCallback(async (tabIds: number[]) => {
    setIsGrouping(true);
    try {
      const resp = await sendCommand({
        type: 'CMD_CLASSIFY_UNSORTED',
        tabIds,
      });
      if (!resp.ok) {
        console.error('[senbetsu] Classify unsorted failed:', resp.error);
      }
    } finally {
      setIsGrouping(false);
    }
  }, []);

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

  const handleRestoreSession = useCallback((sessionId: string) => {
    sendCommand({ type: 'CMD_RESTORE_SESSION', sessionId });
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    sendCommand({ type: 'CMD_DELETE_SESSION', sessionId });
  }, []);

  const latestSession = sessions.length > 0 ? sessions[0] : null;

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
        <>
          <TabCategoryList
            tabs={liveTabs}
            latestSession={latestSession}
            onSwitchTab={handleSwitchTab}
            onCloseTab={handleCloseTab}
            onCloseGroup={handleCloseGroup}
            onRefresh={refreshTabs}
          />
          <UnsortedTabs
            tabs={liveTabs}
            latestSession={latestSession}
            isGrouping={isGrouping}
            onGroup={handleClassifyUnsorted}
            onSwitchTab={handleSwitchTab}
            onCloseTab={handleCloseTab}
            onCloseGroup={handleCloseGroup}
          />
        </>
      ) : (
        <MemoryUsageList
          memoryInfos={memoryInfos.filter((info) => liveTabs.some((t) => t.id === info.tabId))}
          isFetching={isFetchingMemory}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onRefresh={fetchMemoryUsage}
        />
      )}

      <SessionHistory
        sessions={sessions}
        onRestore={handleRestoreSession}
        onDelete={handleDeleteSession}
      />
    </div>
  );
}

export default App;
