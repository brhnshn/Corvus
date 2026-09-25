import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Service, UptimeCheckItem } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { useI18n } from '../../i18n';

interface UptimeStatsCardsProps {
  selectedService: Service;
  checks: UptimeCheckItem[];
  rangeLabel: string;
}

export const UptimeStatsCards: React.FC<UptimeStatsCardsProps> = ({
  selectedService,
  checks,
  rangeLabel
}) => {
  const { t } = useI18n();

  const upChecks = checks.filter((c) => c.status === 'up');
  const uptimePercent = checks.length > 0 ? Math.round((upChecks.length / checks.length) * 100) : 100;
  const avgLatency = upChecks.length > 0 
    ? Math.round(upChecks.reduce((acc, c) => acc + (c.responseTimeMs || 0), 0) / upChecks.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
          <span className="text-xs text-[#9ca3af] block">{t('uptime.statusCard')}</span>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={selectedService.status} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
          <span className="text-xs text-[#9ca3af] block">
            {t('uptime.uptimeRatio', { range: rangeLabel })}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-bold font-mono ${
                uptimePercent >= 99
                  ? 'text-emerald-400'
                  : uptimePercent >= 95
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              %{uptimePercent}
            </span>
            <span className="text-[11px] text-[#9ca3af]">
              ({upChecks.length}/{checks.length} başarılı)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
          <span className="text-xs text-[#9ca3af] block">{t('uptime.avgLatency')}</span>
          <div className="text-2xl font-bold font-mono text-[#e5e7eb] mt-1">
            {avgLatency > 0 ? `${avgLatency} ms` : '—'}
          </div>
        </div>
      </div>

      {/* Hedef Bilgisi ve SSL Rozeti */}
      <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs text-[#9ca3af] block mb-0.5">
            {selectedService.checkType === 'tcp' ? t('uptime.targetTcp') : t('uptime.targetUrl')}
          </span>
          <span className="text-sm font-mono text-[#e5e7eb] break-all">
            {selectedService.checkType === 'tcp'
              ? `${selectedService.url || 'localhost'}:${selectedService.port || 80}`
              : selectedService.healthCheckUrl || selectedService.url || t('uptime.noAddress')}
          </span>
        </div>

        {selectedService.sslExpiryDays !== null && selectedService.sslExpiryDays !== undefined && (
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span
              className={`text-xs px-2.5 py-1 rounded-md border font-mono flex items-center gap-1.5 ${
                selectedService.sslExpiryDays <= 7
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : selectedService.sslExpiryDays <= 14
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('uptime.sslExpiresIn', { days: selectedService.sslExpiryDays })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
