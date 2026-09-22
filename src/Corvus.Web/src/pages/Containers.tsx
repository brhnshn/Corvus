import React, { useEffect, useState } from 'react';
import { api, type DockerContainer } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RotateCw, RefreshCw, Boxes } from 'lucide-react';

export const ContainersPage: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const loadContainers = async () => {
    try {
      const data = await api.getContainers();
      setContainers(data);
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

  const handleRestart = async (id: string, name: string) => {
    if (!confirm(`"${name}" container'ını yeniden başlatmak istediğinizden emin misiniz?`)) return;

    setRestartingId(id);
    try {
      await api.restartContainer(id);
      await loadContainers();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setRestartingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">Docker Container'ları</h1>
          <p className="text-sm text-[#9ca3af]">Sunucuda algılanan Docker container'larının canlı durumu</p>
        </div>
        <button
          onClick={loadContainers}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Yenile
        </button>
      </div>

      {loading && containers.length === 0 && (
        <div className="flex items-center justify-center h-64 text-[#9ca3af]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Container'lar yükleniyor...
        </div>
      )}

      {!loading && containers.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto space-y-3">
          <Boxes className="w-12 h-12 text-[#9ca3af]/40 mx-auto" />
          <h3 className="text-base font-semibold text-[#e5e7eb]">Container Bulunamadı</h3>
          <p className="text-xs text-[#9ca3af]">Docker daemon üzerinde çalışan veya durdurulmuş container yok.</p>
        </div>
      )}

      {containers.length > 0 && (
        <div className="rounded-xl bg-[#1a1d29] border border-[#2a2e3f] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0f1117]/60 text-xs uppercase font-mono text-[#9ca3af] border-b border-[#2a2e3f]">
                <tr>
                  <th className="px-5 py-3">İsim & ID</th>
                  <th className="px-5 py-3">Görüntü (Image)</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Portlar</th>
                  <th className="px-5 py-3 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e3f]/60">
                {containers.map((c) => {
                  const rawName = c.Names?.[0] || c.Id.slice(0, 12);
                  const cleanName = rawName.replace(/^\//, '');
                  const shortId = c.Id.slice(0, 12);
                  const isRunning = c.State.toLowerCase() === 'running';

                  return (
                    <tr key={c.Id} className="hover:bg-[#1e2130]/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#e5e7eb]">{cleanName}</div>
                        <div className="text-xs font-mono text-[#9ca3af]">{shortId}</div>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono text-[#9ca3af] max-w-xs truncate">
                        {c.Image}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={isRunning ? 'healthy' : 'down'} />
                          <span className="text-[11px] text-[#9ca3af]">{c.Status}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono text-[#9ca3af]">
                        {c.Ports && c.Ports.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.Ports.map((p, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-[#0f1117] border border-[#2a2e3f]">
                                {p.PublicPort ? `${p.PublicPort}:` : ''}{p.PrivatePort}/{p.Type || 'tcp'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#9ca3af]/50">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleRestart(c.Id, cleanName)}
                          disabled={restartingId === c.Id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-xs font-medium text-[#e5e7eb] hover:bg-[#d4d4d8] hover:text-[#0f1117] transition-colors disabled:opacity-50"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${restartingId === c.Id ? 'animate-spin' : ''}`} />
                          Yeniden Başlat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
