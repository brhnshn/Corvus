import React, { useEffect, useState } from 'react';
import { api, type VersionInfo } from '../api/client';
import { 
  Save, 
  Check, 
  Database, 
  Lock, 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  Globe, 
  Download, 
  RefreshCw, 
  Copy, 
  Radio,
  FileCheck
} from 'lucide-react';
import { useI18n } from '../i18n';
import { LanguageSwitch } from '../components/LanguageSwitch';

type ChannelType = 'discord' | 'telegram' | 'ntfy' | 'webhook';

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingReg, setTogglingReg] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('discord');
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; success: boolean; message: string } | null>(null);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [copiedBackupCmd, setCopiedBackupCmd] = useState(false);
  const [dbStats, setDbStats] = useState<{ formattedSize: string; sizeBytes: number } | null>(null);
  const [isCustomDays, setIsCustomDays] = useState(false);

  const isRegistrationOpen = settings['registration_enabled'] !== 'false';

  const fetchDbStats = () => {
    fetch('/api/settings/db-stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setDbStats(data); })
      .catch(() => {});
  };

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data);
      const days = data['retention_days'] ?? '30';
      const known = ['7', '15', '30', '60', '90', '180', '365', '0'];
      if (!known.includes(days) && days !== '') {
        setIsCustomDays(true);
      }
    });
    api.getVersion().then(setVersionInfo).catch(() => {});
    fetchDbStats();
  }, []);

  const handleToggleRegistration = async () => {
    setTogglingReg(true);
    const newStatus = !isRegistrationOpen;
    try {
      await api.toggleRegistration(newStatus);
      setSettings(prev => ({
        ...prev,
        registration_enabled: newStatus ? 'true' : 'false'
      }));
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setTogglingReg(false);
    }
  };

  const handleTestNotification = async (channel: string) => {
    setTestingChannel(channel);
    setTestResult(null);
    try {
      const res = await api.testNotification({
        channel,
        webhookUrl: channel === 'discord' ? settings['notification_discord_webhook_url']
                  : channel === 'ntfy' ? settings['notification_ntfy_url']
                  : settings['notification_webhook_url'],
        botToken: settings['notification_telegram_bot_token'],
        chatId: settings['notification_telegram_chat_id']
      });
      setTestResult({ channel, success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ channel, success: false, message: err.message || 'Test failed' });
    } finally {
      setTestingChannel(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Kaydetme hatası: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/backup/download');
      if (!res.ok) throw new Error('Yedek indirilemedi');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corvus-backup-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setDownloadingBackup(false);
      fetchDbStats();
    }
  };

  const handleGenerateToken = () => {
    const chars = 'abcdef0123456789';
    let rand = '';
    for (let i = 0; i < 16; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    setSettings(prev => ({ ...prev, backup_push_token: rand }));
  };

  const origin = window.location.origin;
  const currentBackupToken = settings['backup_push_token'] || 'corvus_backup_token';
  const backupCurlSnippet = `curl -X POST "${origin}/api/push/${currentBackupToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"success","sizeBytes":1073741824,"message":"Yedek tamamlandı"}'`;

  const handleCopyBackupCmd = () => {
    navigator.clipboard.writeText(backupCurlSnippet);
    setCopiedBackupCmd(true);
    setTimeout(() => setCopiedBackupCmd(false), 2000);
  };

  const channels: { id: ChannelType; name: string; enabled: boolean }[] = [
    { id: 'discord', name: t('settings.channelTabDiscord'), enabled: settings['notification_discord_enabled'] === 'true' },
    { id: 'telegram', name: t('settings.channelTabTelegram'), enabled: settings['notification_telegram_enabled'] === 'true' },
    { id: 'ntfy', name: t('settings.channelTabNtfy'), enabled: settings['notification_ntfy_enabled'] === 'true' },
    { id: 'webhook', name: t('settings.channelTabWebhook'), enabled: settings['notification_webhook_enabled'] === 'true' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('settings.title')}</h1>
        <p className="text-sm text-[#9ca3af]">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* BÖLÜM 1: GENEL VE ERİŞİM GÜVENLİĞİ */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-5">
          {/* Dil Seçimi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2a2e3f]/60">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#d4d4d8]" />
              <div>
                <h2 className="text-sm font-semibold text-[#e5e7eb]">{t('settings.languageSectionTitle')}</h2>
                <p className="text-xs text-[#9ca3af]">{t('settings.languageSectionDesc')}</p>
              </div>
            </div>
            <LanguageSwitch variant="full" />
          </div>

          {/* Kullanıcı Kayıtları (Açık/Kapalı) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2a2e3f]/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
                <Lock className="w-4 h-4 text-[#d4d4d8]" />
                <h2>{t('settings.userRegistration')}</h2>
              </div>
              <p className="text-xs text-[#9ca3af] max-w-lg leading-relaxed">
                {t('settings.regDesc')}
              </p>
            </div>

            <button
              type="button"
              disabled={togglingReg}
              onClick={handleToggleRegistration}
              className={`self-start sm:self-auto px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                isRegistrationOpen
                  ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/25'
                  : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/25'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRegistrationOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
              <span>{isRegistrationOpen ? t('settings.regOpenBtn') : t('settings.regClosedBtn')}</span>
            </button>
          </div>

          {/* Veri Saklama Süresi */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb] flex-wrap">
                  <Database className="w-4 h-4 text-[#d4d4d8]" />
                  <h2>{t('settings.retentionTitle')}</h2>
                  {dbStats && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0f1117] border border-[#2a2e3f] text-xs font-mono text-[#9ca3af]">
                      <span>{t('settings.dbSize')}: <strong className="text-white">{dbStats.formattedSize}</strong></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9ca3af] max-w-lg">
                  {t('settings.retentionDesc')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <select
                  value={isCustomDays ? 'custom' : (settings['retention_days'] ?? '30')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setIsCustomDays(true);
                    } else {
                      setIsCustomDays(false);
                      setSettings({ ...settings, retention_days: val });
                    }
                  }}
                  className="bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-1.5 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8] cursor-pointer"
                >
                  <option value="7">{t('settings.retentionPresets.d7')}</option>
                  <option value="15">{t('settings.retentionPresets.d15')}</option>
                  <option value="30">{t('settings.retentionPresets.d30')}</option>
                  <option value="60">{t('settings.retentionPresets.d60')}</option>
                  <option value="90">{t('settings.retentionPresets.d90')}</option>
                  <option value="180">{t('settings.retentionPresets.d180')}</option>
                  <option value="365">{t('settings.retentionPresets.d365')}</option>
                  <option value="0">{t('settings.retentionPresets.unlimited')}</option>
                  <option value="custom">{t('settings.retentionPresets.custom')}</option>
                </select>

                {isCustomDays && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={settings['retention_days'] || ''}
                      onChange={(e) => setSettings({ ...settings, retention_days: e.target.value })}
                      placeholder="Gün"
                      className="w-20 bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-2.5 py-1.5 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8] text-center font-mono"
                    />
                    <span className="text-xs text-[#9ca3af]">gün</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sınırsız Mod Risk Uyarısı */}
            {settings['retention_days'] === '0' && !isCustomDays && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="leading-relaxed">
                  {t('settings.retentionUnlimitedWarning')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BÖLÜM 2: BİLDİRİM VE ALARM KANALLARI (Sekmeli & Kompakt) */}
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
                    onClick={() => handleTestNotification('discord')}
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
                    onClick={() => handleTestNotification('telegram')}
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
                    onClick={() => handleTestNotification('ntfy')}
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
                    onClick={() => handleTestNotification('webhook')}
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

        {/* BÖLÜM 3: YEDEKLEME YÖNETİMİ (Dahili İndirme + Harici Push Opsiyonu) */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-6">
          <div className="border-b border-[#2a2e3f] pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
              <Database className="w-4 h-4 text-[#d4d4d8]" />
              <h2>{t('settings.backupSectionTitle')}</h2>
            </div>
          </div>

          {/* 1. Dahili Corvus Yedeği */}
          <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e7eb]">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3>{t('settings.internalBackupTitle')}</h3>
              </div>
              <p className="text-xs text-[#9ca3af] max-w-md leading-relaxed">
                {t('settings.internalBackupDesc')}
              </p>
            </div>

            <button
              type="button"
              disabled={downloadingBackup}
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1a1d29] border border-[#2a2e3f] text-xs font-medium text-[#e5e7eb] hover:border-[#d4d4d8] hover:bg-[#252a3d] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {downloadingBackup ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('settings.downloadingBackup')}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('settings.downloadBackupBtn')}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Harici Script Bildirimi (Opsiyonel) */}
          <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#e5e7eb]">
                <Radio className="w-4 h-4 text-indigo-400" />
                <h3>{t('settings.externalBackupTitle')}</h3>
              </div>
            </div>

            <p className="text-xs text-[#9ca3af] leading-relaxed">
              {t('settings.externalBackupDesc')}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-[#9ca3af] shrink-0">{t('settings.backupTokenLabel')}:</span>
                <input
                  type="text"
                  value={settings['backup_push_token'] || ''}
                  placeholder="örn. a8f1c390e4b1"
                  onChange={(e) => setSettings({ ...settings, backup_push_token: e.target.value })}
                  className="flex-1 bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-1.5 text-xs text-[#e5e7eb] font-mono focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateToken}
                className="px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] transition-colors cursor-pointer shrink-0"
              >
                {t('settings.generateTokenBtn')}
              </button>
            </div>

            {/* Hazır Kopyalanabilir Curl Kutusu */}
            <div className="relative group mt-2">
              <pre className="p-3 rounded-lg bg-[#1a1d29] border border-[#2a2e3f] font-mono text-[11px] text-[#d4d4d8] overflow-x-auto whitespace-pre leading-relaxed">
                {backupCurlSnippet}
              </pre>
              <button
                type="button"
                onClick={handleCopyBackupCmd}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb] transition-colors cursor-pointer"
                title={copiedBackupCmd ? t('settings.copiedTooltip') : t('settings.copyCommandTooltip')}
              >
                {copiedBackupCmd ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-[#9ca3af]/70 italic">
              {t('settings.externalCurlHelp')}
            </p>
          </div>
        </div>

        {/* BÖLÜM 4: SİSTEM VE SÜRÜM BİLGİSİ */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2>{t('settings.versionCardTitle')}</h2>
            </div>
            {versionInfo && (
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-[#0f1117] border border-[#2a2e3f] text-[#e5e7eb] font-semibold">
                v{versionInfo.currentVersion}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[#9ca3af]">
              {versionInfo?.isUpdateAvailable ? (
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{t('settings.versionUpdateAvailable', { version: `v${versionInfo.latestVersion}` })}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  <span>{t('settings.versionUpToDate')}</span>
                </div>
              )}
            </div>

            <a
              href={versionInfo?.releaseUrl || "https://github.com/brhnshn/corvus/releases"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-xs font-medium text-[#d4d4d8] hover:text-white hover:border-[#d4d4d8] transition-colors self-start sm:self-auto"
            >
              <span>{t('settings.githubReleasesBtn')}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9ca3af]" />
            </a>
          </div>
        </div>

        {/* KAYDET BUTONU */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('common.saving') : t('settings.saveBtn')}</span>
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium">
              <Check className="w-4 h-4" />
              {t('settings.savedToast')}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
