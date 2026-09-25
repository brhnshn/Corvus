import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { Database } from 'lucide-react';
import { useI18n } from '../../i18n';

interface RamChartDataPoint {
  time: string;
  fullTime: string;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
}

interface RamMetricsChartProps {
  data: RamChartDataPoint[];
  currentRamGb: number;
  totalRamGb: number;
}

export const RamMetricsChart: React.FC<RamMetricsChartProps> = ({ 
  data, 
  currentRamGb, 
  totalRamGb 
}) => {
  const { t } = useI18n();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#e5e7eb]">{t('metrics.ramChartTitle')}</h2>
            <span className="text-[11px] text-[#9ca3af] font-mono">Fiziksel RAM & Bellek Tüketimi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#0f1117] border border-[#2a2e3f] font-mono text-purple-400 font-semibold">
            {t('metrics.lastValue', { value: `${currentRamGb} GB / ${totalRamGb} GB` })}
          </span>
        </div>
      </div>

      <div className="h-60 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ramPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3f" opacity={0.6} />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af" 
              fontSize={11} 
              tickLine={false}
              minTickGap={30} 
            />
            <YAxis 
              domain={[0, totalRamGb > 0 ? totalRamGb : 'auto']} 
              stroke="#9ca3af" 
              fontSize={11} 
              tickLine={false}
              unit=" GB" 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f1117', 
                borderColor: '#2a2e3f', 
                borderRadius: 10, 
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
              labelFormatter={(_, items) => {
                const item = items?.[0]?.payload as RamChartDataPoint | undefined;
                return item?.fullTime || '';
              }}
              itemStyle={{ color: '#c084fc', fontWeight: 600 }}
              formatter={(value: unknown, _: unknown, item: any) => [
                `${value} GB / ${item?.payload?.ramTotalGb ?? totalRamGb} GB (%${item?.payload?.ramPercent ?? ''})`,
                t('metrics.usedRamName')
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="ramUsedGb" 
              name={t('metrics.usedRamName')} 
              stroke="#a855f7" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#ramPurpleGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
