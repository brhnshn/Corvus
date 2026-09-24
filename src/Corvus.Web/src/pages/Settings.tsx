import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Save, Check, Key, Database, Shield, Lock, Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingReg, setTogglingReg] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; success: boolean; message: string } | null>(null);

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

  const handleTestNotification = async (channel: string) => {
    setTestingChannel(channel);
    setTestResult(null);
    try {
      const res = await api.testNotification({
        channel,
        webhookUrl: channel === 'discord' ? settings['notification_discord_webhook_url']
                  : channel === 'ntfy' ? settings['notification_ntfy_url']
                  : settings['notification_webhook_url'],
        botToken: settings['notification_telegram_bot_token'],
        chatId: settings['notification_telegram_chat_id']
      });
      setTestResult({ channel, success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ channel, success: false, message: err.message || 'Test başarısız oldu' });
    } finally {
      setTestingChannel(null);
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
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
              <Lock className="w-4 h-4 text-[#d4d4d8]" />
              <h2>Kullanıcı Kayıtları (Registration)</h2>
            </div>
            <button
              type="button"
              disabled={togglingReg}
              onClick={handleToggleRegistration}
              className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
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
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
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
              className="w-full sm:w-48 bg-[#0f1117] border border-[#2a2e3f] rounded-lg px-3 py-2 text-sm text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
            />
            <p className="text-xs text-[#9ca3af] mt-1">
              Bu süreden eski sistem metrikleri ve uptime kontrolleri her 24 saatte bir otomatik temizlenir.
            </p>
          </div>
        </div>

        {/* Notification & Alert Channels */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-6">
          <div className="flex items-center justify-between border-b border-[#2a2e3f] pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
              <Bell className="w-4 h-4 text-[#d4d4d8]" />
              <h2>Bildirim & Alarm Kanalları (Notifications)</h2>
            </div>
            <span className="text-[11px] text-[#9ca3af] font-mono">Uptime Kuma Modeli</span>
          </div>

          <p className="text-xs text-[#9ca3af] leading-relaxed -mt-2">
            Servisleriniz çöktüğünde (Down) veya kurtarıldığında (Recovery) seçtiğiniz kanallara anında zengin bildirimler gönderilir.
          </p>

          {/* Test Sonuç Bildirimi */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              testResult.success 
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' 
                : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>[{testResult.channel.toUpperCase()}] {testResult.message}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* 1. Discord Webhook */}
            <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#e5e7eb]">Discord Webhook</span>
                  <span className="text-[10px] text-[#9ca3af] font-mono">(Embed Mesaj)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings['notification_discord_enabled'] === 'true'}
                    onChange={(e) => setSettings({ ...settings, notification_discord_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                  />
                  <span className="text-xs text-[#9ca3af]">Aktif</span>
                </label>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings['notification_discord_webhook_url'] || ''}
                  onChange={(e) => setSettings({ ...settings, notification_discord_webhook_url: e.target.value })}
                  className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={testingChannel === 'discord' || !settings['notification_discord_webhook_url']}
                  onClick={() => handleTestNotification('discord')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className={`w-3 h-3 ${testingChannel === 'discord' ? 'animate-spin' : ''}`} />
                  <span>{testingChannel === 'discord' ? 'Gönderiliyor...' : 'Discord Test Et'}</span>
                </button>
              </div>
            </div>

            {/* 2. Telegram Bot */}
            <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#e5e7eb]">Telegram Bot</span>
                  <span className="text-[10px] text-[#9ca3af] font-mono">(Markdown Bildirim)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings['notification_telegram_enabled'] === 'true'}
                    onChange={(e) => setSettings({ ...settings, notification_telegram_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                  />
                  <span className="text-xs text-[#9ca3af]">Aktif</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Bot Token (örn. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                  value={settings['notification_telegram_bot_token'] || ''}
                  onChange={(e) => setSettings({ ...settings, notification_telegram_bot_token: e.target.value })}
                  className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
                <input
                  type="text"
                  placeholder="Chat ID (örn. -100123456789 veya 98765432)"
                  value={settings['notification_telegram_chat_id'] || ''}
                  onChange={(e) => setSettings({ ...settings, notification_telegram_chat_id: e.target.value })}
                  className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={testingChannel === 'telegram' || !settings['notification_telegram_bot_token'] || !settings['notification_telegram_chat_id']}
                  onClick={() => handleTestNotification('telegram')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className={`w-3 h-3 ${testingChannel === 'telegram' ? 'animate-spin' : ''}`} />
                  <span>{testingChannel === 'telegram' ? 'Gönderiliyor...' : 'Telegram Test Et'}</span>
                </button>
              </div>
            </div>

            {/* 3. Ntfy / Gotify */}
            <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#e5e7eb]">Ntfy / Gotify Push</span>
                  <span className="text-[10px] text-[#9ca3af] font-mono">(Öncelikli Başlık ve Etiket)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings['notification_ntfy_enabled'] === 'true'}
                    onChange={(e) => setSettings({ ...settings, notification_ntfy_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                  />
                  <span className="text-xs text-[#9ca3af]">Aktif</span>
                </label>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="https://ntfy.sh/my-secret-corvus-topic"
                  value={settings['notification_ntfy_url'] || ''}
                  onChange={(e) => setSettings({ ...settings, notification_ntfy_url: e.target.value })}
                  className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={testingChannel === 'ntfy' || !settings['notification_ntfy_url']}
                  onClick={() => handleTestNotification('ntfy')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className={`w-3 h-3 ${testingChannel === 'ntfy' ? 'animate-spin' : ''}`} />
                  <span>{testingChannel === 'ntfy' ? 'Gönderiliyor...' : 'Ntfy Test Et'}</span>
                </button>
              </div>
            </div>

            {/* 4. Generic Webhook */}
            <div className="p-4 rounded-xl bg-[#0f1117] border border-[#2a2e3f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#e5e7eb]">Generic JSON Webhook</span>
                  <span className="text-[10px] text-[#9ca3af] font-mono">(Özel Entegrasyonlar)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings['notification_webhook_enabled'] === 'true'}
                    onChange={(e) => setSettings({ ...settings, notification_webhook_enabled: e.target.checked ? 'true' : 'false' })}
                    className="w-4 h-4 rounded accent-[#d4d4d8] cursor-pointer"
                  />
                  <span className="text-xs text-[#9ca3af]">Aktif</span>
                </label>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="https://example.com/api/webhook"
                  value={settings['notification_webhook_url'] || ''}
                  onChange={(e) => setSettings({ ...settings, notification_webhook_url: e.target.value })}
                  className="w-full bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#d4d4d8]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={testingChannel === 'webhook' || !settings['notification_webhook_url']}
                  onClick={() => handleTestNotification('webhook')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#1a1d29] text-xs font-medium text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className={`w-3 h-3 ${testingChannel === 'webhook' ? 'animate-spin' : ''}`} />
                  <span>{testingChannel === 'webhook' ? 'Gönderiliyor...' : 'Webhook Test Et'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Push Integration Docs */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
            <Key className="w-4 h-4 text-[#d4d4d8]" />
            <h2>Backup Push Entegrasyonu</h2>
          </div>

          <p className="text-xs text-[#9ca3af]">
            Yedekleme script'lerinizden (örn. restic, borg, backup.sh) Corvus'a durum bildirmek için şu endpoint'e istek atabilirsiniz:
          </p>

          <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2a2e3f] font-mono text-xs text-[#d4d4d8] space-y-1 overflow-x-auto">
            <div className="text-[#9ca3af]"># Başarılı durum bildirimi</div>
            <div>curl -X POST http://&lt;corvus-host&gt;:8090/api/push/backup-token \</div>
            <div className="pl-4">-H "Content-Type: application/json" \</div>
            <div className="pl-4">-d '{`{"status":"success","sizeBytes":1073741824,"message":"Yedek tamamlandı"}`}'</div>
          </div>
        </div>

        {/* Security & Auth Note */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#1a1d29] border border-[#2a2e3f] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e5e7eb]">
            <Shield className="w-4 h-4 text-[#d4d4d8]" />
            <h2>Kimlik Doğrulama Bilgisi</h2>
          </div>
          <p className="text-xs text-[#9ca3af]">
            Kimlik doğrulama ortam değişkeni <code className="text-[#d4d4d8]">CORVUS_AUTH_ENABLED</code> ile tamamen devre dışı bırakılabilir (örn. Tailscale veya harici reverse proxy auth arkasında).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#d4d4d8] text-[#0f1117] text-sm font-semibold hover:bg-[#e4e4e7] transition-colors disabled:opacity-50 cursor-pointer"
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
