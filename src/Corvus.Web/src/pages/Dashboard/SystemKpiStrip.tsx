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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Servisler Kartı */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-xs font-medium mb-2">
          <span>{t('dashboard.totalServices')}</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">{totalServices}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {t('dashboard.activeCount', { count: healthyServices })}
            </span>
          </div>
          {/* Mini Status Breakdown Chips */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#2a2e3f]/60 text-[11px] font-mono">
            {downServices > 0 ? (
              <span className="text-rose-400 font-semibold">{t('dashboard.downCount', { count: downServices })}</span>
            ) : (
              <span className="text-[#9ca3af] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {t('dashboard.statusHealthy')}
              </span>
            )}
            {degradedServices > 0 && (
              <>
                <span className="text-[#3b4252]">•</span>
                <span className="text-amber-400">{t('dashboard.degradedCount', { count: degradedServices })}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Docker Konteynerleri Kartı */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-xs font-medium mb-2">
          <span>{t('dashboard.dockerContainers')}</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">{totalContainers}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {t('dashboard.runningCount', { count: runningContainers })}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#2a2e3f]/60 text-[11px] font-mono">
            <span className="text-[#9ca3af]">
              {stoppedContainers > 0 ? (
                <span className="text-amber-400/90">{t('dashboard.stoppedContainersCount', { count: stoppedContainers })}</span>
              ) : (
                <span className="text-emerald-400/80">100% {t('dashboard.runningCount', { count: totalContainers })}</span>
              )}
            </span>
            <div className="w-16 bg-[#0f1117] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalContainers > 0 ? (runningContainers / totalContainers) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CPU Yükü Kartı */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-xs font-medium mb-2">
          <span>{t('dashboard.cpuUsage')}</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">
              {metrics ? `${cpuPercent}%` : '--'}
            </span>
            <span className="text-[11px] text-[#9ca3af]">
              {cpuPercent > 80 ? 'Yüksek' : 'Normal'}
            </span>
          </div>
          <div className="w-full bg-[#0f1117] h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getLoadColor(cpuPercent)}`} 
              style={{ width: `${Math.min(100, cpuPercent)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 4. RAM & Disk Yükü Kartı */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between hover:border-[#3b4252] transition-colors">
        <div className="flex items-center justify-between text-[#9ca3af] text-xs font-medium mb-2">
          <span>{t('dashboard.ramUsage')} & Disk</span>
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#e5e7eb]">
              {metrics ? `${ramPercent}%` : '--'}
            </span>
            <span className="text-[11px] font-mono text-[#9ca3af]">
              {ramUsedGb}/{ramTotalGb} GB
            </span>
          </div>
          <div className="w-full bg-[#0f1117] h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getLoadColor(ramPercent)}`} 
              style={{ width: `${Math.min(100, ramPercent)}%` }} 
            />
          </div>
          <div className="flex items-center justify-between mt-2.5 text-[10px] text-[#9ca3af] font-mono">
            <span>Disk: %{diskPercent}</span>
            <span>{diskUsedGb} / {diskTotalGb} GB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
