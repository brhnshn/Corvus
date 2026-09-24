import React, { useEffect, useState } from 'react';
import { api, type SystemMetric } from '../api/client';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { RefreshCw, Activity } from 'lucide-react';
import { useI18n } from '../i18n';

export const SystemMetricsPage: React.FC = () => {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await api.getSystemMetrics(range);
      setMetrics(data);
    } catch (err) {
      console.error('Metrikler yüklenemedi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!document.hidden) loadData();
    }, 15000);

    const onVisible = () => {
      if (!document.hidden) loadData();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [range]);

  const ranges = [
    { id: '1h', label: t('metrics.range1h') },
    { id: '6h', label: t('metrics.range6h') },
    { id: '12h', label: t('metrics.range12h') },
    { id: '24h', label: t('metrics.range24h') },
    { id: '7d', label: t('metrics.range7d') }
  ];

  const chartData = metrics.map((m) => {
    const d = new Date(m.recordedAt);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpu: m.cpuPercent,
      ramPercent: Math.round((m.ramUsedMb / m.ramTotalMb) * 100),
      ramUsedGb: +(m.ramUsedMb / 1024).toFixed(2),
      ramTotalGb: +(m.ramTotalMb / 1024).toFixed(2)
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('metrics.title')}</h1>
          <p className="text-sm text-[#9ca3af]">{t('metrics.subtitle')}</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1a1d29] p-1 rounded-xl border border-[#2a2e3f] overflow-x-auto max-w-full">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer ${
                range === r.id
                  ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && metrics.length === 0 && (
        <div className="flex items-center justify-center h-64 text-[#9ca3af]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          {t('common.loading')}
        </div>
      )}

      {/* CPU Chart */}
      <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#d4d4d8]" />
            <h2 className="text-base font-semibold text-[#e5e7eb]">{t('metrics.cpuChartTitle')}</h2>
          </div>
          <span className="text-xs font-mono text-[#9ca3af]">
            {t('metrics.lastValue', { value: metrics.length > 0 ? `${metrics[metrics.length - 1].cpuPercent}%` : '--' })}
          </span>
        </div>

        <div className="h-56 sm:h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3f" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} minTickGap={25} />
              <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f1117', borderColor: '#2a2e3f', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#d4d4d8' }}
              />
              <Area 
                type="monotone" 
                dataKey="cpu" 
                name="CPU" 
                stroke="#d4d4d8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#cpuGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RAM Chart */}
      <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#d4d4d8]" />
            <h2 className="text-base font-semibold text-[#e5e7eb]">{t('metrics.ramChartTitle')}</h2>
          </div>
          <span className="text-xs font-mono text-[#9ca3af]">
            {t('metrics.lastValue', { value: metrics.length > 0 ? `${(metrics[metrics.length - 1].ramUsedMb / 1024).toFixed(1)} GB` : '--' })}
          </span>
        </div>

        <div className="h-56 sm:h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3f" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} minTickGap={25} />
              <YAxis stroke="#9ca3af" fontSize={11} unit="GB" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f1117', borderColor: '#2a2e3f', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#d4d4d8' }}
              />
              <Area 
                type="monotone" 
                dataKey="ramUsedGb" 
                name={t('metrics.usedRamName')} 
                stroke="#d4d4d8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#ramGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
