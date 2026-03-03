import { useState } from 'react';
import { FREE_DAILY_LIMIT } from '@/lib/constants';
import type { AppSettings, CommandResponse, PopupCommand } from '@/lib/types';

interface SettingsPanelProps {
  settings: AppSettings;
  usageCount: number;
  sendCommand: (cmd: PopupCommand) => Promise<CommandResponse>;
  onSettingsChanged: () => void;
}

export function SettingsPanel({
  settings,
  usageCount,
  sendCommand,
  onSettingsChanged,
}: SettingsPanelProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [apiKey, setApiKey] = useState(settings.openaiApiKey ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [error, setError] = useState('');

  const tierLabel = settings.tier === 'free' ? 'Free' : settings.tier === 'pro' ? 'Pro' : 'BYOK';

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setIsActivating(true);
    setError('');
    try {
      const resp = await sendCommand({
        type: 'CMD_ACTIVATE_LICENSE',
        licenseKey: licenseKey.trim(),
      });
      if (resp.ok) {
        setLicenseKey('');
        onSettingsChanged();
      } else {
        setError(resp.error ?? 'Activation failed');
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    setError('');
    try {
      await sendCommand({ type: 'CMD_DEACTIVATE_LICENSE' });
      onSettingsChanged();
    } finally {
      setIsDeactivating(false);
    }
  };

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

  return (
    <section className="settings-panel">
      {/* ── Tier & Usage ── */}
      <div className="settings-section">
        <div className="settings-tier">
          <span className="settings-tier__label">Current Plan</span>
          <span className={`settings-tier__badge settings-tier__badge--${settings.tier}`}>
            {tierLabel}
          </span>
        </div>
        {settings.tier === 'free' ? (
          <div className="settings-usage">
            {usageCount} / {FREE_DAILY_LIMIT} free groupings today
          </div>
        ) : (
          <div className="settings-usage">Unlimited groupings</div>
        )}
      </div>

      {/* ── Upgrade Links (free tier only) ── */}
      {settings.tier === 'free' && (
        <div className="settings-section">
          <button
            type="button"
            className="btn btn--primary btn--sm settings-upgrade-btn"
            onClick={() =>
              chrome.tabs.create({
                url: 'https://senbetsu.lemonsqueezy.com/checkout/buy/c08ff5cc-23c0-4f36-85f9-0c5eb89d3e9a',
              })
            }
          >
            Upgrade to Pro — $5/mo
          </button>
          <button
            type="button"
            className="btn btn--ghost settings-upgrade-btn"
            onClick={() =>
              chrome.tabs.create({
                url: 'https://senbetsu.lemonsqueezy.com/checkout/buy/c360fa2b-dda6-4d25-a51b-4badc8ee62c5',
              })
            }
          >
            Get BYOK — $7 one-time
          </button>
        </div>
      )}

      {/* ── License Key ── */}
      <div className="settings-section">
        <h3 className="settings-section__title">License Key</h3>
        {settings.licenseKey ? (
          <div className="settings-license-active">
            <span className="settings-license-active__status">{tierLabel} license active</span>
            <button
              type="button"
              className="btn btn--ghost btn--danger"
              onClick={handleDeactivate}
              disabled={isDeactivating}
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        ) : (
          <div className="settings-license-input">
            <input
              type="text"
              className="prompt-input"
              placeholder="Enter license key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
            />
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleActivate}
              disabled={isActivating || !licenseKey.trim()}
            >
              {isActivating ? 'Activating...' : 'Activate'}
            </button>
          </div>
        )}
      </div>

      {/* ── BYOK API Key (only for byok tier) ── */}
      {settings.tier === 'byok' && (
        <div className="settings-section">
          <h3 className="settings-section__title">OpenAI API Key</h3>
          <div className="settings-apikey-input">
            <input
              type={showApiKey ? 'text' : 'password'}
              className="prompt-input"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? 'Hide' : 'Show'}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="settings-apikey-actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleSaveApiKey}
              disabled={isSavingKey || !apiKey.trim()}
            >
              {isSavingKey ? 'Saving...' : 'Save'}
            </button>
            {settings.openaiApiKey && (
              <button
                type="button"
                className="btn btn--ghost btn--danger"
                onClick={handleRemoveApiKey}
                disabled={isSavingKey}
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
      )}

      {error && <div className="settings-error">{error}</div>}
    </section>
  );
}
