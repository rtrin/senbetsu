import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import type { AppSettings, CommandResponse, PopupCommand, SavedSession } from '@/lib/types';
import './App.css';

import type { TabMemoryInfo } from '@/lib/types';
import { Header } from './components/Header';
import { MemoryUsageList } from './components/MemoryUsageList';
import { OnboardingBanner } from './components/OnboardingBanner';
import { SaveGroupButton } from './components/SaveGroupButton';
import { SessionHistory } from './components/SessionHistory';
import { TabCategoryList } from './components/TabCategoryList';
import { useCurrentTabs } from './hooks/useCurrentTabs';

function sendCommand(cmd: PopupCommand): Promise<CommandResponse> {
  return chrome.runtime.sendMessage(cmd);
}

function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [viewMode, setViewMode] = useState<'groups' | 'memory'>('groups');
  const [memoryInfos, setMemoryInfos] = useState<TabMemoryInfo[]>([]);
  const [isFetchingMemory, setIsFetchingMemory] = useState(false);
  const liveTabs = useCurrentTabs();

  // Load initial data
  useEffect(() => {
    Promise.all([storage.getSettings(), storage.getSessions()]).then(([s, sess]) => {
      setSettings(s);
      setSessions(sess);
    });
  }, []);

  // Listen for storage changes from background
  useEffect(() => {
    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEYS.settings]) {
        setSettings(changes[STORAGE_KEYS.settings].newValue as AppSettings);
      }
      if (changes[STORAGE_KEYS.sessions]) {
        setSessions(changes[STORAGE_KEYS.sessions].newValue as SavedSession[]);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const handleSaveAndGroup = useCallback(async (prompt?: string) => {
    setIsWorking(true);
    try {
      const resp = await sendCommand({
        type: 'CMD_SAVE_AND_GROUP',
        userPrompt: prompt,
      });
      if (!resp.ok) {
        console.error('[senbetsu] Save & group failed:', resp.error);
      }
    } finally {
      setIsWorking(false);
    }
  }, []);

  const fetchMemoryUsage = useCallback(async () => {
    setIsFetchingMemory(true);
    try {
      const resp = await sendCommand({ type: 'CMD_GET_MEMORY_USAGE' });
      if (resp.ok && resp.data) {
        setMemoryInfos(resp.data);
      }
    } finally {
      setIsFetchingMemory(false);
    }
  }, []);

  const handleSwitchToMemory = useCallback(() => {
    setViewMode('memory');
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

  const handleDismissOnboarding = useCallback(() => {
    setSettings((prev) => (prev ? { ...prev, hasSeenOnboarding: true } : prev));
    sendCommand({ type: 'CMD_DISMISS_ONBOARDING' });
  }, []);

  if (!settings) return <div className="popup-loading">Loading…</div>;

  const httpTabs = liveTabs.filter((t) => t.url?.startsWith('http'));
  const latestSession = sessions.length > 0 ? sessions[0] : null;

  return (
    <div className="popup">
      <Header tabCount={liveTabs.length} />

      {!settings.hasSeenOnboarding && httpTabs.length > 0 && (
        <OnboardingBanner
          tabCount={httpTabs.length}
          onAccept={() => handleSaveAndGroup()}
          onDismiss={handleDismissOnboarding}
        />
      )}

      <SaveGroupButton isWorking={isWorking} onSave={handleSaveAndGroup} />

      <div className="view-toggle">
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'groups' ? 'active' : ''}`}
          onClick={() => setViewMode('groups')}
        >
          Groups
        </button>
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'memory' ? 'active' : ''}`}
          onClick={handleSwitchToMemory}
        >
          Memory
        </button>
      </div>

      {viewMode === 'groups' ? (
        <TabCategoryList
          tabs={liveTabs}
          latestSession={latestSession}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
          onCloseGroup={handleCloseGroup}
        />
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
