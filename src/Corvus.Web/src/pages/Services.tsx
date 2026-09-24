import React, { useEffect, useState } from 'react';
import { api, type Service } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { useI18n } from '../i18n';
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Server, 
  RefreshCw, 
  Trash2, 
  X,
  Layers,
  ShieldCheck,
  Globe,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { t } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reordering, setReordering] = useState(false);
  
  // Add form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formHealth, setFormHealth] = useState('');
  const [formCheckType, setFormCheckType] = useState<'http' | 'tcp'>('http');
  const [formPort, setFormPort] = useState<number | ''>('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    try {
      await api.createService({
        name: formName.trim(),
        url: formUrl.trim() || undefined,
        category: formCategory.trim() || t('services.defaultCategory'),
        description: formDesc.trim() || undefined,
        healthCheckUrl: formHealth.trim() || undefined,
        checkType: formCheckType,
        port: formPort !== '' ? Number(formPort) : undefined,
        isPublic: formIsPublic
      });
      setShowAddModal(false);
      setFormName('');
      setFormUrl('');
      setFormCategory('');
      setFormDesc('');
      setFormHealth('');
      setFormCheckType('http');
      setFormPort('');
      setFormIsPublic(true);
      await loadServices();
    } catch (err: unknown) {
      alert(`${t('common.error')}: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('services.deleteConfirm', { name }))) return;
    try {
      await api.deleteService(id);
      await loadServices();
    } catch (err: unknown) {
      alert(`${t('common.error')}: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  // Roadmap 2.4: Servis Sıralama Eylemleri (Yukarı / Aşağı Taşıma)
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

  const categories = Array.from(new Set(filtered.map((s) => s.category || 'Diğer')));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('services.title')}</h1>
          <p className="text-sm text-[#9ca3af]">{t('services.subtitle')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('services.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1a1d29] border border-[#2a2e3f] rounded-lg pl-9 pr-4 py-1.5 text-sm text-[#e5e7eb] placeholder-[#9ca3af] focus:outline-none focus:border-[#d4d4d8] w-full"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('services.addService')}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && services.length === 0 && (
        <div className="flex items-center justify-center h-64 text-[#9ca3af]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          {t('common.loading')}
        </div>
      )}

      {/* Empty state */}
      {!loading && services.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#1a1d29] border border-[#2a2e3f] text-center max-w-lg mx-auto space-y-4">
          <Layers className="w-12 h-12 text-[#9ca3af]/40 mx-auto" />
          <h3 className="text-base font-semibold text-[#e5e7eb]">{t('services.noServicesFound')}</h3>
          <p className="text-xs text-[#9ca3af]">
            {t('services.noServicesDesc')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('services.addFirstService')}
          </button>
        </div>
      )}

      {/* Category Groups */}
      {categories.map((cat) => {
        const catServices = filtered.filter((s) => (s.category || t('services.otherCategory')) === cat);
        if (catServices.length === 0) return null;

        return (
          <div key={cat} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] px-1 font-mono">
              {cat} ({catServices.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {catServices.map((service) => {
                const globalIndex = services.findIndex(s => s.id === service.id);

                return (
                  <div
                    key={service.id}
                    className="p-5 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] hover:border-[#3f4458] hover:bg-[#1e2130] transition-all flex flex-col justify-between group"
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
                              {service.isPublic && (
                                <span title={t('services.publicBadge')}>
                                  <Globe className="w-3 h-3 text-cyan-400 inline" />
                                </span>
                              )}
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
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-mono ${
                              service.sslExpiryDays <= 7
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : service.sslExpiryDays <= 14
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {t('services.sslRemaining', { days: service.sslExpiryDays })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2e3f]/60">
                      {/* Sıralama butonları (Roadmap 2.4) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(globalIndex, 'up')}
                          disabled={globalIndex === 0 || reordering}
                          className="p-1 rounded bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-30 cursor-pointer"
                          title={t('services.moveUp')}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMove(globalIndex, 'down')}
                          disabled={globalIndex === services.length - 1 || reordering}
                          className="p-1 rounded bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-30 cursor-pointer"
                          title={t('services.moveDown')}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {service.source === 'manual' && (
                          <button
                            onClick={() => handleDelete(service.id, service.name)}
                            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#ef4444] hover:bg-[#0f1117] transition-colors cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {service.url && (
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-xs font-medium text-[#e5e7eb] hover:bg-[#d4d4d8] hover:text-[#0f1117] transition-colors"
                          >
                            <span>Aç</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-[#1a1d29] border border-[#2a2e3f] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-[#2a2e3f] pb-3">
              <h3 className="font-semibold text-[#e5e7eb] text-base">{t('services.modalTitle')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#9ca3af] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('services.formName')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('services.formNamePlaceholder')}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('services.formCheckType')}</label>
                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      name="checkType"
                      value="http"
                      checked={formCheckType === 'http'}
                      onChange={() => setFormCheckType('http')}
                      className="accent-indigo-500"
                    />
                    <span>{t('services.checkTypeHttp')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="radio"
                      name="checkType"
                      value="tcp"
                      checked={formCheckType === 'tcp'}
                      onChange={() => setFormCheckType('tcp')}
                      className="accent-indigo-500"
                    />
                    <span>{t('services.checkTypeTcp')}</span>
                  </label>
                </div>
              </div>

              {formCheckType === 'tcp' && (
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('services.formPort')}</label>
                  <input
                    type="number"
                    required
                    placeholder={t('services.formPortPlaceholder')}
                    value={formPort}
                    onChange={(e) => setFormPort(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">
                  {formCheckType === 'http' ? t('services.formUrl') : t('services.formHost')}
                </label>
                <input
                  type="text"
                  placeholder={formCheckType === 'http' ? t('services.formUrlPlaceholder') : t('services.formHostPlaceholder')}
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('services.formCategory')}</label>
                <input
                  type="text"
                  placeholder={t('services.formCategoryPlaceholder')}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('services.formDescription')}</label>
                <input
                  type="text"
                  placeholder={t('services.formDescriptionPlaceholder')}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              {formCheckType === 'http' && (
                <div>
                  <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('services.formHealthUrl')}</label>
                  <input
                    type="url"
                    placeholder={t('services.formHealthUrlPlaceholder')}
                    value={formHealth}
                    onChange={(e) => setFormHealth(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>{t('services.formIsPublic')}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2a2e3f]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#2a2e3f] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold hover:bg-[#e4e4e7] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
