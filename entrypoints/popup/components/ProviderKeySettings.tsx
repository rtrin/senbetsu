import { clsx } from 'clsx';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { AI_PROVIDER_METADATA } from '@/lib/ai-provider';
import type { AIProvider, AppSettings, CommandResponse, PopupCommand } from '@/lib/types';

interface ProviderKeySettingsProps {
  settings: AppSettings;
  sendCommand: (cmd: PopupCommand) => Promise<CommandResponse>;
  onSettingsChanged: () => void;
}

const inputClass =
  'flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 placeholder:text-(--color-grey) focus:border-blue-500 focus:bg-white/10 light:border-black/15 light:bg-white light:focus:border-blue-500';
const btnPrimarySm =
  'cursor-pointer rounded-lg border-0 bg-blue-500 px-3 py-1.5 font-sans text-xs font-semibold text-white transition-[opacity,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-blue-600';
const btnGhost =
  'cursor-pointer rounded-lg border-0 bg-transparent px-3 py-1.5 font-sans text-xs font-semibold text-(--color-grey) transition-[opacity,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:text-white/87 light:enabled:hover:text-(--color-text-light)';
type DraftSetter = Dispatch<SetStateAction<Partial<Record<AIProvider, string>>>>;
type ErrorSetter = Dispatch<SetStateAction<string>>;

async function saveKey(
  sendCommand: ProviderKeySettingsProps['sendCommand'],
  provider: AIProvider,
  apiKey: string | null,
): Promise<string | null> {
  try {
    const response = await sendCommand({ type: 'CMD_SAVE_SETTINGS', provider, apiKey });
    return response.ok ? null : (response.error ?? 'Failed to save API key');
  } catch {
    return 'Failed to save API key';
  }
}

async function selectProvider(
  sendCommand: ProviderKeySettingsProps['sendCommand'],
  provider: AIProvider,
): Promise<string | null> {
  try {
    const response = await sendCommand({ type: 'CMD_SELECT_AI_PROVIDER', provider });
    return response.ok ? null : (response.error ?? 'Failed to select AI provider');
  } catch {
    return 'Failed to select AI provider';
  }
}

function useKeyMutations(
  sendCommand: ProviderKeySettingsProps['sendCommand'],
  onSettingsChanged: () => void,
  provider: AIProvider,
  apiKey: string,
  setDrafts: DraftSetter,
  setError: ErrorSetter,
) {
  const [isSaving, setIsSaving] = useState(false);
  const save = async () => {
    if (!apiKey.trim()) return;
    setIsSaving(true);
    setError('');
    const error = await saveKey(sendCommand, provider, apiKey.trim());
    setIsSaving(false);
    if (error) setError(error);
    else onSettingsChanged();
  };
  const remove = async () => {
    setIsSaving(true);
    setError('');
    const error = await saveKey(sendCommand, provider, null);
    setIsSaving(false);
    if (error) setError(error);
    else {
      setDrafts((current) => ({ ...current, [provider]: '' }));
      onSettingsChanged();
    }
  };
  return { isSaving, remove, save };
}

function useProviderKeyForm({
  settings,
  sendCommand,
  onSettingsChanged,
}: ProviderKeySettingsProps) {
  const [provider, setProvider] = useState<AIProvider>(settings.activeProvider);
  const [drafts, setDrafts] = useState<Partial<Record<AIProvider, string>>>(settings.apiKeys);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setProvider(settings.activeProvider);
    setDrafts((current) => ({ ...current, ...settings.apiKeys }));
  }, [settings.activeProvider, settings.apiKeys]);

  const apiKey = drafts[provider] ?? '';
  const { isSaving, remove, save } = useKeyMutations(
    sendCommand,
    onSettingsChanged,
    provider,
    apiKey,
    setDrafts,
    setError,
  );
  const disabled = isSaving || isSelecting;
  const changeDraft = (value: string) =>
    setDrafts((current) => ({ ...current, [provider]: value }));
  const toggleApiKey = () => setShowApiKey((visible) => !visible);
  const changeProvider = async (nextProvider: AIProvider) => {
    const previousProvider = provider;
    setProvider(nextProvider);
    setShowApiKey(false);
    setError('');
    setIsSelecting(true);
    const selectionError = await selectProvider(sendCommand, nextProvider);
    setIsSelecting(false);
    if (selectionError) {
      setProvider(previousProvider);
      setError(selectionError);
    } else onSettingsChanged();
  };
  return {
    apiKey,
    changeDraft,
    changeProvider,
    disabled,
    error,
    isSaving,
    provider,
    remove,
    save,
    setShowApiKey,
    showApiKey,
    toggleApiKey,
  };
}

interface ApiKeyControlsProps {
  apiKey: string;
  disabled: boolean;
  hasSavedKey: boolean;
  metadata: (typeof AI_PROVIDER_METADATA)[AIProvider];
  isSaving: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
  onSave: () => void;
  onToggleVisibility: () => void;
  showApiKey: boolean;
}

function ApiKeyControls({
  apiKey,
  disabled,
  hasSavedKey,
  metadata,
  isSaving,
  onChange,
  onRemove,
  onSave,
  onToggleVisibility,
  showApiKey,
}: ApiKeyControlsProps) {
  return (
    <>
      <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
        {metadata.keyLabel}
      </h3>
      <div className="flex gap-2">
        <input
          type={showApiKey ? 'text' : 'password'}
          className={inputClass}
          placeholder={metadata.placeholder}
          value={apiKey}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className={btnGhost}
          onClick={onToggleVisibility}
          title={showApiKey ? 'Hide' : 'Show'}
          disabled={disabled}
        >
          {showApiKey ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={btnPrimarySm}
          onClick={onSave}
          disabled={disabled || !apiKey.trim()}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {hasSavedKey && (
          <button
            type="button"
            className={clsx(btnGhost, 'enabled:hover:text-(--color-red)')}
            onClick={onRemove}
            disabled={disabled}
          >
            Remove Key
          </button>
        )}
      </div>
      <DataDisclosure providerName={metadata.label} />
    </>
  );
}

function DataDisclosure({ providerName }: { providerName: string }) {
  return (
    <p className="m-0 text-(--color-grey) text-xs leading-[1.5]">
      Tab titles and URLs are sent to {providerName} when grouping.
    </p>
  );
}

export function ProviderKeySettings(props: ProviderKeySettingsProps) {
  const form = useProviderKeyForm(props);
  const metadata = AI_PROVIDER_METADATA[form.provider];
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 font-semibold text-(--color-grey) text-[11px] uppercase tracking-wider">
        AI Provider
      </h3>
      <select
        className="rounded-lg border border-white/20 light:border-black/15 bg-white/5 light:bg-white px-3 py-2.5 font-sans text-[13px] text-inherit outline-none transition-[border-color,background-color] duration-150 focus:border-blue-500 light:focus:border-blue-500 focus:bg-white/10"
        value={form.provider}
        onChange={(event) => form.changeProvider(event.target.value as AIProvider)}
        disabled={form.disabled}
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="gemini">Google</option>
      </select>
      <ApiKeyControls
        apiKey={form.apiKey}
        disabled={form.disabled}
        hasSavedKey={Boolean(props.settings.apiKeys[form.provider])}
        metadata={metadata}
        isSaving={form.isSaving}
        onChange={form.changeDraft}
        onRemove={form.remove}
        onSave={form.save}
        onToggleVisibility={form.toggleApiKey}
        showApiKey={form.showApiKey}
      />
      <p className="m-0 text-(--color-grey) text-xs leading-[1.5]">
        Need a {metadata.label} key?{' '}
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 font-sans text-blue-500 text-xs no-underline hover:underline"
          onClick={() => chrome.tabs.create({ url: metadata.helpUrl })}
        >
          {metadata.helpText} →
        </button>
      </p>
      {form.error && (
        <div className="rounded-md bg-red-500/10 light:bg-red-500/8 px-3 py-2 text-(--color-red) text-xs">
          {form.error}
        </div>
      )}
    </div>
  );
}
