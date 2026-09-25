import React from 'react';
import { Server, Plus } from 'lucide-react';
import { useI18n } from '../../i18n';

interface ServicesEmptyStateProps {
  onAddClick: () => void;
}

export const ServicesEmptyState: React.FC<ServicesEmptyStateProps> = ({ onAddClick }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-[#2a2e3f] rounded-2xl p-6 bg-[#1a1d29]/40">
      <Server className="w-12 h-12 text-[#9ca3af]/40 mb-3" />
      <h3 className="text-base font-semibold text-[#e5e7eb] mb-1">{t('services.noServicesFound')}</h3>
      <p className="text-xs text-[#9ca3af] max-w-sm mb-4">
        {t('services.noServicesDesc')}
      </p>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2 bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold rounded-xl hover:bg-[#e4e4e7] transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{t('services.addService')}</span>
      </button>
    </div>
  );
};
