import React from 'react';
import type { UptimeCheckItem } from '../../api/client';

interface UptimeBarProps {
  checks: UptimeCheckItem[];
  maxBlocks?: number;
}

interface BucketData {
  status: 'up' | 'down' | 'degraded' | 'empty';
  count: number;
  upCount: number;
  avgResponseMs: number;
  label: string;
}

export const UptimeBar: React.FC<UptimeBarProps> = ({ checks, maxBlocks = 45 }) => {
  if (checks.length === 0) {
    return (
      <div className="flex gap-1 py-2">
        {Array.from({ length: maxBlocks }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-8 rounded-xs bg-[#2a2e3f]/40 transition-colors"
            title="Veri yok"
          />
        ))}
      </div>
    );
  }

  // Kontrolleri kronolojik olarak bloklara (buckets) böl
  const buckets: BucketData[] = [];
  const chunkSize = Math.max(1, Math.ceil(checks.length / maxBlocks));

  for (let i = 0; i < checks.length; i += chunkSize) {
    const chunk = checks.slice(i, i + chunkSize);
    const upCount = chunk.filter((c) => c.status === 'up').length;
    const totalMs = chunk.reduce((acc, c) => acc + (c.responseTimeMs || 0), 0);
    const avgMs = chunk.length > 0 ? Math.round(totalMs / chunk.length) : 0;

    let status: BucketData['status'] = 'empty';
    if (chunk.length > 0) {
      if (upCount === chunk.length) {
        status = 'up';
      } else if (upCount === 0) {
        status = 'down';
      } else {
        status = 'degraded';
      }
    }

    const firstTime = new Date(chunk[0].checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lastTime = new Date(chunk[chunk.length - 1].checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const label = `${firstTime} - ${lastTime} (${upCount}/${chunk.length} Başarılı, ${avgMs}ms)`;

    buckets.push({
      status,
      count: chunk.length,
      upCount,
      avgResponseMs: avgMs,
      label
    });
  }

  // Eksik blokları baştan tamamla (total maxBlocks olsun)
  while (buckets.length < maxBlocks) {
    buckets.unshift({
      status: 'empty',
      count: 0,
      upCount: 0,
      avgResponseMs: 0,
      label: 'Önceki dönem'
    });
  }

  const firstDate = new Date(checks[0].checkedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const lastDate = new Date(checks[checks.length - 1].checkedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 py-1">
        {buckets.map((b, idx) => {
          let bgClass = 'bg-[#2a2e3f]/40';
          if (b.status === 'up') bgClass = 'bg-emerald-500 hover:bg-emerald-400';
          else if (b.status === 'down') bgClass = 'bg-rose-500 hover:bg-rose-400';
          else if (b.status === 'degraded') bgClass = 'bg-amber-500 hover:bg-amber-400';

          return (
            <div
              key={idx}
              className={`flex-1 h-7 rounded-[2px] transition-all cursor-pointer ${bgClass}`}
              title={b.label}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-mono px-0.5">
        <span>{firstDate}</span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Canlı Takip</span>
        </span>
        <span>{lastDate} (Bugün)</span>
      </div>
    </div>
  );
};
