import React, { useState } from 'react';
import { Radio, Plus, Trash2, Copy, Check, Clock, RefreshCw } from 'lucide-react';
import { api, type PushMonitor } from '../../api/client';
import { useI18n } from '../../i18n';
import { AddSnitchModal } from './AddSnitchModal';

interface PushMonitorsTabProps {
  snitches: PushMonitor[];
  loading: boolean;
  onRefresh: () => void;
}

export const PushMonitorsTab: React.FC<PushMonitorsTabProps> = ({
  snitches,
  loading,
  onRefresh
}) => {
  const { t } = useI18n();
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleDeleteSnitch = async (id: string, name: string) => {
    if (!confirm(t('uptime.deletePushConfirm', { name }))) return;
    try {
      await api.deletePushMonitor(id);
      onRefresh();
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

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#e5e7eb]">{t('uptime.pushSectionTitle')}</h2>
          <p className="text-xs text-[#9ca3af]">{t('uptime.pushSectionDesc')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold hover:bg-[#e4e4e7] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t('uptime.addPushMonitor')}
        </button>
      </div>

      {loading && snitches.length === 0 && (
        <div className="flex items-center justify-center h-48 text-[#9ca3af]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
          {t('common.loading')}
        </div>
      )}

      {!loading && snitches.length === 0 && (
        <div className="p-10 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto space-y-3">
          <Radio className="w-10 h-10 text-[#9ca3af]/40 mx-auto" />
          <h3 className="text-base font-semibold text-[#e5e7eb]">{t('uptime.noPushMonitors')}</h3>
          <p className="text-xs text-[#9ca3af]">{t('uptime.noPushMonitorsDesc')}</p>
          <button
            onClick={() => setShowAddModal(true)}
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
                      <Radio className="w-4 h-4 text-indigo-400 shrink-0" />
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
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{t('uptime.lastSignal')}</span>
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

      <AddSnitchModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
