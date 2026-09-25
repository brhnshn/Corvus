import React from 'react';
import { Send } from 'lucide-react';
import { useI18n } from '../../../i18n';

interface TelegramChannelPanelProps {
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  testingChannel: string | null;
  onTestNotification: (channel: string) => void;
}

export const TelegramChannelPanel: React.FC<TelegramChannelPanelProps> = ({
  settings,
  setSettings,
  testingChannel,
  onTestNotification
}) => {
  const { t } = useI18n();

  return (
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
  );
};
