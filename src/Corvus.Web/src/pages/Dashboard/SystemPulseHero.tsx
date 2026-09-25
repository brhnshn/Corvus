import React from 'react';
import { 
  Radio, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Boxes,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { VersionInfo } from '../../api/client';
import { formatBytes } from '../../utils/format';

interface SystemPulseHeroProps {
  isHealthy: boolean;
  issueCount: number;
  networkRxBytes?: number;
  networkTxBytes?: number;
  versionInfo?: VersionInfo | null;
  onRefresh: () => void;
  refreshing: boolean;
  onNavigate?: (page: 'services' | 'containers' | 'uptime' | 'settings') => void;
}

export const SystemPulseHero: React.FC<SystemPulseHeroProps> = ({
  isHealthy,
  issueCount,
  networkRxBytes = 0,
  networkTxBytes = 0,
  versionInfo,
  onRefresh,
  refreshing,
  onNavigate
}) => {
  const { t } = useI18n();

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
      isHealthy 
        ? 'bg-gradient-to-r from-[#1a1d29] via-[#1a1d29] to-emerald-950/20 border-[#2a2e3f] shadow-lg shadow-emerald-950/10'
        : 'bg-gradient-to-r from-[#1a1d29] via-[#1a1d29] to-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/10'
    }`}>
      {/* Background subtle glow effect */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
        isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
      }`} />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Sol: Durum Nabzı ve Başlık */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Pill with Pulsing Dot */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
              <span>{isHealthy ? t('dashboard.systemOperational') : t('dashboard.systemAttention')}</span>
            </div>

            {/* Version & Update Pill */}
            {versionInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1117] border border-[#2a2e3f] text-[11px] font-mono text-[#9ca3af]">
                <Radio className="w-3 h-3 text-indigo-400" />
                <span>v{versionInfo.currentVersion}</span>
                {versionInfo.isUpdateAvailable && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={t('nav.updateAvailable')} />
                )}
              </span>
            )}

            {/* Network I/O Telemetry Badge */}
            {(networkRxBytes > 0 || networkTxBytes > 0) && (
              <div className="hidden sm:inline-flex items-center gap-3 px-3 py-1 rounded-full bg-[#0f1117] border border-[#2a2e3f] text-[11px] font-mono text-[#9ca3af]">
                <span className="flex items-center gap-1 text-emerald-400/90" title="Incoming">
                  <ArrowDownRight className="w-3 h-3" />
                  {formatBytes(networkRxBytes)}
                </span>
                <span className="text-[#3b4252]">|</span>
                <span className="flex items-center gap-1 text-cyan-400/90" title="Outgoing">
                  <ArrowUpRight className="w-3 h-3" />
                  {formatBytes(networkTxBytes)}
                </span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#e5e7eb]">
              {t('dashboard.title')}
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-0.5">
              {isHealthy 
                ? t('dashboard.allGood') 
                : t('dashboard.systemAttentionSubtitle', { count: issueCount })}
            </p>
          </div>
        </div>

        {/* Sağ: Hızlı Komuta & Aksiyon Butonları */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-xs font-medium text-indigo-300 hover:bg-indigo-600/25 hover:text-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('dashboard.addService')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('containers')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1117] border border-[#2a2e3f] text-xs font-medium text-[#d4d4d8] hover:text-[#e5e7eb] hover:bg-[#1a1d29] transition-colors cursor-pointer"
              >
                <Boxes className="w-3.5 h-3.5 text-[#9ca3af]" />
                <span>{t('dashboard.viewContainers')}</span>
              </button>
            </>
          )}

          <a
            href="/status"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1117] border border-[#2a2e3f] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a1d29] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{t('dashboard.viewStatusPage')}</span>
          </a>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1117] border border-[#2a2e3f] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a1d29] transition-colors disabled:opacity-50 cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
