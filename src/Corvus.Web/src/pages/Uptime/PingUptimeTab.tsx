import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  ShieldCheck, 
  Server,
  RefreshCw
} from 'lucide-react';
import { api, type Service, type UptimeCheckItem } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useI18n } from '../../i18n';
import { UptimeBar } from './UptimeBar';

interface PingUptimeTabProps {
  services: Service[];
  selectedServiceId: string;
  onSelectService: (id: string) => void;
}

export const PingUptimeTab: React.FC<PingUptimeTabProps> = ({
  services,
  selectedServiceId,
  onSelectService
}) => {
  const { t } = useI18n();
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [checks, setChecks] = useState<UptimeCheckItem[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'down'>('all');

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const loadChecks = async (serviceId: string, currentRange: string) => {
    if (!serviceId) {
      setChecks([]);
      return;
    }
    setLoadingChecks(true);
    try {
      const data = await api.getUptimeChecks(serviceId, currentRange);
      setChecks(data);
    } catch (err) {
      console.error('Uptime kontrolleri yüklenemedi:', err);
    } finally {
      setLoadingChecks(false);
    }
  };

  useEffect(() => {
    if (selectedService?.id) {
      loadChecks(selectedService.id, range);
      const interval = setInterval(() => {
        if (!document.hidden) loadChecks(selectedService.id, range);
      }, 15000);

      const onVisible = () => {
        if (!document.hidden) loadChecks(selectedService.id, range);
      };
      document.addEventListener('visibilitychange', onVisible);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }
  }, [selectedService?.id, range]);

  if (services.length === 0) {
    return (
      <div className="p-10 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto space-y-3">
        <Server className="w-10 h-10 text-[#9ca3af]/40 mx-auto" />
        <h3 className="text-base font-semibold text-[#e5e7eb]">{t('uptime.noServices')}</h3>
        <p className="text-xs text-[#9ca3af] leading-relaxed">
          {t('uptime.noServicesDesc')}
        </p>
      </div>
    );
  }

  // Arama ve statü filtreleme
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'healthy') return s.status === 'healthy';
    if (statusFilter === 'down') return s.status === 'down';
    return true;
  });

  const upChecks = checks.filter((c) => c.status === 'up');
  const uptimePercent = checks.length > 0 ? Math.round((upChecks.length / checks.length) * 100) : 100;
  const avgLatency = upChecks.length > 0 
    ? Math.round(upChecks.reduce((acc, c) => acc + (c.responseTimeMs || 0), 0) / upChecks.length)
    : 0;

  // En yeni kontroller başta olacak şekilde sırala (ters çevirme)
  const recentChecks = [...checks].reverse().slice(0, 20);

  const rangeLabels: Record<string, string> = {
    '24h': t('uptime.range24h'),
    '7d': t('uptime.range7d'),
    '30d': t('uptime.range30d')
  };

  return (
    <div className="space-y-6">
      {/* Servis Seçici ve Filtreler */}
      <div className="bg-[#1a1d29] border border-[#2a2e3f] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Arama Kutusu */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder={t('uptime.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#e5e7eb] placeholder:text-[#9ca3af]/60 focus:outline-none focus:border-[#d4d4d8] transition-colors"
            />
          </div>

          {/* Statü Filtreleri */}
          <div className="flex items-center gap-1 self-start sm:self-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#0f1117] text-[#e5e7eb] border border-[#2a2e3f]'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              {t('common.all')} ({services.length})
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'healthy'
                  ? 'bg-[#0f1117] text-emerald-400 border border-[#2a2e3f]'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Sağlıklı</span>
            </button>
            <button
              onClick={() => setStatusFilter('down')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'down'
                  ? 'bg-[#0f1117] text-rose-400 border border-[#2a2e3f]'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Kesintide</span>
            </button>
          </div>
        </div>

        {/* Servis Kartları / Butonları */}
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pt-1">
          {filteredServices.map((s) => {
            const isSelected = selectedService?.id === s.id;
            const isHealthy = s.status === 'healthy';
            const isDown = s.status === 'down';

            return (
              <button
                key={s.id}
                onClick={() => onSelectService(s.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f1117] border-[#d4d4d8] text-white shadow-sm'
                    : 'bg-[#0f1117]/60 border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb] hover:border-[#3f4458]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isHealthy ? 'bg-emerald-500' : isDown ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="truncate max-w-[140px] sm:max-w-[180px]">{s.name}</span>
                {s.checkType === 'tcp' && (
                  <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    TCP
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedService && (
        <div className="space-y-6">
          {/* Üst Bilgi ve Zaman Aralığı Seçicisi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex items-center justify-center text-[#d4d4d8] font-bold text-sm shrink-0">
                {selectedService.icon ? (
                  <span>{selectedService.icon}</span>
                ) : (
                  <Server className="w-5 h-5 text-[#9ca3af]" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#e5e7eb] flex items-center gap-2">
                  <span>{selectedService.name}</span>
                  {selectedService.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1d29] border border-[#2a2e3f] text-[#9ca3af] font-normal">
                      {selectedService.category}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-[#9ca3af] font-mono">
                  {selectedService.checkType === 'tcp' ? 'TCP Kontrolü' : 'HTTP/S Kontrolü'}
                </span>
              </div>
            </div>

            {/* Zaman Aralığı Seçicisi */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#1a1d29] border border-[#2a2e3f] self-start sm:self-auto">
              {(['24h', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    range === r
                      ? 'bg-[#0f1117] text-white shadow-sm'
                      : 'text-[#9ca3af] hover:text-[#e5e7eb]'
                  }`}
                >
                  {rangeLabels[r]}
                </button>
              ))}
            </div>
          </div>

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
                {t('uptime.uptimeRatio', { range: rangeLabels[range] })}
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

          {/* Görsel SLA Zaman Çizelgesi (UptimeBar) */}
          <div className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#e5e7eb] flex items-center gap-2">
                <span>{t('uptime.historyTimeline')}</span>
                <span className="text-xs text-[#9ca3af] font-normal font-mono">
                  ({rangeLabels[range]})
                </span>
              </h3>
              {loadingChecks && (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              )}
            </div>
            <UptimeBar checks={checks} maxBlocks={45} />
          </div>

          {/* Son Kontroller Listesi (En günceller başta) */}
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
        </div>
      )}
    </div>
  );
};
