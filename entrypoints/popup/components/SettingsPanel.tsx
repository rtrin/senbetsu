import { clsx } from 'clsx';
import { useState } from 'react';
import { storage } from '@/lib/storage';
import type { AppSettings, CommandResponse, PopupCommand } from '@/lib/types';

interface SettingsPanelProps {
  settings: AppSettings;
  sendCommand: (cmd: PopupCommand) => Promise<CommandResponse>;
  onSettingsChanged: () => void;
}

export function SettingsPanel({ settings, sendCommand, onSettingsChanged }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(settings.openaiApiKey ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [error, setError] = useState('');
  const bookmarkAutoClose = settings.bookmarkAutoClose !== false;
  const preserveExistingGroups = settings.preserveExistingGroups !== false;

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setIsSavingKey(true);
    setError('');
    try {
      const resp = await sendCommand({ type: 'CMD_SAVE_SETTINGS', openaiApiKey: apiKey.trim() });
      if (!resp.ok) {
        setError(resp.error ?? 'Failed to save API key');
      } else {
        onSettingsChanged();
      }
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleToggleAutoClose = async () => {
    await storage.updateSettings({ bookmarkAutoClose: !bookmarkAutoClose });
    onSettingsChanged();
  };

  const handleTogglePreserveGroups = async () => {
    await storage.updateSettings({ preserveExistingGroups: !preserveExistingGroups });
    onSettingsChanged();
  };

  const handleRemoveApiKey = async () => {
    setIsSavingKey(true);
    try {
      await sendCommand({ type: 'CMD_SAVE_SETTINGS', openaiApiKey: null });
      setApiKey('');
      onSettingsChanged();
    } finally {
      setIsSavingKey(false);
    }
  };

  const inputClass =
    'flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 placeholder:text-(--color-grey) focus:border-blue-500 focus:bg-white/10 light:border-black/15 light:bg-white light:focus:border-blue-500';

  const btnPrimarySm =
    'cursor-pointer rounded-lg border-0 bg-blue-500 px-3 py-1.5 font-sans text-xs font-semibold text-white transition-[opacity,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-blue-600';

  const btnGhost =
    'cursor-pointer rounded-lg border-0 bg-transparent px-3 py-1.5 font-sans text-xs font-semibold text-(--color-grey) transition-[opacity,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:text-white/87 light:enabled:hover:text-(--color-text-light)';

  return (
    <section className="flex flex-col gap-4">
      {/* OpenAI API Key */}
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          OpenAI API Key
        </h3>
        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            className={inputClass}
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            type="button"
            className={btnGhost}
            onClick={() => setShowApiKey(!showApiKey)}
            title={showApiKey ? 'Hide' : 'Show'}
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={btnPrimarySm}
            onClick={handleSaveApiKey}
            disabled={isSavingKey || !apiKey.trim()}
          >
            {isSavingKey ? 'Saving...' : 'Save'}
          </button>
          {settings.openaiApiKey && (
            <button
              type="button"
              className={clsx(btnGhost, 'enabled:hover:text-(--color-red)')}
              onClick={handleRemoveApiKey}
              disabled={isSavingKey}
            >
              Remove Key
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 light:bg-red-500/8 px-3 py-2 text-(--color-red) text-xs">
          {error}
        </div>
      )}

      {/* Groups */}
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Groups
        </h3>
        <div className="flex items-center justify-between border-white/8 light:border-black/8 border-t py-2">
          <span className="font-medium text-[13px]">Max groups warning</span>
          <select
            className="rounded-lg border border-white/20 light:border-black/15 bg-white/5 light:bg-white px-2 py-1 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 focus:border-blue-500 light:focus:border-blue-500 focus:bg-white/10"
            value={settings.maxGroups ?? 'off'}
            onChange={async (e) => {
              const val = e.target.value === 'off' ? undefined : Number(e.target.value);
              await storage.updateSettings({ maxGroups: val });
              onSettingsChanged();
            }}
          >
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="7">7</option>
            <option value="10">10</option>
            <option value="off">Off</option>
          </select>
        </div>
        <div className="flex items-center justify-between border-white/8 light:border-black/8 border-y py-2">
          <span className="font-medium text-[13px]">Preserve existing tab groups</span>
          <button
            type="button"
            className={clsx(
              'relative h-[22px] w-[40px] cursor-pointer rounded-[11px] border-0 p-0 transition-colors duration-200',
              preserveExistingGroups ? 'bg-blue-500' : 'bg-white/15 light:bg-black/15',
            )}
            onClick={handleTogglePreserveGroups}
          >
            <span
              className={clsx(
                'absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200',
                preserveExistingGroups && 'translate-x-[18px]',
              )}
            />
          </button>
        </div>
      </div>

      {/* Bookmarks */}
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Bookmarks
        </h3>
        <div className="flex items-center justify-between border-white/8 light:border-black/8 border-t py-2">
          <span className="font-medium text-[13px]">Auto-close tabs after saving</span>
          <button
            type="button"
            className={clsx(
              'relative h-[22px] w-[40px] cursor-pointer rounded-[11px] border-0 p-0 transition-colors duration-200',
              bookmarkAutoClose ? 'bg-blue-500' : 'bg-white/15 light:bg-black/15',
            )}
            onClick={handleToggleAutoClose}
          >
            <span
              className={clsx(
                'absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200',
                bookmarkAutoClose && 'translate-x-[18px]',
              )}
            />
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="flex flex-col gap-2 border-white/10 light:border-black/10 border-t pt-4">
        <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Tips
        </h3>
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-[14px] leading-[1.5]">⌨️</span>
          <p className="m-0 text-(--color-grey) text-xs leading-[1.5]">
            Set a keyboard shortcut to open Senbetsu quickly.{' '}
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-blue-500 text-xs no-underline hover:underline"
              onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
            >
              Open shortcut settings →
            </button>
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-[14px] leading-[1.5]">🔑</span>
          <p className="m-0 text-(--color-grey) text-xs leading-[1.5]">
            Need an OpenAI key?{' '}
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-blue-500 text-xs no-underline hover:underline"
              onClick={() => chrome.tabs.create({ url: 'https://platform.openai.com/api-keys' })}
            >
              Get one at platform.openai.com →
            </button>{' '}
            Create an account, go to API Keys, and generate a new secret key.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-[14px] leading-[1.5]">☕</span>
          <p className="m-0 text-(--color-grey) text-xs leading-[1.5]">
            Love Senbetsu?{' '}
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-blue-500 text-xs no-underline hover:underline"
              onClick={() => chrome.tabs.create({ url: 'https://ko-fi.com/8bits' })}
            >
              Support development on Ko-fi →
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
