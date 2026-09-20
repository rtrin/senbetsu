import { clsx } from 'clsx';
import type { AppSettings, CommandResponse, PopupCommand } from '@/lib/types';

interface SettingsPreferencesProps {
  settings: AppSettings;
  sendCommand: (cmd: PopupCommand) => Promise<CommandResponse>;
  onSettingsChanged: () => void;
}

export function SettingsPreferences({
  settings,
  sendCommand,
  onSettingsChanged,
}: SettingsPreferencesProps) {
  const bookmarkAutoClose = settings.bookmarkAutoClose !== false;
  const preserveExistingGroups = settings.preserveExistingGroups !== false;
  const update = async (patch: Partial<AppSettings>) => {
    const response = await sendCommand({ type: 'CMD_UPDATE_SETTINGS', patch });
    if (!response.ok) throw new Error(response.error ?? 'Failed to save settings.');
    onSettingsChanged();
  };
  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Groups
        </h3>
        <div className="flex items-center justify-between border-white/8 light:border-black/8 border-t py-2">
          <span className="font-medium text-[13px]">Max groups warning</span>
          <select
            className="rounded-lg border border-white/20 light:border-black/15 bg-white/5 light:bg-white px-2 py-1 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 focus:border-blue-500 light:focus:border-blue-500 focus:bg-white/10"
            value={settings.maxGroups ?? 'off'}
            onChange={(event) =>
              update({
                maxGroups: event.target.value === 'off' ? undefined : Number(event.target.value),
              })
            }
          >
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="7">7</option>
            <option value="10">10</option>
            <option value="off">Off</option>
          </select>
        </div>
        <ToggleRow
          label="Preserve existing tab groups"
          enabled={preserveExistingGroups}
          onToggle={() => update({ preserveExistingGroups: !preserveExistingGroups })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
          Bookmarks
        </h3>
        <ToggleRow
          label="Auto-close tabs after saving"
          enabled={bookmarkAutoClose}
          onToggle={() => update({ bookmarkAutoClose: !bookmarkAutoClose })}
        />
      </div>
    </>
  );
}

interface ToggleRowProps {
  enabled: boolean;
  label: string;
  onToggle: () => void;
}

function ToggleRow({ enabled, label, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between border-white/8 light:border-black/8 border-y py-2">
      <span className="font-medium text-[13px]">{label}</span>
      <button
        type="button"
        className={clsx(
          'relative h-[22px] w-[40px] cursor-pointer rounded-[11px] border-0 p-0 transition-colors duration-200',
          enabled ? 'bg-blue-500' : 'bg-white/15 light:bg-black/15',
        )}
        onClick={onToggle}
      >
        <span
          className={clsx(
            'absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200',
            enabled && 'translate-x-[18px]',
          )}
        />
      </button>
    </div>
  );
}
