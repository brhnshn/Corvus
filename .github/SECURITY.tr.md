<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](SECURITY.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](SECURITY.tr.md)

</div>

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
2. **Konteyner Yaşam Döngüsü Kontrolleri:**
   - Container Başlatma, Durdurma ve Yeniden Başlatma aksiyonları Docker socket üzerinde okuma-yazma yetkisi gerektirir. Eğer bu özelliği kullanmak istemiyorsanız socket'i her zaman `:ro` bayrağı ile bağlayınız.
3. **Kimlik Doğrulama (Authentication):**
   - Panel dış ağa açıkken kimlik doğrulama her zaman etkin tutulmalıdır (`CORVUS_AUTH_ENABLED=true`).
   - İlk kurulum sonrası yeni kullanıcı kayıtlarının Ayarlar sayfasından kapatılması önerilir.

---

## 🚨 Güvenlik Açığı Bildirimi

Bir güvenlik açığı keşfederseniz, lütfen bunu **herkese açık bir GitHub Issue olarak bildirmeyiniz**.

Bunun yerine:
1. GitHub deposundaki **Security Advisories** sekmesini kullanarak özel bir rapor oluşturun, VEYA
2. Proje yöneticisine özel mesaj ile bildirin.

Bildirilen güvenlik açıkları en geç 48 saat içinde incelenecektir.
