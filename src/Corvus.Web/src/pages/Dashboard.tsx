import React, { useEffect, useState } from 'react';
import { api, type DashboardSummary } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Cpu, 
  HardDrive, 
  Layers, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10 sn polling
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9ca3af]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Yükleniyor...
      </div>
    );
  }

  const metrics = summary?.latestMetrics;
  const ramPercent = metrics ? Math.round((metrics.ramUsedMb / metrics.ramTotalMb) * 100) : 0;
  const diskPercent = metrics ? Math.round((metrics.diskUsedGb / metrics.diskTotalGb) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">Genel Bakış</h1>
          <p className="text-sm text-[#9ca3af]">Sunucu kaynakları, servisler ve container durumu</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Yenile
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Hata: {error}</span>
        </div>
      )}

      {/* Critical Alert Banner if any down services */}
      {summary && summary.downServices > 0 && (
        <div className="p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
            <div>
              <div className="text-sm font-semibold text-[#ef4444]">
                {summary.downServices} servis şu anda çalışmıyor!
              </div>
              <div className="text-xs text-[#9ca3af]">
                Container veya endpoint yanıt vermiyor, Servisler sekmesini inceleyin.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9ca3af] text-sm mb-2">
            <span>Toplam Servis</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#e5e7eb]">{summary?.totalServices ?? 0}</span>
            <span className="text-xs text-[#22c55e]">{summary?.healthyServices ?? 0} aktif</span>
          </div>
        </div>

        {/* Total Containers */}
        <div className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9ca3af] text-sm mb-2">
            <span>Docker Container</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#e5e7eb]">{summary?.totalContainers ?? 0}</span>
            <span className="text-xs text-[#22c55e]">{summary?.runningContainers ?? 0} çalışıyor</span>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9ca3af] text-sm mb-2">
            <span>CPU Kullanımı</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#e5e7eb]">
              {metrics ? `${metrics.cpuPercent}%` : '--'}
            </span>
          </div>
          <div className="w-full bg-[#0f1117] h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#d4d4d8] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, metrics?.cpuPercent ?? 0)}%` }} 
            />
          </div>
        </div>

        {/* RAM Usage */}
        <div className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9ca3af] text-sm mb-2">
            <span>RAM Kullanımı</span>
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#e5e7eb]">
              {metrics ? `${ramPercent}%` : '--'}
            </span>
            <span className="text-xs text-[#9ca3af] font-mono">
              {metrics ? `${(metrics.ramUsedMb / 1024).toFixed(1)} / ${(metrics.ramTotalMb / 1024).toFixed(1)} GB` : ''}
            </span>
          </div>
          <div className="w-full bg-[#0f1117] h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#d4d4d8] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, ramPercent)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Secondary Row: Storage & Backup Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Card */}
        <div className="p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#e5e7eb]">Depolama (Disk)</h2>
            <HardDrive className="w-4 h-4 text-[#9ca3af]" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold font-mono text-[#e5e7eb]">
                {metrics ? `${metrics.diskUsedGb} GB` : '--'}
              </span>
              <span className="text-sm font-mono text-[#9ca3af]">
                Toplam: {metrics ? `${metrics.diskTotalGb} GB` : '--'}
              </span>
            </div>
            <div className="w-full bg-[#0f1117] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#d4d4d8] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, diskPercent)}%` }} 
              />
            </div>
            <div className="text-xs text-[#9ca3af] flex justify-between">
              <span>Kullanılan: %{diskPercent}</span>
              <span>Boş: {metrics ? metrics.diskTotalGb - metrics.diskUsedGb : 0} GB</span>
            </div>
          </div>
        </div>

        {/* Backup Status Card */}
        <div className="p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#e5e7eb]">Son Yedekleme (Backup)</h2>
            <Database className="w-4 h-4 text-[#9ca3af]" />
          </div>
          {summary?.lastBackup ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-[#e5e7eb]">{summary.lastBackup.token}</span>
                <StatusBadge status={summary.lastBackup.status === 'success' ? 'healthy' : 'down'} />
              </div>
              <div className="text-xs text-[#9ca3af] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(summary.lastBackup.receivedAt).toLocaleString()}</span>
              </div>
              {summary.lastBackup.message && (
                <div className="p-2.5 rounded-lg bg-[#0f1117] text-xs font-mono text-[#9ca3af]">
                  {summary.lastBackup.message}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[#9ca3af]">
              <CheckCircle2 className="w-8 h-8 text-[#9ca3af]/40 mb-2" />
              <p className="text-xs">Henüz bir backup push bildirimi alınmadı.</p>
              <p className="text-[11px] text-[#9ca3af]/60 mt-1 font-mono">POST /api/push/{'{token}'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
