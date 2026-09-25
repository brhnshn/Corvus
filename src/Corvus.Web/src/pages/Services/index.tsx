import React, { useEffect, useState } from 'react';
import { api, type Service } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { useI18n } from '../../i18n';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Server, 
  RefreshCw, 
  Trash2,
  ShieldCheck,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { formatServiceUrl } from '../../utils/url';
import { AddServiceModal } from './AddServiceModal';
import { GroupSection } from '../../components/GroupSection';
import { useEntityGrouping } from '../../utils/grouping';

export { formatServiceUrl };

export const ServicesPage: React.FC = () => {
  const { t } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reordering, setReordering] = useState(false);

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      console.error('Servisler yüklenemedi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    const interval = setInterval(() => {
      if (!document.hidden) loadServices();
    }, 10000);

    const onVisible = () => {
      if (!document.hidden) loadServices();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('services.deleteConfirm', { name }))) return;
    try {
      await api.deleteService(id);
      await loadServices();
    } catch (err: unknown) {
      alert(`${t('common.error')}: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  // Servis Sıralama Eylemleri (Yukarı / Aşağı Taşıma)
  const handleMove = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const newServices = [...services];
    const temp = newServices[currentIndex];
    newServices[currentIndex] = newServices[targetIndex];
    newServices[targetIndex] = temp;

    setServices(newServices);
    setReordering(true);

    try {
      const ids = newServices.map(s => s.id);
      await api.reorderServices(ids);
    } catch (err) {
      console.error('Sıralama güncellenemedi:', err);
      await loadServices();
    } finally {
      setReordering(false);
    }
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  // Ortak Gruplandırma & Manuel Düzenleme Motoru
  const {
    groups,
    collapsed,
    toggleCollapse,
    renameGroup,
    draggingId,
    dragOverGroup,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useEntityGrouping<Service>({
    items: filtered,
    getId: (s) => s.id,
    getName: (s) => s.name,
    getCategory: (s) => s.category || t('groups.general'),
    storageKey: 'corvus_services',
    onUpdateCategory: async (id, newCat) => {
      setServices(prev => prev.map(s => s.id === id ? { ...s, category: newCat } : s));
      try {
        await api.updateService(id, { category: newCat });
      } catch (err) {
        console.error('Kategori güncellenemedi:', err);
        await loadServices();
      }
    },
    onBatchUpdateCategory: async (ids, newCat) => {
      setServices(prev => prev.map(s => ids.includes(s.id) ? { ...s, category: newCat } : s));
      try {
        await Promise.allSettled(ids.map(id => api.updateService(id, { category: newCat })));
      } catch (err) {
        console.error('Kategoriler güncellenemedi:', err);
        await loadServices();
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('services.title')}</h1>
          <p className="text-sm text-[#9ca3af]">{t('services.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Arama Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder={t('services.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1a1d29] border border-[#2a2e3f] rounded-xl text-sm text-[#e5e7eb] placeholder-[#9ca3af] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#d4d4d8] hover:bg-[#e4e4e7] text-[#0f1117] text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('services.addService')}</span>
          </button>

          <button
            onClick={loadServices}
            className="p-2 rounded-xl border border-[#2a2e3f] bg-[#1a1d29] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && services.length === 0 && (
        <div className="flex items-center justify-center h-64 text-[#9ca3af]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
          {t('common.loading')}
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-[#2a2e3f] rounded-2xl p-6 bg-[#1a1d29]/40">
          <Server className="w-12 h-12 text-[#9ca3af]/40 mb-3" />
          <h3 className="text-base font-semibold text-[#e5e7eb] mb-1">{t('services.noServicesFound')}</h3>
          <p className="text-xs text-[#9ca3af] max-w-sm mb-4">
            {t('services.noServicesDesc')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold rounded-xl hover:bg-[#e4e4e7] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('services.addService')}</span>
          </button>
        </div>
      )}

      {/* Category Groups using shared GroupSection */}
      {groups.map((group) => {
        if (group.items.length === 0) return null;

        return (
          <GroupSection
            key={group.name}
            title={group.name}
            count={group.items.length}
            isCollapsed={!!collapsed[group.name]}
            onToggleCollapse={() => toggleCollapse(group.name)}
            onRenameGroup={(newName) => renameGroup(group.name, newName)}
            isDragOver={dragOverGroup === group.name}
            onDragOver={(e) => handleDragOver(e, group.name)}
            onDragLeave={() => handleDragLeave(group.name)}
            onDrop={(e) => handleDrop(e, group.name)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.items.map((service) => {
                const globalIndex = services.findIndex(s => s.id === service.id);
                const isDragging = draggingId === service.id;

                return (
                  <div
                    key={service.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, service.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] hover:border-[#3f4458] hover:bg-[#1e2130] transition-all flex flex-col justify-between group cursor-grab active:cursor-grabbing ${
                      isDragging ? 'opacity-30 scale-95 border-indigo-500/50 shadow-inner' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#0f1117] border border-[#2a2e3f] flex items-center justify-center text-[#d4d4d8] shrink-0 font-bold text-xs">
                            {service.icon ? (
                              <span className="text-sm">{service.icon}</span>
                            ) : (
                              <Server className="w-4 h-4 text-[#9ca3af]" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-[#e5e7eb] group-hover:text-white flex items-center gap-1.5">
                              {service.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#9ca3af] font-mono uppercase">
                                {service.source}
                              </span>
                              {service.checkType === 'tcp' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono">
                                  TCP {service.port ? `:${service.port}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={service.status} />
                      </div>

                      {service.description && (
                        <p className="text-xs text-[#9ca3af] line-clamp-2 mt-2">
                          {service.description}
                        </p>
                      )}

                      {/* SSL Expiry Rozeti */}
                      {service.sslExpiryDays !== null && service.sslExpiryDays !== undefined && (
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                              service.sslExpiryDays <= 7
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-semibold'
                                : service.sslExpiryDays <= 30
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                            title={`Sertifika Sağlayıcı: ${service.sslIssuer || 'Bilinmiyor'}`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>
                              {t('services.sslRemaining', { days: service.sslExpiryDays })}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#2a2e3f] pt-4 mt-4">
                      {/* Sıralama Butonları (Yukarı / Aşağı) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(globalIndex, 'up')}
                          disabled={globalIndex === 0 || reordering}
                          className="p-1.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a1d29] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(globalIndex, 'down')}
                          disabled={globalIndex === services.length - 1 || reordering}
                          className="p-1.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1a1d29] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {service.url && (
                          <a
                            href={formatServiceUrl(service.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#e5e7eb] font-medium py-1 px-2 rounded-lg bg-[#0f1117] border border-[#2a2e3f] hover:border-[#3b4252] transition-colors"
                          >
                            <span>{t('dashboard.quickLaunch')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-1.5 text-[#9ca3af] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GroupSection>
        );
      })}

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={async () => {
          await loadServices();
          setShowAddModal(false);
        }}
      />
    </div>
  );
};

export default ServicesPage;
