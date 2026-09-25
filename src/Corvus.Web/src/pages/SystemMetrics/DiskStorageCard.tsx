import React from 'react';
import { HardDrive, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n';

interface DiskStorageCardProps {
  diskUsedGb: number;
  diskTotalGb: number;
}

export const DiskStorageCard: React.FC<DiskStorageCardProps> = ({ diskUsedGb, diskTotalGb }) => {
  const { t } = useI18n();

  const diskFreeGb = Math.max(0, diskTotalGb - diskUsedGb);
  const percentUsed = diskTotalGb > 0 ? Math.round((diskUsedGb / diskTotalGb) * 100) : 0;
  const isWarning = percentUsed >= 75 && percentUsed < 90;
  const isCritical = percentUsed >= 90;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#e5e7eb]">{t('metrics.diskChartTitle')}</h2>
            <span className="text-[11px] text-[#9ca3af] font-mono">Birincil Sabit Disk / Bölüm</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCritical ? (
            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('metrics.critical')}
            </span>
          ) : isWarning ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('metrics.warning')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('metrics.optimal')}
            </span>
          )}
        </div>
      </div>

      {/* Büyük Görsel Doluluk Çubuğu */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#e5e7eb] font-semibold">
            %{percentUsed} Dolu
          </span>
          <span className="text-[#9ca3af]">
            {diskUsedGb} GB / {diskTotalGb} GB
          </span>
        </div>

        <div className="w-full bg-[#0f1117] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#2a2e3f]">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, percentUsed))}%` }}
          />
        </div>
      </div>

      {/* Bölüm Dağılımı ve Kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3 rounded-xl bg-[#0f1117] border border-[#2a2e3f]">
          <span className="text-[#9ca3af] block text-[11px] mb-1">{t('metrics.usedDisk')}</span>
          <span className="text-base font-bold font-mono text-[#e5e7eb]">{diskUsedGb} GB</span>
        </div>

        <div className="p-3 rounded-xl bg-[#0f1117] border border-[#2a2e3f]">
          <span className="text-[#9ca3af] block text-[11px] mb-1">{t('metrics.freeDisk')}</span>
          <span className="text-base font-bold font-mono text-emerald-400">{diskFreeGb} GB</span>
        </div>

        <div className="p-3 rounded-xl bg-[#0f1117] border border-[#2a2e3f]">
          <span className="text-[#9ca3af] block text-[11px] mb-1">{t('metrics.totalDisk')}</span>
          <span className="text-base font-bold font-mono text-[#d4d4d8]">{diskTotalGb} GB</span>
        </div>
      </div>
    </div>
  );
};
