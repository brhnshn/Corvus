import { useEffect, useState } from 'react';
import { api, type PublicStatusPage } from '../api/client';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Clock, RefreshCw, ExternalLink } from 'lucide-react';

export default function PublicStatus() {
  const [data, setData] = useState<PublicStatusPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      const res = await api.getPublicStatusPage();
      setData(res);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Durum bilgisi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSystemStatusHeader = () => {
    if (!data) return null;
    if (data.systemStatus === 'all_operational') {
      return {
        title: 'Tüm Sistemler Operasyonel',
        desc: 'Tüm izlenen servisler ve altyapı bileşenleri sorunsuz çalışıyor.',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      };
    }
    if (data.systemStatus === 'some_degraded') {
      return {
        title: 'Bazı Servislerde Performans Düşüşü',
        desc: 'Bazı servislerde yanıt sürelerinde gecikme veya aksaklık gözlemleniyor.',
        bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" />
      };
    }
    return {
      title: 'Kritik Sistem Kesintisi Mevcut',
      desc: 'Bir veya birden fazla kritik servis erişilemez durumda.',
      bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: <XCircle className="w-8 h-8 text-rose-400" />
    };
  };

  const statusHeader = getSystemStatusHeader();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4 sm:px-6 selection:bg-indigo-500/30">
      <div className="w-full max-w-4xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <img src="/Corvus.png" alt="Corvus" className="w-10 h-10 object-contain rounded-lg shadow-md" onError={(e) => {
              // fallback if not loaded
              (e.currentTarget as HTMLElement).style.display = 'none';
            }} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Corvus <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium">Canlı Durum</span>
              </h1>
              <p className="text-xs text-slate-400">Genel Altyapı ve Servis Durumu Raporu</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Son güncelleme: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="/"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors font-medium"
            >
              Yönetim Paneli
            </a>
          </div>
        </div>

        {/* Global Operational Status Hero */}
        {statusHeader && (
          <div className={`p-6 rounded-2xl border ${statusHeader.bgColor} backdrop-blur-sm flex items-start gap-4 shadow-lg transition-all`}>
            <div className="p-2 rounded-xl bg-slate-900/50 border border-current/20 shrink-0">
              {statusHeader.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{statusHeader.title}</h2>
              <p className="text-sm mt-1 opacity-90">{statusHeader.desc}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm">Canlı durum verileri alınıyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Services List */}
        {data && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 px-1">
              İzlenen Servisler ({data.services.length})
            </h3>

            {data.services.length === 0 ? (
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-500 text-sm">
                Şu anda halka açık olarak tanımlanmış bir servis bulunmuyor.
              </div>
            ) : (
              <div className="grid gap-3">
                {data.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-slate-300 shrink-0 text-sm">
                        {svc.icon ? (
                          <span className="text-base">{svc.icon}</span>
                        ) : (
                          svc.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white truncate text-sm">{svc.name}</h4>
                          {svc.url && (
                            <a
                              href={svc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{svc.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      {/* SSL Expiry */}
                      {svc.sslExpiryDays !== null && svc.sslExpiryDays !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-1 font-medium ${
                            svc.sslExpiryDays <= 7
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : svc.sslExpiryDays <= 14
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={`SSL sertifikası bitişine ${svc.sslExpiryDays} gün kaldı`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {svc.sslExpiryDays} gün
                        </span>
                      )}

                      {/* Uptime % */}
                      <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                        {svc.uptimePercentage}% Uptime
                      </span>

                      {/* Status indicator */}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
                          svc.status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : svc.status === 'degraded'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            svc.status === 'healthy'
                              ? 'bg-emerald-400 animate-pulse'
                              : svc.status === 'degraded'
                              ? 'bg-amber-400'
                              : 'bg-rose-400 animate-ping'
                          }`}
                        />
                        {svc.status === 'healthy' ? 'Çalışıyor' : svc.status === 'degraded' ? 'Kısmi' : 'Erişilemiyor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-slate-800/60 text-center text-xs text-slate-500">
          <p>
            Bu durum sayfası <span className="text-slate-400 font-semibold">Corvus Monitoring</span> tarafından 30 saniyede bir otomatik güncellenmektedir.
          </p>
        </div>
      </div>
    </div>
  );
}
