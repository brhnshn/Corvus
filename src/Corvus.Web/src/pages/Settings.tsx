import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Save, Check, Key, Database, Shield, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingReg, setTogglingReg] = useState(false);

  const isRegistrationOpen = settings['registration_enabled'] !== 'false';

  useEffect(() => {
    api.getSettings().then((data) => setSettings(data));
  }, []);

  const handleToggleRegistration = async () => {
    setTogglingReg(true);
    const newStatus = !isRegistrationOpen;
    try {
      await api.toggleRegistration(newStatus);
      setSettings(prev => ({
        ...prev,
        registration_enabled: newStatus ? 'true' : 'false'
      }));
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setTogglingReg(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Kaydetme hatası: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#e5e7eb]">Ayarlar</h1>
        <p className="text-sm text-[#9ca3af]">Sistem yapılandırması ve entegrasyon parametreleri</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Registration Setting */}
        <div className="p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
              <Lock className="w-4 h-4 text-[#d4d4d8]" />
              <h2>Kullanıcı Kayıtları (Registration)</h2>
            </div>
            <button
              type="button"
              disabled={togglingReg}
              onClick={handleToggleRegistration}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                isRegistrationOpen
                  ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/25'
                  : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/25'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRegistrationOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
              <span>{isRegistrationOpen ? 'Kayıtlar Açık (Tıkla ve Kapat)' : 'Kayıtlar Kapalı (Tıkla ve Aç)'}</span>
            </button>
          </div>

          <p className="text-xs text-[#9ca3af] leading-relaxed">
            Yeni kullanıcıların panel üzerinden kayıt olup olamayacağını belirler. İlk kurulumdan sonra panelinize yetkisiz kişilerin kayıt olmasını önlemek için bu seçeneği <strong className="text-[#e5e7eb]">kapalı</strong> tutmanız önerilir.
          </p>
        </div>

        {/* Retention Settings */}
        <div className="p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
            <Database className="w-4 h-4 text-[#d4d4d8]" />
            <h2>Veri Saklama (Retention)</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9ca3af] mb-1">
              Metrik ve Uptime Saklama Süresi (Gün)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={settings['retention_days'] || '30'}
              onChange={(e) => setSettings({ ...settings, retention_days: e.target.value })}
              className="w-48 bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-sm text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />
            <p className="text-xs text-[#9ca3af] mt-1">
              Bu süreden eski sistem metrikleri ve uptime kontrolleri her 24 saatte bir otomatik temizlenir.
            </p>
          </div>
        </div>

        {/* Backup Push Integration Docs */}
        <div className="p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
            <Key className="w-4 h-4 text-[#d4d4d8]" />
            <h2>Backup Push Entegrasyonu</h2>
          </div>

          <p className="text-xs text-[#9ca3af]">
            Yedekleme script'lerinizden (örn. restic, borg, backup.sh) Corvus'a durum bildirmek için şu endpoint'e istek atabilirsiniz:
          </p>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2a2e3f] font-mono text-xs text-[#d4d4d8] space-y-1">
            <div className="text-[#9ca3af]"># Başarılı durum bildirimi</div>
            <div>curl -X POST http://&lt;corvus-host&gt;:8090/api/push/backup-token \</div>
            <div className="pl-4">-H "Content-Type: application/json" \</div>
            <div className="pl-4">-d '{`{"status":"success","sizeBytes":1073741824,"message":"Yedek tamamlandı"}`}'</div>
          </div>
        </div>

        {/* Security & Auth Note */}
        <div className="p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
            <Shield className="w-4 h-4 text-[#d4d4d8]" />
            <h2>Kimlik Doğrulama Bilgisi</h2>
          </div>
          <p className="text-xs text-[#9ca3af]">
            Kimlik doğrulama ortam değişkeni <code className="text-[#d4d4d8]">CORVUS_AUTH_ENABLED</code> ile tamamen devre dışı bırakılabilir (örn. Tailscale veya harici reverse proxy auth arkasında).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-[#22c55e]">
              <Check className="w-4 h-4" />
              Ayarlar kaydedildi
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
