import React from 'react';
import { Boxes, ChevronRight } from 'lucide-react';
import type { DockerContainer } from '../../types';
import { useI18n } from '../../i18n';

interface ActiveContainersWidgetProps {
  containers: DockerContainer[];
  onNavigate?: (page: 'containers') => void;
}

export const ActiveContainersWidget: React.FC<ActiveContainersWidgetProps> = ({
  containers,
  onNavigate
}) => {
  const { t } = useI18n();

  // Yalnızca çalışan (running) ve ilk 6 konteyneri göster
  const runningContainers = containers.filter(
    c => c.State.toLowerCase() === 'running'
  );
  const displayContainers = runningContainers.slice(0, 6);

  if (containers.length === 0) {
    return null;
  }

  const getCleanName = (container: DockerContainer) => {
    const raw = container.Names?.[0] || container.Id.slice(0, 12);
    return raw.startsWith('/') ? raw.slice(1) : raw;
  };

  const getShortImage = (image: string) => {
    const withoutTag = image.split(':')[0];
    const parts = withoutTag.split('/');
    return parts[parts.length - 1];
  };

  const getPortSummary = (container: DockerContainer) => {
    if (!container.Ports || container.Ports.length === 0) return null;
    const publicPort = container.Ports.find(p => p.PublicPort)?.PublicPort;
    if (publicPort) return `:${publicPort}`;
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#e5e7eb]">
              {t('dashboard.dockerContainers')}
            </h3>
            <span className="text-[11px] font-mono text-[#9ca3af]">
              {runningContainers.length} / {containers.length} {t('dashboard.runningCount', { count: runningContainers.length })}
            </span>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('containers')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t('common.details')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Kompakt Konteyner Izgarası (Minimal, Kart & Metin Yığını Yok) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayContainers.map((container) => {
          const name = getCleanName(container);
          const image = getShortImage(container.Image);
          const port = getPortSummary(container);

          return (
            <div
              key={container.Id}
              onClick={() => onNavigate?.('containers')}
              className="p-3.5 rounded-xl bg-[#0f1117] border border-[#2a2e3f]/80 hover:border-[#3f4458] transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-[#e5e7eb] group-hover:text-white truncate">
                    {name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#9ca3af] truncate">
                  <span className="truncate">{image}</span>
                  {port && (
                    <span className="text-indigo-400 shrink-0">{port}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
