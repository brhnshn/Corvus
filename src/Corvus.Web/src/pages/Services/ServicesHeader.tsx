import React from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useI18n } from '../../i18n';

interface ServicesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onRefreshClick: () => void;
}

export const ServicesHeader: React.FC<ServicesHeaderProps> = ({
  search,
  onSearchChange,
  onAddClick,
  onRefreshClick
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#e5e7eb]">{t('services.title')}</h1>
        <p className="text-sm text-[#9ca3af]">{t('services.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder={t('services.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1a1d29] border border-[#2a2e3f] rounded-xl text-sm text-[#e5e7eb] placeholder-[#9ca3af] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#d4d4d8] hover:bg-[#e4e4e7] text-[#0f1117] text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t('services.addService')}</span>
        </button>

        <button
          onClick={onRefreshClick}
          className="p-2 rounded-xl border border-[#2a2e3f] bg-[#1a1d29] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors cursor-pointer"
          title={t('common.refresh')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
