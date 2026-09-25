import React from 'react';
import { Database, FileCheck, RefreshCw, Download, Radio, Copy, Check } from 'lucide-react';
import { useI18n } from '../../i18n';

interface BackupSettingsTabProps {
  settings: Record<string, string>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  downloadingBackup: boolean;
  onDownloadBackup: () => void;
  onGenerateToken: () => void;
  backupCurlSnippet: string;
  copiedBackupCmd: boolean;
  onCopyBackupCmd: () => void;
}

export const BackupSettingsTab: React.FC<BackupSettingsTabProps> = ({
  settings,
  setSettings,
  downloadingBackup,
  onDownloadBackup,
  onGenerateToken,
  backupCurlSnippet,
  copiedBackupCmd,
  onCopyBackupCmd
}) => {
  const { t } = useI18n();

  return (
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
          onClick={onDownloadBackup}
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
            onClick={onGenerateToken}
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
            onClick={onCopyBackupCmd}
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
      </div>
    </div>
  );
};
