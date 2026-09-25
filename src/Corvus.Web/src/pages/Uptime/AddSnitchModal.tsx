import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api/client';
import { useI18n } from '../../i18n';

interface AddSnitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddSnitchModal: React.FC<AddSnitchModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useI18n();
  const [snitchName, setSnitchName] = useState('');
  const [snitchInterval, setSnitchInterval] = useState(1440);
  const [snitchGrace, setSnitchGrace] = useState(60);
  const [savingSnitch, setSavingSnitch] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snitchName.trim()) return;

    setSavingSnitch(true);
    try {
      await api.createPushMonitor({
        name: snitchName.trim(),
        expectedIntervalMinutes: snitchInterval,
        gracePeriodMinutes: snitchGrace
      });
      setSnitchName('');
      setSnitchInterval(1440);
      setSnitchGrace(60);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      alert(`Hata: ${err instanceof Error ? err.message : 'Snitch oluşturulamadı.'}`);
    } finally {
      setSavingSnitch(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-[#1a1d29] border border-[#2a2e3f] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-[#2a2e3f] pb-3">
          <h3 className="font-semibold text-[#e5e7eb] text-base">{t('uptime.newPushModalTitle')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('uptime.monitorName')}</label>
            <input
              type="text"
              required
              placeholder={t('uptime.monitorNamePlaceholder')}
              value={snitchName}
              onChange={(e) => setSnitchName(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('uptime.expectedInterval')}</label>
            <input
              type="number"
              required
              min={1}
              placeholder="1440"
              value={snitchInterval}
              onChange={(e) => setSnitchInterval(Number(e.target.value))}
              className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />
            <span className="text-[10px] text-[#9ca3af] block mt-1">{t('uptime.intervalHelp')}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1">{t('uptime.gracePeriod')}</label>
            <input
              type="number"
              required
              min={0}
              placeholder="60"
              value={snitchGrace}
              onChange={(e) => setSnitchGrace(Number(e.target.value))}
              className="w-full bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />
            <span className="text-[10px] text-[#9ca3af] block mt-1">{t('uptime.graceHelp')}</span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#2a2e3f]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2a2e3f] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={savingSnitch}
              className="px-4 py-2 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-xs font-semibold hover:bg-[#e4e4e7] disabled:opacity-50 cursor-pointer"
            >
              {savingSnitch ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
