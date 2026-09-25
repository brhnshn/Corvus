import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { UptimeCheckItem } from '../../types';
import { useI18n } from '../../i18n';

interface UptimeRecentChecksProps {
  recentChecks: UptimeCheckItem[];
  loadingChecks: boolean;
}

export const UptimeRecentChecks: React.FC<UptimeRecentChecksProps> = ({
  recentChecks,
  loadingChecks
}) => {
  const { t } = useI18n();

  return (
    <div className="rounded-xl bg-[#1a1d29] border border-[#2a2e3f] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#2a2e3f] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e5e7eb]">{t('uptime.recentChecks')}</h3>
        <span className="text-xs text-[#9ca3af] font-mono">
          {t('uptime.checksCount', { count: recentChecks.length })}
        </span>
      </div>

      {recentChecks.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#9ca3af]">
          {loadingChecks ? t('common.loading') : t('uptime.noChecksYet')}
        </div>
      ) : (
        <div className="divide-y divide-[#2a2e3f]">
          {recentChecks.map((check) => {
            const checkDate = new Date(check.checkedAt);
            const isUp = check.status === 'up';

            return (
              <div
                key={check.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-[#1e2130]/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isUp ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-[#e5e7eb] font-mono font-medium">
                    {checkDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[#9ca3af] font-mono">
                    {checkDate.toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {check.responseTimeMs !== undefined && (
                    <span
                      className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                        check.responseTimeMs > 500
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-[#0f1117] text-[#9ca3af] border border-[#2a2e3f]'
                      }`}
                    >
                      {check.responseTimeMs} ms
                    </span>
                  )}
                  {check.errorMessage && (
                    <span
                      className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] truncate max-w-[200px] sm:max-w-xs cursor-help"
                      title={check.errorMessage}
                    >
                      {check.errorMessage}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
