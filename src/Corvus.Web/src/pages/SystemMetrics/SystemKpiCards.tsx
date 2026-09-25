import React from 'react';
import { Cpu, HardDrive, Database } from 'lucide-react';
import type { SystemMetric } from '../../api/client';
import { useI18n } from '../../i18n';

interface SystemKpiCardsProps {
  metrics: SystemMetric[];
  latestMetric?: SystemMetric | null;
}

export const SystemKpiCards: React.FC<SystemKpiCardsProps> = ({ metrics, latestMetric }) => {
  const { t } = useI18n();

  const current = latestMetric || (metrics.length > 0 ? metrics[metrics.length - 1] : null);

  if (!current) return null;

  // CPU istatistikleri
  const cpuValues = metrics.map((m) => m.cpuPercent);
  const minCpu = cpuValues.length > 0 ? Math.min(...cpuValues) : current.cpuPercent;
  const maxCpu = cpuValues.length > 0 ? Math.max(...cpuValues) : current.cpuPercent;
  const avgCpu = cpuValues.length > 0 
    ? Math.round(cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) 
    : current.cpuPercent;

  // RAM istatistikleri
  const ramUsedGb = +(current.ramUsedMb / 1024).toFixed(1);
  const ramTotalGb = +(current.ramTotalMb / 1024).toFixed(1);
  const ramPercent = current.ramTotalMb > 0 
    ? Math.round((current.ramUsedMb / current.ramTotalMb) * 100) 
    : 0;
  const ramFreeGb = +(ramTotalGb - ramUsedGb).toFixed(1);

  // Disk istatistikleri
  const diskPercent = current.diskTotalGb > 0 
    ? Math.round((current.diskUsedGb / current.diskTotalGb) * 100) 
    : 0;
  const diskFreeGb = Math.max(0, current.diskTotalGb - current.diskUsedGb);

  const getStatusBadge = (percent: number) => {
    if (percent >= 90) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
          {t('metrics.critical')}
        </span>
      );
    }
    if (percent >= 75) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
          {t('metrics.warning')}
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
        {t('metrics.optimal')}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CPU Kartı */}
      <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between space-y-4 hover:border-[#3f4458] transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#9ca3af] block">{t('metrics.cpuUsage')}</span>
              <span className="text-2xl font-bold font-mono text-[#e5e7eb]">
                %{current.cpuPercent}
              </span>
            </div>
          </div>
          {getStatusBadge(current.cpuPercent)}
        </div>

        {/* Min / Max / Ort */}
        <div className="space-y-2 pt-2 border-t border-[#2a2e3f]/60">
          <div className="w-full bg-[#0f1117] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                current.cpuPercent >= 90 ? 'bg-rose-500' : current.cpuPercent >= 75 ? 'bg-amber-500' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, current.cpuPercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-mono">
            <span>{t('metrics.minUsage', { value: minCpu })}</span>
            <span>{t('metrics.avgUsage', { value: avgCpu })}</span>
            <span>{t('metrics.maxUsage', { value: maxCpu })}</span>
          </div>
        </div>
      </div>

      {/* RAM Kartı */}
      <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between space-y-4 hover:border-[#3f4458] transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#9ca3af] block">{t('metrics.ramUsage')}</span>
              <span className="text-2xl font-bold font-mono text-[#e5e7eb]">
                %{ramPercent}
              </span>
            </div>
          </div>
          {getStatusBadge(ramPercent)}
        </div>

        {/* Doluluk ve GB */}
        <div className="space-y-2 pt-2 border-t border-[#2a2e3f]/60">
          <div className="w-full bg-[#0f1117] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                ramPercent >= 90 ? 'bg-rose-500' : ramPercent >= 75 ? 'bg-amber-500' : 'bg-purple-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, ramPercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-mono">
            <span>{ramUsedGb} GB kullanılan</span>
            <span>{ramFreeGb} GB boş ({ramTotalGb} GB)</span>
          </div>
        </div>
      </div>

      {/* Disk Kartı */}
      <div className="p-5 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between space-y-4 hover:border-[#3f4458] transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#9ca3af] block">{t('metrics.diskUsage')}</span>
              <span className="text-2xl font-bold font-mono text-[#e5e7eb]">
                %{diskPercent}
              </span>
            </div>
          </div>
          {getStatusBadge(diskPercent)}
        </div>

        {/* Disk Doluluk Çubuğu */}
        <div className="space-y-2 pt-2 border-t border-[#2a2e3f]/60">
          <div className="w-full bg-[#0f1117] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                diskPercent >= 90 ? 'bg-rose-500' : diskPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, diskPercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-mono">
            <span>{current.diskUsedGb} GB kullanılan</span>
            <span>{diskFreeGb} GB boş ({current.diskTotalGb} GB)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
