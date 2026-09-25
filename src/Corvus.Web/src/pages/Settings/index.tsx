import React, { useEffect, useState } from 'react';
import { api, type VersionInfo } from '../../api/client';
import { Save, Check, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';
import { useI18n } from '../../i18n';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { NotificationSettingsTab, type ChannelType } from './NotificationSettingsTab';
import { BackupSettingsTab } from './BackupSettingsTab';

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
    api.getDbStats()
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
    } catch (err: unknown) {
      alert(`Hata: ${err instanceof Error ? err.message : 'Error'}`);
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
    } catch (err: unknown) {
      setTestResult({ channel, success: false, message: err instanceof Error ? err.message : 'Test failed' });
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
    } catch (err: unknown) {
      alert(`Kaydetme hatası: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const blob = await api.downloadBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corvus-backup-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(`Hata: ${err instanceof Error ? err.message : 'Error'}`);
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('settings.title')}</h1>
        <p className="text-sm text-[#9ca3af]">{t('settings.subtitle')}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* BÖLÜM 1: GENEL VE ERİŞİM GÜVENLİĞİ */}
        <GeneralSettingsTab
          settings={settings}
          setSettings={setSettings}
          dbStats={dbStats}
          isRegistrationOpen={isRegistrationOpen}
          togglingReg={togglingReg}
          onToggleRegistration={handleToggleRegistration}
          isCustomDays={isCustomDays}
          setIsCustomDays={setIsCustomDays}
        />

        {/* BÖLÜM 2: BİLDİRİM VE ALARM KANALLARI */}
        <NotificationSettingsTab
          settings={settings}
          setSettings={setSettings}
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          testingChannel={testingChannel}
          testResult={testResult}
          onTestNotification={handleTestNotification}
        />

        {/* BÖLÜM 3: YEDEKLEME YÖNETİMİ */}
        <BackupSettingsTab
          settings={settings}
          setSettings={setSettings}
          downloadingBackup={downloadingBackup}
          onDownloadBackup={handleDownloadBackup}
          onGenerateToken={handleGenerateToken}
          backupCurlSnippet={backupCurlSnippet}
          copiedBackupCmd={copiedBackupCmd}
          onCopyBackupCmd={handleCopyBackupCmd}
        />

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

export default SettingsPage;
