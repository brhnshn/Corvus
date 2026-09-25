import React from 'react';
import { 
  Clock, 
  Database, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  ShieldCheck, 
  Radio, 
  FileCheck 
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { BackupEvent, PushMonitor } from '../../api/client';
import { formatBytes, formatRelativeTime } from '../../utils/format';
import { StatusBadge } from '../../components/StatusBadge';

interface OperationsWidgetProps {
  lastBackup?: BackupEvent;
  pushMonitors: PushMonitor[];
  onNavigate?: (page: 'uptime' | 'settings') => void;
}

export const OperationsWidget: React.FC<OperationsWidgetProps> = ({
  lastBackup,
  pushMonitors,
  onNavigate
}) => {
  const { t, language } = useI18n();
  const isTr = language === 'tr';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* 1. Dead Man's Snitch (Arka Plan Cron Monitörleri) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#e5e7eb]">
                  {t('dashboard.pushMonitors')}
                </h3>
                <span className="text-[11px] text-[#9ca3af]">Cron & Arka Plan Nabız Takibi</span>
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('uptime')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{t('common.details')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Monitors List */}
          {pushMonitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[#9ca3af] bg-[#0f1117] rounded-xl border border-dashed border-[#2a2e3f]">
              <Radio className="w-6 h-6 text-[#9ca3af]/40 mb-1.5" />
              <p className="text-xs">{t('dashboard.noPushMonitors')}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pushMonitors.slice(0, 3).map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0f1117] border border-[#2a2e3f] text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-[#e5e7eb] truncate">{pm.name}</div>
                    <div className="text-[11px] text-[#9ca3af] flex items-center gap-2 mt-0.5">
                      <span>Her {pm.expectedIntervalMinutes} dk</span>
                      <span className="text-[#3b4252]">•</span>
                      <span>Son: {formatRelativeTime(pm.lastSeenAt, isTr)}</span>
                    </div>
                  </div>
                  <StatusBadge status={pm.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {pushMonitors.length > 3 && onNavigate && (
          <div className="pt-2 text-center border-t border-[#2a2e3f]/60">
            <button
              type="button"
              onClick={() => onNavigate('uptime')}
              className="text-xs text-[#9ca3af] hover:text-[#e5e7eb] font-mono transition-colors cursor-pointer"
            >
              +{pushMonitors.length - 3} diğer monitörü gör
            </button>
          </div>
        )}
      </div>

      {/* 2. Son Yedekleme & Güvenlik Kartı */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#e5e7eb]">
                  {t('dashboard.lastBackup')}
                </h3>
                <span className="text-[11px] text-[#9ca3af]">Sistem & Veritabanı Yedek Durumu</span>
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{t('nav.settings')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {lastBackup ? (
            <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-[#e5e7eb] truncate max-w-[180px]">
                    {lastBackup.token}
                  </span>
                </div>
                <StatusBadge status={lastBackup.status === 'success' ? 'healthy' : 'down'} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 text-[#9ca3af]">
                <div>
                  <span className="text-[10px] text-[#6b7280] block">Zaman</span>
                  <span>{new Date(lastBackup.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({formatRelativeTime(lastBackup.receivedAt, isTr)})</span>
                </div>
                {typeof lastBackup.sizeBytes === 'number' && (
                  <div>
                    <span className="text-[10px] text-[#6b7280] block">{t('dashboard.backupSize')}</span>
                    <span>{formatBytes(lastBackup.sizeBytes)}</span>
                  </div>
                )}
              </div>

              {lastBackup.message && (
                <div className="p-2 rounded-lg bg-[#1a1d29] text-[11px] font-mono text-[#9ca3af] truncate">
                  {lastBackup.message}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[#9ca3af] bg-[#0f1117] rounded-xl border border-dashed border-[#2a2e3f]">
              <CheckCircle2 className="w-6 h-6 text-[#9ca3af]/40 mb-1.5" />
              <p className="text-xs">{t('dashboard.noBackupReceived')}</p>
            </div>
          )}
        </div>

        {/* Quick Backup download hint */}
        <div className="pt-2 flex items-center justify-between text-xs text-[#9ca3af] border-t border-[#2a2e3f]/60">
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Otomatik snapshot koruması aktif</span>
          </span>
          <a
            href="/api/backup/download"
            className="text-xs text-indigo-400 hover:text-indigo-200 inline-flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>İndir</span>
          </a>
        </div>
      </div>
    </div>
  );
};
