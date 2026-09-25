import React, { useEffect, useState } from 'react';
import { 
  api, 
  type DashboardSummary, 
  type Service, 
  type PushMonitor, 
  type VersionInfo,
  type DockerContainer
} from '../../api/client';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n';

// Modüler Alt Bileşenler (Clean Architecture)
import { SystemPulseHero } from './SystemPulseHero';
import { SystemKpiStrip } from './SystemKpiStrip';
import { AttentionRequiredCard } from './AttentionRequiredCard';
import { ActiveContainersWidget } from './ActiveContainersWidget';

export interface DashboardPageProps {
  onNavigate?: (page: 'services' | 'containers' | 'metrics' | 'uptime' | 'settings') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { t } = useI18n();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [pushMonitors, setPushMonitors] = useState<PushMonitor[]>([]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [sumData, srvData, pmData, verData, cntData] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getServices(),
        api.getPushMonitors(),
        api.getVersion(),
        api.getContainers()
      ]);

      if (sumData.status === 'fulfilled') setSummary(sumData.value);
      if (srvData.status === 'fulfilled') setServices(srvData.value);
      if (pmData.status === 'fulfilled') setPushMonitors(pmData.value);
      if (verData.status === 'fulfilled') setVersionInfo(verData.value);
      if (cntData.status === 'fulfilled') setContainers(cntData.value);

      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // 30 saniyede bir arka planda güncelle (yalnızca sekme aktifken)
    // SWR cache zaten arka planda fetch yapıyor; bu UI'ı yeniler
    const interval = setInterval(() => {
      if (!document.hidden) loadData();
    }, 30000);

    const onVisible = () => {
      if (!document.hidden) loadData();
    };
    const onOnline = () => {
      loadData();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-[#9ca3af]">
        <RefreshCw className="w-7 h-7 animate-spin text-indigo-400 mb-3" />
        <span className="text-xs font-mono tracking-wider">{t('common.loading')}</span>
      </div>
    );
  }

  // İlk yükleme tamamlanmadan (loading=true) hesaplama yapma.
  // containers/services henüz boş array olabilir — false alarm önlenir.
  const downServices = loading ? 0 : (summary?.downServices ?? 0);
  const degradedServices = loading ? 0 : (summary?.degradedServices ?? 0);
  const failedPushMonitors = loading ? [] : pushMonitors.filter(p => p.status === 'down');
  // Sadece 'exited' ve 'dead' state'ler gerçek alarm; paused/restarting/created geçici ve normaldir
  const stoppedContainers = loading ? [] : containers.filter(
    c => ['exited', 'dead'].includes(c.State.toLowerCase())
  );
  const sslWarningCount = loading ? 0 : services.filter(
    s => typeof s.sslExpiryDays === 'number' && s.sslExpiryDays <= 14 && s.sslExpiryDays >= 0
  ).length;

  const totalIssues = downServices + degradedServices + failedPushMonitors.length + sslWarningCount;
  const isOverallHealthy = totalIssues === 0;

  return (
    <div className="space-y-6">
      {/* 1. Canlı Sistem Nabzı & Komuta Şeridi */}
      <SystemPulseHero
        isHealthy={isOverallHealthy}
        issueCount={totalIssues}
        networkRxBytes={summary?.latestMetrics?.networkRxBytes}
        networkTxBytes={summary?.latestMetrics?.networkTxBytes}
        versionInfo={versionInfo}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
        onNavigate={onNavigate}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t('common.error')}: {error}</span>
        </div>
      )}

      {/* 2. Dikkat Gerektirenler — loading tamamlanana kadar render etme */}
      {!loading && (
        <AttentionRequiredCard
          services={services}
          stoppedContainers={stoppedContainers}
          failedPushMonitors={failedPushMonitors}
          onNavigate={onNavigate}
        />
      )}

      {/* 3. Kompakt Telemetri & Kaynak Kullanımı KPI Şeridi */}
      <SystemKpiStrip
        summary={summary}
        metrics={summary?.latestMetrics}
      />

      {/* 4. Kompakt Aktif Konteynerler (Minimalist NOC Görünümü) */}
      <ActiveContainersWidget
        containers={containers}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default DashboardPage;
