import React from 'react';
import { useI18n, type Language } from '../i18n';
import { Globe } from 'lucide-react';
import { api } from '../api/client';

interface LanguageSwitchProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ variant = 'compact', className = '' }) => {
  const { language, setLanguage } = useI18n();

  const handleToggle = (lang: Language) => {
    if (language !== lang) {
      setLanguage(lang);
      api.updateSettings({ system_language: lang }).catch(() => {});
    }
  };

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-[#0f1117] border border-[#2a2e3f] ${className}`}>
        <button
          type="button"
          onClick={() => handleToggle('en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            language === 'en'
              ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold shadow-sm'
              : 'text-[#9ca3af] hover:text-[#e5e7eb]'
          }`}
        >
          <span>English</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggle('tr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            language === 'tr'
              ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold shadow-sm'
              : 'text-[#9ca3af] hover:text-[#e5e7eb]'
          }`}
        >
          <span>Türkçe</span>
        </button>
      </div>
    );
  }

  // Compact variant for sidebar or headers
  return (
    <div className={`inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#0f1117] border border-[#2a2e3f] text-[11px] font-mono ${className}`}>
      <span className="pl-1.5 pr-0.5 text-[#9ca3af]/60">
        <Globe className="w-3 h-3" />
      </span>
      <button
        type="button"
        onClick={() => handleToggle('en')}
        className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
          language === 'en'
            ? 'bg-[#d4d4d8] text-[#0f1117]'
            : 'text-[#9ca3af] hover:text-[#e5e7eb]'
        }`}
        title="Switch to English"
      >
        EN
      </button>
      <span className="text-[#2a2e3f]">/</span>
      <button
        type="button"
        onClick={() => handleToggle('tr')}
        className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
          language === 'tr'
            ? 'bg-[#d4d4d8] text-[#0f1117]'
            : 'text-[#9ca3af] hover:text-[#e5e7eb]'
        }`}
        title="Türkçe'ye Geç"
      >
        TR
      </button>
    </div>
  );
};
