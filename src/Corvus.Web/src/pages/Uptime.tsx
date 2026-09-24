import React, { useEffect, useState } from 'react';
import { api, type Service, type PushMonitor } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { 
  CheckCircle, 
  XCircle, 
  Activity, 
  Radio, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  X,
  RefreshCw
} from 'lucide-react';
import { useI18n } from '../i18n';

interface UptimeItem {
  id: number;
  serviceId: string;
  checkedAt: string;
  status: string;
  responseTimeMs?: number;
  errorMessage?: string;
}

export const UptimePage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'uptime' | 'snitch'>('uptime');

  // Uptime state
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [checks, setChecks] = useState<UptimeItem[]>([]);

  // Dead Man's Snitch state
  const [snitches, setSnitches] = useState<PushMonitor[]>([]);
  const [loadingSnitches, setLoadingSnitches] = useState(false);
  const [showAddSnitchModal, setShowAddSnitchModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Snitch form
  const [snitchName, setSnitchName] = useState('');
  const [snitchInterval, setSnitchInterval] = useState(1440);
  const [snitchGrace, setSnitchGrace] = useState(60);
  const [savingSnitch, setSavingSnitch] = useState(false);

  const fetchServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
      if (data.length > 0) {
        setSelectedServiceId((prev) => {
          const exists = data.some((s) => s.id === prev);
          return exists ? prev : data[0].id;
        });
      } else {
        setSelectedServiceId('');
      }
    } catch (err) {
      console.error('Servisler yüklenemedi:', err);
    }
  };

  const fetchSnitches = async () => {
    setLoadingSnitches(true);
    try {
      const data = await api.getPushMonitors();
      setSnitches(data);
    } catch (err) {
      console.error('Push monitörleri yüklenemedi:', err);
    } finally {
      setLoadingSnitches(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchSnitches();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchServices();
        fetchSnitches();
      }
    }, 15000);

    const onVisible = () => {
      if (!document.hidden) {
        fetchServices();
        fetchSnitches();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const loadChecks = async (serviceId: string) => {
    if (!serviceId) {
      setChecks([]);
      return;
    }
    try {
      const res = await fetch(`/api/uptime?service_id=${serviceId}&range=7d`);
      if (res.ok) {
        const data = await res.json();
        setChecks(data);
      }
    } catch (err) {
      console.error('Uptime kontrolleri yüklenemedi', err);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      loadChecks(selectedServiceId);
      const interval = setInterval(() => {
        if (!document.hidden) loadChecks(selectedServiceId);
      }, 15000);

      const onVisible = () => {
        if (!document.hidden) loadChecks(selectedServiceId);
      };
      document.addEventListener('visibilitychange', onVisible);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }
  }, [selectedServiceId]);

  const handleCreateSnitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snitchName.trim()) return;

    setSavingSnitch(true);
    try {
      await api.createPushMonitor({
        name: snitchName.trim(),
        expectedIntervalMinutes: snitchInterval,
        gracePeriodMinutes: snitchGrace
      });
      setShowAddSnitchModal(false);
      setSnitchName('');
      setSnitchInterval(1440);
      setSnitchGrace(60);
      await fetchSnitches();
    } catch (err: unknown) {
      alert(`Hata: ${err instanceof Error ? err.message : 'Snitch oluşturulamadı.'}`);
    } finally {
      setSavingSnitch(false);
    }
  };

  const handleDeleteSnitch = async (id: string, name: string) => {
    if (!confirm(t('uptime.deletePushConfirm', { name }))) return;
    try {
      await api.deletePushMonitor(id);
      await fetchSnitches();
    } catch (err: unknown) {
      alert(`Hata: ${err instanceof Error ? err.message : 'Silinemedi.'}`);
    }
  };

  const handleCopyCurl = (token: string) => {
    const origin = window.location.origin;
    const cmd = `curl -fsS -m 10 --retry 3 ${origin}/api/push/${token}`;
    navigator.clipboard.writeText(cmd);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const upChecks = checks.filter((c) => c.status === 'up');
  const uptimePercent = checks.length > 0 ? Math.round((upChecks.length / checks.length) * 100) : 100;
  const avgLatency = upChecks.length > 0 
    ? Math.round(upChecks.reduce((acc, c) => acc + (c.responseTimeMs || 0), 0) / upChecks.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('uptime.title')}</h1>
          <p className="text-sm text-[#9ca3af]">{t('uptime.subtitle')}</p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#1a1d29] border border-[#2a2e3f] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('uptime')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'uptime' ? 'bg-[#0f1117] text-white shadow-sm' : 'text-[#9ca3af] hover:text-[#e5e7eb]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t('uptime.tabPing')}
          </button>
          <button
            onClick={() => setActiveTab('snitch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'snitch' ? 'bg-[#0f1117] text-white shadow-sm' : 'text-[#9ca3af] hover:text-[#e5e7eb]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {t('uptime.tabPush')}
          </button>
        </div>
      </div>

      {/* Tab 1: HTTP & TCP Ping Uptime */}
      {activeTab === 'uptime' && (
        <div className="space-y-6">
          {services.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto mt-12">
              <p className="text-sm text-[#e5e7eb] font-semibold mb-1">{t('uptime.noServices')}</p>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                {t('uptime.noServicesDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* Service Selector Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 border transition-colors flex items-center gap-2 cursor-pointer ${
                      selectedServiceId === s.id
                        ? 'bg-[#1a1d29] border-[#d4d4d8] text-[#e5e7eb]'
                        : 'bg-[#1a1d29]/40 border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${s.status === 'healthy' ? 'bg-[#22c55e]' : s.status === 'down' ? 'bg-[#ef4444]' : 'bg-[#6b7280]'}`} />
                    <span>{s.name}</span>
                    {s.checkType === 'tcp' && (
                      <span className="text-[10px] text-indigo-400 font-mono">TCP</span>
                    )}
                  </button>
                ))}
              </div>

              {selectedService && (
                <div className="space-y-6">
                  {/* Stats Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
                      <span className="text-xs text-[#9ca3af]">{t('uptime.statusCard')}</span>
                      <div className="mt-1">
                        <StatusBadge status={selectedService.status} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
                      <span className="text-xs text-[#9ca3af]">{t('uptime.uptime7d')}</span>
                      <div className="text-xl font-bold text-[#e5e7eb] mt-1">
                        %{uptimePercent}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
                      <span className="text-xs text-[#9ca3af]">{t('uptime.avgLatency')}</span>
                      <div className="text-xl font-bold text-[#e5e7eb] mt-1">
                        {avgLatency > 0 ? `${avgLatency} ms` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Endpoint Information */}
                  <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-[#9ca3af] block">
                        {selectedService.checkType === 'tcp' ? t('uptime.targetTcp') : t('uptime.targetUrl')}
                      </span>
                      <span className="text-sm font-mono text-[#e5e7eb] break-all">
                        {selectedService.checkType === 'tcp'
                          ? `${selectedService.url || 'localhost'}:${selectedService.port || 80}`
                          : selectedService.healthCheckUrl || selectedService.url || t('uptime.noAddress')}
                      </span>
                    </div>

                    {selectedService.sslExpiryDays !== null && selectedService.sslExpiryDays !== undefined && (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                        {t('uptime.sslExpiresIn', { days: selectedService.sslExpiryDays })}
                      </span>
                    )}
                  </div>

                  {/* Checks History */}
                  <div className="rounded-xl bg-[#1a1d29] border border-[#2a2e3f] overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-[#2a2e3f]">
                      <h3 className="text-sm font-semibold text-[#e5e7eb]">{t('uptime.recentChecks')}</h3>
                    </div>

                    {checks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#9ca3af]">
                        {t('uptime.noChecksYet')}
                      </div>
                    ) : (
                      <div className="divide-y divide-[#2a2e3f]">
                        {checks.slice(0, 15).map((check) => (
                          <div key={check.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              {check.status === 'up' ? (
                                <CheckCircle className="w-4 h-4 text-[#22c55e] shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                              )}
                              <span className="text-[#e5e7eb] font-mono">
                                {new Date(check.checkedAt).toLocaleTimeString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              {check.responseTimeMs !== undefined && (
                                <span className="text-[#9ca3af] font-mono shrink-0">
                                  {check.responseTimeMs} ms
                                </span>
                              )}
                              {check.errorMessage && (
                                <span className="text-[#ef4444] truncate max-w-[200px] sm:max-w-xs" title={check.errorMessage}>
                                  {check.errorMessage}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Dead Man's Snitch (Roadmap 1.5) */}
      {activeTab === 'snitch' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#e5e7eb]">{t('uptime.pushSectionTitle')}</h2>
              <p className="text-xs text-[#9ca3af]">
                {t('uptime.pushSectionDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowAddSnitchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold hover:bg-[#e4e4e7] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('uptime.addPushMonitor')}
            </button>
          </div>

          {loadingSnitches && snitches.length === 0 && (
            <div className="flex items-center justify-center h-48 text-[#9ca3af]">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              {t('common.loading')}
            </div>
          )}

          {!loadingSnitches && snitches.length === 0 && (
            <div className="p-10 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto space-y-3">
              <Radio className="w-10 h-10 text-[#9ca3af]/40 mx-auto" />
              <h3 className="text-base font-semibold text-[#e5e7eb]">{t('uptime.noPushMonitors')}</h3>
              <p className="text-xs text-[#9ca3af]">
                {t('uptime.noPushMonitorsDesc')}
              </p>
              <button
                onClick={() => setShowAddSnitchModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold hover:bg-[#e4e4e7] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('uptime.createPushMonitor')}
              </button>
            </div>
          )}

          {snitches.length > 0 && (
            <div className="grid gap-4">
              {snitches.map((snitch) => {
                const isHealthy = snitch.status === 'healthy';
                const isDown = snitch.status === 'down';

                return (
                  <div
                    key={snitch.id}
                    className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] hover:border-[#3f4458] transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-indigo-400" />
                          <h3 className="font-semibold text-[#e5e7eb] text-sm">{snitch.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isHealthy
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isDown
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isHealthy ? t('uptime.signalReceiving') : isDown ? t('uptime.signalTimeout') : t('uptime.signalWaiting')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#9ca3af] mt-1 font-mono">
                          <span>{t('uptime.expectedPeriodLabel', { interval: snitch.expectedIntervalMinutes, grace: snitch.gracePeriodMinutes })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteSnitch(snitch.id, snitch.name)}
                          className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#0f1117] transition-colors cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Son Görülme & Sinyal Komutu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#2a2e3f]/60 text-xs">
                      <div className="flex items-center gap-2 text-[#9ca3af]">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{t('uptime.lastSignal')} </span>
                        <span className="text-[#e5e7eb] font-mono">
                          {snitch.lastSeenAt ? new Date(snitch.lastSeenAt).toLocaleString() : t('uptime.noSignalYet')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-1.5">
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                          curl .../api/push/{snitch.token}
                        </span>
                        <button
                          onClick={() => handleCopyCurl(snitch.token)}
                          className="p-1 text-[#9ca3af] hover:text-[#e5e7eb] transition-colors cursor-pointer"
                          title={t('uptime.copyCurlTooltip')}
                        >
                          {copiedToken === snitch.token ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Snitch Modal */}
          {showAddSnitchModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
              <div className="bg-[#1a1d29] border border-[#2a2e3f] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl my-auto">
                <div className="flex items-center justify-between border-b border-[#2a2e3f] pb-3">
                  <h3 className="font-semibold text-[#e5e7eb] text-base">{t('uptime.newPushModalTitle')}</h3>
                  <button
                    onClick={() => setShowAddSnitchModal(false)}
                    className="text-[#9ca3af] hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateSnitch} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('uptime.monitorName')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('uptime.monitorNamePlaceholder')}
                      value={snitchName}
                      onChange={(e) => setSnitchName(e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('uptime.expectedInterval')}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="1440"
                      value={snitchInterval}
                      onChange={(e) => setSnitchInterval(Number(e.target.value))}
                      className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                    />
                    <span className="text-[10px] text-[#9ca3af] block mt-1">{t('uptime.intervalHelp')}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('uptime.gracePeriod')}</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="60"
                      value={snitchGrace}
                      onChange={(e) => setSnitchGrace(Number(e.target.value))}
                      className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                    />
                    <span className="text-[10px] text-[#9ca3af] block mt-1">{t('uptime.graceHelp')}</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#2a2e3f]">
                    <button
                      type="button"
                      onClick={() => setShowAddSnitchModal(false)}
                      className="px-4 py-2 rounded-lg border border-[#2a2e3f] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] cursor-pointer"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={savingSnitch}
                      className="px-4 py-2 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold hover:bg-[#e4e4e7] disabled:opacity-50 cursor-pointer"
                    >
                      {savingSnitch ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
