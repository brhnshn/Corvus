# Güvenlik Politikası (Security Policy)

Corvus, self-hosted altyapılarda ve homelab ortamlarında güvenilir ve kararlı bir gözlem aracı olmayı amaçlar. Güvenlik açıklarını ciddiye alıyoruz.

## 🛡️ Desteklenen Sürümler

Şu anda aktif olarak güvenlik güncellemeleri alan sürümler:

| Sürüm | Destek Durumu |
|---|---|
| `1.x` (v1) | :white_check_mark: Destekleniyor |
| `< 1.0` | :x: Desteklenmiyor |

---

## 🔒 Docker Socket ve Yetki İzolasyonu

Corvus, host makinedeki container durumlarını izlemek için Docker daemon'ına bağlanır:
1. **Salt Okunur (Read-Only) Socket Bağlantısı:**
   - Standart dağıtımda Docker socket'inin **salt-okunur** olarak bağlanması önerilir (`/var/run/docker.sock:/var/run/docker.sock:ro`).
   - Bu modda Corvus yalnızca container durumlarını okur; host sisteminde veya diğer container'larda değişiklik yapamaz.
2. **Konteyner Yeniden Başlatma (Restart Action):**
   - Container restart özelliği Docker socket üzerinde yazma yetkisi gerektirir. Eğer bu özelliği kullanmak istemiyorsanız socket'i her zaman `:ro` bayrağı ile bağlayınız.
3. **Kimlik Doğrulama (Authentication):**
   - Panel dış ağa açıkken kimlik doğrulama her zaman etkin tutulmalıdır (`CORVUS_AUTH_ENABLED=true`).
   - İlk kurulum sonrası yeni kullanıcı kayıtlarının Ayarlar sayfasından kapatılması önerilir.

---

## 🚨 Güvenlik Açığı Bildirimi

Bir güvenlik açığı keşfettiyseniz, lütfen bunu herkese açık bir GitHub Issue olarak **bildirmeyiniz**.

Güvenlik açıklarını doğrudan GitHub'ın **[Private Vulnerability Reporting](https://github.com/brhnshn/Corvus/security/advisories/new)** özelliği üzerinden veya proje yöneticisine özel mesaj ile iletiniz.

Tüm bildirimler 48 saat içinde incelenecek ve gerekli düzeltmeler öncelikli olarak yayınlanacaktır.
