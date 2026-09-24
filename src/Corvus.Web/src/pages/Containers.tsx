import React, { useEffect, useState, useMemo } from 'react';
import { api, type DockerContainer, type ContainerStats } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { 
  RotateCw, 
  RefreshCw, 
  Boxes, 
  Terminal, 
  Play, 
  Square, 
  Pause, 
  PlayCircle, 
  Layers, 
  List, 
  Cpu, 
  HardDrive, 
  ArrowUpDown,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ContainerLogsModal } from '../components/ContainerLogsModal';

export const ContainersPage: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, ContainerStats>>({});
  const [loading, setLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [selectedLogsContainer, setSelectedLogsContainer] = useState<{ id: string; name: string } | null>(null);
  
  // Roadmap 2.2: Compose Stack gruplama toggle'ı
  const [viewMode, setViewMode] = useState<'flat' | 'compose'>('flat');
  const [collapsedStacks, setCollapsedStacks] = useState<Record<string, boolean>>({});

  const loadContainers = async () => {
    try {
      const data = await api.getContainers();
      setContainers(data);

      // Roadmap 1.3: Çalışan container'lar için canlı stats sorgula
      const runningContainers = data.filter(c => c.State.toLowerCase() === 'running');
      runningContainers.forEach(async (c) => {
        try {
          const stats = await api.getContainerStats(c.Id);
          if (stats) {
            setStatsMap(prev => ({ ...prev, [c.Id]: stats }));
          }
        } catch {
          // stats alınamazsa sessizce geç
        }
      });
    } catch (err) {
      console.error('Container listesi alınamadı', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Roadmap 3.3: Container Yaşam Döngüsü Eylemleri
  const handleAction = async (action: 'start' | 'stop' | 'pause' | 'unpause' | 'restart', id: string, name: string) => {
    const actionLabels: Record<string, string> = {
      start: 'başlatmak',
      stop: 'durdurmak',
      pause: 'duraklatmak',
      unpause: 'devam ettirmek',
      restart: 'yeniden başlatmak'
    };

    if (action === 'stop' || action === 'restart') {
      if (!confirm(`"${name}" container'ını ${actionLabels[action]} istediğinizden emin misiniz?`)) return;
    }

    setActionInProgressId(id);
    try {
      if (action === 'start') await api.startContainer(id);
      else if (action === 'stop') await api.stopContainer(id);
      else if (action === 'pause') await api.pauseContainer(id);
      else if (action === 'unpause') await api.unpauseContainer(id);
      else if (action === 'restart') await api.restartContainer(id);

      await loadContainers();
    } catch (err: unknown) {
      alert(`Hata: ${err instanceof Error ? err.message : 'İşlem gerçekleştirilemedi.'}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Roadmap 2.2: Compose Stack Gruplaması
  const groupedStacks = useMemo(() => {
    const groups: Record<string, DockerContainer[]> = {};
    for (const c of containers) {
      const projectName = c.Labels?.['com.docker.compose.project'] || 'Bağımsız (Standalone)';
      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(c);
    }
    return groups;
  }, [containers]);

  const toggleStackCollapse = (stackName: string) => {
    setCollapsedStacks(prev => ({
      ...prev,
      [stackName]: !prev[stackName]
    }));
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderStatsBadges = (id: string, isRunning: boolean) => {
    const stats = statsMap[id];
    if (!isRunning || !stats) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono mt-1">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Cpu className="w-3 h-3" />
          %{stats.cpuPercent.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <HardDrive className="w-3 h-3" />
          {formatBytes(stats.memoryUsageBytes)} ({stats.memoryPercent.toFixed(0)}%)
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
          <ArrowUpDown className="w-3 h-3" />
          ↓{formatBytes(stats.networkRxBytes)} ↑{formatBytes(stats.networkTxBytes)}
        </span>
      </div>
    );
  };

  const renderActionButtons = (c: DockerContainer, cleanName: string, isRunning: boolean, isPaused: boolean) => {
    const inProgress = actionInProgressId === c.Id;

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setSelectedLogsContainer({ id: c.Id, name: cleanName })}
          className="p-1.5 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors cursor-pointer"
          title="Canlı Logları İncele"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {!isRunning ? (
          <button
            onClick={() => handleAction('start', c.Id, cleanName)}
            disabled={inProgress}
            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            title="Container'ı Başlat"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={() => handleAction('unpause', c.Id, cleanName)}
                disabled={inProgress}
                className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                title="Container'ı Devam Ettir (Unpause)"
              >
                <PlayCircle className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleAction('pause', c.Id, cleanName)}
                disabled={inProgress}
                className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                title="Container'ı Duraklat (Pause)"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => handleAction('stop', c.Id, cleanName)}
              disabled={inProgress}
              className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              title="Container'ı Durdur"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <button
          onClick={() => handleAction('restart', c.Id, cleanName)}
          disabled={inProgress}
          className="p-1.5 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-50 cursor-pointer"
          title="Yeniden Başlat"
        >
          <RotateCw className={`w-3.5 h-3.5 ${inProgress ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  };

  const renderContainerList = (items: DockerContainer[]) => (
    <div className="space-y-4">
      {/* Mobil Görünüm */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {items.map((c) => {
          const rawName = c.Names?.[0] || c.Id.slice(0, 12);
          const cleanName = rawName.replace(/^\//, '');
          const shortId = c.Id.slice(0, 12);
          const isRunning = c.State.toLowerCase() === 'running';
          const isPaused = c.State.toLowerCase() === 'paused';

          return (
            <div key={c.Id} className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-[#e5e7eb]">{cleanName}</h3>
                  <div className="text-xs font-mono text-[#9ca3af] mt-0.5">{shortId}</div>
                </div>
                <StatusBadge status={isRunning ? 'healthy' : isPaused ? 'degraded' : 'down'} />
              </div>

              {renderStatsBadges(c.Id, isRunning)}

              <div className="text-xs font-mono text-[#9ca3af] break-all bg-[#0f1117] p-2 rounded-lg border border-[#2a2e3f]/60">
                <span className="text-[#9ca3af]/60 block text-[10px] uppercase font-sans">Görüntü (Image)</span>
                {c.Image}
              </div>

              {c.Ports && c.Ports.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.Ports.map((p, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-[#0f1117] border border-[#2a2e3f] text-[11px] font-mono text-[#9ca3af]">
                      {p.PublicPort ? `${p.PublicPort}:` : ''}{p.PrivatePort}/{p.Type || 'tcp'}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#2a2e3f]/60 flex items-center justify-end">
                {renderActionButtons(c, cleanName, isRunning, isPaused)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Masaüstü Tablo Görünümü */}
      <div className="hidden md:block rounded-xl bg-[#1a1d29] border border-[#2a2e3f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f1117]/60 text-xs uppercase font-mono text-[#9ca3af] border-b border-[#2a2e3f]">
              <tr>
                <th className="px-5 py-3">İsim & ID</th>
                <th className="px-5 py-3">Kaynak Kullanımı (Stats)</th>
                <th className="px-5 py-3">Görüntü & Port</th>
                <th className="px-5 py-3">Durum</th>
                <th className="px-5 py-3 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e3f]/60">
              {items.map((c) => {
                const rawName = c.Names?.[0] || c.Id.slice(0, 12);
                const cleanName = rawName.replace(/^\//, '');
                const shortId = c.Id.slice(0, 12);
                const isRunning = c.State.toLowerCase() === 'running';
                const isPaused = c.State.toLowerCase() === 'paused';

                return (
                  <tr key={c.Id} className="hover:bg-[#1e2130]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#e5e7eb]">{cleanName}</div>
                      <div className="text-xs font-mono text-[#9ca3af]">{shortId}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      {renderStatsBadges(c.Id, isRunning) || <span className="text-xs text-[#9ca3af]/50">—</span>}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-[#9ca3af] max-w-xs truncate">
                      <div>{c.Image}</div>
                      {c.Ports && c.Ports.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.Ports.slice(0, 2).map((p, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-[#0f1117] border border-[#2a2e3f]">
                              {p.PublicPort ? `${p.PublicPort}:` : ''}{p.PrivatePort}/{p.Type || 'tcp'}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={isRunning ? 'healthy' : isPaused ? 'degraded' : 'down'} />
                        <span className="text-[11px] text-[#9ca3af]">{c.Status}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end">
                        {renderActionButtons(c, cleanName, isRunning, isPaused)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Başlık ve Görünüm Kontrolleri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">Docker Container'ları</h1>
          <p className="text-sm text-[#9ca3af]">Canlı kaynak istatistikleri, yaşam döngüsü kontrolleri ve Compose gruplama</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Görünüm Seçici (Düz Liste vs Compose Stack) */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#1a1d29] border border-[#2a2e3f]">
            <button
              onClick={() => setViewMode('flat')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'flat' ? 'bg-[#0f1117] text-white shadow-sm' : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('compose')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'compose' ? 'bg-[#0f1117] text-white shadow-sm' : 'text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Compose Stack
            </button>
          </div>

          <button
            onClick={loadContainers}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Yenile
          </button>
        </div>
      </div>

      {loading && containers.length === 0 && (
        <div className="flex items-center justify-center h-64 text-[#9ca3af]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Container'lar ve kaynak kullanımı yükleniyor...
        </div>
      )}

      {!loading && containers.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto space-y-3">
          <Boxes className="w-12 h-12 text-[#9ca3af]/40 mx-auto" />
          <h3 className="text-base font-semibold text-[#e5e7eb]">Container Bulunamadı</h3>
          <p className="text-xs text-[#9ca3af]">Docker daemon üzerinde çalışan veya durdurulmuş container yok.</p>
        </div>
      )}

      {containers.length > 0 && viewMode === 'flat' && (
        renderContainerList(containers)
      )}

      {containers.length > 0 && viewMode === 'compose' && (
        <div className="space-y-4">
          {Object.entries(groupedStacks).map(([stackName, stackContainers]) => {
            const isCollapsed = collapsedStacks[stackName] ?? false;
            const runningCount = stackContainers.filter(c => c.State.toLowerCase() === 'running').length;

            return (
              <div key={stackName} className="rounded-xl border border-[#2a2e3f] bg-[#1a1d29]/60 overflow-hidden">
                <button
                  onClick={() => toggleStackCollapse(stackName)}
                  className="w-full px-5 py-3.5 bg-[#1a1d29] hover:bg-[#1e2130] transition-colors flex items-center justify-between cursor-pointer border-b border-[#2a2e3f]/60"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
                    )}
                    <span className="font-semibold text-sm text-[#e5e7eb] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      {stackName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] font-mono">
                      {runningCount} / {stackContainers.length} aktif
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="p-3">
                    {renderContainerList(stackContainers)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Canlı Log Modalı */}
      {selectedLogsContainer && (
        <ContainerLogsModal
          containerId={selectedLogsContainer.id}
          containerName={selectedLogsContainer.name}
          onClose={() => setSelectedLogsContainer(null)}
        />
      )}
    </div>
  );
};
