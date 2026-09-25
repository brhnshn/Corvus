import React from 'react';
import { Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '../../i18n';

export type ChannelType = 'discord' | 'telegram' | 'ntfy' | 'webhook';

interface NotificationSettingsTabProps {
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeChannel: ChannelType;
  setActiveChannel: (channel: ChannelType) => void;
  testingChannel: string | null;
  testResult: { channel: string; success: boolean; message: string } | null;
  onTestNotification: (channel: string) => void;
}

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({
  settings,
  setSettings,
  activeChannel,
  setActiveChannel,
  testingChannel,
  testResult,
  onTestNotification
}) => {
  const { t } = useI18n();

  const channels: { id: ChannelType; name: string; enabled: boolean }[] = [
    { id: 'discord', name: t('settings.channelTabDiscord'), enabled: settings['notification_discord_enabled'] === 'true' },
    { id: 'telegram', name: t('settings.channelTabTelegram'), enabled: settings['notification_telegram_enabled'] === 'true' },
    { id: 'ntfy', name: t('settings.channelTabNtfy'), enabled: settings['notification_ntfy_enabled'] === 'true' },
    { id: 'webhook', name: t('settings.channelTabWebhook'), enabled: settings['notification_webhook_enabled'] === 'true' },
  ];

  return (
    <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-6">
      <div className="border-b border-[#2a2e3f] pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
          <Bell className="w-4 h-4 text-[#d4d4d8]" />
          <h2>{t('settings.notificationsTitle')}</h2>
        </div>
        <p className="text-xs text-[#9ca3af] mt-1">
          {t('settings.notificationsDesc')}
        </p>
      </div>

      {/* Kanal Sekmeleri */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0f1117] p-1.5 rounded-xl border border-[#2a2e3f]">
        {channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setActiveChannel(ch.id)}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeChannel === ch.id
                ? 'bg-[#1a1d29] text-white shadow-sm border border-[#2a2e3f]'
                : 'text-[#9ca3af] hover:text-[#e5e7eb]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${ch.enabled ? 'bg-[#22c55e]' : 'bg-[#4b5563]'}`} />
            <span>{ch.name}</span>
            {ch.enabled && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono hidden sm:inline">
                {t('settings.activeCheckbox')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Test Sonuç Bildirimi */}
      {testResult && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
          testResult.success 
            ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' 
            : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'
        }`}>
          {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>[{testResult.channel.toUpperCase()}] {testResult.message}</span>
        </div>
      )}

      {/* Seçili Kanalın Ayar Paneli */}
      <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-4">
        {/* 1. Discord Paneli */}
        {activeChannel === 'discord' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e5e7eb]">{t('settings.discordWebhook')}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['notification_discord_enabled'] === 'true'}
                  onChange={(e) => setSettings({ ...settings, notification_discord_enabled: e.target.checked ? 'true' : 'false' })}
                  className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                />
                <span className="text-xs text-[#9ca3af]">{t('settings.channelEnabledLabel')}</span>
              </label>
            </div>

            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={settings['notification_discord_webhook_url'] || ''}
              onChange={(e) => setSettings({ ...settings, notification_discord_webhook_url: e.target.value })}
              className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={testingChannel === 'discord' || !settings['notification_discord_webhook_url']}
                onClick={() => onTestNotification('discord')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className={`w-3 h-3 ${testingChannel === 'discord' ? 'animate-spin' : ''}`} />
                <span>{testingChannel === 'discord' ? t('settings.testingBtn') : t('settings.testBtn', { channel: 'Discord' })}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Telegram Paneli */}
        {activeChannel === 'telegram' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e5e7eb]">{t('settings.telegramBot')}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['notification_telegram_enabled'] === 'true'}
                  onChange={(e) => setSettings({ ...settings, notification_telegram_enabled: e.target.checked ? 'true' : 'false' })}
                  className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                />
                <span className="text-xs text-[#9ca3af]">{t('settings.channelEnabledLabel')}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t('settings.telegramToken')}
                value={settings['notification_telegram_bot_token'] || ''}
                onChange={(e) => setSettings({ ...settings, notification_telegram_bot_token: e.target.value })}
                className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
              />
              <input
                type="text"
                placeholder={t('settings.telegramChatId')}
                value={settings['notification_telegram_chat_id'] || ''}
                onChange={(e) => setSettings({ ...settings, notification_telegram_chat_id: e.target.value })}
                className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={testingChannel === 'telegram' || !settings['notification_telegram_bot_token'] || !settings['notification_telegram_chat_id']}
                onClick={() => onTestNotification('telegram')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className={`w-3 h-3 ${testingChannel === 'telegram' ? 'animate-spin' : ''}`} />
                <span>{testingChannel === 'telegram' ? t('settings.testingBtn') : t('settings.testBtn', { channel: 'Telegram' })}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Ntfy Paneli */}
        {activeChannel === 'ntfy' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e5e7eb]">{t('settings.ntfyPush')}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['notification_ntfy_enabled'] === 'true'}
                  onChange={(e) => setSettings({ ...settings, notification_ntfy_enabled: e.target.checked ? 'true' : 'false' })}
                  className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                />
                <span className="text-xs text-[#9ca3af]">{t('settings.channelEnabledLabel')}</span>
              </label>
            </div>

            <input
              type="url"
              placeholder={t('settings.ntfyUrlPlaceholder')}
              value={settings['notification_ntfy_url'] || ''}
              onChange={(e) => setSettings({ ...settings, notification_ntfy_url: e.target.value })}
              className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={testingChannel === 'ntfy' || !settings['notification_ntfy_url']}
                onClick={() => onTestNotification('ntfy')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className={`w-3 h-3 ${testingChannel === 'ntfy' ? 'animate-spin' : ''}`} />
                <span>{testingChannel === 'ntfy' ? t('settings.testingBtn') : t('settings.testBtn', { channel: 'Ntfy' })}</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Generic Webhook Paneli */}
        {activeChannel === 'webhook' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e5e7eb]">{t('settings.genericWebhook')}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['notification_webhook_enabled'] === 'true'}
                  onChange={(e) => setSettings({ ...settings, notification_webhook_enabled: e.target.checked ? 'true' : 'false' })}
                  className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                />
                <span className="text-xs text-[#9ca3af]">{t('settings.channelEnabledLabel')}</span>
              </label>
            </div>

            <input
              type="url"
              placeholder={t('settings.webhookPlaceholder')}
              value={settings['notification_webhook_url'] || ''}
              onChange={(e) => setSettings({ ...settings, notification_webhook_url: e.target.value })}
              className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={testingChannel === 'webhook' || !settings['notification_webhook_url']}
                onClick={() => onTestNotification('webhook')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className={`w-3 h-3 ${testingChannel === 'webhook' ? 'animate-spin' : ''}`} />
                <span>{testingChannel === 'webhook' ? t('settings.testingBtn') : t('settings.testBtn', { channel: 'Webhook' })}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bildirim Olay Filtreleri (Tetikleyiciler) */}
      <div className="pt-2 border-t border-[#2a2e3f]/60 space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-[#e5e7eb]">{t('settings.eventsTitle')}</h3>
          <p className="text-[11px] text-[#9ca3af]">{t('settings.eventsDesc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] cursor-pointer text-xs text-[#e5e7eb] hover:border-[#3f4458] transition-colors">
            <input
              type="checkbox"
              checked={settings['notify_service_events'] !== 'false'}
              onChange={(e) => setSettings({ ...settings, notify_service_events: e.target.checked ? 'true' : 'false' })}
              className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
            />
            <span>{t('settings.eventServiceOutages')}</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] cursor-pointer text-xs text-[#e5e7eb] hover:border-[#3f4458] transition-colors">
            <input
              type="checkbox"
              checked={settings['notify_system_alerts'] !== 'false'}
              onChange={(e) => setSettings({ ...settings, notify_system_alerts: e.target.checked ? 'true' : 'false' })}
              className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
            />
            <span>{t('settings.eventSystemResources')}</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] cursor-pointer text-xs text-[#e5e7eb] hover:border-[#3f4458] transition-colors">
            <input
              type="checkbox"
              checked={settings['notify_backup_events'] !== 'false'}
              onChange={(e) => setSettings({ ...settings, notify_backup_events: e.target.checked ? 'true' : 'false' })}
              className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
            />
            <span>{t('settings.eventBackupAlerts')}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
