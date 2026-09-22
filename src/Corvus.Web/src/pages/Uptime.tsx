import React, { useEffect, useState } from 'react';
import { api, type Service } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle, XCircle } from 'lucide-react';

interface UptimeItem {
  id: number;
  serviceId: string;
  checkedAt: string;
  status: string;
  responseTimeMs?: number;
  errorMessage?: string;
}

export const UptimePage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [checks, setChecks] = useState<UptimeItem[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.getServices();
        setServices(data);
        if (data.length > 0) {
          setSelectedServiceId((prev) => {
            const exists = data.some((s) => s.id === prev);
            return exists ? prev : data[0].id;
          });
        } else {
          setSelectedServiceId('');
        }
      } catch (err) {
        console.error('Servisler yüklenemedi:', err);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadChecks = async (serviceId: string) => {
    if (!serviceId) {
      setChecks([]);
      return;
    }
    try {
      const res = await fetch(`/api/uptime?service_id=${serviceId}&range=7d`);
      if (res.ok) {
        const data = await res.json();
        setChecks(data);
      }
    } catch (err) {
      console.error('Uptime kontrolleri yüklenemedi', err);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      loadChecks(selectedServiceId);
      const interval = setInterval(() => loadChecks(selectedServiceId), 15000);
      return () => clearInterval(interval);
    }
  }, [selectedServiceId]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const upChecks = checks.filter((c) => c.status === 'up');
  const uptimePercent = checks.length > 0 ? Math.round((upChecks.length / checks.length) * 100) : 100;
  const avgLatency = upChecks.length > 0 
    ? Math.round(upChecks.reduce((acc, c) => acc + (c.responseTimeMs || 0), 0) / upChecks.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e5e7eb]">Uptime & Sağlık Takibi</h1>
        <p className="text-sm text-[#9ca3af]">Servis endpoint yanıt süreleri ve erişilebilirlik geçmişi</p>
      </div>

      {services.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-md mx-auto mt-12">
          <p className="text-sm text-[#e5e7eb] font-semibold mb-1">İzlenecek Servis Bulunamadı</p>
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            Uptime takibi yapabilmek için Servisler sayfasından yeni bir servis ekleyebilir veya sunucunuzdaki Docker container'larını başlatabilirsiniz.
          </p>
        </div>
      ) : (
        <>
          {/* Service Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 border transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedServiceId === s.id
                    ? 'bg-[#1a1d29] border-[#d4d4d8] text-[#e5e7eb]'
                    : 'bg-[#1a1d29]/40 border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.status === 'healthy' ? 'bg-[#22c55e]' : s.status === 'down' ? 'bg-[#ef4444]' : 'bg-[#6b7280]'}`} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          {selectedService && (
            <div className="space-y-6">
              {/* Stats Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
                  <span className="text-xs text-[#9ca3af]">Durum</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedService.status} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
                  <span className="text-xs text-[#9ca3af]">Son 7 Günlük Uptime</span>
                  <div className="text-xl font-bold text-[#e5e7eb] mt-1">
                    %{uptimePercent}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f]">
                  <span className="text-xs text-[#9ca3af]">Ort. Yanıt Süresi</span>
                  <div className="text-xl font-bold text-[#e5e7eb] mt-1">
                    {avgLatency > 0 ? `${avgLatency} ms` : '—'}
                  </div>
                </div>
              </div>

              {/* Endpoint Information */}
              <div className="p-4 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#9ca3af] block">Kontrol Edilen URL</span>
                  <span className="text-sm font-mono text-[#e5e7eb]">
                    {selectedService.healthCheckUrl || selectedService.url || 'Tanımlı adres yok'}
                  </span>
                </div>
              </div>

              {/* Checks History */}
              <div className="rounded-xl bg-[#1a1d29] border border-[#2a2e3f] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#2a2e3f]">
                  <h3 className="text-sm font-semibold text-[#e5e7eb]">Son Kontroller</h3>
                </div>

                {checks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#9ca3af]">
                    Henüz kayıtlı uptime kontrolü bulunmuyor.
                  </div>
                ) : (
                  <div className="divide-y divide-[#2a2e3f]">
                    {checks.slice(0, 15).map((check) => (
                      <div key={check.id} className="px-5 py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {check.status === 'up' ? (
                            <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#ef4444]" />
                          )}
                          <span className="text-[#e5e7eb] font-mono">
                            {new Date(check.checkedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {check.responseTimeMs !== undefined && (
                            <span className="text-[#9ca3af] font-mono">
                              {check.responseTimeMs} ms
                            </span>
                          )}
                          {check.errorMessage && (
                            <span className="text-[#ef4444] truncate max-w-xs">
                              {check.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
