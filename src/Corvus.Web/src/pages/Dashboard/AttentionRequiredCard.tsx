import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Boxes, 
  Clock, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Service, DockerContainer, PushMonitor } from '../../api/client';

interface AttentionRequiredCardProps {
  services: Service[];
  stoppedContainers?: DockerContainer[];
  failedPushMonitors?: PushMonitor[];
  onNavigate?: (page: 'services' | 'containers' | 'uptime') => void;
}

export const AttentionRequiredCard: React.FC<AttentionRequiredCardProps> = ({
  services,
  stoppedContainers = [],
  failedPushMonitors = [],
  onNavigate
}) => {
  const { t } = useI18n();

  // 1. Kesintideki veya degraded servisler
  const issueServices = services.filter(s => s.status === 'down' || s.status === 'degraded');

  // 2. SSL süresi 14 günden az kalan servisler
  const sslWarningServices = services.filter(
    s => typeof s.sslExpiryDays === 'number' && s.sslExpiryDays <= 14 && s.sslExpiryDays >= 0
  );

  const hasIssues = issueServices.length > 0 || sslWarningServices.length > 0 || failedPushMonitors.length > 0 || stoppedContainers.length > 0;

  if (!hasIssues) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium text-[#d4d4d8]">{t('dashboard.allGood')}</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-500/80 hidden sm:inline">
          {services.length} {t('dashboard.totalServices')} OK
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-500/30 bg-[#1a1d29]/95 overflow-hidden shadow-lg shadow-rose-950/20">
      {/* Alert Header */}
      <div className="px-4 py-3 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
          <span>{t('dashboard.attentionRequired')}</span>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="text-xs font-medium text-rose-300 hover:text-rose-100 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t('dashboard.viewAllServices')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Issues List */}
      <div className="p-4 space-y-3">
        {/* Kesintideki Servisler */}
        {issueServices.map((service) => (
          <div 
            key={`service-issue-${service.id}`}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] text-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                service.status === 'down' ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
              }`} />
              <div>
                <span className="font-semibold text-[#e5e7eb]">{service.name}</span>
                <span className="text-[#9ca3af] ml-2 text-[11px] font-mono">
                  {service.status === 'down' ? t('dashboard.statusDown') : t('dashboard.statusDegraded')}
                </span>
                {service.url && (
                  <span className="text-[#6b7280] ml-2 text-[10px] hidden sm:inline">({service.url})</span>
                )}
              </div>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded hover:bg-indigo-500/10 cursor-pointer"
              >
                İncele
              </button>
            )}
          </div>
        ))}

        {/* SSL Sertifika Uyarıları */}
        {sslWarningServices.map((service) => (
          <div 
            key={`ssl-issue-${service.id}`}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1117] border border-amber-500/30 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-[#e5e7eb]">{service.name}</span>
                <span className="text-amber-400 ml-2 text-[11px] font-mono">
                  {t('dashboard.sslWarning', { days: service.sslExpiryDays ?? 0 })}
                </span>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded hover:bg-amber-500/10 cursor-pointer"
              >
                Yenile
              </button>
            )}
          </div>
        ))}

        {/* Durdurulmuş Konteynerler */}
        {stoppedContainers.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1117] border border-amber-500/30 text-xs">
            <div className="flex items-center gap-2.5">
              <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-[#e5e7eb]">Docker</span>
                <span className="text-amber-400 ml-2 text-[11px] font-mono">
                  {stoppedContainers.length} durdurulmuş konteyner bulunuyor
                </span>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('containers')}
                className="text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded hover:bg-indigo-500/10 cursor-pointer"
              >
                {t('dashboard.viewContainers')}
              </button>
            )}
          </div>
        )}

        {/* Başarısız Push Monitörleri (Cronlar) */}
        {failedPushMonitors.map((pm) => (
          <div 
            key={`snitch-issue-${pm.id}`}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1117] border border-rose-500/30 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold text-[#e5e7eb]">{pm.name}</span>
                <span className="text-rose-400 ml-2 text-[11px] font-mono">
                  Cron sinyali gecikti (Dead Man's Snitch)
                </span>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('uptime')}
                className="text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-500/10 cursor-pointer"
              >
                Uptime
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
