import React, { useState } from 'react';
import { api } from '../api/client';
import { ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface RegistrationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisabled: () => void;
}

export const RegistrationPromptModal: React.FC<RegistrationPromptModalProps> = ({
  isOpen,
  onClose,
  onDisabled
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDisableRegistration = async () => {
    setLoading(true);
    try {
      await api.toggleRegistration(false);
      onDisabled();
      onClose();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-[#1a1d29] border border-[#2a2e3f] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#9ca3af] hover:text-[#e5e7eb] p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e5e7eb]">Kayıtlar Kapatılsın mı?</h3>
            <p className="text-xs text-[#9ca3af]">Güvenlik Önerisi</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-[#9ca3af] leading-relaxed mb-6">
          Corvus hesabınız başarıyla oluşturuldu. Başkalarının panelinize kayıt olmasını engellemek için <strong className="text-[#e5e7eb]">yeni kullanıcı kayıtlarını kapatmanız önerilir</strong>.
        </p>

        <div className="p-3 bg-[#0f1117] border border-[#2a2e3f] rounded-xl text-xs text-[#9ca3af] mb-6 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
          <span>
            Bu ayarı dilediğiniz zaman sol menüdeki <strong className="text-[#e5e7eb]">Ayarlar</strong> sayfasından tekrar açabilir veya kapatabilirsiniz.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#2a2e3f]/50 rounded-lg transition-colors"
          >
            Açık Bırak
          </button>
          <button
            type="button"
            onClick={handleDisableRegistration}
            disabled={loading}
            className="px-4 py-2 bg-[#d4d4d8] hover:bg-[#e4e4e7] text-[#0f1117] text-xs font-bold rounded-lg transition-colors shadow flex items-center gap-1.5"
          >
            {loading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-[#0f1117] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Kayıtları Kapat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
