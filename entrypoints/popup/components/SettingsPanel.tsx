import type { AppSettings, CommandResponse, PopupCommand } from '@/lib/types';
import { ProviderKeySettings } from './ProviderKeySettings';
import { SettingsPreferences } from './SettingsPreferences';
import { SettingsTips } from './SettingsTips';

interface SettingsPanelProps {
  settings: AppSettings;
  sendCommand: (cmd: PopupCommand) => Promise<CommandResponse>;
  onSettingsChanged: () => void;
}

export function SettingsPanel({ settings, sendCommand, onSettingsChanged }: SettingsPanelProps) {
  return (
    <section className="flex flex-col gap-4">
      <ProviderKeySettings
        settings={settings}
        sendCommand={sendCommand}
        onSettingsChanged={onSettingsChanged}
      />
      <SettingsPreferences settings={settings} onSettingsChanged={onSettingsChanged} />
      <SettingsTips />
    </section>
  );
}
