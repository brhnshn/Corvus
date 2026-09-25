import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  Layers, 
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { DashboardSummary, SystemMetric } from '../../api/client';

interface SystemKpiStripProps {
  summary: DashboardSummary | null;
  metrics: SystemMetric | undefined;
}

export const SystemKpiStrip: React.FC<SystemKpiStripProps> = ({ summary, metrics }) => {
  const { t } = useI18n();

  const totalServices = summary?.totalServices ?? 0;
  const healthyServices = summary?.healthyServices ?? 0;
  const degradedServices = summary?.degradedServices ?? 0;
  const downServices = summary?.downServices ?? 0;

  const totalContainers = summary?.totalContainers ?? 0;
  const runningContainers = summary?.runningContainers ?? 0;
  const stoppedContainers = Math.max(0, totalContainers - runningContainers);

  const cpuPercent = metrics ? metrics.cpuPercent : 0;
  const ramPercent = metrics && metrics.ramTotalMb > 0
    ? Math.round((metrics.ramUsedMb / metrics.ramTotalMb) * 100) 
    : 0;
  const ramUsedGb = metrics ? (metrics.ramUsedMb / 1024).toFixed(1) : '0';
  const ramTotalGb = metrics ? (metrics.ramTotalMb / 1024).toFixed(1) : '0';

  const diskPercent = metrics && metrics.diskTotalGb > 0
    ? Math.round((metrics.diskUsedGb / metrics.diskTotalGb) * 100) 
    : 0;
  const diskUsedGb = metrics ? metrics.diskUsedGb : 0;
  const diskTotalGb = metrics ? metrics.diskTotalGb : 0;

  // Bar color helpers
  const getLoadColor = (pct: number) => {
    if (pct >= 85) return 'bg-rose-500';
    if (pct >= 65) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Servisler Kartı (Mobil: Sol Üst) */}
      <div className="col-span-1 p-3.5 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-[11px] sm:text-xs font-medium mb-1.5 sm:mb-2">
          <span className="truncate">{t('dashboard.totalServices')}</span>
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">{totalServices}</span>
            <span className="text-[11px] sm:text-xs text-emerald-400 font-medium truncate">
              {t('dashboard.activeCount', { count: healthyServices })}
            </span>
          </div>
          {/* Mini Status Breakdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#2a2e3f]/60 text-[10px] sm:text-[11px] font-mono">
            {downServices > 0 ? (
              <span className="text-rose-400 font-semibold truncate">{t('dashboard.downCount', { count: downServices })}</span>
            ) : (
              <span className="text-[#9ca3af] flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{t('dashboard.statusHealthy')}</span>
              </span>
            )}
            {degradedServices > 0 && (
              <>
                <span className="text-[#3b4252]">•</span>
                <span className="text-amber-400 truncate">{t('dashboard.degradedCount', { count: degradedServices })}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Docker Konteynerleri Kartı (Mobil: Sağ Üst) */}
      <div className="col-span-1 p-3.5 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-[11px] sm:text-xs font-medium mb-1.5 sm:mb-2">
          <span className="truncate">{t('dashboard.dockerContainers')}</span>
          <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
            <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">{totalContainers}</span>
            <span className="text-[11px] sm:text-xs text-emerald-400 font-medium truncate">
              {t('dashboard.runningCount', { count: runningContainers })}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#2a2e3f]/60 text-[10px] sm:text-[11px] font-mono">
            <span className="text-[#9ca3af] truncate">
              {stoppedContainers > 0 ? (
                <span className="text-amber-400/90 truncate">{t('dashboard.stoppedContainersCount', { count: stoppedContainers })}</span>
              ) : (
                <span className="text-emerald-400/80 truncate">100% {t('dashboard.runningCount', { count: totalContainers })}</span>
              )}
            </span>
            <div className="w-12 sm:w-16 bg-[#0f1117] h-1.5 rounded-full overflow-hidden shrink-0 ml-1">
              <div 
                className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalContainers > 0 ? (runningContainers / totalContainers) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CPU Kullanımı Kartı (Mobil: Sol Orta) */}
      <div className="col-span-1 p-3.5 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-[11px] sm:text-xs font-medium mb-1.5 sm:mb-2">
          <span className="truncate">{t('dashboard.cpuUsage')}</span>
          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">
              {metrics ? `${cpuPercent}%` : '--'}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#9ca3af]">
              {cpuPercent > 80 ? 'Yüksek' : 'Normal'}
            </span>
          </div>
          <div className="w-full bg-[#0f1117] h-1.5 rounded-full mt-2.5 sm:mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getLoadColor(cpuPercent)}`} 
              style={{ width: `${Math.min(100, cpuPercent)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 4. RAM Kullanımı Kartı (Mobil: Sağ Orta) */}
      <div className="col-span-1 p-3.5 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-[11px] sm:text-xs font-medium mb-1.5 sm:mb-2">
          <span className="truncate">{t('dashboard.ramUsage')}</span>
          <div className="p-1.5 sm:p-2 rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
            <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">
              {metrics ? `${ramPercent}%` : '--'}
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#9ca3af] truncate">
              {ramUsedGb}/{ramTotalGb} GB
            </span>
          </div>
          <div className="w-full bg-[#0f1117] h-1.5 rounded-full mt-2.5 sm:mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getLoadColor(ramPercent)}`} 
              style={{ width: `${Math.min(100, ramPercent)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 5. Disk Durumu Kartı (Mobil: En Alta Geniş Alan - col-span-2 lg:col-span-4) */}
      <div className="col-span-2 lg:col-span-4 p-3.5 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] hover:border-[#3b4252] transition-colors flex flex-col justify-between space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-semibold text-[#e5e7eb]">
                Disk Durumu
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono text-[#9ca3af]">
                ({Math.max(0, diskTotalGb - diskUsedGb)} GB Boş)
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-base sm:text-xl font-bold text-[#e5e7eb]">
              %{diskPercent}
            </span>
            <span className="text-xs text-[#9ca3af]">
              {diskUsedGb} / {diskTotalGb} GB
            </span>
          </div>
        </div>

        <div className="w-full bg-[#0f1117] h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getLoadColor(diskPercent)}`} 
            style={{ width: `${Math.min(100, diskPercent)}%` }} 
          />
        </div>
      </div>
    </div>
  );
};
